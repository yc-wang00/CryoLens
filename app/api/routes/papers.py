"""Papers REST endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/papers", tags=["papers"])


@router.get("")
async def list_papers(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    year: int | None = None,
    journal: str | None = None,
    search: str | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    conditions = []
    params: dict = {"limit": limit, "offset": offset}

    if year:
        conditions.append("p.year = :year")
        params["year"] = year
    if journal:
        conditions.append("p.journal ILIKE :journal")
        params["journal"] = f"%{journal}%"
    if search:
        conditions.append("(p.title ILIKE :search OR p.doi ILIKE :search)")
        params["search"] = f"%{search}%"

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    count_result = await session.execute(
        text(f"SELECT COUNT(*) FROM papers p {where}"), params,
    )
    total = count_result.scalar()

    result = await session.execute(
        text(f"""
            SELECT p.doi, p.title, p.year, p.journal,
                   COUNT(f.id) AS finding_count
            FROM papers p
            LEFT JOIN findings f ON f.paper_doi = p.doi
            {where}
            GROUP BY p.doi
            ORDER BY p.year DESC, p.title
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


@router.get("/{doi:path}")
async def get_paper(
    doi: str,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        text("SELECT * FROM papers WHERE doi = :doi"),
        {"doi": doi},
    )
    paper = result.mappings().first()
    if not paper:
        return {"error": "Paper not found"}, 404

    findings_result = await session.execute(
        text("""
            SELECT f.id, f.category, f.claim, f.details, f.confidence,
                   f.tissue_type, f.organism, f.source_location
            FROM findings f WHERE f.paper_doi = :doi
        """),
        {"doi": doi},
    )
    findings = [dict(r) for r in findings_result.mappings().all()]

    return {**dict(paper), "findings": findings}
