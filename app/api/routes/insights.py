"""Data insight endpoints for visualization."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])


@router.get("/tissues")
async def tissue_landscape(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT tissue_type, COUNT(*) AS findings,
               COUNT(DISTINCT paper_doi) AS papers,
               COUNT(DISTINCT organism) AS organisms
        FROM findings
        WHERE tissue_type IS NOT NULL AND tissue_type != ''
        GROUP BY tissue_type
        ORDER BY findings DESC
        LIMIT 25
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/compounds-coverage")
async def compounds_coverage(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT c.id, c.name, c.abbreviation, c.role, c.molecular_weight, c.smiles,
               COUNT(DISTINCT m.id) AS measurements,
               COUNT(DISTINCT e.paper_doi) AS papers,
               COUNT(DISTINCT f.id) AS findings
        FROM compounds c
        LEFT JOIN solution_components sc ON sc.compound_id = c.id
        LEFT JOIN solutions s ON s.id = sc.solution_id
        LEFT JOIN experiments e ON e.solution_id = s.id
        LEFT JOIN measurements m ON m.experiment_id = e.id
        LEFT JOIN findings f ON f.paper_doi = e.paper_doi
        GROUP BY c.id
        ORDER BY c.role, measurements DESC
    """))
    return [dict(r) for r in result.mappings().all()]


@router.get("/organism-tissue")
async def organism_tissue_heatmap(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(text("""
        SELECT organism, tissue_type, COUNT(*) AS findings
        FROM findings
        WHERE organism IS NOT NULL AND organism != ''
          AND tissue_type IS NOT NULL AND tissue_type != ''
        GROUP BY organism, tissue_type
        HAVING COUNT(*) >= 5
        ORDER BY findings DESC
    """))
    rows = [dict(r) for r in result.mappings().all()]

    organisms = sorted(set(r["organism"] for r in rows), key=lambda o: -sum(r["findings"] for r in rows if r["organism"] == o))
    tissues = sorted(set(r["tissue_type"] for r in rows), key=lambda t: -sum(r["findings"] for r in rows if r["tissue_type"] == t))

    return {
        "organisms": organisms[:12],
        "tissues": tissues[:10],
        "cells": rows,
    }
