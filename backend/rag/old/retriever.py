from typing import Any, Dict, List

try:
    from .config import SCORE_THRESHOLD, TOP_K
    from .embeddings import EmbeddingManager
    from .vectorstore import VectorStore
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from config import SCORE_THRESHOLD, TOP_K
        from embeddings import EmbeddingManager
        from vectorstore import VectorStore
    else:
        raise


class RAGRetriever:
    def __init__(
        self,
        vector_store: VectorStore,
        embedding_manager: EmbeddingManager,
    ):
        self.vector_store = vector_store
        self.embedding_manager = embedding_manager

    def preprocess_query(self, query: str) -> str:
        clean = query.strip()
        replacements = {
            
        }
        words = clean.split()
        expanded = []
        for w in words:
            lower_w = w.lower().strip("?,.!")
            if lower_w in replacements:
                expanded.append(replacements[lower_w])
            else:
                expanded.append(w)
        return " ".join(expanded)

    def retrieve(
        self,
        query: str,
        top_k: int = TOP_K,
        score_threshold: float = SCORE_THRESHOLD,
    ) -> List[Dict[str, Any]]:
        if not query.strip():
            return []

        expanded_query = self.preprocess_query(query)
        query_embedding = self.embedding_manager.generate_embeddings([expanded_query])[0]
        raw = self.vector_store.query(query_embedding, top_k=top_k)

        documents = raw.get("documents", [[]])[0]
        metadatas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]

        retrieved: List[Dict[str, Any]] = []
        for idx, (doc, meta, dist) in enumerate(zip(documents, metadatas, distances)):
            similarity = round(float(1.0 - dist), 4)
            if similarity >= score_threshold:
                retrieved.append(
                    {
                        "content": doc,
                        "metadata": meta,
                        "source_file": meta.get("source_file", "unknown"),
                        "page": meta.get("page", 0),
                        "similarity_score": similarity,
                        "rank": idx + 1,
                    }
                )

        if not retrieved and documents:
            first_dist = distances[0]
            first_sim = round(float(1.0 - first_dist), 4)
            retrieved.append(
                {
                    "content": documents[0],
                    "metadata": metadatas[0],
                    "source_file": metadatas[0].get("source_file", "unknown"),
                    "page": metadatas[0].get("page", 0),
                    "similarity_score": first_sim,
                    "rank": 1,
                }
            )

        return retrieved

    def format_context(self, chunks: List[Dict[str, Any]]) -> str:
        if not chunks:
            return "No relevant university documents found."

        parts = []
        for chunk in chunks:
            content = chunk.get("content", "").strip()
            if content:
                parts.append(content)

        return "\n\n---\n\n".join(parts)
