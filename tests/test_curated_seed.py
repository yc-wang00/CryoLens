"""Curated bootstrap seed tests."""

from app.services.curated_seed import (
    build_document_search_text,
    build_finding_search_text,
    build_replacement_search_text,
    load_curated_seed,
)


def test_curated_seed_payload_has_expected_shape() -> None:
    """The curated bootstrap payload should load and expose the key demo rows."""
    payload = load_curated_seed()

    assert len(payload.documents) == 4
    assert len(payload.cpa_structures) >= 4
    assert len(payload.replacement_entries) >= 20
    assert len(payload.findings) >= 20
    assert any(structure.name == "VS55" for structure in payload.cpa_structures)
    assert any(entry.name == "formamide" for entry in payload.replacement_entries)
    assert any(
        finding.metric_type == "viability_percent"
        and "97 percent viability" in finding.finding_summary
        for finding in payload.findings
    )


def test_curated_search_text_builders_include_key_context() -> None:
    """Search text should preserve names, source metadata, and assay conditions."""
    payload = load_curated_seed()
    source_by_key = {document.seed_key: document for document in payload.documents}

    document = source_by_key["ahmadkhani_2025_sci_rep"]
    document_search_text = build_document_search_text(document)
    assert document.title in document_search_text
    assert "doi 10.1038/s41598-025-85509-x" in document_search_text

    replacement = next(
        entry for entry in payload.replacement_entries if entry.name == "glycerol"
    )
    replacement_search_text = build_replacement_search_text(replacement)
    assert "GLY" in replacement_search_text
    assert "slowest" in replacement_search_text.lower()

    finding = next(
        item
        for item in payload.findings
        if item.metric_type == "viability_percent"
        and "formamide plus glycerol" in item.finding_summary
    )
    finding_search_text = build_finding_search_text(
        finding,
        source_by_key[finding.source_seed_key],
    )
    assert "temperature_c=4" in finding_search_text
    assert "formamide" in finding_search_text
    assert "glycerol" in finding_search_text
