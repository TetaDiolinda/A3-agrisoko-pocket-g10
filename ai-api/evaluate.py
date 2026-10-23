"""Evaluate the matching engine on representative and no-match queries.

Queries are generated from members.json (so they stay correct after you put
in the real names) and can be extended in data/eval_queries.json:
  {"match": [{"q": "...", "id": "m2"}], "nomatch": ["..."]}

Usage: python evaluate.py [--threshold 0.45] [--write]
"""
import argparse
import json
from pathlib import Path

from app import config
from app.engine import MatchingEngine, load_members, dataset_fingerprint

NO_MATCH = [
    "What is the weather in Kigali today?",
    "How do I cook rice?",
    "Who won the football match yesterday?",
    "Tell me a joke",
    "What is the price of potatoes?",
    "asdf qwerty zxcv",
    "Who is the president of France?",
    "Explain quantum physics",
    "who",
    "Tell me about the team",
]


def build_queries(members):
    qs = []
    for m in members:
        first_alias = (m.get("aliases") or [m["fullName"]])[0]
        qs.append({"q": f"Tell me about {m['fullName']}", "id": m["id"], "kind": "name"})
        qs.append({"q": f"Who is {first_alias}?", "id": m["id"], "kind": "alias"})
        qs.append({"q": f"Who is the {m['role'].split(';')[0]}?", "id": m["id"], "kind": "role"})
        skill = (m.get("skills") or [m["role"]])[0]
        qs.append({"q": f"Who knows {skill}?", "id": m["id"], "kind": "skill"})
        qs.append({"q": f"Who built {m['feature']}?", "id": m["id"], "kind": "feature"})
    extra = Path(config.BASE_DIR / "data" / "eval_queries.json")
    nomatch = list(NO_MATCH)
    if extra.exists():
        d = json.loads(extra.read_text(encoding="utf-8"))
        qs += [{"q": e["q"], "id": e["id"], "kind": "custom"} for e in d.get("match", [])]
        nomatch += d.get("nomatch", [])
    return qs, nomatch


def run(engine, qs, nomatch):
    rows, correct = [], 0
    for e in qs:
        r = engine.ask(e["q"])
        got = r["match"]["id"] if r["matched"] else None
        ok = got == e["id"]
        correct += ok
        rows.append({"query": e["q"], "expected": e["id"], "got": got, "confidence": r["confidence"], "ok": ok, "kind": e["kind"]})
    rejected = 0
    nrows = []
    for q in nomatch:
        r = engine.ask(q)
        ok = not r["matched"]
        rejected += ok
        nrows.append({"query": q, "expected": None, "got": r["match"]["id"] if r["matched"] else None, "confidence": r["confidence"], "ok": ok, "kind": "nomatch"})
    return rows, nrows, correct, rejected


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=config.CONFIDENCE_THRESHOLD)
    ap.add_argument("--write", action="store_true", help="store summary in model/metadata.json")
    a = ap.parse_args()
    members = load_members()
    qs, nomatch = build_queries(members)

    print("Threshold sweep (top-1 accuracy / no-match rejection):")
    for t in [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55]:
        e = MatchingEngine(members, threshold=t)
        _, _, c, rj = run(e, qs, nomatch)
        print(f"  {t:.2f}: {c}/{len(qs)} = {c/len(qs):.1%}   {rj}/{len(nomatch)} = {rj/len(nomatch):.1%}")

    engine = MatchingEngine(members, threshold=a.threshold, fingerprint=dataset_fingerprint())
    rows, nrows, correct, rejected = run(engine, qs, nomatch)
    print(f"\nUsing threshold {a.threshold:.2f}")
    print(f"Top-1 member accuracy : {correct}/{len(qs)} = {correct/len(qs):.1%}")
    print(f"No-match rejection    : {rejected}/{len(nomatch)} = {rejected/len(nomatch):.1%}")

    ids = [m["id"] for m in members] + ["none"]
    print("\nConfusion matrix (rows = expected, columns = predicted):")
    print("        " + " ".join(f"{i:>5}" for i in ids))
    for exp in ids:
        line = []
        for got in ids:
            n = sum(1 for r in rows + nrows if (r["expected"] or "none") == exp and (r["got"] or "none") == got)
            line.append(f"{n:>5}")
        print(f"{exp:>7} " + " ".join(line))

    errors = [r for r in rows + nrows if not r["ok"]]
    print(f"\nError table ({len(errors)} errors):")
    for r in errors:
        print(f"  [{r['kind']}] {r['query']!r}: expected={r['expected']} got={r['got']} conf={r['confidence']}")

    Path(config.BASE_DIR / "model").mkdir(exist_ok=True)
    out = {
        "threshold": a.threshold,
        "matchQueries": len(qs), "top1Correct": correct, "top1Accuracy": round(correct / len(qs), 4),
        "noMatchQueries": len(nomatch), "noMatchRejected": rejected, "noMatchRejectionAccuracy": round(rejected / len(nomatch), 4),
        "errors": errors,
        "queries": rows + nrows,
    }
    (config.BASE_DIR / "model" / "evaluation.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    if a.write and config.METADATA_PATH.exists():
        meta = json.loads(config.METADATA_PATH.read_text())
        meta["evaluation"] = {k: out[k] for k in ["threshold", "matchQueries", "top1Accuracy", "noMatchQueries", "noMatchRejectionAccuracy"]}
        config.METADATA_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
        print("\nSummary written to model/metadata.json")


if __name__ == "__main__":
    main()
