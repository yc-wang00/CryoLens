"""Mock extraction tests."""

from app.services.extraction import mock_extract_knowledge


def test_mock_extract_knowledge_detects_known_benchmarks() -> None:
    """Known structures and components should be recognized heuristically."""
    payload = mock_extract_knowledge(
        text="VS55 uses DMSO, propylene glycol, and formamide in a benchmark mix.",
        instruction="Extract CPA structures and evidence.",
        filename="benchmark.pdf",
    )

    assert any(structure.name == "VS55" for structure in payload.cpa_structures)
    assert any(entry.name == "formamide" for entry in payload.replacement_entries)
    assert payload.findings[0].metric_type == "document_summary"

