import hashlib
import re
from dataclasses import dataclass

from rag.config import CHUNK_MAX_CHARS, CHUNK_OVERLAP_CHARS
from rag.loading import Document


@dataclass
class Chunk:
    id: str
    text: str
    metadata: dict


SENTENCE_END = re.compile(r"(?<=[.!?।])\s+")


def split_oversized(paragraph: str, limit: int) -> list[str]:
    pieces, current = [], ""
    for sentence in SENTENCE_END.split(paragraph):
        while len(sentence) > limit:
            cut = sentence.rfind(" ", 0, limit)
            if cut < limit // 2:
                cut = limit
            if current:
                pieces.append(current)
                current = ""
            pieces.append(sentence[:cut].strip())
            sentence = sentence[cut:].strip()
        if current and len(current) + len(sentence) + 1 > limit:
            pieces.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        pieces.append(current)
    return pieces


def split_into_units(text: str, limit: int) -> list[str]:
    units = []
    for para in re.split(r"\n\s*\n", text):
        para = para.strip()
        if not para:
            continue
        if len(para) <= limit:
            units.append(para)
        else:
            units.extend(split_oversized(para, limit))
    return units


def overlap_tail(text: str, size: int) -> str:
    if size <= 0 or len(text) <= size:
        return ""
    tail = text[-size:]
    space = tail.find(" ")
    return tail[space + 1:] if space != -1 else tail


def pack_units(units: list[str], limit: int, overlap: int) -> list[str]:
    chunks, current = [], ""
    for unit in units:
        if current and len(current) + len(unit) + 2 > limit:
            chunks.append(current)
            tail = overlap_tail(current, overlap)
            current = f"{tail}\n\n{unit}" if tail else unit
        else:
            current = f"{current}\n\n{unit}" if current else unit
    if current:
        chunks.append(current)
    return chunks


def chunk_document(doc: Document) -> list[Chunk]:
    header = f"[{' / '.join(doc.folders)}] {doc.title}" if doc.folders else doc.title
    units = split_into_units(doc.text, CHUNK_MAX_CHARS)
    pieces = pack_units(units, CHUNK_MAX_CHARS, CHUNK_OVERLAP_CHARS)

    chunks = []
    for i, piece in enumerate(pieces):
        chunk_id = hashlib.sha1(f"{doc.source}::{i}".encode("utf-8")).hexdigest()
        chunks.append(Chunk(
            id=chunk_id,
            text=f"{header}\n{piece}",
            metadata={
                "source": doc.source,
                "top_folder": doc.folders[0] if doc.folders else "",
                "folder": "/".join(doc.folders),
                "title": doc.title,
                "chunk_index": i,
                "n_chunks": len(pieces),
            },
        ))
    return chunks


def chunk_documents(docs: list[Document]) -> list[Chunk]:
    chunks = []
    for doc in docs:
        chunks.extend(chunk_document(doc))
    return chunks