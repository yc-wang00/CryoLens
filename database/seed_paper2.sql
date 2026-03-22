-- Paper 2: Ahmadkhani et al. (2025)
-- "High-Throughput Evaluation of Cryoprotective Agents for Mixture Effects That Reduce Toxicity"
-- bioRxiv DOI: 10.1101/2025.05.02.651925
--
-- DATA PROVENANCE:
--   Figure 3: Viability at 3 mol/kg, 10 and 30 min, room temperature (~25°C), 21 CPAs
--   Figure 4: Viability at 3 vs 6 mol/kg, 30 min, room temperature, 11 CPAs
--   Figure 5: Binary mixture viability at 6 mol/kg, 30 min, room temperature, 46 mixtures
--   Figure 6: Toxicity neutralization cases (FA/GLY, DMSO/PD, PG/DG, DG/PD)
--   Text (p9): "only 7 yielded a viability exceeding 80% after 30 min exposure
--              (GLY, DMSO, PG, EG, DG, PD, and ME)"
--   Text (p10): "only EG yielded high viability after exposure to a 6 mol/kg concentration"
--
-- NOTE: All viability values are approximate, read from bar charts.
-- Uncertainty (SEM) is read where visible; otherwise omitted.
-- Room temperature = ~25°C per paper methods.
-- All experiments use BPAEC cells, PrestoBlue assay, two-step CPA addition protocol.

BEGIN;

-- ============================================================
-- PAPER
-- ============================================================

INSERT INTO papers (doi, title, authors, year, journal, pdf_path) VALUES (
    '10.1101/2025.05.02.651925',
    'High-Throughput Evaluation of Cryoprotective Agents for Mixture Effects That Reduce Toxicity',
    ARRAY['Ahmadkhani N', 'Sugden C', 'Benson JD', 'Eroglu A', 'Higgins AZ'],
    2025,
    'bioRxiv',
    'corpus/papers/40654698.pdf'
);


-- ============================================================
-- Figure 3: 21 CPAs at 3 mol/kg, 30 min, room temp
-- Text states: "only 7 yielded viability exceeding 80%: GLY, DMSO, PG, EG, DG, PD, and ME"
-- Values read from bar chart (30 min bars)
-- ============================================================

-- Create solutions at 3 mol/kg for the 21 CPAs tested
-- (Using existing compound IDs from Paper 1)

-- GLY at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components (solution_id, compound_id, concentration, concentration_unit, mole_fraction)
VALUES (currval('solutions_id_seq'), 'glycerol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.05, 'fraction', 'Read from Figure 3 bar chart, 30 min');

-- DHA at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '1_3_dihydroxyacetone', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.95, 'fraction', 'Read from Figure 3');

-- DG at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'diethylene_glycol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.88, 'fraction', 'Read from Figure 3');

-- EG at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'ethylene_glycol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.90, 'fraction', 'Read from Figure 3');

-- TFA at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'tetrahydrofurfuryl_alcohol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.72, 'fraction', 'Read from Figure 3');

-- NMA at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'n_methylacetamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.78, 'fraction', 'Read from Figure 3');

-- PD at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '1_3_propanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.82, 'fraction', 'Read from Figure 3');

-- BD at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_3_butanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.75, 'fraction', 'Read from Figure 3');

-- MP at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_methyl_1_3_propanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.40, 'fraction', 'Read from Figure 3');

-- ME at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_methoxyethanol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.82, 'fraction', 'Read from Figure 3. Listed as one of 7 > 80%');

-- MPD at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_methyl_2_4_pentanediol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.62, 'fraction', 'Read from Figure 3');

-- TGDE at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'tetraethylene_glycol_dimethyl_ether', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.10, 'fraction', 'Read from Figure 3');

-- TG at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'triethylene_glycol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.70, 'fraction', 'Read from Figure 3');

-- DMA at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'dimethylacetamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.70, 'fraction', 'Read from Figure 3');

-- AM at 3 mol/kg (NOTE: concentration was 1.1 mol/kg due to error per paper text)
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution, notes)
VALUES ('10.1101/2025.05.02.651925', 1.1, 'mol/kg', 1, 'HBS', 'Acetamide was 1.1 mol/kg due to solution preparation error (paper text line 209)');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'acetamide', 1.1, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.92, 'fraction', 'Read from Figure 3. Note: actual conc was 1.1 mol/kg, not 3');

-- TGM (triglyme) at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'triglyme', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.55, 'fraction', 'Read from Figure 3');

-- PA at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'propionamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.65, 'fraction', 'Read from Figure 3');

-- DMSO at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'dmso', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.90, 'fraction', 'Read from Figure 3');

-- PG at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'propylene_glycol', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.88, 'fraction', 'Read from Figure 3');

-- FA at 3 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 3.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'formamide', 3.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 3', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.40, 'fraction', 'Read from Figure 3');


-- ============================================================
-- Figure 4: 11 CPAs at 6 mol/kg, 30 min, room temp
-- Text: "only EG yielded high viability after exposure to 6 mol/kg"
-- ============================================================

-- GLY at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'glycerol', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.75, 'fraction', 'Read from Figure 4');

-- DG at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'diethylene_glycol', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.55, 'fraction', 'Read from Figure 4');

-- EG at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'ethylene_glycol', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.85, 'fraction', 'Read from Figure 4. Text: only EG yielded high viability at 6 mol/kg');

-- AM at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'acetamide', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.25, 'fraction', 'Read from Figure 4');

-- NMA at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'n_methylacetamide', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.60, 'fraction', 'Read from Figure 4');

-- PD at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '1_3_propanediol', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.25, 'fraction', 'Read from Figure 4');

-- BD at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_3_butanediol', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.30, 'fraction', 'Read from Figure 4');

-- ME at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), '2_methoxyethanol', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.45, 'fraction', 'Read from Figure 4');

-- FA at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'formamide', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.02, 'fraction', 'Read from Figure 4. Essentially zero.');

-- DMSO at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'dmso', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.30, 'fraction', 'Read from Figure 4');

-- PG at 6 mol/kg
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 6.0, 'mol/kg', 1, 'HBS');
INSERT INTO solution_components VALUES (currval('solutions_id_seq'), 'propylene_glycol', 6.0, 'mol/kg', 1.0);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 4', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.42, 'fraction', 'Read from Figure 4');


-- ============================================================
-- Figure 6: Key toxicity neutralization cases at 6 mol/kg
-- These are the most scientifically significant findings.
-- Binary mixtures = 3 mol/kg each component (equimolar split)
-- ============================================================

-- FA/GLY mixture (6 mol/kg total = 3 mol/kg FA + 3 mol/kg GLY)
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 'FA/GLY', 6.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'formamide', 3.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), 'glycerol', 3.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 6', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.55, 'fraction', 'Read from Figure 6. TOXICITY NEUTRALIZATION: mixture > both FA(~0.02) and GLY(~0.55) alone at 6 mol/kg');

-- DMSO/PD mixture (6 mol/kg total = 3 mol/kg DMSO + 3 mol/kg PD)
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 'DMSO/PD', 6.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'dmso', 3.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), '1_3_propanediol', 3.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 6', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.55, 'fraction', 'Read from Figure 6. TOXICITY NEUTRALIZATION: mixture > both DMSO(~0.30) and PD(~0.25) alone at 6 mol/kg');

-- PG/DG mixture (6 mol/kg total)
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 'PG/DG', 6.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'propylene_glycol', 3.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), 'diethylene_glycol', 3.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 6', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.55, 'fraction', 'Read from Figure 6. TOXICITY NEUTRALIZATION: mixture > both PG(~0.42) and DG(~0.55) alone');

-- DG/PD mixture (6 mol/kg total)
INSERT INTO solutions (paper_doi, name, total_concentration, concentration_unit, n_components, carrier_solution)
VALUES ('10.1101/2025.05.02.651925', 'DG/PD', 6.0, 'mol/kg', 2, 'HBS');
INSERT INTO solution_components VALUES
    (currval('solutions_id_seq'), 'diethylene_glycol', 3.0, 'mol/kg', 0.5),
    (currval('solutions_id_seq'), '1_3_propanediol', 3.0, 'mol/kg', 0.5);
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, protocol, n_replicates, source_location, outcome_status)
VALUES (currval('solutions_id_seq'), '10.1101/2025.05.02.651925', 'BPAEC', 'bovine', 'presto_blue', 25.0, 30.0, 'two_step', 4, 'Figure 6', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.45, 'fraction', 'Read from Figure 6. TOXICITY NEUTRALIZATION: mixture > both DG(~0.55) and PD(~0.25) alone');

COMMIT;
