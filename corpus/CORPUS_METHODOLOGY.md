# CryoLens Corpus: Methodology & Provenance

## Summary

**1,759 open-access cryobiology PDFs** collected systematically from 5 sources, covering 40+ years of literature. Every paper has full metadata (title, DOI, authors, abstract, year, journal) and a documented acquisition source for reproducibility.

| Metric | Value |
|--------|-------|
| Total PDFs | 1,759 |
| Total size | 5.4 GB |
| Papers catalogued (with metadata) | 15,732 |
| Metadata completeness (title) | 100% |
| Metadata completeness (DOI) | 99.4% |
| Metadata completeness (abstract) | 99.1% |
| Relevance verification | 100% (cryo terms in title/abstract) |
| Date range | 1983–2026 |

---

## Phase 1: Paper Discovery

### Method

We searched PubMed using NCBI E-utilities (`esearch.fcgi`) with 40+ queries across 12 categories, each returning up to 500 results ranked by relevance. This produced a union of all unique PMIDs.

### Search Categories & Queries

| Category | Example Queries | Unique PMIDs |
|----------|----------------|-------------|
| `organ_tissue` | "brain cryopreservation vitrification", "oocyte vitrification cryopreservation", "hepatocyte cryopreservation" (16 queries) | 5,708 |
| `specific_cpa` | "DMSO cryopreservation concentration", "ethylene glycol vitrification", "glycerol cryopreservation" (7 queries) | 2,730 |
| `engineering` | "controlled rate freezing", "cryopreservation protocol optimization" (5 queries) | 2,483 |
| `core_cryo` | "cryopreservation vitrification", "vitrification solution protocol" (4 queries) | 1,946 |
| `toxicity` | "cryoprotectant toxicity cytotoxicity", "CPA toxicity screening" (4 queries) | 1,462 |
| `reviews` | "cryopreservation vitrification review", "cryobiology review advances" (4 queries) | 1,217 |
| `biophysics` | "membrane permeability cryoprotectant", "osmotic tolerance cryopreservation" (4 queries) | 1,186 |
| `novel` | "antifreeze protein cryopreservation", "isochoric cryopreservation" (6 queries) | 936 |
| `thermal` | "glass transition temperature cryoprotectant", "critical cooling rate vitrification" (5 queries) | 898 |
| `cryonics` | "whole body cryopreservation", "brain preservation vitrification" (5 queries) | 792 |
| `nanowarming` | "nanowarming cryopreservation", "magnetic nanoparticle rewarming" (3 queries) | 189 |
| `formulations` | "VS55 vitrification solution", "M22 vitrification", "DP6 cryoprotectant" (7 queries) | 178 |

**Total unique PMIDs discovered: 14,558**

We additionally searched EuropePMC for preprints using queries:
- `(SRC:PPR) AND (cryopreservation OR vitrification OR cryoprotectant)`
- `(SRC:PPR) AND (cryobiology OR nanowarming OR devitrification)`
- `(SRC:PPR) AND ("glass transition" AND (freezing OR preservation))`
- `(SRC:PPR) AND ("organ preservation" AND (cooling OR warming))`

**Preprints discovered: 1,358** (from bioRxiv, medRxiv, Research Square)

### Metadata Acquisition

For PubMed papers: fetched via NCBI E-utilities `efetch.fcgi` in batches of 100, parsing PubmedArticle XML blocks to extract PMID, title, abstract, journal, year, DOI, PMC ID, authors, and MeSH terms.

For preprints: fetched via EuropePMC REST API (`/search` endpoint with `resultType=core`), extracting title, abstract, authors, year, DOI, and source.

---

## Phase 2: Relevance Filtering

### Method

Every paper was checked for cryobiology relevance by scanning its title and abstract for domain-specific terms:

```
cryo, vitrif, freez, thaw, preserv, glass transition, cryoprotect, dmso,
glycerol, warming, cooling rate, ice, cold storage, hypotherm, supercool,
devitrif, nanowarming, antifreeze, organ preservation
```

Papers with zero matches in both title and abstract were excluded from download.

### Results

- 11,629 of 14,558 PubMed papers passed relevance filter (79.9%)
- ~2,900 papers excluded as off-topic (e.g., drug delivery, general toxicology, non-cryo glycerol uses)
- All downloaded PDFs were re-verified post-download; 46 irrelevant PDFs were removed
- 456 preprints removed after metadata verification showed no cryo relevance
- 344 preprints removed as unverifiable (no metadata available from EuropePMC)

---

## Phase 3: PDF Acquisition

### Sources (in priority order)

PDFs were downloaded using 5 strategies applied in cascade — for each paper, we tried each source in order and stopped at the first success.

#### Source 1: PMC Open Access Archive (683 PDFs)

- **What:** NCBI's official open-access subset of PubMed Central
- **How:** Used the PMC OA file list (`oa_file_list.csv`, ~100MB, 7.7M entries) mapping PMC IDs to FTP tar.gz archives. For each paper with a PMC ID in the OA index, downloaded the tar.gz from `https://ftp.ncbi.nlm.nih.gov/pub/pmc/{ftp_path}`, extracted the PDF in memory.
- **Evidence chain:** `PubMed search → PMID → PMC ID → OA file list lookup → NCBI FTP tar.gz → extracted PDF`
- **Coverage:** 1,818 of 3,079 PMC papers were in the OA index (59%). The remainder are in PMC but under restrictive licenses.

#### Source 2: Unpaywall (682 PDFs)

- **What:** Database of legal open-access copies of scholarly articles, queried by DOI
- **How:** For each paper with a DOI but no PDF yet, queried `https://api.unpaywall.org/v2/{doi}?email=cryolens@hackathon.dev`. If `is_oa=true`, downloaded the PDF from the `url_for_pdf` in the best OA location (author manuscripts, institutional repositories, publisher OA versions).
- **Evidence chain:** `PMID → DOI → Unpaywall API → OA location URL → PDF`
- **Coverage:** ~682 hits from ~9,000 DOI lookups (~7.6% hit rate). Most paywalled papers (especially Elsevier's *Cryobiology* journal) had no OA copies.

#### Source 3: Preprint Servers (368 PDFs)

- **What:** bioRxiv, medRxiv, and Research Square preprints
- **How:** Discovered via EuropePMC search (see Phase 1). Downloaded directly from preprint server URLs: `https://www.biorxiv.org/content/{doi}v1.full.pdf` or `https://www.medrxiv.org/content/{doi}v1.full.pdf`. Metadata verified via EuropePMC DOI lookup post-download.
- **Evidence chain:** `EuropePMC search (SRC:PPR) → DOI → preprint server direct URL → PDF`
- **Coverage:** 1,168 PDFs initially downloaded from 1,358 discovered. After metadata verification and relevance filtering, 368 retained.

#### Source 4: Semantic Scholar (13 PDFs)

- **What:** Semantic Scholar's open-access PDF index
- **How:** Queried `https://api.semanticscholar.org/graph/v1/paper/PMID:{id}?fields=openAccessPdf`. If an OA PDF URL was returned, downloaded it.
- **Evidence chain:** `PMID → Semantic Scholar API → OA PDF URL → PDF`
- **Coverage:** 13 hits. Largely overlapped with PMC OA and Unpaywall results.

#### Source 5: Grey Literature (3 PDFs)

Manually sourced from organizations not indexed by PubMed:

| Document | Source | URL |
|----------|--------|-----|
| Cryopreservation of rat hippocampal slices by vitrification (Pichugin, Fahy & Morin, 2006) | 21st Century Medicine website | `https://www.21cm.com/pdfs/hippo_published.pdf` |
| Vitrifying the Connectomic Self (Hayworth, 2018) | Brain Preservation Foundation | `brainpreservation.org/wp-content/uploads/2018/02/vitrifyingtheconnectomicself_hayworth.pdf` |
| Biostasis: A Roadmap for Research (McKenzie, Wowk, Kendziorra et al., 2024) | Manual download (MDPI Brain Sciences) | DOI: `10.3390/brainsci14090942` |

### Download Performance

All downloads were parallelized using Python `concurrent.futures.ThreadPoolExecutor` with 20 worker threads, each with its own `requests.Session` and retry logic (3 retries, exponential backoff for 429/5xx errors).

| Phase | Papers Processed | PDFs Downloaded | Time |
|-------|-----------------|----------------|------|
| PMC OA + EuropePMC (first run, 974 papers) | 974 | 226 | ~25 min |
| PMC OA + Unpaywall (expanded, 11,392 papers) | 11,392 | 1,150 | 18.6 min |
| Preprints (1,358 papers) | 1,358 | 1,168 | ~8 min |
| EuropePMC + Semantic Scholar (remaining) | 4,150 | 1 | killed (dead end) |

---

## Phase 4: Quality Assurance

### PDF Validation
- Every downloaded file checked for `%PDF-` magic bytes and minimum size >5KB
- Files not starting with PDF header were rejected

### Relevance Verification
- All 1,759 PDFs verified to have cryobiology terms in title or abstract
- 46 off-topic PDFs removed (e.g., drug delivery, general toxicology)
- 456 preprints removed after metadata showed no cryo relevance
- 344 preprints removed as unverifiable (no metadata from EuropePMC)

### Metadata Completeness
- 100% have title, year, and pdf_source
- 99.4% have DOI
- 99.1% have abstract
- 99.9% have authors

---

## Final Corpus Composition

### By Acquisition Source

| Source | Count | % |
|--------|-------|---|
| PMC Open Access | 683 | 38.8% |
| Unpaywall | 682 | 38.8% |
| Preprint servers | 368 | 20.9% |
| Semantic Scholar | 13 | 0.7% |
| Legacy downloads | 10 | 0.6% |
| Grey literature | 3 | 0.2% |
| **Total** | **1,759** | **100%** |

### By Decade

| Decade | Count |
|--------|-------|
| 1980s | 5 |
| 1990s | 18 |
| 2000s | 82 |
| 2010s | 556 |
| 2020s | 1,092 |

### Top 15 Journals

| Count | Journal |
|-------|---------|
| 366 | bioRxiv |
| 139 | Scientific Reports |
| 130 | PLoS ONE |
| 59 | Journal of Reproduction and Development |
| 38 | Reproductive Biology and Endocrinology |
| 33 | International Journal of Molecular Sciences |
| 32 | Journal of Assisted Reproduction and Genetics |
| 26 | Journal of Ovarian Research |
| 25 | Stem Cell Research & Therapy |
| 24 | Frontiers in Endocrinology |
| 16 | Nature Communications |
| 15 | JBRA Assisted Reproduction |
| 15 | Plants |
| 14 | Cell and Tissue Banking |
| 13 | Human Reproduction |

---

## What We Could NOT Get

~10,000 relevant papers are behind paywalls with no open-access copies. The biggest gaps:

| Journal | Papers Missing | Publisher |
|---------|---------------|-----------|
| Cryobiology | ~1,300 | Elsevier |
| Theriogenology | ~400 | Elsevier |
| Fertility and Sterility | ~215 | Elsevier |
| Human Reproduction | ~200 | Oxford |
| Methods in Molecular Biology | ~200 | Springer |

Key paywalled papers include several foundational 21st Century Medicine publications by Fahy et al. (organ vitrification, M22 design, aldehyde-stabilized cryopreservation).

---

## Reproducibility

### Code

All acquisition code is in `corpus/download_parallel.py`. To reproduce:

```bash
# 1. Install dependencies
uv pip install requests

# 2. Run discovery (PubMed search, ~15 min)
uv run python corpus/download_all.py --discover

# 3. Download PDFs in parallel (~20 min)
uv run python corpus/download_parallel.py --workers 20

# 4. Check results
uv run python corpus/download_parallel.py --stats
```

### Data Files

| File | Description |
|------|-------------|
| `corpus/manifest.json` | Master manifest: every paper's metadata + PDF path + source |
| `corpus/all_pmids.json` | All discovered PMIDs with search category tags |
| `corpus/pmc_oa_index.json` | PMC Open Access file list (7.7M entries, cached) |
| `corpus/papers/*.pdf` | Downloaded PDFs |
| `corpus/download_parallel.py` | Parallel download script |

### Manifest Schema

Each paper in `manifest.json` has:

```json
{
  "pmid": "35276219",
  "title": "Paper title",
  "abstract": "Abstract text (truncated to 500 chars)",
  "journal": "Journal Name",
  "year": 2022,
  "doi": "10.1234/example",
  "pmcid": "PMC10202161",
  "authors": ["Author A", "Author B"],
  "mesh_terms": ["Cryopreservation", "Vitrification"],
  "tags": ["core_cryo", "thermal"],
  "pdf_path": "/absolute/path/to/paper.pdf",
  "pdf_source": "pmc_oa",
  "status": "downloaded"
}
```

The `pdf_source` field documents exactly how each PDF was obtained:
- `pmc_oa` — NCBI PMC Open Access FTP archive
- `unpaywall` — Legal OA copy found via Unpaywall API
- `preprint_direct` — Downloaded from bioRxiv/medRxiv/Research Square
- `semantic_scholar` — OA PDF found via Semantic Scholar API
- `grey_literature_*` — Direct download from organization website
- `manual_download` — Manually sourced

---

*Corpus built during Defeating Entropy Hackathon, March 21-22, 2026, London.*
