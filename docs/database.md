# Database — DB 스키마

> DB: PostgreSQL via Supabase
> RLS(Row Level Security) 필수 적용

---

## 테이블 목록

| 테이블 | 역할 |
|--------|------|
| `users` | 사용자 계정 (Google OAuth) |
| `books` | 책 마스터 데이터 (카카오/Google Books) |
| `user_books` | 사용자별 책 등록 + 상태 |
| `reading_maps` | AI 독서 지도 분석 결과 |
| `reading_map_books` | 독서 지도와 책의 관계 |

---

## 스키마

### users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(100),
  profile_image TEXT,
  provider      VARCHAR(20) NOT NULL DEFAULT 'google',
  provider_id   VARCHAR(255) UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### books

```sql
CREATE TABLE books (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id    VARCHAR(255) UNIQUE NOT NULL,  -- 카카오 ISBN or Google Books ID
  title          VARCHAR(500) NOT NULL,
  authors        TEXT[],                         -- 저자 배열
  publisher      VARCHAR(255),
  published_date VARCHAR(20),
  description    TEXT,
  thumbnail_url  TEXT,
  isbn           VARCHAR(20),
  source         VARCHAR(20) NOT NULL DEFAULT 'kakao',  -- 'kakao' | 'google'
  affiliate_url  TEXT,                           -- 알라딘 파트너스 링크 (수익화용, 초기 NULL)
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

> `affiliate_url`: 수익화 시점에 채워 넣을 컬럼. 스키마 변경 없이 대응 가능하도록 선배치.

### user_books

```sql
CREATE TABLE user_books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL CHECK (status IN ('READ', 'READING', 'WISHLIST')),
  started_at  DATE,
  finished_at DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)  -- 동일 책 중복 등록 방지
);
```

### reading_maps

```sql
CREATE TABLE reading_maps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_type      VARCHAR(100),             -- "자아 탐구형 독자"
  themes           TEXT[],                   -- ["실존", "자유", "정체성"]
  keywords         TEXT[],                   -- ["자기 발견", "내면 탐구"]
  current_position VARCHAR(255),             -- "실존주의 입문 단계"
  summary          TEXT,                     -- 전체 흐름 요약
  path_json        JSONB NOT NULL,           -- 독서 흐름 배열
  next_path_json   JSONB NOT NULL,           -- 다음 경로 배열
  ai_model         VARCHAR(50),              -- "gemini-1.5-flash"
  book_count       INT,                      -- 분석 시점 READ 책 수
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### reading_map_books

```sql
CREATE TABLE reading_map_books (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_map_id UUID NOT NULL REFERENCES reading_maps(id) ON DELETE CASCADE,
  book_id        UUID NOT NULL REFERENCES books(id),
  sequence_order INT,
  role           VARCHAR(20) NOT NULL CHECK (role IN ('INPUT', 'NEXT_RECOMMENDATION')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## RLS 정책 (Supabase)

```sql
-- users: 본인만 조회/수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self_only" ON users
  USING (id = auth.uid());

-- user_books: 본인 행만
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_books_self_only" ON user_books
  USING (user_id = auth.uid());

-- reading_maps: 본인 행만
ALTER TABLE reading_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_maps_self_only" ON reading_maps
  USING (user_id = auth.uid());
```

> **주의:** Supabase RLS는 정책 외에 `GRANT` 권한도 별도 확인 필요.
> RLS만 설정하고 GRANT를 빠뜨리면 anon/authenticated 역할에서 접근 불가.

---

## 인덱스 (성능)

```sql
-- 사용자별 책 목록 조회 최적화
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_status ON user_books(user_id, status);

-- 독서 지도 최신 조회 최적화
CREATE INDEX idx_reading_maps_user_id ON reading_maps(user_id, created_at DESC);
```

---

## ERD (간략)

```
users ──────< user_books >────── books
  │                                 │
  └──────< reading_maps >──────< reading_map_books >── books
```
