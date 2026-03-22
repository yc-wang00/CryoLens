-- CryoLens Database Schema v2: Open-Source Research Database Extensions
--
-- This migration adds three critical layers for a production research database:
--   1. Molecular identity (SMILES, InChI, PubChem CID, computed descriptors)
--   2. Compound synonyms (so researchers can search by any name)
--   3. Named cocktail formulations (VS55, M22, DP6 as benchmarks)
--
-- Design for open source:
--   - Every value has a `source` field (where did this number come from?)
--   - Versioning via `created_at` timestamps
--   - Permissive licensing metadata on papers
--   - Stable compound IDs that won't change

BEGIN;

-- ============================================================
-- 1. COMPOUND SYNONYMS
-- ============================================================
-- A researcher might search for "propylene glycol", "1,2-propanediol",
-- "PG", "MPG", or "CAS 57-55-6". All should find the same compound.

CREATE TABLE compound_synonyms (
    id              SERIAL PRIMARY KEY,
    compound_id     TEXT NOT NULL REFERENCES compounds(id),
    synonym         TEXT NOT NULL,
    synonym_type    TEXT NOT NULL CHECK (synonym_type IN (
                        'iupac',         -- IUPAC systematic name
                        'common',        -- common/trivial name
                        'abbreviation',  -- short form (DMSO, EG, PG)
                        'trade_name',    -- commercial name (CryoStor, Vitalife)
                        'cas',           -- CAS registry number
                        'formula'        -- molecular formula
                    )),
    source          TEXT,  -- "PubChem", "paper", "manual"
    CONSTRAINT uq_synonym UNIQUE (compound_id, synonym)
);

CREATE INDEX idx_synonyms_synonym ON compound_synonyms(synonym);
CREATE INDEX idx_synonyms_compound ON compound_synonyms(compound_id);


-- ============================================================
-- 2. MOLECULAR DESCRIPTORS
-- ============================================================
-- Computed or looked-up molecular properties. Stored as key-value
-- pairs so new descriptors can be added without schema changes.
-- This is what ML models and RDKit workflows consume.

ALTER TABLE compounds ADD COLUMN IF NOT EXISTS smiles TEXT;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS inchi TEXT;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS inchi_key TEXT;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS pubchem_cid INTEGER;
ALTER TABLE compounds ADD COLUMN IF NOT EXISTS chembl_id TEXT;

CREATE TABLE compound_descriptors (
    compound_id     TEXT NOT NULL REFERENCES compounds(id),
    descriptor      TEXT NOT NULL,  -- 'logP', 'hbd', 'hba', 'tpsa', 'rotatable_bonds', 'molar_volume', etc.
    value           REAL NOT NULL,
    unit            TEXT,           -- null for dimensionless
    source          TEXT NOT NULL,  -- 'rdkit_computed', 'pubchem', 'literature'
    CONSTRAINT pk_descriptors PRIMARY KEY (compound_id, descriptor)
);

CREATE INDEX idx_descriptors_descriptor ON compound_descriptors(descriptor);


-- ============================================================
-- 3. FORMULATION REGISTRY
-- ============================================================
-- Named, published cocktail formulations. These are the benchmarks
-- that the entire field references. VS55, M22, DP6 are to
-- cryopreservation what RPMI and DMEM are to cell culture.
--
-- Separate from `solutions` because formulations are canonical recipes
-- that exist independent of any specific experiment or paper.
-- A solution is "we made this in the lab for this experiment."
-- A formulation is "this is the published recipe everyone uses."

CREATE TABLE formulations (
    id              TEXT PRIMARY KEY,       -- "vs55", "m22", "dp6"
    name            TEXT NOT NULL,          -- "VS55", "M22", "DP6"
    full_name       TEXT,                   -- "Vitrification Solution 55% w/v"
    total_concentration REAL,               -- total CPA concentration
    concentration_unit TEXT,
    carrier_solution TEXT,                  -- "Euro-Collins", "LM5"
    developed_by    TEXT,                   -- "Fahy et al., 21st Century Medicine"
    year_introduced INTEGER,               -- year first published
    reference_doi   TEXT,                   -- primary reference paper
    description     TEXT,
    notes           TEXT
);

CREATE TABLE formulation_components (
    formulation_id  TEXT NOT NULL REFERENCES formulations(id),
    compound_id     TEXT NOT NULL REFERENCES compounds(id),
    concentration   REAL NOT NULL,
    concentration_unit TEXT NOT NULL,
    role_in_formulation TEXT,  -- "primary CPA", "ice blocker", "carrier component"
    CONSTRAINT pk_formulation_components PRIMARY KEY (formulation_id, compound_id)
);

-- Thermal properties OF formulations (not individual compounds)
-- These are measured on the complete cocktail, not components
CREATE TABLE formulation_properties (
    id              SERIAL PRIMARY KEY,
    formulation_id  TEXT NOT NULL REFERENCES formulations(id),
    property        TEXT NOT NULL CHECK (property IN (
                        'tg',           -- glass transition temperature (°C)
                        'ccr',          -- critical cooling rate (°C/min)
                        'cwr',          -- critical warming rate (°C/min)
                        'tm',           -- melting temperature (°C)
                        'td',           -- devitrification onset temperature (°C)
                        'viscosity',    -- at specified temperature
                        'density',      -- at specified temperature
                        'osmolality',   -- total osmolality
                        'other'
                    )),
    value           REAL NOT NULL,
    unit            TEXT NOT NULL,
    measurement_condition TEXT,  -- "at Tg", "at 25°C", "DSC at 10°C/min"
    reference_doi   TEXT,        -- paper this value comes from
    source_location TEXT,        -- "Table 2", "p.165"
    notes           TEXT
);


-- ============================================================
-- 4. DATA QUALITY METADATA
-- ============================================================
-- For open source, every measurement needs provenance + quality info.

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS data_quality TEXT CHECK (data_quality IN (
    'tabulated',         -- exact value from a table in the paper
    'figure_reading',    -- approximate value read from a chart/graph
    'text_stated',       -- value explicitly stated in paper text
    'supplementary',     -- from supplementary materials
    'derived',           -- calculated from other values (e.g., Ea from Arrhenius)
    'estimated'          -- rough estimate, low confidence
));

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


-- ============================================================
-- 5. UPDATED VIEWS FOR THE COMPLETE DATABASE
-- ============================================================

-- Drop old views that need updating
DROP VIEW IF EXISTS v_flat_measurements;
DROP VIEW IF EXISTS v_compound_experiments;
DROP VIEW IF EXISTS v_compound_coverage;

-- Comprehensive flat view for ML and agent queries
CREATE VIEW v_flat_measurements AS
SELECT
    m.id AS measurement_id,
    m.metric,
    m.value,
    m.uncertainty,
    m.uncertainty_type,
    m.unit,
    m.data_quality,
    m.notes AS measurement_notes,
    e.temperature_c,
    e.exposure_time_min,
    e.cell_type,
    e.organism,
    e.outcome_status,
    e.source_location,
    s.total_concentration,
    s.concentration_unit,
    s.n_components,
    s.name AS solution_name,
    s.carrier_solution,
    -- Compound info (for single-component solutions)
    CASE WHEN s.n_components = 1 THEN sc.compound_id END AS compound_id,
    CASE WHEN s.n_components = 1 THEN c.name END AS compound_name,
    CASE WHEN s.n_components = 1 THEN c.abbreviation END AS compound_abbreviation,
    CASE WHEN s.n_components = 1 THEN c.molecular_weight END AS molecular_weight,
    CASE WHEN s.n_components = 1 THEN c.smiles END AS smiles,
    CASE WHEN s.n_components = 1 THEN c.role END AS compound_role,
    -- Protocol info
    pr.name AS protocol_name,
    pr.viability_assay,
    pr.automation_system,
    -- Paper info
    p.doi AS paper_doi,
    p.year AS paper_year,
    p.title AS paper_title,
    p.journal
FROM measurements m
JOIN experiments e ON m.experiment_id = e.id
JOIN solutions s ON e.solution_id = s.id
JOIN papers p ON e.paper_doi = p.doi
LEFT JOIN protocols pr ON e.protocol_id = pr.id
LEFT JOIN solution_components sc ON sc.solution_id = s.id
LEFT JOIN compounds c ON sc.compound_id = c.id;


-- Compound coverage for gap analysis
CREATE VIEW v_compound_coverage AS
SELECT
    c.id AS compound_id,
    c.name AS compound_name,
    c.abbreviation,
    c.molecular_weight,
    c.smiles,
    c.role,
    array_agg(DISTINCT m.metric ORDER BY m.metric) FILTER (WHERE m.metric IS NOT NULL) AS metrics_measured,
    array_agg(DISTINCT e.temperature_c ORDER BY e.temperature_c) FILTER (WHERE e.temperature_c IS NOT NULL) AS temperatures_tested,
    array_agg(DISTINCT e.cell_type ORDER BY e.cell_type) FILTER (WHERE e.cell_type IS NOT NULL) AS cell_types_tested,
    array_agg(DISTINCT s.total_concentration ORDER BY s.total_concentration) AS concentrations_tested,
    COUNT(DISTINCT m.id) AS total_measurements,
    COUNT(DISTINCT e.id) AS total_experiments,
    COUNT(DISTINCT p.doi) AS total_papers
FROM compounds c
LEFT JOIN solution_components sc ON c.id = sc.compound_id
LEFT JOIN solutions s ON sc.solution_id = s.id
LEFT JOIN experiments e ON e.solution_id = s.id
LEFT JOIN measurements m ON m.experiment_id = e.id
LEFT JOIN papers p ON e.paper_doi = p.doi
GROUP BY c.id, c.name, c.abbreviation, c.molecular_weight, c.smiles, c.role;


-- Formulation comparison view
CREATE VIEW v_formulation_summary AS
SELECT
    f.id,
    f.name,
    f.total_concentration,
    f.concentration_unit,
    f.carrier_solution,
    f.developed_by,
    f.year_introduced,
    array_agg(c.name || ' (' || fc.concentration || ' ' || fc.concentration_unit || ')' ORDER BY fc.concentration DESC) AS components,
    MAX(CASE WHEN fp.property = 'tg' THEN fp.value END) AS tg_degC,
    MAX(CASE WHEN fp.property = 'ccr' THEN fp.value END) AS ccr_degC_per_min,
    MAX(CASE WHEN fp.property = 'cwr' THEN fp.value END) AS cwr_degC_per_min
FROM formulations f
LEFT JOIN formulation_components fc ON fc.formulation_id = f.id
LEFT JOIN compounds c ON fc.compound_id = c.id
LEFT JOIN formulation_properties fp ON fp.formulation_id = f.id
GROUP BY f.id, f.name, f.total_concentration, f.concentration_unit,
         f.carrier_solution, f.developed_by, f.year_introduced;

COMMIT;
