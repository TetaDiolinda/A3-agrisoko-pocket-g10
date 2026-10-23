"""Central configuration for the AgriSoko Pocket G10 AI service."""
import os
from pathlib import Path

GROUP_CODE = "G10"
APP_NAME = "AgriSoko Pocket G10"
MODEL_VERSION = "agrisoko-tfidf-1.0.0"
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = Path(os.getenv("MEMBERS_PATH", BASE_DIR / "data" / "members.json"))
METADATA_PATH = BASE_DIR / "model" / "metadata.json"

# Documented threshold. The assignment starts at 0.45. We ran evaluate.py's
# sweep on 25 match queries + 10 no-match queries: at 0.45 every no-match query
# was rejected but 9 of 25 valid queries were wrongly rejected (64% top-1).
# The highest no-match score recorded was 0.21 ("football match" matches the
# word "match"); the lowest threshold that still rejects all 10 no-match
# queries is 0.25, which gives 88% top-1. No wrong member was ever returned
# at any threshold; every error was a safe rejection. Re-run evaluate.py
# after you replace the sample data and adjust if needed.
# Override with the CONFIDENCE_THRESHOLD env var.
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
MAX_QUESTION_LENGTH = 200
