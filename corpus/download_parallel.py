#!/usr/bin/env python3
"""
Parallel PDF downloader for CryoLens corpus.
Downloads from PMC OA, Europe PMC, Unpaywall, and Semantic Scholar concurrently.

Usage:
    uv run python corpus/download_parallel.py                # all sources, 20 workers
    uv run python corpus/download_parallel.py --workers 40   # more parallelism
    uv run python corpus/download_parallel.py --source pmc_oa --workers 30
    uv run python corpus/download_parallel.py --stats        # just show current state
"""

import json
import io
import os
import sys
import tarfile
import time
import argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# ============================================================
# Config
# ============================================================

CORPUS_DIR = Path(__file__).parent
PAPERS_DIR = CORPUS_DIR / "papers"
MANIFEST_PATH = CORPUS_DIR / "manifest.json"
OA_INDEX_PATH = CORPUS_DIR / "pmc_oa_index.json"

PAPERS_DIR.mkdir(parents=True, exist_ok=True)

# Thread-safe manifest writing
_manifest_lock = Lock()
_stats_lock = Lock()


# ============================================================
# Per-thread HTTP sessions (requests.Session is not thread-safe)
# ============================================================

import threading
_thread_local = threading.local()

def get_session():
    if not hasattr(_thread_local, "session"):
        s = requests.Session()
        s.headers.update({"User-Agent": "CryoLens/2.0 (cryobiology-hackathon)"})
        retry = Retry(total=2, backoff_factor=0.5, status_forcelist=[429, 500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=10)
        s.mount("https://", adapter)
        s.mount("http://", adapter)
        _thread_local.session = s
    return _thread_local.session


# ============================================================
# PDF helpers
# ============================================================

def pdf_exists(path):
    p = Path(path)
    return p.exists() and p.stat().st_size > 5000


def download_pdf(url, output_path, timeout=45):
    try:
        resp = get_session().get(url, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200 and len(resp.content) > 5000:
            if resp.content[:5] == b'%PDF-' or b'%PDF' in resp.content[:200]:
                with open(output_path, "wb") as f:
                    f.write(resp.content)
                return True
    except Exception:
        pass
    return False


# ============================================================
# Download strategies (each returns path or None)
# ============================================================

def try_pmc_oa(pmcid, oa_index):
    pmcid_clean = pmcid if pmcid.startswith("PMC") else f"PMC{pmcid}"
    pmcid_num = pmcid_clean.replace("PMC", "")
    output_path = PAPERS_DIR / f"PMC{pmcid_num}.pdf"

    if pdf_exists(output_path):
        return str(output_path), "pmc_oa"

    entry = oa_index.get(pmcid_clean)
    if not entry:
        return None, None

    ftp_path = entry["ftp_path"]
    url = f"https://ftp.ncbi.nlm.nih.gov/pub/pmc/{ftp_path}"

    if ftp_path.endswith(".tar.gz"):
        try:
            resp = get_session().get(url, timeout=90)
            if resp.status_code != 200:
                return None, None
            with tarfile.open(fileobj=io.BytesIO(resp.content), mode="r:gz") as tar:
                for member in tar.getmembers():
                    if member.name.lower().endswith(".pdf"):
                        f = tar.extractfile(member)
                        if f:
                            content = f.read()
                            if len(content) > 5000:
                                with open(output_path, "wb") as out:
                                    out.write(content)
                                return str(output_path), "pmc_oa"
        except Exception:
            pass
    elif ftp_path.endswith(".pdf"):
        if download_pdf(url, output_path):
            return str(output_path), "pmc_oa"

    return None, None


def try_europepmc(pmcid):
    pmcid_num = pmcid.replace("PMC", "")
    output_path = PAPERS_DIR / f"PMC{pmcid_num}.pdf"
    if pdf_exists(output_path):
        return str(output_path), "europepmc"
    url = f"https://europepmc.org/backend/ptpmcrender.fcgi?accid=PMC{pmcid_num}&blobtype=pdf"
    if download_pdf(url, output_path):
        return str(output_path), "europepmc"
    return None, None


def try_unpaywall(doi, paper_id):
    if not doi:
        return None, None
    filename = f"{paper_id.replace('/', '_').replace(':', '_')}.pdf"
    output_path = PAPERS_DIR / filename
    if pdf_exists(output_path):
        return str(output_path), "unpaywall"
    try:
        resp = get_session().get(
            f"https://api.unpaywall.org/v2/{doi}?email=cryolens@hackathon.dev",
            timeout=15,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("is_oa"):
                for loc in [data.get("best_oa_location")] + data.get("oa_locations", []):
                    if loc:
                        pdf_url = loc.get("url_for_pdf")
                        if pdf_url and download_pdf(pdf_url, output_path):
                            return str(output_path), "unpaywall"
    except Exception:
        pass
    return None, None


def try_semantic_scholar(pmid, doi, paper_id):
    s2_id = f"PMID:{pmid}" if pmid else f"DOI:{doi}" if doi else None
    if not s2_id:
        return None, None
    filename = f"{(paper_id or pmid or doi).replace('/', '_').replace(':', '_')}.pdf"
    output_path = PAPERS_DIR / filename
    if pdf_exists(output_path):
        return str(output_path), "semantic_scholar"
    try:
        resp = get_session().get(
            f"https://api.semanticscholar.org/graph/v1/paper/{s2_id}?fields=openAccessPdf",
            timeout=15,
        )
        if resp.status_code == 200:
            oa = resp.json().get("openAccessPdf")
            if oa and oa.get("url"):
                if download_pdf(oa["url"], output_path):
                    return str(output_path), "semantic_scholar"
    except Exception:
        pass
    return None, None


# ============================================================
# Worker function — tries all sources for one paper
# ============================================================

def download_one_paper(pid, paper, oa_index, sources):
    pmcid = paper.get("pmcid", "")
    doi = paper.get("doi", "")
    pmid = paper.get("pmid", pid)

    for source in sources:
        if source == "pmc_oa" and pmcid:
            path, src = try_pmc_oa(pmcid, oa_index)
            if path:
                return pid, path, src

        elif source == "europepmc" and pmcid:
            path, src = try_europepmc(pmcid)
            if path:
                return pid, path, src

        elif source == "unpaywall" and doi:
            path, src = try_unpaywall(doi, pid)
            if path:
                return pid, path, src

        elif source == "semantic_scholar" and (pmid or doi):
            path, src = try_semantic_scholar(pmid, doi, pid)
            if path:
                return pid, path, src

    return pid, None, None


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Parallel PDF downloader")
    parser.add_argument("--workers", type=int, default=20, help="Number of parallel download threads")
    parser.add_argument("--source", nargs="+", default=["pmc_oa", "europepmc", "unpaywall", "semantic_scholar"])
    parser.add_argument("--stats", action="store_true")
    parser.add_argument("--relevant-only", action="store_true", default=True,
                        help="Only download papers with cryo terms in title/abstract")
    args = parser.parse_args()

    # Load manifest
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)
    papers = manifest["papers"]

    if args.stats:
        total_pdfs = sum(1 for p in papers.values() if p.get("pdf_path") and pdf_exists(p["pdf_path"]))
        print(f"Total papers: {len(papers):,}")
        print(f"PDFs on disk: {total_pdfs:,}")
        actual = list(PAPERS_DIR.glob("*.pdf"))
        print(f"PDF files in papers/: {len(actual):,}")
        print(f"Total size: {sum(p.stat().st_size for p in actual) / 1024 / 1024:.0f} MB")
        return

    # Load OA index
    print("Loading PMC OA index...")
    with open(OA_INDEX_PATH) as f:
        oa_index = json.load(f)
    print(f"  {len(oa_index):,} entries")

    # Filter to relevant papers
    cryo_terms = ['cryo', 'vitrif', 'freez', 'thaw', 'preserv', 'glass transition',
                  'cryoprotect', 'dmso', 'glycerol', 'warming', 'cooling rate',
                  'ice', 'cold storage', 'hypotherm', 'supercool', 'devitrif', 'nanowarming']

    # Collect papers needing PDFs
    to_download = []
    already_have = 0
    for pid, paper in papers.items():
        if paper.get("pdf_path") and pdf_exists(paper["pdf_path"]):
            already_have += 1
            continue

        if args.relevant_only:
            title = (paper.get("title") or "").lower()
            abstract = (paper.get("abstract") or "").lower()
            if not any(t in (title + " " + abstract) for t in cryo_terms):
                continue

        to_download.append((pid, paper))

    print(f"\nAlready have: {already_have:,} PDFs")
    print(f"To download:  {len(to_download):,} papers")
    print(f"Workers:      {args.workers}")
    print(f"Sources:      {', '.join(args.source)}")
    print()

    # Parallel download
    downloaded = 0
    failed = 0
    source_counts = {}
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(download_one_paper, pid, paper, oa_index, args.source): pid
            for pid, paper in to_download
        }

        for i, future in enumerate(as_completed(futures)):
            pid, path, source = future.result()

            if path:
                # Update manifest (thread-safe)
                with _manifest_lock:
                    papers[pid]["pdf_path"] = path
                    papers[pid]["pdf_source"] = source
                    papers[pid]["status"] = "downloaded"
                downloaded += 1
                source_counts[source] = source_counts.get(source, 0) + 1
            else:
                failed += 1

            # Progress every 50 papers
            if (i + 1) % 50 == 0 or (i + 1) == len(futures):
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                eta = (len(futures) - i - 1) / rate if rate > 0 else 0
                src_str = " | ".join(f"{s}:{c}" for s, c in sorted(source_counts.items()))
                print(f"  [{i+1:,}/{len(futures):,}] "
                      f"downloaded: {downloaded:,} | failed: {failed:,} | "
                      f"{rate:.1f} papers/sec | ETA: {eta/60:.0f}min | {src_str}")

            # Save manifest every 200 papers
            if (i + 1) % 200 == 0:
                with _manifest_lock:
                    manifest["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
                    with open(MANIFEST_PATH, "w") as f:
                        json.dump(manifest, f, indent=2)

    # Final save
    manifest["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    total_pdfs = sum(1 for p in papers.values() if p.get("pdf_path") and pdf_exists(p["pdf_path"]))
    manifest["stats"] = {
        "total_papers": len(papers),
        "with_pdf": total_pdfs,
        "with_any_content": total_pdfs,
    }
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)

    elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"DONE in {elapsed/60:.1f} minutes")
    print(f"  Already had:      {already_have:,}")
    print(f"  Newly downloaded:  {downloaded:,}")
    print(f"  Failed:            {failed:,}")
    print(f"  TOTAL PDFs:        {total_pdfs:,}")
    print(f"\n  By source:")
    for src, count in sorted(source_counts.items(), key=lambda x: -x[1]):
        print(f"    {src:20s}: {count:,}")


if __name__ == "__main__":
    main()
