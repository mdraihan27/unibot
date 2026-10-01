import chromadb

from rag.chunking import Chunk
from rag.config import COLLECTION_NAME, VECTOR_DIR


def _client():
    VECTOR_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(VECTOR_DIR))


def reset_collection():
    client = _client()
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    return client.create_collection(COLLECTION_NAME, metadata={"hnsw:space": "cosine"})


def get_collection():
    return _client().get_collection(COLLECTION_NAME)


def add_chunks(collection, chunks: list[Chunk], embeddings, batch: int = 500):
    for start in range(0, len(chunks), batch):
        part = chunks[start:start + batch]
        collection.add(
            ids=[c.id for c in part],
            documents=[c.text for c in part],
            metadatas=[c.metadata for c in part],
            embeddings=embeddings[start:start + batch].tolist(),
        )


def search(collection, query_embedding, n: int, where: dict | None = None):
    n = min(n, collection.count())
    res = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=n,
        where=where,
    )
    return list(zip(res["ids"][0], res["documents"][0], res["metadatas"][0], res["distances"][0]))


def load_all(collection):
    data = collection.get(include=["documents", "metadatas"])
    return data["ids"], data["documents"], data["metadatas"]