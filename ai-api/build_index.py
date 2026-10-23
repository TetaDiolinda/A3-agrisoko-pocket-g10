"""Validate members.json, build the index, and write fingerprint + model metadata.

Usage:  python build_index.py
"""
import json
import subprocess
import sys
from datetime import datetime, timezone

from app import config
from app.engine import DatasetError, MatchingEngine, dataset_fingerprint, load_members


def git_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=config.BASE_DIR, stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        return "unknown"


def main() -> int:
    try:
        members = load_members(config.DATA_PATH)
    except DatasetError as exc:
        print(f"VALIDATION FAILED: {exc}")
        return 1
    engine = MatchingEngine(members, fingerprint=dataset_fingerprint(config.DATA_PATH))
    old = {}
    if config.METADATA_PATH.exists():
        try:
            old = json.loads(config.METADATA_PATH.read_text())
        except json.JSONDecodeError:
            old = {}
    meta = {
        "modelVersion": config.MODEL_VERSION,
        "groupCode": config.GROUP_CODE,
        "datasetFingerprint": engine.fingerprint,
        "memberCount": len(members),
        "threshold": engine.threshold,
        "vocabularyWords": len(engine.word_vec.vocabulary_),
        "vocabularyChars": len(engine.char_vec.vocabulary_),
        "buildCommit": git_commit(),
        "builtAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "evaluation": old.get("evaluation"),
    }
    config.METADATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    config.METADATA_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"OK: {len(members)} members validated")
    print(f"SHA-256 fingerprint: {engine.fingerprint}")
    print(f"Metadata written to {config.METADATA_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
