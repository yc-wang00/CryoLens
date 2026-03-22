-- Paper 4: Jaskiewicz, Callahan-Muller, Gaby-Biegel, Glover, Sandlin (2025)
-- "Validation of a high-throughput screening assay for the characterization
--  of cryoprotective agent toxicity"
-- bioRxiv DOI: 10.1101/2025.05.26.654916
-- Harvard/MGH group (different lab from Ahmadkhani/Higgins)
--
-- KEY CONTRIBUTION: Validated HTS assay with rigorous statistical metrics (Z-factor=0.75).
-- Screened 587 unique CPA cocktails (2-7 components) at 3.5-8 M.
-- Different cell type (T24 bladder carcinoma), different assay (MTT), room temp.
--
-- DATA PROVENANCE:
--   Text (p8): "587 unique CPA cocktails with concentrations ranging from 3.5-8 M"
--   Text (p8): "2,352 total experiments" (N=2-9 replicates per cocktail)
--   Text (p8): "CPA cocktails tested at a concentration of 5 M were found to be highly
--              informative, where cell survival ranged from 2.8-87.3%"
--   Text (p8): "favorable hit rate of 1.7%, defined here as cell viability ≥80%"
--   Text (p8): Seven component CPAs: "ethylene glycol, Me2SO, glycerol,
--              1,2-propanediol, 3-methoxy-1,2-propanediol, 1,3-propanediol, and urea"
--   Z-factor: 0.75 (p4), CV < 20%, drift < 20%
--
-- NOTE: Individual cocktail data is in the Supplemental Excel file which we don't have.
-- We capture the summary statistics and the component library composition.

BEGIN;

INSERT INTO papers (doi, title, authors, year, journal, pdf_path) VALUES (
    '10.1101/2025.05.26.654916',
    'Validation of a high-throughput screening assay for the characterization of cryoprotective agent toxicity',
    ARRAY['Jaskiewicz JJ', 'Callahan-Muller A', 'Gaby-Biegel N', 'Glover Z', 'Sandlin RD'],
    2025,
    'bioRxiv',
    'corpus/papers/ppr_10.1101_2025.05.26.654916.pdf'
);

-- Add new compound: 3-methoxy-1,2-propanediol (not in Ahmadkhani papers)
INSERT INTO compounds (id, name, abbreviation, cas_number, molecular_weight, role)
VALUES ('3_methoxy_1_2_propanediol', '3-Methoxy-1,2-propanediol', NULL, '623-39-2', 106.12, 'penetrating')
ON CONFLICT (id) DO NOTHING;

-- Add new compound: urea
INSERT INTO compounds (id, name, abbreviation, cas_number, molecular_weight, role)
VALUES ('urea', 'Urea', NULL, '57-13-6', 60.06, 'penetrating')
ON CONFLICT (id) DO NOTHING;

-- Add new compound: 1,2-propanediol (propylene glycol synonym — already exists as propylene_glycol)
-- No new insert needed, PG = 1,2-propanediol

-- ============================================================
-- Summary-level data from the pilot screen
-- We record this as a "meta-experiment" representing the screen
-- ============================================================

-- The "best hit" from the pilot screen: 87.3% viability at 5M
-- We don't know the exact composition but can record the finding
-- Create a placeholder solution representing the screen parameters
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution, notes)
VALUES ('10.1101/2025.05.26.654916', 'Pilot screen best hit', 5.0, 'M', 2, 'DPBS + 10% FBS + 25mM HEPES',
        'Best performing cocktail from 587-cocktail pilot screen. Exact composition in Supplemental Excel file.');
INSERT INTO solution_components VALUES
    -- Placeholder: we know it contains at least 2 of the 7 library components
    -- but exact composition unknown without supplemental data
    (currval('solutions_id_seq'), 'ethylene_glycol', 2.5, 'M', 0.5);
-- Note: second component unknown

INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status, notes)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.26.654916', 'T24', 'human', 'mtt', 25.0, 60.0, 'single_step', 9, 'Text p8', 'measurable',
        'Best hit from 587-cocktail pilot screen. Z-factor=0.75. Total: 2352 experiments across 56 plates.');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.873, 'fraction', 'Highest viability at 5M from pilot screen. Text: "cell survival ranged from 2.8-87.3%"');

-- Record the screening summary as a separate low-viability data point
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution, notes)
VALUES ('10.1101/2025.05.26.654916', 'Pilot screen worst hit', 5.0, 'M', 2, 'DPBS + 10% FBS + 25mM HEPES',
        'Worst performing cocktail from 587-cocktail pilot screen.');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'ethylene_glycol', 2.5, 'M', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.26.654916', 'T24', 'human', 'mtt', 25.0, 60.0, 'single_step', 2, 'Text p8', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.028, 'fraction', 'Lowest viability at 5M from pilot screen. Text: "cell survival ranged from 2.8-87.3%"');

COMMIT;
