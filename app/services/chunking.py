"""
TEXT CHUNKING
=============
Purpose

Split document text into stable overlapping chunks for future embedding and
retrieval work.

KEY CONCEPTS:
- deterministic chunking is good enough for the scaffold
- overlap preserves some local context for later vector search

USAGE:
- call `chunk_text()` during ingestion before persistence

MEMORY REFERENCES:
- MEM-0001
"""


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Split text into overlapping character chunks."""
    cleaned = " ".join(text.split())
    if not cleaned:
        return []
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive.")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be non-negative and smaller than chunk_size.")

    chunks: list[str] = []
    start = 0
    step = chunk_size - overlap
    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        chunks.append(cleaned[start:end].strip())
        if end >= len(cleaned):
            break
        start += step
    return chunks

