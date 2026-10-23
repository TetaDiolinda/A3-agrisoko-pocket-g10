"""Pydantic models describing the public API contract."""
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from . import config


class AskRequest(BaseModel):
    question: str = Field(..., description="Natural-language question about a team member")

    @field_validator("question")
    @classmethod
    def clean(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("question must not be empty")
        if len(v) > config.MAX_QUESTION_LENGTH:
            raise ValueError(f"question must be at most {config.MAX_QUESTION_LENGTH} characters")
        return v


class EvidenceLink(BaseModel):
    label: str
    url: str


class MatchCard(BaseModel):
    id: str
    fullName: str
    aliases: list[str] = []
    githubUsername: Optional[str] = None
    role: str
    feature: Optional[str] = None


class Alternative(BaseModel):
    id: str
    fullName: str
    confidence: float


class AskResponse(BaseModel):
    query: str
    matched: bool
    match: Optional[MatchCard] = None
    confidence: float
    threshold: float
    matchedTerms: list[str]
    reason: str
    introduction: Optional[str] = None
    evidenceLinks: list[EvidenceLink]
    alternatives: list[Alternative] = []
    message: Optional[str] = None
    suggestions: list[str] = []
    modelVersion: str
    groupCode: str


class HealthResponse(BaseModel):
    status: str
    version: str
    groupCode: str
    members: int


class ModelInfo(BaseModel):
    modelVersion: str
    groupCode: str
    vectorizer: str
    similarity: str
    threshold: float
    nameBoostRule: str
    datasetFingerprint: str
    memberCount: int
    buildCommit: str
    builtAt: Optional[str] = None
    limitations: list[str]
    evaluation: Optional[dict[str, Any]] = None
