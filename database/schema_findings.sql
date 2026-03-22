-- CryoLens Findings Schema
-- Captures non-numeric knowledge claims from cryopreservation papers.
--
-- The CPA screening tables (compounds, solutions, measurements) capture
-- structured numeric data. This layer captures everything else:
-- qualitative outcomes, novel techniques, clinical observations,
-- biological findings, and cross-cutting insights.
--
-- Design for AI agent queries:
--   "What warming methods work for vitrified kidneys?" → search findings
--   "Has brain vitrification preserved neural function?" → search findings
--   "What concentration of VS55 was used for rabbit kidney?" → search findings
--
-- Each finding is a structured knowledge claim with:
--   - A category (what domain is this about?)
--   - A concise claim (one sentence, agent-readable)
--   - Evidence details (conditions, values, context)
--   - Source provenance (paper DOI + exact location)

BEGIN;

-- ============================================================
-- FINDINGS: structured knowledge claims from papers
-- ============================================================

CREATE TABLE findings (
    id                  SERIAL PRIMARY KEY,
    paper_doi           TEXT NOT NULL REFERENCES papers(doi),

    -- Classification
    category            TEXT NOT NULL CHECK (category IN (
        -- Preservation outcomes
        'vitrification_outcome',     -- tissue/organ vitrified, did it survive?
        'freezing_outcome',          -- slow-freeze result
        'transplant_outcome',        -- organ transplanted after cryopreservation

        -- Warming/rewarming
        'warming_method',            -- nanowarming, convective, RF, laser, etc.
        'warming_outcome',           -- result of a specific warming approach

        -- Biophysics
        'thermal_property',          -- Tg, CCR, CWR, specific heat, etc.
        'ice_formation',             -- ice nucleation, recrystallization observations
        'osmotic_response',          -- cell volume changes, osmotic tolerance

        -- Toxicity & biocompatibility
        'toxicity_finding',          -- CPA toxicity observation (qualitative)
        'toxicity_mechanism',        -- why a CPA is toxic (protein denaturation, etc.)
        'toxicity_neutralization',   -- mixture reduces toxicity

        -- Protocols & methods
        'protocol_innovation',       -- new method for CPA loading, cooling, etc.
        'assay_development',         -- new screening method or tool

        -- Tissue/organ specific
        'tissue_specific',           -- finding specific to a tissue type

        -- Engineering
        'scale_up',                  -- challenges or solutions for larger samples
        'equipment',                 -- specific hardware/devices used

        -- Computational
        'modeling',                  -- mathematical/computational modeling result
        'prediction',               -- ML or computational prediction

        -- Review/synthesis
        'review_conclusion',         -- key conclusion from a review paper
        'gap_identified',            -- knowledge gap identified by authors
        'recommendation',            -- author recommendation for future work

        'other'
    )),

    -- The finding itself
    claim               TEXT NOT NULL,          -- one clear sentence: "Vitrified rabbit kidneys survived transplant and sustained life for 48 days"
    details             TEXT,                   -- supporting context, conditions, caveats

    -- Biological context
    tissue_type         TEXT,                   -- "kidney", "brain_hippocampus", "oocyte", "cartilage", null
    organism            TEXT,                   -- "rabbit", "rat", "human", "porcine", null
    cell_type           TEXT,                   -- specific cell type if relevant

    -- Experimental context
    formulation_id      TEXT REFERENCES formulations(id),  -- if a named cocktail was used
    temperature_c       REAL,                   -- key temperature if relevant
    concentration       REAL,                   -- key concentration if relevant
    concentration_unit  TEXT,

    -- Quantitative evidence (if the finding includes a number)
    value               REAL,                   -- e.g., 97 for "97% viability"
    value_unit          TEXT,                   -- e.g., "percent", "days", "°C/min"

    -- Provenance
    source_location     TEXT NOT NULL,          -- "Abstract", "Results Section 3.2", "Figure 5", "Table 3"
    confidence          TEXT CHECK (confidence IN (
        'high',          -- directly stated in paper with data
        'medium',        -- inferred from figures or indirect evidence
        'low'            -- mentioned in passing, review context, or uncertain
    )) DEFAULT 'high',

    -- Metadata
    created_at          TIMESTAMP DEFAULT NOW(),
    notes               TEXT
);

CREATE INDEX idx_findings_paper ON findings(paper_doi);
CREATE INDEX idx_findings_category ON findings(category);
CREATE INDEX idx_findings_tissue ON findings(tissue_type);
CREATE INDEX idx_findings_organism ON findings(organism);
CREATE INDEX idx_findings_formulation ON findings(formulation_id);

-- Full-text search on claims and details
CREATE INDEX idx_findings_claim_search ON findings USING gin(to_tsvector('english', claim));
CREATE INDEX idx_findings_details_search ON findings USING gin(to_tsvector('english', coalesce(details, '')));


-- ============================================================
-- TAGS: flexible tagging for cross-cutting concerns
-- ============================================================
-- A finding can have multiple tags. Tags are free-form but
-- follow conventions. This enables queries like:
-- "Find all findings tagged 'nanowarming' AND 'kidney'"

CREATE TABLE finding_tags (
    finding_id      INTEGER NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    tag             TEXT NOT NULL,       -- lowercase: "nanowarming", "vs55", "organ_banking", "clinical"
    CONSTRAINT pk_finding_tags PRIMARY KEY (finding_id, tag)
);

CREATE INDEX idx_tags_tag ON finding_tags(tag);


-- ============================================================
-- VIEWS for agent queries
-- ============================================================

-- Search findings with full context
CREATE VIEW v_findings AS
SELECT
    f.id,
    f.category,
    f.claim,
    f.details,
    f.tissue_type,
    f.organism,
    f.formulation_id,
    fm.name AS formulation_name,
    f.value,
    f.value_unit,
    f.confidence,
    f.source_location,
    p.title AS paper_title,
    p.doi AS paper_doi,
    p.year AS paper_year,
    p.authors,
    array_agg(DISTINCT ft.tag) FILTER (WHERE ft.tag IS NOT NULL) AS tags
FROM findings f
JOIN papers p ON f.paper_doi = p.doi
LEFT JOIN formulations fm ON f.formulation_id = fm.id
LEFT JOIN finding_tags ft ON ft.finding_id = f.id
GROUP BY f.id, f.category, f.claim, f.details, f.tissue_type, f.organism,
         f.formulation_id, fm.name, f.value, f.value_unit, f.confidence,
         f.source_location, p.title, p.doi, p.year, p.authors;

COMMIT;
