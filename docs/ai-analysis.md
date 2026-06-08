# AI 분석 로직

> AI 모델: Gemini 2.5 Flash
> 입력: 구조화된 JSON (자유 텍스트 아님)
> 출력: JSON 형식 강제

---

## 할루시네이션 방지 원칙

**AI가 책 제목을 직접 생성하게 하지 않는다.**

- `path` (독서 흐름): 사용자가 실제로 읽은 책만 사용 → 할루시네이션 불가
- `nextPath` (다음 경로): **책 제목 제안 금지** → "다음 탐색 방향" 텍스트로 대체
- AI의 역할은 분석과 해석이지, 책을 창작하는 것이 아님

---

## 전체 흐름

```
READ 책 목록 조회
    │
    ▼
입력 구조화 (프롬프트 인젝션 방어)
    │
    ▼
시스템 프롬프트 + 구조화 JSON → Gemini API (asyncio.to_thread)
    │
    ▼
JSON 파싱 + 필수 필드 검증
    │
    ├── 성공 → DB 저장 → 결과 반환
    │
    └── 실패 → 재시도 1회 → 실패 시 AI_PARSE_ERROR
```

---

## 입력 구성 (프롬프트 인젝션 방어)

사용자 입력(책 제목, 저자, 설명)을 프롬프트 문자열에 직접 삽입하지 않는다.
구조화된 JSON 객체 안에 격리하여 전달한다.

```python
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
```

---

## 시스템 프롬프트

```
당신은 독서 분석 전문가입니다.
사용자가 읽은 책 목록을 분석하여, 반드시 아래 JSON 형식으로만 응답하세요.
다른 텍스트, 마크다운 코드블록, 설명을 절대 포함하지 마세요.

분석 기준:
- 책과 책 사이의 공통 주제, 사상, 감정, 철학적 흐름을 연결하세요
- 단순 장르 분류가 아닌, 사용자의 지적 관심사 흐름을 해석하세요
- 추천이 아닌 연결과 해석에 집중하세요
- nextDirection은 책 제목을 절대 제시하지 말고, 탐색할 방향이나 테마만 서술하세요

응답 형식:
{
  "readerType": "string",
  "themes": ["string"],
  "keywords": ["string"],
  "currentPosition": "string (100자 이내)",
  "summary": "string",
  "path": [{"title": "string", "connection": "string"}],
  "nextDirection": "string (다음 탐색 방향 서술, 책 제목 없이)"
}
```

---

## AI 응답 스키마 변경 이력

| 필드 | 변경 전 | 변경 후 | 이유 |
|------|---------|---------|------|
| `nextPath` | 책 제목 2~3권 배열 | 제거 | 할루시네이션 |
| `nextDirection` | 없음 | 방향성 텍스트 string | 할루시네이션 없는 대안 |
| `currentPosition` | VARCHAR(255) | truncation [:255] 처리 | Gemini 2.5가 길게 생성 |

---

## JSON 파싱 및 Fallback 처리

```python
async def analyze_with_ai(books: list) -> dict:
    for attempt in range(2):  # 최대 2회 시도
        try:
            prompt = build_prompt(books)
            response = await asyncio.to_thread(model.generate_content, prompt)
            raw = response.text.strip()

            # 코드블록 제거
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
```

---

## 응답 품질 검증

```python
REQUIRED_FIELDS = [
    "readerType", "themes", "keywords",
    "currentPosition", "summary", "path", "nextDirection"
]
```

---

## AI 응답 예시

```json
{
  "readerType": "존재의 본질과 변화를 탐색하는 사색가",
  "themes": ["인간 본성", "생존과 저항", "상실과 성장", "기억과 회한"],
  "keywords": ["야생성", "억압", "성장통", "향수", "회복"],
  "currentPosition": "극한 환경 속 인간 내면 탐구",
  "summary": "독자는 원초적 생존 본능과 가혹한 환경 속 인간 본성을 탐색하는 것으로 여정을 시작해, 이것이 한 개인의 성장과 상실로 이어지는 흐름을 따라왔습니다.",
  "path": [
    { "title": "말뚝들", "connection": "사회적 억압 속 생존과 저항의 시작점" },
    { "title": "소도둑 성장기", "connection": "거친 환경이 한 개인의 성장에 미치는 영향" },
    { "title": "두고 온 여름", "connection": "상실이 남긴 기억과 내면 성찰" }
  ],
  "nextDirection": "상실 이후 인간이 의미를 재구성하는 과정, 기억과 트라우마가 현재의 자아에 미치는 심리적 영향을 다룬 문학으로 흐름이 이어질 수 있습니다."
}
```

---

## DB 저장 매핑

| AI 응답 필드 | DB 컬럼 | 비고 |
|-------------|---------|------|
| `readerType` | `reader_type` | [:100] truncation |
| `themes` | `themes` (TEXT[]) | |
| `keywords` | `keywords` (TEXT[]) | |
| `currentPosition` | `current_position` | [:255] truncation |
| `summary` | `summary` | TEXT, 길이 무제한 |
| `path` | `path_json` (JSONB) | |
| `nextDirection` | `next_path_json` (JSONB) | 형식 변경됨 |

---

## Rate Limit 정책

- 사용자당 **하루 5회** 분석 요청 허용
- 초과 시 `429 RATE_LIMIT_EXCEEDED` 반환
- 구현: `slowapi` 라이브러리
- 이유: Gemini API 무료 티어 보호 + 서비스 운영 비용 통제
