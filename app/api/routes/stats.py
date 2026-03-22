"""Database statistics endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


@router.get("")
async def get_stats(
    session: AsyncSession = Depends(get_async_session),
):
    counts_result = await session.execute(text("""
        SELECT 'papers' AS tbl, COUNT(*) AS n FROM papers
        UNION ALL SELECT 'compounds', COUNT(*) FROM compounds
        UNION ALL SELECT 'findings', COUNT(*) FROM findings
        UNION ALL SELECT 'measurements', COUNT(*) FROM measurements
        UNION ALL SELECT 'formulations', COUNT(*) FROM formulations
        UNION ALL SELECT 'protocols', COUNT(*) FROM protocols
        UNION ALL SELECT 'finding_tags', COUNT(*) FROM finding_tags
    """))
    counts = {r["tbl"]: r["n"] for r in counts_result.mappings().all()}

    years_result = await session.execute(text("""
        SELECT year, COUNT(*) AS papers, 0 AS findings
        FROM papers GROUP BY year
        ORDER BY year
    """))
    papers_by_year = [dict(r) for r in years_result.mappings().all()]

    findings_by_year_result = await session.execute(text("""
        SELECT p.year, COUNT(f.id) AS findings
        FROM findings f
        JOIN papers p ON f.paper_doi = p.doi
        GROUP BY p.year
        ORDER BY p.year
    """))
    findings_by_year = {r["year"]: r["findings"] for r in findings_by_year_result.mappings().all()}

    for entry in papers_by_year:
        entry["findings"] = findings_by_year.get(entry["year"], 0)

    top_categories_result = await session.execute(text("""
        SELECT category, COUNT(*) AS count
        FROM findings GROUP BY category
        ORDER BY count DESC LIMIT 10
    """))
    top_categories = [dict(r) for r in top_categories_result.mappings().all()]

    top_tags_result = await session.execute(text("""
        SELECT tag, COUNT(*) AS count
        FROM finding_tags GROUP BY tag
        ORDER BY count DESC LIMIT 20
    """))
    top_tags = [dict(r) for r in top_tags_result.mappings().all()]

    top_organisms_result = await session.execute(text("""
        SELECT organism, COUNT(*) AS count
        FROM findings
        WHERE organism IS NOT NULL AND organism != ''
        GROUP BY organism
        ORDER BY count DESC LIMIT 10
    """))
    top_organisms = [dict(r) for r in top_organisms_result.mappings().all()]

    return {
        "counts": counts,
        "papers_by_year": papers_by_year,
        "top_categories": top_categories,
        "top_tags": top_tags,
        "top_organisms": top_organisms,
    }
