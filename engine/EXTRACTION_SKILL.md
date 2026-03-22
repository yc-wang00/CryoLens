# CryoLens Paper Extraction Skill

You are a cryobiology data extraction agent. Your job is to read a scientific PDF and insert structured data into the PostgreSQL database `cryosight`.

## Input

You will receive:
- `PDF_PATH`: absolute path to a PDF file
- `DOI`: the paper's DOI
- `TITLE`: the paper's title
- `YEAR`: publication year
- `JOURNAL`: journal name
- `AUTHORS`: first author name (at minimum)

## Process Overview

1. Read the PDF (pages 1-15)
2. INSERT the paper into `papers`
3. Extract and INSERT findings (3-10 per paper)
4. INSERT tags for each finding
5. If the paper defines CPA formulations/solutions, INSERT formulations AND their components

Execute all SQL via: `psql -d cryosight -c "SQL_HERE"`

---

## Step 1: Read the PDF

Use the Read tool to read pages 1-15 of the PDF. Focus on:
- **Abstract**: overall claims, key results
- **Results**: quantitative outcomes (viability %, temperatures, concentrations, p-values)
- **Methods**: formulation recipes, protocols, cell types, organisms
- **Discussion/Conclusion**: broader claims, comparisons, recommendations

If the paper is NOT about cryopreservation, cryobiology, or cryoprotectants, STOP. Do not insert anything.

---

## Step 2: INSERT the Paper

```sql
INSERT INTO papers (doi, title, authors, year, journal, pdf_path)
VALUES (
  'DOI_HERE',
  'TITLE_HERE',
  ARRAY['Author1', 'Author2'],
  YEAR,
  'Journal Name',
  'PDF_PATH_HERE'
) ON CONFLICT (doi) DO NOTHING;
```

**Rules:**
- `doi` is the PRIMARY KEY — use ON CONFLICT DO NOTHING to avoid duplicates
- `authors` is a TEXT ARRAY — use `ARRAY['Name1', 'Name2']` syntax
- Escape single quotes in titles by doubling them: `''`

---

## Step 3: Extract and INSERT Findings

Extract 3-10 key findings from the paper. Each finding is a single, specific, verifiable claim.

```sql
INSERT INTO findings (paper_doi, category, claim, details, tissue_type, organism, cell_type, temperature_c, concentration, concentration_unit, value, value_unit, source_location, confidence, formulation_id)
VALUES (
  'DOI',
  'category_here',
  'One-sentence claim with specific data',
  'Supporting details: exact numbers, conditions, statistical tests',
  'tissue_type or NULL',
  'organism or NULL',
  'cell_type or NULL',
  temperature_or_NULL,
  concentration_or_NULL,
  'unit or NULL',
  numeric_value_or_NULL,
  'unit or NULL',
  'Results Section 3.2, Fig. 2a, Table 1',
  'high',
  NULL
);
```

### Finding Categories (CHECK constraint — must be one of these exactly):

| Category | Use when the finding is about... |
|----------|--------------------------------|
| `vitrification_outcome` | Survival/viability after vitrification |
| `freezing_outcome` | Survival/viability after slow freezing or controlled-rate freezing |
| `transplant_outcome` | Organ/tissue function after transplantation post-cryo |
| `warming_method` | A rewarming technique (nanowarming, water bath, convective) |
| `warming_outcome` | Results of a specific warming approach |
| `thermal_property` | Tg, CCR, CWR, crystallization temperatures, DSC data |
| `ice_formation` | Ice nucleation, recrystallization, devitrification events |
| `osmotic_response` | Osmotic tolerance, volume changes, membrane permeability |
| `toxicity_finding` | CPA toxicity/viability data at specific concentrations |
| `toxicity_mechanism` | How/why a CPA is toxic (apoptosis, ROS, membrane damage) |
| `toxicity_neutralization` | Combinations or conditions that reduce CPA toxicity |
| `protocol_innovation` | New or improved loading/unloading procedure |
| `assay_development` | New measurement method or screening technique |
| `tissue_specific` | Findings specific to a tissue type's cryo response |
| `scale_up` | Scaling from small samples to larger volumes/organs |
| `equipment` | Hardware/device innovations for cryo |
| `modeling` | Mathematical/computational models of cryo processes |
| `prediction` | Predictive results from models |
| `review_conclusion` | Key conclusions from review papers |
| `gap_identified` | Explicitly stated knowledge gaps or limitations |
| `recommendation` | Authors' recommendations for future work |
| `other` | Doesn't fit any above category |

### Confidence Levels:

| Level | Criteria |
|-------|---------|
| `high` | Quantitative data with statistics (p-values, n, ±SD) |
| `medium` | Qualitative but clear observation, or quantitative without statistics |
| `low` | Speculative, preliminary, or inferred from limited data |

### What Makes a GOOD Finding:

**GOOD** (specific, quantitative, verifiable):
```
claim: "Vitrification of human MSCs yields 89.4±4.2% post-thaw viability, not significantly different from slow-freezing (93.2±1.2%)"
details: "Trypan blue staining, passage 5 cells, n≥3. Vitrification used 2.8M DMSO + 2.7M EG + 2.8M formamide + 70g/L PVP K12."
source_location: "Results - Fig. 1b"
```

**BAD** (vague, generic, not from the actual paper):
```
claim: "Vitrification is an effective cryopreservation method"
claim: "This study found that the protocol works well"
claim: "Cryoprotectants can be toxic at high concentrations"
```

### Rules for Findings:

- Extract claims from the ACTUAL PDF content — never fabricate data
- Include specific numbers: percentages, temperatures, concentrations, p-values
- Each claim should stand alone as a verifiable statement
- `source_location` must reference where in the paper the data appears (e.g., "Table 2", "Fig. 3a", "Results p.5")
- Fill in `tissue_type`, `organism`, `cell_type`, `temperature_c` when available
- Fill in `value` and `value_unit` for quantitative findings (e.g., value=89.4, value_unit="% viability")
- `id` is auto-increment (SERIAL) — do NOT specify it in INSERT

---

## Step 4: INSERT Tags for Each Finding

After inserting a finding, retrieve its ID and add 4-8 tags:

```sql
-- Get the finding ID you just inserted
-- Use currval or a subquery:
INSERT INTO finding_tags (finding_id, tag)
SELECT currval('findings_id_seq'), unnest(ARRAY[
  'tag1', 'tag2', 'tag3', 'tag4', 'tag5'
]);
```

Or if inserting findings one at a time, use RETURNING:

```sql
-- Better pattern: INSERT finding, capture ID, then insert tags
DO $$
DECLARE
  fid INTEGER;
BEGIN
  INSERT INTO findings (paper_doi, category, claim, details, source_location, confidence, tissue_type, organism)
  VALUES ('DOI', 'category', 'claim text', 'details', 'source', 'high', 'tissue', 'organism')
  RETURNING id INTO fid;

  INSERT INTO finding_tags (finding_id, tag) VALUES
    (fid, 'tag1'),
    (fid, 'tag2'),
    (fid, 'tag3'),
    (fid, 'tag4');
END $$;
```

### Tag Guidelines:

- Use lowercase with hyphens for multi-word tags: `slow-freezing`, `ethylene-glycol`, `cooling-rate`
- Include the CPA names used: `DMSO`, `glycerol`, `trehalose`, `ethylene-glycol`
- Include the organism: `human`, `mouse`, `bovine`, `porcine`, `rat`
- Include the tissue/cell type: `oocyte`, `sperm`, `ovarian-tissue`, `hepatocyte`, `MSC`, `cardiomyocyte`
- Include the technique: `vitrification`, `slow-freezing`, `nanowarming`, `controlled-rate-freezing`
- Include relevant concepts: `toxicity`, `apoptosis`, `ROS`, `membrane-integrity`, `motility`
- 4-8 tags per finding is the target range

### Tag Normalization (use these standard forms):

| Standard Tag | NOT these |
|-------------|-----------|
| `slow-freezing` | slow_freezing, slow freezing |
| `ethylene-glycol` | ethylene glycol, EG |
| `cooling-rate` | cooling rate, cooling_rate |
| `ovarian-tissue` | ovarian tissue, ovarian_tissue |
| `controlled-rate-freezing` | CRF, controlled rate freezing |
| `propylene-glycol` | propylene glycol, PG |

---

## Step 5: Extract and INSERT Formulations

**This step is CRITICAL and was previously skipped by agents.**

If the paper defines a CPA solution/cocktail with specific components and concentrations, you MUST create both:
1. A `formulations` row (the recipe name and metadata)
2. `formulation_components` rows (each chemical and its concentration)

### 5a: Check if the Formulation Already Exists

```sql
-- Check existing formulations for this paper
SELECT id, name FROM formulations WHERE reference_doi = 'DOI_HERE';
```

If formulations already exist for this DOI, skip to Step 5c (just add components if missing).

### 5b: INSERT the Formulation

```sql
INSERT INTO formulations (id, name, full_name, total_concentration, concentration_unit, carrier_solution, developed_by, year_introduced, reference_doi, description)
VALUES (
  'short_snake_case_id',
  'Short Name (components)',
  'Full Descriptive Name',
  8.3,
  'M',
  'Euro-Collins + HEPES',
  'Lab Name',
  2020,
  'DOI_HERE',
  'Detailed text description of the full protocol including equilibration and warming steps'
) ON CONFLICT (id) DO NOTHING;
```

**ID Convention:** Use snake_case: `{author_year}_{key_components}` or `{descriptive_name}`
Examples: `jeong2020_vitsoln`, `tessier2022_pf_pg12`, `vs55_peg_spion5`

### 5c: INSERT Formulation Components

**This is the step agents were missing. Every formulation MUST have its components.**

```sql
INSERT INTO formulation_components (formulation_id, compound_id, concentration, concentration_unit, role_in_formulation)
VALUES
  ('formulation_id', 'compound_id', 2.8, 'M', 'penetrating_cpa'),
  ('formulation_id', 'compound_id', 0.3, 'M', 'non_penetrating_cpa')
ON CONFLICT DO NOTHING;
```

**You MUST use compound_id values from the existing compounds table.** Here are all valid compound IDs:

#### Penetrating CPAs:
| compound_id | Common Names |
|-------------|-------------|
| `dmso` | DMSO, dimethyl sulfoxide, Me2SO |
| `ethylene_glycol` | EG, ethylene glycol |
| `propylene_glycol` | PG, propylene glycol, 1,2-propanediol, PROH |
| `glycerol` | glycerol, GLY |
| `formamide` | formamide, FA |
| `methanol` | methanol, MeOH |
| `acetamide` | acetamide |
| `n_methylacetamide` | NMA, N-methylacetamide, NMF |
| `dimethylacetamide` | DMA, dimethylacetamide |
| `2_3_butanediol` | 2,3-butanediol, BD |
| `1_3_propanediol` | 1,3-propanediol |
| `propionamide` | propionamide |
| `urea` | urea |
| `ethanolamine` | ethanolamine |
| `diethylene_glycol` | diethylene glycol |
| `triethylene_glycol` | triethylene glycol |
| `2_methoxyethanol` | 2-methoxyethanol |
| `3_methoxy_1_2_propanediol` | 3-methoxy-1,2-propanediol |
| `2_methyl_1_3_propanediol` | MPD, 2-methyl-1,3-propanediol |
| `2_methyl_2_4_pentanediol` | 2-methyl-2,4-pentanediol |
| `pyridine` | pyridine |
| `tetrahydrofurfuryl_alcohol` | THFA |
| `1_3_dihydroxyacetone` | DHA, 1,3-dihydroxyacetone |
| `triethanolamine` | triethanolamine |

#### Non-Penetrating CPAs:
| compound_id | Common Names |
|-------------|-------------|
| `sucrose` | sucrose |
| `trehalose` | trehalose |
| `raffinose` | raffinose |
| `glucose` | glucose |
| `mannitol` | mannitol |
| `3_o_methyl_glucose` | 3-OMG, 3-O-methyl-D-glucose |
| `dextran` | dextran |
| `ficoll_pm70` | Ficoll PM 70 |
| `hydroxyethyl_starch` | HES, hydroxyethyl starch |
| `peg_35kda` | PEG 35kDa, polyethylene glycol (high MW) |
| `peg_6kda` | PEG 6000 |
| `polyvinylpyrrolidone_k12` | PVP K12 |
| `pvp_40kda` | PVP 40kDa |
| `bsa` | BSA, bovine serum albumin |
| `fbs` | FBS, fetal bovine serum |
| `cooh_pll` | COOH-PLL, carboxylated poly-L-lysine |

#### Ice Blockers:
| compound_id | Common Names |
|-------------|-------------|
| `x_1000` | X-1000, Supercool X-1000 |
| `z_1000` | Z-1000, Supercool Z-1000 |
| `afgp-cod` | AFGP, antifreeze glycoprotein |
| `afp-i` | AFP Type I |
| `afp-iii-nfeafp11` | AFP Type III, nfeAFP11 |
| `trxa-apafp752` | TrxA-ApAFP752 |
| `beta_pmp_glc` | pMPGlc |
| `beta_pbrph_glc` | pBrPhGlc |
| `noglc` | n-octyl-glucoside |

#### Other:
| compound_id | Common Names |
|-------------|-------------|
| `fe3o4-nanoparticles` | SPIONs, iron oxide nanoparticles, sIONP |
| `melatonin` | melatonin |
| `berberine` | berberine |
| `l_proline` | L-proline |
| `egf` | EGF |
| `fgf` | FGF |

### Concentration Units:

Use consistent units. Common patterns:
- Molar: `M` (e.g., 2.8 M DMSO)
- Millimolar: `mM` (e.g., 200 mM trehalose)
- Percent v/v: `% v/v` (e.g., 15% v/v EG)
- Percent w/v: `% w/v` (e.g., 5% w/v PEG)
- Percent w/w: `% w/w`
- Grams per liter: `g/L` (e.g., 70 g/L PVP)
- mg per mL: `mg/mL`

### role_in_formulation Values:

| Value | When to use |
|-------|-------------|
| `penetrating_cpa` | Penetrating CPA (DMSO, EG, PG, glycerol, formamide, etc.) |
| `non_penetrating_cpa` | Non-penetrating CPA (sucrose, trehalose, PVP, PEG, etc.) |
| `ice_blocker` | Ice recrystallization inhibitor (X-1000, Z-1000, AFPs) |
| `nanowarming_agent` | Nanoparticles for nanowarming (SPIONs) |
| `membrane_stabilizer` | Membrane-stabilizing agent (PEG at low concentration) |
| `intracellular_protection` | Intracellular protective agent (3-OMG) |
| `carrier` | Base medium component when it's part of the formulation |

### When a Compound is NOT in the Table:

If the paper uses a CPA that doesn't match any compound_id above:
1. Do NOT insert into `compounds` — we curate that table manually
2. DO still create the formulation row and mention the unknown compound in `description` and `notes`
3. Skip that compound in `formulation_components`

### When Concentrations are Unknown:

If the paper uses a commercial kit or doesn't specify exact concentrations:
1. Still INSERT the component with `concentration = 0` and `concentration_unit = 'unknown (commercial kit)'`
2. Note the source in the formulation's `notes` field

---

## Complete Example: Full Extraction for One Paper

```sql
-- Step 2: Insert paper
INSERT INTO papers (doi, title, authors, year, journal, pdf_path)
VALUES (
  '10.1186/s12896-020-00636-9',
  'Vitrification for cryopreservation of 2D and 3D stem cells culture using high concentration of cryoprotective agents',
  ARRAY['Young-Hoon Jeong', 'Ukjin Kim', 'Seul-Gi Lee', 'C-Yoon Kim'],
  2020,
  'BMC Biotechnology',
  '/path/to/32843026.pdf'
) ON CONFLICT (doi) DO NOTHING;

-- Step 3+4: Insert finding with tags (using DO block)
DO $$
DECLARE fid INTEGER;
BEGIN
  INSERT INTO findings (paper_doi, category, claim, details, tissue_type, organism, cell_type, temperature_c, value, value_unit, source_location, confidence)
  VALUES (
    '10.1186/s12896-020-00636-9',
    'vitrification_outcome',
    'Vitrification of human MSCs yields 89.4±4.2% post-thaw viability, not significantly different from slow-freezing (93.2±1.2%)',
    'Trypan blue staining at passage 5. No significant difference in population doubling time up to passage 9. Vitrification solution: 2.8M DMSO + 2.7M EG + 2.8M formamide + 70g/L PVP K12 in modified LM5.',
    NULL, 'human', 'adipose-derived MSC', NULL,
    89.4, '% viability',
    'Results - Fig. 1b',
    'high'
  ) RETURNING id INTO fid;

  INSERT INTO finding_tags (finding_id, tag) VALUES
    (fid, 'vitrification'),
    (fid, 'MSC'),
    (fid, 'human'),
    (fid, 'cell-viability'),
    (fid, 'DMSO'),
    (fid, 'ethylene-glycol'),
    (fid, 'formamide');
END $$;

-- Step 5: Insert formulation + components
INSERT INTO formulations (id, name, full_name, total_concentration, concentration_unit, carrier_solution, year_introduced, reference_doi, description)
VALUES (
  'jeong2020_vitsoln',
  'Jeong2020 Vitrification Solution',
  'MSC Vitrification: 2.8M DMSO + 2.7M EG + 2.8M Formamide + PVP K12 + 0.3M Sucrose',
  8.3,
  'M (total penetrating CPAs)',
  'Modified LM5 (sucrose replaces glucose, mannitol, lactose)',
  2020,
  '10.1186/s12896-020-00636-9',
  'Two-step vitrification. Equilibration: 1.4M DMSO + EG in DPBS+20% FBS for 10 min. Vitrification: 2.8M DMSO + 2.7M EG + 2.8M formamide + 70g/L PVP K12 in modified LM5 with 0.3M sucrose for 1 min. Washout: stepwise sucrose (0.5M, 0.25M, 0M, 5 min each).'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO formulation_components (formulation_id, compound_id, concentration, concentration_unit, role_in_formulation)
VALUES
  ('jeong2020_vitsoln', 'dmso', 2.8, 'M', 'penetrating_cpa'),
  ('jeong2020_vitsoln', 'ethylene_glycol', 2.7, 'M', 'penetrating_cpa'),
  ('jeong2020_vitsoln', 'formamide', 2.8, 'M', 'penetrating_cpa'),
  ('jeong2020_vitsoln', 'polyvinylpyrrolidone_k12', 70, 'g/L', 'non_penetrating_cpa'),
  ('jeong2020_vitsoln', 'sucrose', 0.3, 'M', 'non_penetrating_cpa')
ON CONFLICT DO NOTHING;
```

---

## Common Mistakes to AVOID

1. **Creating formulations without components** — ALWAYS insert into `formulation_components` when you create a formulation. A formulation without components is useless.

2. **Fabricating data** — Only extract claims that are explicitly stated in the PDF. Never invent numbers.

3. **Using wrong compound IDs** — Always use IDs from the compound table above. `eg` is wrong, `ethylene_glycol` is correct. `pg` is wrong, `propylene_glycol` is correct.

4. **Vague claims** — "The method worked well" is not a finding. "Post-thaw viability was 89.4±4.2% (n=3, p>0.05 vs control)" IS a finding.

5. **Missing source_location** — Every finding needs a reference to where in the paper it came from.

6. **Forgetting ON CONFLICT** — Always use `ON CONFLICT DO NOTHING` on papers and formulations to prevent duplicate key errors from concurrent agents.

7. **Not escaping single quotes** — In SQL strings, escape `'` as `''`. E.g., `'Dulbecco''s Modified Eagle''s Medium'`.

8. **Inconsistent tags** — Use the standard tag forms listed above. Don't mix `slow-freezing` and `slow_freezing`.

9. **Too few or too many findings** — Target 3-10 findings per paper. Review papers might have 8-10 broad conclusions. Focused experimental papers might have 5-7 specific results.

10. **Skipping non-CPA papers** — If the paper is about fertility outcomes, surgical techniques, or other non-cryo topics that happen to mention cryopreservation, extract only the cryo-relevant findings. If there are none, insert the paper row but no findings.

---

## Decision Tree

```
Read PDF pages 1-15
  |
  v
Is this a cryobiology/cryopreservation paper?
  |-- NO --> Insert paper row only, STOP
  |-- YES --> Continue
  v
INSERT paper (ON CONFLICT DO NOTHING)
  |
  v
Extract 3-10 findings from Results/Discussion
  |-- For each finding: INSERT finding + INSERT tags (4-8 per finding)
  |
  v
Does the paper define specific CPA solutions with concentrations?
  |-- NO --> DONE
  |-- YES --> Continue
  v
For each named solution/cocktail:
  |-- Check if formulation exists: SELECT id FROM formulations WHERE reference_doi = 'DOI'
  |-- If not: INSERT formulation row
  |-- ALWAYS: INSERT formulation_components for each chemical with its concentration
  |
  v
DONE
```
