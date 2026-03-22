"""Structured extraction payload schemas."""

from pydantic import BaseModel, Field


class ExtractedStructure(BaseModel):
    """Normalized CPA structure payload."""

    name: str
    structure_type: str
    components_json: list[dict[str, object]] = Field(default_factory=list)
    component_roles_json: dict[str, str] = Field(default_factory=dict)
    tissue_tags_json: list[str] = Field(default_factory=list)
    notes: str | None = None


class ExtractedReplacement(BaseModel):
    """Normalized replacement-index payload."""

    entry_type: str
    name: str
    aliases_json: list[str] = Field(default_factory=list)
    class_name: str | None = None
    simple_descriptors_json: dict[str, object] = Field(default_factory=dict)
    notes: str | None = None


class ExtractedFinding(BaseModel):
    """Normalized finding payload."""

    source_type: str
    source_title: str
    citation: str | None = None
    year: int | None = None
    tissue: str | None = None
    modality: str | None = None
    component_names_json: list[str] = Field(default_factory=list)
    candidate_names_json: list[str] = Field(default_factory=list)
    metric_type: str | None = None
    metric_value: float | None = None
    metric_unit: str | None = None
    finding_summary: str
    source_location: str | None = None
    confidence: float | None = None


class NormalizedKnowledgePayload(BaseModel):
    """Typed output of the extraction stage."""

    cpa_structures: list[ExtractedStructure] = Field(default_factory=list)
    replacement_entries: list[ExtractedReplacement] = Field(default_factory=list)
    findings: list[ExtractedFinding] = Field(default_factory=list)

