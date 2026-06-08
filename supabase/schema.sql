-- Reading Path — Supabase 초기 스키마
-- Supabase SQL Editor에서 순서대로 실행하세요.

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(100),
  profile_image TEXT,
  provider      VARCHAR(20) NOT NULL DEFAULT 'google',
  provider_id   VARCHAR(255) UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. books
CREATE TABLE IF NOT EXISTS books (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id    VARCHAR(255) UNIQUE NOT NULL,
  title          VARCHAR(500) NOT NULL,
  authors        TEXT[],
  publisher      VARCHAR(255),
  published_date VARCHAR(20),
  description    TEXT,
  thumbnail_url  TEXT,
  isbn           VARCHAR(20),
  source         VARCHAR(20) NOT NULL DEFAULT 'kakao',
  affiliate_url  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. user_books
CREATE TABLE IF NOT EXISTS user_books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL CHECK (status IN ('READ', 'READING', 'WISHLIST')),
  started_at  DATE,
  finished_at DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 4. reading_maps
CREATE TABLE IF NOT EXISTS reading_maps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_type      VARCHAR(100),
  themes           TEXT[],
  keywords         TEXT[],
  current_position VARCHAR(255),
  summary          TEXT,
  path_json        JSONB NOT NULL,
  next_path_json   JSONB NOT NULL,
  ai_model         VARCHAR(50),
  book_count       INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. reading_map_books
CREATE TABLE IF NOT EXISTS reading_map_books (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_map_id UUID NOT NULL REFERENCES reading_maps(id) ON DELETE CASCADE,
  book_id        UUID NOT NULL REFERENCES books(id),
  sequence_order INT,
  role           VARCHAR(20) NOT NULL CHECK (role IN ('INPUT', 'NEXT_RECOMMENDATION')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_books_user_id    ON user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_status     ON user_books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reading_maps_user_id  ON reading_maps(user_id, created_at DESC);

-- RLS 활성화
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_maps ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (본인 행만 접근)
CREATE POLICY "users_self_only"        ON users        USING (id = auth.uid());
CREATE POLICY "user_books_self_only"   ON user_books   USING (user_id = auth.uid());
CREATE POLICY "reading_maps_self_only" ON reading_maps USING (user_id = auth.uid());

-- books, reading_map_books는 서비스 역할(service_role)로만 접근
-- 프론트 → FastAPI → Supabase 구조이므로 RLS 미적용 (의도된 설계)
