"""Simple, dependency-light document chunker. Splits by sentence boundaries and
regroups into ~max_tokens-sized chunks (approximated by whitespace word count,
which is good enough for the short policy documents used here — swap in a
tokenizer-aware splitter such as `tiktoken` for larger corpora)."""
import re


def chunk_text(text: str, max_words: int = 120, overlap_words: int = 20) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for sentence in sentences:
        words = sentence.split()
        if current_len + len(words) > max_words and current:
            chunks.append(" ".join(current))
            # keep a small overlap for context continuity across chunks
            overlap = current[-overlap_words:] if overlap_words < len(current) else current
            current = list(overlap)
            current_len = len(current)
        current.extend(words)
        current_len += len(words)

    if current:
        chunks.append(" ".join(current))

    return chunks
