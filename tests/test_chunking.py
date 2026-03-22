"""Chunking tests."""

from app.services.chunking import chunk_text


def test_chunk_text_creates_overlapping_segments() -> None:
    """Chunking should preserve overlap across segments."""
    text = "A" * 12 + "B" * 12 + "C" * 12
    chunks = chunk_text(text=text, chunk_size=16, overlap=4)
    assert len(chunks) == 3
    assert chunks[0][-4:] == chunks[1][:4]

