"""Deterministic TF-IDF matching engine for AgriSoko Pocket G10.

Transparent on purpose: one searchable document per member, word and
character TF-IDF features, cosine similarity and a documented exact
name/alias boost. No generative AI and no invented fields.
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from . import config

REQUIRED_KEYS = [
    "fullName", "registrationNumber", "aliases", "githubUsername", "role",
    "skills", "targetUser", "problem", "contribution", "feature",
    "outcomeMetric", "evidenceLinks", "testerFeedback", "introductionDraft",
]
# Optional fields may be empty but must not remove the member from the index.
NON_EMPTY_KEYS = ["fullName", "role", "feature"]

# Words that make a question natural but carry no identity information.
FILLER = {
    "who", "what", "whom", "which", "tell", "me", "about", "is", "are", "the",
    "a", "an", "built", "build", "made", "did", "does", "do", "show", "of",
    "for", "in", "on", "and", "to", "how", "member", "person", "team", "please",
    "can", "you", "give", "profile", "introduce", "introduction", "i", "want",
    "know", "my", "us", "it", "this", "that", "with", "was", "were", "has",
    "have", "by", "from", "find", "get",
}

# Exact name/alias boost rule (documented in README and /model-info):
# if a member's full name or alias appears as a whole word sequence in the
# question, confidence = min(1.0, cosine + NAME_BOOST).
NAME_BOOST = 0.5

SAFE_DIRECTORY_FIELDS = ["id", "fullName", "aliases", "githubUsername", "role", "feature"]


class DatasetError(ValueError):
    """Raised when members.json is missing, empty or invalid."""


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text))
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9]+", " ", text.lower())
    return re.sub(r"\s+", " ", text).strip()


def tokens(text: str) -> list[str]:
    return normalize(text).split()


def query_tokens(text: str) -> list[str]:
    return [t for t in tokens(text) if t not in FILLER]


def load_members(path: Path | str | None = None) -> list[dict[str, Any]]:
    path = Path(path or config.DATA_PATH)
    if not path.exists():
        raise DatasetError(f"Dataset not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise DatasetError(f"members.json is not valid JSON: {exc}") from exc
    return validate_members(data)


def validate_members(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list) or len(data) == 0:
        raise DatasetError("Dataset is empty: members.json must contain a list of members.")
    errors: list[str] = []
    seen: set[str] = set()
    for i, m in enumerate(data):
        label = m.get("fullName", f"#{i}") if isinstance(m, dict) else f"#{i}"
        if not isinstance(m, dict):
            errors.append(f"member {label}: must be an object")
            continue
        for key in REQUIRED_KEYS:
            if key not in m:
                errors.append(f"member {label}: missing key '{key}'")
        for key in NON_EMPTY_KEYS:
            if key in m and not str(m[key]).strip():
                errors.append(f"member {label}: '{key}' must not be empty")
        mid = str(m.get("id") or f"m{i + 1}")
        if mid in seen:
            errors.append(f"member {label}: duplicate id '{mid}'")
        seen.add(mid)
        m["id"] = mid
    if errors:
        raise DatasetError("Invalid members.json: " + "; ".join(errors))
    return data


def dataset_fingerprint(path: Path | str | None = None) -> str:
    path = Path(path or config.DATA_PATH)
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(v) for v in value]
    return [str(value)]


def _evidence_summary(m: dict[str, Any]) -> str:
    parts = []
    if str(m.get("outcomeMetric", "")).strip():
        parts.append(str(m["outcomeMetric"]))
    for fb in _as_list(m.get("testerFeedback")):
        parts.append(fb)
    return " ".join(parts)


def member_fields(m: dict[str, Any]) -> dict[str, str]:
    """Fields searched, in the order used for the reason text."""
    return {
        "name": str(m.get("fullName", "")),
        "alias": " ".join(_as_list(m.get("aliases"))),
        "role": str(m.get("role", "")),
        "skills": " ".join(_as_list(m.get("skills"))),
        "feature": str(m.get("feature", "")),
        "problem": str(m.get("problem", "")),
        "contribution": str(m.get("contribution", "")),
        "evidence": _evidence_summary(m),
    }


def member_document(m: dict[str, Any]) -> str:
    f = member_fields(m)
    return normalize(" ".join(f.values()))


class MatchingEngine:
    """TF-IDF (word + character) retrieval over one document per member."""

    def __init__(
        self,
        members: list[dict[str, Any]],
        threshold: float | None = None,
        fingerprint: str | None = None,
    ):
        self.members = validate_members(members)
        self.threshold = config.CONFIDENCE_THRESHOLD if threshold is None else threshold
        self.fingerprint = fingerprint or hashlib.sha256(
            json.dumps(self.members, sort_keys=True).encode()
        ).hexdigest()
        self.frame = pd.DataFrame(
            {
                "id": [m["id"] for m in self.members],
                "document": [member_document(m) for m in self.members],
            }
        )
        self.field_tokens = [
            {k: set(tokens(v)) for k, v in member_fields(m).items()} for m in self.members
        ]
        self.word_vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
        self.char_vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)
        docs = self.frame["document"].tolist()
        self.word_matrix = self.word_vec.fit_transform(docs)
        self.char_matrix = self.char_vec.fit_transform(docs)
        self.names = [
            [normalize(m.get("fullName", ""))] + [normalize(a) for a in _as_list(m.get("aliases"))]
            for m in self.members
        ]

    @classmethod
    def from_file(cls, path: Path | str | None = None, threshold: float | None = None):
        path = Path(path or config.DATA_PATH)
        return cls(load_members(path), threshold, dataset_fingerprint(path))

    # ------------------------------------------------------------------ scoring
    def _scores(self, cleaned: str) -> list[float]:
        w = cosine_similarity(self.word_vec.transform([cleaned]), self.word_matrix)[0]
        c = cosine_similarity(self.char_vec.transform([cleaned]), self.char_matrix)[0]
        return [float(0.5 * a + 0.5 * b) for a, b in zip(w, c)]

    def _name_hit(self, idx: int, normalized_question: str) -> str | None:
        padded = f" {normalized_question} "
        for name in self.names[idx]:
            if name and f" {name} " in padded:
                return name
        return None

    def rank(self, question: str) -> list[dict[str, Any]]:
        q_norm = normalize(question)
        q_tokens = query_tokens(question)
        cleaned = " ".join(q_tokens)
        if not q_tokens:
            return []
        cosines = self._scores(cleaned)
        ranked = []
        for i, base in enumerate(cosines):
            hit = self._name_hit(i, q_norm)
            conf = min(1.0, base + NAME_BOOST) if hit else base
            matched_fields: dict[str, list[str]] = {}
            for field, toks in self.field_tokens[i].items():
                common = [t for t in dict.fromkeys(q_tokens) if t in toks]
                if common:
                    matched_fields[field] = common
            ranked.append(
                {
                    "index": i,
                    "id": self.members[i]["id"],
                    "cosine": round(base, 4),
                    "confidence": round(conf, 4),
                    "name_hit": hit,
                    "matched_fields": matched_fields,
                }
            )
        ranked.sort(key=lambda r: (-r["confidence"], r["index"]))
        return ranked

    # ------------------------------------------------------------------ answer
    def ask(self, question: str) -> dict[str, Any]:
        ranked = self.rank(question)
        suggestions = self.suggestions()
        base = {
            "query": question,
            "modelVersion": config.MODEL_VERSION,
            "groupCode": config.GROUP_CODE,
            "threshold": self.threshold,
        }
        if not ranked:
            return {
                **base, "matched": False, "match": None, "confidence": 0.0,
                "matchedTerms": [], "reason": "The question is too vague: it contains no name, role, skill or feature.",
                "introduction": None, "evidenceLinks": [], "alternatives": [],
                "message": "No confident match was found. Try a member name, role or feature.",
                "suggestions": suggestions,
            }
        top = ranked[0]
        member = self.members[top["index"]]
        alternatives = [
            {"id": r["id"], "fullName": self.members[r["index"]]["fullName"], "confidence": r["confidence"]}
            for r in ranked[1:3]
        ]
        if top["confidence"] < self.threshold:
            return {
                **base, "matched": False, "match": None, "confidence": top["confidence"],
                "matchedTerms": [], "reason": f"Best score {top['confidence']:.2f} is below the confidence threshold {self.threshold:.2f}.",
                "introduction": None, "evidenceLinks": [], "alternatives": alternatives,
                "message": "No confident match was found. Try a member name, role or feature.",
                "suggestions": suggestions,
            }
        terms = sorted({t for toks in top["matched_fields"].values() for t in toks})
        return {
            **base,
            "matched": True,
            "match": {k: member.get(k) for k in SAFE_DIRECTORY_FIELDS if k in member},
            "confidence": top["confidence"],
            "matchedTerms": terms,
            "reason": self._reason(top),
            "introduction": self.introduction(member),
            "evidenceLinks": member.get("evidenceLinks", []),
            "alternatives": alternatives,
            "message": None,
            "suggestions": [],
        }

    def _reason(self, top: dict[str, Any]) -> str:
        parts = []
        if top["name_hit"]:
            parts.append(f"exact name or alias '{top['name_hit']}' found in the question (boost +{NAME_BOOST})")
        for field, toks in top["matched_fields"].items():
            if field in ("name", "alias") and top["name_hit"]:
                continue
            parts.append(f"{', '.join(toks)} found in {field}")
        if not parts:
            parts.append("closest character and word similarity to this member's profile")
        return f"TF-IDF similarity {top['cosine']:.2f}; " + "; ".join(parts) + "."

    @staticmethod
    def introduction(member: dict[str, Any]) -> str:
        """Re-use only approved fields. Never invent a metric or statement."""
        intro = str(member.get("introductionDraft", "")).strip()
        if not intro:
            intro = (
                f"My name is {member.get('fullName')}. I am the {member.get('role')} of {config.APP_NAME}. "
                f"{member.get('contribution', '')}"
            ).strip()
        metric = str(member.get("outcomeMetric", "")).strip()
        if metric:
            if metric.lower() not in intro.lower():
                intro += f" Verified outcome: {metric}"
        else:
            intro += " No verified outcome metric has been recorded yet."
        return intro

    def suggestions(self) -> list[str]:
        out = []
        for m in self.members:
            out.append(f"{m['fullName']} ({m['role']})")
        return out[:6]

    def directory(self) -> list[dict[str, Any]]:
        return [{k: m.get(k) for k in SAFE_DIRECTORY_FIELDS if k in m} for m in self.members]

    def get_member(self, member_id: str) -> dict[str, Any] | None:
        for m in self.members:
            if m["id"] == member_id:
                return m
        return None
