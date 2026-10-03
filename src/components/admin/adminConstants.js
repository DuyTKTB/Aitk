/* Hằng số dùng chung cho toàn bộ khu vực quản trị */

export const EXAM_TYPES = [
  { id: 'giua_ky', name: 'Giữa kỳ', duration: 45 },
  { id: 'cuoi_ky', name: 'Cuối kỳ', duration: 50 },
  { id: 'thpt', name: 'THPT Quốc gia', duration: 50 },
  { id: 'chuyen_de', name: 'Chuyên đề', duration: 45 },
  { id: 'khao_sat', name: 'Khảo sát', duration: 15 },
];

export const DIFFICULTIES = [
  { id: 'easy', name: 'Dễ', short: 'Dễ', color: 'var(--post, #6fb35a)' },
  { id: 'medium', name: 'Trung bình', short: 'TB', color: 'var(--alkaline, #e0a43a)' },
  { id: 'hard', name: 'Khó', short: 'Khó', color: 'var(--alkali, #e2704f)' },
  { id: 'extreme', name: 'Rất khó', short: 'Rất khó', color: 'var(--lanthanide, #c0508a)' },
];

export const ROLES = [
  { id: 'user', name: 'Học sinh' },
  { id: 'teacher', name: 'Giáo viên' },
  { id: 'admin', name: 'Quản trị' },
];

export const ANSWER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const diffName = (id) => DIFFICULTIES.find((d) => d.id === id)?.name || id || '—';
export const diffColor = (id) => DIFFICULTIES.find((d) => d.id === id)?.color || 'var(--soft)';
