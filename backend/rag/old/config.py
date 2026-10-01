import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
VECTOR_STORE_DIR = PROJECT_ROOT / "vector_store"

def _require_env(key: str, default: str = "") -> str:
    value = os.getenv(key, default).strip()
    if not value:
        raise EnvironmentError(f"Required environment variable '{key}' is not set.")
    return value

EMBEDDING_MODEL_NAME: str = _require_env("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
CHROMA_COLLECTION_NAME = "just_documents"

CHUNK_SIZE = 3000
CHUNK_OVERLAP = 600

TOP_K = 10
SCORE_THRESHOLD = 0.40

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "http://localhost")
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "JUST Unibot RAG")

LLM_MODEL_NAME: str = _require_env("LLM_MODEL_NAME", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free")
LLM_TEMPERATURE = 0.2
LLM_MAX_TOKENS = 15000

CMD_QUIT = {"quit", "exit", "q", "bye"}
CMD_HELP = {"help", "h", "?"}
CMD_CLEAR = {"clear", "cls"}
