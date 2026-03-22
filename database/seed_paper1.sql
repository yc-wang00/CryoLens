-- Seed data from Paper 1: Ahmadkhani et al. (2025)
-- "High throughput method for simultaneous screening of membrane permeability
--  and toxicity for discovery of new cryoprotective agents"
-- Scientific Reports 15:1862, DOI: 10.1038/s41598-025-85509-x
--
-- Data sources within paper:
--   Table 1: Permeability parameters (P_CPA, Lp) at 4°C and 25°C for 27 compounds
--   Table 2: Activation energies (Ea) for water and CPA transport
--   Figure 6A: Viability at 4°C, ~1M, ~25 min exposure
--   Figure 6B: Viability at 25°C, ~2M, ~20 min exposure
--   Text (p7): Lists of toxic compounds at each temperature
--
-- IMPORTANT: Viability values from Figure 6 are read from the scatter plot.
-- Exact numeric values are not tabulated in the paper. Where the paper states
-- a compound is "Toxic" (Table 1), viability is recorded as the approximate
-- value from Figure 6 or as NULL if not visible in the plot.

BEGIN;

-- ============================================================
-- PAPER
-- ============================================================

INSERT INTO papers (doi, title, authors, year, journal, pmid, pdf_path) VALUES (
    '10.1038/s41598-025-85509-x',
    'High throughput method for simultaneous screening of membrane permeability and toxicity for discovery of new cryoprotective agents',
    ARRAY['Ahmadkhani N', 'Benson JD', 'Eroglu A', 'Higgins AZ'],
    2025,
    'Scientific Reports',
    '39805972',
    'corpus/papers/39805972.pdf'
);


-- ============================================================
-- COMPOUNDS (27 tested)
-- ============================================================
-- Molecular weights and CAS numbers from PubChem.
-- Roles assigned based on established cryobiology literature.

INSERT INTO compounds (id, name, abbreviation, cas_number, molecular_weight, role) VALUES
    ('sucrose',                     'Sucrose',                          'SUC',   '57-50-1',    342.30, 'non_penetrating'),
    ('1_3_propanediol',             '1,3-Propanediol',                  'PD',    '504-63-2',    76.09, 'penetrating'),
    ('1_3_dihydroxyacetone',        '1,3-Dihydroxyacetone',             'DHA',   '96-26-4',     90.08, 'penetrating'),
    ('triethylene_glycol',          'Triethylene Glycol',               'TG',    '112-27-6',   150.17, 'penetrating'),
    ('propionamide',                'Propionamide',                     'PA',    '79-05-0',     73.09, 'penetrating'),
    ('acetamide',                   'Acetamide',                        'AM',    '60-35-5',     59.07, 'penetrating'),
    ('diethylene_glycol',           'Diethylene Glycol',                'DG',    '111-46-6',   106.12, 'penetrating'),
    ('dmso',                        'Dimethyl Sulfoxide',               'DMSO',  '67-68-5',     78.13, 'penetrating'),
    ('ethylene_glycol',             'Ethylene Glycol',                  'EG',    '107-21-1',    62.07, 'penetrating'),
    ('formamide',                   'Formamide',                        'FA',    '75-12-7',     45.04, 'penetrating'),
    ('glycerol',                    'Glycerol',                         'GLY',   '56-81-5',     92.09, 'penetrating'),
    ('n_methylacetamide',           'N-Methylacetamide',                'NMA',   '79-16-3',     73.09, 'penetrating'),
    ('propylene_glycol',            'Propylene Glycol',                 'PG',    '57-55-6',     76.09, 'penetrating'),
    ('triethanolamine',             'Triethanolamine',                  'TEA',   '102-71-6',   149.19, 'penetrating'),
    ('2_3_butanediol',              '2,3-Butanediol',                   'BD',    '513-85-9',    90.12, 'penetrating'),
    ('2_methyl_1_3_propanediol',    '2-Methyl-1,3-Propanediol',         'MP',    '2163-42-0',   90.12, 'penetrating'),
    ('2_methoxyethanol',            '2-Methoxyethanol',                 'ME',    '109-86-4',    76.09, 'penetrating'),
    ('2_methyl_2_4_pentanediol',    '2-Methyl-2,4-Pentanediol',         'MPD',   '107-41-5',   118.17, 'penetrating'),
    ('diglyme',                     'Diglyme',                          NULL,    '111-96-6',   134.17, 'penetrating'),
    ('tetraethylene_glycol_dimethyl_ether', 'Tetraethylene Glycol Dimethyl Ether', 'TGDE', '143-24-8', 222.28, 'penetrating'),
    ('dimethylacetamide',           'Dimethylacetamide',                'DMA',   '127-19-5',    87.12, 'penetrating'),
    ('triethylene_glycol_diacetate','Triethylene Glycol Diacetate',     'TGD',   '111-21-7',   234.25, 'penetrating'),
    ('triglyme',                    'Triglyme',                         NULL,    '112-49-2',   178.23, 'penetrating'),
    ('tetrahydrofurfuryl_alcohol',  'Tetrahydrofurfuryl Alcohol',       'TFA',   '97-99-4',    102.13, 'penetrating'),
    ('diethylene_glycol_monobutyl_ether', 'Diethylene Glycol Monobutyl Ether', NULL, '112-34-5', 162.23, 'penetrating'),
    ('pyridine',                    'Pyridine',                         NULL,    '110-86-1',    79.10, 'other'),
    ('nn_dimethylethanolamine',     'N,N-Dimethylethanolamine',         NULL,    '108-01-0',    89.14, 'other'),
    ('ethanolamine',                'Ethanolamine',                     NULL,    '141-43-5',    61.08, 'other');


-- ============================================================
-- SOLUTIONS: 27 single-compound solutions (one per compound)
-- Paper tests each compound individually. Concentration differs by temperature:
--   4°C: ~1 M (1000 mOsm/kg CPA + 100 mOsm/kg sucrose background)
--   25°C: ~2 M (2000 mOsm/kg CPA + 100 mOsm/kg sucrose background)
-- We create separate solutions for each concentration tested.
-- ============================================================

-- Helper: all 27 compounds tested at ~1 mol/kg (4°C experiments)
-- and ~2 mol/kg (25°C experiments) as per Methods section
-- "solutions had a total osmolality of 1000 ± 100 mOsm/kg" (4°C)
-- "solutions had a total osmolality of 2000 ± 100 mOsm/kg" (25°C)

-- 4°C solutions (1 mol/kg each)
INSERT INTO solutions (paper_doi, total_concentration, concentration_unit, n_components, carrier_solution) VALUES
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 1: sucrose
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 2: 1,3-propanediol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 3: 1,3-dihydroxyacetone
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 4: triethylene glycol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 5: propionamide
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 6: acetamide
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 7: diethylene glycol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 8: dmso
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 9: ethylene glycol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 10: formamide
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 11: glycerol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 12: n-methylacetamide
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 13: propylene glycol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 14: triethanolamine
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 15: 2,3-butanediol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 16: 2-methyl-1,3-propanediol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 17: 2-methoxyethanol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 18: 2-methyl-2,4-pentanediol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 19: diglyme
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 20: TGDE
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 21: dimethylacetamide
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 22: triethylene glycol diacetate
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 23: triglyme
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 24: tetrahydrofurfuryl alcohol
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 25: DEGMBE
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 26: pyridine
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS'),  -- 27: NN-dimethylethanolamine
    ('10.1038/s41598-025-85509-x', 1.0, 'mol/kg', 1, 'HBS');  -- 28: ethanolamine

-- Solution components for each 4°C solution (IDs 1-28)
INSERT INTO solution_components (solution_id, compound_id, concentration, concentration_unit, mole_fraction) VALUES
    (1,  'sucrose',                     1.0, 'mol/kg', 1.0),
    (2,  '1_3_propanediol',             1.0, 'mol/kg', 1.0),
    (3,  '1_3_dihydroxyacetone',        1.0, 'mol/kg', 1.0),
    (4,  'triethylene_glycol',          1.0, 'mol/kg', 1.0),
    (5,  'propionamide',                1.0, 'mol/kg', 1.0),
    (6,  'acetamide',                   1.0, 'mol/kg', 1.0),
    (7,  'diethylene_glycol',           1.0, 'mol/kg', 1.0),
    (8,  'dmso',                        1.0, 'mol/kg', 1.0),
    (9,  'ethylene_glycol',             1.0, 'mol/kg', 1.0),
    (10, 'formamide',                   1.0, 'mol/kg', 1.0),
    (11, 'glycerol',                    1.0, 'mol/kg', 1.0),
    (12, 'n_methylacetamide',           1.0, 'mol/kg', 1.0),
    (13, 'propylene_glycol',            1.0, 'mol/kg', 1.0),
    (14, 'triethanolamine',             1.0, 'mol/kg', 1.0),
    (15, '2_3_butanediol',              1.0, 'mol/kg', 1.0),
    (16, '2_methyl_1_3_propanediol',    1.0, 'mol/kg', 1.0),
    (17, '2_methoxyethanol',            1.0, 'mol/kg', 1.0),
    (18, '2_methyl_2_4_pentanediol',    1.0, 'mol/kg', 1.0),
    (19, 'diglyme',                     1.0, 'mol/kg', 1.0),
    (20, 'tetraethylene_glycol_dimethyl_ether', 1.0, 'mol/kg', 1.0),
    (21, 'dimethylacetamide',           1.0, 'mol/kg', 1.0),
    (22, 'triethylene_glycol_diacetate',1.0, 'mol/kg', 1.0),
    (23, 'triglyme',                    1.0, 'mol/kg', 1.0),
    (24, 'tetrahydrofurfuryl_alcohol',  1.0, 'mol/kg', 1.0),
    (25, 'diethylene_glycol_monobutyl_ether', 1.0, 'mol/kg', 1.0),
    (26, 'pyridine',                    1.0, 'mol/kg', 1.0),
    (27, 'nn_dimethylethanolamine',     1.0, 'mol/kg', 1.0),
    (28, 'ethanolamine',                1.0, 'mol/kg', 1.0);


-- ============================================================
-- EXPERIMENTS & MEASUREMENTS: Table 1 — Permeability at 4°C
-- ============================================================
-- Table 1 data: P_CPA (×10⁻³ s⁻¹) and Lp (×10⁻⁸ Pa⁻¹s⁻¹) at 4°C
-- "Fast" = permeability too fast to measure (response was rapid monotonic change)
-- "Toxic" = compound killed cells, permeability not measurable
-- Exposure: ~25 min at 4°C (per Figure 6A caption)
-- Cell type: BPAEC (bovine pulmonary artery endothelial cells)
-- Assay: calcein fluorescence quenching

-- For compounds with measurable permeability at 4°C:
-- Each gets an experiment row, then measurement rows for P_CPA and Lp

-- Sucrose (control, non-permeating)
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (1, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.00026, 0.00007, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 2.15e-8, 0.05e-8, 'sem', 'Pa-1_s-1');

-- 1,3-Propanediol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (2, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.01969, 0.00098, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.46e-8, 0.06e-8, 'sem', 'Pa-1_s-1');

-- 1,3-Dihydroxyacetone
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (3, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.00855, 0.00089, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.37e-8, 0.07e-8, 'sem', 'Pa-1_s-1');

-- Triethylene Glycol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (4, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.00613, 0.0007, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 2.18e-8, 0.07e-8, 'sem', 'Pa-1_s-1');

-- Propionamide
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (5, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.04505, 0.00196, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.28e-8, 0.005e-8, 'sem', 'Pa-1_s-1');

-- Acetamide
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (6, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.01058, 0.00059, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.36e-8, 0.03e-8, 'sem', 'Pa-1_s-1');

-- Diethylene Glycol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (7, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.01256, 0.00059, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.66e-8, 0.06e-8, 'sem', 'Pa-1_s-1');

-- DMSO
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (8, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.02062, 0.001, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.42e-8, 0.03e-8, 'sem', 'Pa-1_s-1');

-- Ethylene Glycol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (9, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.01573, 0.00077, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.35e-8, 0.03e-8, 'sem', 'Pa-1_s-1');

-- Formamide
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (10, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.05736, 0.00497, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.18e-8, 0.03e-8, 'sem', 'Pa-1_s-1');

-- Glycerol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (11, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.00236, 0.00026, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.64e-8, 0.05e-8, 'sem', 'Pa-1_s-1');

-- N-Methylacetamide
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (12, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.01096, 0.00073, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 0.54e-8, 0.04e-8, 'sem', 'Pa-1_s-1');

-- Propylene Glycol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (13, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.02643, 0.00173, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.34e-8, 0.04e-8, 'sem', 'Pa-1_s-1');

-- Triethanolamine
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (14, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.00965, 0.00057, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.52e-8, 0.06e-8, 'sem', 'Pa-1_s-1');

-- 2,3-Butanediol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (15, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.04382, 0.00338, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.27e-8, 0.04e-8, 'sem', 'Pa-1_s-1');

-- 2-Methyl-1,3-Propanediol
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, exposure_time_min, n_replicates, source_location)
VALUES (16, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', 4.0, 25.0, 13, 'Table 1');
INSERT INTO measurements (experiment_id, metric, value, uncertainty, uncertainty_type, unit) VALUES
    (currval('experiments_id_seq'), 'permeability_cpa', 0.04292, 0.0033, 'sem', '1/s'),
    (currval('experiments_id_seq'), 'permeability_water', 1.16e-8, 0.05e-8, 'sem', 'Pa-1_s-1');


-- ============================================================
-- Table 2: Activation energies (Ea) for compounds with measurable permeability
-- These are derived from Arrhenius analysis across 4°C and 25°C data.
-- Source: Table 2, values in kJ/mol
-- ============================================================

-- DMSO: Ea_Lp=37.3, Ea_Pcpa=93.3
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (8, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 37.3, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 93.3, 'kJ/mol');

-- Ethylene Glycol: Ea_Lp=44.4, Ea_Pcpa=98.8
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (9, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 44.4, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 98.8, 'kJ/mol');

-- Propylene Glycol: Ea_Lp=37.1, Ea_Pcpa=100.2
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (13, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 37.1, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 100.2, 'kJ/mol');

-- Formamide: Ea_Lp=48.6, Ea_Pcpa=87.0
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (10, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 48.6, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 87.0, 'kJ/mol');

-- Glycerol: Ea_Lp=43.9, Ea_Pcpa=107.4
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (11, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 43.9, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 107.4, 'kJ/mol');

-- 1,3-Dihydroxyacetone: Ea_Lp=49.7, Ea_Pcpa=41.0
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (3, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 49.7, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 41.0, 'kJ/mol');

-- Diethylene Glycol: Ea_Lp=47.7, Ea_Pcpa=98.9
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (7, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 47.7, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 98.9, 'kJ/mol');

-- Acetamide: Ea_Lp=47.8, Ea_Pcpa=92.5
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (6, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 47.8, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 92.5, 'kJ/mol');

-- N-Methylacetamide: Ea_Lp=49.7, Ea_Pcpa=83.4
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (12, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 49.7, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 83.4, 'kJ/mol');

-- 1,3-Propanediol: Ea_Lp=44.8, Ea_Pcpa=95.0
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (2, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 44.8, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 95.0, 'kJ/mol');

-- Triethylene Glycol: Ea_Lp=39.3, Ea_Pcpa=106.8
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (4, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 39.3, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 106.8, 'kJ/mol');

-- Propionamide: Ea_Lp=65.0, Ea_Pcpa=75.0
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (5, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 65.0, 'kJ/mol'),
    (currval('experiments_id_seq'), 'ea_cpa', 75.0, 'kJ/mol');

-- Sucrose: Ea_Lp=46.2 (no Ea_Pcpa — non-permeating)
INSERT INTO experiments (solution_id, paper_doi, cell_type, organism, assay_method, temperature_c, source_location, notes)
VALUES (1, '10.1038/s41598-025-85509-x', 'BPAEC', 'bovine', 'calcein_fluorescence', NULL, 'Table 2', 'Arrhenius analysis across 4°C and 25°C');
INSERT INTO measurements (experiment_id, metric, value, unit) VALUES
    (currval('experiments_id_seq'), 'ea_water', 46.2, 'kJ/mol');

COMMIT;
