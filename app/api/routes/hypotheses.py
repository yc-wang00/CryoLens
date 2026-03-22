"""Hypothesis endpoints — serves AI-designed CPA hypotheses with evidence chains."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/hypotheses", tags=["hypotheses"])


@router.get("", summary="List all hypotheses with components and evidence counts")
async def list_hypotheses(
    session: AsyncSession = Depends(get_async_session),
) -> list[dict]:
    result = await session.execute(text("""
        SELECT h.id, h.name, h.tagline, h.target_tissue, h.target_organism,
               h.status, h.total_cpa_concentration, h.concentration_unit,
               h.carrier_solution, h.mechanism_summary, h.advantages, h.risks,
               h.protocol_summary, h.evidence_score, h.evidence_paper_count,
               h.evidence_finding_count, h.markdown, h.created_at,
               (SELECT COUNT(*) FROM hypothesis_components WHERE hypothesis_id = h.id) as component_count,
               (SELECT COUNT(*) FROM hypothesis_evidence WHERE hypothesis_id = h.id) as evidence_count
        FROM hypotheses h
        ORDER BY h.evidence_score DESC
    """))
    rows = result.mappings().all()
    return [dict(r) for r in rows]


@router.get("/{hypothesis_id}", summary="Get full hypothesis with components and evidence")
async def get_hypothesis(
    hypothesis_id: str,
    session: AsyncSession = Depends(get_async_session),
) -> dict:
    # Hypothesis
    result = await session.execute(
        text("SELECT * FROM hypotheses WHERE id = :id"),
        {"id": hypothesis_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    hypothesis = dict(row)

    # Components
    result = await session.execute(
        text("""
            SELECT hc.compound_name, hc.compound_id, hc.concentration,
                   hc.concentration_unit, hc.role, hc.rationale
            FROM hypothesis_components hc
            WHERE hc.hypothesis_id = :id
            ORDER BY hc.id
        """),
        {"id": hypothesis_id},
    )
    hypothesis["components"] = [dict(r) for r in result.mappings().all()]

    # Evidence with finding details
    result = await session.execute(
        text("""
            SELECT he.finding_id, he.component_name, he.relevance,
                   he.evidence_type, he.confidence,
                   f.claim, f.category, f.paper_doi, f.source_location,
                   f.tissue_type, f.organism,
                   p.title as paper_title, p.year as paper_year, p.journal
            FROM hypothesis_evidence he
            LEFT JOIN findings f ON he.finding_id = f.id
            LEFT JOIN papers p ON f.paper_doi = p.doi
            WHERE he.hypothesis_id = :id
            ORDER BY he.id
        """),
        {"id": hypothesis_id},
    )
    hypothesis["evidence"] = [dict(r) for r in result.mappings().all()]

    return hypothesis
