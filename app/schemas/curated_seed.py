"""Typed schema for the curated bootstrap seed payload."""

from pydantic import BaseModel, Field, model_validator


class CuratedSeedDocument(BaseModel):
    """Paper metadata for a curated source document."""

    seed_key: str
    filename: str
    pdf_path: str
    title: str
    citation: str
    doi: str
    journal: str
    year: int
    authors_json: list[str] = Field(default_factory=list)
    abstract: str
    keywords_json: list[str] = Field(default_factory=list)
    notes: str | None = None


class CuratedSeedStructure(BaseModel):
    """Optional curated structure rows for the MVP table."""

    name: str
    structure_type: str
    components_json: list[dict[str, object]] = Field(default_factory=list)
    component_roles_json: dict[str, str] = Field(default_factory=dict)
    tissue_tags_json: list[str] = Field(default_factory=list)
    notes: str | None = None
    source_seed_key: str | None = None


class CuratedSeedReplacementEntry(BaseModel):
    """Curated candidate molecule or class row."""

    entry_type: str
    name: str
    aliases_json: list[str] = Field(default_factory=list)
    class_name: str | None = None
    simple_descriptors_json: dict[str, object] = Field(default_factory=dict)
    notes: str | None = None
    source_seed_keys: list[str] = Field(default_factory=list)


class CuratedSeedFinding(BaseModel):
    """Curated evidence row with preserved assay context."""

    source_seed_key: str
    source_type: str
    tissue: str | None = None
    modality: str | None = None
    component_names_json: list[str] = Field(default_factory=list)
    candidate_names_json: list[str] = Field(default_factory=list)
    metric_type: str | None = None
    metric_value: float | None = None
    metric_unit: str | None = None
    conditions_json: dict[str, object] = Field(default_factory=dict)
    statistics_json: dict[str, object] = Field(default_factory=dict)
    tags_json: list[str] = Field(default_factory=list)
    finding_summary: str
    source_location: str | None = None
    confidence: float | None = None


class CuratedSeedPayload(BaseModel):
    """Top-level curated bootstrap seed."""

    documents: list[CuratedSeedDocument] = Field(default_factory=list)
    cpa_structures: list[CuratedSeedStructure] = Field(default_factory=list)
    replacement_entries: list[CuratedSeedReplacementEntry] = Field(default_factory=list)
    findings: list[CuratedSeedFinding] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_source_keys(self) -> "CuratedSeedPayload":
        """Ensure all rows reference documents that exist in the same payload."""
        keys = {document.seed_key for document in self.documents}
        missing_keys: set[str] = set()

        for structure in self.cpa_structures:
            if structure.source_seed_key and structure.source_seed_key not in keys:
                missing_keys.add(structure.source_seed_key)

        for entry in self.replacement_entries:
            missing_keys.update(
                key for key in entry.source_seed_keys if key not in keys
            )

        for finding in self.findings:
            if finding.source_seed_key not in keys:
                missing_keys.add(finding.source_seed_key)

        if missing_keys:
            missing_str = ", ".join(sorted(missing_keys))
            raise ValueError(f"Unknown source seed keys referenced: {missing_str}")

        return self
