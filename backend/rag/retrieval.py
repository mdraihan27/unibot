import re
from dataclasses import dataclass

from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

from rag import store
from rag.config import N_CANDIDATES, N_FINAL, RERANK_MODEL, USE_RERANK
from rag.embedding import embed_query

_SPLIT = re.compile(r"[\s\.,;:!?()\[\]{}\"'“”‘’|/\\।—–\-]+")


def tokenize(text: str) -> list[str]:
    return [w for w in _SPLIT.split(text.lower()) if w]


@dataclass
class Hit:
    id: str
    text: str
    metadata: dict
    score: float


class Retriever:
    def __init__(self):
        self.col = store.get_collection()
        self.ids, self.docs, self.metas = store.load_all(self.col)
        self.pos = {i: n for n, i in enumerate(self.ids)}
        self.bm25 = BM25Okapi([tokenize(d) for d in self.docs])
        self._reranker = None


    def vector_search(self, query: str, n: int, top_folder: str | None = None) -> list[str]:
        where = {"top_folder": top_folder} if top_folder else None
        results = store.search(self.col, embed_query(query), n, where)
        return [r[0] for r in results]

    def keyword_search(self, query: str, n: int, top_folder: str | None = None) -> list[str]:
        scores = self.bm25.get_scores(tokenize(query))
        order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        found = []
        for i in order:
            if scores[i] <= 0 or len(found) >= n:
                break
            if top_folder and self.metas[i]["top_folder"] != top_folder:
                continue
            found.append(self.ids[i])
        return found

    def rerank(self, query: str, ids: list[str], n: int) -> list[Hit]:
        if self._reranker is None:
            self._reranker = CrossEncoder(RERANK_MODEL, max_length=1024)
        pairs = [(query, self.docs[self.pos[i]]) for i in ids]
        scores = self._reranker.predict(pairs, batch_size=8)
        ranked = sorted(zip(ids, scores), key=lambda x: x[1], reverse=True)[:n]
        return [
            Hit(i, self.docs[self.pos[i]], self.metas[self.pos[i]], float(s))
            for i, s in ranked
        ]

    def retrieve(
        self,
        query: str,
        top_folder: str | None = None,
        n_candidates: int = N_CANDIDATES,
        n_final: int = N_FINAL,
        use_keyword: bool = True,
        use_rerank: bool = USE_RERANK,
    ) -> list[Hit]:
        rankings = [self.vector_search(query, n_candidates, top_folder)]
        if use_keyword:
            rankings.append(self.keyword_search(query, n_candidates, top_folder))
        fused = rrf(rankings)[:n_candidates]

        if use_rerank:
            return self.rerank(query, fused, n_final)
        return [
            Hit(i, self.docs[self.pos[i]], self.metas[self.pos[i]], 0.0)
            for i in fused[:n_final]
        ]


def rrf(rankings: list[list[str]], k: int = 60) -> list[str]:
    scores: dict[str, float] = {}
    for ranking in rankings:
        for rank, chunk_id in enumerate(ranking):
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores, key=scores.get, reverse=True)