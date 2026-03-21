"""Integration test for CryoLens MCP server tools against live database."""

import asyncio

from engine.db import create_pool, get_dsn, validate_readonly_sql
from engine.tools import (
    compare_formulations,
    find_gaps,
    get_compound_details,
    get_protocol,
    get_stats,
    query_database,
    search_compounds,
    search_findings,
    search_viability,
)


async def main():
    pool = await create_pool(get_dsn())
    passed = 0
    failed = 0

    async def check(name: str, coro, validate=None):
        nonlocal passed, failed
        try:
            result = await coro
            if validate:
                validate(result)
            print(f"  PASS: {name}")
            passed += 1
        except Exception as e:
            print(f"  FAIL: {name} — {e}")
            failed += 1

    print("=== search_compounds ===")
    await check("all compounds", search_compounds(pool),
                lambda r: assert_true(len(r) > 0, f"got {len(r)} compounds"))
    await check("by role=penetrating", search_compounds(pool, role="penetrating"),
                lambda r: assert_true(all(c.role == "penetrating" for c in r), "role filter"))
    await check("by query=dmso", search_compounds(pool, query="dmso"),
                lambda r: assert_true(any(c.id == "dmso" for c in r), "found DMSO"))
    await check("has_smiles=True", search_compounds(pool, has_smiles=True),
                lambda r: assert_true(all(c.smiles for c in r), "all have SMILES"))

    print("\n=== get_compound_details ===")
    await check("DMSO details", get_compound_details(pool, "dmso"),
                lambda r: assert_true(r and r.name and r.role == "penetrating", f"got {r}"))
    await check("nonexistent", get_compound_details(pool, "fake_compound"),
                lambda r: assert_true(r is None, "should be None"))

    print("\n=== search_viability ===")
    await check("all viability", search_viability(pool),
                lambda r: assert_true(len(r) > 0, f"got {len(r)} results"))
    await check("viability at 4°C", search_viability(pool, temperature_c=4.0),
                lambda r: assert_true(all(v.temperature_c == 4.0 for v in r), "temp filter"))

    print("\n=== compare_formulations ===")
    await check("compare VS55 vs M22", compare_formulations(pool, ["vs55", "m22"]),
                lambda r: assert_true(len(r) == 2, f"got {len(r)} formulations"))
    await check("nonexistent formulation", compare_formulations(pool, ["fake"]),
                lambda r: assert_true(len(r) == 0, "should be empty"))

    print("\n=== search_findings ===")
    await check("search 'kidney'", search_findings(pool, query="kidney"),
                lambda r: assert_true(len(r) > 0, f"got {len(r)} findings"))
    await check("search 'vitrification'", search_findings(pool, query="vitrification"),
                lambda r: assert_true(len(r) > 0, f"got {len(r)} findings"))

    print("\n=== get_protocol ===")
    await check("all protocols", get_protocol(pool),
                lambda r: assert_true(len(r) > 0 and len(r[0].steps) > 0, "has steps"))

    print("\n=== find_gaps ===")
    await check("gaps for viability metric", find_gaps(pool, metric="viability"),
                lambda r: assert_true(len(r.compounds_with_data) > 0, "has data"))
    await check("gaps at 4°C", find_gaps(pool, temperature_c=4.0),
                lambda r: assert_true(r.query_description, "has description"))

    print("\n=== query_database ===")
    await check("valid SELECT", query_database(pool, "SELECT COUNT(*) AS n FROM papers"),
                lambda r: assert_true(isinstance(r, list) and r[0]["n"] > 0, f"got {r}"))
    await check("reject DELETE", query_database(pool, "DELETE FROM papers"),
                lambda r: assert_true(isinstance(r, str) and "Forbidden" in r, f"got {r}"))
    await check("reject INSERT", query_database(pool, "INSERT INTO papers VALUES ('x')"),
                lambda r: assert_true(isinstance(r, str) and "Forbidden" in r, f"got {r}"))

    print("\n=== validate_readonly_sql ===")
    assert validate_readonly_sql("SELECT 1") is None
    assert validate_readonly_sql("WITH cte AS (SELECT 1) SELECT * FROM cte") is None
    assert validate_readonly_sql("DROP TABLE papers") is not None
    assert validate_readonly_sql("") is not None
    print("  PASS: SQL validation")
    passed += 1

    print("\n=== get_stats ===")
    await check("stats overview", get_stats(pool),
                lambda r: assert_true(r.total_papers > 0 and r.total_compounds > 0, f"papers={r.total_papers}"))

    await pool.close()
    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed")
    return failed


def assert_true(condition, msg=""):
    if not condition:
        raise AssertionError(msg)


if __name__ == "__main__":
    exit(asyncio.run(main()))
