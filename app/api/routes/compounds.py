"""Compounds REST endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/compounds", tags=["compounds"])


@router.get("")
async def list_compounds(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    role: str | None = None,
    search: str | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    conditions = []
    params: dict = {"limit": limit, "offset": offset}

    if role:
        conditions.append("c.role = :role")
        params["role"] = role
    if search:
        conditions.append("(c.name ILIKE :search OR c.abbreviation ILIKE :search)")
        params["search"] = f"%{search}%"

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_result = await session.execute(
        text(f"SELECT COUNT(*) FROM compounds c {where}"), params,
    )
    total = count_result.scalar()

    result = await session.execute(
        text(f"""
            SELECT c.id, c.name, c.abbreviation, c.role,
                   c.molecular_weight, c.smiles, c.cas_number,
                   COUNT(DISTINCT m.id) AS measurement_count,
                   COUNT(DISTINCT e.paper_doi) AS paper_count
            FROM compounds c
            LEFT JOIN solution_components sc ON sc.compound_id = c.id
            LEFT JOIN solutions s ON s.id = sc.solution_id
            LEFT JOIN experiments e ON e.solution_id = s.id
            LEFT JOIN measurements m ON m.experiment_id = e.id
            {where}
            GROUP BY c.id
            ORDER BY measurement_count DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    )
    rows = result.mappings().all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [dict(r) for r in rows],
    }


@router.get("/{compound_id}")
async def get_compound(
    compound_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        text("SELECT * FROM compounds WHERE id = :id"),
        {"id": compound_id},
    )
    compound = result.mappings().first()
    if not compound:
        return {"error": "Compound not found"}, 404

    synonyms_result = await session.execute(
        text("SELECT synonym FROM compound_synonyms WHERE compound_id = :id"),
        {"id": compound_id},
    )
    synonyms = [r["synonym"] for r in synonyms_result.mappings().all()]

    formulations_result = await session.execute(
        text("""
            SELECT f.id, f.name, fc.role_in_formulation
            FROM formulation_components fc
            JOIN formulations f ON f.id = fc.formulation_id
            WHERE fc.compound_id = :id
        """),
        {"id": compound_id},
    )
    formulations = [dict(r) for r in formulations_result.mappings().all()]

    return {**dict(compound), "synonyms": synonyms, "formulations": formulations}


@router.get("/{compound_id}/profile")
async def get_compound_profile(
    compound_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    """Full compound profile for the detail panel."""
    result = await session.execute(
        text("SELECT * FROM compounds WHERE id = :id"),
        {"id": compound_id},
    )
    compound = result.mappings().first()
    if not compound:
        return {"error": "Compound not found"}

    synonyms_result = await session.execute(
        text("SELECT synonym FROM compound_synonyms WHERE compound_id = :id"),
        {"id": compound_id},
    )
    synonyms = [r["synonym"] for r in synonyms_result.mappings().all()]

    viability_result = await session.execute(
        text("""
            SELECT s.total_concentration AS concentration,
                   e.temperature_c, m.value, m.unit,
                   e.cell_type, e.organism, e.paper_doi
            FROM measurements m
            JOIN experiments e ON m.experiment_id = e.id
            JOIN solutions s ON e.solution_id = s.id
            JOIN solution_components sc ON sc.solution_id = s.id
            WHERE sc.compound_id = :id AND m.metric = 'viability'
            ORDER BY s.total_concentration
        """),
        {"id": compound_id},
    )
    viability = [dict(r) for r in viability_result.mappings().all()]

    formulations_result = await session.execute(
        text("""
            SELECT f.id, f.name, f.total_concentration, f.concentration_unit,
                   fc.concentration AS comp_concentration,
                   fc.concentration_unit AS comp_unit,
                   fc.role_in_formulation,
                   COUNT(DISTINCT fi.id) AS finding_count
            FROM formulation_components fc
            JOIN formulations f ON f.id = fc.formulation_id
            LEFT JOIN findings fi ON fi.formulation_id = f.id
            WHERE fc.compound_id = :id
            GROUP BY f.id, fc.concentration, fc.concentration_unit, fc.role_in_formulation
            ORDER BY finding_count DESC
        """),
        {"id": compound_id},
    )
    formulations = [dict(r) for r in formulations_result.mappings().all()]

    findings_result = await session.execute(
        text("""
            SELECT f.id, f.category, f.claim, f.confidence,
                   f.tissue_type, f.organism, f.paper_doi,
                   p.title AS paper_title, p.year AS paper_year
            FROM findings f
            JOIN papers p ON f.paper_doi = p.doi
            WHERE f.formulation_id IN (
                SELECT fc.formulation_id FROM formulation_components fc
                WHERE fc.compound_id = :id
            )
            ORDER BY p.year DESC
            LIMIT 30
        """),
        {"id": compound_id},
    )
    findings = [dict(r) for r in findings_result.mappings().all()]

    category_counts_result = await session.execute(
        text("""
            SELECT f.category, COUNT(*) AS count
            FROM findings f
            WHERE f.formulation_id IN (
                SELECT fc.formulation_id FROM formulation_components fc
                WHERE fc.compound_id = :id
            )
            GROUP BY f.category
            ORDER BY count DESC
        """),
        {"id": compound_id},
    )
    categories = [dict(r) for r in category_counts_result.mappings().all()]

    metrics_result = await session.execute(
        text("""
            SELECT DISTINCT m.metric
            FROM measurements m
            JOIN experiments e ON m.experiment_id = e.id
            JOIN solutions s ON e.solution_id = s.id
            JOIN solution_components sc ON sc.solution_id = s.id
            WHERE sc.compound_id = :id
        """),
        {"id": compound_id},
    )
    available_metrics = [r["metric"] for r in metrics_result.mappings().all()]

    tissues_result = await session.execute(
        text("""
            SELECT DISTINCT f.tissue_type
            FROM findings f
            WHERE f.tissue_type IS NOT NULL
            AND f.formulation_id IN (
                SELECT fc.formulation_id FROM formulation_components fc
                WHERE fc.compound_id = :id
            )
        """),
        {"id": compound_id},
    )
    tissues_tested = [r["tissue_type"] for r in tissues_result.mappings().all()]

    all_metrics = ["viability", "permeability_cpa", "permeability_water", "tg", "ccr"]
    missing_metrics = [m for m in all_metrics if m not in available_metrics]

    return {
        **dict(compound),
        "synonyms": synonyms,
        "viability": viability,
        "formulations": formulations,
        "findings": findings,
        "finding_categories": categories,
        "available_metrics": available_metrics,
        "missing_metrics": missing_metrics,
        "tissues_tested": tissues_tested,
    }
