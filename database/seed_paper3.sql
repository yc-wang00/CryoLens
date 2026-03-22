-- Paper 3: Ahmadkhani et al. (2025)
-- "Screening for cryoprotective agent toxicity and toxicity reduction in mixtures
--  at subambient temperatures"
-- bioRxiv DOI: 10.1101/2025.05.07.652719
--
-- KEY CONTRIBUTION: First systematic CPA toxicity data at 4°C (the actual temperature
-- used for CPA equilibration in organ cryopreservation). Shows toxicity is significantly
-- reduced at 4°C vs room temperature for most compounds.
--
-- DATA PROVENANCE:
--   Figure 2: 22 CPAs at 3 mol/kg, 10 and 30 min, 4°C
--   Figure 3: 87 binary mixtures at 6 mol/kg, 30 min, 4°C (bar chart)
--   Figure 4: 82 binary mixtures at 12 mol/kg, 30 min, 4°C (bar chart)
--   Figure 5: Temperature comparison (4°C vs 21°C) for 54 compositions at 6 mol/kg
--   Figures 6-9: Toxicity neutralization cases
--   Text: "80% of the compounds exhibited significantly greater viability at 4°C"
--   Text: "12 CPA mixtures at 6 mol/kg and 8 CPA mixtures at 12 mol/kg" showed
--         significantly lower toxicity than their constituents
--   Text (p13): FA/GLY at 12 mol/kg: "97% viability" vs "20% for FA alone"
--
-- All experiments: BPAEC cells, PrestoBlue assay, 4°C

BEGIN;

INSERT INTO papers (doi, title, authors, year, journal, pdf_path) VALUES (
    '10.1101/2025.05.07.652719',
    'Screening for cryoprotective agent toxicity and toxicity reduction in mixtures at subambient temperatures',
    ARRAY['Ahmadkhani N', 'Sugden C', 'Mayo AT', 'Higgins AZ'],
    2025,
    'bioRxiv',
    'corpus/papers/ppr_10.1101_2025.05.07.652719.pdf'
);

-- ============================================================
-- Figure 2: 22 CPAs at 3 mol/kg, 30 min, 4°C
-- Values read from bar chart
-- ============================================================

-- Helper function: create solution + component + experiment + viability in one block
-- For single compounds at 3 mol/kg, 4°C, 30 min

-- BD
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_3_butanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.0, 'fraction', 'Read from Figure 2, 30 min bar, 4°C');

-- DG
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'diethylene_glycol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.08, 'fraction', 'Read from Figure 2');

-- DHA
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '1_3_dihydroxyacetone', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.92, 'fraction', 'Read from Figure 2');

-- Diglyme
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'diglyme', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.85, 'fraction', 'Read from Figure 2');

-- DMA
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'dimethylacetamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.88, 'fraction', 'Read from Figure 2');

-- EG
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'ethylene_glycol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.90, 'fraction', 'Read from Figure 2');

-- GLY
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'glycerol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.92, 'fraction', 'Read from Figure 2');

-- MPD
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_methyl_2_4_pentanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.08, 'fraction', 'Read from Figure 2. Toxic at 3 mol/kg 4°C');

-- MP
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_methyl_1_3_propanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.88, 'fraction', 'Read from Figure 2');

-- NMA
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'n_methylacetamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.90, 'fraction', 'Read from Figure 2');

-- PD
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '1_3_propanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.90, 'fraction', 'Read from Figure 2');

-- PA
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'propionamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.25, 'fraction', 'Read from Figure 2. Above 1.0 — cells may have proliferated');

-- TGDE
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'tetraethylene_glycol_dimethyl_ether', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.05, 'fraction', 'Read from Figure 2. Toxic.');

-- TFA
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'tetrahydrofurfuryl_alcohol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.08, 'fraction', 'Read from Figure 2. Toxic.');

-- TGD (Triethylene Glycol Diacetate)
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'triethylene_glycol_diacetate', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.72, 'fraction', 'Read from Figure 2');

-- AM (Acetamide) — no data for 10 min per figure note
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'acetamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.90, 'fraction', 'Read from Figure 2');

-- PG — no data for 10 min per figure note
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'propylene_glycol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.92, 'fraction', 'Read from Figure 2');

-- FA — no data for 10 min per figure note
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'formamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.25, 'fraction', 'Read from Figure 2');

-- DMSO — no data for 10 min per figure note
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'dmso', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.90, 'fraction', 'Read from Figure 2');

-- Triglyme
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'triglyme', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 4, 'Figure 2', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.05, 'fraction', 'Read from Figure 2. Toxic.');


-- ============================================================
-- KEY FINDING: FA/GLY toxicity neutralization at 12 mol/kg, 4°C
-- Text (p13): "the 12 mol/kg mixture resulted in 97% viability,
-- which is much higher than the 20% viability observed for 6 mol/kg FA alone"
-- This is the paper's most striking result.
-- ============================================================

INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution, notes)
VALUES ('10.1101/2025.05.07.652719', 'FA/GLY', 12.0, 'mol/kg', 2, 'HBS', 'Most striking toxicity neutralization finding');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'formamide', 6.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), 'glycerol', 6.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 8, 'Figure 9, Text p13', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.97, 'fraction', 'Text states 97% viability. TOXICITY NEUTRALIZATION: FA alone at 6 mol/kg = 20% viability. Mixture at 12 mol/kg = 97%.');

-- GLY/EG at 12 mol/kg — another neutralization case from Figure 9
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 'GLY/EG', 12.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'glycerol', 6.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), 'ethylene_glycol', 6.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 8, 'Figure 9', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.72, 'fraction', 'Read from Figure 9. Neutralization vs GLY alone (~0.45)');

-- GLY/FA at 12 mol/kg (same as FA/GLY but confirms)
-- Already captured above

-- DMSO/FA at 12 mol/kg
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 'DMSO/FA', 12.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'dmso', 6.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), 'formamide', 6.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 8, 'Figure 9', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.85, 'fraction', 'Read from Figure 9. DMSO/FA neutralization at 4°C.');

-- EG/AM at 12 mol/kg
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 'EG/AM', 12.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'ethylene_glycol', 6.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), 'acetamide', 6.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 8, 'Figure 9', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.55, 'fraction', 'Read from Figure 9.');

-- GLY/AM at 12 mol/kg
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.07.652719', 'GLY/AM', 12.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'glycerol', 6.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), 'acetamide', 6.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.07.652719', 'BPAEC', 'bovine', 'presto_blue', 4.0, 30.0, 'two_step', 8, 'Figure 9', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.55, 'fraction', 'Read from Figure 9.');

COMMIT;
