-- Paper 1 completion: 25°C permeability (Table 1), viability (Figure 6), Fast/Toxic status
-- Source: Ahmadkhani et al. (2025), DOI: 10.1038/s41598-025-85509-x
--
-- DATA PROVENANCE:
--   Table 1 right columns: P_CPA and Lp at 25°C (exact values from table)
--   Figure 6A: Viability at 4°C, ~1M, ~25 min (read from scatter plot — approximate)
--   Figure 6B: Viability at 25°C, ~2M, ~20 min (read from scatter plot — approximate)
--   Text p4: "Four chemicals were found to be toxic: N,N-dimethylethanolamine,
--            ethanolamine, diethylene glycol monobutyl ether, and pyridine" (at 4°C)
--   Text p7: "six chemicals were found to be toxic: triethanolamine, triethylene
--            glycol diacetate, N,N-dimethylethanolamine, ethanolamine, diethylene
--            glycol monobutyl ether, and pyridine" (at 25°C)

BEGIN;

-- ============================================================
-- 25°C SOLUTIONS (same 28 compounds at 2 mol/kg)
-- Paper: "solutions had a total osmolality of 2000 ± 100 mOsm/kg" at 25°C
-- ============================================================

INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution) VALUES
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 29: sucrose
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 30: 1,3-propanediol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 31: 1,3-dihydroxyacetone
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 32: triethylene glycol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 33: propionamide
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 34: acetamide
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 35: diethylene glycol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 36: dmso
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 37: ethylene glycol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 38: formamide
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 39: glycerol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 40: n-methylacetamide
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 41: propylene glycol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 42: triethanolamine
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 43: 2,3-butanediol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 44: 2-methyl-1,3-propanediol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 45: 2-methoxyethanol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 46: 2-methyl-2,4-pentanediol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 47: diglyme
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 48: TGDE
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 49: dimethylacetamide
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 50: triethylene glycol diacetate
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 51: triglyme
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 52: tetrahydrofurfuryl alcohol
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 53: DEGMBE
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 54: pyridine
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS'),  -- 55: NN-dimethylethanolamine
    ('10.1038/s41598-025-85509-x', 2.0, 'mol/kg', 1, 'HBS');  -- 56: ethanolamine

-- Solution components for 25°C solutions (IDs 29-56)
INSERT INTO solution_components (solution_id, compound_id, concentration, concentration_unit, mole_fraction) VALUES
    (29, 'sucrose',                     2.0, 'mol/kg', 1.0),
    (30, '1_3_propanediol',             2.0, 'mol/kg', 1.0),
    (31, '1_3_dihydroxyacetone',        2.0, 'mol/kg', 1.0),
    (32, 'triethylene_glycol',          2.0, 'mol/kg', 1.0),
    (33, 'propionamide',                2.0, 'mol/kg', 1.0),
    (34, 'acetamide',                   2.0, 'mol/kg', 1.0),
    (35, 'diethylene_glycol',           2.0, 'mol/kg', 1.0),
    (36, 'dmso',                        2.0, 'mol/kg', 1.0),
    (37, 'ethylene_glycol',             2.0, 'mol/kg', 1.0),
    (38, 'formamide',                   2.0, 'mol/kg', 1.0),
    (39, 'glycerol',                    2.0, 'mol/kg', 1.0),
    (40, 'n_methylacetamide',           2.0, 'mol/kg', 1.0),
    (41, 'propylene_glycol',            2.0, 'mol/kg', 1.0),
    (42, 'triethanolamine',             2.0, 'mol/kg', 1.0),
    (43, '2_3_butanediol',              2.0, 'mol/kg', 1.0),
    (44, '2_methyl_1_3_propanediol',    2.0, 'mol/kg', 1.0),
    (45, '2_methoxyethanol',            2.0, 'mol/kg', 1.0),
    (46, '2_methyl_2_4_pentanediol',    2.0, 'mol/kg', 1.0),
    (47, 'diglyme',                     2.0, 'mol/kg', 1.0),
    (48, 'tetraethylene_glycol_dimethyl_ether', 2.0, 'mol/kg', 1.0),
    (49, 'dimethylacetamide',           2.0, 'mol/kg', 1.0),
    (50, 'triethylene_glycol_diacetate',2.0, 'mol/kg', 1.0),
    (51, 'triglyme',                    2.0, 'mol/kg', 1.0),
    (52, 'tetrahydrofurfuryl_alcohol',  2.0, 'mol/kg', 1.0),
    (53, 'diethylene_glycol_monobutyl_ether', 2.0, 'mol/kg', 1.0),
    (54, 'pyridine',                    2.0, 'mol/kg', 1.0),
    (55, 'nn_dimethylethanolamine',     2.0, 'mol/kg', 1.0),
    (56, 'ethanolamine',                2.0, 'mol/kg', 1.0);


-- ============================================================
-- 25°C PERMEABILITY DATA from Table 1 (right two columns)
-- Values are ×10⁻³ for P_CPA and ×10⁻⁸ for Lp in the table
-- Stored as raw values (multiply by 10⁻³ and 10⁻⁸ respectively)
-- ============================================================

-- Sucrose (25°C): P_CPA=5.46±0.58, Lp=8.93±0.14
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (29, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.00546, 0.00058, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 8.93e-8, 0.14e-8, 'sem', 'Pa-1_s-1');

-- 1,3-Propanediol (25°C): P_CPA=345.53±15.39, Lp=5.8±0.29
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (30, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.34553, 0.01539, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 5.8e-8, 0.29e-8, 'sem', 'Pa-1_s-1');

-- 1,3-Dihydroxyacetone (25°C): P_CPA=28.39±4.01, Lp=6.77±0.37
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (31, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.02839, 0.00401, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 6.77e-8, 0.37e-8, 'sem', 'Pa-1_s-1');

-- Triethylene Glycol (25°C): P_CPA=151.07±4.17, Lp=7.32±0.22
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (32, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.15107, 0.00417, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 7.32e-8, 0.22e-8, 'sem', 'Pa-1_s-1');

-- Propionamide (25°C): P_CPA=448.88±18.87, Lp=9.42±0.51
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (33, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.44888, 0.01887, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 9.42e-8, 0.51e-8, 'sem', 'Pa-1_s-1');

-- Acetamide (25°C): P_CPA=174.82±19.02, Lp=5.94±0.28
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (34, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.17482, 0.01902, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 5.94e-8, 0.28e-8, 'sem', 'Pa-1_s-1');

-- Diethylene Glycol (25°C): P_CPA=247.84±14.66, Lp=7.17±0.2
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (35, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.24784, 0.01466, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 7.17e-8, 0.2e-8, 'sem', 'Pa-1_s-1');

-- DMSO (25°C): P_CPA=347.86±13.67, Lp=4.42±0.15
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (36, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.34786, 0.01367, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 4.42e-8, 0.15e-8, 'sem', 'Pa-1_s-1');

-- Ethylene Glycol (25°C): P_CPA=317.07±9.9, Lp=5.24±0.14
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (37, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.31707, 0.0099, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 5.24e-8, 0.14e-8, 'sem', 'Pa-1_s-1');

-- Formamide (25°C): P_CPA=622.51±34.96, Lp=4.7±0.218
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (38, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.62251, 0.03496, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 4.7e-8, 0.218e-8, 'sem', 'Pa-1_s-1');

-- Glycerol (25°C): P_CPA=56.77±2.55, Lp=6.2±0.14
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (39, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.05677, 0.00255, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 6.2e-8, 0.14e-8, 'sem', 'Pa-1_s-1');

-- N-Methylacetamide (25°C): P_CPA=142.0±5.26, Lp=2.49±0.1
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (40, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.142, 0.00526, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 2.49e-8, 0.1e-8, 'sem', 'Pa-1_s-1');

-- Propylene Glycol (25°C): P_CPA=527.68±34.26, Lp=4.31±0.26
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (41, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.52768, 0.03426, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 4.31e-8, 0.26e-8, 'sem', 'Pa-1_s-1');

-- Triethanolamine (25°C): TOXIC
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (42, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'toxic');

-- 2,3-Butanediol (25°C): Fast P_CPA, Fast Lp
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (43, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- 2-Methyl-1,3-Propanediol (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (44, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- 2-Methoxyethanol (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (45, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- 2-Methyl-2,4-Pentanediol (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (46, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- Diglyme (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (47, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- TGDE (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (48, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- Dimethylacetamide (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (49, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- Triethylene Glycol Diacetate (25°C): TOXIC
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (50, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'toxic');

-- Triglyme (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (51, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- Tetrahydrofurfuryl Alcohol (25°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (52, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'fast');

-- DEGMBE (25°C): TOXIC
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (53, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'toxic');

-- Pyridine (25°C): TOXIC
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (54, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'toxic');

-- N,N-Dimethylethanolamine (25°C): TOXIC
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (55, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'toxic');

-- Ethanolamine (25°C): TOXIC
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (56, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 25.0, 20.0, 16, 'Table 1', 'toxic');


-- ============================================================
-- FAST/TOXIC experiments for 4°C (compounds not yet recorded)
-- These had solutions created (IDs 17-28) but no experiments
-- ============================================================

-- 2-Methoxyethanol (4°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (17, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast');

-- 2-Methyl-2,4-Pentanediol (4°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (18, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast');

-- Diglyme (4°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (19, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast');

-- TGDE (4°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (20, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast');

-- Dimethylacetamide (4°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (21, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast');

-- Triethylene Glycol Diacetate (4°C): Fast P_CPA, Toxic Lp (per Table 1)
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status, notes)
VALUES (22, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast', 'P_CPA fast; Lp toxic at 25C');

-- Triglyme (4°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (23, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast');

-- Tetrahydrofurfuryl Alcohol (4°C): Fast
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (24, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'fast');

-- DEGMBE (4°C): Toxic
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (25, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'toxic');

-- Pyridine (4°C): Toxic
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (26, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'toxic');

-- N,N-Dimethylethanolamine (4°C): Toxic
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (27, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'toxic');

-- Ethanolamine (4°C): Toxic
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (28, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1', 'toxic');


-- ============================================================
-- VIABILITY DATA from Figure 6
-- ============================================================
-- Figure 6A: 4°C, ~1M, ~25 min exposure. Numbered labels in scatter plot.
-- Figure 6B: 25°C, ~2M, ~20 min exposure. Numbered labels in scatter plot.
--
-- Values are READ FROM THE SCATTER PLOT — approximate ±0.05.
-- The paper does not tabulate exact viability values.
-- Each point uses 4 viability replicates per the caption.
--
-- Legend mapping (from Figure 6 caption):
--  1=DHA, 2=Glycerol, 3=Triethanolamine, 4=Formamide, 5=Diethylene Glycol,
--  6=Ethylene Glycol, 7=DMSO, 8=Acetamide, 9=N-Methylacetamide,
--  10=1,3-Propanediol, 11=2,3-Butanediol, 12=Propylene Glycol,
--  13=N,N-Dimethylethanolamine, 14=2-Methyl-1,3-Propanediol,
--  15=2-Methoxyethanol, 16=2-Methyl-2,4-Pentanediol,
--  17=Diglyme, 18=TGDE, 19=Ethanolamine, 20=Triethylene Glycol,
--  21=Dimethylacetamide, 22=Triethylene Glycol Diacetate,
--  23=DEGMBE, 24=Pyridine, 25=Triglyme, 26=Propionamide,
--  27=Tetrahydrofurfuryl Alcohol

-- Figure 6A: Viability at 4°C (approximate values from scatter plot)
-- Using existing 4°C solutions (IDs 1-28)

-- DHA (1): viability ~0.88
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (3, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.88, 'fraction', 'Approximate: read from Figure 6A scatter plot');

-- Glycerol (2): viability ~1.0
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (11, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.0, 'fraction', 'Approximate: read from Figure 6A scatter plot');

-- Triethanolamine (3): viability ~1.2 (above control — can happen with calcein method)
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (14, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.2, 'fraction', 'Approximate: read from Figure 6A. Above 1.0 likely artifact of calcein method.');

-- Formamide (4): viability ~0.95
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (10, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.95, 'fraction', 'Approximate: read from Figure 6A');

-- Diethylene Glycol (5): viability ~0.95
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (7, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.95, 'fraction', 'Approximate: read from Figure 6A');

-- Ethylene Glycol (6): viability ~0.95
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (9, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.95, 'fraction', 'Approximate: read from Figure 6A');

-- DMSO (7): viability ~0.93
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (8, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.93, 'fraction', 'Approximate: read from Figure 6A');

-- Acetamide (8): viability ~0.92
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (6, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.92, 'fraction', 'Approximate: read from Figure 6A');

-- N-Methylacetamide (9): viability ~1.1
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (12, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.1, 'fraction', 'Approximate: read from Figure 6A');

-- 1,3-Propanediol (10): viability ~0.97
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (2, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.97, 'fraction', 'Approximate: read from Figure 6A');

-- 2,3-Butanediol (11): viability ~0.97
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (15, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.97, 'fraction', 'Approximate: read from Figure 6A');

-- Propylene Glycol (12): viability ~0.95
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (13, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.95, 'fraction', 'Approximate: read from Figure 6A');

-- N,N-Dimethylethanolamine (13): viability ~0.82 (toxic at 25°C but borderline at 4°C)
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (27, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.82, 'fraction', 'Approximate: read from Figure 6A. Paper classifies as toxic.');

-- 2-Methyl-1,3-Propanediol (14): viability ~1.05
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (16, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.05, 'fraction', 'Approximate: read from Figure 6A');

-- 2-Methyl-2,4-Pentanediol (16): viability ~0.93
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (18, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.93, 'fraction', 'Approximate: read from Figure 6A');

-- Propionamide (26): viability ~1.0
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (5, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.0, 'fraction', 'Approximate: read from Figure 6A');

-- Triethylene Glycol (20): viability ~1.0
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (4, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 1.0, 'fraction', 'Approximate: read from Figure 6A');

-- Sucrose (control, not in Fig 6 as a labeled point)

-- DEGMBE (23): viability ~0.4
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (25, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.4, 'fraction', 'Approximate: read from Figure 6A. Classified as toxic.');

-- Ethanolamine (19): viability ~0.2
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (28, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.2, 'fraction', 'Approximate: read from Figure 6A. Classified as toxic.');

-- Pyridine (24): viability ~0.1
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location, outcome_status)
VALUES (26, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 4, 'Figure 6A', 'measurable');
INSERT INTO measurements (experiment_id, metric, value, unit, notes) VALUES
    (currval('experiments_id_seq'), 'viability', 0.1, 'fraction', 'Approximate: read from Figure 6A. Classified as toxic.');

COMMIT;
