"""Schemas for saved CryoSight hypothesis drafts."""

from pydantic import BaseModel, ConfigDict, Field


class HypothesisCreateRequest(BaseModel):
    """Payload for creating a saved hypothesis draft."""

    model_config = ConfigDict(populate_by_name=True)

    title: str
    status: str = "draft"
    benchmark: str | None = None
    target: str | None = None
    summary: str
    evidence_ids: list[str] = Field(default_factory=list, alias="evidenceIds")
    next_step: str | None = Field(default=None, alias="nextStep")
    source_prompt: str | None = Field(default=None, alias="sourcePrompt")
    agent_profile: str = Field(default="hypothesis", alias="agentProfile")


class HypothesisResponse(BaseModel):
    """Saved hypothesis draft returned to the frontend."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    status: str
    benchmark: str
    target: str
    summary: str
    evidence_ids: list[str] = Field(default_factory=list, alias="evidenceIds")
    next_step: str = Field(alias="nextStep")
