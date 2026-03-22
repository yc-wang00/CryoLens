-- CryoLens CPA Database Schema
-- Normalized relational schema for cryoprotective agent research data.
--
-- Design principles:
--   1. Every measurement traceable to a specific paper, figure/table
--   2. Compounds and solutions are separate entities (ingredients vs recipes)
--   3. One measurement = one number with one unit
--   4. No JSON blobs — all relationships are relational
--   5. Designed for: ML feature extraction, gap analysis, MCP agent queries

BEGIN;

-- ============================================================
-- COMPOUNDS: the chemical substances
-- ============================================================
-- Each row is one unique chemical. This is the "periodic table" of CPAs.
-- Molecular properties here support future RDKit/ML feature extraction.

CREATE TABLE compounds (
    id                  TEXT PRIMARY KEY,  -- normalized: "dmso", "ethylene_glycol"
    name                TEXT NOT NULL,     -- display name: "Dimethyl Sulfoxide"
    abbreviation        TEXT,             -- short form: "DMSO"
    cas_number          TEXT UNIQUE,      -- CAS registry: "67-68-5"
    molecular_weight    REAL,             -- g/mol
    smiles              TEXT,             -- canonical SMILES for RDKit
    inchi_key           TEXT,             -- InChI key for unambiguous lookup
    role                TEXT NOT NULL CHECK (role IN (
                            'penetrating',       -- crosses cell membrane (DMSO, EG, PG)
                            'non_penetrating',   -- stays extracellular (sucrose, trehalose)
                            'ice_blocker',       -- synthetic ice nucleation inhibitor
                            'carrier',           -- base solution component
                            'other'
                        )),
    description         TEXT              -- brief note on CPA properties
);

CREATE INDEX idx_compounds_role ON compounds(role);
CREATE INDEX idx_compounds_abbreviation ON compounds(abbreviation);


-- ============================================================
-- PAPERS: source literature
-- ============================================================
-- Every data point must trace back to a paper. This is the evidence chain.

CREATE TABLE papers (
    doi                 TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    authors             TEXT[] NOT NULL,   -- Postgres array: {"Ahmadkhani N","Benson JD",...}
    year                INTEGER NOT NULL CHECK (year >= 1949 AND year <= 2030),
    journal             TEXT NOT NULL,
    pmid                TEXT,
    url                 TEXT,
    pdf_path            TEXT              -- local path in corpus/papers/
);

CREATE INDEX idx_papers_year ON papers(year);
CREATE INDEX idx_papers_pmid ON papers(pmid);


-- ============================================================
-- SOLUTIONS: what was put in the well / perfused into tissue
-- ============================================================
-- A solution is a specific "recipe" — one or more compounds at defined
-- concentrations. Could be a single CPA, a binary mix, or a named cocktail.
--
-- The same abstract recipe tested in different papers gets separate entries
-- because the preparation may differ. Paper DOI is part of the identity.

CREATE TABLE solutions (
    id                  SERIAL PRIMARY KEY,
    paper_doi           TEXT NOT NULL REFERENCES papers(doi),
    name                TEXT,              -- named cocktails: "VS55", "DP6", "M22"; null for unnamed
    total_concentration REAL NOT NULL,     -- total CPA concentration
    concentration_unit  TEXT NOT NULL CHECK (concentration_unit IN (
                            'M',           -- molar (mol/L)
                            'mol/kg',      -- molal (mol per kg solvent)
                            'pct_wv',      -- % weight/volume
                            'pct_vv',      -- % volume/volume
                            'pct_ww',      -- % weight/weight
                            'mOsm/kg'      -- osmolality
                        )),
    n_components        INTEGER NOT NULL CHECK (n_components >= 1),
    carrier_solution    TEXT,              -- "Euro-Collins", "HBS", "PBS", etc.
    notes               TEXT
);

CREATE INDEX idx_solutions_paper ON solutions(paper_doi);
CREATE INDEX idx_solutions_name ON solutions(name) WHERE name IS NOT NULL;
CREATE INDEX idx_solutions_n_components ON solutions(n_components);


-- ============================================================
-- SOLUTION_COMPONENTS: which compounds at what amount in each solution
-- ============================================================
-- Junction table. For a binary 6 mol/kg equimolar mix of DMSO + EG:
--   solution_id=X, compound_id="dmso", concentration=3.0, mole_fraction=0.5
--   solution_id=X, compound_id="ethylene_glycol", concentration=3.0, mole_fraction=0.5

CREATE TABLE solution_components (
    solution_id         INTEGER NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    compound_id         TEXT NOT NULL REFERENCES compounds(id),
    concentration       REAL NOT NULL,     -- concentration of THIS component
    concentration_unit  TEXT NOT NULL,      -- must match parent solution's unit system
    mole_fraction       REAL,              -- fraction of total CPA (0-1, should sum to ~1)
    CONSTRAINT pk_solution_components PRIMARY KEY (solution_id, compound_id),
    CONSTRAINT chk_concentration_positive CHECK (concentration > 0),
    CONSTRAINT chk_mole_fraction_range CHECK (mole_fraction IS NULL OR (mole_fraction > 0 AND mole_fraction <= 1))
);

CREATE INDEX idx_sc_compound ON solution_components(compound_id);


-- ============================================================
-- EXPERIMENTS: a specific test of a solution under defined conditions
-- ============================================================
-- One experiment = one well plate run (or one perfusion, one DSC scan, etc.)
-- This captures the HOW: what cells, what temperature, how long.

CREATE TABLE experiments (
    id                  SERIAL PRIMARY KEY,
    solution_id         INTEGER NOT NULL REFERENCES solutions(id),
    paper_doi           TEXT NOT NULL REFERENCES papers(doi),
    cell_type           TEXT,              -- "BPAEC", "T24", "HEK293", "rabbit_kidney_cortex"
    organism            TEXT,              -- "bovine", "human", "rabbit"
    assay_method        TEXT,              -- "calcein_fluorescence", "presto_blue", "mtt", "K/Na_ratio"
    temperature_c       REAL,              -- exposure temperature in °C
    exposure_time_min   REAL,              -- duration of CPA exposure in minutes
    protocol            TEXT CHECK (protocol IN (
                            'single_step',   -- CPA added in one step
                            'two_step',      -- CPA added then removed in two steps
                            'multi_step',    -- gradual addition/removal
                            'perfusion',     -- vascular perfusion (organs)
                            'other',
                            NULL             -- not specified
                        )),
    n_replicates        INTEGER,           -- number of replicate wells/samples
    source_location     TEXT NOT NULL,      -- "Table 1", "Figure 3A", "Section 3.2"
    notes               TEXT
);

CREATE INDEX idx_experiments_solution ON experiments(solution_id);
CREATE INDEX idx_experiments_paper ON experiments(paper_doi);
CREATE INDEX idx_experiments_cell_type ON experiments(cell_type);
CREATE INDEX idx_experiments_temp ON experiments(temperature_c);


-- ============================================================
-- MEASUREMENTS: one measured value from one experiment
-- ============================================================
-- Strict: one row = one number. Different metrics from the same experiment
-- are separate rows (e.g., viability AND permeability from same well plate).
--
-- This keeps units clean and allows different metrics to have different
-- uncertainty types, significance flags, etc.

CREATE TABLE measurements (
    id                  SERIAL PRIMARY KEY,
    experiment_id       INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    metric              TEXT NOT NULL CHECK (metric IN (
                            'viability',         -- cell survival fraction (0-1)
                            'permeability_cpa',  -- CPA membrane permeability (P_CPA)
                            'permeability_water', -- water permeability (Lp)
                            'ea_cpa',            -- activation energy for CPA transport
                            'ea_water',          -- activation energy for water transport
                            'tg',                -- glass transition temperature
                            'ccr',               -- critical cooling rate
                            'cwr',               -- critical warming rate
                            'tm',                -- melting temperature
                            'td',                -- devitrification temperature
                            'k_na_ratio',        -- K+/Na+ ratio (tissue viability)
                            'ice_fraction',       -- fraction of ice formed
                            'other'
                        )),
    value               REAL NOT NULL,
    uncertainty         REAL,              -- SEM, SD, or CI half-width
    uncertainty_type    TEXT CHECK (uncertainty_type IN ('sem', 'sd', 'ci95', NULL)),
    unit                TEXT NOT NULL,     -- "fraction", "1/s", "Pa-1_s-1", "kJ/mol", "degC", "degC/min"
    n_replicates        INTEGER,
    is_significant      BOOLEAN,           -- statistical significance vs control (if tested)
    p_value             REAL,              -- if reported
    notes               TEXT
);

CREATE INDEX idx_measurements_experiment ON measurements(experiment_id);
CREATE INDEX idx_measurements_metric ON measurements(metric);
CREATE INDEX idx_measurements_value ON measurements(value);

-- Composite index for common queries: "viability at specific conditions"
CREATE INDEX idx_measurements_metric_value ON measurements(metric, value);


-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Flat view for ML: one row per measurement with all context denormalized
CREATE VIEW v_flat_measurements AS
SELECT
    m.id AS measurement_id,
    m.metric,
    m.value,
    m.uncertainty,
    m.unit,
    e.temperature_c,
    e.exposure_time_min,
    e.cell_type,
    e.organism,
    e.assay_method,
    e.protocol,
    e.source_location,
    s.total_concentration,
    s.concentration_unit,
    s.n_components,
    s.name AS solution_name,
    p.doi AS paper_doi,
    p.year AS paper_year,
    p.title AS paper_title
FROM measurements m
JOIN experiments e ON m.experiment_id = e.id
JOIN solutions s ON e.solution_id = s.id
JOIN papers p ON e.paper_doi = p.doi;


-- Compound-level view: for each compound, all experiments it appears in
CREATE VIEW v_compound_experiments AS
SELECT
    c.id AS compound_id,
    c.name AS compound_name,
    c.abbreviation,
    c.molecular_weight,
    c.role,
    sc.concentration AS component_concentration,
    sc.mole_fraction,
    s.total_concentration,
    s.n_components,
    s.name AS solution_name,
    e.temperature_c,
    e.exposure_time_min,
    e.cell_type,
    m.metric,
    m.value,
    m.uncertainty,
    m.unit,
    p.doi AS paper_doi,
    e.source_location
FROM compounds c
JOIN solution_components sc ON c.id = sc.compound_id
JOIN solutions s ON sc.solution_id = s.id
JOIN experiments e ON e.solution_id = s.id
JOIN measurements m ON m.experiment_id = e.id
JOIN papers p ON e.paper_doi = p.doi;


-- Gap analysis view: which compounds have which types of measurements?
CREATE VIEW v_compound_coverage AS
SELECT
    c.id AS compound_id,
    c.name AS compound_name,
    c.abbreviation,
    array_agg(DISTINCT m.metric ORDER BY m.metric) AS metrics_measured,
    array_agg(DISTINCT e.temperature_c ORDER BY e.temperature_c) AS temperatures_tested,
    array_agg(DISTINCT e.cell_type ORDER BY e.cell_type) AS cell_types_tested,
    array_agg(DISTINCT s.total_concentration ORDER BY s.total_concentration) AS concentrations_tested,
    COUNT(DISTINCT m.id) AS total_measurements,
    COUNT(DISTINCT e.id) AS total_experiments,
    COUNT(DISTINCT p.doi) AS total_papers
FROM compounds c
JOIN solution_components sc ON c.id = sc.compound_id
JOIN solutions s ON sc.solution_id = s.id
JOIN experiments e ON e.solution_id = s.id
JOIN measurements m ON m.experiment_id = e.id
JOIN papers p ON e.paper_doi = p.doi
GROUP BY c.id, c.name, c.abbreviation;

COMMIT;
