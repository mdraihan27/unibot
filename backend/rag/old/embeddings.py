from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer

try:
    from .config import EMBEDDING_MODEL_NAME
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from config import EMBEDDING_MODEL_NAME
    else:
        raise


class EmbeddingManager:
    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME):
        self.model_name = model_name
        self.model: SentenceTransformer | None = None
        self._load_model()

    def _load_model(self) -> None:
        try:
            self.model = SentenceTransformer(self.model_name)
        except Exception as exc:
            raise RuntimeError(f"Failed to load embedding model '{self.model_name}': {exc}") from exc

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        if not self.model:
            raise ValueError("Embedding model is not loaded.")
        if not texts:
            raise ValueError("Cannot embed an empty list of texts.")

        embeddings: np.ndarray = self.model.encode(
            texts,
            show_progress_bar=False,
            batch_size=64,
            convert_to_numpy=True,
        )
        return embeddings
