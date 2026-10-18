-- ============================================================
-- 005_question_types.sql — HỖ TRỢ DẠNG CÂU HỎI MỚI
-- Điền đáp án (fill) · Đúng/Sai (boolean)
-- Chạy trong Supabase SQL Editor (1 lần)
-- ============================================================

-- 1. Nới rộng question_type
-- BƯỚC BẮT BUỘC: bảng hiện có CHECK constraint chặn giá trị lạ → gỡ rồi thêm lại bộ mới
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE public.questions
  ALTER COLUMN question_type TYPE text;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN ('single_choice', 'multiple_choice', 'mcq', 'fill', 'boolean'));

-- Đảm bảo giá trị hợp lệ: 'mcq' | 'fill' | 'boolean'
UPDATE public.questions
SET question_type = 'mcq'
WHERE question_type IS NULL OR question_type NOT IN ('mcq', 'fill', 'boolean');

-- 2. user_answers: thêm cột lưu ĐÁP ÁN CHỮ (dùng cho fill)
--    (trắc nghiệm vẫn dùng selected_answer_id như cũ)
ALTER TABLE public.user_answers
  ADD COLUMN IF NOT EXISTS answer_text text;

-- 3. Quy ước dữ liệu cho 'fill':
--    - questions.explanation giữ nguyên
--    - answers: CHÍNH XÁC 1 dòng, label = '=', content = đáp án đúng
--      (chấp nhận nhiều biến thể → thêm nhiều dòng label '=', is_correct = true)
--    Ví dụ: đáp án 2 → 2 dòng: label '=', content '2'
--                                label '=', content '2.0'
-- 4. Quy ước cho 'boolean': 2 dòng answers
--    label = 'Đ' content 'Đúng'  is_correct = true|false
--    label = 'S' content 'Sai'   is_correct = ngược lại

-- 5. RLS cho user_answers nếu chưa có (chấp nhận cả hai kiểu user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_answers' AND policyname = 'ua_owner'
  ) THEN
    CREATE POLICY ua_owner ON public.user_answers
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. Đánh giá nhanh số câu theo loại (kiểm tra sau khi chạy)
SELECT question_type, COUNT(*) FROM public.questions GROUP BY 1;
