from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from .config import CHUNK_SIZE, CHUNK_OVERLAP
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from config import CHUNK_SIZE, CHUNK_OVERLAP
    else:
        raise


def split_documents(documents: List[Document]) -> List[Document]:
    non_empty = [doc for doc in documents if doc.page_content.strip()]
    if not non_empty:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(non_empty)
    for idx, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = idx

    return chunks
