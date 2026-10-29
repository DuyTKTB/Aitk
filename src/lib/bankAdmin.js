/* ============================================================
   bankAdmin.js — Duyệt & gắn chuyên đề cho ngân hàng câu hỏi
   ------------------------------------------------------------
   Chỉ dùng cho giáo viên/quản trị: Lộ trình kiến thức và mọi thống
   kê theo chương chỉ có số khi questions.topic_id đúng.

   LƯU Ý BẢO MẬT (đọc kỹ trước khi mở rộng):
   Client này gọi Supabase bằng anon key. Hiện bảng `questions` cho
   phép ghi từ client (đã kiểm chứng PATCH trả 204), tức là CHƯA có
   RLS chặt. Vì vậy UI này chỉ là công cụ soạn dữ liệu, KHÔNG phải
   lớp bảo mật. Việc siết quyền phải làm ở Supabase (xem báo cáo).
   ============================================================ */

import { supabase } from './supabase.js';

const MAX_QUESTIONS = 400;

export const isBankAdminAvailable = () => !!supabase;

export async function loadBankOverview() {
  if (!supabase) return { exams: [], questions: [], error: 'Chưa cấu hình Supabase' };
  try {
    const [examsRes, qRes] = await Promise.all([
      supabase.from('exams').select('id, title, is_published, grade_id, subject_id').order('created_at', { ascending: false }).limit(60),
      supabase
        .from('questions')
        .select('id, exam_id, content, topic_id, difficulty, explanation')
        .order('created_at', { ascending: true })
        .limit(MAX_QUESTIONS),
    ]);
    if (examsRes.error) throw examsRes.error;
    if (qRes.error) throw qRes.error;
    return { exams: examsRes.data || [], questions: qRes.data || [], error: null };
  } catch (e) {
    return { exams: [], questions: [], error: e?.message || 'Không tải được ngân hàng câu hỏi' };
  }
}

/** Gắn cùng một chuyên đề cho nhiều câu (hoặc bỏ gắn khi topicId = null) */
export async function assignTopic(ids, topicId) {
  if (!supabase) return { ok: false, error: 'Chưa cấu hình Supabase' };
  const list = (ids || []).filter(Boolean);
  if (!list.length) return { ok: false, error: 'Chưa chọn câu nào' };
  try {
    const { error } = await supabase
      .from('questions')
      .update({ topic_id: topicId || null })
      .in('id', list);
    if (error) throw error;
    return { ok: true, count: list.length, error: null };
  } catch (e) {
    return { ok: false, error: e?.message || 'Không lưu được chuyên đề' };
  }
}

/** Đếm nhanh: tổng số câu và số câu đã gắn chuyên đề */
export function summarize(questions = []) {
  const total = questions.length;
  const tagged = questions.filter((q) => q.topic_id).length;
  return { total, tagged, untagged: total - tagged };
}
