"""Library / compound explorer endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/library", tags=["library"])


@router.get("/viability")
async def viability_scatter(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT c.id AS compound_id, c.name AS compound_name, c.abbreviation,
               s.total_concentration AS concentration,
               e.temperature_c, m.value, m.unit,
               e.cell_type, e.organism
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN solution_components sc ON sc.solution_id = s.id
        JOIN compounds c ON c.id = sc.compound_id
        WHERE m.metric = 'viability'
        ORDER BY c.name, s.total_concentration
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/permeability")
async def permeability_data(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT c.id AS compound_id, c.name AS compound_name, c.abbreviation,
               e.temperature_c, m.value, m.unit, m.metric,
               e.cell_type
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN solution_components sc ON sc.solution_id = s.id
        JOIN compounds c ON c.id = sc.compound_id
        WHERE m.metric IN ('permeability_cpa', 'permeability_water')
        ORDER BY c.name
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/glass-transition")
async def glass_transition(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT c.id AS compound_id, c.name AS compound_name, c.abbreviation,
               m.value, m.unit, e.source_location, e.paper_doi
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN solution_components sc ON sc.solution_id = s.id
        JOIN compounds c ON c.id = sc.compound_id
        WHERE m.metric = 'tg'
        ORDER BY m.value
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/protocols")
async def list_protocols(
    session: AsyncSession = Depends(get_async_session),
):
    protocols_result = await session.execute(text("""
        SELECT p.id, p.name, p.description, p.cell_type, p.organism,
               p.viability_assay, p.carrier_solution, p.paper_doi
        FROM protocols p ORDER BY p.id
    """))
    protocols = [dict(r) for r in protocols_result.mappings().all()]

    for protocol in protocols:
        steps_result = await session.execute(text("""
            SELECT step_order, action, cpa_concentration, concentration_unit,
                   temperature_c, duration_min, volume_ul, method, description
            FROM protocol_steps WHERE protocol_id = :id
            ORDER BY step_order
        """), {"id": protocol["id"]})
        protocol["steps"] = [dict(r) for r in steps_result.mappings().all()]

    return protocols


@router.get("/cocktails")
async def cocktail_comparison(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT f.id, f.name, f.full_name, f.total_concentration, f.concentration_unit,
               f.carrier_solution, f.year_introduced, f.developed_by, f.description,
               COUNT(DISTINCT fc.compound_id) AS component_count,
               COUNT(DISTINCT fi.id) AS finding_count
        FROM formulations f
        LEFT JOIN formulation_components fc ON fc.formulation_id = f.id
        LEFT JOIN findings fi ON fi.formulation_id = f.id
        GROUP BY f.id
        HAVING COUNT(DISTINCT fc.compound_id) >= 1
        ORDER BY COUNT(DISTINCT fi.id) DESC, COUNT(DISTINCT fc.compound_id) DESC, f.name
    """))
    formulations = [dict(r) for r in result.mappings().all()]

    for f in formulations:
        comps_result = await session.execute(text("""
            SELECT c.id, c.name, c.abbreviation, c.role,
                   fc.concentration, fc.concentration_unit, fc.role_in_formulation
            FROM formulation_components fc
            JOIN compounds c ON c.id = fc.compound_id
            WHERE fc.formulation_id = :id
            ORDER BY fc.concentration DESC NULLS LAST
        """), {"id": f["id"]})
        f["components"] = [dict(r) for r in comps_result.mappings().all()]

        props_result = await session.execute(text("""
            SELECT property, value, unit
            FROM formulation_properties WHERE formulation_id = :id
        """), {"id": f["id"]})
        f["properties"] = [dict(r) for r in props_result.mappings().all()]

    return formulations


@router.get("/coverage-matrix")
async def coverage_matrix(
    session: AsyncSession = Depends(get_async_session),
):
    """Compounds × metrics coverage grid for the gaps view."""
    result = await session.execute(text("""
        WITH metric_counts AS (
            SELECT sc.compound_id,
                   m.metric,
                   COUNT(*) AS count
            FROM measurements m
            JOIN experiments e ON m.experiment_id = e.id
            JOIN solutions s ON e.solution_id = s.id
            JOIN solution_components sc ON sc.solution_id = s.id
            GROUP BY sc.compound_id, m.metric
        ),
        finding_counts AS (
            SELECT fc.compound_id, COUNT(DISTINCT f.id) AS count
            FROM formulation_components fc
            JOIN findings f ON f.formulation_id = fc.formulation_id
            GROUP BY fc.compound_id
        ),
        paper_counts AS (
            SELECT fc.compound_id, COUNT(DISTINCT f.paper_doi) AS count
            FROM formulation_components fc
            JOIN findings f ON f.formulation_id = fc.formulation_id
            GROUP BY fc.compound_id
        ),
        tissue_counts AS (
            SELECT fc.compound_id, COUNT(DISTINCT f.tissue_type) AS count
            FROM formulation_components fc
            JOIN findings f ON f.formulation_id = fc.formulation_id
            WHERE f.tissue_type IS NOT NULL
            GROUP BY fc.compound_id
        )
        SELECT c.id, c.name, c.abbreviation, c.role,
               COALESCE(mc_v.count, 0) AS viability,
               COALESCE(mc_p.count, 0) AS permeability,
               COALESCE(mc_t.count, 0) AS tg,
               COALESCE(fc.count, 0) AS findings,
               COALESCE(pc.count, 0) AS papers,
               COALESCE(tc.count, 0) AS tissues
        FROM compounds c
        LEFT JOIN metric_counts mc_v ON mc_v.compound_id = c.id AND mc_v.metric = 'viability'
        LEFT JOIN metric_counts mc_p ON mc_p.compound_id = c.id AND mc_p.metric IN ('permeability_cpa', 'permeability_water')
        LEFT JOIN metric_counts mc_t ON mc_t.compound_id = c.id AND mc_t.metric = 'tg'
        LEFT JOIN finding_counts fc ON fc.compound_id = c.id
        LEFT JOIN paper_counts pc ON pc.compound_id = c.id
        LEFT JOIN tissue_counts tc ON tc.compound_id = c.id
        WHERE c.role IN ('penetrating', 'non_penetrating', 'ice_blocker')
        ORDER BY c.role, COALESCE(fc.count, 0) DESC, c.name
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/protocol-findings")
async def protocol_findings(
    limit: int = 50,
    offset: int = 0,
    search: str | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    conditions = ["f.category = 'protocol_innovation'"]
    params: dict = {"limit": limit, "offset": offset}

    if search:
        conditions.append("""
            (to_tsvector('english', f.claim) @@ plainto_tsquery('english', :search)
             OR f.claim ILIKE :search_like)
        """)
        params["search"] = search
        params["search_like"] = f"%{search}%"

    where = "WHERE " + " AND ".join(conditions)

    count_result = await session.execute(
        text(f"SELECT COUNT(*) FROM findings f {where}"), params,
    )
    total = count_result.scalar()

    result = await session.execute(text(f"""
        SELECT f.id, f.claim, f.details, f.confidence,
               f.tissue_type, f.organism, f.cell_type,
               f.paper_doi, p.title AS paper_title, p.year AS paper_year
        FROM findings f
        JOIN papers p ON f.paper_doi = p.doi
        {where}
        ORDER BY p.year DESC, f.id DESC
        LIMIT :limit OFFSET :offset
    """), params)

    return {
        "total": total,
        "items": [dict(r) for r in result.mappings().all()],
    }
