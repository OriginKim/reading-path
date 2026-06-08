import json
import google.generativeai as genai
from app.core.config import settings

SYSTEM_PROMPT = """당신은 독서 분석 전문가입니다.
사용자가 읽은 책 목록을 분석하여, 반드시 아래 JSON 형식으로만 응답하세요.
다른 텍스트, 마크다운 코드블록, 설명을 절대 포함하지 마세요.

분석 기준:
- 책과 책 사이의 공통 주제, 사상, 감정, 철학적 흐름을 연결하세요
- 단순 장르 분류가 아닌, 사용자의 지적 관심사 흐름을 해석하세요
- 추천이 아닌 연결과 해석에 집중하세요
- 다음 경로는 현재 흐름에서 자연스럽게 이어지는 책 2~3권을 제안하세요

응답 형식:
{"readerType":"string","themes":["string"],"keywords":["string"],"currentPosition":"string","summary":"string","path":[{"title":"string","connection":"string"}],"nextPath":[{"title":"string","reason":"string"}]}

분석할 책 목록:
"""

REQUIRED_FIELDS = ["readerType", "themes", "keywords", "currentPosition", "summary", "path", "nextPath"]


def build_prompt(books: list[dict]) -> str:
    book_list = [
        {
            "index": i,
            "title": b["title"][:100],
            "authors": b["authors"][:3],
            "description": b.get("description", "")[:300],
        }
        for i, b in enumerate(books, 1)
    ]
    return SYSTEM_PROMPT + json.dumps({"books": book_list}, ensure_ascii=False)


def validate_ai_response(data: dict) -> None:
    for field in REQUIRED_FIELDS:
        if field not in data:
            raise ValueError(f"필수 필드 누락: {field}")
    if not data["themes"]:
        raise ValueError("themes 비어있음")
    if not data["path"]:
        raise ValueError("path 비어있음")
    if not data["nextPath"]:
        raise ValueError("nextPath 비어있음")


async def analyze_with_ai(books: list[dict]) -> dict:
    import asyncio
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            prompt = build_prompt(books)
            response = await asyncio.to_thread(model.generate_content, prompt)
            raw = response.text.strip()

            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            result = json.loads(raw)
            validate_ai_response(result)
            return result
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"AI 응답 파싱 실패: {last_error}")
