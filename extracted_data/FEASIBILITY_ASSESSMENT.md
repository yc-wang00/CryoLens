# Layer 1 Feasibility Assessment

## What We Just Did

Extracted structured CPA formulation data from 8 papers using training knowledge alone. No PDF processing, no API calls. This tests whether the data exists and whether it's structured enough to extract.

## What We Got

| Category | Count |
|----------|-------|
| Unique cocktail formulations | 4 (DP6, VS55, M22, VM3) |
| Alternative protocols | 2 (slow-freeze ovary, supercooled liver) |
| Individual CPA concentration-property datapoints | 18 |
| Toxicity rankings | 6 CPAs |
| Tissue types covered | 8 |
| Organisms covered | 5 |
| Papers referenced | 8 |

## Honest Quality Assessment

### What's HIGH confidence (0.85+)
- The three major cocktail compositions (DP6, VS55, M22) — these are extremely well-documented
- Their CCR/CWR values — reported consistently across multiple papers
- Relative toxicity ordering of individual CPAs
- Landmark biological outcomes (M22 kidney transplant, nanowarming results)

### What's MEDIUM confidence (0.65-0.85)
- Individual CPA CCR/CWR at specific concentrations — I know the general curves but exact numbers need verification
- Tg values — reported ranges vary by 5-10°C across papers depending on method
- Toxicity EC50 values — these are approximate, depend heavily on cell type

### What's LOW confidence (<0.65)
- VM3 composition — extracted from a preprint, may not be fully reported
- Exact CWR values for individual CPAs at specific concentrations — these are order-of-magnitude estimates
- Some of the non-standard formulations

## The Critical Honest Finding

### Good news:
1. **The data exists.** There IS enough structured information in the cryopreservation literature to build a meaningful knowledge base.
2. **The schema works.** The extraction schema captures what matters: components, concentrations, thermal properties, biological outcomes, toxicity.
3. **The major cocktails are well-documented.** DP6, VS55, and M22 are gold-standard formulations with consistent data across many papers.
4. **Individual CPA properties follow clear patterns.** CCR/CWR decrease exponentially with concentration. This is highly predictable.

### Honest problems:
1. **The dataset is SMALL.** From 8 papers, we get ~6 formulations and ~18 concentration datapoints. That's thin for ML.
2. **Most papers report on the SAME three cocktails.** DP6, VS55, M22 dominate the literature. There aren't 100 different cocktails — there are maybe 10-15 serious ones in the entire field.
3. **Concentration-property data for individual CPAs is the richest seam.** If we want enough data for prediction, individual CPA properties at various concentrations give us more rows than cocktail-level data.
4. **Biological outcomes are qualitative, not quantitative.** Most papers report "good viability" or "structural preservation" rather than "87.3% cell viability."
5. **The training knowledge extraction has real gaps.** I couldn't recall exact table values — at the hackathon, with actual PDFs fed to Claude API, the extraction will be much more precise.

## Revised Strategy for Hackathon

### Data volume projection (realistic)
With 15-20 papers processed via Claude API (with actual PDFs):
- **Cocktail formulations**: 10-20 unique cocktails
- **Individual CPA concentration-property rows**: 50-100 (this is the main ML dataset)
- **Biological outcome records**: 20-40
- **Toxicity observations**: 15-30

### What this means for each layer:

**Layer 2 (Knowledge Base)**: Viable. Even 15 cocktails + 50 individual CPA datapoints is enough for a useful, explorable knowledge base.

**Layer 3 (Explorer)**: Viable. A formulation browser with 15-20 entries is usable. The comparison and detail views work even with modest data.

**Layer 4 (Prediction)**: MARGINAL. Gaussian Process Regression can work with 30-50 datapoints, but the predictions will have wide uncertainty bands. This is actually OK for the demo — wide uncertainty on a novel formulation is honest and scientifically defensible. But we should frame it as "preliminary predictions" not "accurate predictions."

**Layer 5 (Gap Analysis)**: STRONG. Even with small data, the gap analysis is powerful because it shows what HASN'T been tested. A 15-formulation × 8-tissue heatmap that's mostly gray (untested) is itself a compelling finding.

## Key Strategic Insight

The strongest version of this project is NOT "we built a big database" — the dataset will never be big enough in 36 hours to be impressive by sheer volume.

The strongest version is: **"We built the extraction pipeline, proved it works, and even on a small sample, the results reveal how fragmented and incomplete the field's knowledge is."**

The gap analysis and the extraction system design are more impressive than the data volume.

## Recommended Adjustments

1. **Double down on extraction pipeline quality, not quantity.** 10 perfectly extracted papers > 25 sloppy ones.
2. **Use the arXiv Bayesian optimization paper (2602.13398) as a bonus data source.** It has high-throughput experimental data that could give us 50+ formulation-viability pairs alone.
3. **Frame the predictive layer as "proof of concept" not "production model."** Show the methodology is sound, not that the model is accurate.
4. **Make gap analysis the climax of the demo.** "Here's what the field doesn't know" is more dramatic than "here's what it knows."
5. **Build the pipeline to be extensible.** Show that adding a new paper takes 30 seconds with the extraction prompt. The judges should think "if they process 500 papers, this becomes the definitive resource."
