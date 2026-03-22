# CryoLens Extraction Pipeline — Tracker & Guidance

## Current Status

| Metric | Count | Updated |
|--------|-------|---------|
| **Total papers in corpus** | 1,759 | baseline |
| **Papers extracted** | 537 | session 4 |
| **Papers remaining** | ~1,222 | session 4 |
| **Progress** | 30.5% | session 4 |

---

## Checkpoint Log

### Baseline (pre-pipeline, session 3 end)

| Metric | Value |
|--------|-------|
| Papers extracted | 379 |
| Findings | 3,080 |
| Tags | 19,840 |
| Formulations (total) | 336 |
| Formulations with components | 35 (10.4%) |
| Compounds | 61 |
| Avg findings/paper | 8.2 |
| Avg tags/finding | 6.6 |
| Confidence: high | 94.8% |
| Confidence: medium | 5.2% |
| Orphan findings | 0 |
| Orphan tags | 0 |
| Duplicate findings | 1 |
| Empty claims | 0 |
| Papers with 0 findings | 4 |

**Known issues at baseline:**
- 89.6% of formulations have no components (agents skipped `formulation_components` step)
- Tag normalization inconsistencies (e.g., `slow-freezing` vs `slow_freezing` vs `slow freezing`)
- Fixed in EXTRACTION_SKILL.md for all future agents

---

### Session 4 — 100-paper review (at 479 papers)

| Metric | Value |
|--------|-------|
| Papers extracted | 479 |
| Findings | 4,012 |
| Formulations with components | 91 (new ones: 100%) |
| Avg findings/paper (new batch) | 9.4 |
| Min findings/paper | 6 |
| Confidence: high | 97.5% |
| Confidence: medium | 2.5% |
| Orphan findings | 0 |
| Orphan tags | 0 |
| Duplicate claims | 1 |
| Empty claims | 0 |
| Tag normalization | Fixed 460 inconsistencies |
| **Result** | **ALL CHECKS PASS** |

**Action taken:** Tag normalization SQL applied. Continued extraction.

---

### Session 4 end — at 537 papers (+158 new)

| Metric | Value |
|--------|-------|
| Papers extracted | 537 |
| Findings | 4,277 |
| Tags | ~27,000 |
| Formulations (total) | 412 |
| Formulation components | 273 |
| Queue indices processed | 0-159 |
| Batches completed | 8 (20 agents each) |
| Missing PDF rate | ~20% in older papers (indices 100+) |

**Issues found:**
- Many older papers (2000-2016) have missing PDFs — PMID-based filenames not in corpus
- 2-3 agents fabricated findings from memory when PDF missing (violated extraction rules)
- Queue generation needs PDF existence check

**Action taken:**
- Updated MEMORY.md with missing PDF issue
- Noted need for `os.path.exists()` filter in queue generation
- Added stricter "PDF not found → STOP" guidance for next session

---

### Checkpoint 1 — at 600 papers (after ~200 new extractions)

| Metric | Value |
|--------|-------|
| Papers extracted | |
| Findings | |
| Formulations with components | |
| Avg findings/paper (new batch) | |
| Avg tags/finding (new batch) | |
| New issues found | |
| Action taken | |

---

### Checkpoint 2 — at 800 papers

| Metric | Value |
|--------|-------|
| Papers extracted | |
| Findings | |
| Formulations with components | |
| New issues found | |
| Action taken | |

---

### Checkpoint 3 — at 1,000 papers

| Metric | Value |
|--------|-------|
| Papers extracted | |
| Findings | |
| Formulations with components | |
| New issues found | |
| Action taken | |

---

### Checkpoint 4 — at 1,200 papers

| Metric | Value |
|--------|-------|
| Papers extracted | |
| Findings | |
| Formulations with components | |
| New issues found | |
| Action taken | |

---

### Checkpoint 5 — at 1,400 papers

| Metric | Value |
|--------|-------|
| Papers extracted | |
| Findings | |
| Formulations with components | |
| New issues found | |
| Action taken | |

---

### Checkpoint 6 — at 1,600 papers

| Metric | Value |
|--------|-------|
| Papers extracted | |
| Findings | |
| Formulations with components | |
| New issues found | |
| Action taken | |

---

### Checkpoint 7 — at 1,759 papers (COMPLETE)

| Metric | Value |
|--------|-------|
| Papers extracted | |
| Findings | |
| Formulations with components | |
| Final review | |

---

## Review Procedure (every 200 papers)

When a checkpoint is reached, run the following review before continuing.

### 1. Quantity Check

```sql
SELECT 'papers' as tbl, COUNT(*) FROM papers
UNION ALL SELECT 'findings', COUNT(*) FROM findings
UNION ALL SELECT 'tags', COUNT(*) FROM finding_tags
UNION ALL SELECT 'formulations', COUNT(*) FROM formulations
UNION ALL SELECT 'formulation_components', COUNT(*) FROM formulation_components;

SELECT ROUND(AVG(cnt), 1) as avg, MIN(cnt) as min, MAX(cnt) as max
FROM (SELECT paper_doi, COUNT(*) as cnt FROM findings WHERE id > LAST_CHECKPOINT_MAX_ID GROUP BY paper_doi) sub;
```

**Pass criteria:** Avg findings/paper: 5-10, Min: ≥1, Avg tags/finding: 4-8

### 2. Quality Spot-Check

```sql
SELECT f.id, f.category, f.confidence, LEFT(f.claim, 150), f.source_location, p.title
FROM findings f JOIN papers p ON p.doi = f.paper_doi
WHERE f.id > LAST_CHECKPOINT_MAX_ID ORDER BY RANDOM() LIMIT 5;
```

### 3. Formulation Check — ≥80% of new formulations should have components

### 4. Integrity Check — 0 orphans, 0 empty claims, <5 duplicates

### 5. Tag Normalization Check

```sql
DELETE FROM finding_tags WHERE tag IN ('slow_freezing', 'slow freezing') AND finding_id IN (SELECT finding_id FROM finding_tags WHERE tag = 'slow-freezing');
UPDATE finding_tags SET tag = 'slow-freezing' WHERE tag IN ('slow_freezing', 'slow freezing');
-- repeat for ethylene-glycol, cooling-rate, ovarian-tissue, propylene-glycol
```

### 6. Decision: All pass → continue. Issues → fix before next batch.

---

## Operational Guidance

### Queue Generation (UPDATED: now checks PDF existence)

```python
import json, subprocess, os

processed = set(subprocess.run(['psql','-d','cryosight','-t','-A','-c','SELECT doi FROM papers;'], capture_output=True, text=True).stdout.strip().split('\n'))

with open('corpus/manifest.json') as f:
    manifest = json.load(f)

keywords = ['vitrif','cryoprotect','CPA','glass transition','nanowarming','cryopreserv','devitrif','ice nucleat','supercool','rewarming','organ preserv','tissue preserv','cell preserv','freez','thaw','cooling rate','warming rate','osmotic','membrane permeab','DMSO','glycerol','ethylene glycol','propylene glycol','trehalose','antifreeze','ice block','cryobiol','hypotherm','cold storage','oocyte','embryo','sperm','ovarian','hepatocyte','stem cell','isochoric','VS55','M22','DP6','critical cooling','aldehyde','connectom','brain preserv','whole body']

queue = []
for pmid, paper in manifest['papers'].items():
    doi = paper.get('doi', '')
    if not doi or doi in processed or not paper.get('pdf_path'):
        continue
    # CRITICAL: Check PDF exists on disk
    pdf = paper['pdf_path']
    if not pdf.startswith('/'):
        pdf = '/Users/yc/Workspace/cryo-hack/' + pdf
    if not os.path.exists(pdf):
        continue  # Skip missing PDFs
    text = (paper.get('title', '') + ' ' + paper.get('abstract', '')).lower()
    score = sum(1 for kw in keywords if kw.lower() in text)
    if score > 0:
        queue.append({'doi': doi, 'title': paper['title'], 'pdf_path': pdf, 'score': score, 'year': paper.get('year', 0), 'journal': paper.get('journal', ''), 'authors': paper.get('authors', [])})

queue.sort(key=lambda x: x['score'], reverse=True)
with open('/tmp/unprocessed_papers.json', 'w') as f:
    json.dump(queue, f, indent=2)
print(f"Queue: {len(queue)} papers (with PDF on disk)")
```

### Agent Prompt Template

```
You are a cryobiology data extraction agent. Read the PDF and insert structured data into PostgreSQL database `cryosight` via `psql -d cryosight -c "SQL"`.

CRITICAL: If the PDF file does not exist or cannot be read, INSERT the paper row ONLY and STOP. Do NOT extract findings from memory.

[... rest of skill prompt ...]
```

### Batch Size: 20 agents, all parallel, continuous launching

---

## Batch Log

| Batch | Papers (from→to) | Agents | Findings Added | Issues | Session |
|-------|-------------------|--------|----------------|--------|---------|
| 1-18 (old) | 0→379 | 269 | 3,080 | Formulation components missing | Sessions 1-3 |
| B1-test | 379→384 | 5 | 43 | None (skill doc validated) | Session 4 |
| B1-full | 384→404 | 20 | 185 | None | Session 4 |
| B2 | 404→424 | 20 | 186 | None | Session 4 |
| B3 | 424→444 | 20 | 187 | None | Session 4 |
| B4 | 444→464 | 20 | 196 | None | Session 4 |
| B5 | 464→479 | 15 | 135 | 1 PDF was appendix only | Session 4 |
| B6 | 479→499 | 20 | ~180 | 1 non-cryo paper (drug absorbability) | Session 4 |
| B7 | 499→519 | 20 | ~120 | ~12 missing PDFs, 2-3 fabricated from memory | Session 4 |
| B8 | 519→537 | 20 | ~130 | ~14 missing PDFs, some fabrication | Session 4 |

---

## Backlog: Known Issues to Fix

1. **301 empty formulations** from sessions 1-3 — need a targeted "fill components" pass
2. **~34 papers with 0 findings** — mostly missing PDFs; some non-cryo papers
3. **2-3 agents fabricated from memory** when PDF missing — add stricter STOP rule
4. **Queue needs PDF existence filter** — many older PMID-based papers not in corpus

---

*Document created: 2026-03-22 | Last updated: Session 4 end | CryoLens Hackathon*
