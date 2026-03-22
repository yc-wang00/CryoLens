"""
MOCK KNOWLEDGE EXTRACTION
=========================
Purpose

Turn raw document text into the normalized CryoLens MVP knowledge payload.

KEY CONCEPTS:
- the scaffold uses heuristics instead of an LLM provider
- the extraction contract is already typed and isolated for replacement
- normalized writes target the MVP tables only

USAGE:
- call `mock_extract_knowledge()` from `app/services/ingestion.py`

MEMORY REFERENCES:
- MEM-0001
"""

import re

from app.schemas.knowledge import (
    ExtractedFinding,
    ExtractedReplacement,
    ExtractedStructure,
    NormalizedKnowledgePayload,
)

KNOWN_STRUCTURES: dict[str, dict[str, object]] = {
    "VS55": {
        "structure_type": "benchmark",
        "components_json": [
            {"name": "dmso", "concentration_M": 3.1, "role": "penetrating"},
            {"name": "propylene_glycol", "concentration_M": 2.2, "role": "penetrating"},
            {"name": "formamide", "concentration_M": 3.1, "role": "penetrating"},
        ],
        "component_roles_json": {
            "dmso": "penetrating",
            "propylene_glycol": "penetrating",
            "formamide": "penetrating",
        },
        "tissue_tags_json": [
            "blood_vessels",
            "articular_cartilage",
            "ovarian_tissue",
        ],
        "notes": "Mock-extracted benchmark formulation placeholder.",
    },
    "DP6": {
        "structure_type": "benchmark",
        "components_json": [
            {"name": "dmso", "concentration_M": 3.0, "role": "penetrating"},
            {"name": "propylene_glycol", "concentration_M": 3.0, "role": "penetrating"},
        ],
        "component_roles_json": {
            "dmso": "penetrating",
            "propylene_glycol": "penetrating",
        },
        "tissue_tags_json": ["articular_cartilage", "blood_vessels"],
        "notes": "Mock-extracted benchmark formulation placeholder.",
    },
    "M22": {
        "structure_type": "benchmark",
        "components_json": [
            {"name": "dmso", "concentration_M": 2.855, "role": "penetrating"},
            {"name": "formamide", "concentration_M": 2.855, "role": "penetrating"},
            {
                "name": "ethylene_glycol",
                "concentration_M": 2.713,
                "role": "penetrating",
            },
            {
                "name": "n_methylformamide",
                "concentration_M": 0.508,
                "role": "penetrating",
            },
            {
                "name": "3_methoxy_propanediol",
                "concentration_M": 0.377,
                "role": "penetrating",
            },
            {"name": "pvp", "pct_wv": 2.8, "role": "non_penetrating_polymer"},
            {"name": "x1000", "pct_wv": 1.0, "role": "ice_blocker"},
            {"name": "z1000", "pct_wv": 2.0, "role": "ice_blocker"},
        ],
        "component_roles_json": {
            "dmso": "penetrating",
            "formamide": "penetrating",
            "ethylene_glycol": "penetrating",
            "n_methylformamide": "penetrating",
            "3_methoxy_propanediol": "penetrating",
            "pvp": "non_penetrating_polymer",
            "x1000": "ice_blocker",
            "z1000": "ice_blocker",
        },
        "tissue_tags_json": [
            "whole_kidney",
            "kidney_cortical_slices",
            "hippocampal_brain_slices",
        ],
        "notes": "Mock-extracted benchmark formulation placeholder.",
    },
}

KNOWN_REPLACEMENTS: dict[str, dict[str, object]] = {
    "dmso": {
        "aliases_json": ["DMSO", "dimethyl sulfoxide"],
        "class_name": "sulfoxide",
        "simple_descriptors_json": {"role_hint": "penetrating"},
    },
    "formamide": {
        "aliases_json": ["methanamide"],
        "class_name": "amide",
        "simple_descriptors_json": {"role_hint": "penetrating"},
    },
    "propylene_glycol": {
        "aliases_json": ["1,2-propanediol", "PG"],
        "class_name": "glycol",
        "simple_descriptors_json": {"role_hint": "penetrating"},
    },
    "ethylene_glycol": {
        "aliases_json": ["EG"],
        "class_name": "glycol",
        "simple_descriptors_json": {"role_hint": "penetrating"},
    },
    "pvp": {
        "aliases_json": ["polyvinylpyrrolidone"],
        "class_name": "polymer",
        "simple_descriptors_json": {"role_hint": "non_penetrating_polymer"},
    },
}


def _normalize_for_match(value: str) -> str:
    """Normalize text so simple heuristic matching is less brittle."""
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _matches_term(normalized_text: str, term: str) -> bool:
    """Return True when a normalized term appears in the normalized text."""
    return _normalize_for_match(term) in normalized_text


def mock_extract_knowledge(
    *,
    text: str,
    instruction: str | None,
    filename: str,
) -> NormalizedKnowledgePayload:
    """Return a typed mocked extraction payload from raw document text."""
    normalized_text = _normalize_for_match(text)

    structures = [
        ExtractedStructure(name=name, **payload)
        for name, payload in KNOWN_STRUCTURES.items()
        if _matches_term(normalized_text, name)
    ]

    replacements: list[ExtractedReplacement] = []
    for name, payload in KNOWN_REPLACEMENTS.items():
        aliases = payload["aliases_json"]
        if _matches_term(normalized_text, name) or any(
            _matches_term(normalized_text, alias) for alias in aliases
        ):
            replacements.append(
                ExtractedReplacement(
                    entry_type="molecule",
                    name=name,
                    aliases_json=list(aliases),
                    class_name=str(payload["class_name"]),
                    simple_descriptors_json=dict(payload["simple_descriptors_json"]),
                    notes="Mock extracted candidate from heuristic matcher.",
                )
            )

    summary_excerpt = " ".join(text.split())[:320]
    if not summary_excerpt:
        summary_excerpt = "No summary could be extracted from the PDF text."

    # TODO: Replace this heuristic extraction with a provider-backed structured
    # extraction flow once the production prompt, schema contract, and model
    # selection are finalized.
    findings = [
        ExtractedFinding(
            source_type="paper",
            source_title=filename,
            citation=f"Mock citation for {filename}",
            tissue="unknown",
            modality="document_ingestion",
            component_names_json=[entry.name for entry in replacements],
            candidate_names_json=[entry.name for entry in structures],
            metric_type="document_summary",
            finding_summary=(
                f"Mock extraction summary. Instruction={instruction or 'none'}; "
                f"excerpt={summary_excerpt}"
            ),
            source_location="mock_extractor",
            confidence=0.25,
        )
    ]

    return NormalizedKnowledgePayload(
        cpa_structures=structures,
        replacement_entries=replacements,
        findings=findings,
    )
