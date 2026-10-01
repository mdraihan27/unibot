from pathlib import Path
from typing import List
from langchain_core.documents import Document
from langchain_community.document_loaders import PyMuPDFLoader

try:
    from .config import DATA_DIR
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from config import DATA_DIR
    else:
        raise


def load_pdfs(data_dir: Path = DATA_DIR) -> List[Document]:
    data_dir = Path(data_dir)
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")

    pdf_files = sorted(data_dir.glob("**/*.pdf"))
    if not pdf_files:
        raise ValueError(f"No PDF files found in: {data_dir}")

    all_documents: List[Document] = []
    for pdf_path in pdf_files:
        try:
            loader = PyMuPDFLoader(str(pdf_path))
            pages = loader.load()
            for page in pages:
                page.metadata["source_file"] = pdf_path.name
                page.metadata["file_type"] = "pdf"
            all_documents.extend(pages)
        except Exception:
            continue

    return all_documents
