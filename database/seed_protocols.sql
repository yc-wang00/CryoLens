-- Protocol extraction from all 4 papers
-- Every step is directly traceable to the source text.

BEGIN;

-- ============================================================
-- PAPER 1: Ahmadkhani (2025) Scientific Reports
-- Permeability + toxicity screening
-- ============================================================

-- Protocol P1: Calcein fluorescence permeability + toxicity assay at 4°C
INSERT INTO protocols (
    paper_doi, name, description,
    cell_type, cell_source, organism, passage_range,
    plate_format, seeding_density, culture_medium,
    carrier_solution, carrier_osmolality,
    viability_assay, viability_timepoint,
    automation_system, source_location
) VALUES (
    '10.1038/s41598-025-85509-x',
    'Calcein fluorescence permeability + toxicity (4°C)',
    'High-throughput 96-well calcein fluorescence quenching method. CPA added automatically via FlexStation 3 plate reader. Same plate used for both permeability measurement (fluorescence kinetics) and toxicity estimation (fluorescence before/after CPA removal). ~100 samples in 30 min.',
    'BPAEC', 'Cell Applications Inc, San Diego, CA', 'bovine', '2-5',
    '96-well clear-bottom black', 10000, 'DMEM + 10% FBS + Pen/Strep',
    'Isotonic HBS (HEPES buffered saline)', 300,
    'calcein_fluorescence', '~25 min CPA exposure, fluorescence ratio before/after removal',
    'FlexStation 3 plate reader (Molecular Devices)',
    'Methods: Cell culture, Calcein staining, Quantifying permeability, Quantifying toxicity (p9-11)'
);  -- protocol_id = 1

INSERT INTO protocol_steps (protocol_id, step_order, action, temperature_c, duration_min, description) VALUES
    (currval('protocols_id_seq'), 1, 'seed_cells', 37, 2880, -- 48 hours
     'Harvest BPAEC from T-75 flask, seed 10,000 cells/well in clear-bottom black 96-well plates (Greiner). Culture ~2 days until ~80% confluency.'),
    (currval('protocols_id_seq'), 2, 'other', 37, 30,
     'Stain with calcein-AM: wash with PBS+Ca/Mg, expose to 1.67 µg/mL calcein-AM in PBS for 30 min at 37°C. Wash 2x with isotonic HBS. Retain 100 µL HBS in wells.'),
    (currval('protocols_id_seq'), 3, 'pre_incubate', 4, 60,
     'Equilibrate both assay plate and source plate at 4°C for at least 1 hour. Plate reader adjusted to 4°C at least 1 hour prior.');

INSERT INTO protocol_steps (protocol_id, step_order, action, cpa_concentration, concentration_unit, temperature_c, duration_min, volume_ul, method, description) VALUES
    (currval('protocols_id_seq'), 4, 'hold', NULL, NULL, 4, 0.5, NULL, 'FlexStation 3 plate reader',
     'Baseline: collect fluorescence data for 30 s (excitation 480 nm, emission 515-530 nm) while cells are in isotonic HBS. This establishes the pre-CPA baseline.'),
    (currval('protocols_id_seq'), 5, 'add_cpa', 1.0, 'mol/kg', 4, 1.5, 100, 'FlexStation 3 automated dispense',
     'At 30 s mark, 100 µL of CPA test solution dispensed automatically into wells at 100 µL/sec. Simultaneously monitoring fluorescence. CPA solution = 1000 ± 100 mOsm/kg total osmolality.'),
    (currval('protocols_id_seq'), 6, 'hold', 1.0, 'mol/kg', 4, 23, NULL, 'FlexStation 3',
     'Continue fluorescence monitoring for up to 90 s total (first 15 s after CPA used for permeability fit at 4°C). Total CPA exposure continues for ~25 min across sequential column reads.'),
    (currval('protocols_id_seq'), 7, 'assess_viability', NULL, NULL, 4, 0, NULL, 'FlexStation 3',
     'Measure fluorescence BEFORE removing CPA solution (pre-removal reading).'),
    (currval('protocols_id_seq'), 8, 'remove_solution', NULL, NULL, 4, 0, NULL, 'Manual or automated',
     'Remove CPA solution from wells.'),
    (currval('protocols_id_seq'), 9, 'assess_viability', NULL, NULL, 4, 0, NULL, 'FlexStation 3',
     'Measure fluorescence AFTER removing CPA solution (post-removal reading). Viability = ratio of post/pre. Dead cells release calcein → lower fluorescence after removal if toxic.');


-- Protocol P2: Same assay at 25°C
INSERT INTO protocols (
    paper_doi, name, description,
    cell_type, cell_source, organism, passage_range,
    plate_format, seeding_density, culture_medium,
    carrier_solution, carrier_osmolality,
    viability_assay, viability_timepoint,
    automation_system, source_location
) VALUES (
    '10.1038/s41598-025-85509-x',
    'Calcein fluorescence permeability + toxicity (25°C)',
    'Same method as 4°C protocol but at room temperature. CPA solutions at 2000 ± 100 mOsm/kg (2 mol/kg). First 15 s of data used for permeability fit at 25°C.',
    'BPAEC', 'Cell Applications Inc, San Diego, CA', 'bovine', '2-5',
    '96-well clear-bottom black', 10000, 'DMEM + 10% FBS + Pen/Strep',
    'Isotonic HBS', 300,
    'calcein_fluorescence', '~20 min CPA exposure',
    'FlexStation 3 plate reader (Molecular Devices)',
    'Methods (p9-11)'
);  -- protocol_id = 2

INSERT INTO protocol_steps (protocol_id, step_order, action, temperature_c, duration_min, description) VALUES
    (currval('protocols_id_seq'), 1, 'seed_cells', 37, 2880, 'Same as 4°C protocol.'),
    (currval('protocols_id_seq'), 2, 'other', 37, 30, 'Calcein staining — same as 4°C protocol.'),
    (currval('protocols_id_seq'), 3, 'pre_incubate', 25, 15, 'Equilibrate plates at 25 ± 2°C for at least 15 min.');

INSERT INTO protocol_steps (protocol_id, step_order, action, cpa_concentration, concentration_unit, temperature_c, duration_min, volume_ul, method, description) VALUES
    (currval('protocols_id_seq'), 4, 'hold', NULL, NULL, 25, 0.5, NULL, 'FlexStation 3', 'Baseline fluorescence for 30 s.'),
    (currval('protocols_id_seq'), 5, 'add_cpa', 2.0, 'mol/kg', 25, 1.5, 100, 'FlexStation 3 automated dispense',
     'Dispense 100 µL CPA at 2000 ± 100 mOsm/kg. Monitor fluorescence.'),
    (currval('protocols_id_seq'), 6, 'hold', 2.0, 'mol/kg', 25, 18, NULL, 'FlexStation 3', 'CPA exposure ~20 min total.'),
    (currval('protocols_id_seq'), 7, 'assess_viability', NULL, NULL, 25, 0, NULL, 'FlexStation 3', 'Pre-removal fluorescence.'),
    (currval('protocols_id_seq'), 8, 'remove_solution', NULL, NULL, 25, 0, NULL, NULL, 'Remove CPA.'),
    (currval('protocols_id_seq'), 9, 'assess_viability', NULL, NULL, 25, 0, NULL, 'FlexStation 3', 'Post-removal fluorescence. Viability = ratio.');


-- ============================================================
-- PAPER 2: Ahmadkhani (2025) bioRxiv — Mixture toxicity at RT
-- Three protocols compared: single-step, two-step, multi-step
-- ============================================================

-- Protocol P3: Two-step method for 3 mol/kg at room temperature
-- (SELECTED as the best method — used for all subsequent experiments)
INSERT INTO protocols (
    paper_doi, name, description,
    cell_type, cell_source, organism,
    plate_format, seeding_density, culture_medium,
    carrier_solution, carrier_osmolality,
    viability_assay, viability_timepoint,
    automation_system, source_location, notes
) VALUES (
    '10.1101/2025.05.02.651925',
    'Two-step CPA addition/removal for 3 mol/kg (RT)',
    'Simplified protocol for 3 mol/kg screening. Direct exposure to CPA in isotonic buffer, followed by hypertonic washout. Selected over single-step and multi-step based on Figure 2 comparison. Used for all 21 CPAs at 3 mol/kg.',
    'BPAEC', 'Cell Applications Inc', 'bovine',
    '96-well', NULL, 'DMEM + 10% FBS + Pen/Strep',
    'Isotonic HBS', 300,
    'presto_blue', '24 h post-exposure',
    'Hamilton Microlab STARlet',
    'Methods: Experimental Overview, lines 113-139; Figure 1 (3 mol/kg two-step panel)',
    'pH of HBS was ~5.5 due to oversight (not adjusted to 7.3). Did not affect viability outcomes per authors.'
);  -- protocol_id = 3

INSERT INTO protocol_steps (protocol_id, step_order, action, temperature_c, duration_min, description) VALUES
    (currval('protocols_id_seq'), 1, 'seed_cells', 37, 1440, 'Culture BPAEC in 96-well plates. Pre-treatment PrestoBlue viability reading taken.');

INSERT INTO protocol_steps (protocol_id, step_order, action, cpa_concentration, concentration_unit, solution_osmolality, temperature_c, duration_min, method, description) VALUES
    (currval('protocols_id_seq'), 2, 'add_cpa', 3.0, 'mol/kg', NULL, 25, 30, 'Hamilton STARlet automated',
     'Direct exposure to 3 mol/kg CPA in isotonic buffer. 30 min exposure time. CPA addition randomized across plate.'),
    (currval('protocols_id_seq'), 3, 'decrease_cpa', 0, 'mol/kg', 1200, 25, 4.5, 'Hamilton STARlet',
     'Replace with hypertonic buffer (1,200 mOsm by adding NaCl, no CPA) for 4.5 min. Gradual osmotic washout.'),
    (currval('protocols_id_seq'), 4, 'wash', 0, 'mol/kg', 300, 25, 0, 'Hamilton STARlet',
     'Return to isotonic conditions (300 mOsm).'),
    (currval('protocols_id_seq'), 5, 'culture_recovery', NULL, NULL, NULL, 37, 1440, NULL,
     'Culture for 24 h at 37°C in complete medium.');

INSERT INTO protocol_steps (protocol_id, step_order, action, temperature_c, duration_min, description) VALUES
    (currval('protocols_id_seq'), 6, 'assess_viability', 37, 0,
     'Final PrestoBlue reading. Viability = (post-treatment PrestoBlue / pre-treatment PrestoBlue) normalized to CPA-free control wells.');


-- Protocol P4: Two-step method for 6 mol/kg at room temperature
INSERT INTO protocols (
    paper_doi, name, description,
    cell_type, cell_source, organism,
    plate_format, culture_medium,
    carrier_solution,
    viability_assay, viability_timepoint,
    automation_system, source_location
) VALUES (
    '10.1101/2025.05.02.651925',
    'Multi-step CPA addition/removal for 6 mol/kg (RT)',
    'Stepwise loading to 6 mol/kg to minimize osmotic shock. Intermediate step at 3 mol/kg. Used for 11 single CPAs and 46 binary mixtures at 6 mol/kg.',
    'BPAEC', 'Cell Applications Inc', 'bovine',
    '96-well', 'DMEM + 10% FBS + Pen/Strep',
    'Isotonic HBS',
    'presto_blue', '24 h post-exposure',
    'Hamilton Microlab STARlet',
    'Methods lines 132-138; Figure 1 (6 mol/kg multi-step panel)'
);  -- protocol_id = 4

INSERT INTO protocol_steps (protocol_id, step_order, action, cpa_concentration, concentration_unit, solution_osmolality, temperature_c, duration_min, method, description) VALUES
    (currval('protocols_id_seq'), 1, 'add_cpa', 3.0, 'mol/kg', NULL, 25, 2.5, 'Hamilton STARlet',
     'Step 1: Expose to 3 mol/kg CPA in isotonic buffer for 2.5 min. Intermediate loading step.'),
    (currval('protocols_id_seq'), 2, 'increase_cpa', 6.0, 'mol/kg', NULL, 25, 30, 'Hamilton STARlet',
     'Step 2: Replace with 6 mol/kg CPA in isotonic buffer. Hold for 30 min. This is the main exposure.'),
    (currval('protocols_id_seq'), 3, 'decrease_cpa', 3.0, 'mol/kg', NULL, 25, 8, 'Hamilton STARlet',
     'Step 3: Step down to 3 mol/kg CPA in hypertonic buffer. 8 min. Begin washout.'),
    (currval('protocols_id_seq'), 4, 'wash', 0, 'mol/kg', 1200, 25, 10, 'Hamilton STARlet',
     'Step 4: Hypertonic buffer only (no CPA, 1200 mOsm) for 10 min.'),
    (currval('protocols_id_seq'), 5, 'wash', 0, 'mol/kg', 300, 25, 0, 'Hamilton STARlet',
     'Step 5: Return to isotonic conditions.'),
    (currval('protocols_id_seq'), 6, 'culture_recovery', NULL, NULL, NULL, 37, 1440, NULL,
     'Culture 24 h. Final PrestoBlue reading.');


-- ============================================================
-- PAPER 3: Ahmadkhani (2025) bioRxiv — 4°C screening
-- Same protocols as Paper 2 but with plate cooling module
-- ============================================================

-- Protocol P5: Two-step for 3 mol/kg at 4°C
INSERT INTO protocols (
    paper_doi, name, description,
    cell_type, organism,
    plate_format, culture_medium,
    carrier_solution,
    viability_assay, viability_timepoint,
    automation_system, source_location
) VALUES (
    '10.1101/2025.05.07.652719',
    'Two-step CPA addition/removal for 3 mol/kg (4°C)',
    'Same as RT two-step protocol but with MéCour plate cooling module connected to circulating bath at -4°C, maintaining plate at 4 ± 2°C. EG at 3 mol/kg used as intermediate step for higher concentrations.',
    'BPAEC', 'bovine',
    '96-well', 'DMEM + 10% FBS + Pen/Strep',
    'Isotonic HBS (18 mol/kg stock solutions prepared volumetrically)',
    'presto_blue', '20-24 h post-exposure',
    'Hamilton Microlab STARlet + MéCour plate cooling module + circulating bath',
    'Methods 2.2: Experimental Overview (p4-5); Figure 1'
);  -- protocol_id = 5

INSERT INTO protocol_steps (protocol_id, step_order, action, cpa_concentration, concentration_unit, temperature_c, duration_min, method, description) VALUES
    (currval('protocols_id_seq'), 1, 'pre_incubate', NULL, NULL, 4, 30, 'MéCour plate cooler',
     'Equilibrate deep-well source plates and assay plates at 4°C on plate cooling module.'),
    (currval('protocols_id_seq'), 2, 'add_cpa', 3.0, 'mol/kg', 4, 30, 'Hamilton STARlet at 4°C',
     'Direct exposure to 3 mol/kg CPA at 4°C. 30 min. CPA solutions dispensed from randomized deep-well plate.'),
    (currval('protocols_id_seq'), 3, 'decrease_cpa', 0, 'mol/kg', 4, 4.5, 'Hamilton STARlet at 4°C',
     'Hypertonic washout at 4°C (1200 mOsm NaCl). 4.5 min.'),
    (currval('protocols_id_seq'), 4, 'wash', 0, 'mol/kg', 4, 0, 'Hamilton STARlet',
     'Return to isotonic at 4°C.'),
    (currval('protocols_id_seq'), 5, 'culture_recovery', NULL, NULL, 37, 1320, NULL,
     'Transfer to 37°C incubator. Culture 20-24 h.'),
    (currval('protocols_id_seq'), 6, 'assess_viability', NULL, NULL, 37, 0, NULL,
     'PrestoBlue reading. Dual normalization: post/pre for same well, then vs CPA-free controls.');


-- Protocol P6: Multi-step for 6 and 12 mol/kg at 4°C
-- Uses EG as intermediate loading step
INSERT INTO protocols (
    paper_doi, name, description,
    cell_type, organism,
    carrier_solution,
    viability_assay, viability_timepoint,
    automation_system, source_location
) VALUES (
    '10.1101/2025.05.07.652719',
    'Multi-step CPA addition/removal for 6-12 mol/kg (4°C)',
    'Stepwise loading using EG as intermediate. EG chosen because of its low toxicity at both temperatures. Loading: EG intermediate → target concentration. Unloading: step-down → hypertonic wash → isotonic.',
    'BPAEC', 'bovine',
    'Isotonic HBS',
    'presto_blue', '20-24 h post-exposure',
    'Hamilton Microlab STARlet + MéCour plate cooling module',
    'Methods 2.2 (p4-5); Supplementary Material Figure S.1'
);  -- protocol_id = 6

INSERT INTO protocol_steps (protocol_id, step_order, action, cpa_concentration, concentration_unit, temperature_c, duration_min, method, description) VALUES
    (currval('protocols_id_seq'), 1, 'pre_incubate', NULL, NULL, 4, 30, 'MéCour plate cooler', 'Equilibrate at 4°C.'),
    (currval('protocols_id_seq'), 2, 'add_cpa', 3.0, 'mol/kg', 4, 2.5, 'Hamilton STARlet',
     'Step 1: Load 3 mol/kg EG (ethylene glycol) as intermediate. 2.5 min. EG selected for low toxicity.'),
    (currval('protocols_id_seq'), 3, 'increase_cpa', 6.0, 'mol/kg', 4, 30, 'Hamilton STARlet',
     'Step 2: Replace with target CPA or mixture at 6 mol/kg (or 12 mol/kg). 30 min exposure.'),
    (currval('protocols_id_seq'), 4, 'decrease_cpa', 3.0, 'mol/kg', 4, 8, 'Hamilton STARlet',
     'Step 3: Step down to 3 mol/kg in hypertonic buffer. 8 min.'),
    (currval('protocols_id_seq'), 5, 'wash', 0, 'mol/kg', 4, 10, 'Hamilton STARlet',
     'Step 4: Hypertonic buffer only (1200 mOsm). 10 min.'),
    (currval('protocols_id_seq'), 6, 'wash', 0, 'mol/kg', 4, 0, 'Hamilton STARlet',
     'Step 5: Return to isotonic.'),
    (currval('protocols_id_seq'), 7, 'culture_recovery', NULL, NULL, 37, 1320, NULL, '20-24 h at 37°C. PrestoBlue assessment.');


-- ============================================================
-- PAPER 4: Jaskiewicz/Sandlin (2025) — HTS validation
-- Different lab, different cell line, different protocol
-- ============================================================

-- Protocol P7: HTS screening assay (single-step, room temp)
INSERT INTO protocols (
    paper_doi, name, description,
    cell_type, cell_source, organism, passage_range,
    plate_format, seeding_density, culture_medium,
    carrier_solution,
    viability_assay, viability_timepoint,
    automation_system, source_location,
    z_factor, cv_percent
) VALUES (
    '10.1101/2025.05.26.654916',
    'HTS CPA toxicity screening (single-step, RT)',
    'Validated high-throughput screening assay. 3-day protocol: Day 1 seed, Day 2 CPA challenge + removal, Day 3 MTT viability. Single-step CPA addition (50 µL 1x or multi-step with carrier pre-dilution). 42 test wells + controls per plate. 587 cocktails screened in pilot.',
    'T24', 'ATCC (cat. HTB-4)', 'human', 'up to 25',
    '96-well clear culture-treated', 20000, 'McCoy''s 5A + 10% FBS + Pen/Strep',
    'DPBS + 10% FBS + 25 mM HEPES',
    'mtt', 'overnight (~20 h post-exposure)',
    'MultiFlo FX (BioTek) dispensing robot + BioTek ELx50 plate aspirator',
    'Methods 2.3: Overview of HTS CPA screening assay (p6-8)',
    0.75, 20
);  -- protocol_id = 7

INSERT INTO protocol_steps (protocol_id, step_order, action, temperature_c, duration_min, volume_ul, method, description) VALUES
    (currval('protocols_id_seq'), 1, 'seed_cells', 37, 1440, 100,
     'MultiFlo FX single-tip dispensing',
     'Day 1: Seed 20,000-25,000 T24 cells per well in 100 µL. Perimeter wells filled with 100 µL PBS (edge effect control). Incubate overnight at 37°C/5% CO2 until confluent (~40,000 cells/well).'),
    (currval('protocols_id_seq'), 2, 'other', 25, 20, NULL,
     'Single-tip dispensing RAD cassette',
     'Day 2: Prepare CPA source plate in 96-well format. Components dispensed with 5 µL precision. Seal and agitate 20 min at 100 rpm.'),
    (currval('protocols_id_seq'), 3, 'pre_incubate', 25, 30, NULL, NULL,
     'Equilibrate source plate and experimental plate at RT for 30 min.');

INSERT INTO protocol_steps (protocol_id, step_order, action, cpa_concentration, concentration_unit, temperature_c, duration_min, volume_ul, method, description) VALUES
    (currval('protocols_id_seq'), 4, 'add_cpa', NULL, 'M', 25, 60, 50,
     'Multi-channel pipette (manual transfer)',
     'CPA challenge: flick media from wells, dab to remove residue. Transfer 50 µL of CPA cocktail from source plate. For single-step: 50 µL of 1x solution. For multi-step: 25 µL carrier + 25 µL carrier + 25 µL 2x CPA. Incubate 1 hour at RT.'),
    (currval('protocols_id_seq'), 5, 'dilute', NULL, NULL, 25, 1, 50,
     'MultiFlo FX 8-tip dispensing',
     'CPA removal step 1: Add 50 µL carrier solution. Incubate 1 min.'),
    (currval('protocols_id_seq'), 6, 'dilute', NULL, NULL, 25, 2, 100,
     'MultiFlo FX 8-tip dispensing',
     'CPA removal step 2: Add 100 µL carrier solution. Incubate 2 min.'),
    (currval('protocols_id_seq'), 7, 'remove_solution', NULL, NULL, 25, 1, NULL,
     'BioTek ELx50 plate aspirator',
     'Centrifuge plate 50×g for 1 min. Aspirate contents (nozzle 3 mm above monolayer, 5 mm/sec).'),
    (currval('protocols_id_seq'), 8, 'add_carrier', NULL, NULL, 25, 0, 100,
     'MultiFlo FX',
     'Refill with 100 µL complete cell media.'),
    (currval('protocols_id_seq'), 9, 'culture_recovery', NULL, NULL, 37, 1200, NULL, NULL,
     'Incubate overnight at 37°C/5% CO2 (~20 h).'),
    (currval('protocols_id_seq'), 10, 'assess_viability', NULL, NULL, 37, 210, NULL,
     'MultiFlo FX + microplate reader (570 nm)',
     'Day 3: MTT assay. Add 5 mg/mL MTT in phenol-free FBS-free media. Incubate 3 h at 37°C. Remove MTT. Solubilize with 2-propanol/0.3mM HCl/0.5% SDS. Shake 30 min + rock 10 min. Read A570. Viability = % relative to no-CPA controls.');


-- ============================================================
-- Link existing experiments to protocols
-- ============================================================

-- Paper 1 experiments at 4°C → protocol 1
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'Calcein%4°C' AND paper_doi='10.1038/s41598-025-85509-x')
WHERE paper_doi = '10.1038/s41598-025-85509-x'
  AND temperature_c = 4.0;

-- Paper 1 experiments at 25°C → protocol 2
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'Calcein%25°C' AND paper_doi='10.1038/s41598-025-85509-x')
WHERE paper_doi = '10.1038/s41598-025-85509-x'
  AND temperature_c = 25.0;

-- Paper 1 Arrhenius (no temperature, cross-temp analysis) — no protocol link
-- These are derived calculations, not direct experiments

-- Paper 2 experiments at 3 mol/kg → protocol 3
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'Two-step%3 mol%RT%')
WHERE paper_doi = '10.1101/2025.05.02.651925'
  AND solution_id IN (SELECT id FROM solutions WHERE paper_doi = '10.1101/2025.05.02.651925' AND total_concentration = 3.0);

-- Paper 2 experiments at 6 mol/kg → protocol 4
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'Multi-step%6 mol%RT%')
WHERE paper_doi = '10.1101/2025.05.02.651925'
  AND solution_id IN (SELECT id FROM solutions WHERE paper_doi = '10.1101/2025.05.02.651925' AND total_concentration = 6.0);

-- Paper 2 acetamide at 1.1 mol/kg → protocol 3 (same two-step method, just wrong conc)
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'Two-step%3 mol%RT%')
WHERE paper_doi = '10.1101/2025.05.02.651925'
  AND solution_id IN (SELECT id FROM solutions WHERE paper_doi = '10.1101/2025.05.02.651925' AND total_concentration = 1.1);

-- Paper 3 experiments at 3 mol/kg → protocol 5
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'Two-step%3 mol%4°C%')
WHERE paper_doi = '10.1101/2025.05.07.652719'
  AND solution_id IN (SELECT id FROM solutions WHERE paper_doi = '10.1101/2025.05.07.652719' AND total_concentration = 3.0);

-- Paper 3 experiments at 12 mol/kg → protocol 6
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'Multi-step%6-12%4°C%')
WHERE paper_doi = '10.1101/2025.05.07.652719'
  AND solution_id IN (SELECT id FROM solutions WHERE paper_doi = '10.1101/2025.05.07.652719' AND total_concentration = 12.0);

-- Paper 4 → protocol 7
UPDATE experiments SET protocol_id = (SELECT id FROM protocols WHERE name LIKE 'HTS%single-step%')
WHERE paper_doi = '10.1101/2025.05.26.654916';

COMMIT;
