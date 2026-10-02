import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Paths ---
ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = ROOT / "data" / "raw"
EVAL_FILE = ROOT / "data" / "eval" / "tests.jsonl"
VECTOR_DIR = ROOT / "storage" / "chroma"
COLLECTION_NAME = "university"

# --- Models ---
EMBED_MODEL = "BAAI/bge-m3"
# RERANK_MODEL = "BAAI/bge-reranker-v2-m3"
RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
LLM_MODEL = "anthropic/claude-sonnet-4"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# --- Chunking ---
CHUNK_MAX_CHARS = 1800
CHUNK_OVERLAP_CHARS = 250

# --- Retrieval ---
N_CANDIDATES = 30
N_FINAL = 5

USE_RERANK = True

# --- Secrets ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")