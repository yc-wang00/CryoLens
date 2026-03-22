# CryoSight Hero Story

This file is a demo narrative for the current MVP.

The goal is to tell a simple story:

1. start from a known benchmark cocktail
2. identify a likely weak point
3. use the database to gather evidence
4. propose a better next experiment

The current hero story is:

**Can CryoSight help us redesign a formamide-containing CPA cocktail into something safer while preserving useful cryoprotective logic?**

## Short Version

`VS55` is a known benchmark cocktail, but `formamide` is likely one of its major toxicity liabilities.  
CryoSight uses the seeded papers and structures to surface that:

- formamide is very fast permeating
- formamide is also toxicity-constrained
- toxicity is strongly temperature-dependent
- at `4 C`, several partners appear to rescue formamide toxicity
- the strongest current example is `formamide + glycerol`

The resulting hypothesis is:

**test a VS55-like variant that reduces formamide burden and increases support from glycerol and/or ethylene glycol, especially under 4 C loading conditions.**

## Hero Workflow

### Step 1. Start With A Real Benchmark

Presenter says:

> We already know `VS55` is a useful benchmark. The question is not whether it works, but whether we can understand its weaknesses and generate a safer follow-up design.

Question:

> What is in `VS55`?

SQL:

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

Why this matters:

- the system understands a real benchmark formulation, not just isolated molecules

### Step 2. Identify The Likely Weak Point

Presenter says:

> The benchmark contains formamide. In cryopreservation literature, formamide is often useful physically, but suspicious biologically. We want to see whether the current evidence supports that.

Question:

> What does the database know about formamide?

SQL:

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

- formamide has very high permeability
- formamide appears in toxicity-neutralization findings
- formamide appears in the strongest `4 C` mixture example

Presenter takeaway:

> CryoSight confirms that formamide is attractive because it moves across membranes quickly, but it is also the component most likely to force a toxicity tradeoff.

### Step 3. Ask Whether Loading Conditions Change The Story

Presenter says:

> In cryopreservation, conditions matter. If toxicity changes at `4 C`, the system should help us see that immediately.

Question:

> What evidence do we have that `4 C` is safer than room temperature?

SQL:

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

- multiple matched conditions are less toxic at `4 C`
- the cold-screen paper provides direct evidence for improved viability under subambient loading

Presenter takeaway:

> The system is not just storing “molecule facts.” It is storing condition-aware evidence. That is essential for cryopreservation.

### Step 4. Search For Rescue Partners

Presenter says:

> If formamide is valuable but toxicity-constrained, the next question is not only “replace it,” but also “what helps it behave better?”

Question:

> What rescues formamide toxicity at `4 C`?

SQL:

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

Presenter takeaway:

> Now we have candidate partner molecules that are supported by evidence, not just intuition.

### Step 5. Surface The Strongest Example

Presenter says:

> We also want a clean, memorable result that makes the story concrete.

Question:

> What is the strongest toxicity-neutralization example in the current seed?

SQL:

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

Presenter takeaway:

> This gives us a concrete hero finding: the system can surface a literature-backed mixture that dramatically improves viability under relevant conditions.

### Step 6. Turn Retrieval Into A Hypothesis

Presenter says:

> The point of CryoSight is not just retrieval. It is to help us ask what to test next.

System reasoning summary:

- `VS55` is a real benchmark
- `formamide` is a plausible toxicity bottleneck
- toxicity is strongly condition-dependent
- `4 C` matters
- `glycerol` and `ethylene glycol` look like useful partners
- `DMSO` is also repeatedly implicated as a rescue partner

Proposed next experiment:

> Test a `VS55-like` follow-up design that reduces formamide burden and increases support from glycerol and/or ethylene glycol, using `4 C` loading conditions as the default assay context.

Important note:

This is a hypothesis-generation step, not a claim that the system has discovered a validated replacement already.

That distinction is useful in the demo because it makes the product credible:

- the database retrieves real evidence
- the agent synthesizes that evidence
- the output is a literature-backed next experiment

## Short Demo Script

If you want a fast version, say this:

> We start from a known benchmark, `VS55`.  
> The system shows its components and identifies formamide as a likely toxicity-constrained component.  
> It then pulls condition-aware findings from the seeded papers and shows that toxicity is less severe at `4 C`.  
> Next, it identifies rescue partners for formamide, especially glycerol and DMSO.  
> Finally, it surfaces the strongest example in the dataset: formamide plus glycerol at `4 C` with `97 percent viability`.  
> That lets us move from literature retrieval to a concrete next hypothesis for a safer VS55-like design.

## Alternative Hero Stories

If you want backup options, these also fit the current seed:

- `Which compounds should enter the next 5 M HTS campaign?`
- `How do we simplify M22 while preserving its logic?`
- `What evidence supports cold equilibration as a design rule?`

## Best Questions To Ask Me Live

- What is in `VS55`?
- What does the database know about formamide?
- What evidence suggests `4 C` is safer than room temperature?
- What rescues formamide toxicity at `4 C`?
- What is the strongest mixture result in the current seed?
- Based on the current evidence, what should we test next?
