-- Findings extracted from the 4 seeded papers
-- Each finding is a knowledge claim that an AI agent should be able to retrieve.

BEGIN;

-- ============================================================
-- PAPER 1: Ahmadkhani (2025) Sci Reports — Permeability screening
-- ============================================================

INSERT INTO findings (paper_doi, category, claim, details, tissue_type, organism, cell_type, source_location, confidence) VALUES
    ('10.1038/s41598-025-85509-x', 'assay_development',
     'A 96-well calcein fluorescence quenching method enables ~100× faster CPA permeability measurement than previous methods, measuring 100 samples in 30 minutes.',
     'Previous methods (Coulter counter, microscopic fluorescence quenching) required 15-30 min per single sample. This method uses an automated plate reader (FlexStation 3) to simultaneously measure fluorescence kinetics across a full 96-well plate.',
     NULL, 'bovine', 'BPAEC', 'Abstract + Discussion p7', 'high');

INSERT INTO findings (paper_doi, category, claim, details, tissue_type, organism, cell_type, source_location, confidence) VALUES
    ('10.1038/s41598-025-85509-x', 'toxicity_finding',
     '23 of 27 candidate CPAs passed initial screening (>80% viability) at ~1M concentration and 4°C, suggesting a large untapped chemical space for cryoprotection.',
     'Only 5 of these 23 non-toxic compounds (DMSO, EG, PG, glycerol, formamide) are commonly used in cryopreservation. The other 18 have never been tested in vitrification cocktails.',
     NULL, 'bovine', 'BPAEC', 'Discussion p7', 'high');

INSERT INTO findings (paper_doi, category, claim, details, tissue_type, organism, cell_type, source_location, confidence) VALUES
    ('10.1038/s41598-025-85509-x', 'toxicity_finding',
     'Four compounds were toxic at both temperatures: N,N-dimethylethanolamine, ethanolamine, diethylene glycol monobutyl ether, and pyridine.',
     'Ethanolamine derivatives exhibited cytotoxic effects under certain conditions, potentially due to their shared structural features including amine groups.',
     NULL, 'bovine', 'BPAEC', 'Text p7', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1038/s41598-025-85509-x', 'osmotic_response',
     'Glycerol has the lowest CPA membrane permeability among all tested compounds, consistent with known literature.',
     'CPA permeability trend: glycerol < ethylene glycol < DMSO < propylene glycol < formamide. This ordering was consistent with previous studies using different cell types (human red blood cells, bovine endothelial cells).',
     'Discussion p7', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1038/s41598-025-85509-x', 'thermal_property',
     'CPA permeability values at 4°C were approximately 2× lower than at 25°C, and the temperature ratio was approximately 4× for room temperature.',
     'Activation energies for CPA transport ranged from 41 kJ/mol (DHA) to 107.4 kJ/mol (glycerol). DHA showed uniquely low temperature sensitivity.',
     'Discussion p7, Table 2', 'high');


-- ============================================================
-- PAPER 2: Ahmadkhani (2025) bioRxiv — Mixture toxicity RT
-- ============================================================

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.02.651925', 'protocol_innovation',
     'A two-step CPA addition method is sufficient to prevent osmotic damage and is superior to both single-step and multi-step methods for 3 mol/kg exposure.',
     'Single-step caused osmotic damage (especially for glycerol). Multi-step resulted in MORE toxicity due to prolonged CPA exposure. Two-step provided the best balance.',
     'Results Section 3, Figure 2, lines 173-190', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.02.651925', 'toxicity_finding',
     'CPA toxicity increases with both concentration and exposure duration. At 3 mol/kg with 30 min exposure, only 7 of 21 CPAs yielded >80% viability.',
     'The 7 passing compounds: glycerol, DMSO, propylene glycol, ethylene glycol, diethylene glycol, 1,3-propanediol, and 2-methoxyethanol. At 6 mol/kg, only ethylene glycol maintained high viability.',
     'Results, lines 197-214', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.02.651925', 'toxicity_neutralization',
     'In 20 of 46 binary CPA mixtures tested at 6 mol/kg, cell viability was higher for the mixture than for both corresponding single-CPA solutions, suggesting widespread toxicity reduction in mixtures.',
     'Only 2 of 46 mixtures showed lower viability than both components. Four combinations showed statistically significant toxicity neutralization: FA/GLY, DMSO/PD, PG/DG, and DG/PD.',
     'Results, lines 222-244, Figure 6', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.02.651925', 'toxicity_mechanism',
     'Toxicity reduction in CPA mixtures occurs through two mechanisms: mutual dilution (each CPA lowers the effective concentration of the others) and toxicity neutralization (one CPA directly counteracts the toxic effect of another).',
     'Mutual dilution is a general effect. Toxicity neutralization is a specific chemical interaction, as described by Fahy (2010) for DMSO neutralizing formamide toxicity.',
     'Discussion, lines 245-256', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.02.651925', 'recommendation',
     'Future research should focus on broadening the chemical library of potential CPAs and examining toxicity reduction by lowering temperature.',
     'The high-throughput approach can generate large datasets that serve as foundation for predictive models for identification and evaluation of new CPAs.',
     'Conclusions, lines 262-281', 'medium');


-- ============================================================
-- PAPER 3: Ahmadkhani (2025) bioRxiv — 4°C screening
-- ============================================================

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.07.652719', 'toxicity_finding',
     'CPA toxicity at 4°C is significantly reduced compared to room temperature for 80% of compounds tested, with some compounds showing dramatically improved viability.',
     'Statistical analysis of 54 CPA compositions at 6 mol/kg showed significantly greater viability at 4°C vs 21°C. Examples: propylene glycol was fully toxic at RT but only mildly toxic at 4°C. Several compositions yielded >80% viability at 4°C but were completely toxic at RT.',
     'Results Section 3.2, Figure 5, lines 1-10 (p11)', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.07.652719', 'toxicity_neutralization',
     'Formamide/glycerol mixture at 12 mol/kg and 4°C achieves 97% cell viability, despite both components being toxic individually at 6 mol/kg. This is the most striking toxicity neutralization observed.',
     'FA alone at 6 mol/kg = 20% viability. GLY alone at 6 mol/kg = toxic. FA+GLY at 12 mol/kg total (6 mol/kg each) = 97% viability. This represents toxicity neutralization, not just mutual dilution. Consistent with Fahy 2010 observation for DMSO/FA.',
     'Results Section 3.4, Figure 9, lines 12-24 (p13)', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.07.652719', 'toxicity_neutralization',
     'At 4°C, 12 CPA mixtures at 6 mol/kg and 8 mixtures at 12 mol/kg showed statistically significant toxicity reduction compared to their individual constituents.',
     'Toxicity neutralization was observed in 9 specific cases with notable effect. Involves combinations of formamide, acetamide, glycerol, dimethyl sulfoxide, and diethylene glycol.',
     'Results Sections 3.3-3.4, Figures 6-9', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.07.652719', 'protocol_innovation',
     'An automated liquid handling system (Hamilton Microlab STARlet) was retrofitted with a plate cooling module (MéCour) to enable high-throughput CPA toxicity screening at 4°C.',
     'Circulating bath set to -4°C stabilized plate temperature at 4 ± 2°C. This enabled the first systematic CPA toxicity screen at the temperature actually used for organ CPA equilibration.',
     'Results Section 3, Methods 2.2, Figure 1', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.07.652719', 'gap_identified',
     'Room-temperature CPA toxicity screening data cannot reliably predict toxicity at 4°C. Some compounds that pass screening at 25°C are lethal at 4°C (MPD, TFA), and vice versa.',
     'This challenges the common practice of screening CPAs at room temperature and assuming results transfer to cryopreservation protocols that equilibrate at 4°C.',
     'Discussion Section 4, lines 1-10 (p15)', 'high');


-- ============================================================
-- PAPER 4: Jaskiewicz/Sandlin (2025) bioRxiv — HTS validation
-- ============================================================

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.26.654916', 'assay_development',
     'A CPA toxicity assay using T24 cell monolayers in 96-well format achieves a Z-factor of 0.75, with intra-assay CV <20% and drift <20%, meeting HTS validation standards.',
     'Z-factor between 0.5 and 1.0 is considered excellent for HTS. This is the first CPA toxicity assay validated to prevailing HTS standards (NIH Chemical Genomics Center guidance).',
     'Abstract, Results Section 3', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.26.654916', 'toxicity_finding',
     'In a pilot screen of 587 unique CPA cocktails (2-7 components, 3.5-8 M total), cell survival at 5M ranged from 2.8% to 87.3%, with a hit rate of 1.7% (defined as viability ≥80%).',
     'Library constructed from 7 components: ethylene glycol, Me2SO, glycerol, 1,2-propanediol, 3-methoxy-1,2-propanediol, 1,3-propanediol, and urea. 2,352 total experiments across 56 plates, 53 passed QC (95% success rate).',
     'Abstract, Methods 2.5 (p8)', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.26.654916', 'scale_up',
     'CPA toxicity HTS is feasible at scale: 587 cocktails screened across 56 plates with 95% plate pass rate. The bottleneck is CPA source plate preparation, not the assay itself.',
     'MultiFlo FX dispensing robot handles all liquid additions. Multi-channel pipette used for CPA transfer from source to experimental plate. BioTek ELx50 aspirator for CPA removal.',
     'Results, Methods 2.3 (p6-8)', 'high');

INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence) VALUES
    ('10.1101/2025.05.26.654916', 'recommendation',
     'CPA cocktails at 5M total concentration provide the optimal screening concentration for HTS, offering the best dynamic range for distinguishing hits from non-hits.',
     'At 3.5M, most cocktails show high viability (not informative). At 8M, most show near-zero viability (also not informative). 5M provides maximal spread.',
     'Results, Methods 2.5 (p8)', 'high');


-- ============================================================
-- TAGS
-- ============================================================

-- Paper 1 findings
INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['high_throughput', 'screening', 'permeability', 'calcein'])
FROM findings f WHERE f.claim LIKE '%96-well calcein%';

INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['screening', 'chemical_space', 'novel_cpa'])
FROM findings f WHERE f.claim LIKE '%23 of 27%';

-- Paper 2 findings
INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['protocol', 'osmotic_damage', 'loading_method'])
FROM findings f WHERE f.claim LIKE '%two-step CPA addition%';

INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['mixture', 'toxicity_neutralization', 'binary'])
FROM findings f WHERE f.claim LIKE '%20 of 46 binary%';

INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['mechanism', 'mutual_dilution', 'neutralization'])
FROM findings f WHERE f.claim LIKE '%two mechanisms%';

-- Paper 3 findings
INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['temperature', 'subambient', '4C', 'toxicity'])
FROM findings f WHERE f.claim LIKE '%4°C is significantly reduced%';

INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['formamide', 'glycerol', 'neutralization', '12_mol_kg', 'vitrification_concentration'])
FROM findings f WHERE f.claim LIKE '%97% cell viability%';

INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['temperature_dependence', 'screening_limitation', 'gap'])
FROM findings f WHERE f.claim LIKE '%cannot reliably predict%';

-- Paper 4 findings
INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['hts', 'validation', 'z_factor', 'quality_control'])
FROM findings f WHERE f.claim LIKE '%Z-factor of 0.75%';

INSERT INTO finding_tags (finding_id, tag)
SELECT f.id, unnest(ARRAY['hts', 'pilot_screen', '587_cocktails', 'multi_component'])
FROM findings f WHERE f.claim LIKE '%587 unique CPA cocktails%';

COMMIT;
