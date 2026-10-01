import re
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

try:
    from .config import (
        OPENROUTER_API_KEY,
        OPENROUTER_BASE_URL,
        OPENROUTER_SITE_URL,
        OPENROUTER_APP_NAME,
        LLM_MODEL_NAME,
        LLM_TEMPERATURE,
        LLM_MAX_TOKENS,
    )
except (ImportError, ValueError) as err:
    if "relative import" in str(err):
        from config import (
            OPENROUTER_API_KEY,
            OPENROUTER_BASE_URL,
            OPENROUTER_SITE_URL,
            OPENROUTER_APP_NAME,
            LLM_MODEL_NAME,
            LLM_TEMPERATURE,
            LLM_MAX_TOKENS,
        )
    else:
        raise

JUST_SYSTEM_PROMPT = """You are the official AI Academic and Campus Assistant for Jashore University of Science and Technology (JUST - যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়).
Your goal is to provide accurate, reliable, helpful, and student-focused answers based strictly on official JUST university documents, ordinances, holiday calendars, faculty directories, and regent board records.

Instructions:
1. Grounding: Rely strictly on the provided context extracted from official JUST documents. Do not invent or assume university rules, dates, grading scales, or faculty details.
2. Academic Regulations: When answering questions regarding grading systems, GPA/CGPA calculation, credit requirements, course registration, attendance policy, improvement exams, or graduation clearance, provide exact rules and articles from the ordinance context whenever present.
3. Markdown Formatting: You MUST always reply using rich, clean Markdown. Format your output with clear section headings (e.g. `###`, `####`), organized bullet points (`- `) or numbered lists, bold text (`**keyword**`) for key terms and criteria, inline code (`` `code` ``) for course codes, dates, or symbols, blockquotes (`>`) for highlights or warnings, and Markdown tables (`| ... |`) for schedules, fees, grading scales, or comparisons. Never return plain unformatted text or raw unorganized walls of text.
4. Missing Information: If the provided context does not contain enough information to fully answer the question, clearly state what is known from the documents and politely note that the remaining details are not specified in the current records, advising the student to contact the relevant department office, academic advisor, or the Office of the Registrar.
5. Language: If the user asks in Bengali (বাংলা), respond in natural, professional Bengali while preserving Markdown structure. If in English, respond in clear English.
6. Never Show Sources: Do NOT show, mention, cite, or hint at sources, document titles, file names, page numbers, links, or phrases like 'Source:', 'Sources:', 'According to...', or references anywhere in your response. Never include a sources section. Provide only the direct, helpful, and cleanly formatted answer."""


def _sanitize_response(text: str) -> str:
    """Strips any source mentions, reference headers, or citations from the generated output."""
    if not text:
        return ""
    # Strip markdown headers like ### Sources, ### References, ## Source Documents
    text = re.sub(
        r"(?im)^\s*#{1,6}\s*(sources?|references?|source documents?|citations?).*?$",
        "",
        text,
    )
    # Strip bullet or plain lines starting with Source:, Sources:, Reference:, References:
    text = re.sub(
        r"(?im)^\s*[-*•]?\s*(\*{1,2}|_)?(sources?|references?|source document|citation)\s*:?.*$",
        "",
        text,
    )
    # Strip blockquotes quoting sources
    text = re.sub(
        r"(?im)^\s*>\s*(\*{1,2}|_)?(sources?|references?|source document).*$",
        "",
        text,
    )
    # Strip bracket citations like [Source: ...], [Source 1], [Page 12]
    text = re.sub(r"\[(?:Source|Page)[^\]]*\]", "", text, flags=re.IGNORECASE)
    # Strip multiple consecutive newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


class LLMClient:
    def __init__(self, model_name: str = LLM_MODEL_NAME):
        if not OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is not set.")

        self.model_name = model_name
        self.client = ChatOpenAI(
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base=OPENROUTER_BASE_URL,
            model_name=self.model_name,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            max_retries=1,
            request_timeout=35,
            default_headers={
                "HTTP-Referer": OPENROUTER_SITE_URL,
                "X-Title": OPENROUTER_APP_NAME,
            },
        )

    def generate(self, question: str, context: str) -> str:
        prompt_content = (
            f"Context from JUST official university documents:\n"
            f"--------------------------------------------------\n"
            f"{context}\n"
            f"--------------------------------------------------\n\n"
            f"Student Question: {question}\n\n"
            f"Answer:"
        )

        messages = [
            SystemMessage(content=JUST_SYSTEM_PROMPT),
            HumanMessage(content=prompt_content),
        ]

        try:
            response = self.client.invoke(messages)
            return _sanitize_response(response.content)
        except Exception as exc:
            try:
                fallback_client = ChatOpenAI(
                    openai_api_key=OPENROUTER_API_KEY,
                    openai_api_base=OPENROUTER_BASE_URL,
                    model_name="inclusionai/ling-3.0-flash-fin:free",
                    temperature=LLM_TEMPERATURE,
                    max_tokens=LLM_MAX_TOKENS,
                    max_retries=1,
                    request_timeout=25,
                    default_headers={
                        "HTTP-Referer": OPENROUTER_SITE_URL,
                        "X-Title": OPENROUTER_APP_NAME,
                    },
                )
                response = fallback_client.invoke(messages)
                return _sanitize_response(response.content)
            except Exception as fb_exc:
                return (
                    "I am currently having difficulty connecting to the language model service. "
                    "Please try your query again in a moment."
                )
