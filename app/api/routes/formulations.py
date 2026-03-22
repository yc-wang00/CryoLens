"""Formulations REST endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/formulations", tags=["formulations"])


@router.get("")
async def list_formulations(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: str | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    conditions = []
    params: dict = {"limit": limit, "offset": offset}

    if search:
        conditions.append("(f.name ILIKE :search OR f.full_name ILIKE :search)")
        params["search"] = f"%{search}%"

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_result = await session.execute(
        text(f"SELECT COUNT(*) FROM formulations f {where}"), params,
    )
    total = count_result.scalar()

    result = await session.execute(
        text(f"""
            SELECT f.id, f.name, f.full_name, f.total_concentration,
                   f.concentration_unit, f.carrier_solution,
                   f.year_introduced, f.developed_by
            FROM formulations f
            {where}
            ORDER BY f.name
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


@router.get("/{formulation_id}")
async def get_formulation(
    formulation_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        text("SELECT * FROM formulations WHERE id = :id"),
        {"id": formulation_id},
    )
    formulation = result.mappings().first()
    if not formulation:
        return {"error": "Formulation not found"}, 404

    components_result = await session.execute(
        text("""
            SELECT fc.compound_id, c.name AS compound_name,
                   fc.concentration, fc.concentration_unit, fc.role_in_formulation
            FROM formulation_components fc
            JOIN compounds c ON c.id = fc.compound_id
            WHERE fc.formulation_id = :id
            ORDER BY fc.concentration DESC
        """),
        {"id": formulation_id},
    )
    components = [dict(r) for r in components_result.mappings().all()]

    properties_result = await session.execute(
        text("""
            SELECT property, value, unit, measurement_condition
            FROM formulation_properties
            WHERE formulation_id = :id
        """),
        {"id": formulation_id},
    )
    properties = [dict(r) for r in properties_result.mappings().all()]

    return {
        **dict(formulation),
        "components": components,
        "properties": properties,
    }
