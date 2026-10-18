-- ============================================================
-- 007_rls_lockdown.sql — SIẾT BẢO MẬT SUPABASE
-- YÊU CẦU TIỀN KIỆN: bật "Third-party Auth (Firebase)" trong
-- Supabase Dashboard → Authentication → Third-Party Auth,
-- và client đăng nhập Supabase bằng Firebase ID token.
-- TRƯỚC KHI bật client: KHÔNG chạy file này (app sẽ gãy).
-- ============================================================

-- ===== 1. NỘI DUNG CÔNG KHAI — ai cũng đọc được =====
-- (Đề thi, câu hỏi, đáp án, môn, khối, chủ đề: nội dung học công khai)
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exams_read ON public.exams;
CREATE POLICY exams_read ON public.exams FOR SELECT USING (true);
-- Ghi đề chỉ dành cho giáo viên đã đăng nhập Supabase
DROP POLICY IF EXISTS exams_write ON public.exams;
CREATE POLICY exams_write ON public.exams FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS questions_read ON public.questions;
CREATE POLICY questions_read ON public.questions FOR SELECT USING (true);
DROP POLICY IF EXISTS questions_write ON public.questions;
CREATE POLICY questions_write ON public.questions FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS answers_read ON public.answers;
CREATE POLICY answers_read ON public.answers FOR SELECT USING (true);
DROP POLICY IF EXISTS answers_write ON public.answers;
CREATE POLICY answers_write ON public.answers FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Bảng danh mục (nếu có): subjects, grades, topics — chỉ đọc
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['subjects','grades','topics'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I_read ON public.%I', t, t);
      EXECUTE format('CREATE POLICY %I_read ON public.%I FOR SELECT USING (true)', t, t);
    END IF;
  END LOOP;
END $$;

-- ===== 2. DỮ LIỆU CÁ NHÂN — CHỈ CHỦ SỞ HỮU =====
-- (các bảng đã có policy riêng từ migration 004 giữ nguyên)

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['exam_attempts','exam_sessions','paper_pdfs'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = t AND table_schema = 'public'
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND table_schema = 'public' AND column_name = 'user_id')
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I_owner ON public.%I', t, t);
      EXECUTE format('CREATE POLICY %I_owner ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t, t);
    END IF;
  END LOOP;
END $$;

-- user_answers: không có user_id → kiểm tra qua attempt (attempt thuộc user)
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_answers_owner ON public.user_answers;
CREATE POLICY user_answers_owner ON public.user_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );

-- ===== 3. BẢNG TÍN DỤNG / VIP — CHỈ ĐỌC, GHI QUA ADMIN =====
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['credits','credit_orders','pro_users'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I_read ON public.%I', t, t);
      EXECUTE format('CREATE POLICY %I_read ON public.%I FOR SELECT USING (auth.uid() = user_id OR auth.role() = ''authenticated'')', t, t);
      EXECUTE format('DROP POLICY IF EXISTS %I_write ON public.%I', t, t);
      EXECUTE format('CREATE POLICY %I_write ON public.%I FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')', t, t);
    END IF;
  END LOOP;
END $$;

SELECT '007 OK — RLS đã siết. Kiểm tra: SELECT tablename, policyname FROM pg_policies WHERE schemaname=''public'' ORDER BY tablename;' AS status;
