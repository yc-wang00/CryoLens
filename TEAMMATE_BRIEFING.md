# CryoSight — Teammate Briefing

**Defeating Entropy Hackathon | March 21-22, 2026 | London | 36 hours**

---

## TL;DR

We're building **CryoSight: CPA Formulation Intelligence Engine** — the first AI-powered knowledge engine for cryoprotectant (CPA) formulation design. It extracts scattered experimental data from scientific papers, structures it into a queryable database, and lets researchers explore, compare, predict, and find gaps in what the field knows.

One-liner: *"An AI-powered knowledge engine that extracts, structures, and enables intelligent exploration of the world's cryoprotectant formulation data."*

---

## Why This Idea

We analyzed the hackathon challenges and judging criteria to pick the approach most likely to win.

**Judging breakdown:**

- Novelty (25%) — No structured CPA formulation database exists anywhere. CryoDAO announced one but never shipped it.
- Technical Execution (25%) — Five-layer architecture with AI extraction pipeline, structured database, interactive explorer, ML prediction, and gap analysis. Real engineering.
- Scientific Validity (20%) — Every data point traced to a specific paper, table, and measurement. Extraction confidence scores visible.
- Impact (20%) — Accelerates CPA research by making the entire formulation landscape searchable and queryable.
- Presentation (10%) — Live demo-driven: type a query, browse formulations, compare two, modify one, see predictions, see what's never been tested.

**The judges:** Emil Kendziorra (Tomorrow Biostasis, knows the CPA literature inside out), Leah Morris (AI for Science VC, cares about technical ambition), Adaobi Adibe (kidney biotech founder, immediate use case for organ-specific protocols), Aaron Lee (Imperial College, values scientific rigor).

---

## What We're Building — Five Layers

### Layer 1: AI Extraction Pipeline
Process 15-25 key cryopreservation papers into structured formulation records. PDFs go in, structured JSON comes out. We use the Claude API to send full PDFs and extract components, concentrations, thermal properties (Tg, CCR, CWR), biological outcomes, and toxicity data into a defined schema.

**This is the core technical contribution.** The extraction pipeline IS the product — we're creating a dataset that doesn't exist.

### Layer 2: Structured Knowledge Base (SQLite)
A normalized, queryable database — the "periodic table of CPA cocktails." Tables for papers, formulations, components, thermal properties, biological outcomes, and toxicity. Component names normalized to canonical forms (e.g., "DMSO", "dimethyl sulfoxide", "Me2SO" all map to `dmso`).

### Layer 3: Explorer Interface (Next.js + Recharts + Tailwind)
Interactive UI with: formulation browser (filter/sort/search), detail pages with composition charts, side-by-side comparison view, natural language query interface, and a prediction "what-if" panel.

Design: dark theme, scientific aesthetic, maximum data density. Every number links to its source paper.

### Layer 4: Predictive Layer (Gaussian Process Regression)
Given a novel formulation as a concentration vector, predict Tg, CCR, CWR with uncertainty estimates. GPR works on small datasets (30-50 points) and gives native confidence intervals — more scientifically credible than a black-box neural net. Framed as proof-of-concept, not production model.

### Layer 5: Gap Analysis
The climax of the demo. Three visualizations: (1) Formulation × Tissue heatmap showing what's been tested and what hasn't, (2) Property coverage map showing which formulations have incomplete characterization, (3) "What to test next" recommendations. This turns a knowledge base into a research planning tool.

---

## What We've Already Done (Pre-Hackathon Research)

### Feasibility Testing
We tested three data access methods to figure out the best extraction pipeline:

1. **PubMed MCP** — Good for paper discovery and narrative text, but strips tables from the full text. Can't get the actual data tables we need.

2. **Edison Scientific (PaperQA3)** — Mid-depth extraction. Successfully extracted Table 2 from a test paper (20 CCR datapoints as machine-readable text). BUT could not extract Tables 1 and 3 because they were rendered as images in the PDF. Verdict: good for triage, not reliable as primary extractor.

3. **Claude API with PDF** — The heavy hitter. Direct PDF upload, Claude can see pages as images, reads image-based tables natively. This is our primary extraction method.

**Pipeline decision: PubMed for discovery → Claude API PDF processing for extraction.**

### Data Extracted So Far
From feasibility testing on 2 real papers + training knowledge:

- 16 formulations in a compiled database
- 52 property measurements
- 8 papers referenced
- Key formulations: DP6, VS55, M22, VM3, plus individual CPA properties (glycerol, DMSO, ethylene glycol, PEG 200, sucrose)

### Realistic Data Projection
With 15-20 papers processed at the hackathon:

- 10-20 unique cocktail formulations
- 50-100 individual CPA concentration-property datapoints
- 20-40 biological outcome records
- 15-30 toxicity observations

This is enough for a compelling demo. The gap analysis is actually MORE powerful with a small dataset because it reveals how fragmented the field's knowledge is.

---

## Key Domain Concepts (Quick Primer)

**CPA (Cryoprotective Agent):** Chemicals that prevent ice formation during freezing. Two types — penetrating (DMSO, ethylene glycol, propylene glycol) and non-penetrating (trehalose, sucrose, PVP).

**Vitrification:** Ice-free cryopreservation. Instead of freezing, you convert tissue to a glass-like state. Requires high CPA concentrations (toxic) and precise cooling/warming rates.

**The Big Three cocktails:**

| Formulation | Total Molarity | CCR (°C/min) | CWR (°C/min) | Components |
|---|---|---|---|---|
| DP6 | 6.0 | 40 | 189 | DMSO + propylene glycol |
| VS55 | 8.4 | 2.5 | 50 | DMSO + propylene glycol + formamide |
| M22 | 9.3 | 0.1 | 0.4 | 8 components (most complex) |

Higher molarity = easier to vitrify, but more toxic. That's the fundamental tradeoff.

**Key thermal properties:**

- **Tg** (glass transition temperature) — temperature where the solution becomes glassy. Typically -120 to -135°C for CPA cocktails.
- **CCR** (critical cooling rate) — minimum cooling rate to avoid ice formation. Lower = better.
- **CWR** (critical warming rate) — minimum warming rate to avoid devitrification on rewarming. Always higher than CCR (often 10-1000x). This is the harder problem.

---

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| Frontend | Next.js + Recharts + Tailwind | Fast to build, polished, React ecosystem |
| Backend | Python FastAPI | Native LLM/ML integration, async |
| Database | SQLite | Zero ops, ships as single file |
| Extraction | Claude API (PDF → structured JSON) | Best for reading scientific tables from PDFs |
| ML | Gaussian Process Regression (scikit-learn) | Small data, uncertainty quantification |
| Paper discovery | PubMed API + Edison Scientific | Complementary coverage |

---

## 36-Hour Timeline

### Saturday (Day 1)

| Time | Focus | Deliverable |
|---|---|---|
| 9-10 AM | Team setup, git repo, API keys | Scaffolded project |
| 10 AM-1 PM | **Extraction Sprint 1** — Download priority papers, build pipeline, test on 3 papers | Working extraction, 3 papers processed |
| 1-2 PM | Lunch + review extraction quality | Refined extraction prompt |
| 2-4 PM | **Extraction Sprint 2** — Process 7-12 more papers, normalize data | 10-15 papers done, ~80+ records |
| 4-6 PM | **Database + API** — SQLite schema, data loading, FastAPI endpoints | Backend serving real data |
| 6-7 PM | Dinner | |
| 7-9:30 PM | **Frontend Sprint 1** — Formulation browser, filters, detail view, charts | Core UI working |

### Sunday (Day 2)

| Time | Focus | Deliverable |
|---|---|---|
| 9-10 AM | **Prediction** — Train GPR, prediction endpoint | Working predictor |
| 10 AM-12 PM | **Frontend Sprint 2** — Comparison view, what-if panel, gap heatmap | Full feature set |
| 12-1 PM | Lunch | |
| 1-2 PM | **Polish** — End-to-end testing, error handling, UI polish | Smooth demo |
| 2-3 PM | **Pitch prep** — Slides, demo script, rehearsal | Submission ready |
| 3 PM | **SUBMIT** | |
| 3:30-6 PM | Demo + judging (5-min pitch + 2-min Q&A) | |

---

## Demo Narrative (5 minutes)

1. **The Problem** (30s) — "50 years of CPA experiments, thousands of measurements, zero structured databases."
2. **CryoSight intro** (30s) — "Extract → Structure → Explore → Predict → Discover."
3. **Architecture** (30s) — Pipeline diagram showing the five layers.
4. **Live Demo** (2 min) — Browse formulations → filter by tissue → compare two side-by-side → modify a formulation and see predicted Tg → show the gap map.
5. **Key Finding** (30s) — "We extracted N formulations from M papers. X% have incomplete characterization. Y organ-formulation combos never tested."
6. **Validation** (30s) — Extraction accuracy, leave-one-out cross-validation, every datapoint traceable.
7. **Future** (30s) — "Process 500 papers and this becomes the definitive CPA design tool."

---

## What Makes This Different From a Dashboard

1. **Data creation, not display** — We're creating a dataset that doesn't exist, not visualizing an existing one.
2. **AI pipeline as core contribution** — The extraction system is the product.
3. **Predictive, not descriptive** — GPR moves from "what's been measured" to "what might be true."
4. **Actionable** — Gap analysis tells you what experiment to run next.
5. **Extensible** — Adding a new paper takes 30 seconds. Show this live.

---

## Files Already Built

All in the repo under `cryo-hack/`:

- `CryoSight_Execution_Plan.md` — Full master plan (detailed version of this doc)
- `pipeline/extract.py` — Core extraction script with Claude API PDF processing, validation, and quality scoring
- `pipeline/discover_papers.py` — Paper discovery via PubMed, arXiv, and Edison APIs with batch processing
- `pipeline/extraction_prompt.md` — The extraction system prompt and JSON schema
- `extracted_data/COMPILED_DATABASE.json` — Merged database (16 formulations, 52 measurements, 8 papers)
- `extracted_data/REAL_extraction_PMC*.json` — Structured extractions from real papers
- `extracted_data/FEASIBILITY_ASSESSMENT.md` — Honest assessment of data availability and strategy

---

## Key Strategic Insight

> The strongest version of this project is NOT "we built a big database." The dataset will never be big enough in 36 hours to impress by volume.
>
> The strongest version is: **"We built the extraction pipeline, proved it works, and even on a small sample, the results reveal how fragmented and incomplete the field's knowledge is."**
>
> The gap analysis and the extraction system design are more impressive than the data volume. Make the pipeline the star, make the gaps the climax.

---

## Hackathon Resources

- **Google Cloud credits** — $25 via team lead after submission
- **Edison Scientific / FutureHouse** — Free platform credits (Crow for quick Q&A, Falcon for deep synthesis, Owl for novelty detection)
- **Mentors** — Talk to Emil Kendziorra early: "Does this extraction schema capture what matters to you?"

---

## Ideal Team Roles

| Role | Focus |
|---|---|
| ML/Extraction Engineer | Extraction pipeline, Claude prompts, GPR predictor, data normalization |
| Frontend Engineer | Next.js UI, Recharts visualizations, comparison views |
| Domain/Data | Paper sourcing, extraction validation, scientific accuracy |
| Pitch/Product (can overlap) | Demo narrative, slides, gap analysis framing |

---

*Let's build the CPA knowledge base the field is missing.*
