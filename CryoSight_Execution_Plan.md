# CryoSight: CPA Formulation Intelligence Engine

## Execution Plan for Defeating Entropy Hackathon

---

## 1. What We're Building

**CryoSight** is the first AI-powered knowledge engine for cryoprotectant (CPA) formulation design.

The cryopreservation field has 50+ years of experimental data on CPA formulations scattered across hundreds of papers in incompatible formats. No unified, queryable knowledge base exists. Every lab reinvents the wheel when designing vitrification solutions.

We build the structured intelligence layer the field is missing.

**One-liner for submission**: "An AI-powered knowledge engine that extracts, structures, and enables intelligent exploration of the world's cryoprotectant formulation data."

---

## 2. Why This Wins (Criterion-by-Criterion)

| Criterion | Weight | How We Score |
|-----------|--------|-------------|
| **Novelty** | 25% | No structured CPA formulation database exists. CryoDAO announced one but hasn't shipped it. We build it in 36 hours. |
| **Technical Execution** | 25% | Multi-agent extraction pipeline + normalized knowledge base + interactive explorer + Gaussian Process predictor + gap analysis. Real engineering, not a dashboard. |
| **Scientific Validity** | 20% | Every data point traced to a specific paper, table, and measurement. Extraction confidence scores visible. Emil Kendziorra will recognize VS55, M22, DP6 and know the data is real. |
| **Impact** | 20% | Accelerates CPA research by making the entire formulation landscape searchable. Adaobi (kidney failure) sees immediate value for organ-specific protocol selection. |
| **Presentation** | 10% | Live demo: type "kidney vitrification" → see every formulation tried → compare two → modify one → see predicted property changes → see what hasn't been tested yet. |

---

## 3. The Five Layers (Deep Dive)

### Layer 1: Extraction Pipeline

**Goal**: Process 15-25 key cryopreservation papers into structured formulation records.

**Approach**: Claude API for structured extraction from PDFs. Each paper goes through a two-stage process:

1. **Parse**: Extract text + tables from PDF (Claude can process PDFs natively as images/text)
2. **Structure**: Prompt Claude to extract formulation records into a defined JSON schema

**Extraction Schema** (per formulation record):

```json
{
  "formulation_name": "VS55",
  "source": {
    "paper_title": "...",
    "doi": "...",
    "authors": ["..."],
    "year": 2009,
    "table_or_section": "Table 2"
  },
  "components": [
    {"name": "DMSO", "concentration": 3.1, "unit": "M", "role": "penetrating"},
    {"name": "propylene_glycol", "concentration": 2.2, "unit": "M", "role": "penetrating"},
    {"name": "formamide", "concentration": 3.1, "unit": "M", "role": "penetrating"}
  ],
  "total_molarity": 8.4,
  "carrier_solution": "Euro-Collins",
  "thermal_properties": {
    "Tg": {"value": -123, "unit": "°C", "method": "DSC"},
    "CCR": {"value": 2.5, "unit": "°C/min"},
    "CWR": {"value": 50, "unit": "°C/min"}
  },
  "biological_outcomes": {
    "tissue_type": "kidney cortex",
    "organism": "rabbit",
    "viability_metric": "histological integrity",
    "viability_value": "good structural preservation",
    "recovery_endpoint": "renal slice viability"
  },
  "toxicity": {
    "exposure_time": "30 min",
    "exposure_temp": "0°C",
    "toxicity_observation": "moderate at full concentration"
  },
  "extraction_confidence": 0.9
}
```

**Priority Paper List** (open access, data-dense):

| # | Paper | Key Data | Access |
|---|-------|----------|--------|
| 1 | "Supplemented phase diagrams for VS55, M22, DP6" (2022) | Tg, crystallization for 3 major cocktails | PMC10202161 |
| 2 | "Effect of Common Cryoprotectants on Critical Warming Rates" | CCR/CWR for 14 individual CPAs at multiple concentrations | PMC3500404 |
| 3 | "Critical Cooling and Warming Rates as Function of CPA Concentration" | Comprehensive CCR/CWR review | PMC10186587 |
| 4 | "Accelerated Discovery of CPA Cocktails via Bayesian Optimization" (2026) | High-throughput viability data + formulation concentrations | arXiv:2602.13398 |
| 5 | "Dielectric properties of individual CPAs and cocktails" (2025) | Properties of individual agents AND cocktails | Nature Sci Rep |
| 6 | "Physical and biological aspects of renal vitrification" (Fahy 2009) | M22 protocol, kidney vitrification outcomes | Organogenesis |
| 7 | "Measurement of Specific Heat in VS55, DP6, M22" | Thermal properties with/without sucrose | PubMed 29958001 |
| 8 | "Improved tissue cryopreservation using nanowarming" (Bischof 2017) | Nanowarming outcomes, vitrification success | Sci Trans Med |
| 9 | "Functional recovery of adult murine hippocampus after vitrification" | Neural tissue vitrification outcomes | bioRxiv |
| 10 | "High-throughput screening for CPA toxicity characterisation" | Toxicity/permeability data | Nature Sci Rep |

**Also use**: Edison Scientific / FutureHouse agents (provided by hackathon):
- **Crow** (PaperQA): Quick literature Q&A — "What is the Tg of M22?"
- **Falcon**: Deep literature review — synthesize CPA data across sources
- **Owl**: Novelty check — "Has anyone tested glycerol + trehalose on liver tissue?"

**Expected yield**: 80-150 individual formulation property measurements from 15-20 papers.

---

### Layer 2: Structured Knowledge Base

**Goal**: A normalized, queryable database of CPA formulations — the "periodic table of CPA cocktails."

**Tech**: SQLite (zero-ops, ships as single file)

**Schema**:

```sql
CREATE TABLE papers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    doi TEXT,
    authors TEXT,         -- JSON array
    year INTEGER,
    journal TEXT,
    url TEXT
);

CREATE TABLE formulations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,    -- "VS55", "M22", "DP6", etc.
    paper_id TEXT REFERENCES papers(id),
    total_molarity REAL,
    carrier_solution TEXT,
    table_reference TEXT,  -- "Table 2" — exact source in paper
    extraction_confidence REAL,
    notes TEXT
);

CREATE TABLE components (
    id TEXT PRIMARY KEY,
    formulation_id TEXT REFERENCES formulations(id),
    name TEXT NOT NULL,           -- "DMSO", "ethylene_glycol", etc.
    name_normalized TEXT NOT NULL, -- canonical lowercase
    concentration REAL,
    unit TEXT,                    -- "M", "% w/v", "% w/w", "mg/mL"
    role TEXT                     -- "penetrating", "non_penetrating", "carrier"
);

CREATE TABLE thermal_properties (
    id TEXT PRIMARY KEY,
    formulation_id TEXT REFERENCES formulations(id),
    property_name TEXT NOT NULL,  -- "Tg", "CCR", "CWR"
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    measurement_method TEXT,      -- "DSC", "cryo-microscopy"
    conditions TEXT               -- JSON: {"cooling_rate": "10°C/min", "volume": "1µL"}
);

CREATE TABLE biological_outcomes (
    id TEXT PRIMARY KEY,
    formulation_id TEXT REFERENCES formulations(id),
    tissue_type TEXT,        -- "kidney_cortex", "hippocampus", "ovary"
    organism TEXT,           -- "rabbit", "mouse", "human"
    viability_metric TEXT,   -- "cell_viability_%", "histological_score", "electrophysiology"
    viability_value TEXT,
    recovery_endpoint TEXT,
    protocol_summary TEXT
);

CREATE TABLE toxicity (
    id TEXT PRIMARY KEY,
    formulation_id TEXT REFERENCES formulations(id),
    tissue_type TEXT,
    organism TEXT,
    exposure_time TEXT,
    exposure_temp TEXT,
    metric TEXT,            -- "cell_viability", "LDH_release", "membrane_integrity"
    value TEXT,
    notes TEXT
);
```

**Component Normalization**: Map all CPA names to canonical forms:

| Raw variants | Canonical name |
|-------------|---------------|
| DMSO, dimethyl sulfoxide, Me2SO | dmso |
| EG, ethylene glycol | ethylene_glycol |
| PG, propylene glycol, 1,2-propanediol | propylene_glycol |
| glycerol, glycerin | glycerol |
| formamide, FA | formamide |
| trehalose, α,α-trehalose | trehalose |
| PVP, polyvinylpyrrolidone | pvp |
| HES, hydroxyethyl starch | hes |

**Formulation Vector Representation**: Each formulation becomes a numeric vector for comparison and prediction:

```
[dmso_M, ethylene_glycol_M, propylene_glycol_M, glycerol_M, formamide_M,
 trehalose_M, sucrose_M, pvp_pct, hes_pct, peg_pct, other_M, total_molarity]
```

This enables: similarity search, clustering, and ML prediction.

---

### Layer 3: Explorer Interface

**Goal**: An interactive, clean UI where a researcher can browse, filter, compare, and query the formulation knowledge base.

**Tech**: Next.js + Recharts + Tailwind CSS

**Core Views**:

#### 3a. Formulation Browser (main page)
- Table/card view of all extracted formulations
- Filter by: tissue type, organ, CPA component, property availability
- Sort by: total molarity, Tg, CCR, CWR, year
- Search: free text ("kidney vitrification", "DMSO-free")
- Each row shows: name, components (as colored chips), key properties, tissue tested on

#### 3b. Formulation Detail Page
- Full composition breakdown (stacked bar chart of components)
- All measured properties with source citations
- Biological outcomes table
- Toxicity observations
- Link to source paper
- "Similar formulations" (by composition vector distance)

#### 3c. Comparison View
- Select 2-4 formulations side by side
- Composition comparison (grouped bar chart)
- Property comparison (radar chart or parallel coordinates)
- Outcome comparison table
- Highlight differences

#### 3d. Query Interface
- Natural language search powered by embeddings or simple keyword matching
- Example queries:
  - "What formulations have been used for kidney tissue?"
  - "Show me DMSO-free vitrification solutions"
  - "Which formulations have CCR < 5°C/min?"

#### 3e. Prediction Interface (ties to Layer 4)
- "What if" panel: adjust component concentrations via sliders
- See predicted Tg, CCR, CWR with uncertainty bands
- See nearest known formulations to the custom blend

#### 3f. Gap Map (ties to Layer 5)
- Heatmap: formulations × tissues/organs
- Color: green (tested + positive outcome), yellow (tested + unclear), red (tested + negative), gray (never tested)
- Clickable: each cell links to source data or says "no data"

**Design Principles**:
- Dark theme, scientific aesthetic (not startup-y)
- Minimal chrome, maximum data density
- Every number links to its source paper
- Inspired by: AlphaFold database UI, Materials Project, ChEMBL

---

### Layer 4: Predictive Layer

**Goal**: Given a novel or modified CPA formulation (as a concentration vector), predict thermal properties (Tg, CCR, CWR) with uncertainty estimates.

**Approach**: Gaussian Process Regression (scikit-learn)

**Why GPR**:
- Works well on small datasets (50-200 samples) — this is our reality
- Provides native uncertainty quantification (confidence intervals) — critical for scientific credibility
- Non-linear without hand-tuning
- Transparent and interpretable
- Scientist judges will find this more credible than a black-box neural network

**Implementation**:

```python
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern, WhiteKernel
from sklearn.preprocessing import StandardScaler

class CPAPropertyPredictor:
    def __init__(self):
        self.kernel = Matern(nu=2.5) + WhiteKernel(noise_level=0.1)
        self.model = GaussianProcessRegressor(
            kernel=self.kernel,
            n_restarts_optimizer=10
        )
        self.scaler = StandardScaler()

    def train(self, formulation_vectors, property_values):
        X = self.scaler.fit_transform(formulation_vectors)
        self.model.fit(X, property_values)

    def predict(self, formulation_vector):
        X = self.scaler.transform([formulation_vector])
        mean, std = self.model.predict(X, return_std=True)
        return {
            "predicted_value": float(mean[0]),
            "confidence_95_lower": float(mean[0] - 1.96 * std[0]),
            "confidence_95_upper": float(mean[0] + 1.96 * std[0]),
            "uncertainty": float(std[0])
        }
```

**What we predict**:
- Primary: Tg (glass transition temperature) — most data available
- Secondary: CCR (critical cooling rate) — if enough data points
- Stretch: CWR (critical warming rate) — fewer data points

**Validation approach** (for the pitch):
- Leave-one-out cross-validation on extracted data
- Show predicted vs actual scatter plot
- Report mean absolute error and R²
- Show uncertainty calibration: "95% CI contains actual value X% of the time"

**Demo scenario**: "VS55 has 3.1M DMSO. What happens if we reduce DMSO to 2.5M and add 0.6M trehalose instead?" → show predicted Tg shift with confidence interval → show nearest known formulations for comparison.

---

### Layer 5: Gap Analysis

**Goal**: Show where the field has holes — which formulation-tissue combinations have never been tested, which properties have never been measured.

**Three gap visualizations**:

#### 5a. Formulation × Tissue Heatmap
- Rows: major formulations (VS55, M22, DP6, and all extracted)
- Columns: tissue types (kidney, liver, heart, brain/hippocampus, ovary, blood vessels, cornea, etc.)
- Cell color: tested (green) / not tested (gray)
- This immediately shows: "M22 has been tested on kidney and brain, but never on heart or liver"

#### 5b. Property Coverage Map
- Rows: formulations
- Columns: properties (Tg, CCR, CWR, toxicity, viability)
- Shows which formulations have complete characterization vs. partial
- Highlights: "DP6 has Tg and CCR measured, but no CWR data and no toxicity at 37°C"

#### 5c. "What to Test Next" Recommendations
- Rank untested formulation-tissue combinations by potential impact
- Simple heuristic: formulations that perform well on similar tissues but haven't been tested on target tissue
- This is the "research roadmap" view — directly actionable for a lab

**Why judges love this**:
- It turns a knowledge base into a research tool
- It suggests experiments — the output is "what should we do next" not just "what do we know"
- Emil (Tomorrow Biostasis) and Adaobi (kidney biotech) both have research agendas that this directly serves

---

## 4. Tech Stack Summary

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | Next.js + Recharts + Tailwind | Fast to build, polished, React ecosystem |
| Backend | Python FastAPI | Native LLM/ML integration, async |
| Database | SQLite | Zero ops, ships as single file |
| Extraction | Claude API (PDF → structured JSON) | Best for scientific tables |
| ML | Gaussian Process Regression (scikit-learn) | Small data, uncertainty quantification |
| Deployment | Local demo (primary) + Vercel/Railway (backup) | Judges don't care about cloud deployment |

---

## 5. 36-Hour Timeline

### Saturday 21 March

| Time | Block | Focus | Deliverable |
|------|-------|-------|-------------|
| 9:00-10:00 | Arrival | Team formation, setup | Team registered |
| 10:00-11:00 | Setup | Git repo, project skeleton, API keys | FastAPI + Next.js scaffolded |
| 11:00-1:00 PM | **Extraction Sprint 1** | Download 10 priority papers. Build extraction prompt. Test on 3 papers. Validate output. | Extraction pipeline working, 3 papers processed |
| 1:00-2:00 | Lunch + review | Review extracted data quality, fix prompt | Improved extraction prompt |
| 2:00-4:00 | **Extraction Sprint 2** | Process remaining 7-12 papers. Normalize data. | 10-15 papers processed, ~80+ formulation records |
| 4:00-6:00 | **Database + API** | SQLite schema, data loading, FastAPI endpoints (list, filter, detail, compare) | Backend API serving real data |
| 6:00-7:00 | Dinner | Review progress, plan evening | Clear evening priorities |
| 7:00-9:30 | **Frontend Sprint 1** | Formulation browser, filter panel, detail view, composition charts | Core UI working with real data |

### Sunday 22 March

| Time | Block | Focus | Deliverable |
|------|-------|-------|-------------|
| 9:00-10:00 | **Prediction** | Train GPR on extracted data, prediction endpoint | Working predictor with uncertainty |
| 10:00-12:00 | **Frontend Sprint 2** | Comparison view, prediction "what-if" panel, gap heatmap | Full feature set working |
| 12:00-1:00 | Lunch | | |
| 1:00-2:00 | **Polish + Integration** | End-to-end testing, error handling, UI polish | Smooth demo path |
| 2:00-3:00 | **Pitch Prep** | Slides, demo script, rehearsal | Submission ready |
| 3:00 | **SUBMIT** | Google Form + slides + repo | Done |
| 3:30-6:00 | Demo + Judging | 5-min pitch + 2-min Q&A | Win |

---

## 6. Pitch Structure (5 minutes)

**Slide 1 — The Problem** (30s)
"50 years of CPA experiments. Thousands of formulation measurements. Zero structured databases. Every cryopreservation lab starts from scratch."

**Slide 2 — CryoSight** (30s)
"We built the first AI-powered knowledge engine for vitrification formulation design. Extract → Structure → Explore → Predict → Discover."

**Slide 3 — Architecture** (30s)
Pipeline diagram: Papers → Claude extraction → Normalized KB → Explorer UI → GPR Predictor → Gap Analysis

**Slide 4 — Live Demo** (2 min) ← THIS IS THE CORE
1. Browse formulations — show VS55, M22, DP6 with all their data
2. Filter by tissue — "show me kidney formulations"
3. Compare two formulations side by side
4. "What if" — modify a formulation, see predicted Tg change
5. Gap map — "these organ-formulation combinations have never been tested"

**Slide 5 — Key Finding** (30s)
"We extracted N formulations from M papers. X% of formulations have incomplete property characterization. Y organ-formulation combinations have never been tested. Here's the research roadmap."

**Slide 6 — Scientific Validity** (30s)
Extraction accuracy: validated against manual extraction on 3 papers. Prediction: LOO cross-validation, MAE = Z°C for Tg. Every data point traces to a paper.

**Slide 7 — Future** (30s)
"With 500 papers processed: the definitive CPA design tool. API for protocol optimization. Wet lab validation of gap-identified experiments. We're building what CryoDAO promised."

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Extraction quality is poor | Start with 3 papers, validate manually, iterate prompt before scaling. Even 50 good records are enough for a demo. |
| Not enough data for prediction | GPR works with as few as 20-30 data points. Uncertainty bars will be wide — that's honest, not a failure. |
| Scope creep | Cut features ruthlessly. Priority: extraction → browser → comparison → prediction → gap analysis. If time is short, gap analysis can be a static visualization. |
| Papers behind paywall | Use PMC/arXiv open access versions. 8 of our 10 priority papers are open access. |
| Frontend takes too long | Use shadcn/ui components. No custom CSS. Table + chart components out of the box. |
| Demo breaks live | Have a recorded backup demo video. Test demo path 3x before submission. |

---

## 8. What Makes This Different From "Just Another Dashboard"

1. **Data creation, not data display**: We're not visualizing existing datasets. We're creating a new dataset that doesn't exist.
2. **AI pipeline as core technical contribution**: The extraction system is the product, not just the frontend.
3. **Scientific tool, not advocacy tool**: This helps researchers do their work. It doesn't tell policymakers things they already know.
4. **Predictive, not descriptive**: The GPR layer moves from "what has been measured" to "what might be true."
5. **Actionable, not informational**: The gap analysis tells you what experiment to run next.

---

## 9. Known CPA Formulations (Reference)

The three major vitrification cocktails we should expect to extract:

| Formulation | Total M | CCR (°C/min) | CWR (°C/min) | Components |
|-------------|---------|-------------|-------------|------------|
| **DP6** | 6.0 | 40 | 189 | 3M DMSO + 3M propylene glycol |
| **VS55** | 8.4 | 2.5 | 50 | 3.1M DMSO + 2.2M propylene glycol + 3.1M formamide |
| **M22** | 9.3 | 0.1 | 0.4 | DMSO + formamide + ethylene glycol + N-methylformamide + 3-methoxy-1,2-propanediol + PVP + X-1000 + Z-1000 |

Key relationship: Higher total molarity → lower CCR/CWR (easier to vitrify) but higher toxicity.

---

## 10. Hackathon Resources to Leverage

- **Google Cloud credits** ($25 via team lead after submission) — use for Claude API calls if needed
- **Edison Scientific / FutureHouse** — free platform credits:
  - Crow/PaperQA: quick literature Q&A
  - Falcon: deep literature synthesis
  - Owl: novelty detection ("has X been tried?")
  - Kosmos: autonomous research agent (can read ~1500 papers)
- **Mentors**:
  - Emil Kendziorra (Tomorrow Biostasis) — validate CPA knowledge, get feedback on scientific accuracy
  - Ask early: "Does this extraction schema capture what matters to you?"

---

## 11. Team Roles (Ideal 3-4 person team)

| Role | Focus | Hours |
|------|-------|-------|
| **ML/Extraction Engineer** (you) | Extraction pipeline, Claude prompts, GPR predictor, data normalization | Full |
| **Frontend Engineer** | Next.js UI, Recharts visualizations, comparison views | Full |
| **Domain/Data** | Paper sourcing, extraction validation, scientific accuracy, methodology writeup | Full |
| **Pitch/Product** (can overlap) | Demo narrative, slides, gap analysis framing, polish | Part-time + Sunday |
