"""CryoLens MCP Server.

Exposes the cryopreservation knowledge database to AI agents via MCP.
Supports stdio (Claude Desktop) and streamable-http transports.

Usage:
    uv run python -m engine.mcp_server                    # stdio (default)
    uv run python -m engine.mcp_server --transport http   # streamable-http
"""

import json
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass

import asyncpg

from mcp.server.fastmcp import Context, FastMCP

from engine.db import create_pool, get_dsn, get_readonly_dsn
from engine.tools import (
    compare_formulations as _compare_formulations,
    find_gaps as _find_gaps,
    get_compound_details as _get_compound_details,
    get_protocol as _get_protocol,
    get_stats,
    query_database as _query_database,
    search_compounds as _search_compounds,
    search_findings as _search_findings,
    search_viability as _search_viability,
)


@dataclass
class AppContext:
    pool: asyncpg.Pool
    readonly_pool: asyncpg.Pool


@asynccontextmanager
async def app_lifespan(server: FastMCP) -> AsyncIterator[AppContext]:
    pool = await create_pool(get_dsn())
    readonly_dsn = get_readonly_dsn()
    if readonly_dsn == get_dsn():
        readonly_pool = pool
    else:
        readonly_pool = await create_pool(readonly_dsn, max_size=2)
    try:
        yield AppContext(pool=pool, readonly_pool=readonly_pool)
    finally:
        await pool.close()
        if readonly_pool is not pool:
            await readonly_pool.close()


mcp = FastMCP(
    "CryoLens",
    lifespan=app_lifespan,
    json_response=True,
)


def _get_pool(ctx: Context) -> asyncpg.Pool:
    return ctx.request_context.lifespan_context.pool


def _get_readonly_pool(ctx: Context) -> asyncpg.Pool:
    return ctx.request_context.lifespan_context.readonly_pool


# ============================================================
# TOOLS
# ============================================================


@mcp.tool()
async def search_compounds(
    ctx: Context,
    query: str | None = None,
    role: str | None = None,
    min_molecular_weight: float | None = None,
    max_molecular_weight: float | None = None,
    has_smiles: bool | None = None,
    limit: int = 20,
) -> list[dict]:
    """Search CPA compounds by name, role, or molecular properties.

    Args:
        query: Free text search (name, abbreviation, synonym)
        role: Filter by role: penetrating, non_penetrating, ice_blocker
        min_molecular_weight: Minimum MW in g/mol
        max_molecular_weight: Maximum MW in g/mol
        has_smiles: Only compounds with SMILES structures
        limit: Max results (default 20)
    """
    results = await _search_compounds(
        _get_pool(ctx), query=query, role=role,
        min_molecular_weight=min_molecular_weight,
        max_molecular_weight=max_molecular_weight,
        has_smiles=has_smiles, limit=limit,
    )
    return [r.model_dump() for r in results]


@mcp.tool()
async def get_compound_details(ctx: Context, compound_id: str) -> dict | str:
    """Get everything known about a compound: viability, permeability, formulations, findings, gaps.

    Args:
        compound_id: Compound ID (e.g., "dmso", "propionamide", "ethylene_glycol")
    """
    result = await _get_compound_details(_get_pool(ctx), compound_id)
    if not result:
        return f"Compound '{compound_id}' not found"
    return result.model_dump()


@mcp.tool()
async def search_viability(
    ctx: Context,
    compound_id: str | None = None,
    min_concentration: float | None = None,
    max_concentration: float | None = None,
    temperature_c: float | None = None,
    cell_type: str | None = None,
    min_viability: float | None = None,
    max_viability: float | None = None,
    limit: int = 50,
) -> list[dict]:
    """Query toxicity/viability data with filters.

    Args:
        compound_id: Filter by compound (e.g., "dmso")
        min_concentration: Minimum total concentration
        max_concentration: Maximum total concentration
        temperature_c: Filter by exposure temperature in °C
        cell_type: Filter by cell type (partial match)
        min_viability: Minimum viability fraction (0-1)
        max_viability: Maximum viability fraction (0-1)
        limit: Max results (default 50)
    """
    results = await _search_viability(
        _get_pool(ctx), compound_id=compound_id,
        min_concentration=min_concentration, max_concentration=max_concentration,
        temperature_c=temperature_c, cell_type=cell_type,
        min_viability=min_viability, max_viability=max_viability,
        limit=limit,
    )
    return [r.model_dump() for r in results]


@mcp.tool()
async def compare_formulations(
    ctx: Context, formulation_ids: list[str]
) -> list[dict]:
    """Side-by-side comparison of named vitrification cocktails.

    Args:
        formulation_ids: List of formulation IDs (e.g., ["dp6", "vs55", "m22"])
    """
    results = await _compare_formulations(_get_pool(ctx), formulation_ids)
    return [r.model_dump() for r in results]


@mcp.tool()
async def search_findings(
    ctx: Context,
    query: str,
    category: str | None = None,
    tissue_type: str | None = None,
    organism: str | None = None,
    tags: list[str] | None = None,
    min_year: int | None = None,
    confidence: str | None = None,
    limit: int = 20,
) -> list[dict]:
    """Full-text search over structured knowledge claims from cryopreservation papers.

    Args:
        query: Free text search query (uses PostgreSQL full-text search)
        category: Filter by category (e.g., vitrification_outcome, toxicity_finding, warming_method)
        tissue_type: Filter by tissue (e.g., kidney, brain, oocyte)
        organism: Filter by organism (e.g., rabbit, rat, human)
        tags: Filter by tags (e.g., ["nanowarming", "kidney"])
        min_year: Minimum publication year
        confidence: Filter by confidence: high, medium, low
        limit: Max results (default 20)
    """
    results = await _search_findings(
        _get_pool(ctx), query=query, category=category,
        tissue_type=tissue_type, organism=organism,
        tags=tags, min_year=min_year, confidence=confidence, limit=limit,
    )
    return [r.model_dump() for r in results]


@mcp.tool()
async def get_protocol(
    ctx: Context,
    protocol_id: int | None = None,
    paper_doi: str | None = None,
) -> list[dict]:
    """Retrieve step-by-step CPA loading/unloading protocols.

    Args:
        protocol_id: Specific protocol ID
        paper_doi: Get all protocols from a paper
    """
    results = await _get_protocol(
        _get_pool(ctx), protocol_id=protocol_id, paper_doi=paper_doi,
    )
    return [r.model_dump() for r in results]


@mcp.tool()
async def find_gaps(
    ctx: Context,
    compound_id: str | None = None,
    metric: str | None = None,
    temperature_c: float | None = None,
) -> dict:
    """Identify missing data in the database — what hasn't been tested.

    Args:
        compound_id: Check gaps for a specific compound
        metric: Check which compounds have this metric (viability, permeability_cpa, tg, ccr)
        temperature_c: Check who has data at this temperature
    """
    result = await _find_gaps(
        _get_pool(ctx), compound_id=compound_id,
        metric=metric, temperature_c=temperature_c,
    )
    return result.model_dump()


@mcp.tool()
async def query_database(ctx: Context, sql: str) -> list[dict] | str:
    """Execute a read-only SQL query against the cryopreservation database. SELECT only.

    Args:
        sql: SQL SELECT query. Tables: compounds, papers, solutions, solution_components,
             experiments, measurements, protocols, protocol_steps, formulations,
             formulation_components, formulation_properties, findings, finding_tags,
             compound_synonyms, compound_descriptors.
             Views: v_flat_measurements, v_compound_coverage, v_formulation_summary, v_findings.
    """
    return await _query_database(_get_readonly_pool(ctx), sql)


# ============================================================
# RESOURCES
# ============================================================


@mcp.resource("compound://{compound_id}")
async def compound_resource(compound_id: str, ctx: Context) -> str:
    """Full compound profile as JSON."""
    result = await _get_compound_details(_get_pool(ctx), compound_id)
    if not result:
        return json.dumps({"error": f"Compound '{compound_id}' not found"})
    return json.dumps(result.model_dump(), default=str)


@mcp.resource("formulation://{formulation_id}")
async def formulation_resource(formulation_id: str, ctx: Context) -> str:
    """Formulation recipe + thermal properties as JSON."""
    results = await _compare_formulations(_get_pool(ctx), [formulation_id])
    if not results:
        return json.dumps({"error": f"Formulation '{formulation_id}' not found"})
    return json.dumps(results[0].model_dump(), default=str)


@mcp.resource("paper://{doi}")
async def paper_resource(doi: str, ctx: Context) -> str:
    """Paper metadata + all findings from that paper."""
    from engine.db import fetch_all, fetch_one
    pool = _get_pool(ctx)
    paper = await fetch_one(pool, "SELECT * FROM papers WHERE doi = $1", doi)
    if not paper:
        return json.dumps({"error": f"Paper '{doi}' not found"})
    findings = await fetch_all(pool, """
        SELECT f.id, f.category, f.claim, f.details, f.confidence, f.source_location
        FROM findings f WHERE f.paper_doi = $1
    """, doi)
    data = dict(paper)
    data["authors"] = list(data.get("authors", []))
    data["findings"] = [dict(f) for f in findings]
    return json.dumps(data, default=str)


@mcp.resource("stats://overview")
async def stats_resource(ctx: Context) -> str:
    """Database statistics overview."""
    stats = await get_stats(_get_pool(ctx))
    return json.dumps(stats.model_dump(), default=str)


# ============================================================
# PROMPTS
# ============================================================


@mcp.prompt()
def cpa_recommendation(
    tissue: str, concentration: str = "3", temperature: str = "4",
    priority: str = "low_toxicity",
) -> str:
    """Generate a CPA recommendation for a specific use case."""
    return (
        f"Given the following requirements:\n"
        f"- Tissue type: {tissue}\n"
        f"- Target concentration: {concentration} mol/kg\n"
        f"- Temperature: {temperature}°C\n"
        f"- Priority: {priority}\n\n"
        f"Use the search_compounds and search_viability tools to find the best CPA candidates.\n"
        f"Then use compare_formulations to check if existing cocktails meet these requirements.\n"
        f"Finally use find_gaps to identify what data is missing for the top candidates."
    )


@mcp.prompt()
def gap_analysis(tissue_or_topic: str) -> str:
    """Analyze knowledge gaps for a tissue type or topic."""
    return (
        f"Analyze the current state of cryopreservation knowledge for {tissue_or_topic}.\n"
        f"Use search_findings to find what's known.\n"
        f"Use find_gaps to identify what's missing.\n"
        f"Produce a structured report of: known facts, open questions, recommended experiments."
    )


@mcp.prompt()
def hypothesis_generation() -> str:
    """Generate novel hypotheses for CPA formulation design."""
    return (
        "Based on the database, generate novel hypotheses for CPA formulation design.\n"
        "Use search_compounds to find underexplored compounds with favorable properties.\n"
        "Use search_viability to identify toxicity neutralization opportunities.\n"
        "Use search_findings to check what mechanisms are known.\n"
        "Propose 3-5 testable cocktail formulations with rationale."
    )


# ============================================================
# ENTRYPOINT
# ============================================================


def main():
    transport = "stdio"
    if "--transport" in sys.argv:
        idx = sys.argv.index("--transport")
        if idx + 1 < len(sys.argv):
            transport = sys.argv[idx + 1]

    if transport in ("http", "streamable-http"):
        mcp.settings.stateless_http = True
        mcp.run(transport="streamable-http")
    else:
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
