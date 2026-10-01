from typing import Any, Dict, List

try:
    from .config import SCORE_THRESHOLD, TOP_K
    from .embeddings import EmbeddingManager
    from .llm import LLMClient
    from .loader import load_pdfs
    from .retriever import RAGRetriever
    from .splitter import split_documents
    from .vectorstore import VectorStore
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from config import SCORE_THRESHOLD, TOP_K
        from embeddings import EmbeddingManager
        from llm import LLMClient
        from loader import load_pdfs
        from retriever import RAGRetriever
        from splitter import split_documents
        from vectorstore import VectorStore
    else:
        raise


class RAGPipeline:
    def __init__(self):
        self.embedding_manager = EmbeddingManager()
        self.vector_store = VectorStore()
        self.retriever = RAGRetriever(self.vector_store, self.embedding_manager)
        self.llm = LLMClient()

        if not self.vector_store.is_populated():
            self._ingest()

    def _ingest(self) -> None:
        documents = load_pdfs()
        chunks = split_documents(documents)
        if not chunks:
            raise ValueError("No text chunks produced from PDF documents.")

        texts = [chunk.page_content for chunk in chunks]
        embeddings = self.embedding_manager.generate_embeddings(texts)
        self.vector_store.add_documents(chunks, embeddings)

    def reingest(self) -> None:
        self.vector_store.clear()
        self._ingest()

    def ask(
        self,
        question: str,
        top_k: int = TOP_K,
        score_threshold: float = SCORE_THRESHOLD,
        verbose: bool = False,
    ) -> Dict[str, Any]:
        if not question.strip():
            return {
                "answer": "Please ask a question about Jashore University of Science and Technology (JUST).",
                "sources": [],
                "chunks": 0,
            }

        chunks = self.retriever.retrieve(
            question,
            top_k=top_k,
            score_threshold=score_threshold,
        )

        context = self.retriever.format_context(chunks)
        answer = self.llm.generate(question, context)

        return {
            "answer": answer,
            "sources": [],
            "chunks": len(chunks),
        }
