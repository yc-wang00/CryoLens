"""Compound-centric tool implementations: search, details, viability."""

import asyncpg

from engine.db import fetch_all, fetch_one
from engine.models import (
    ActivationEnergy,
    CompoundDetails,
    CompoundResult,
    FindingSummary,
    FormulationRef,
    PermeabilityMeasurement,
    ViabilityMeasurement,
    ViabilityResult,
)


async def search_compounds(
    pool: asyncpg.Pool,
    *,
    query: str | None = None,
    role: str | None = None,
    min_molecular_weight: float | None = None,
    max_molecular_weight: float | None = None,
    has_smiles: bool | None = None,
    limit: int = 20,
) -> list[CompoundResult]:
    conditions = []
    params: list[object] = []
    idx = 1

    if query:
        conditions.append(f"""(
            c.name ILIKE ${idx} OR c.abbreviation ILIKE ${idx}
            OR c.id ILIKE ${idx}
            OR EXISTS (SELECT 1 FROM compound_synonyms cs
                       WHERE cs.compound_id = c.id AND cs.synonym ILIKE ${idx})
        )""")
        params.append(f"%{query}%")
        idx += 1

    if role:
        conditions.append(f"c.role = ${idx}")
        params.append(role)
        idx += 1

    if min_molecular_weight is not None:
        conditions.append(f"c.molecular_weight >= ${idx}")
        params.append(min_molecular_weight)
        idx += 1

    if max_molecular_weight is not None:
        conditions.append(f"c.molecular_weight <= ${idx}")
        params.append(max_molecular_weight)
        idx += 1

    if has_smiles is True:
        conditions.append("c.smiles IS NOT NULL")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    sql = f"""
        SELECT c.id, c.name, c.abbreviation, c.molecular_weight, c.role, c.smiles,
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
        LIMIT ${idx}
    """
    params.append(limit)

    rows = await fetch_all(pool, sql, *params)
    return [CompoundResult(**r) for r in rows]


async def get_compound_details(
    pool: asyncpg.Pool, compound_id: str
) -> CompoundDetails | None:
    row = await fetch_one(
        pool, "SELECT * FROM compounds WHERE id = $1", compound_id,
    )
    if not row:
        return None

    synonyms_rows = await fetch_all(
        pool, "SELECT synonym FROM compound_synonyms WHERE compound_id = $1",
        compound_id,
    )
    synonyms = [r["synonym"] for r in synonyms_rows]

    viability_rows = await fetch_all(pool, """
        SELECT s.total_concentration AS concentration, s.concentration_unit,
               e.temperature_c, e.exposure_time_min, e.cell_type,
               m.value, m.uncertainty, m.data_quality, e.source_location, e.paper_doi
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN solution_components sc ON sc.solution_id = s.id
        WHERE sc.compound_id = $1 AND m.metric = 'viability'
        ORDER BY s.total_concentration
    """, compound_id)

    perm_rows = await fetch_all(pool, """
        SELECT e.temperature_c, m.value, m.unit, e.source_location, e.paper_doi
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN solution_components sc ON sc.solution_id = s.id
        WHERE sc.compound_id = $1 AND m.metric = 'permeability_cpa'
    """, compound_id)

    ea_rows = await fetch_all(pool, """
        SELECT m.metric, m.value, m.unit, e.source_location, e.paper_doi
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN solution_components sc ON sc.solution_id = s.id
        WHERE sc.compound_id = $1 AND m.metric IN ('ea_cpa', 'ea_water')
    """, compound_id)

    form_rows = await fetch_all(pool, """
        SELECT f.id, f.name, fc.role_in_formulation
        FROM formulation_components fc
        JOIN formulations f ON f.id = fc.formulation_id
        WHERE fc.compound_id = $1
    """, compound_id)

    finding_rows = await fetch_all(pool, """
        SELECT f.id, f.category, f.claim, f.confidence
        FROM findings f
        JOIN finding_tags ft ON ft.finding_id = f.id
        WHERE ft.tag ILIKE $1
        LIMIT 10
    """, f"%{compound_id.replace('_', '%')}%")

    missing = []
    if not viability_rows:
        missing.append("No viability data")
    if not perm_rows:
        missing.append("No permeability data")
    if not ea_rows:
        missing.append("No activation energy data")
    if not row.get("smiles"):
        missing.append("No SMILES structure")

    return CompoundDetails(
        id=row["id"],
        name=row["name"],
        abbreviation=row.get("abbreviation"),
        molecular_weight=row.get("molecular_weight"),
        smiles=row.get("smiles"),
        cas_number=row.get("cas_number"),
        role=row["role"],
        synonyms=synonyms,
        viability_data=[ViabilityMeasurement(**r) for r in viability_rows],
        permeability_data=[PermeabilityMeasurement(**r) for r in perm_rows],
        activation_energies=[ActivationEnergy(**r) for r in ea_rows],
        formulations=[FormulationRef(**r) for r in form_rows],
        findings=[FindingSummary(**r) for r in finding_rows],
        missing_data=missing,
    )


async def search_viability(
    pool: asyncpg.Pool,
    *,
    compound_id: str | None = None,
    min_concentration: float | None = None,
    max_concentration: float | None = None,
    temperature_c: float | None = None,
    cell_type: str | None = None,
    min_viability: float | None = None,
    max_viability: float | None = None,
    limit: int = 50,
) -> list[ViabilityResult]:
    conditions = ["m.metric = 'viability'"]
    params: list[object] = []
    idx = 1

    if compound_id:
        conditions.append(f"sc.compound_id = ${idx}")
        params.append(compound_id)
        idx += 1

    if min_concentration is not None:
        conditions.append(f"s.total_concentration >= ${idx}")
        params.append(min_concentration)
        idx += 1

    if max_concentration is not None:
        conditions.append(f"s.total_concentration <= ${idx}")
        params.append(max_concentration)
        idx += 1

    if temperature_c is not None:
        conditions.append(f"e.temperature_c = ${idx}")
        params.append(temperature_c)
        idx += 1

    if cell_type:
        conditions.append(f"e.cell_type ILIKE ${idx}")
        params.append(f"%{cell_type}%")
        idx += 1

    if min_viability is not None:
        conditions.append(f"m.value >= ${idx}")
        params.append(min_viability)
        idx += 1

    if max_viability is not None:
        conditions.append(f"m.value <= ${idx}")
        params.append(max_viability)
        idx += 1

    where = " AND ".join(conditions)

    sql = f"""
        SELECT sc.compound_id, c.name AS compound_name,
               s.total_concentration AS concentration, s.concentration_unit,
               e.temperature_c, e.exposure_time_min, e.cell_type, e.organism,
               m.value AS viability, m.uncertainty, m.data_quality,
               e.source_location, e.paper_doi, p.title AS paper_title
        FROM measurements m
        JOIN experiments e ON m.experiment_id = e.id
        JOIN solutions s ON e.solution_id = s.id
        JOIN papers p ON e.paper_doi = p.doi
        LEFT JOIN solution_components sc ON sc.solution_id = s.id
        LEFT JOIN compounds c ON c.id = sc.compound_id
        WHERE {where}
        ORDER BY m.value DESC
        LIMIT ${idx}
    """
    params.append(limit)

    rows = await fetch_all(pool, sql, *params)
    return [ViabilityResult(**r) for r in rows]
