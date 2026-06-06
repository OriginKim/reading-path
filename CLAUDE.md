# Reading Path — CLAUDE.md

> 이 파일을 읽으면 어떤 세션에서든 바로 작업할 수 있습니다.
> 세부 내용은 `docs/` 폴더의 각 문서를 참고하세요.

---

## 서비스 한 줄 정의

**사용자가 읽은 책들을 AI로 분석해, 그 독서 여정을 하나의 지도로 시각화해주는 서비스.**

- 책 추천 서비스가 아니다
- 독서 SNS가 아니다
- 독서 기록 앱이 아니다
- **"연결"과 "해석"과 "시각화"가 핵심 정체성이다**

---

## 레포지토리 정보

- **GitHub:** https://github.com/OriginKim/reading-path.git
- **로컬 경로:** `C:\Users\USER\Desktop\reading-path`
- **프론트엔드 배포:** Vercel
- **백엔드 배포:** Railway

---

## 폴더 구조

```
reading-path/
├── CLAUDE.md                  ← 현재 파일 (세션 진입점)
├── docs/
│   ├── architecture.md        ← 기술 스택, 시스템 구조, 라우팅
│   ├── database.md            ← DB 스키마 전체 (SQL 포함)
│   ├── api.md                 ← API 엔드포인트 명세
│   ├── ai-analysis.md         ← AI 분석 로직, 프롬프트, 파싱
│   ├── security.md            ← 보안 설계, RLS, Rate Limit
│   └── git-convention.md      ← 브랜치 전략, 커밋 규칙, PR 규칙
├── frontend/                  ← Next.js 14 (아직 미생성)
├── backend/                   ← FastAPI (아직 미생성)
└── .github/
    ├── ISSUE_TEMPLATE/        ← feat / fix / refactor / chore
    └── PULL_REQUEST_TEMPLATE.md
```

---

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14 + TypeScript + Tailwind CSS |
| 백엔드 | FastAPI (Python) |
| 인증 | NextAuth.js (Google OAuth) |
| DB | PostgreSQL via Supabase |
| 책 검색 | 카카오 책 검색 API (메인) + Google Books API (폴백) |
| AI 분석 | Gemini 1.5 Flash |
| 배포 | Vercel (프론트) + Railway (백엔드) |

---

## 개발 현황 (Phase 추적)

- [x] Phase 0 — 레포, 폴더 구조, 문서화, Git 세팅
- [x] Phase 1 — 기반 세팅 (Next.js + FastAPI + Supabase + 배포 연결)
  - [x] Next.js 16 + TypeScript + Tailwind + NextAuth v4
  - [x] FastAPI + SQLAlchemy ORM + 전체 API 구조
  - [x] supabase/schema.sql 작성 (Supabase SQL Editor에서 실행 필요)
  - [ ] Supabase 프로젝트 생성 + schema.sql 적용 (수동)
  - [ ] Vercel 배포 연결 (수동)
  - [ ] Railway 배포 연결 (수동)
- [ ] Phase 2 — 인증 (Google OAuth + JWT 미들웨어)
- [ ] Phase 3 — 책 검색 + 등록 (카카오 API + user_books CRUD)
- [ ] Phase 4 — AI 분석 파이프라인 (Gemini + 독서 지도 저장)
- [ ] Phase 5 — 독서 지도 결과 화면
- [ ] Phase 6 — 내 서재 완성 + UI 다듬기
- [ ] Phase 7 — 소프트 오픈 + 안정화 (2025년 9월)

---

## 핵심 개발 규칙 (절대 지키기)

1. 서비스 문구는 항상 **"연결"과 "해석"** 중심 — "추천"이라는 단어 사용 금지
2. AI 응답은 반드시 **JSON 형식** — 자유 텍스트 응답 허용 금지
3. 사용자 입력을 AI 프롬프트에 **직접 삽입 금지** (프롬프트 인젝션 방어)
4. READ 책 3권만 있어도 독서 지도 생성이 가능해야 함
5. 분석 결과는 매번 새로 생성하지 않고 **DB에 저장**해 재사용
6. **커뮤니티 기능** 절대 먼저 만들지 않기
7. AI 분석 엔드포인트에 **Rate Limit 반드시 적용** (사용자당 5회/일)
8. `.env`에 있는 값을 코드에 **하드코딩 금지**
9. SQLAlchemy ORM 사용 — **raw query 금지** (SQL Injection 방어)
10. 모든 API 응답에서 **스택트레이스 노출 금지** (production)

---

## 로컬 실행 명령어

> 세팅 완료 후 이 섹션을 업데이트하세요.

```bash
# 프론트엔드
cd frontend
npm install
npm run dev       # http://localhost:3000

# 백엔드
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000
```

---

## 환경변수 목록

> 실제 값은 `.env.local` (프론트) / `.env` (백엔드)에 관리. 코드에 절대 포함 금지.

**프론트엔드 (`frontend/.env.local`)**
```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_API_URL=
```

**백엔드 (`backend/.env`)**
```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
KAKAO_REST_API_KEY=
GOOGLE_BOOKS_API_KEY=
GEMINI_API_KEY=
JWT_SECRET=
ALLOWED_ORIGINS=
```

---

## 세부 문서 링크

| 문서 | 내용 |
|------|------|
| [architecture.md](docs/architecture.md) | 시스템 구조, 라우팅, 화면 목록, 사용자 흐름 |
| [database.md](docs/database.md) | 테이블 스키마 전체 SQL, RLS 정책 |
| [api.md](docs/api.md) | 모든 API 엔드포인트 요청/응답 명세 |
| [ai-analysis.md](docs/ai-analysis.md) | Gemini 프롬프트, 파싱 로직, 응답 예시 |
| [security.md](docs/security.md) | 인증, 소유권 체크, Rate Limit, 보안 헤더 |
| [git-convention.md](docs/git-convention.md) | 브랜치 전략, 커밋 메시지, PR 규칙 |
