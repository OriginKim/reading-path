# Architecture — 시스템 구조

---

## 시스템 개요

```
[사용자 브라우저]
       │
       ▼
[Next.js 16 — Vercel]
  - 페이지 렌더링 (SSR/SSG)
  - NextAuth.js v5 (Google OAuth, 세션 관리)
  - Tailwind CSS UI
       │
       │ HTTP (JWT Bearer)
       ▼
[FastAPI — Railway]
  - REST API
  - JWT 검증 미들웨어
  - 비즈니스 로직
  - Rate Limit (slowapi)
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
[Supabase PostgreSQL]            [External APIs]
  - users                          - 카카오 책 검색 API
  - books                          - Google Books API (폴백)
  - user_books                     - Gemini 2.5 Flash
  - reading_maps
  - reading_map_books
  - RLS 정책 적용
```

---

## 라우팅 구조

| 경로 | 화면 | 인증 필요 | 비고 |
|------|------|-----------|------|
| `/` | 랜딩 페이지 | X | 로그인 상태면 `/library` 리다이렉트 |
| `/login` | 로그인 처리 | X | NextAuth 처리 |
| `/books/search` | 책 검색 | O | |
| `/library` | 내 서재 | O | READ/READING/WISHLIST 탭 |
| `/reading-map` | 독서 지도 결과 | O | Phase 5에서 전면 리디자인 |
| `/reading-map/history` | 분석 기록 | O | MVP 후순위 |

---

## 화면별 구성

### 랜딩 페이지 (`/`)
- 핵심 문구: "당신의 독서를 하나의 여정으로 보여드립니다"
- 예시 독서 지도 목업 (하드코딩): 데미안 → 싯다르타 → 이방인
- Google로 시작하기 버튼

### 책 검색 페이지 (`/books/search`)
- 검색창 (책 제목 / 저자명)
- 검색 결과 카드 (표지, 제목, 저자, 출판사)
- 상태 선택 버튼 (READ / READING / WISHLIST)
- 이미 등록된 책: "등록됨" 표시 + 상태 변경 가능

### 내 서재 페이지 (`/library`)
- 상단: 사용자 이름 + 책 등록 수 요약
- 탭: 읽은 책 / 읽는 중 / 읽고 싶은 책
- 책 카드: 표지, 제목, 저자, 상태 변경, 삭제
- READ 3권 이상 시 독서 지도 생성 CTA

### 독서 지도 결과 페이지 (`/reading-map`) — Phase 5 리디자인 예정
```
독자 유형        존재의 본질을 탐색하는 사색가
독서 여정 해석   (AI 분석 요약)
주제 흐름        인간 본성 · 생존 · 상실 · 성장
핵심 키워드      야생성 · 억압 · 성장통 · 회복
독서 흐름        책1 → 책2 → 책3 (실제 읽은 책만)
다음 탐색 방향   (책 제목 없이 방향성 텍스트만)

[공유 카드 생성] [다시 분석]
```

**Phase 5 핵심 목표:**
- 다크/라이트 모드 토글
- Spotify Wrapped 스타일의 임팩트 있는 디자인
- 공유 카드 (이미지 다운로드)
- nextPath 할루시네이션 제거

---

## 사용자 흐름

### 첫 방문
```
랜딩 → Google OAuth → 내 서재(비어있음) → 책 검색 → 등록
→ 독서 지도 생성(READ 3권↑) → AI 분석 로딩 → 결과 확인 → 공유 카드
```

### 재방문
```
자동 로그인(세션 유지) → 내 서재 → 새 책 등록 or 지도 재생성 → 공유
```

---

## MVP 범위

**포함**
- Google OAuth 로그인
- 카카오 책 검색 + 등록 + 상태 관리
- 내 서재 (READ / READING / WISHLIST)
- 독서 지도 생성 (AI 분석)
- 독서 지도 결과 화면 + 공유 카드
- 다크/라이트 모드

**제외 (MVP 이후)**
- 커뮤니티, 팔로우, 댓글, 좋아요
- 독서 모임 기능
- 리뷰 작성, 공개 프로필, 별점, 랭킹
- 알림, 결제, 모바일 앱
- 다국어(영어)
- 알라딘 파트너스 링크 (수익화)
