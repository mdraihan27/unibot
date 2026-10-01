import os
import uuid
from typing import Any, List
import numpy as np
import chromadb
from langchain_core.documents import Document

try:
    from .config import CHROMA_COLLECTION_NAME, VECTOR_STORE_DIR
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from config import CHROMA_COLLECTION_NAME, VECTOR_STORE_DIR
    else:
        raise


class VectorStore:
    def __init__(
        self,
        collection_name: str = CHROMA_COLLECTION_NAME,
        persist_directory: str = str(VECTOR_STORE_DIR),
    ):
        self.collection_name = collection_name
        self.persist_directory = str(persist_directory)
        self.client = None
        self.collection = None
        self._init_store()

    def _init_store(self) -> None:
        os.makedirs(self.persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={
                "description": "JUST university document embeddings",
                "hnsw:space": "cosine",
            },
        )

    def is_populated(self) -> bool:
        return self.collection is not None and self.collection.count() > 0

    def count(self) -> int:
        return self.collection.count() if self.collection else 0

    def add_documents(
        self,
        documents: List[Document],
        embeddings: np.ndarray,
        batch_size: int = 250,
    ) -> None:
        if len(documents) != len(embeddings):
            raise ValueError("Number of documents must match number of embeddings.")

        total = len(documents)
        for i in range(0, total, batch_size):
            batch_docs = documents[i : i + batch_size]
            batch_embs = embeddings[i : i + batch_size].tolist()

            ids = [str(uuid.uuid4()) for _ in batch_docs]
            texts = [doc.page_content for doc in batch_docs]
            metadatas = [
                {
                    "source_file": doc.metadata.get("source_file", "unknown"),
                    "page": int(doc.metadata.get("page", 0)),
                    "chunk_index": int(doc.metadata.get("chunk_index", 0)),
                }
                for doc in batch_docs
            ]

            self.collection.add(
                ids=ids,
                documents=texts,
                embeddings=batch_embs,
                metadatas=metadatas,
            )

    def query(self, query_embedding: np.ndarray, top_k: int = 10) -> dict:
        embedding_list = (
            query_embedding.tolist()
            if isinstance(query_embedding, np.ndarray)
            else query_embedding
        )
        if hasattr(embedding_list, "__len__") and len(embedding_list) > 0 and isinstance(embedding_list[0], (int, float)):
            embedding_list = [embedding_list]

        results = self.collection.query(
            query_embeddings=embedding_list,
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )
        return results

    def clear(self) -> None:
        if self.client and self.collection:
            try:
                self.client.delete_collection(self.collection_name)
            except Exception:
                pass
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={
                    "description": "JUST university document embeddings",
                    "hnsw:space": "cosine",
                },
            )
