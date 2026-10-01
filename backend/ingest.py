import sys
from rag.pipeline import RAGPipeline


def main():
    print("=" * 64)
    print("  JUST University RAG - Document Ingestion Tool")
    print("=" * 64)

    try:
        pipeline = RAGPipeline()
        print("\nStarting fresh document ingestion...")
        pipeline.reingest()
        count = pipeline.vector_store.count()
        print(f"\nIngestion successful! {count} chunk(s) stored in vector store.")
    except Exception as exc:
        print(f"\nIngestion failed: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
