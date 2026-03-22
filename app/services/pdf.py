"""
PDF EXTRACTION
==============
Purpose

Extract raw text from uploaded PDF files for downstream chunking and
normalization.

KEY CONCEPTS:
- PDF parsing is intentionally narrow in the scaffold
- richer OCR/unstructured handling can be layered in later

USAGE:
- call `extract_text_from_pdf()` from the ingestion service

MEMORY REFERENCES:
- MEM-0001
"""

from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract readable text from a PDF byte payload."""
    reader = PdfReader(BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n\n".join(page.strip() for page in pages if page.strip())
    if not text:
        raise ValueError("No extractable text was found in the PDF.")
    return text

