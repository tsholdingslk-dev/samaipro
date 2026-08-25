"""
SAM AI - Document Chunker
Splits documents into semantically meaningful chunks for embedding and retrieval.
"""

import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class DocumentChunk:
    text: str
    metadata: Dict
    chunk_index: int
    token_count: int


class DocumentChunker:
    def __init__(self, chunk_size: int = 500, overlap: int = 100, min_chunk_size: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.min_chunk_size = min_chunk_size

    def _estimate_tokens(self, text: str) -> int:
        return len(text.split())

    def chunk_text(self, text: str, source: str = "unknown", doc_id: str = None) -> List[DocumentChunk]:
        if not text or len(text.strip()) < self.min_chunk_size:
            return []

        paragraphs = re.split(r'\n\s*\n', text.strip())
        if len(paragraphs) <= 1:
            paragraphs = text.split('\n')

        chunks = []
        current_chunk = ""
        current_tokens = 0
        chunk_index = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_tokens = self._estimate_tokens(para)

            if current_tokens + para_tokens > self.chunk_size and current_chunk:
                chunks.append(DocumentChunk(
                    text=current_chunk.strip(),
                    metadata={"source": source, "doc_id": doc_id, "method": "paragraph_boundary"},
                    chunk_index=chunk_index,
                    token_count=current_tokens,
                ))
                chunk_index += 1

                overlap_text = self._extract_overlap(current_chunk, self.overlap)
                current_chunk = overlap_text
                current_tokens = self._estimate_tokens(overlap_text)

            current_chunk += " " + para if current_chunk else para
            current_tokens += para_tokens

        if current_chunk.strip():
            chunks.append(DocumentChunk(
                text=current_chunk.strip(),
                metadata={"source": source, "doc_id": doc_id, "method": "final_chunk"},
                chunk_index=chunk_index,
                token_count=current_tokens),
            )

        return chunks

    def _extract_overlap(self, text: str, overlap_tokens: int) -> str:
        words = text.split()
        if len(words) <= overlap_tokens:
            return text
        return " ".join(words[-overlap_tokens:])

    def chunk_by_headings(self, text: str, source: str = "unknown", doc_id: str = None) -> List[DocumentChunk]:
        heading_pattern = re.compile(r'^(#{1,6}\s+.+|[.+]?\s*\d+\.\s+.+)$', re.MULTILINE)
        headings = heading_pattern.findall(text)
        sections = heading_pattern.split(text, flags=re.MULTILINE)

        chunks = []
        chunk_index = 0

        for i, section in enumerate(sections):
            if not section or not section.strip():
                continue
            tokens = self._estimate_tokens(section)
            if tokens > self.min_chunk_size:
                if tokens > self.chunk_size:
                    sub_chunks = self.chunk_text(section, source=source, doc_id=doc_id)
                    for sc in sub_chunks:
                        sc.chunk_index = chunk_index
                        sc.metadata["method"] = "heading_boundary"
                        chunk_index += 1
                        chunks.append(sc)
                else:
                    chunks.append(DocumentChunk(
                        text=section.strip(),
                        metadata={"source": source, "doc_id": doc_id, "method": "heading_boundary"},
                        chunk_index=chunk_index,
                        token_count=tokens,
                    ))
                    chunk_index += 1

        if not chunks:
            return self.chunk_text(text, source=source, doc_id=doc_id)

        return chunks

    def chunk_document(self, text: str, source: str = "unknown", doc_id: str = None, method: str = "auto") -> List[DocumentChunk]:
        if method == "headings":
            return self.chunk_by_headings(text, source, doc_id)
        elif method == "paragraphs":
            return self.chunk_text(text, source, doc_id)
        else:
            if "#" in text or re.search(r'^\d+\.\s', text, re.MULTILINE):
                heading_chunks = self.chunk_by_headings(text, source, doc_id)
                if len(heading_chunks) > 1:
                    return heading_chunks
            return self.chunk_text(text, source, doc_id)


document_chunker = DocumentChunker()
