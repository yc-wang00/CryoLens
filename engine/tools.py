"""Tool implementations for CryoSight MCP server.

Compound-centric tools (search_compounds, get_compound_details, search_viability)
are in tools_compounds.py. This module contains formulation, findings, protocol,
gap analysis, query, and stats tools.

Re-exports all tools for convenient import from engine.tools.
"""

import asyncpg

from engine.db import fetch_all, fetch_one, validate_readonly_sql
from engine.models import (
    ComponentDetail,
    DatabaseStats,
    FindingResult,
    FormulationDetail,
    GapAnalysis,
    ProtocolDetail,
    ProtocolStep,
)
from engine.tools_compounds import (
    get_compound_details,
    search_compounds,
    search_viability,
)

# Re-export compound tools
__all__ = [
    "search_compounds",
    "get_compound_details",
    "search_viability",
    "compare_formulations",
    "search_findings",
    "get_protocol",
    "find_gaps",
    "query_database",
    "get_stats",
]


async def compare_formulations(
    pool: asyncpg.Pool, formulation_ids: list[str]
) -> list[FormulationDetail]:
    results = []
    for fid in formulation_ids:
        row = await fetch_one(pool, "SELECT * FROM formulations WHERE id = $1", fid)
        if not row:
            continue

        comps = await fetch_all(pool, """
            SELECT fc.compound_id, c.name AS compound_name,
                   fc.concentration, fc.concentration_unit, fc.role_in_formulation
            FROM formulation_components fc
            JOIN compounds c ON c.id = fc.compound_id
            WHERE fc.formulation_id = $1
            ORDER BY fc.concentration DESC
        """, fid)

        props = await fetch_all(pool, """
            SELECT property, value, unit, measurement_condition
            FROM formulation_properties WHERE formulation_id = $1
        """, fid)

        tg = ccr = cwr = None
        additional: dict[str, object] = {}
        for p in props:
            if p["property"] == "tg":
                tg = p["value"]
            elif p["property"] == "ccr":
                ccr = p["value"]
            elif p["property"] == "cwr":
                cwr = p["value"]
            else:
                label = p["property"]
                if p.get("measurement_condition"):
                    label += f" ({p['measurement_condition']})"
                additional[label] = f"{p['value']} {p['unit']}"

        results.append(FormulationDetail(
            id=row["id"],
            name=row["name"],
            full_name=row.get("full_name"),
            total_concentration=row.get("total_concentration"),
            concentration_unit=row.get("concentration_unit"),
            carrier_solution=row.get("carrier_solution"),
            developed_by=row.get("developed_by"),
            year_introduced=row.get("year_introduced"),
            components=[ComponentDetail(**c) for c in comps],
            tg_degC=tg,
            ccr_degC_per_min=ccr,
            cwr_degC_per_min=cwr,
            additional_properties=additional,
        ))
    return results


async def search_findings(
    pool: asyncpg.Pool,
    *,
    query: str,
    category: str | None = None,
    tissue_type: str | None = None,
    organism: str | None = None,
    tags: list[str] | None = None,
    min_year: int | None = None,
    confidence: str | None = None,
    limit: int = 20,
) -> list[FindingResult]:
    conditions = []
    params: list[object] = []
    idx = 1

    conditions.append(f"""
        (to_tsvector('english', f.claim) @@ plainto_tsquery('english', ${idx})
         OR to_tsvector('english', coalesce(f.details, '')) @@ plainto_tsquery('english', ${idx}))
    """)
    params.append(query)
    idx += 1

    if category:
        conditions.append(f"f.category = ${idx}")
        params.append(category)
        idx += 1

    if tissue_type:
        conditions.append(f"f.tissue_type ILIKE ${idx}")
        params.append(f"%{tissue_type}%")
        idx += 1

    if organism:
        conditions.append(f"f.organism ILIKE ${idx}")
        params.append(f"%{organism}%")
        idx += 1

    if min_year:
        conditions.append(f"p.year >= ${idx}")
        params.append(min_year)
        idx += 1

    if confidence:
        conditions.append(f"f.confidence = ${idx}")
        params.append(confidence)
        idx += 1

    if tags:
        conditions.append(f"""
            EXISTS (SELECT 1 FROM finding_tags ft2
                    WHERE ft2.finding_id = f.id AND ft2.tag = ANY(${idx}::text[]))
        """)
        params.append(tags)
        idx += 1

    where = " AND ".join(conditions)

    sql = f"""
        SELECT f.id, f.category, f.claim, f.details, f.tissue_type, f.organism,
               f.confidence, f.source_location, f.paper_doi,
               p.title AS paper_title, p.year AS paper_year,
               array_agg(DISTINCT ft.tag) FILTER (WHERE ft.tag IS NOT NULL) AS tags
        FROM findings f
        JOIN papers p ON f.paper_doi = p.doi
        LEFT JOIN finding_tags ft ON ft.finding_id = f.id
        WHERE {where}
        GROUP BY f.id, p.title, p.year
        ORDER BY ts_rank(to_tsvector('english', f.claim),
                         plainto_tsquery('english', $1)) DESC
        LIMIT ${idx}
    """
    params.append(limit)

    rows = await fetch_all(pool, sql, *params)
    return [FindingResult(**r) for r in rows]


async def get_protocol(
    pool: asyncpg.Pool,
    *,
    protocol_id: int | None = None,
    paper_doi: str | None = None,
) -> list[ProtocolDetail]:
    if protocol_id:
        rows = await fetch_all(
            pool, "SELECT * FROM protocols WHERE id = $1", protocol_id
        )
    elif paper_doi:
        rows = await fetch_all(
            pool, "SELECT * FROM protocols WHERE paper_doi = $1", paper_doi
        )
    else:
        rows = await fetch_all(pool, "SELECT * FROM protocols ORDER BY id LIMIT 10")

    results = []
    for row in rows:
        steps = await fetch_all(pool, """
            SELECT step_order AS order, action, cpa_concentration,
                   concentration_unit, temperature_c, duration_min,
                   volume_ul, method, description
            FROM protocol_steps WHERE protocol_id = $1
            ORDER BY step_order
        """, row["id"])

        results.append(ProtocolDetail(
            id=row["id"],
            name=row["name"],
            description=row.get("description"),
            cell_type=row.get("cell_type"),
            organism=row.get("organism"),
            viability_assay=row.get("viability_assay"),
            automation_system=row.get("automation_system"),
            carrier_solution=row.get("carrier_solution"),
            paper_doi=row["paper_doi"],
            steps=[ProtocolStep(**s) for s in steps],
        ))
    return results


async def find_gaps(
    pool: asyncpg.Pool,
    *,
    compound_id: str | None = None,
    metric: str | None = None,
    temperature_c: float | None = None,
) -> GapAnalysis:
    all_compounds = await fetch_all(
        pool,
        "SELECT id, name FROM compounds "
        "WHERE role IN ('penetrating', 'non_penetrating', 'ice_blocker')",
    )
    all_ids = {r["id"] for r in all_compounds}
    all_names = {r["id"]: r["name"] for r in all_compounds}

    conditions = []
    params: list[object] = []
    idx = 1
    desc_parts = ["Gap analysis"]

    if compound_id:
        conditions.append(f"sc.compound_id = ${idx}")
        params.append(compound_id)
        idx += 1
        desc_parts.append(f"for {compound_id}")

    if metric:
        conditions.append(f"m.metric = ${idx}")
        params.append(metric)
        idx += 1
        desc_parts.append(f"metric={metric}")

    if temperature_c is not None:
        conditions.append(f"e.temperature_c = ${idx}")
        params.append(temperature_c)
        idx += 1
        desc_parts.append(f"at {temperature_c}°C")

    where = " AND ".join(conditions) if conditions else "TRUE"

    with_data = await fetch_all(pool, f"""
        SELECT DISTINCT sc.compound_id
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN solution_components sc ON sc.solution_id = s.id
        WHERE {where}
    """, *params)

    ids_with = {r["compound_id"] for r in with_data}
    ids_without = all_ids - ids_with

    recommendations = []
    if ids_without and metric:
        top_missing = sorted(ids_without)[:5]
        recommendations.append(
            f"Test {', '.join(all_names.get(i, i) for i in top_missing)} "
            f"for {metric} data"
        )
    if temperature_c is not None and ids_without:
        recommendations.append(
            f"{len(ids_without)} compounds lack data at {temperature_c}°C"
        )

    return GapAnalysis(
        query_description=" ".join(desc_parts),
        compounds_with_data=sorted(all_names.get(i, i) for i in ids_with),
        compounds_missing_data=sorted(all_names.get(i, i) for i in ids_without),
        untested_combinations=[
            f"{all_names.get(i, i)} — no {metric or 'any'} data"
            + (f" at {temperature_c}°C" if temperature_c is not None else "")
            for i in sorted(ids_without)[:20]
        ],
        recommendations=recommendations,
    )


async def query_database(
    pool: asyncpg.Pool, sql: str
) -> list[dict] | str:
    error = validate_readonly_sql(sql)
    if error:
        return f"Error: {error}"
    try:
        rows = await fetch_all(pool, sql)
        result = []
        for row in rows:
            cleaned = {}
            for k, v in row.items():
                if isinstance(v, (list, dict, str, int, float, bool, type(None))):
                    cleaned[k] = v
                else:
                    cleaned[k] = str(v)
            result.append(cleaned)
        return result
    except Exception as e:
        return f"Query error: {e}"


async def get_stats(pool: asyncpg.Pool) -> DatabaseStats:
    counts = await fetch_all(pool, """
        SELECT 'papers' AS tbl, COUNT(*) AS n FROM papers
        UNION ALL SELECT 'compounds', COUNT(*) FROM compounds
        UNION ALL SELECT 'findings', COUNT(*) FROM findings
        UNION ALL SELECT 'measurements', COUNT(*) FROM measurements
        UNION ALL SELECT 'formulations', COUNT(*) FROM formulations
        UNION ALL SELECT 'protocols', COUNT(*) FROM protocols
    """)
    count_map = {r["tbl"]: r["n"] for r in counts}

    top_tags = await fetch_all(pool, """
        SELECT tag, COUNT(*) AS count FROM finding_tags
        GROUP BY tag ORDER BY count DESC LIMIT 20
    """)

    coverage = await fetch_all(pool, """
        SELECT compound_id, compound_name, role,
               metrics_measured, total_measurements, total_papers
        FROM v_compound_coverage
        ORDER BY total_measurements DESC LIMIT 15
    """)
    coverage_clean = []
    for r in coverage:
        cleaned = {}
        for k, v in r.items():
            cleaned[k] = list(v) if isinstance(v, (list, tuple)) else v
        coverage_clean.append(cleaned)

    return DatabaseStats(
        total_papers=count_map.get("papers", 0),
        total_compounds=count_map.get("compounds", 0),
        total_findings=count_map.get("findings", 0),
        total_measurements=count_map.get("measurements", 0),
        total_formulations=count_map.get("formulations", 0),
        total_protocols=count_map.get("protocols", 0),
        top_tags=[dict(r) for r in top_tags],
        coverage_summary=coverage_clean,
    )
