# API 명세

> Base URL: `https://api.readingpath.kr/api/v1`
> 인증: `Authorization: Bearer {JWT}` (NextAuth 발급 토큰)

---

## 공통 규칙

**에러 응답 형식**
```json
{
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "해당 책을 찾을 수 없습니다."
  }
}
```

- 모든 에러에 스택트레이스 노출 금지 (production)
- HTTP 상태 코드와 에러 코드 모두 반환

---

## 인증

### POST `/auth/google`
Google OAuth 콜백 처리 → 사용자 생성/조회 → JWT 반환

**요청**
```json
{
  "code": "google_auth_code",
  "provider_id": "google_user_id",
  "email": "user@gmail.com",
  "name": "홍길동",
  "profile_image": "https://..."
}
```

**응답 200**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "홍길동"
  },
  "access_token": "jwt_token"
}
```

---

## 책 검색

### GET `/books/search?query={keyword}&page={n}`
카카오 책 검색 API 호출, 실패 시 Google Books 폴백

**응답 200**
```json
{
  "books": [
    {
      "external_id": "9788936434267",
      "title": "데미안",
      "authors": ["헤르만 헤세"],
      "publisher": "민음사",
      "published_date": "2009",
      "description": "...",
      "thumbnail_url": "https://...",
      "isbn": "9788936434267",
      "source": "kakao"
    }
  ],
  "total": 42,
  "page": 1
}
```

---

## 책 등록

### POST `/user-books`
books 테이블 upsert → user_books 등록

**요청**
```json
{
  "external_id": "9788936434267",
  "title": "데미안",
  "authors": ["헤르만 헤세"],
  "thumbnail_url": "https://...",
  "isbn": "9788936434267",
  "source": "kakao",
  "status": "READ"
}
```

**응답 201**
```json
{
  "user_book_id": "uuid",
  "book_id": "uuid",
  "status": "READ"
}
```

**에러**
- `409 ALREADY_REGISTERED` — 이미 등록된 책

---

## 내 책 목록 조회

### GET `/user-books?status={READ|READING|WISHLIST}`
로그인 사용자 책 목록 조회. `status` 파라미터 없으면 전체 반환.

**응답 200**
```json
{
  "books": [
    {
      "user_book_id": "uuid",
      "book": {
        "title": "데미안",
        "authors": ["헤르만 헤세"],
        "thumbnail_url": "https://..."
      },
      "status": "READ",
      "created_at": "2025-06-01T00:00:00Z"
    }
  ],
  "counts": {
    "READ": 5,
    "READING": 2,
    "WISHLIST": 3
  }
}
```

---

## 책 상태 수정

### PATCH `/user-books/{userBookId}`

**요청**
```json
{ "status": "READ" }
```

**응답 200**
```json
{ "user_book_id": "uuid", "status": "READ" }
```

**에러**
- `403 FORBIDDEN` — 본인 책 아닌 경우
- `404 NOT_FOUND` — 존재하지 않는 user_book_id

---

## 책 삭제

### DELETE `/user-books/{userBookId}`

**응답 204** No Content

**에러**
- `403 FORBIDDEN` — 본인 책 아닌 경우

---

## 독서 지도 생성

### POST `/reading-maps/generate`
READ 책 기반 AI 분석 → DB 저장 → 결과 반환

**Rate Limit:** 사용자당 5회/일

**처리 순서**
1. user_books에서 READ 상태 책 조회
2. READ 책 3권 미만 → `422 INSUFFICIENT_BOOKS`
3. 프롬프트 구성 (구조화 JSON, 인젝션 방어)
4. Gemini API 호출 (JSON 응답 강제)
5. JSON 파싱 실패 시 재시도 1회 → 실패 시 `500 AI_PARSE_ERROR`
6. reading_maps + reading_map_books 저장
7. 결과 반환

**응답 201** — reading_map 전체 객체
```json
{
  "id": "uuid",
  "reader_type": "자아 탐구형 독자",
  "themes": ["실존", "자유", "정체성", "고독"],
  "keywords": ["자기 발견", "내면 탐구"],
  "current_position": "실존주의 입문 단계",
  "summary": "사용자는 자아와 세계의 관계를 탐구하는 방향으로...",
  "path_json": [
    { "title": "데미안", "connection": "자아 발견의 출발점" },
    { "title": "싯다르타", "connection": "내면 수행과 자기 이해의 확장" }
  ],
  "next_path_json": [
    { "title": "시지프 신화", "reason": "부조리를 더 직접적으로 다루는 자연스러운 다음 경로" }
  ],
  "ai_model": "gemini-1.5-flash",
  "book_count": 3,
  "created_at": "2025-06-01T00:00:00Z"
}
```

**에러**
- `422 INSUFFICIENT_BOOKS` — READ 책 3권 미만
- `429 RATE_LIMIT_EXCEEDED` — 일 5회 초과
- `500 AI_PARSE_ERROR` — AI 응답 파싱 실패

---

## 독서 지도 조회

### GET `/reading-maps/latest`
가장 최근 독서 지도 결과 조회

**응답 200** — reading_map 전체 객체
**응답 404** — 아직 생성된 지도 없음

---

### GET `/reading-maps`
분석 기록 목록 조회 (생성일, 책 수, 독서 유형 요약)

> MVP 후순위 구현
