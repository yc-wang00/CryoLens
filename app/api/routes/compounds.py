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
