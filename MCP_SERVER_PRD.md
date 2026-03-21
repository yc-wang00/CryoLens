# CryoSight MCP Server — Product Requirements Document

## Overview

The CryoSight MCP Server exposes the world's largest structured cryopreservation database to any AI agent via the Model Context Protocol. It enables researchers and AI systems to query CPA properties, compare formulations, search findings, retrieve protocols, and identify knowledge gaps — all through a standardized tool interface.

## Context

### What We Have

- **PostgreSQL database `cryosight`** with normalized schema (v2 + protocols + findings)
- **13+ papers** seeded with 91+ findings, 165 measurements, 5 formulations, 7 protocols
- **1,759 PDFs** in corpus, actively being extracted by sub-agents (scaling to hundreds of papers)
- **33 compounds** with SMILES, synonyms, molecular properties
- **4 benchmark cocktails** (DP6, VS55, M22, VM3) with thermal properties (Tg, CCR, CWR)
- **Full-text search** on findings via PostgreSQL tsvector indexes

### What We're Building

An MCP server that any AI agent (Claude, GPT, open-source) can connect to and query the database through domain-specific tools. The agent doesn't need to know SQL or our schema — it calls tools like `search_compounds(role="penetrating", min_permeability=0.01)`.

### Who Uses This

1. **AI agents** — Claude Code, Claude Desktop, OpenAI agents, open-source agents via MCP
2. **Researchers** — via a web interface that wraps the MCP tools (future)
3. **Developers** — building cryopreservation tools on top of the API

## Technical Architecture

```
Any AI Agent (Claude, GPT, open-source)
        |
        |  MCP Protocol (stdio or streamable-http)
        |
+-------v--------------------------------------+
|       CryoSight MCP Server                   |
|       (Python, mcp SDK v1.12+)               |
|                                              |
|  TOOLS:        RESOURCES:     PROMPTS:       |
|  - search_*    - compound://  - recommend    |
|  - get_*       - formulation: - gap_analysis |
|  - compare_*   - paper://     - hypothesize  |
|  - find_gaps   - stats://                    |
|  - query_db                                  |
+-------+--------------------------------------+
        |
        |  asyncpg connection pool
        |
+-------v--------------------------------------+
|       PostgreSQL `cryosight`                 |
|       (13 tables, 5 views, FTS indexes)      |
+----------------------------------------------+
```

## Database Schema (Current State)

### Core Tables
- `compounds` — 33 chemicals with SMILES, MW, CAS, role
- `compound_synonyms` — search by any name (30 synonyms)
- `compound_descriptors` — computed molecular properties (for ML)
- `papers` — 13+ source papers with DOI, authors, year
- `solutions` — 118 tested solutions (what was in the well)
- `solution_components` — junction: which compounds at what concentration
- `experiments` — 151 experiments with conditions (temp, time, cell type)
- `measurements` — 165 numeric values (viability, permeability, Ea)
- `protocols` — 7 step-by-step procedures
- `protocol_steps` — 53 individual steps with concentrations, durations
- `formulations` — 5 benchmark cocktails (DP6, VS55, M22, VM3, glycerol+trehalose)
- `formulation_components` — cocktail recipes
- `formulation_properties` — 24 thermal/physical properties (Tg, CCR, CWR, dielectric)
- `findings` — 91+ structured knowledge claims
- `finding_tags` — 333+ tags for search (202 unique)

### Views
- `v_flat_measurements` — denormalized for ML (compound + conditions + measurement)
- `v_compound_coverage` — gap analysis (which compounds have which data)
- `v_formulation_summary` — cocktail comparison with thermal properties
- `v_findings` — findings with paper metadata and tags

### Key Indexes
- Full-text search on `findings.claim` and `findings.details` (GIN tsvector)
- All FK columns indexed
- Composite index on `measurements(metric, value)`

## Tools Specification

### 1. `search_compounds`

Search for CPA compounds by properties.

**Input:**
```python
class SearchCompoundsInput(BaseModel):
    query: str | None = Field(None, description="Free text search (name, abbreviation, synonym)")
    role: str | None = Field(None, description="Filter by role: penetrating, non_penetrating, ice_blocker")
    min_molecular_weight: float | None = None
    max_molecular_weight: float | None = None
    min_permeability: float | None = Field(None, description="Minimum P_CPA at 4°C (1/s)")
    has_viability_data: bool | None = Field(None, description="Only compounds with toxicity data")
    has_smiles: bool | None = Field(None, description="Only compounds with SMILES for RDKit")
    limit: int = Field(20, description="Max results")
```

**Output:**
```python
class CompoundResult(BaseModel):
    id: str
    name: str
    abbreviation: str | None
    molecular_weight: float | None
    role: str
    smiles: str | None
    measurement_count: int
    paper_count: int
```

**SQL Strategy:** Join compounds with aggregated measurement counts. If `query` provided, search compound_synonyms table. If `min_permeability` provided, join through solution_components → solutions → experiments → measurements.

### 2. `get_compound_details`

Get everything we know about one compound.

**Input:** `compound_id: str` (e.g., "dmso", "propionamide")

**Output:**
```python
class CompoundDetails(BaseModel):
    id: str
    name: str
    abbreviation: str | None
    molecular_weight: float | None
    smiles: str | None
    cas_number: str | None
    role: str
    synonyms: list[str]

    # All measurements grouped by metric
    viability_data: list[ViabilityMeasurement]  # concentration, temp, viability, paper
    permeability_data: list[PermeabilityMeasurement]  # temp, P_CPA, Lp, paper
    activation_energies: list[ActivationEnergy]  # Ea_CPA, Ea_water

    # Which formulations include this compound
    formulations: list[FormulationRef]

    # Related findings
    findings: list[FindingSummary]

    # Coverage gaps
    missing_data: list[str]  # e.g., "No viability data at 6 mol/kg 4°C"
```

### 3. `search_viability`

Query toxicity/viability data with filters.

**Input:**
```python
class SearchViabilityInput(BaseModel):
    compound_id: str | None = None
    min_concentration: float | None = None
    max_concentration: float | None = None
    temperature_c: float | None = None
    cell_type: str | None = None
    min_viability: float | None = None
    max_viability: float | None = None
    single_compound_only: bool = False
    include_mixtures: bool = True
    limit: int = Field(50, description="Max results")
    order_by: str = Field("viability_desc", description="viability_desc, viability_asc, concentration_asc")
```

**Output:** List of viability measurements with full context (compound, concentration, temperature, protocol, paper DOI).

### 4. `compare_formulations`

Side-by-side comparison of named cocktails.

**Input:** `formulation_ids: list[str]` (e.g., ["dp6", "vs55", "m22"])

**Output:**
```python
class FormulationComparison(BaseModel):
    formulations: list[FormulationDetail]

class FormulationDetail(BaseModel):
    id: str
    name: str
    total_concentration: float
    concentration_unit: str
    carrier_solution: str
    components: list[ComponentDetail]  # compound name + concentration
    tg_degC: float | None
    ccr_degC_per_min: float | None
    cwr_degC_per_min: float | None
    developed_by: str | None
    year_introduced: int | None
    additional_properties: dict  # dielectric, density, etc.
```

### 5. `search_findings`

Full-text semantic search over knowledge claims.

**Input:**
```python
class SearchFindingsInput(BaseModel):
    query: str = Field(..., description="Free text search query")
    category: str | None = Field(None, description="Filter by category: vitrification_outcome, toxicity_finding, etc.")
    tissue_type: str | None = None
    organism: str | None = None
    tags: list[str] | None = Field(None, description="Filter by tags: nanowarming, kidney, etc.")
    min_year: int | None = None
    confidence: str | None = Field(None, description="Filter by confidence: high, medium, low")
    limit: int = Field(20, description="Max results")
```

**Output:**
```python
class FindingResult(BaseModel):
    id: int
    category: str
    claim: str
    details: str | None
    tissue_type: str | None
    organism: str | None
    confidence: str
    source_location: str
    paper_doi: str
    paper_title: str
    paper_year: int
    tags: list[str]
```

**SQL Strategy:** Use PostgreSQL full-text search with `to_tsquery` for the query parameter, combined with filters on category, tissue_type, tags.

### 6. `get_protocol`

Retrieve a step-by-step CPA loading protocol.

**Input:** `protocol_id: int | None`, `paper_doi: str | None`, `concentration: float | None`, `temperature_c: float | None`

**Output:**
```python
class ProtocolDetail(BaseModel):
    id: int
    name: str
    description: str
    cell_type: str
    organism: str
    viability_assay: str
    automation_system: str | None
    carrier_solution: str
    paper_doi: str
    steps: list[ProtocolStep]

class ProtocolStep(BaseModel):
    order: int
    action: str  # add_cpa, hold, wash, etc.
    cpa_concentration: float | None
    concentration_unit: str | None
    temperature_c: float | None
    duration_min: float | None
    volume_ul: float | None
    method: str | None
    description: str
```

### 7. `find_gaps`

Identify missing data in the database — what hasn't been tested.

**Input:**
```python
class FindGapsInput(BaseModel):
    compound_id: str | None = Field(None, description="Check gaps for a specific compound")
    tissue_type: str | None = Field(None, description="Check which compounds tested on this tissue")
    metric: str | None = Field(None, description="Check which compounds have this metric: viability, permeability_cpa, tg, ccr")
    concentration: float | None = Field(None, description="Check who has data at this concentration")
    temperature_c: float | None = Field(None, description="Check who has data at this temperature")
```

**Output:**
```python
class GapAnalysis(BaseModel):
    query_description: str
    compounds_with_data: list[str]
    compounds_missing_data: list[str]
    untested_combinations: list[str]  # e.g., "propionamide at 6 mol/kg 4°C"
    recommendations: list[str]
```

### 8. `query_database`

Escape hatch for advanced users. Read-only SQL access.

**Input:** `sql: str` (must be SELECT only)

**Output:** JSON array of rows.

**Safety:** Reject any SQL containing INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE. Use a read-only database connection.

## Resources Specification

### `compound://{compound_id}`
Returns full compound profile as structured JSON. Same data as `get_compound_details` but as a browsable resource.

### `formulation://{formulation_id}`
Returns formulation recipe + thermal properties + all papers that used it.

### `paper://{doi}`
Returns paper metadata + all findings + all measurements from that paper.

### `stats://overview`
Returns database statistics: total papers, compounds, findings, measurements, tag distribution, coverage summary.

## Prompts Specification

### `cpa_recommendation`
```
Given the following requirements:
- Tissue type: {tissue}
- Target concentration: {concentration} mol/kg
- Temperature: {temperature}°C
- Priority: {priority}  (low_toxicity | fast_permeation | both)

Use the search_compounds and search_viability tools to find the best CPA candidates.
Then use compare_formulations to check if existing cocktails meet these requirements.
Finally use find_gaps to identify what data is missing for the top candidates.
```

### `gap_analysis`
```
Analyze the current state of cryopreservation knowledge for {tissue_or_topic}.
Use search_findings to find what's known.
Use find_gaps to identify what's missing.
Produce a structured report of: known facts, open questions, recommended experiments.
```

### `hypothesis_generation`
```
Based on the database, generate novel hypotheses for CPA formulation design.
Use search_compounds to find underexplored compounds with favorable properties.
Use search_viability to identify toxicity neutralization opportunities.
Use search_findings to check what mechanisms are known.
Propose 3-5 testable cocktail formulations with rationale.
```

## Implementation Plan

### Tech Stack
- **Python 3.12+** with `uv` package manager
- **`mcp` SDK v1.12+** (FastMCP for tool/resource/prompt decorators)
- **`asyncpg`** for async PostgreSQL connection pooling
- **Pydantic v2** for input/output validation and structured output
- **Transport:** `streamable-http` for web access, `stdio` for Claude Desktop

### File Structure
```
engine/
  mcp_server.py      # Main server with all tools, resources, prompts
  db.py              # Database connection pool and query helpers
  models.py          # Pydantic models for inputs/outputs
  sql/               # Named SQL queries (optional, could inline)
```

### Configuration
```bash
# Environment variables
CRYOSIGHT_DB_URL=postgresql://localhost/cryosight
CRYOSIGHT_DB_POOL_SIZE=5
MCP_TRANSPORT=streamable-http  # or stdio
MCP_PORT=8000
```

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "cryosight": {
      "command": "uv",
      "args": ["run", "python", "engine/mcp_server.py"],
      "env": {
        "CRYOSIGHT_DB_URL": "postgresql://localhost/cryosight"
      }
    }
  }
}
```

## Non-Functional Requirements

### Performance
- Tool response time < 500ms for simple queries
- Full-text search < 1s
- Connection pool: 5 connections, reuse across requests

### Security
- `query_database` tool: read-only, SELECT statements only
- No mutation tools — database is populated by the extraction pipeline, not by agents
- Sanitize all inputs to prevent SQL injection (use parameterized queries)

### Open Source
- MIT license
- Docker Compose setup for Postgres + MCP server
- `schema.sql` + `seed_*.sql` files for reproducible database setup
- Documentation for adding custom tools

## Success Criteria

1. An AI agent can answer: "What CPA should I use for kidney vitrification at 4°C?" with grounded, cited data
2. An agent can compare VS55 vs M22 with exact compositions and thermal properties
3. An agent can identify: "Propionamide has never been tested at 6 mol/kg at 4°C" as a gap
4. Full-text search returns relevant findings for any cryopreservation question
5. Protocol retrieval gives step-by-step procedures a researcher can follow

## Open Questions

1. Should we add a `suggest_experiment` tool that combines gap analysis with compound ranking?
2. Should resources support pagination for large result sets?
3. Should we add a `get_similar_compounds` tool using SMILES/Tanimoto similarity?
4. Should the MCP server also serve as a REST API for the web interface, or should that be separate?

---

*Document version: 1.0 | March 21, 2026 | CryoSight Hackathon*
