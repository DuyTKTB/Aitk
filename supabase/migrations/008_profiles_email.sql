-- ============================================================
-- 008_profiles_email.sql — Thêm cột email cho bảng profiles
-- ------------------------------------------------------------
-- Lý do: các trang admin (Dashboard, ProUserManager) truy vấn
-- profiles.email nhưng bảng chưa có cột → PostgREST lỗi 42703 → HTTP 400.
-- Chạy trong Supabase Dashboard → SQL Editor → Run.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Cho phép người dùng tự tạo/cập nhật dòng profile của chính mình
-- (điền email khi đăng nhập). Policy permissive — OR với policy hiện có.
DROP POLICY IF EXISTS profiles_self_write ON public.profiles;
CREATE POLICY profiles_self_write ON public.profiles
  FOR ALL TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT auth.jwt() ->> 'admin') = 'true')
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT auth.jwt() ->> 'admin') = 'true');
