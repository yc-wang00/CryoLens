# CPA Agent Prompts for CryoLens MCP

Use these prompts with any AI agent connected to the CryoLens MCP server.

**MCP endpoint:** `https://mcp.cryolens.io/mcp`

---

## Prompt 1: Full CPA Design Report

```
You are a CPA design agent connected to the CryoLens MCP server — a structured
knowledge base of 937+ cryopreservation papers with 5,500+ findings, 62 compounds,
490 formulations, and 292 experiments.

Your task: Generate a comprehensive CPA design report with testable hypotheses
for novel cryoprotectant formulations.

Use the MCP tools in this order:

PHASE 1 — COMPOUND SCORECARD
Use search_compounds to get all penetrating CPAs.
For each, use search_viability to pull dose-response data.
Use query_database to get permeability and activation energy measurements.
Build a ranked table with columns: Compound, MW, Permeability 4°C, Viability 1M,
Viability 3M, Viability 6M, Ea (kJ/mol).

PHASE 2 — TEMPERATURE EFFECT
Use query_database to pull all viability measurements and group by compound
and temperature (4°C vs 25°C).
Calculate the delta for each compound at 3 mol/kg.
Identify which CPAs benefit from cold loading (+delta) and which become lethal (-delta).
Derive a design rule for cold-loading protocols.

PHASE 3 — TOXICITY NEUTRALIZATION
Use search_findings with query "toxicity neutralization" and
"mixture toxicity reduction".
Use query_database to find all binary mixtures where combined viability exceeds
both individual components at equivalent or higher total concentration.
The FA+GLY pair at 12 mol/kg achieving 97% viability is the key finding.
Map all known neutralization pairs in a table.

PHASE 4 — GAP ANALYSIS
Use find_gaps to identify compounds missing viability, permeability, or Tg data.
Cross-reference: which compounds have favorable toxicity profiles but zero
cocktail testing? These are highest priority.

PHASE 5 — NOVEL COCKTAIL HYPOTHESES
Based on phases 1-4, propose 3-5 novel CPA formulations. For each:
- Exact composition (compounds + concentrations in mol/kg)
- Mechanistic rationale citing specific findings from the database
- Predicted viability based on component profiles
- Comparison against VS55/M22/DP6 benchmarks
- Why it hasn't been tested before
- What experiment to run Monday morning

PHASE 6 — PRIORITY EXPERIMENTS
Rank the top 5 experiments by impact × feasibility. Include cell type,
concentrations, temperatures, plate layout, and expected timeline.

FORMAT: Structured report with numbered sections and data tables.
Every claim must cite data retrieved from the MCP tools (include DOIs).
Be quantitative — include exact numbers, not vague descriptors.
```

---

## Prompt 2: Cold-Optimized Cocktail Design

```
Using the CryoLens MCP server, design a vitrification cocktail optimized for
4°C equilibration — the standard temperature for organ vitrification.

STEP 1: Use query_database to pull all viability measurements. Compare 4°C vs
25°C performance for every compound at 3 mol/kg. Build a table with columns:
Compound, Viability 3M 25°C, Viability 3M 4°C, Delta.

STEP 2: Use search_findings with query "temperature dependent toxicity" and
"cold loading" to find literature evidence on why temperature matters.

STEP 3: Use search_viability for the top 5 cold-tolerant compounds. Get their
full dose-response profiles at 4°C.

STEP 4: Use compare_formulations on VS55, M22, and DP6. Document their
compositions, total concentrations, and which components are cold-sensitive.

STEP 5: Design a cocktail that satisfies ALL of these constraints:
- Uses ONLY compounds with positive or neutral delta at 4°C
- Excludes compounds lethal when cold (check for MPD, TFA, formamide as lead)
- Achieves ≥8 mol/kg total (vitrification threshold)
- Has faster predicted loading time than VS55 (use permeability data —
  VS55 contains glycerol at 2.4×10⁻³/s, the slowest permeator)
- Maximum 4 components (practical constraint)

STEP 6: Provide the loading protocol: stepwise equilibration concentrations,
hold times at each step (estimated from permeability), and temperature.

Output: A single cocktail with full rationale, predicted properties table
(vs VS55/M22/DP6), and a day-1 experiment protocol.
```

---

## Prompt 3: Toxicity Neutralization Map

```
Using the CryoLens MCP server, systematically map every known toxicity
neutralization interaction between cryoprotective agents.

STEP 1: Use search_findings with these queries (run each separately):
- "toxicity neutralization"
- "mixture toxicity reduction"
- "toxicity reduction in CPA mixtures"
- "DMSO neutralize formamide"
- "glycerol formamide viability"

STEP 2: Use query_database to pull all mixture viability data. Find every
case where: mixture_viability > max(component_A_viability, component_B_viability)
at equivalent total concentration. These are TRUE neutralization pairs
(not just dilution effects).

STEP 3: For each neutralization pair found, use get_compound_details on both
compounds. Document their roles (kosmotrope vs chaotrope, protein stabilizer
vs destabilizer, hydrogen bond donor vs acceptor).

STEP 4: Build a neutralization matrix. Rows and columns = all penetrating CPAs.
Cells = "neutralizes" / "additive" / "antagonistic" / "untested".
Count how many cells are "untested" — this is the opportunity space.

STEP 5: Based on the mechanistic patterns (e.g., protein stabilizer +
protein destabilizer = neutralization), predict the 5 most promising
UNTESTED binary pairs. For each:
- The two compounds and proposed concentrations
- The mechanistic hypothesis for why neutralization should occur
- Confidence level (high/medium/low)
- The specific 96-well plate experiment to test it (layout, controls, readout)

STEP 6: Calculate how many pairwise combinations remain untested among the
top 15 CPAs. Propose an efficient screening strategy using automated
liquid handling.
```

---

## Prompt 4: Brain-Specific CPA Design

```
Using the CryoLens MCP server, design a CPA formulation specifically for
brain tissue vitrification that addresses the blood-brain barrier problem.

STEP 1 — UNDERSTAND THE PROBLEM:
Use search_findings with these queries:
- "brain vitrification"
- "blood-brain barrier cryoprotectant"
- "cerebral dehydration"
- "hippocampus functional recovery"
Summarize: what has been achieved, what failed, and why.

STEP 2 — BENCHMARK ANALYSIS:
Use compare_formulations to analyze V3 and VS55 — the solutions used in
German et al. 2026 (first functional brain recovery after vitrification).
Document total osmolarity, each component's concentration, and which
components cross the BBB vs stay extracellular.

STEP 3 — FIND LOW-OSMOLARITY CPAS:
Use search_compounds for penetrating CPAs. Cross-reference with
search_viability.
Identify CPAs that:
- Have active membrane transport (amino acid transporters — check for
  proline, betaine, taurine in the database)
- Maintain viability at 3+ mol/kg
- Permeate quickly at 4°C (reduce equilibration-induced damage)

STEP 4 — FIND EXTRACELLULAR PROTECTANTS:
Use search_findings with queries:
- "trehalose brain"
- "polyampholyte"
- "ice recrystallization inhibitor"
- "PVP cryoprotection"
These provide ice protection WITHOUT crossing the BBB (zero intracellular
osmotic cost).

STEP 5 — IDENTIFY GAPS:
Use find_gaps to see what brain-relevant data is missing.
Use search_findings with query "neural tissue cryopreservation" to see
how little brain-specific CPA data exists.

STEP 6 — DESIGN THE FORMULATION:
Create a cocktail with these constraints:
- Total intracellular osmotic burden ≤6M (vs 8.4M for VS55)
- At least one toxicity neutralization pair
- At least one extracellular-only ice inhibitor
- All penetrating components must have positive cold-loading delta
- Predicted loading time ≤30 min for 300μm brain slices

Provide: composition table, evidence chain (database finding → design choice),
predicted properties vs VS55, and the brain slice experiment protocol
following German et al.'s methodology.
```

---

## Prompt 5: Underexplored Compound Scout

```
Using the CryoLens MCP server, identify the most promising underexplored
compounds for cryopreservation research.

STEP 1: Use find_gaps to get the complete gap analysis — every compound
with missing measurement data.

STEP 2: For every compound in the database, use get_compound_details.
Build a master table: compound, role, measurements count, papers count,
which metrics are available, which are missing.

STEP 3: Use search_viability for each compound that HAS viability data.
Note their profiles. These are the "known knowns."

STEP 4: Use search_findings with the name of each compound that has
ZERO viability data but IS mentioned in findings. These compounds
have literature evidence but no quantitative measurements — they are
the highest-value research targets.

STEP 5: Focus on ice blockers — use search_compounds with role "ice_blocker".
The database has 9 ice blockers, all with zero viability data. For each:
- Use search_findings with the compound name
- Document what is known from literature
- Assess: is this compound commercially available? What concentration
  range should be tested?

STEP 6: Rank all compounds by "Research Potential Score" =
(favorable_literature_evidence × data_gaps × commercial_availability).

Output: A prioritized list of the top 10 compounds that would most
advance the field if screened. For each, include:
- What is known (from findings)
- What is missing (from gap analysis)
- The exact experiment to fill the gap (concentrations, cell type, assay)
- Expected timeline and cost estimate
```

---

## Prompt 6: Formulation Comparison Engine

```
Using the CryoLens MCP server, perform a systematic comparison of ALL
formulations in the database to identify design patterns.

STEP 1: Use query_database to get all formulations with their components:
SELECT f.name, f.total_concentration, c.name as compound, fc.concentration
FROM formulations f
JOIN formulation_components fc ON fc.formulation_id = f.id
JOIN compounds c ON c.id = fc.compound_id
ORDER BY f.name

STEP 2: Use compare_formulations on the major benchmarks: VS55, M22, DP6,
CVS1, and any others with >5 linked findings.

STEP 3: For each benchmark, use search_findings with the formulation name
to gather all outcome data (viability, tissue types tested, failure modes).

STEP 4: Build a comparison matrix:
- Rows: formulations (top 20 by finding count)
- Columns: total concentration, component count, has Tg data, has CCR data,
  tissues tested, best viability, worst viability, year introduced

STEP 5: Identify patterns:
- What component combinations appear most frequently?
- Which formulations achieve the highest viability at the lowest total concentration?
- Which tissue types have the most/least formulation options?

STEP 6: Find the "Pareto frontier" — formulations that are not dominated
on any axis (concentration, viability, tissue coverage). These are the
true state-of-the-art. Identify what a new formulation would need to
push the frontier forward.
```

---

## Quick Single-Query Prompts

These are shorter prompts for specific questions:

### What does CryoLens know about DMSO?
```
Use the CryoLens MCP. Run get_compound_details for DMSO. Then search_viability
for DMSO. Then search_findings with query "DMSO toxicity mechanism". Summarize
everything known: viability profile, permeability, which formulations contain it,
toxicity mechanisms, and what data is missing.
```

### Compare VS55 vs M22 for brain tissue
```
Use the CryoLens MCP. Run compare_formulations for VS55 and M22. Then
search_findings with query "VS55 brain" and "M22 brain". Which has better
outcomes for neural tissue? What are the tradeoffs?
```

### What are the biggest gaps in cryopreservation research?
```
Use the CryoLens MCP. Run find_gaps with no filters. Then run query_database
to count findings per tissue type. Identify: which compounds lack data,
which tissues are understudied, and which compound-tissue combinations
have never been tested. Present as a prioritized research agenda.
```

### Design a formamide-free cocktail
```
Use the CryoLens MCP. Formamide is toxic but used in VS55 and M22 for its
fast permeation. Find compounds with permeability ≥20×10⁻³/s at 4°C that
are NOT formamide. Use search_viability and query_database for permeability data.
Design a cocktail that replaces formamide while maintaining vitrification
capability (≥8 mol/kg total). Use the toxicity neutralization data to
optimize the remaining components.
```

---

*CryoLens MCP endpoint: https://mcp.cryolens.io/mcp*
*Connect via: claude mcp add cryolens --transport http https://mcp.cryolens.io/mcp*
