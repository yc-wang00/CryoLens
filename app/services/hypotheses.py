"""Persistence helpers for saved CryoSight hypothesis drafts."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Hypothesis, HypothesisStatus
from app.schemas.cryo_lens import CryoLensHypothesis
from app.schemas.hypotheses import HypothesisCreateRequest, HypothesisResponse


def _normalize_status(value: str) -> HypothesisStatus:
    try:
        return HypothesisStatus(value)
    except ValueError:
        return HypothesisStatus.draft


def _to_cryo_lens_hypothesis(hypothesis: Hypothesis) -> CryoLensHypothesis:
    return CryoLensHypothesis(
        id=str(hypothesis.id),
        title=hypothesis.title,
        status=hypothesis.status.value,
        benchmark=hypothesis.benchmark or "Unspecified benchmark",
        target=hypothesis.target or "Unspecified target",
        summary=hypothesis.summary,
        evidenceIds=list(hypothesis.evidence_ids_json),
        nextStep=(
            hypothesis.next_step
            or "Review the draft and define the first validation assay."
        ),
    )


async def list_hypothesis_cards(session: AsyncSession) -> list[CryoLensHypothesis]:
    """Return saved hypothesis drafts normalized for the frontend dataset."""
    result = await session.execute(
        select(Hypothesis).order_by(Hypothesis.created_at.desc())
    )
    rows = result.scalars().all()
    return [_to_cryo_lens_hypothesis(row) for row in rows]


async def create_hypothesis(
    session: AsyncSession,
    payload: HypothesisCreateRequest,
) -> HypothesisResponse:
    """Persist a new hypothesis draft and return its public response shape."""
    record = Hypothesis(
        title=payload.title,
        status=_normalize_status(payload.status),
        benchmark=payload.benchmark,
        target=payload.target,
        summary=payload.summary,
        evidence_ids_json=payload.evidence_ids,
        next_step=payload.next_step,
        source_prompt=payload.source_prompt,
        agent_profile=payload.agent_profile,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    normalized = _to_cryo_lens_hypothesis(record)
    return HypothesisResponse(**normalized.model_dump())
