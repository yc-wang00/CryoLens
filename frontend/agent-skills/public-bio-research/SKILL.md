---
name: public-bio-research
description: Use when the user wants lightweight biomedical or cryobiology research grounded in public, no-key sources such as PubChem, ChEMBL, AlphaFold DB, ZINC, or CryoDB if accessible. Best for compound lookups, bioactivity context, structural context, purchasable-compound discovery, and early-stage evidence gathering without heavy simulation.
---

# Public Bio Research

Use this skill for lightweight research questions where public databases are enough and heavy compute is not required.

## Use This Skill When

- The user asks about a compound, cryoprotectant, target, assay, structure, or purchasable analog.
- The task should prefer public or no-key data sources first.
- The goal is evidence gathering, comparison, or shortlisting rather than simulation.
- The user is exploring feasibility and does not yet need docking, MD, or ML training.

## Do Not Use This Skill For

- Molecular dynamics runs
- Docking jobs
- RDKit descriptor pipelines
- DeepChem model training
- Anything that depends on paid or unavailable APIs

Use a heavier compute skill for those.

## Preferred Source Order

1. CryoSight or project-native MCP/data sources if they already answer the question.
2. Public chemistry and bioactivity databases:
   - PubChem for identifiers, properties, synonyms, and linked assays
   - ChEMBL for bioactivity and target context
   - AlphaFold DB for structure lookup and structural context
   - ZINC for purchasable-compound discovery and screening candidates
3. CryoDB only if it is actually reachable and provides relevant cryoprotectant-specific evidence.

If a source is unavailable, say so plainly and continue with the remaining public sources.

## Expected Tool Surfaces

This skill assumes at least one of these exists:

- an MCP server exposing the databases above
- HTTP tools or adapters for public APIs
- a lightweight Python runtime with `requests` and simple helper scripts

This skill does not assume heavy native chemistry or simulation packages.

## Minimal Runtime Assumption

If implemented through Python helpers, the minimum useful dependency set is:

```txt
python
requests
httpx
pydantic
pandas
```

Optional later additions:

```txt
biopython
numpy
```

## Workflow

1. Clarify the entity.
   - Normalize names, aliases, abbreviations, and identifiers.
2. Pull only the minimum evidence needed.
   - Prefer exact identifiers and curated properties over broad web search.
3. Separate source-backed facts from inference.
4. If comparing candidates, rank them with explicit criteria such as:
   - availability
   - known properties
   - known bioactivity or toxicity context
   - structural plausibility
   - evidence quality
5. Stop before heavy compute.
   - If the next step requires docking, MD, or descriptor generation, say that explicitly and hand off to a compute-oriented skill.

## Output Shape

Use this structure unless the user asks for something else:

### Direct Answer

One short paragraph answering the question.

### Retrieved Facts

- Only source-backed claims

### Inference

- Best-supported interpretation
- Label uncertainty clearly

### Best Next Public Lookup

- Name the next database or query that would reduce uncertainty without heavy compute

### When To Escalate

- State whether the question now needs RDKit, docking, MD, or other compute workflows

## Guardrails

- Do not invent availability or purchasability.
- Do not overstate what AlphaFold DB implies about membrane interaction or cryoprotectant behavior.
- Do not confuse compound properties with experimental cryopreservation outcomes.
- If direct cryobiology evidence is thin, say so and keep the answer decision-oriented.
