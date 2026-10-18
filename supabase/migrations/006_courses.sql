-- ============================================================
-- 006_courses.sql — KHÓA HỌC THEO CHƯƠNG/SLIDE
-- Course → Chapter → Slide (slide_type: text/video/image)
-- Chạy trong Supabase SQL Editor (1 lần)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text,
  grade text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.course_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.course_chapters(id) ON DELETE CASCADE,
  slide_type text NOT NULL DEFAULT 'text' CHECK (slide_type IN ('text','video','image')),
  title text NOT NULL DEFAULT '',
  content text,          -- text: nội dung | video: URL | image: URL Storage
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.slide_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slide_id uuid NOT NULL REFERENCES public.course_slides(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slide_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chapters_course ON public.course_chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_slides_chapter ON public.course_slides(chapter_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.slide_progress(user_id);

-- RLS: giáo viên sở hữu khóa, học sinh đăng nhập đọc + tự ghi tiến độ mình
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slide_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY courses_owner ON public.courses
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY ch_read ON public.course_chapters
  FOR SELECT USING (true);
CREATE POLICY ch_write ON public.course_chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.teacher_id = auth.uid())
  );

CREATE POLICY sl_read ON public.course_slides
  FOR SELECT USING (true);
CREATE POLICY sl_write ON public.course_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.course_chapters ch
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ch.id = chapter_id AND c.teacher_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_chapters ch
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ch.id = chapter_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY sp_self ON public.slide_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT '006 OK — bảng khóa học đã sẵn sàng' AS status;
