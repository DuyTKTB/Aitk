-- ============================================================
-- Migration: AI Chats
-- Chạy 1 lần trong Supabase SQL Editor
-- ============================================================

-- Bảng chính
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Trò chuyện mới',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để query nhanh
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_updated
  ON ai_chats(user_id, updated_at DESC);

-- ============================================================
-- Row Level Security — chỉ chủ sở hữu mới truy cập
-- ============================================================
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có (để migration idempotent)
DROP POLICY IF EXISTS "Users can view own chats"   ON ai_chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON ai_chats;
DROP POLICY IF EXISTS "Users can update own chats" ON ai_chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON ai_chats;

-- SELECT: chỉ xem chat của mình
CREATE POLICY "Users can view own chats"
  ON ai_chats FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: chỉ tạo chat với user_id của mình
CREATE POLICY "Users can insert own chats"
  ON ai_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: chỉ sửa chat của mình
CREATE POLICY "Users can update own chats"
  ON ai_chats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: chỉ xóa chat của mình
CREATE POLICY "Users can delete own chats"
  ON ai_chats FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: tự cập nhật updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION ai_chats_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_chats_updated_at ON ai_chats;
CREATE TRIGGER trg_ai_chats_updated_at
  BEFORE UPDATE ON ai_chats
  FOR EACH ROW EXECUTE FUNCTION ai_chats_set_updated_at();

-- ============================================================
-- (Tuỳ chọn) Giới hạn số chat mỗi user — ví dụ 100 chat gần nhất
-- Chạy khi cần dọn dẹp
-- ============================================================
-- DELETE FROM ai_chats
-- WHERE id IN (
--   SELECT id FROM ai_chats
--   WHERE user_id = 'xxx'
--   ORDER BY updated_at DESC
--   OFFSET 100
-- );