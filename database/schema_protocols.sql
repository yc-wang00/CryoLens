-- CryoLens Protocol Schema Extension
-- Captures the step-by-step CPA loading/unloading procedures
-- that determine whether a formulation actually works.
--
-- Design principle: A protocol is a REUSABLE entity. Many experiments
-- in the same paper (or across papers) use the same protocol.
-- The protocol is a time-ordered sequence of steps.

BEGIN;

-- ============================================================
-- PROTOCOLS: a named, reusable procedure for CPA exposure
-- ============================================================
-- A protocol defines HOW the CPA is added, held, and removed.
-- It's separate from WHAT compound is used (that's in solutions)
-- and WHERE it's tested (that's in experiments).
--
-- Example: "Ahmadkhani two-step method for 3 mol/kg" is one protocol
-- that was used across hundreds of experiments in Papers 2 and 3.

CREATE TABLE protocols (
    id                  SERIAL PRIMARY KEY,
    paper_doi           TEXT NOT NULL REFERENCES papers(doi),
    name                TEXT NOT NULL,        -- human-readable: "two-step 3 mol/kg", "single-step"
    description         TEXT,                 -- brief summary of the full procedure

    -- Cell preparation context
    cell_type           TEXT,                 -- "BPAEC", "T24"
    cell_source         TEXT,                 -- "Cell Applications Inc", "ATCC"
    organism            TEXT,                 -- "bovine", "human"
    passage_range       TEXT,                 -- "2-5", "up to 25"
    plate_format        TEXT,                 -- "96-well clear", "96-well black"
    seeding_density     INTEGER,              -- cells per well: 10000, 25000
    culture_medium      TEXT,                 -- "DMEM + 10% FBS", "McCoy's 5A"

    -- CPA preparation context
    carrier_solution    TEXT,                 -- "isotonic HBS", "DPBS + 10% FBS + 25mM HEPES"
    carrier_osmolality  REAL,                 -- mOsm/kg: 300
    stock_concentration REAL,                 -- mol/kg or M of stock solutions
    stock_unit          TEXT,

    -- Assessment method
    viability_assay     TEXT,                 -- "calcein_fluorescence", "presto_blue", "mtt"
    viability_timepoint TEXT,                 -- "20-24 h post-exposure", "immediately after"

    -- Automation
    automation_system   TEXT,                 -- "Hamilton Microlab STARlet", "MultiFlo FX", "manual"

    -- Source in paper
    source_location     TEXT NOT NULL,        -- "Methods Section 2.2", "Figure 1", "Supplementary S1"

    -- Quality metrics (for HTS papers)
    z_factor            REAL,                 -- if validated for HTS
    cv_percent          REAL,                 -- coefficient of variation

    notes               TEXT
);

CREATE INDEX idx_protocols_paper ON protocols(paper_doi);


-- ============================================================
-- PROTOCOL_STEPS: time-ordered steps within a protocol
-- ============================================================
-- Each row is one step in the procedure. The step_order defines
-- the sequence. This captures the actual ramp of concentration
-- and temperature changes that the cells experience.
--
-- Example: Paper 2's "two-step for 6 mol/kg" protocol:
--   Step 1: Add 3 mol/kg CPA in isotonic buffer, 2.5 min
--   Step 2: Replace with 6 mol/kg CPA in isotonic buffer, 30 min
--   Step 3: Replace with 3 mol/kg CPA in hypertonic buffer (1200 mOsm), 8 min
--   Step 4: Replace with hypertonic buffer (no CPA), 10 min
--   Step 5: Return to isotonic conditions

CREATE TABLE protocol_steps (
    id                  SERIAL PRIMARY KEY,
    protocol_id         INTEGER NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    step_order          INTEGER NOT NULL,       -- 1, 2, 3... in chronological order

    -- What happens in this step
    action              TEXT NOT NULL CHECK (action IN (
                            'seed_cells',         -- plate cells and culture
                            'pre_incubate',       -- temperature equilibration before CPA
                            'add_cpa',            -- introduce CPA solution
                            'hold',               -- maintain current conditions
                            'increase_cpa',       -- step up to higher CPA concentration
                            'decrease_cpa',       -- step down CPA (part of removal)
                            'wash',               -- wash with buffer/carrier
                            'dilute',             -- dilute CPA with carrier solution
                            'remove_solution',    -- aspirate solution from wells
                            'add_carrier',        -- add carrier/buffer without CPA
                            'assess_viability',   -- run the viability assay
                            'culture_recovery',   -- post-exposure recovery culture
                            'other'
                        )),

    -- Conditions during this step
    cpa_concentration   REAL,                  -- mol/kg or M of CPA in this step (null if no CPA)
    concentration_unit  TEXT,
    solution_osmolality REAL,                  -- total osmolality in mOsm/kg
    temperature_c       REAL,                  -- °C during this step
    duration_min        REAL,                  -- how long this step lasts
    volume_ul           REAL,                  -- volume added/removed in µL

    -- Method details
    method              TEXT,                  -- "automated 8-channel pipette", "multi-channel manual"

    description         TEXT,                  -- free text: "Add 100 µL of test solution at 100 µL/sec"

    CONSTRAINT uq_protocol_step UNIQUE (protocol_id, step_order)
);

CREATE INDEX idx_steps_protocol ON protocol_steps(protocol_id);


-- ============================================================
-- Link experiments to protocols
-- ============================================================
-- Add protocol_id to experiments table

ALTER TABLE experiments ADD COLUMN protocol_id INTEGER REFERENCES protocols(id);
CREATE INDEX idx_experiments_protocol ON experiments(protocol_id);

COMMENT ON COLUMN experiments.protocol_id IS 'References the full step-by-step protocol used. This replaces the simple protocol TEXT field for detailed protocol tracking.';

COMMIT;
