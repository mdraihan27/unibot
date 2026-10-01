import sys

from rag.pipeline import RAGPipeline

REFUSAL_MARKER = "don't have that information"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    pipeline = RAGPipeline()
    debug = False
    print("Ask a question. Empty line quits. ':debug' toggles retrieval details.")

    while True:
        try:
            question = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not question:
            break
        if question == ":debug":
            debug = not debug
            print(f"debug {'on' if debug else 'off'}")
            continue

        result = pipeline.answer(question)
        print("\n" + result.text)

        if debug:
            print("\nRetrieved:")
            for n, hit in enumerate(result.hits, 1):
                print(f"  [{n}] score {hit.score:.3f}  {hit.metadata['source']}")
        elif REFUSAL_MARKER not in result.text:
            print("\nSources: " + ", ".join(result.sources))


if __name__ == "__main__":
    main()