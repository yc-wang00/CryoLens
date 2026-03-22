"""Knowledge query helper tests."""

from app.services.knowledge_queries import _build_findings_query


def test_build_findings_query_without_filters_is_minimal() -> None:
    """The query builder should omit WHERE clauses when no filters are passed."""
    query, params = _build_findings_query(limit=3)

    sql = str(query)
    assert "FROM v_findings_headline" in sql
    assert "WHERE" not in sql
    assert params == {"limit": 3}


def test_build_findings_query_adds_only_requested_filters() -> None:
    """The query builder should emit deterministic SQL for active filters."""
    query, params = _build_findings_query(
        query_text="formamide",
        component="glycerol",
        temperature_c=4,
        limit=5,
    )

    sql = str(query)
    assert "search_text ILIKE :query_pattern" in sql
    assert "temperature_c = :temperature_c" in sql
    assert "jsonb_array_elements_text(component_names_json)" in sql
    assert params == {
        "limit": 5,
        "query_pattern": "%formamide%",
        "temperature_c": 4,
        "component": "glycerol",
    }
