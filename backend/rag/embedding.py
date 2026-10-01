from sentence_transformers import SentenceTransformer

from rag.config import EMBED_MODEL

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
        _model.max_seq_length = 1024
    return _model


def embed_texts(texts: list[str], batch_size: int = 16, show_progress: bool = True):
    return get_model().encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=show_progress,
    )


def embed_query(query: str):
    return get_model().encode([query], normalize_embeddings=True)[0]