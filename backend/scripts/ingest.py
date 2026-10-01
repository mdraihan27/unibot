import logging
import statistics
import time

from rag import store
from rag.chunking import chunk_documents
from rag.embedding import embed_texts
from rag.loading import load_documents


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    start = time.time()

    docs = load_documents()
    chunks = chunk_documents(docs)
    if not chunks:
        raise SystemExit("No chunks produced. Check data/raw and the warnings above.")

    sizes = [len(c.text) for c in chunks]
    print(f"{len(docs)} documents -> {len(chunks)} chunks")
    print(f"chunk size (chars): min {min(sizes)}, median {int(statistics.median(sizes))}, max {max(sizes)}")

    embeddings = embed_texts([c.text for c in chunks])

    collection = store.reset_collection()
    store.add_chunks(collection, chunks, embeddings)
    print(f"Indexed {collection.count()} chunks in {time.time() - start:.0f}s")


if __name__ == "__main__":
    main()