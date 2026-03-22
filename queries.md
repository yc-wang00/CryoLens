# CryoSight Demo Queries

This file is a demo script for the current seeded database.

Use it in Navicat or `psql` to show that CryoSight can:

- inspect source papers
- inspect benchmark and assay-defined CPA structures
- answer condition-aware evidence questions
- support simple discovery-style retrieval

The current seeded database contains:

- `4` documents
- `189` document chunks
- `4` CPA structures
- `29` replacement entries
- `37` findings

## Quick Table Check

Question:
What is in the database right now?

```sql
select count(*) as documents from documents;
select count(*) as document_chunks from document_chunks;
select count(*) as cpa_structures from cpa_structures;
select count(*) as replacement_index from replacement_index;
select count(*) as findings from findings;
```

Expected answer:
- 4 source papers
- 4 structures
- 29 replacement candidates
- 37 findings

## 1. Show The Source Papers

Question:
What papers do we currently have?

```sql
select id, title, doi, journal, year
from documents
order by year, title;
```

Expected answer:
- 4 rows
- 3 Ahmadkhani papers plus 1 Jaskiewicz HTS validation paper

Why it matters:
- proves the database is source-aware, not just a bag of molecule names

## 2. Show The Seeded CPA Structures

Question:
What CPA structures are seeded?

```sql
select name, structure_type, tissue_tags_json, notes
from cpa_structures
order by structure_type, name;
```

Expected answer:
- `VS55`
- `DP6`
- `M22`
- `FA_GLY_12M_4C`

Why it matters:
- shows both canonical benchmark cocktails and an assay-defined mixture

## 3. Inspect A Benchmark Cocktail

Question:
What is in `VS55`?

```sql
select
  structure_name,
  component_name,
  component_role,
  concentration_m
from v_cpa_structure_components
where lower(structure_name) = 'vs55'
order by component_name;
```

Expected answer:
- `dimethyl sulfoxide` at `3.1 M`
- `1,2-propanediol` at `2.2 M`
- `formamide` at `3.1 M`

Why it matters:
- shows that cocktails are flattened into SQL-friendly rows for downstream search

## 4. Compare Benchmarks

Question:
How do `VS55`, `DP6`, and `M22` compare structurally?

```sql
select
  structure_name,
  component_name,
  concentration_m,
  pct_wv,
  component_role
from v_cpa_structure_components
where structure_name in ('VS55', 'DP6', 'M22')
order by structure_name, component_name;
```

Expected answer:
- `DP6` is simpler
- `VS55` introduces formamide
- `M22` is much more complex and includes polymers and ice blockers

Why it matters:
- this is a good bridge from "database demo" to "discovery engine story"

## 5. Show An Assay-Defined Mixture

Question:
Do we store tested mixtures as well as benchmark cocktails?

```sql
select
  structure_name,
  structure_type,
  component_name,
  concentration_mol_per_kg
from v_cpa_structure_components
where structure_name = 'FA_GLY_12M_4C'
order by component_name;
```

Expected answer:
- `formamide` at `6 mol/kg`
- `glycerol` at `6 mol/kg`
- structure type `mixture`

Why it matters:
- shows that the schema supports both reusable formulations and assay-derived mixture evidence

## 6. Pull Findings For One Compound

Question:
What does the database know about formamide?

```sql
select
  source_title,
  metric_type,
  metric_value,
  metric_unit,
  temperature_c,
  concentration_mol_per_kg,
  finding_summary
from v_findings_headline
where component_names_json ? 'formamide'
order by year, source_title, metric_type;
```

Expected answer:
- permeability finding from the *Scientific Reports* paper
- rescue-partner evidence from the `4 C` paper
- `97 percent viability` for `formamide + glycerol` at `4 C`

Why it matters:
- demonstrates condition-aware evidence retrieval instead of plain keyword search

## 7. Show Why 4 C Matters

Question:
What evidence do we have that `4 C` is better than room temperature?

```sql
select
  source_title,
  metric_type,
  metric_value,
  metric_unit,
  finding_summary
from v_findings_headline
where temperature_c = 4
  and (
    metric_type = 'better_at_4c_count'
    or metric_type = 'temperature_shift_example'
    or tags_json ? 'cold_screen'
  )
order by metric_type, source_title;
```

Expected answer:
- findings from the cold-screen paper
- evidence that many matched conditions were less toxic at `4 C`
- example compounds that improved strongly when tested cold

Why it matters:
- this is one of the clearest scientific stories in the current seed

## 8. Find Rescue Partners For Formamide

Question:
What rescues formamide toxicity at `4 C`?

```sql
select
  component_name,
  count(*) as support_count
from v_findings_components
where finding_id in (
  select finding_id
  from v_findings_headline
  where temperature_c = 4
    and component_names_json ? 'formamide'
)
and lower(component_name) <> 'formamide'
group by component_name
order by support_count desc, component_name;
```

Expected answer:
- `glycerol`
- `dimethyl sulfoxide`
- `2-methoxyethanol`
- `ethylene glycol`

Why it matters:
- this is the best discovery-style query in the current demo set

## 9. Show The Best Hero Result

Question:
What is the strongest toxicity-neutralization example in the current seed?

```sql
select
  source_title,
  component_names_json,
  metric_value,
  metric_unit,
  temperature_c,
  concentration_mol_per_kg,
  finding_summary
from v_findings_headline
where metric_type = 'viability_percent'
  and temperature_c = 4
order by metric_value desc nulls last
limit 5;
```

Expected answer:
- `formamide + glycerol`
- `97 percent viability`
- `12 mol/kg`
- `4 C`

Why it matters:
- a crisp result with a clear biological design implication

## 10. Show Which Paper Guides Future Screening

Question:
What concentration does the validation paper recommend for a primary HTS campaign?

```sql
select
  source_title,
  metric_type,
  metric_value,
  metric_unit,
  finding_summary
from v_findings_headline
where metric_type = 'recommended_primary_screen_concentration';
```

Expected answer:
- `5 M`
- from the Jaskiewicz validation paper

Why it matters:
- shows that the database can support discovery-planning decisions, not just retrospective lookup

## 11. Search Findings By Plain Text

Question:
Can we search findings text directly before embeddings are added?

```sql
select
  source_title,
  metric_type,
  finding_summary
from v_findings_headline
where search_text ilike '%formamide plus glycerol%'
   or search_text ilike '%97 percent viability%';
```

Expected answer:
- the `FA + glycerol` hero finding

Why it matters:
- demonstrates the pre-embedding search path

## 12. Candidate Discovery Query

Question:
Which candidate molecules appear across multiple papers?

```sql
select
  name,
  class_name,
  simple_descriptors_json -> 'source_seed_keys' as source_seed_keys
from replacement_index
where jsonb_array_length(simple_descriptors_json -> 'source_seed_keys') >= 3
order by name;
```

Expected answer:
- repeated candidates like `dimethyl sulfoxide`, `ethylene glycol`, `glycerol`, `formamide`, `1,2-propanediol`

Why it matters:
- this is a simple prioritization signal for follow-up screening

## Best 5-Question Demo Flow

If you only have a few minutes, use this order:

1. What papers do we currently have?
2. What CPA structures are seeded?
3. What is in `VS55`?
4. What rescues formamide toxicity at `4 C`?
5. What should we use for a primary large-scale screen?

## Good Natural-Language Questions To Ask Me Live

These map well to the current schema and SQL views:

- What CPA structures are currently seeded?
- What is in `VS55`?
- Compare `VS55`, `DP6`, and `M22`.
- What does the database know about formamide?
- What rescues formamide toxicity at `4 C`?
- What evidence suggests cold equilibration is safer?
- Which compounds look promising as rescue partners?
- What is the strongest mixture result in the current seed?
- Which paper recommends `5 M` for a primary HTS campaign?
- Based on the current seed, what should we test next?
