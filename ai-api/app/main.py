"""FastAPI service for AgriSoko Pocket G10."""
import json
import logging
import os
import subprocess

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config
from .engine import NAME_BOOST, DatasetError, MatchingEngine
from .schemas import AskRequest, AskResponse, HealthResponse, ModelInfo

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("agrisoko")

app = FastAPI(title=config.APP_NAME, version=config.MODEL_VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_engine: MatchingEngine | None = None


def get_engine() -> MatchingEngine:
    global _engine
    if _engine is None:
        try:
            _engine = MatchingEngine.from_file(config.DATA_PATH)
        except DatasetError as exc:
            log.error("Dataset error: %s", exc)
            raise HTTPException(status_code=503, detail="Member dataset is unavailable or invalid.")
    return _engine


def _metadata() -> dict:
    try:
        return json.loads(config.METADATA_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _build_commit() -> str:
    meta = _metadata().get("buildCommit")
    if os.getenv("BUILD_COMMIT"):
        return os.environ["BUILD_COMMIT"]
    if meta and meta != "unknown":
        return meta
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=config.BASE_DIR, stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        return "unknown"


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    log.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error. Please try again."})


@app.get("/health", response_model=HealthResponse)
def health():
    eng = get_engine()
    return HealthResponse(status="ok", version=config.MODEL_VERSION, groupCode=config.GROUP_CODE, members=len(eng.members))


@app.get("/members")
def members():
    return get_engine().directory()


@app.get("/members/{member_id}")
def member(member_id: str):
    m = get_engine().get_member(member_id)
    if m is None:
        raise HTTPException(status_code=404, detail=f"No member with id '{member_id}'.")
    return m


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    result = get_engine().ask(req.question)
    log.info("ask q=%r matched=%s conf=%.2f", req.question, result["matched"], result["confidence"])
    return result


@app.get("/model-info", response_model=ModelInfo)
def model_info():
    eng = get_engine()
    meta = _metadata()
    return ModelInfo(
        modelVersion=config.MODEL_VERSION,
        groupCode=config.GROUP_CODE,
        vectorizer="TF-IDF: word 1-2 grams + char_wb 3-5 grams (scikit-learn), cosine similarity, averaged 50/50",
        similarity="cosine",
        threshold=eng.threshold,
        nameBoostRule=f"If a member's full name or alias appears as whole words in the question, confidence = min(1, cosine + {NAME_BOOST}).",
        datasetFingerprint=eng.fingerprint,
        memberCount=len(eng.members),
        buildCommit=_build_commit(),
        builtAt=meta.get("builtAt"),
        limitations=[
            "Only answers from the approved members.json records; it cannot answer other questions.",
            "Lexical matching: synonyms or misspellings far from the stored words may not match.",
            "No outcome metric or testimonial is shown unless it exists in the approved record.",
            "Question length is limited to %d characters." % config.MAX_QUESTION_LENGTH,
        ],
        evaluation=meta.get("evaluation"),
    )
