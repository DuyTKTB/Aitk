-- ============================================================
-- 003_topic_id_text.sql — Sửa cột questions.topic_id
-- ------------------------------------------------------------
-- Vấn đề: cột questions.topic_id đang là SỐ NGUYÊN, trong khi toàn bộ app
-- (ExamEditor, AIQuizGenerator, WrongNotebook, chemTopics.js) dùng id chuyên đề
-- dạng CHỮ (vd 'c11-este'). Khi lưu câu hỏi có chọn chuyên đề, Supabase trả:
--   invalid input syntax for type integer: "c11-este"
-- Cách chạy: Supabase Dashboard → SQL Editor → dán file này → Run.
-- ============================================================

-- 1. Nếu có khoá ngoài từ questions.topic_id sang bảng topics thì gỡ trước
--    (tên ràng buộc có thể khác — script tự tìm theo cột)
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'questions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'topic_id'
  LOOP
    EXECUTE format('ALTER TABLE public.questions DROP CONSTRAINT %I', con.constraint_name);
    RAISE NOTICE 'Đã gỡ ràng buộc: %', con.constraint_name;
  END LOOP;
END $$;

-- 2. Đổi kiểu cột sang TEXT (giữ nguyên giá trị số cũ dạng chuỗi)
ALTER TABLE public.questions
  ALTER COLUMN topic_id DROP DEFAULT,
  ALTER COLUMN topic_id TYPE text
  USING CASE WHEN topic_id IS NULL THEN NULL ELSE topic_id::text END;

-- 3. Tạo chỉ mục phụ trợ cho lọc theo chuyên đề (dùng ở WrongNotebook / game)
CREATE INDEX IF NOT EXISTS questions_topic_id_idx
  ON public.questions (topic_id);

-- ============================================================
-- HOÀN TẤT. Sau khi chạy: tải lại trang Sửa đề → chọn chuyên đề và lưu bình thường.
-- ============================================================
