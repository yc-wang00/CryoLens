"""Database statistics and timeline endpoint."""

from collections import defaultdict

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

    # Papers by year
    papers_result = await session.execute(text("""
        SELECT year, COUNT(*) AS papers FROM papers GROUP BY year ORDER BY year
    """))
    papers_by_year = {r["year"]: r["papers"] for r in papers_result.mappings().all()}

    # Findings by year
    findings_result = await session.execute(text("""
        SELECT p.year, COUNT(f.id) AS findings
        FROM findings f JOIN papers p ON f.paper_doi = p.doi
        GROUP BY p.year ORDER BY p.year
    """))
    findings_by_year = {r["year"]: r["findings"] for r in findings_result.mappings().all()}

    # Experiments by year
    experiments_result = await session.execute(text("""
        SELECT p.year, COUNT(e.id) AS experiments
        FROM experiments e JOIN papers p ON e.paper_doi = p.doi
        GROUP BY p.year ORDER BY p.year
    """))
    experiments_by_year = {r["year"]: r["experiments"] for r in experiments_result.mappings().all()}

    # Build yearly timeline with cumulative counts
    all_years = sorted(set(papers_by_year) | set(findings_by_year))
    cumulative_papers = 0
    cumulative_findings = 0
    yearly = []
    for year in all_years:
        p = papers_by_year.get(year, 0)
        f = findings_by_year.get(year, 0)
        e = experiments_by_year.get(year, 0)
        cumulative_papers += p
        cumulative_findings += f
        yearly.append({
            "year": year,
            "papers": p,
            "findings": f,
            "experiments": e,
            "cumulativePapers": cumulative_papers,
            "cumulativeFindings": cumulative_findings,
        })

    # Top categories with share percentage
    top_categories_result = await session.execute(text("""
        SELECT category, COUNT(*) AS count FROM findings GROUP BY category ORDER BY count DESC LIMIT 10
    """))
    top_categories_raw = [dict(r) for r in top_categories_result.mappings().all()]
    total_findings = counts.get("findings", 1)
    top_categories = [
        {
            "label": cat["category"].replace("_", " "),
            "count": cat["count"],
            "sharePct": round((cat["count"] / total_findings) * 100, 1),
        }
        for cat in top_categories_raw
    ]

    # Formulation milestones
    milestones_result = await session.execute(text("""
        SELECT f.id, f.name, f.year_introduced, f.description, f.notes, f.reference_doi,
               p.title AS reference_title
        FROM formulations f
        LEFT JOIN papers p ON f.reference_doi = p.doi
        WHERE f.year_introduced IS NOT NULL
        ORDER BY f.year_introduced, f.name
    """))
    milestones_raw = [dict(r) for r in milestones_result.mappings().all()]

    # Get components for milestones
    milestone_ids = [m["id"] for m in milestones_raw]
    components_by_formulation: dict[str, list[str]] = defaultdict(list)
    if milestone_ids:
        comps_result = await session.execute(text("""
            SELECT fc.formulation_id, c.name
            FROM formulation_components fc
            JOIN compounds c ON c.id = fc.compound_id
            WHERE fc.formulation_id = ANY(:ids)
        """), {"ids": milestone_ids})
        for r in comps_result.mappings().all():
            components_by_formulation[str(r["formulation_id"])].append(r["name"])

    # Count findings per formulation
    findings_by_formulation: dict[str, int] = defaultdict(int)
    if milestone_ids:
        ff_result = await session.execute(text("""
            SELECT formulation_id, COUNT(*) AS count
            FROM findings
            WHERE formulation_id = ANY(:ids)
            GROUP BY formulation_id
        """), {"ids": milestone_ids})
        for r in ff_result.mappings().all():
            findings_by_formulation[str(r["formulation_id"])] = r["count"]

    milestones = []
    for m in milestones_raw:
        fid = str(m["id"])
        name = str(m["name"])
        is_benchmark = name.lower().startswith(("vs", "m22", "dp", "pvs", "vm"))
        milestones.append({
            "id": fid,
            "name": name,
            "year": m["year_introduced"],
            "type": "benchmark" if is_benchmark else "mixture",
            "note": str(m.get("description") or m.get("notes") or ", ".join(components_by_formulation.get(fid, [])[:3]) or "Formulation milestone"),
            "referenceDoi": m.get("reference_doi"),
            "referenceTitle": m.get("reference_title"),
            "components": components_by_formulation.get(fid, []),
            "linkedFindings": findings_by_formulation.get(fid, 0),
        })

    # Derive summary fields
    formulation_years = [m["year"] for m in milestones]
    paper_years = list(papers_by_year.keys())

    top_tags_result = await session.execute(text("""
        SELECT tag, COUNT(*) AS count FROM finding_tags GROUP BY tag ORDER BY count DESC LIMIT 20
    """))
    top_tags = [dict(r) for r in top_tags_result.mappings().all()]

    return {
        "counts": counts,
        "story": {
            "firstPaperYear": min(paper_years) if paper_years else None,
            "firstFormulationYear": min(formulation_years) if formulation_years else None,
            "lastYear": max(all_years) if all_years else None,
            "yearly": yearly,
            "milestones": milestones,
            "topFindingCategories": top_categories,
        },
        "top_tags": top_tags,
    }
