"""Schemas for the live cryoLens Supabase-backed frontend dataset."""

# ruff: noqa: N815

from pydantic import BaseModel, Field


class CryoLensStats(BaseModel):
    """Top-level counters shown in the frontend shell."""

    papers: int
    findings: int
    molecules: int
    structures: int


class CryoLensStoryYear(BaseModel):
    """Yearly evidence-growth point for the story chart."""

    year: int
    papers: int
    findings: int
    experiments: int
    cumulativePapers: int
    cumulativeFindings: int


class CryoLensStoryCategory(BaseModel):
    """Ranked finding-category slice used in the story sidebar."""

    label: str
    count: int
    sharePct: float


class CryoLensFormulationMilestone(BaseModel):
    """Formulation milestone marker for the story chart."""

    id: str
    name: str
    year: int
    type: str
    note: str
    referenceDoi: str | None = None
    referenceTitle: str | None = None
    linkedFindings: int
    components: list[str] = Field(default_factory=list)


class CryoLensStoryStats(BaseModel):
    """Chart-ready story payload for chronology and category coverage."""

    firstFormulationYear: int | None = None
    firstPaperYear: int | None = None
    lastYear: int | None = None
    yearly: list[CryoLensStoryYear] = Field(default_factory=list)
    milestones: list[CryoLensFormulationMilestone] = Field(default_factory=list)
    topFindingCategories: list[CryoLensStoryCategory] = Field(default_factory=list)


class CryoLensSourceDocument(BaseModel):
    """Source document card payload."""

    id: str
    title: str
    journal: str
    year: int
    doi: str
    note: str
    abstract: str
    linkedFindings: int
    linkedMolecules: int


class CryoLensFinding(BaseModel):
    """Evidence finding payload for Ask and detail modals."""

    id: str
    sourceId: str
    sourceTitle: str
    tissue: str
    modality: str
    metricType: str
    metricValue: str
    conditions: str
    confidence: float
    summary: str
    components: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class CryoLensMolecule(BaseModel):
    """Compound/library row payload."""

    id: str
    name: str
    aliases: list[str] = Field(default_factory=list)
    className: str
    roleHint: str
    sourceCount: int
    evidenceCount: int
    notes: str
    keySignal: str


class CryoLensCocktailComponent(BaseModel):
    """Formulation component payload."""

    name: str
    role: str
    concentration: str


class CryoLensCocktail(BaseModel):
    """Formulation/cocktail card payload."""

    id: str
    name: str
    type: str
    tissueTags: list[str] = Field(default_factory=list)
    notes: str
    components: list[CryoLensCocktailComponent] = Field(default_factory=list)


class CryoLensHypothesis(BaseModel):
    """Saved heuristic hypothesis payload."""

    id: str
    title: str
    status: str
    benchmark: str
    target: str
    summary: str
    evidenceIds: list[str] = Field(default_factory=list)
    nextStep: str


class CryoLensExperimentDraft(BaseModel):
    """Experiment draft payload preserved from the original demo."""

    id: str
    title: str
    benchmark: str
    objective: str
    temperature: str
    assay: str
    notes: str
    nextAction: str


class CryoLensExperimentRecord(BaseModel):
    """Live experiment row payload."""

    id: str
    title: str
    paperTitle: str
    assayMethod: str
    organism: str
    cellType: str
    temperature: str
    exposure: str
    protocolName: str
    outcomeStatus: str
    measurementSummary: str
    notes: str
    sourceLocation: str


class CryoLensDatasetResponse(BaseModel):
    """Normalized frontend dataset returned by the backend."""

    appStats: CryoLensStats
    storyStats: CryoLensStoryStats
    molecules: list[CryoLensMolecule] = Field(default_factory=list)
    cocktails: list[CryoLensCocktail] = Field(default_factory=list)
    findings: list[CryoLensFinding] = Field(default_factory=list)
    sources: list[CryoLensSourceDocument] = Field(default_factory=list)
    hypotheses: list[CryoLensHypothesis] = Field(default_factory=list)
    experiments: list[CryoLensExperimentRecord] = Field(default_factory=list)
    experimentDrafts: list[CryoLensExperimentDraft] = Field(default_factory=list)
    savedPrompts: list[str] = Field(default_factory=list)
