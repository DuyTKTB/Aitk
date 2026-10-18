  -- ============================================================
  -- 004_wrong_questions.sql — Sổ tay lỗi sai + RLS
  -- Chạy trong Supabase Dashboard → SQL Editor (chạy 1 lần)
  -- ============================================================

  -- 1. Bảng (IF NOT EXISTS — nếu đã có thì bỏ qua)
  CREATE TABLE IF NOT EXISTS public.wrong_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id bigint REFERENCES public.questions(id) ON DELETE CASCADE,
    attempt_id uuid REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
    wrong_count int NOT NULL DEFAULT 1,
    mastered boolean NOT NULL DEFAULT false,
    last_wrong_at timestamptz DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, question_id)
  );

  CREATE INDEX IF NOT EXISTS idx_wq_user ON public.wrong_questions(user_id);
  CREATE INDEX IF NOT EXISTS idx_wq_question ON public.wrong_questions(question_id);

  -- 2. Bảng câu đã lưu (nếu chưa có)
  CREATE TABLE IF NOT EXISTS public.saved_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id bigint REFERENCES public.questions(id) ON DELETE CASCADE,
    note text,
    saved_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, question_id)
  );

  -- 3. RLS — chỉ chủ sở hữu đụng được dữ liệu của mình
  ALTER TABLE public.wrong_questions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS wq_select ON public.wrong_questions;
  CREATE POLICY wq_select ON public.wrong_questions
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS wq_insert ON public.wrong_questions;
  CREATE POLICY wq_insert ON public.wrong_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS wq_update ON public.wrong_questions;
  CREATE POLICY wq_update ON public.wrong_questions
    FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS wq_delete ON public.wrong_questions;
  CREATE POLICY wq_delete ON public.wrong_questions
    FOR DELETE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS sq_select ON public.saved_questions;
  CREATE POLICY sq_select ON public.saved_questions
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS sq_insert ON public.saved_questions;
  CREATE POLICY sq_insert ON public.saved_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS sq_delete ON public.saved_questions;
  CREATE POLICY sq_delete ON public.saved_questions
    FOR DELETE USING (auth.uid() = user_id);

  -- 4. UNIQUE ràng buộc cần có để logic "đã có → tăng count" hoạt động
  --    (nếu UNIQUE (user_id, question_id) đã tồn tại thì lệnh trên tự bỏ qua lỗi)
