"""
KNOWLEDGE QUERY HELPERS
=======================
Purpose

Provide SQL-friendly helpers over the curated knowledge seed so operator-driven
QA can use the live Postgres database before a dedicated retrieval API exists.

KEY CONCEPTS:
- query against flattened views instead of unpacking JSON manually each time
- keep result payloads compact and deterministic for agent-driven summarization
- prefer exact scientific filters plus free-text matching over hidden heuristics

USAGE:
- run `python -m app.services.knowledge_queries head documents`
- run `python -m app.services.knowledge_queries findings --component formamide`
- run `python -m app.services.knowledge_queries rescue-partners`
  `formamide --temperature 4`

MEMORY REFERENCES:
- MEM-0002
- MEM-0003
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import SyncSessionLocal

HEAD_QUERIES: dict[str, str] = {
    "documents": """
        SELECT id, title, doi, journal, year
        FROM documents
        ORDER BY year, title
        LIMIT :limit
    """,
    "cpa_structures": """
        SELECT id, name, structure_type, tissue_tags_json, notes
        FROM cpa_structures
        ORDER BY structure_type, name
        LIMIT :limit
    """,
    "replacement_index": """
        SELECT id, name, class_name, aliases_json, simple_descriptors_json
        FROM replacement_index
        ORDER BY class_name NULLS LAST, name
        LIMIT :limit
    """,
    "findings": """
        SELECT
            finding_id,
            source_title,
            metric_type,
            metric_value,
            metric_unit,
            temperature_c,
            concentration_mol_per_kg,
            finding_summary
        FROM v_findings_headline
        ORDER BY year, source_title, metric_type
        LIMIT :limit
    """,
    "structure_components": """
        SELECT
            structure_name,
            structure_type,
            component_name,
            component_role,
            concentration_m,
            concentration_mol_per_kg,
            pct_wv
        FROM v_cpa_structure_components
        ORDER BY structure_name, component_name
        LIMIT :limit
    """,
}


def fetch_table_head(
    session: Session,
    table_name: str,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Return compact example rows for a supported table or view."""
    if table_name not in HEAD_QUERIES:
        available = ", ".join(sorted(HEAD_QUERIES))
        raise ValueError(
            f"Unsupported table name '{table_name}'. Available: {available}"
        )

    result = session.execute(text(HEAD_QUERIES[table_name]), {"limit": limit})
    return [dict(row._mapping) for row in result]


def fetch_structure_components(
    session: Session,
    structure_name: str,
) -> list[dict[str, Any]]:
    """Return flattened component rows for a structure."""
    query = text(
        """
        SELECT
            structure_name,
            structure_type,
            component_name,
            component_role,
            concentration_m,
            concentration_mol_per_kg,
            pct_wv,
            tissue_tags_json,
            notes
        FROM v_cpa_structure_components
        WHERE lower(structure_name) = lower(:structure_name)
        ORDER BY component_name
        """
    )
    result = session.execute(query, {"structure_name": structure_name})
    return [dict(row._mapping) for row in result]


def search_findings(
    session: Session,
    query_text: str | None = None,
    component: str | None = None,
    metric_type: str | None = None,
    temperature_c: float | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Search curated findings with exact filters plus optional free-text matching."""
    query, params = _build_findings_query(
        query_text=query_text,
        component=component,
        metric_type=metric_type,
        temperature_c=temperature_c,
        limit=limit,
    )
    result = session.execute(query, params)
    return [dict(row._mapping) for row in result]


def _build_findings_query(
    query_text: str | None = None,
    component: str | None = None,
    metric_type: str | None = None,
    temperature_c: float | None = None,
    limit: int = 10,
) -> tuple[Any, dict[str, Any]]:
    """Build a typed findings query without NULL-guard bind ambiguity."""
    conditions: list[str] = []
    params: dict[str, Any] = {"limit": limit}

    if query_text:
        conditions.append("search_text ILIKE :query_pattern")
        params["query_pattern"] = f"%{query_text}%"

    if metric_type:
        conditions.append("metric_type = :metric_type")
        params["metric_type"] = metric_type

    if temperature_c is not None:
        conditions.append("temperature_c = :temperature_c")
        params["temperature_c"] = temperature_c

    if component:
        conditions.append(
            """
            EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(component_names_json)
                    AS component_name(value)
                WHERE lower(component_name.value) = lower(:component)
            )
            """
        )
        params["component"] = component

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(
            condition.strip() for condition in conditions
        )

    query = text(
        f"""
        SELECT
            finding_id,
            source_title,
            year,
            tissue,
            modality,
            metric_type,
            metric_value,
            metric_unit,
            temperature_c,
            concentration_mol_per_kg,
            exposure_minutes_text,
            component_names_json,
            candidate_names_json,
            tags_json,
            finding_summary,
            source_location,
            confidence
        FROM v_findings_headline
        {where_clause}
        ORDER BY year, source_title, metric_type
        LIMIT :limit
        """
    )
    return query, params


def get_rescue_partners(
    session: Session,
    target_component: str,
    temperature_c: float | None = None,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Return likely rescue partners drawn from relevant findings rows."""
    relevant_rows = search_findings(
        session=session,
        component=target_component,
        temperature_c=temperature_c,
        limit=100,
    )

    partner_map: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "partner_name": "",
            "support_count": 0,
            "source_titles": set(),
            "metric_types": set(),
            "example_summaries": [],
        }
    )

    rescue_metric_types = {
        "amide_rescue_partner_set",
        "partner_rescue_note",
        "toxicity_reduction_significant",
        "viability_percent",
    }

    for row in relevant_rows:
        if row["metric_type"] not in rescue_metric_types:
            continue

        components = [str(component) for component in row["component_names_json"] or []]
        for partner in components:
            if partner.lower() == target_component.lower():
                continue

            slot = partner_map[partner.lower()]
            slot["partner_name"] = partner
            slot["support_count"] += 1
            slot["source_titles"].add(row["source_title"])
            slot["metric_types"].add(row["metric_type"])
            if len(slot["example_summaries"]) < 2:
                slot["example_summaries"].append(row["finding_summary"])

    ranked = sorted(
        partner_map.values(),
        key=lambda item: (-item["support_count"], item["partner_name"].lower()),
    )
    compact: list[dict[str, Any]] = []
    for item in ranked[:limit]:
        compact.append(
            {
                "partner_name": item["partner_name"],
                "support_count": item["support_count"],
                "source_titles": sorted(item["source_titles"]),
                "metric_types": sorted(item["metric_types"]),
                "example_summaries": item["example_summaries"],
            }
        )
    return compact


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Query the curated CryoLens database."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    head_parser = subparsers.add_parser(
        "head",
        help="Show example rows from a table or view.",
    )
    head_parser.add_argument("table_name", choices=sorted(HEAD_QUERIES))
    head_parser.add_argument("--limit", type=int, default=5)

    structures_parser = subparsers.add_parser(
        "structure",
        help="Show flattened components for a named CPA structure.",
    )
    structures_parser.add_argument("name")

    findings_parser = subparsers.add_parser(
        "findings",
        help="Search findings with optional filters.",
    )
    findings_parser.add_argument("--query-text")
    findings_parser.add_argument("--component")
    findings_parser.add_argument("--metric-type")
    findings_parser.add_argument("--temperature", type=float)
    findings_parser.add_argument("--limit", type=int, default=10)

    rescue_parser = subparsers.add_parser(
        "rescue-partners",
        help="Summarize likely rescue partners for a target component.",
    )
    rescue_parser.add_argument("component")
    rescue_parser.add_argument("--temperature", type=float)
    rescue_parser.add_argument("--limit", type=int, default=10)

    return parser.parse_args()


def main() -> None:
    """Run a small CLI for live database prototyping."""
    args = _parse_args()
    with SyncSessionLocal() as session:
        if args.command == "head":
            payload = fetch_table_head(
                session=session,
                table_name=args.table_name,
                limit=args.limit,
            )
        elif args.command == "structure":
            payload = fetch_structure_components(
                session=session,
                structure_name=args.name,
            )
        elif args.command == "findings":
            payload = search_findings(
                session=session,
                query_text=args.query_text,
                component=args.component,
                metric_type=args.metric_type,
                temperature_c=args.temperature,
                limit=args.limit,
            )
        else:
            payload = get_rescue_partners(
                session=session,
                target_component=args.component,
                temperature_c=args.temperature,
                limit=args.limit,
            )

    print(json.dumps(payload, indent=2, default=str))


if __name__ == "__main__":
    main()
