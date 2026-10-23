import copy
import json

import pytest
from fastapi.testclient import TestClient

from app import config, engine as eng
from app.engine import DatasetError, MatchingEngine, load_members, validate_members
from app.main import app

client = TestClient(app)
MEMBERS = load_members()
ENGINE = MatchingEngine(MEMBERS)


# ------------------------------------------------------------ engine behaviour
def test_exact_name_query_returns_that_member():
    for m in MEMBERS:
        r = ENGINE.ask(f"Tell me about {m['fullName']}")
        assert r["matched"] and r["match"]["id"] == m["id"]
        assert r["confidence"] >= config.CONFIDENCE_THRESHOLD


def test_alias_query_returns_that_member():
    for m in MEMBERS:
        alias = m["aliases"][0]
        r = ENGINE.ask(f"Who is {alias}?")
        assert r["matched"] and r["match"]["id"] == m["id"]
        assert "alias" in r["reason"] or "name" in r["reason"]


def test_role_and_feature_queries():
    for m in MEMBERS:
        r = ENGINE.ask(f"Who built {m['feature']}?")
        assert r["matched"] and r["match"]["id"] == m["id"]
        r = ENGINE.ask(f"Who is the {m['role'].split(';')[0]}?")
        assert not r["matched"] or r["match"]["id"] == m["id"]  # never a wrong member


def test_offline_feature_example_from_assignment():
    r = ENGINE.ask("Who built offline mode?")
    assert r["matched"] and r["match"]["id"] == "m5"


@pytest.mark.parametrize("q", [
    "What is the weather today?", "How do I cook rice?", "Tell me a joke",
    "asdf qwerty zxcv", "Who is the president of France?", "who",
])
def test_no_match_queries(q):
    r = ENGINE.ask(q)
    assert r["matched"] is False
    assert r["match"] is None and r["introduction"] is None
    assert r["suggestions"]
    assert "No confident match" in r["message"]


def test_introduction_never_invents_metric():
    for m in MEMBERS:
        if not str(m["outcomeMetric"]).strip():
            intro = ENGINE.introduction(m)
            assert "No verified outcome metric" in intro


def test_response_contains_only_stored_links():
    m = MEMBERS[1]
    r = ENGINE.ask(f"Tell me about {m['fullName']}")
    assert r["evidenceLinks"] == m["evidenceLinks"]


def test_empty_dataset_raises():
    with pytest.raises(DatasetError):
        validate_members([])
    with pytest.raises(DatasetError):
        MatchingEngine([])


def test_member_with_empty_optional_fields_is_kept():
    data = copy.deepcopy(MEMBERS)
    data[0]["outcomeMetric"] = ""
    data[0]["testerFeedback"] = []
    data[0]["evidenceLinks"] = []
    e = MatchingEngine(data)
    assert len(e.members) == len(MEMBERS)


def test_missing_required_key_rejected():
    data = copy.deepcopy(MEMBERS)
    del data[0]["githubUsername"]
    with pytest.raises(DatasetError):
        validate_members(data)


# ------------------------------------------------------------------ API schema
def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok" and body["groupCode"] == "G10" and body["version"]


def test_members_directory_is_safe():
    r = client.get("/members")
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == len(MEMBERS)
    for row in rows:
        assert "registrationNumber" not in row and "introductionDraft" not in row
        assert {"id", "fullName", "role"} <= set(row)


def test_member_by_id_and_404():
    r = client.get("/members/m1")
    assert r.status_code == 200
    assert set(eng.REQUIRED_KEYS) <= set(r.json())
    r = client.get("/members/nope")
    assert r.status_code == 404
    assert "detail" in r.json()


def test_ask_schema_match():
    r = client.post("/ask", json={"question": f"Tell me about {MEMBERS[0]['fullName']}"})
    assert r.status_code == 200
    b = r.json()
    for key in ["query", "matched", "match", "confidence", "reason", "introduction",
                "evidenceLinks", "modelVersion", "groupCode", "matchedTerms", "threshold"]:
        assert key in b
    assert b["matched"] is True and b["groupCode"] == "G10"
    assert isinstance(b["confidence"], float) and 0 <= b["confidence"] <= 1


def test_ask_schema_no_match():
    r = client.post("/ask", json={"question": "How do I cook rice?"})
    assert r.status_code == 200
    b = r.json()
    assert b["matched"] is False and b["match"] is None and b["suggestions"]


def test_ask_missing_question_is_422():
    assert client.post("/ask", json={}).status_code == 422
    assert client.post("/ask").status_code == 422


def test_ask_empty_and_too_long_question_is_422():
    assert client.post("/ask", json={"question": "   "}).status_code == 422
    assert client.post("/ask", json={"question": "a" * 500}).status_code == 422


def test_model_info():
    r = client.get("/model-info")
    assert r.status_code == 200
    b = r.json()
    assert len(b["datasetFingerprint"]) == 64
    assert b["threshold"] == config.CONFIDENCE_THRESHOLD
    assert "TF-IDF" in b["vectorizer"] and b["limitations"] and "buildCommit" in b


def test_fingerprint_matches_file():
    from app.engine import dataset_fingerprint
    assert client.get("/model-info").json()["datasetFingerprint"] == dataset_fingerprint()


def test_dataset_unavailable_returns_503(monkeypatch, tmp_path):
    import app.main as main
    bad = tmp_path / "members.json"
    bad.write_text("[]")
    monkeypatch.setattr(config, "DATA_PATH", bad)
    monkeypatch.setattr(main, "_engine", None)
    r = TestClient(main.app).get("/health")
    assert r.status_code == 503
    monkeypatch.setattr(main, "_engine", None)
