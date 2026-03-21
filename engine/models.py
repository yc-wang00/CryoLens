"""Pydantic output models for CryoSight MCP server tools."""

from pydantic import BaseModel, Field


# -- search_compounds / get_compound_details --

class CompoundResult(BaseModel):
    id: str
    name: str
    abbreviation: str | None = None
    molecular_weight: float | None = None
    role: str
    smiles: str | None = None
    measurement_count: int = 0
    paper_count: int = 0


class ViabilityMeasurement(BaseModel):
    concentration: float
    concentration_unit: str
    temperature_c: float | None = None
    exposure_time_min: float | None = None
    cell_type: str | None = None
    value: float
    uncertainty: float | None = None
    data_quality: str | None = None
    source_location: str
    paper_doi: str


class PermeabilityMeasurement(BaseModel):
    temperature_c: float | None = None
    value: float
    unit: str
    source_location: str
    paper_doi: str


class ActivationEnergy(BaseModel):
    metric: str
    value: float
    unit: str
    source_location: str
    paper_doi: str


class FormulationRef(BaseModel):
    id: str
    name: str
    role_in_formulation: str | None = None


class FindingSummary(BaseModel):
    id: int
    category: str
    claim: str
    confidence: str


class CompoundDetails(BaseModel):
    id: str
    name: str
    abbreviation: str | None = None
    molecular_weight: float | None = None
    smiles: str | None = None
    cas_number: str | None = None
    role: str
    synonyms: list[str] = Field(default_factory=list)
    viability_data: list[ViabilityMeasurement] = Field(default_factory=list)
    permeability_data: list[PermeabilityMeasurement] = Field(default_factory=list)
    activation_energies: list[ActivationEnergy] = Field(default_factory=list)
    formulations: list[FormulationRef] = Field(default_factory=list)
    findings: list[FindingSummary] = Field(default_factory=list)
    missing_data: list[str] = Field(default_factory=list)


# -- search_viability --

class ViabilityResult(BaseModel):
    compound_id: str | None = None
    compound_name: str | None = None
    concentration: float
    concentration_unit: str
    temperature_c: float | None = None
    exposure_time_min: float | None = None
    cell_type: str | None = None
    organism: str | None = None
    viability: float
    uncertainty: float | None = None
    data_quality: str | None = None
    source_location: str
    paper_doi: str
    paper_title: str | None = None


# -- compare_formulations --

class ComponentDetail(BaseModel):
    compound_id: str
    compound_name: str
    concentration: float
    concentration_unit: str
    role_in_formulation: str | None = None


class FormulationDetail(BaseModel):
    id: str
    name: str
    full_name: str | None = None
    total_concentration: float | None = None
    concentration_unit: str | None = None
    carrier_solution: str | None = None
    developed_by: str | None = None
    year_introduced: int | None = None
    components: list[ComponentDetail] = Field(default_factory=list)
    tg_degC: float | None = None
    ccr_degC_per_min: float | None = None
    cwr_degC_per_min: float | None = None
    additional_properties: dict[str, object] = Field(default_factory=dict)


# -- search_findings --

class FindingResult(BaseModel):
    id: int
    category: str
    claim: str
    details: str | None = None
    tissue_type: str | None = None
    organism: str | None = None
    confidence: str
    source_location: str
    paper_doi: str
    paper_title: str | None = None
    paper_year: int | None = None
    tags: list[str] = Field(default_factory=list)


# -- get_protocol --

class ProtocolStep(BaseModel):
    order: int
    action: str
    cpa_concentration: float | None = None
    concentration_unit: str | None = None
    temperature_c: float | None = None
    duration_min: float | None = None
    volume_ul: float | None = None
    method: str | None = None
    description: str | None = None


class ProtocolDetail(BaseModel):
    id: int
    name: str
    description: str | None = None
    cell_type: str | None = None
    organism: str | None = None
    viability_assay: str | None = None
    automation_system: str | None = None
    carrier_solution: str | None = None
    paper_doi: str
    steps: list[ProtocolStep] = Field(default_factory=list)


# -- find_gaps --

class GapAnalysis(BaseModel):
    query_description: str
    compounds_with_data: list[str] = Field(default_factory=list)
    compounds_missing_data: list[str] = Field(default_factory=list)
    untested_combinations: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


# -- stats overview --

class DatabaseStats(BaseModel):
    total_papers: int = 0
    total_compounds: int = 0
    total_findings: int = 0
    total_measurements: int = 0
    total_formulations: int = 0
    total_protocols: int = 0
    top_tags: list[dict[str, object]] = Field(default_factory=list)
    coverage_summary: list[dict[str, object]] = Field(default_factory=list)
