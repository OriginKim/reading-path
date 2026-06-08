# AI 분석 로직

> AI 모델: Gemini 1.5 Flash
> 입력: 구조화된 JSON (자유 텍스트 아님)
> 출력: JSON 형식 강제

---

## 전체 흐름

```
READ 책 목록 조회
    │
    ▼
입력 구조화 (프롬프트 인젝션 방어)
    │
    ▼
시스템 프롬프트 + 구조화 JSON → Gemini API
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
    book_list = []
    for i, book in enumerate(books, 1):
        book_list.append({
            "index": i,
            "title": book["title"][:100],       # 길이 제한
            "authors": book["authors"][:3],      # 저자 최대 3명
            "description": book["description"][:300] if book.get("description") else ""
        })

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
- 다음 경로는 현재 흐름에서 자연스럽게 이어지는 책 2~3권을 제안하세요

응답 형식:
{
  "readerType": "string",
  "themes": ["string"],
  "keywords": ["string"],
  "currentPosition": "string",
  "summary": "string",
  "path": [{"title": "string", "connection": "string"}],
  "nextPath": [{"title": "string", "reason": "string"}]
}
```

---

## JSON 파싱 및 Fallback 처리

```python
async def analyze_with_ai(books: list) -> dict:
    for attempt in range(2):  # 최대 2회 시도
        try:
            response = await gemini_client.generate(prompt=build_prompt(books))
            raw_text = response.text.strip()

            # 코드블록 제거 (모델이 ```json 으로 감쌀 경우 대비)
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]

            result = json.loads(raw_text)
            validate_ai_response(result)  # 필수 필드 검증
            return result

        except (json.JSONDecodeError, ValidationError) as e:
            if attempt == 1:
                raise AIParseError("AI 응답 파싱 실패")
            continue
```

---

## 응답 품질 검증

```python
def validate_ai_response(data: dict) -> None:
    required_fields = [
        "readerType", "themes", "keywords",
        "currentPosition", "summary", "path", "nextPath"
    ]
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"필수 필드 누락: {field}")

    if len(data["themes"]) == 0:
        raise ValidationError("themes 비어있음")
    if len(data["path"]) == 0:
        raise ValidationError("path 비어있음")
    if len(data["nextPath"]) == 0:
        raise ValidationError("nextPath 비어있음")
```

---

## AI 응답 예시

```json
{
  "readerType": "자아 탐구형 독자",
  "themes": ["실존", "자유", "정체성", "고독"],
  "keywords": ["자기 발견", "내면 탐구", "부조리", "세계와의 거리감"],
  "currentPosition": "실존주의 입문 단계",
  "summary": "사용자는 자아와 세계의 관계를 탐구하는 방향으로 독서를 이어가고 있습니다.",
  "path": [
    { "title": "데미안", "connection": "자아 발견의 출발점" },
    { "title": "싯다르타", "connection": "내면 수행과 자기 이해의 확장" },
    { "title": "이방인", "connection": "세계와의 거리감과 부조리 인식" }
  ],
  "nextPath": [
    { "title": "시지프 신화", "reason": "부조리를 더 직접적으로 다루는 자연스러운 다음 경로" },
    { "title": "존재와 무", "reason": "실존주의의 철학적 기반을 깊게 확장할 수 있는 경로" }
  ]
}
```

---

## DB 저장 매핑

AI 응답 필드 → reading_maps 테이블

| AI 응답 필드 | DB 컬럼 |
|-------------|---------|
| `readerType` | `reader_type` |
| `themes` | `themes` (TEXT[]) |
| `keywords` | `keywords` (TEXT[]) |
| `currentPosition` | `current_position` |
| `summary` | `summary` |
| `path` | `path_json` (JSONB) |
| `nextPath` | `next_path_json` (JSONB) |

---

## Rate Limit 정책

- 사용자당 **하루 5회** 분석 요청 허용
- 초과 시 `429 RATE_LIMIT_EXCEEDED` 반환
- 구현: `slowapi` 라이브러리 사용
- 이유: Gemini API 무료 티어 보호 + 서비스 운영 비용 통제
