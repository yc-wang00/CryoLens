"""Findings REST endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/findings", tags=["findings"])


@router.get("")
async def list_findings(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    category: str | None = None,
    organism: str | None = None,
    tissue_type: str | None = None,
    confidence: str | None = None,
    search: str | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    conditions = []
    params: dict = {"limit": limit, "offset": offset}

    if category:
        conditions.append("f.category = :category")
        params["category"] = category
    if organism:
        conditions.append("f.organism ILIKE :organism")
        params["organism"] = f"%{organism}%"
    if tissue_type:
        conditions.append("f.tissue_type ILIKE :tissue_type")
        params["tissue_type"] = f"%{tissue_type}%"
    if confidence:
        conditions.append("f.confidence = :confidence")
        params["confidence"] = confidence
    if search:
        conditions.append("""
            (to_tsvector('english', f.claim) @@ plainto_tsquery('english', :search)
             OR to_tsvector('english', coalesce(f.details, '')) @@ plainto_tsquery('english', :search))
        """)
        params["search"] = search

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_result = await session.execute(
        text(f"SELECT COUNT(*) FROM findings f {where}"), params,
    )
    total = count_result.scalar()

    order = (
        "ts_rank(to_tsvector('english', f.claim), plainto_tsquery('english', :search)) DESC"
        if search else "f.id DESC"
    )

    result = await session.execute(
        text(f"""
            SELECT f.id, f.category, f.claim, f.details, f.confidence,
                   f.tissue_type, f.organism, f.source_location,
                   f.paper_doi, p.title AS paper_title, p.year AS paper_year,
                   array_agg(DISTINCT ft.tag) FILTER (WHERE ft.tag IS NOT NULL) AS tags
            FROM findings f
            JOIN papers p ON f.paper_doi = p.doi
            LEFT JOIN finding_tags ft ON ft.finding_id = f.id
            {where}
            GROUP BY f.id, p.title, p.year
            ORDER BY {order}
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


@router.get("/categories")
async def list_categories(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT category, COUNT(*) AS count
        FROM findings
        GROUP BY category
        ORDER BY count DESC
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/tags/top")
async def top_tags(
    limit: int = Query(30, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        text("""
            SELECT tag, COUNT(*) AS count
            FROM finding_tags
            GROUP BY tag
            ORDER BY count DESC
            LIMIT :limit
        """),
        {"limit": limit},
    )
    return [dict(r) for r in result.mappings().all()]
