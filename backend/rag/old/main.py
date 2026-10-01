import argparse
import os
import sys

try:
    from .pipeline import RAGPipeline
    from .config import CMD_QUIT, CMD_HELP, CMD_CLEAR
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from pipeline import RAGPipeline
        from config import CMD_QUIT, CMD_HELP, CMD_CLEAR
    else:
        raise


def _clear_screen() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def _print_banner() -> None:
    print("=" * 64)
    print("  JUST University AI Assistant (Jashore University of Science and Technology)")
    print("  Ask questions about ordinances, exams, holidays, and faculty.")
    print("  Type 'help' for commands, 'quit' to exit.")
    print("=" * 64)


def _print_help() -> None:
    print("\nCommands:")
    print("  help / h    - Show this help menu")
    print("  sources     - Toggle displaying source files and pages")
    print("  reingest    - Re-process and re-embed all PDFs from data folder")
    print("  clear / cls - Clear the screen")
    print("  quit / q    - Exit\n")


def _print_answer(result: dict, show_sources: bool) -> None:
    print("\nAnswer:")
    print("-" * 64)
    print(result["answer"])
    print("-" * 64)

    if show_sources and result.get("sources"):
        print(f"\nSources ({result['chunks']} relevant sections):")
        seen = set()
        for src in result["sources"]:
            key = (src.get("source_file"), src.get("page"))
            if key not in seen:
                seen.add(key)
                print(f"  * {src.get('source_file')}, Page {src.get('page')} (score: {src.get('similarity_score')})")
    print()


def run_cli(verbose: bool = False, reingest_on_start: bool = False) -> None:
    _clear_screen()
    _print_banner()

    try:
        pipeline = RAGPipeline()
    except Exception as exc:
        print(f"Failed to initialise RAG pipeline: {exc}")
        sys.exit(1)

    if reingest_on_start:
        print("Reingesting documents...")
        pipeline.reingest()
        print("Reingestion complete.")

    show_sources = False
    _print_help()

    while True:
        try:
            status = "sources: on" if show_sources else "sources: off"
            user_input = input(f"[{status}] Ask JUST: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        lower = user_input.lower()
        if lower in CMD_QUIT:
            print("Goodbye!")
            break
        elif lower in CMD_HELP:
            _print_help()
            continue
        elif lower in CMD_CLEAR:
            _clear_screen()
            _print_banner()
            continue
        elif lower == "sources":
            show_sources = not show_sources
            state = "enabled" if show_sources else "disabled"
            print(f"Source citations {state}.")
            continue
        elif lower == "reingest":
            print("Reingesting documents...")
            pipeline.reingest()
            print("Reingestion complete.")
            continue

        try:
            result = pipeline.ask(user_input, verbose=verbose)
            _print_answer(result, show_sources)
        except Exception as exc:
            print(f"Error answering question: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JUST University RAG Assistant")
    parser.add_argument("--verbose", action="store_true", help="Show retrieval debug details")
    parser.add_argument("--reingest", action="store_true", help="Re-embed all documents on startup")
    args = parser.parse_args()

    run_cli(verbose=args.verbose, reingest_on_start=args.reingest)
