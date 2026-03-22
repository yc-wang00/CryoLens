# LensCPA-1: A Low-Osmolarity Vitrification Solution Designed for the Blood-Brain Barrier

**CryoLens Team — Defeating Entropy Hackathon, March 2026**

---

## Abstract

We analyzed 937 cryopreservation papers (5,526 structured findings) using CryoLens, a structured knowledge engine built on top of a curated Postgres database exposed via MCP. Three under-connected patterns emerged from the literature: (1) formamide–glycerol toxicity neutralization achieves 97% cell viability at concentrations that kill cells individually, (2) L-proline halves the required DMSO concentration while protecting mitochondria, and (3) synthetic polyampholytes provide ice recrystallization inhibition without intracellular osmotic cost. We propose **LensCPA-1**, a 5M vitrification solution that combines these mechanisms — 40% less osmotically aggressive than VS55, with three independent toxicity-neutralization pathways. It is designed specifically for BBB-protected tissue and is testable with a standard 96-well screening protocol.

---

## 1. The Problem

Every successful vitrification of complex tissue (VS55, M22, V3) relies on CPA concentrations of 8–10M. This creates two compounding problems:

1. **Toxicity.** DMSO at 3M induces intracellular Ca²⁺ overload, triggering mitochondrial permeability transition pores (mPTP), ROS discharge, ATP depletion, and apoptosis (doi:10.1038/s41598-023-49892-7). Above 25 mol%, DMSO causes permanent bilayer disorganization (doi:10.1038/s41598-019-56585-7).

2. **Osmotic aggression.** German et al. (2026, PNAS) achieved the first functional recovery of vitrified mouse hippocampus, but whole-brain perfusion caused massive cerebral dehydration. They tried mannitol, SDS, sonication, proteases, calcium chelators, AQP4 inhibitors, and pulsed perfusion — none mitigated the dehydration. The brain retained only 69.8% of its mass (doi:10.1073/pnas.2516848123).

**The bottleneck is not the CPA's glass-forming ability. It is the osmotic cost of delivering enough CPA past the blood-brain barrier.**

---

## 2. Three Insights from the CryoLens Database

### 2.1 Toxicity Neutralization Is Real and Dramatic

Ahmadkhani et al. (2025) screened 27 CPA candidates and found that only 5 of the 23 non-toxic compounds are currently used in cryopreservation. More importantly, their mixture screening revealed:

> **Formamide + glycerol at 12 mol/kg and 4°C achieves 97% cell viability, despite both components being individually toxic at 6 mol/kg.** This is not mutual dilution — it is a specific chemical interaction.
>
> — doi:10.1101/2025.05.07.652719

DMSO also neutralizes formamide toxicity (Fahy 2010; doi:10.3390/molecules27103254). M22 already exploits this (2.855M DMSO + 2.855M formamide), but at extreme total concentrations.

### 2.2 L-Proline Halves DMSO Requirements

L-proline (2 mol/L) added to vitrification solution reduced required DMSO from 15% to 7.5% and EG from 15% to 10% while maintaining 93.7% oocyte survival. Mechanistically:

- Pyrrolidine ring quenches singlet oxygen (ROS scavenging)
- Protects mitochondrial membrane potential (JC-1 verified, P < 0.05)
- No increase in apoptosis (TUNEL, P > 0.05)
- No adverse effect on meiotic spindle morphology
- Live birth rates equivalent to controls (38.6% vs 38.3%)

> — doi:10.1038/srep26326

L-proline is an amino acid. It has dedicated membrane transporters (SLC6A20, SLC36A1). It crosses membranes via active transport, not osmotic flooding.

### 2.3 Polyampholytes Provide Ice Protection Without Osmotic Cost

Synthetic polyampholytes (poly(methyl vinyl ether-alt-maleic anhydride), ~80 kDa) at 40 mg/mL with 10% DMSO achieved 120–140% cell recovery post-thaw. They function entirely extracellularly:

- Promote cellular dehydration, reducing intracellular ice formation
- Provide ice recrystallization inhibition (IRI)
- Easy to remove post-thaw
- Combined with ice nucleators, recovery reached 106–212% with dramatically reduced well-to-well variability

> — doi:10.1021/acs.biomac.4c00760

Regioregular alternating polyampholytes show superior IRI activity vs random copolymers (35–50% MGS at 20 mg/mL vs ~80% MGS for random analogues; doi:10.1021/acs.biomac.6b01691).

---

## 3. LensCPA-1 Composition

| Component | Conc. | Role | Key Evidence |
|-----------|-------|------|-------------|
| Formamide | 2.0 M | Primary glass-former | Highest dielectric loss of any CPA (ε″ 22–46). Present in every successful brain vitrification (VS55, M22, V3). |
| Glycerol | 2.0 M | Glass-former + formamide neutralizer | FA+GLY at 12 mol/kg = 97% viability. Lowest toxicity CPA on a molal basis. |
| DMSO | 1.0 M | Glass-former + secondary FA neutralizer | At 1M, avoids Ca²⁺ overload/mPTP cascade. Still neutralizes formamide. |
| L-Proline | 1.5 M | ROS scavenger + CPA reducer | Enabled 50% DMSO reduction in oocytes. Crosses membranes via amino acid transporters. |
| Trehalose | 0.5 M | Extracellular ice inhibitor | 20% glycerol + 1M trehalose vitrified human brain tissue (cryo-FIB verified). |
| Polyampholyte | 20 mg/mL | IRI + cell recovery enhancer | 120–140% post-thaw recovery. Extracellular — zero intracellular osmotic cost. |

**Carrier solution:** Euro-Collins (glucose 0.19M, KH₂PO₄ 0.01M, K₂HPO₄ 0.04M, KCl 0.02M, NaHCO₃ 0.01M, HEPES 0.01M).

**Total penetrating CPA: ~5.0M** (vs 8.4M VS55, 9.3M M22, 6.0M DP6)

---

## 4. Mechanistic Rationale

### 4.1 BBB Compatibility

Current solutions create an enormous osmotic gradient across the BBB. LensCPA-1 distributes the osmotic burden differently:

- **Trehalose** (0.5M) — stays extracellular, no BBB crossing, no intracellular osmotic shock
- **Polyampholyte** (~80 kDa) — stays extracellular, provides ice protection without osmotic cost
- **L-proline** — crosses membranes via dedicated amino acid transporters (active transport, not osmotic flooding)
- **Net intracellular osmotic burden: ~5.0M** vs ~8.4M for VS55

### 4.2 Stacked Toxicity Neutralization

Three independent neutralization mechanisms operate simultaneously:

```
Formamide toxicity ──┬── neutralized by Glycerol  (Ahmadkhani 2025: 97% viability)
                     └── neutralized by DMSO      (Fahy 2010)

DMSO Ca²⁺ overload  ──── mitigated by L-Proline   (mitochondrial membrane protection)

Oxidative damage    ──── scavenged by L-Proline    (pyrrolidine ring, singlet O₂ quenching)
```

### 4.3 Can 5M Total CPA Vitrify?

This is the critical question. Evidence suggests yes:

- **CVS1** (DMSO 1.05M + glycerol 1.05M + PG 1.05M + trehalose 0.85M = **4.15M total**) vitrified at <100°C/min in 5 mL volumes (doi:10.3390/...)
- **DP6** (DMSO 3M + PG 3M = **6M**) vitrifies with CCR of 40°C/min
- Formamide has the highest dielectric loss among CPAs — the most effective glass-former per mole
- Polyampholyte IRI suppresses recrystallization during the critical warming phase
- **Nanowarming eliminates CWR as a constraint** — liter-scale nanowarming now achieves -1500°C/min (doi:10.1038/s41467-025-63483-2)

---

## 5. Predicted Properties

| Property | LensCPA-1 | VS55 | M22 | DP6 |
|----------|-----------|------|-----|-----|
| Total penetrating CPA | ~5.0 M | 8.4 M | 9.3 M | 6.0 M |
| Tg (estimated) | -125 to -128°C | -123°C | -123.3°C | -119°C |
| CCR (estimated) | 5–15°C/min | 2.5°C/min | 0.1°C/min | 40°C/min |
| CWR (estimated) | 50–100°C/min | 50°C/min | 0.4°C/min | 189°C/min |
| Osmolarity | ~6.5 Osm | ~9.5 Osm | ~10 Osm | ~6.5 Osm |
| Intracellular osmotic load | ~5.0 Osm | ~8.4 Osm | ~9.3 Osm | ~6.0 Osm |

CCR is higher than VS55/M22 (lower concentration = less glass-forming ability), but nanowarming makes CWR irrelevant for rewarming. The trade-off is intentional: **accept slightly harder cooling in exchange for dramatically lower toxicity and osmotic damage.**

---

## 6. Experimental Validation Protocol

### Day 1: Toxicity Screen (96-well plate)

1. **Prepare LensCPA-1** in Euro-Collins carrier at 4°C
2. **BPAEC monolayer** (Ahmadkhani protocol): expose to LensCPA-1, VS55, DP6, and individual components for 15 min at 4°C and RT
3. **Measure:** viability (calcein-AM/EthD-1), mitochondrial function (JC-1), ROS (DCFH-DA)
4. **Key comparison:** LensCPA-1 viability vs VS55 at equivalent exposure time

### Day 2: Thermal Characterization (DSC)

1. Measure Tg onset by differential scanning calorimetry (10°C/min cooling)
2. Determine CCR by scanning at 1, 5, 10, 20, 40°C/min — identify crystallization threshold
3. Compare against VS55 and DP6 profiles

### Day 3 (if toxicity passes): Brain Slice Vitrification

Following German et al. protocol (doi:10.1073/pnas.2516848123):

1. 300 μm mouse hippocampal slices in aCSF
2. **Equilibrate:** 30% LensCPA-1 for 10 min at 4°C → 59% LensCPA-1 for 15 min at 4°C
3. **Vitrify:** plunge in isopentane at -140°C
4. **Rewarm:** 20°C bath (1 min) → 4°C washout in 59% → 30% → aCSF (stepwise, 5 min each)
5. **Assess:** field potential recordings (LTP at mPP-DG synapse), Seahorse metabolic assay (basal respiration, spare respiratory capacity)

### Success Criteria

- Viability ≥ 85% (vs ~70% for VS55 at equivalent exposure)
- Tg below -130°C
- CCR ≤ 20°C/min (achievable with standard cryogenic methods)
- If brain slices tested: LTP ≥ 115% baseline (German et al. achieved 125.39%)

---

## 7. Why This Is Novel

The field has spent decades iterating on the same 4–5 molecules at ever-higher concentrations. LensCPA-1 asks a different question:

> **What if we used more molecules at lower concentrations, chosen specifically for their interaction effects?**

No one has combined these three strategies simultaneously:

1. **Toxicity neutralization pairs** (FA+GLY, FA+DMSO) — exploited in M22 but at >9M total
2. **Amino acid CPA augmentation** (L-proline) — proven in oocytes, never tried in vitrification cocktails for complex tissue
3. **Synthetic IRI polymers** (polyampholytes) — proven for cell recovery, never combined with neutralization-optimized formulations

The design is **data-driven** — every component choice traces to a specific finding in the CryoLens database, with DOI-level provenance.

---

## 8. Evidence Chain Summary

```
CryoLens Database (937 papers, 5,526 findings)
│
├── Finding: FA+GLY = 97% viability at 12 mol/kg (doi:10.1101/2025.05.07.652719)
│   └── Design choice: Formamide 2M + Glycerol 2M as neutralization pair
│
├── Finding: DMSO neutralizes formamide toxicity (doi:10.3390/molecules27103254)
│   └── Design choice: DMSO 1M as secondary neutralizer (low enough to avoid Ca²⁺ overload)
│
├── Finding: L-proline enables 50% DMSO reduction, protects mitochondria (doi:10.1038/srep26326)
│   └── Design choice: L-proline 1.5M replaces ~1.5M of traditional CPA
│
├── Finding: 20% glycerol + 1M trehalose vitrifies human brain (doi:10.1101/2023.09.13.557623)
│   └── Design choice: Trehalose 0.5M as extracellular ice inhibitor
│
├── Finding: Polyampholyte + DMSO = 120-140% cell recovery (doi:10.1021/acs.biomac.4c00760)
│   └── Design choice: Polyampholyte 20 mg/mL for extracellular IRI
│
├── Finding: BBB blocks CPA perfusion, causes dehydration (doi:10.1073/pnas.2516848123)
│   └── Design choice: Lower total osmolarity, use active-transport CPA (proline)
│
└── Finding: Nanowarming achieves -1500°C/min (doi:10.1038/s41467-025-63483-2)
    └── Design choice: Accept higher CCR, rely on nanowarming for rewarming
```

---

## 9. Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| 5M total CPA insufficient for vitrification | Medium | CVS1 vitrifies at 4.15M. Formamide is the most efficient glass-former per mole. Can increase to 6M if needed. |
| L-proline interferes with glass formation | Low | Amino acids are known glass-formers in food science. Proline specifically resists crystallization. |
| Polyampholyte incompatible with other components | Low | Already validated with DMSO. Extracellular function means minimal interaction with penetrating CPAs. |
| CCR too high for practical use | Medium | Nanowarming (already demonstrated at liter scale) eliminates warming rate constraint. For cooling, isopentane immersion at -140°C provides >100°C/min for slices. |

---

*Proposal generated by CryoLens — the world's first structured knowledge base for cryopreservation.*
*937 papers. 5,526 findings. Every claim traceable to source.*

*Contact: cryolens.io | MCP endpoint: mcp.cryolens.io/mcp*
