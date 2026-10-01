import hashlib
import logging
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from rag.config import RAW_DATA_DIR

log = logging.getLogger(__name__)

SUPPORTED_SUFFIXES = {".txt", ".md"}
MIN_CHARS = 20

@dataclass
class Document:
    source: str          # path relative to data/raw, e.g. "admissions/fees.txt"
    folders: list[str]   # e.g. ["admissions"] or ["departments", "cse"]
    title: str           # derived from the file name
    text: str            # cleaned content


def read_file(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        pass
    try:
        text = path.read_text(encoding="cp1252")
        log.warning("Fallback encoding cp1252 used, check for garbled text: %s", path)
        return text
    except UnicodeDecodeError:
        log.error("Could not decode, skipped: %s", path)
        return None

def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\x00", "").replace("\u200b", "").replace("\xa0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def load_documents(root: Path = RAW_DATA_DIR) -> list[Document]:
    docs: list[Document] = []
    seen_hashes: dict[str, str] = {}
    files = sorted(
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES
    )

    for path in files:
        raw = read_file(path)
        if raw is None:
            continue
        text = clean_text(raw)
        rel = path.relative_to(root)

        if len(text) < MIN_CHARS:
            log.warning("Empty or too short, skipped: %s", rel.as_posix())
            continue

        digest = hashlib.sha1(text.encode("utf-8")).hexdigest()
        if digest in seen_hashes:
            log.warning("Duplicate of %s, skipped: %s", seen_hashes[digest], rel.as_posix())
            continue
        seen_hashes[digest] = rel.as_posix()

        docs.append(Document(
            source=rel.as_posix(),
            folders=list(rel.parts[:-1]),
            title=" ".join(path.stem.replace("_", " ").replace("-", " ").split()),
            text = re.sub(r"^[ \t]*[=\-_*~#]{4,}[ \t]*$", "", text, flags=re.MULTILINE)
        ))

    log.info("Loaded %d documents from %d files", len(docs), len(files))
    return docs