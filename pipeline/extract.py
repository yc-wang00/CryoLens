"""
CryoSight Extraction Pipeline
Processes scientific papers into structured CPA formulation data.

Usage:
    # Extract from a local PDF
    python extract.py --pdf paper.pdf --output output.json

    # Extract from PubMed ID (requires full text access)
    python extract.py --pmid 35276219 --output output.json

    # Batch extract from a list of PMIDs
    python extract.py --pmid-list pmids.txt --output-dir ./extracted/

    # Extract from a text file (already converted from PDF)
    python extract.py --text paper.txt --output output.json
"""

import json
import sys
import os
import argparse
from pathlib import Path

# --- Extraction prompt ---
EXTRACTION_SYSTEM_PROMPT = """You are a scientific data extraction system for cryopreservation research. Your task is to extract ALL cryoprotective agent (CPA) formulation data from the given paper into a structured JSON format.

EXTRACT EVERY FORMULATION mentioned in the paper. A formulation is any combination of cryoprotective agents used in an experiment, with specific concentrations.

For each formulation found, extract:

1. COMPOSITION: Every component, its concentration (in M, mM, % w/v, % w/w, or % v/v as reported), and its role (penetrating CPA, non-penetrating CPA, ice blocker, carrier, polymer, sugar, etc.)

2. THERMAL PROPERTIES (if measured):
   - Tg (glass transition temperature) in °C
   - CCR (critical cooling rate) in °C/min
   - CWR (critical warming rate) in °C/min
   - Tm (melting temperature) if reported
   - Td (devitrification temperature) if reported

3. BIOLOGICAL OUTCOMES (if tested):
   - Tissue/cell type
   - Organism/species
   - Viability metric used
   - Viability value (quantitative if available)
   - Recovery endpoint
   - Protocol summary

4. TOXICITY DATA (if reported):
   - Cell/tissue type tested
   - Exposure conditions
   - Toxicity metric and value

5. SOURCE LOCATION: Which table, figure, or section contains this data

OUTPUT FORMAT: Return ONLY valid JSON. Use this schema:

{
  "paper": {
    "title": "exact title",
    "authors": ["author1", "author2"],
    "year": 2024,
    "journal": "journal name",
    "doi": "doi if available",
    "pmid": "pubmed id if available"
  },
  "formulations": [
    {
      "name": "formulation name or identifier",
      "components": [
        {
          "name": "component name as written in paper",
          "name_normalized": "canonical_lowercase_name",
          "concentration": 3.1,
          "unit": "M",
          "pct_wv": null,
          "role": "penetrating"
        }
      ],
      "total_concentration": {"value": 8.4, "unit": "M"},
      "carrier_solution": "carrier if mentioned",
      "thermal_properties": {
        "Tg_degC": {"value": -123, "method": "DSC", "source": "Table 2"},
        "CCR_degC_per_min": {"value": 2.5, "source": "Figure 3"},
        "CWR_degC_per_min": {"value": 50, "source": "Table 3"}
      },
      "biological_outcomes": [
        {
          "tissue_type": "kidney cortex",
          "organism": "rabbit",
          "viability_metric": "K/Na ratio",
          "viability_value": "80% of control",
          "protocol": "step-wise CPA loading, cooled at 1C/min",
          "source": "Section 3.2"
        }
      ],
      "toxicity": [
        {
          "tissue_type": "HEK293",
          "exposure_time": "30 min",
          "exposure_temp": "0C",
          "metric": "cell viability %",
          "value": 75,
          "source": "Table 4"
        }
      ],
      "notes": "any additional context"
    }
  ],
  "extraction_notes": "any issues or ambiguities"
}

RULES:
- Extract EVERY formulation, even from supplementary material
- If a value is not reported, use null
- Always include source (table/figure/section) for each data point
- Normalize names: DMSO→dmso, ethylene glycol→ethylene_glycol, propylene glycol→propylene_glycol, glycerol→glycerol, formamide→formamide, trehalose→trehalose, sucrose→sucrose, PVP→pvp
- Return ONLY the JSON object, no markdown formatting"""


def extract_with_anthropic(text: str, api_key: str = None) -> dict:
    """Extract CPA data from paper text using Anthropic Claude API."""
    try:
        import anthropic
    except ImportError:
        print("Installing anthropic...")
        os.system(f"{sys.executable} -m pip install anthropic --break-system-packages -q")
        import anthropic

    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set. Set it as env var or pass --api-key")

    client = anthropic.Anthropic(api_key=api_key)

    # Truncate if too long (Claude has context limits)
    max_chars = 180000  # Leave room for prompt + output
    if len(text) > max_chars:
        print(f"  Warning: Paper text truncated from {len(text)} to {max_chars} chars")
        text = text[:max_chars]

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Extract all CPA formulation data from this paper:\n\n{text}"}
        ]
    )

    response_text = message.content[0].text

    # Parse JSON from response (handle potential markdown wrapping)
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1])

    return json.loads(response_text)


def extract_from_pdf(pdf_path: str, api_key: str = None) -> dict:
    """Extract CPA data from a PDF file using Claude's PDF support."""
    try:
        import anthropic
    except ImportError:
        os.system(f"{sys.executable} -m pip install anthropic --break-system-packages -q")
        import anthropic

    import base64

    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key)

    # Read PDF as base64
    with open(pdf_path, "rb") as f:
        pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_data
                        }
                    },
                    {
                        "type": "text",
                        "text": "Extract all CPA formulation data from this paper."
                    }
                ]
            }
        ]
    )

    response_text = message.content[0].text

    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1])

    return json.loads(response_text)


def extract_from_text(text_path: str, api_key: str = None) -> dict:
    """Extract CPA data from a plain text file."""
    with open(text_path, "r") as f:
        text = f.read()
    return extract_with_anthropic(text, api_key)


def validate_extraction(data: dict) -> dict:
    """Validate extracted data and return quality metrics."""
    issues = []
    stats = {
        "formulations": 0,
        "with_components": 0,
        "with_thermal": 0,
        "with_outcomes": 0,
        "with_toxicity": 0,
        "total_components": 0,
        "total_datapoints": 0,
    }

    if "formulations" not in data:
        issues.append("CRITICAL: No 'formulations' key in output")
        return {"valid": False, "issues": issues, "stats": stats}

    for i, f in enumerate(data["formulations"]):
        stats["formulations"] += 1

        # Check components
        if f.get("components") and len(f["components"]) > 0:
            stats["with_components"] += 1
            stats["total_components"] += len(f["components"])
            for c in f["components"]:
                if not c.get("name_normalized"):
                    issues.append(f"Formulation {i}: component missing name_normalized")
                if c.get("concentration") is None and c.get("pct_wv") is None:
                    issues.append(f"Formulation {i}: component '{c.get('name')}' has no concentration")
        else:
            issues.append(f"Formulation {i} '{f.get('name')}': no components")

        # Check thermal properties
        tp = f.get("thermal_properties", {})
        if tp and any(v is not None and v != {} for v in tp.values()):
            stats["with_thermal"] += 1
            for prop_name, prop_val in tp.items():
                if isinstance(prop_val, dict) and prop_val.get("value") is not None:
                    stats["total_datapoints"] += 1

        # Check biological outcomes
        if f.get("biological_outcomes") and len(f["biological_outcomes"]) > 0:
            stats["with_outcomes"] += 1
            stats["total_datapoints"] += len(f["biological_outcomes"])

        # Check toxicity
        if f.get("toxicity") and len(f["toxicity"]) > 0:
            stats["with_toxicity"] += 1
            stats["total_datapoints"] += len(f["toxicity"])

    return {
        "valid": len([i for i in issues if i.startswith("CRITICAL")]) == 0,
        "issues": issues,
        "stats": stats,
        "quality_score": (
            stats["with_components"] / max(stats["formulations"], 1) * 0.4 +
            stats["with_thermal"] / max(stats["formulations"], 1) * 0.3 +
            (stats["with_outcomes"] + stats["with_toxicity"]) / max(stats["formulations"], 1) * 0.3
        )
    }


def main():
    parser = argparse.ArgumentParser(description="CryoSight CPA Extraction Pipeline")
    parser.add_argument("--pdf", help="Path to PDF file")
    parser.add_argument("--text", help="Path to text file")
    parser.add_argument("--pmid", help="PubMed ID to fetch")
    parser.add_argument("--pmid-list", help="File with one PMID per line")
    parser.add_argument("--output", help="Output JSON file path")
    parser.add_argument("--output-dir", help="Output directory for batch processing")
    parser.add_argument("--api-key", help="Anthropic API key")
    parser.add_argument("--validate-only", help="Validate existing extraction JSON", metavar="FILE")
    args = parser.parse_args()

    if args.validate_only:
        with open(args.validate_only) as f:
            data = json.load(f)
        result = validate_extraction(data)
        print(json.dumps(result, indent=2))
        return

    if args.pdf:
        print(f"Extracting from PDF: {args.pdf}")
        data = extract_from_pdf(args.pdf, args.api_key)
    elif args.text:
        print(f"Extracting from text: {args.text}")
        data = extract_from_text(args.text, args.api_key)
    else:
        print("Error: Provide --pdf, --text, or --pmid")
        sys.exit(1)

    # Validate
    validation = validate_extraction(data)
    print(f"\nExtraction Results:")
    print(f"  Formulations found: {validation['stats']['formulations']}")
    print(f"  With components: {validation['stats']['with_components']}")
    print(f"  With thermal data: {validation['stats']['with_thermal']}")
    print(f"  With outcomes: {validation['stats']['with_outcomes']}")
    print(f"  With toxicity: {validation['stats']['with_toxicity']}")
    print(f"  Total datapoints: {validation['stats']['total_datapoints']}")
    print(f"  Quality score: {validation['quality_score']:.2f}")

    if validation["issues"]:
        print(f"\n  Issues ({len(validation['issues'])}):")
        for issue in validation["issues"][:10]:
            print(f"    - {issue}")

    # Save
    output_path = args.output or "extraction_output.json"
    data["_validation"] = validation
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved to {output_path}")


if __name__ == "__main__":
    main()
