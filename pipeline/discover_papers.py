"""
CryoSight Paper Discovery
Find and download relevant cryopreservation papers for extraction.

Strategies:
1. PubMed API (free, open) - search + get full text for PMC papers
2. arXiv API (free, open) - search + download PDFs
3. Edison Scientific API (hackathon credits) - literature search via PaperQA3

Usage:
    python discover_papers.py --search "vitrification CPA formulation" --max 20
    python discover_papers.py --pmids 35276219,23031603 --download
    python discover_papers.py --arxiv "cryoprotectant optimization" --download
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

# ============================================================
# PubMed / PMC via E-utilities (free, no API key needed)
# ============================================================

def search_pubmed(query: str, max_results: int = 20) -> list:
    """Search PubMed and return PMIDs."""
    try:
        import requests
    except ImportError:
        os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
        import requests

    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json",
        "sort": "relevance"
    }
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()
    pmids = data.get("esearchresult", {}).get("idlist", [])
    print(f"Found {len(pmids)} papers for: {query}")
    return pmids


def get_pubmed_metadata(pmids: list) -> list:
    """Get metadata for a list of PMIDs."""
    try:
        import requests
    except ImportError:
        os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
        import requests

    if not pmids:
        return []

    url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    params = {
        "db": "pubmed",
        "id": ",".join(str(p) for p in pmids),
        "retmode": "json"
    }
    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for pmid in pmids:
        entry = data.get("result", {}).get(str(pmid), {})
        if entry:
            results.append({
                "pmid": pmid,
                "title": entry.get("title", ""),
                "authors": [a.get("name", "") for a in entry.get("authors", [])],
                "journal": entry.get("source", ""),
                "year": entry.get("pubdate", "")[:4],
                "doi": next((id_val["value"] for id_val in entry.get("articleids", []) if id_val["idtype"] == "doi"), None),
                "pmcid": next((id_val["value"] for id_val in entry.get("articleids", []) if id_val["idtype"] == "pmc"), None),
            })
    return results


def get_pmc_fulltext(pmcid: str) -> str:
    """Get full text XML from PMC and extract plain text."""
    try:
        import requests
    except ImportError:
        os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
        import requests

    # Remove "PMC" prefix if present
    pmcid_num = pmcid.replace("PMC", "")
    url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    params = {
        "db": "pmc",
        "id": pmcid_num,
        "rettype": "xml"
    }
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        print(f"  Warning: Could not fetch PMC{pmcid_num}: HTTP {resp.status_code}")
        return None

    # Basic XML text extraction (strip tags)
    import re
    text = re.sub(r'<[^>]+>', ' ', resp.text)
    text = re.sub(r'\s+', ' ', text).strip()

    if len(text) < 500:
        print(f"  Warning: PMC{pmcid_num} returned very short text ({len(text)} chars)")
        return None

    print(f"  Got full text for PMC{pmcid_num}: {len(text)} chars")
    return text


def download_pmc_pdf(pmcid: str, output_dir: str = "./papers/") -> str:
    """Try to download PDF from PMC."""
    try:
        import requests
    except ImportError:
        os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
        import requests

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    pmcid_num = pmcid.replace("PMC", "")

    # Try OA service first
    oa_url = f"https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=PMC{pmcid_num}"
    resp = requests.get(oa_url)
    if resp.status_code == 200 and "pdf" in resp.text.lower():
        # Parse PDF link from XML response
        import re
        pdf_match = re.search(r'href="(https?://[^"]+\.pdf)"', resp.text)
        if pdf_match:
            pdf_url = pdf_match.group(1)
            pdf_resp = requests.get(pdf_url)
            if pdf_resp.status_code == 200:
                output_path = os.path.join(output_dir, f"PMC{pmcid_num}.pdf")
                with open(output_path, "wb") as f:
                    f.write(pdf_resp.content)
                print(f"  Downloaded PDF: {output_path}")
                return output_path

    print(f"  PDF not available via OA for PMC{pmcid_num}")
    return None


# ============================================================
# arXiv API (free)
# ============================================================

def search_arxiv(query: str, max_results: int = 10) -> list:
    """Search arXiv and return paper metadata."""
    try:
        import requests
    except ImportError:
        os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
        import requests

    url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max_results,
        "sortBy": "relevance"
    }
    resp = requests.get(url, params=params)
    resp.raise_for_status()

    import re
    entries = re.findall(r'<entry>(.*?)</entry>', resp.text, re.DOTALL)

    results = []
    for entry in entries:
        title = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
        arxiv_id = re.search(r'<id>http://arxiv.org/abs/(.*?)</id>', entry)
        pdf_link = re.search(r'<link.*?type="application/pdf".*?href="(.*?)"', entry)

        results.append({
            "title": title.group(1).strip().replace("\n", " ") if title else "",
            "arxiv_id": arxiv_id.group(1) if arxiv_id else "",
            "pdf_url": pdf_link.group(1) if pdf_link else "",
        })
    print(f"Found {len(results)} arXiv papers for: {query}")
    return results


def download_arxiv_pdf(arxiv_id: str, output_dir: str = "./papers/") -> str:
    """Download PDF from arXiv."""
    try:
        import requests
    except ImportError:
        os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
        import requests

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    resp = requests.get(pdf_url)
    if resp.status_code == 200:
        output_path = os.path.join(output_dir, f"arxiv_{arxiv_id.replace('/', '_')}.pdf")
        with open(output_path, "wb") as f:
            f.write(resp.content)
        print(f"  Downloaded: {output_path}")
        return output_path
    return None


# ============================================================
# Edison Scientific API (hackathon credits)
# ============================================================

def query_edison(question: str, api_key: str = None) -> dict:
    """Query Edison Scientific literature agent."""
    try:
        from edison_client import EdisonClient, JobNames
    except ImportError:
        print("Edison client not installed. Install with: pip install edison-client")
        print("Falling back to direct PubMed/arXiv access.")
        return None

    api_key = api_key or os.environ.get("EDISON_PLATFORM_API_KEY")
    if not api_key:
        print("EDISON_PLATFORM_API_KEY not set")
        return None

    client = EdisonClient(api_key=api_key)
    task_data = {
        "name": JobNames.LITERATURE,
        "query": question,
    }
    response = client.run_tasks_until_done(task_data)
    return response


# ============================================================
# Predefined paper lists for CryoSight
# ============================================================

PRIORITY_PAPERS = [
    # High-value papers with dense CPA data
    {"pmid": "35276219", "pmcid": "PMC10202161", "reason": "Phase diagrams for VS55, M22, DP6"},
    {"pmid": "23031603", "pmcid": "PMC3500404", "reason": "CCR/CWR for 14 common CPAs"},
    {"pmid": "29958001", "pmcid": None, "reason": "Specific heat in VS55, DP6, M22"},
    {"pmid": "28207537", "pmcid": None, "reason": "Nanowarming with magnetic nanoparticles"},
    {"arxiv": "2602.13398", "reason": "Bayesian optimization for CPA cocktails (2026)"},
    # Organ vitrification outcomes
    {"pmid": "19568346", "pmcid": None, "reason": "Renal vitrification (Fahy M22)"},
    # Neural tissue
    {"doi": "10.1101/2025.01.22.634384", "reason": "Hippocampal vitrification functional recovery"},
    # High-throughput screening
    {"doi": "10.1038/s41598-025-85509-x", "reason": "HTS for CPA toxicity"},
    # Comprehensive reviews with data tables
    {"pmcid": "PMC10186587", "reason": "CCR/CWR as function of concentration"},
]

SEARCH_QUERIES = [
    "vitrification cryoprotectant formulation glass transition",
    "critical cooling rate warming rate cryoprotective agent",
    "CPA toxicity screening cryopreservation",
    "organ vitrification M22 VS55 DP6",
    "nanowarming vitrification tissue preservation",
    "cryoprotectant cocktail optimization",
]


def discover_and_download(output_dir: str = "./papers/", max_per_query: int = 10):
    """Run full discovery pipeline."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    all_papers = []

    # 1. Priority papers
    print("=" * 60)
    print("PHASE 1: Priority papers")
    print("=" * 60)
    pmids_to_fetch = [p["pmid"] for p in PRIORITY_PAPERS if p.get("pmid")]
    if pmids_to_fetch:
        metadata = get_pubmed_metadata(pmids_to_fetch)
        for m in metadata:
            m["priority"] = True
            all_papers.append(m)
            print(f"  [{m['pmid']}] {m['title'][:80]}...")

            # Try to get full text
            if m.get("pmcid"):
                text = get_pmc_fulltext(m["pmcid"])
                if text:
                    text_path = os.path.join(output_dir, f"PMC{m['pmcid'].replace('PMC','')}.txt")
                    with open(text_path, "w") as f:
                        f.write(text)
                time.sleep(0.5)  # Be nice to NCBI

    # arXiv priority papers
    for p in PRIORITY_PAPERS:
        if p.get("arxiv"):
            pdf_path = download_arxiv_pdf(p["arxiv"], output_dir)
            all_papers.append({"arxiv_id": p["arxiv"], "reason": p["reason"], "pdf": pdf_path})
            time.sleep(1)

    # 2. Search-based discovery
    print("\n" + "=" * 60)
    print("PHASE 2: Search-based discovery")
    print("=" * 60)
    seen_pmids = set(pmids_to_fetch)
    for query in SEARCH_QUERIES:
        pmids = search_pubmed(query, max_results=max_per_query)
        new_pmids = [p for p in pmids if p not in seen_pmids]
        seen_pmids.update(new_pmids)

        if new_pmids:
            metadata = get_pubmed_metadata(new_pmids)
            for m in metadata:
                all_papers.append(m)
                if m.get("pmcid"):
                    text = get_pmc_fulltext(m["pmcid"])
                    if text:
                        text_path = os.path.join(output_dir, f"PMC{m['pmcid'].replace('PMC','')}.txt")
                        with open(text_path, "w") as f:
                            f.write(text)
                    time.sleep(0.5)
        time.sleep(1)

    # Save manifest
    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump({
            "total_papers": len(all_papers),
            "papers": all_papers
        }, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"Discovery complete: {len(all_papers)} papers found")
    print(f"Manifest saved to: {manifest_path}")
    print(f"Papers saved to: {output_dir}/")

    return all_papers


def main():
    parser = argparse.ArgumentParser(description="CryoSight Paper Discovery")
    parser.add_argument("--search", help="Search query for PubMed")
    parser.add_argument("--arxiv", help="Search query for arXiv")
    parser.add_argument("--pmids", help="Comma-separated PMIDs to fetch")
    parser.add_argument("--discover", action="store_true", help="Run full discovery pipeline")
    parser.add_argument("--output-dir", default="./papers/", help="Output directory")
    parser.add_argument("--max", type=int, default=10, help="Max results per query")
    args = parser.parse_args()

    if args.discover:
        discover_and_download(args.output_dir, args.max)
    elif args.search:
        pmids = search_pubmed(args.search, args.max)
        metadata = get_pubmed_metadata(pmids)
        for m in metadata:
            print(f"  [{m['pmid']}] {m['title'][:80]}... | PMC: {m.get('pmcid', 'N/A')}")
    elif args.arxiv:
        results = search_arxiv(args.arxiv, args.max)
        for r in results:
            print(f"  [{r['arxiv_id']}] {r['title'][:80]}...")
    elif args.pmids:
        pmids = args.pmids.split(",")
        metadata = get_pubmed_metadata(pmids)
        for m in metadata:
            print(json.dumps(m, indent=2))
    else:
        print("Specify --discover, --search, --arxiv, or --pmids")


if __name__ == "__main__":
    main()
