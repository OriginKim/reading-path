# Security — 보안 설계

---

## MVP 필수 보안 (런칭 전 완료 목록)

| 항목 | 구현 방법 | 위치 |
|------|-----------|------|
| 인증 | NextAuth.js Google OAuth + JWT 검증 미들웨어 | 프론트/백엔드 |
| 소유권 체크 | 모든 user_books, reading_maps API에서 user_id 일치 검증 | FastAPI |
| SQL Injection 방어 | SQLAlchemy ORM 사용, raw query 금지 | FastAPI |
| 입력 검증 | FastAPI Pydantic 스키마 강제 | FastAPI |
| CORS | 허용 도메인 화이트리스트 (readingpath.kr만) | FastAPI |
| 보안 헤더 | XSS, Clickjacking 방어 헤더 | next.config.js |
| Rate Limit | slowapi: AI 분석 5회/일, 전체 API 60회/분 | FastAPI |
| Secret 관리 | .env + Vercel/Railway 환경변수, 코드 하드코딩 금지 | 전체 |
| RLS | Supabase Row Level Security 정책 | Supabase |
| 프롬프트 인젝션 | 사용자 입력을 JSON 구조 안에 격리, 길이 제한 | FastAPI AI 로직 |

---

## JWT 검증 미들웨어 (FastAPI)

모든 인증 필요 엔드포인트에 적용.
NextAuth가 발급한 JWT를 FastAPI에서 검증한다.

```python
# 의존성 주입 방식
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401)
        return await get_user_by_id(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## 소유권 검증 패턴

user_books, reading_maps 조회/수정/삭제 시 반드시 user_id 일치 확인.

```python
# 잘못된 방식 — user_book_id만으로 조회
user_book = await db.get(UserBook, user_book_id)

# 올바른 방식 — user_id 함께 검증
user_book = await db.query(UserBook).filter(
    UserBook.id == user_book_id,
    UserBook.user_id == current_user.id  # 반드시 포함
).first()

if not user_book:
    raise HTTPException(status_code=403, detail="FORBIDDEN")
```

---

## CORS 설정 (FastAPI)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://readingpath.kr", "https://www.readingpath.kr"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

로컬 개발 시: `allow_origins`에 `http://localhost:3000` 추가 (환경변수로 분기).

---

## 보안 헤더 (Next.js)

```js
// next.config.js
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  },
];
```

---

## Rate Limit (slowapi)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# AI 분석 엔드포인트 — 사용자당 5회/일
@router.post("/reading-maps/generate")
@limiter.limit("5/day")
async def generate_reading_map(...):
    ...

# 전체 API — 60회/분
@app.middleware("http")
@limiter.limit("60/minute")
async def global_rate_limit(...):
    ...
```

---

## 프롬프트 인젝션 방어

사용자 입력(책 제목, 저자, 설명)을 AI 프롬프트 문자열에 직접 삽입하지 않는다.

```python
# 잘못된 방식
prompt = f"다음 책들을 분석해주세요: {book['title']} by {book['authors']}"

# 올바른 방식 — JSON 구조 안에 격리
book_data = {
    "title": book["title"][:100],         # 길이 제한
    "authors": book["authors"][:3],       # 개수 제한
    "description": book.get("description", "")[:300]  # 길이 제한
}
prompt = SYSTEM_PROMPT + json.dumps({"books": [book_data]}, ensure_ascii=False)
```

---

## 에러 핸들링 — 스택트레이스 차단

```python
# production 환경에서 스택트레이스 노출 금지
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    if settings.ENV == "production":
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_ERROR", "message": "서버 오류가 발생했습니다."}}
        )
    raise exc  # 개발 환경에서는 전체 에러 출력
```

---

## 소프트 오픈 이후 추가 예정

- `pip audit`, `npm audit` 월 1회 실행
- NextAuth session maxAge 설정 (7일)
- AI 응답 이상값 감지 로깅

---

## 현재 단계에서 불필요한 것

RBAC, 2FA, AuditLog, DB 권한 분리, 민감 필드 암호화, CSRF
(NextAuth httpOnly 쿠키로 CSRF 기본 방어됨)
