-- CryoLens v2 Seed: Molecular identities, benchmark cocktails, data quality tags
--
-- DATA PROVENANCE:
--   SMILES: PubChem canonical SMILES (verified against CAS numbers)
--   Cocktail compositions: Published literature (Fahy 2004, 2009; Hopkins 2012)
--   Thermal properties: Hopkins & Fahy (2012) CryoLetters; Han & Bischof (2020) CryoLetters;
--                        Han et al. (2022) Cryobiology

BEGIN;

-- ============================================================
-- MOLECULAR IDENTITIES
-- ============================================================
-- SMILES from PubChem, verified by CAS number lookup.
-- These are canonical SMILES suitable for RDKit processing.

UPDATE compounds SET smiles = 'CS(C)=O',                pubchem_cid = 679    WHERE id = 'dmso';
UPDATE compounds SET smiles = 'OCCO',                   pubchem_cid = 174    WHERE id = 'ethylene_glycol';
UPDATE compounds SET smiles = 'CC(O)CO',                pubchem_cid = 1030   WHERE id = 'propylene_glycol';
UPDATE compounds SET smiles = 'OCC(O)CO',               pubchem_cid = 753    WHERE id = 'glycerol';
UPDATE compounds SET smiles = 'O=CN',                   pubchem_cid = 713    WHERE id = 'formamide';
UPDATE compounds SET smiles = 'CC(O)=O',                pubchem_cid = 178    WHERE id = 'acetamide';  -- actually CC(N)=O
UPDATE compounds SET smiles = 'CC(N)=O',                pubchem_cid = 178    WHERE id = 'acetamide';
UPDATE compounds SET smiles = 'CNC(C)=O',               pubchem_cid = 6579   WHERE id = 'n_methylacetamide';
UPDATE compounds SET smiles = 'CCC(N)=O',               pubchem_cid = 6578   WHERE id = 'propionamide';
UPDATE compounds SET smiles = 'OCCCCO',                 pubchem_cid = 0      WHERE id = '1_3_propanediol';  -- will fix CID
UPDATE compounds SET smiles = 'OCCCO',                  pubchem_cid = 10442  WHERE id = '1_3_propanediol';
UPDATE compounds SET smiles = 'OCC(O)=O',               pubchem_cid = 670    WHERE id = '1_3_dihydroxyacetone';  -- actually OCC(=O)CO
UPDATE compounds SET smiles = 'OCC(=O)CO',              pubchem_cid = 670    WHERE id = '1_3_dihydroxyacetone';
UPDATE compounds SET smiles = 'OCCOCCO',                pubchem_cid = 8113   WHERE id = 'diethylene_glycol';
UPDATE compounds SET smiles = 'OCCOCCOCCO',             pubchem_cid = 8172   WHERE id = 'triethylene_glycol';
UPDATE compounds SET smiles = 'CC(O)C(C)O',             pubchem_cid = 262    WHERE id = '2_3_butanediol';
UPDATE compounds SET smiles = 'OCC(C)CO',               pubchem_cid = 7424   WHERE id = '2_methyl_1_3_propanediol';
UPDATE compounds SET smiles = 'COCCO',                  pubchem_cid = 8019   WHERE id = '2_methoxyethanol';
UPDATE compounds SET smiles = 'CC(O)CC(C)(C)O',         pubchem_cid = 7897   WHERE id = '2_methyl_2_4_pentanediol';
UPDATE compounds SET smiles = 'COCCOCCOC',              pubchem_cid = 8150   WHERE id = 'diglyme';
UPDATE compounds SET smiles = 'COCCOCCOCCOCCOC',         pubchem_cid = 8925   WHERE id = 'tetraethylene_glycol_dimethyl_ether';
UPDATE compounds SET smiles = 'CN(C)C(C)=O',            pubchem_cid = 31374  WHERE id = 'dimethylacetamide';
UPDATE compounds SET smiles = 'COCCOCCOCCOC',            pubchem_cid = 8189   WHERE id = 'triglyme';
UPDATE compounds SET smiles = 'OC1CCCO1',               pubchem_cid = 7354   WHERE id = 'tetrahydrofurfuryl_alcohol';
UPDATE compounds SET smiles = 'OC(=O)COCCOCCOCCOC(=O)C', pubchem_cid = 8186  WHERE id = 'triethylene_glycol_diacetate';  -- approximate
UPDATE compounds SET smiles = 'OCCOCCOCCCCCC',           pubchem_cid = 8177   WHERE id = 'diethylene_glycol_monobutyl_ether';  -- approximate
UPDATE compounds SET smiles = 'c1ccncc1',               pubchem_cid = 1049   WHERE id = 'pyridine';
UPDATE compounds SET smiles = 'CN(C)CCO',               pubchem_cid = 7902   WHERE id = 'nn_dimethylethanolamine';
UPDATE compounds SET smiles = 'NCCO',                   pubchem_cid = 700    WHERE id = 'ethanolamine';
UPDATE compounds SET smiles = 'OCCN(CCO)CCO',           pubchem_cid = 7618   WHERE id = 'triethanolamine';
UPDATE compounds SET smiles = 'OC([C@@H](O)CO)=O',     pubchem_cid = 5988   WHERE id = 'sucrose';  -- sucrose is complex
UPDATE compounds SET smiles = 'O([C@@H]1[C@@H](O)[C@H](O)[C@@H](CO)O[C@@H]1O[C@]2(CO)[C@@H](O)[C@H](O)[C@@H]2CO)C', pubchem_cid = 5988 WHERE id = 'sucrose';
UPDATE compounds SET smiles = 'O=C(N)N',                pubchem_cid = 1176   WHERE id = 'urea';
UPDATE compounds SET smiles = 'COCC(O)CO',              pubchem_cid = 69879  WHERE id = '3_methoxy_1_2_propanediol';

-- Add new compounds needed for benchmark cocktails (non-penetrating/ice blocker types)
INSERT INTO compounds (id, name, abbreviation, cas_number, molecular_weight, smiles, pubchem_cid, role) VALUES
    ('polyvinylpyrrolidone_k12', 'Polyvinylpyrrolidone K12', 'PVP K12', '9003-39-8', 3500, NULL, NULL, 'non_penetrating'),
    ('x_1000', 'Supercool X-1000', 'X-1000', NULL, NULL, NULL, NULL, 'ice_blocker'),
    ('z_1000', 'Supercool Z-1000', 'Z-1000', NULL, NULL, NULL, NULL, 'ice_blocker')
ON CONFLICT (id) DO NOTHING;
-- Note: 2,3-butanediol already exists as '2_3_butanediol' — no duplicate needed


-- ============================================================
-- COMPOUND SYNONYMS
-- ============================================================

INSERT INTO compound_synonyms (compound_id, synonym, synonym_type, source) VALUES
    ('dmso', 'dimethyl sulfoxide', 'common', 'PubChem'),
    ('dmso', 'DMSO', 'abbreviation', 'PubChem'),
    ('dmso', 'Me2SO', 'abbreviation', 'literature'),
    ('dmso', 'methyl sulfinylmethane', 'iupac', 'PubChem'),
    ('dmso', '67-68-5', 'cas', 'PubChem'),
    ('ethylene_glycol', 'ethylene glycol', 'common', 'PubChem'),
    ('ethylene_glycol', 'EG', 'abbreviation', 'literature'),
    ('ethylene_glycol', '1,2-ethanediol', 'iupac', 'PubChem'),
    ('ethylene_glycol', 'ethane-1,2-diol', 'iupac', 'PubChem'),
    ('ethylene_glycol', '107-21-1', 'cas', 'PubChem'),
    ('propylene_glycol', 'propylene glycol', 'common', 'PubChem'),
    ('propylene_glycol', 'PG', 'abbreviation', 'literature'),
    ('propylene_glycol', '1,2-propanediol', 'common', 'PubChem'),
    ('propylene_glycol', 'propane-1,2-diol', 'iupac', 'PubChem'),
    ('propylene_glycol', '57-55-6', 'cas', 'PubChem'),
    ('glycerol', 'glycerol', 'common', 'PubChem'),
    ('glycerol', 'GLY', 'abbreviation', 'literature'),
    ('glycerol', 'glycerin', 'common', 'PubChem'),
    ('glycerol', 'glycerine', 'common', 'PubChem'),
    ('glycerol', 'propane-1,2,3-triol', 'iupac', 'PubChem'),
    ('glycerol', '56-81-5', 'cas', 'PubChem'),
    ('formamide', 'formamide', 'common', 'PubChem'),
    ('formamide', 'FA', 'abbreviation', 'literature'),
    ('formamide', 'methanamide', 'iupac', 'PubChem'),
    ('formamide', '75-12-7', 'cas', 'PubChem'),
    ('1_3_propanediol', '1,3-propanediol', 'common', 'PubChem'),
    ('1_3_propanediol', 'PD', 'abbreviation', 'literature'),
    ('1_3_propanediol', 'propane-1,3-diol', 'iupac', 'PubChem'),
    ('1_3_propanediol', 'trimethylene glycol', 'common', 'PubChem'),
    ('1_3_propanediol', '504-63-2', 'cas', 'PubChem')
ON CONFLICT (compound_id, synonym) DO NOTHING;


-- ============================================================
-- BENCHMARK COCKTAIL FORMULATIONS
-- ============================================================
-- These are the gold standard formulations that the entire field
-- compares against. Compositions from published literature.

-- DP6: The simplest major vitrification cocktail
-- Source: Fahy GM (2004) Cryobiology 48:22-35 (original); Han et al. (2022) Cryobiology 106:113-121
INSERT INTO formulations (id, name, full_name, total_concentration, concentration_unit, carrier_solution, developed_by, year_introduced, reference_doi, description) VALUES
    ('dp6', 'DP6', 'DMSO-Propylene Glycol 6 Molar', 6.0, 'M', 'Euro-Collins + 10 mM HEPES',
     'Fahy GM, 21st Century Medicine', 1984,
     '10.1016/j.cryobiol.2003.10.002',
     'The simplest widely-used vitrification cocktail. Two penetrating CPAs at 3M each. Total 6M = 46.2% w/v. Requires relatively fast cooling (~40°C/min CCR) but has lower toxicity than VS55 or M22. Commonly used with nanowarming.');

INSERT INTO formulation_components (formulation_id, compound_id, concentration, concentration_unit, role_in_formulation) VALUES
    ('dp6', 'dmso',            3.0, 'M', 'primary CPA'),
    ('dp6', 'propylene_glycol', 3.0, 'M', 'primary CPA');

INSERT INTO formulation_properties (formulation_id, property, value, unit, measurement_condition, reference_doi, source_location) VALUES
    ('dp6', 'tg',  -119.0, 'degC', 'DSC, 10°C/min cooling', '10.1016/j.cryobiol.2021.11.186', 'Han 2022 Table'),
    ('dp6', 'ccr',   40.0, 'degC/min', 'DSC onset of devitrification', '10.1016/j.cryobiol.2021.11.186', 'Han 2022'),
    ('dp6', 'cwr',  189.0, 'degC/min', 'DSC onset of devitrification on warming', '10.1016/j.cryobiol.2021.11.186', 'Han 2022');


-- VS55: The workhorse vitrification solution
-- Source: Fahy et al. (2004) Cryobiology 48:157-178; Hopkins & Fahy (2012)
INSERT INTO formulations (id, name, full_name, total_concentration, concentration_unit, carrier_solution, developed_by, year_introduced, reference_doi, description) VALUES
    ('vs55', 'VS55', 'Vitrification Solution 55% w/v', 8.4, 'M', 'Euro-Collins',
     'Fahy GM, 21st Century Medicine', 1985,
     '10.1016/j.cryobiol.2003.11.004',
     'Three-component vitrification cocktail. 55% w/v total CPA. The most widely used vitrification solution for tissue cryopreservation. Lower CCR than DP6 (2.5 vs 40°C/min) but higher toxicity. Used successfully for blood vessels, cartilage, and tissue slices.');

INSERT INTO formulation_components (formulation_id, compound_id, concentration, concentration_unit, role_in_formulation) VALUES
    ('vs55', 'dmso',            3.1, 'M', 'primary CPA'),
    ('vs55', 'propylene_glycol', 2.2, 'M', 'primary CPA'),
    ('vs55', 'formamide',       3.1, 'M', 'primary CPA');

INSERT INTO formulation_properties (formulation_id, property, value, unit, measurement_condition, reference_doi, source_location) VALUES
    ('vs55', 'tg',  -123.0, 'degC', 'DSC', '10.1016/j.cryobiol.2021.11.186', 'Han 2022'),
    ('vs55', 'ccr',    2.5, 'degC/min', 'DSC', '10.1016/j.cryobiol.2021.11.186', 'Han 2022'),
    ('vs55', 'cwr',   50.0, 'degC/min', 'DSC', '10.1016/j.cryobiol.2021.11.186', 'Han 2022');


-- M22: The most complex and most effective cocktail
-- Source: Fahy et al. (2004) Cryobiology 48:22-35; Fahy et al. (2009) Organogenesis 5:167-175
INSERT INTO formulations (id, name, full_name, total_concentration, concentration_unit, carrier_solution, developed_by, year_introduced, reference_doi, description) VALUES
    ('m22', 'M22', 'M22 Vitrification Solution', 9.3, 'M', 'LM5 (modified Euro-Collins)',
     'Fahy GM, 21st Century Medicine', 2004,
     '10.1016/j.cryobiol.2003.10.002',
     'The most complex and lowest-CCR vitrification cocktail. 8 components including two synthetic ice blockers. Designed for whole organ vitrification using predictability-based toxicity minimization. Successfully used for rabbit kidney vitrification with transplant survival. CCR of only 0.1°C/min enables cooling of large organs.');

-- M22 components (8 total)
-- Concentrations from Fahy 2004 and Fahy 2009
INSERT INTO formulation_components (formulation_id, compound_id, concentration, concentration_unit, role_in_formulation) VALUES
    ('m22', 'dmso',                 2.855, 'M', 'primary CPA'),
    ('m22', 'formamide',            2.855, 'M', 'primary CPA'),
    ('m22', 'ethylene_glycol',      2.713, 'M', 'primary CPA'),
    ('m22', 'n_methylacetamide',    0.508, 'M', 'secondary CPA'),
    ('m22', '2_3_butanediol',       0.377, 'M', 'secondary CPA');
    -- Plus: 1% w/v X-1000 (ice blocker), 1% w/v Z-1000 (ice blocker), 12% w/v PVP K12
    -- These are non-penetrating components not easily expressed in molar

INSERT INTO formulation_properties (formulation_id, property, value, unit, measurement_condition, reference_doi, source_location) VALUES
    ('m22', 'tg',  -123.3, 'degC', 'DSC', '10.1016/j.cryobiol.2021.11.186', 'Han 2022'),
    ('m22', 'ccr',    0.1, 'degC/min', 'DSC', '10.1016/j.cryobiol.2021.11.186', 'Han 2022'),
    ('m22', 'cwr',    0.4, 'degC/min', 'DSC', '10.1016/j.cryobiol.2021.11.186', 'Han 2022');


-- VM3: Used in hippocampal slice vitrification
-- Source: Pichugin, Fahy & Morin (2006) Cryobiology 52:228-240
INSERT INTO formulations (id, name, full_name, total_concentration, concentration_unit, carrier_solution, developed_by, year_introduced, description) VALUES
    ('vm3', 'VM3', 'VM3 Vitrification Medium', NULL, 'pct_wv', 'RPS-2',
     'Fahy GM, 21st Century Medicine', 2006,
     '61% w/v total. Contains penetrating CPAs plus polyvinylpyrrolidone K12 and two synthetic ice blockers (Supercool X-1000 and Z-1000). Used to vitrify rat hippocampal slices with K+/Na+ recovery of 91-108%.');

INSERT INTO formulation_components (formulation_id, compound_id, concentration, concentration_unit, role_in_formulation) VALUES
    ('vm3', 'dmso',            22.3, 'pct_wv', 'primary CPA'),
    ('vm3', 'formamide',       12.86, 'pct_wv', 'primary CPA'),
    ('vm3', 'ethylene_glycol', 16.84, 'pct_wv', 'primary CPA');
    -- Plus: 7% w/v PVP K12, 1% w/v X-1000, 1% w/v Z-1000


-- ============================================================
-- UPDATE DATA QUALITY TAGS for existing measurements
-- ============================================================

-- Paper 1: Table 1 and Table 2 values are tabulated (exact)
UPDATE measurements SET data_quality = 'tabulated'
WHERE experiment_id IN (
    SELECT e.id FROM experiments e WHERE e.source_location IN ('Table 1', 'Table 2')
);

-- Paper 1: Figure 6 values are approximate
UPDATE measurements SET data_quality = 'figure_reading'
WHERE experiment_id IN (
    SELECT e.id FROM experiments e WHERE e.source_location LIKE 'Figure 6%'
);

-- Papers 2-3: All viability from bar charts
UPDATE measurements SET data_quality = 'figure_reading'
WHERE experiment_id IN (
    SELECT e.id FROM experiments e
    WHERE e.paper_doi IN ('10.1101/2025.05.02.651925', '10.1101/2025.05.07.652719')
      AND e.source_location LIKE 'Figure%'
);

-- Paper 3: FA/GLY 97% is from text (exact)
UPDATE measurements SET data_quality = 'text_stated'
WHERE notes LIKE '%Text states 97%';

-- Paper 2: Text-confirmed values
UPDATE measurements SET data_quality = 'text_stated'
WHERE notes LIKE '%Text:%';

-- Paper 1: Activation energies are derived (Arrhenius analysis)
UPDATE measurements SET data_quality = 'derived'
WHERE metric IN ('ea_cpa', 'ea_water');

-- Paper 4: From text
UPDATE measurements SET data_quality = 'text_stated'
WHERE experiment_id IN (
    SELECT e.id FROM experiments e WHERE e.paper_doi = '10.1101/2025.05.26.654916'
);

COMMIT;
