from dataclasses import dataclass

from rag.generation import generate
from rag.retrieval import Hit, Retriever


@dataclass
class Answer:
    text: str
    sources: list[str]
    hits: list[Hit]


class RAGPipeline:
    def __init__(self):
        self.retriever = Retriever()

    def answer(
        self,
        question: str,
        top_folder: str | None = None,
        top_k: int | None = None,
    ) -> Answer:
        question = question.strip()
        if not question:
            return Answer("Please enter a question.", [], [])

        kwargs = {"top_folder": top_folder}
        if top_k is not None:
            kwargs["n_final"] = top_k
        hits = self.retriever.retrieve(question, **kwargs)
        text = generate(question, hits)
        sources = list(dict.fromkeys(h.metadata["source"] for h in hits))
        return Answer(text, sources, hits)

    def ask(
        self,
        question: str,
        top_folder: str | None = None,
        top_k: int | None = None,
        **kwargs,
    ) -> dict:
        """Compatibility method for dictionary-based callers."""
        ans = self.answer(question, top_folder=top_folder, top_k=top_k)
        return {
            "answer": ans.text,
            "sources": ans.sources,
            "hits": ans.hits,
        }

    def reingest(self) -> int:
        """Re-index all documents from RAW_DATA_DIR and refresh the retriever."""
        from rag import store
        from rag.chunking import chunk_documents
        from rag.embedding import embed_texts
        from rag.loading import load_documents

        docs = load_documents()
        chunks = chunk_documents(docs)
        if not chunks:
            return 0
        embeddings = embed_texts([c.text for c in chunks])
        collection = store.reset_collection()
        store.add_chunks(collection, chunks, embeddings)
        self.retriever = Retriever()
        return collection.count()

    @property
    def vector_store(self):
        class _StoreWrapper:
            def __init__(self, col):
                self._col = col

            def count(self) -> int:
                return self._col.count()

        return _StoreWrapper(self.retriever.col)