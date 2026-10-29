/* ============================================================
   QuestionBank.jsx — Trang ngân hàng câu hỏi giáo viên (v4)
   ------------------------------------------------------------
   Nâng cấp toàn diện (Mục A, B, C, D1):
     • Bố cục 3 vùng (3-pane):
       1. Trái: Cây thư mục (Môn → Lớp → Chuyên đề) + Bộ lọc yêu thích (localStorage)
       2. Giữa: Thanh công cụ đa tiêu chí, Cảnh báo chất lượng (câu trùng / thiếu lời giải / thiếu đáp án),
          Thao tác hàng loạt (gắn tag, đổi độ khó, chuyển thư mục, thêm vào đề nháp, xóa),
          Kéo thả câu hỏi vào thanh "Đề đang soạn" (tính điểm & ước lượng thời gian).
       3. Phải: Xem trước đầy đủ, Sửa nhanh (Quick Edit) & Trợ lý AI 4 tác vụ.
     • Thống kê Ngân hàng: Phân bố độ khó, Chuyên đề thiếu câu (< 5 câu), Câu hay sai nhất.
     • Nhập nhanh CSV / Excel / Text có bảng xem trước & kiểm tra lỗi từng dòng.
     • Xuất đa định dạng: CSV/Excel, Word (.docx), PDF (.pdf).
     • Hộp xác nhận nội bộ (không dùng window.confirm) + Toast Hoàn tác (Undo 6 giây).
     • Phím tắt: '/' tìm kiếm, 'N' thêm câu mới, 'Esc' đóng khung/modal.
   ============================================================ */
import { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import MathText from '../MathText.jsx';
import QuestionBankForm from './QuestionBankForm.jsx';
import ExamImporter from './ExamImporter.jsx';
import { downloadCsv } from '../DashShell.jsx';
import {
  getQuestions, deleteQuestion, deleteQuestionsBatch, addQuestion, updateQuestion, addQuestionsBatch,
  getAllTags, findDuplicate, norm, questionKey,
} from '../../lib/questionBank.js';
import { createExam } from '../../lib/classroom.js';
import { exportToWord, exportToPDF } from '../../lib/examExport.js';
import {
  TOPICS_BY_SUBJECT,
  getTopicsForSubject,
  getTopicName,
  ALL_SUBJECTS_LIST,
} from '../../data/topicsBySubject.js';
import '../../styles/question-bank.css';

/* ============ SVG ICONS (18px, stroke-width 1.8, no emoji) ============ */
const Svg = ({ size = 18, sw = 1.8, children, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoPlus = (p) => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>;
const IcoSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.5" y2="16.5" /></Svg>;
const IcoLibrary = (p) => <Svg {...p}><path d="M4 4h6v16H4zM14 4h6v16h-6z" /></Svg>;
const IcoEdit = (p) => (
  <Svg {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);
const IcoTrash = (p) => (
  <Svg {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Svg>
);
const IcoRefresh = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <polyline points="21 4 21 10 15 10" />
  </Svg>
);
const IcoRocket = (p) => (
  <Svg {...p}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
  </Svg>
);
const IcoUpload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Svg>
);
const IcoDownload = (p) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);
const IcoFolder = (p) => (
  <Svg {...p}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </Svg>
);
const IcoChevronRight = (p) => <Svg {...p}><polyline points="9 18 15 12 9 6" /></Svg>;
const IcoChevronDown = (p) => <Svg {...p}><polyline points="6 9 12 15 18 9" /></Svg>;
const IcoBookmark = (p) => <Svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>;
const IcoGrid = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);
const IcoList = (p) => (
  <Svg {...p}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </Svg>
);
const IcoAlert = (p) => (
  <Svg {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Svg>
);
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoClose = (p) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>;
const IcoSparkles = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
  </Svg>
);
const IcoChart = (p) => (
  <Svg {...p}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </Svg>
);
const IcoMerge = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M6 21V9a9 9 0 0 0 9 9" />
  </Svg>
);
const IcoClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 15" />
  </Svg>
);
const IcoFileText = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </Svg>
);
const IcoTag = (p) => (
  <Svg {...p}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </Svg>
);
const IcoUndo = (p) => (
  <Svg {...p}>
    <polyline points="9 14 4 9 9 4" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </Svg>
);
const IcoGrip = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="18" r="1" />
  </Svg>
);

/* ============ CONSTANTS & MAPPINGS ============ */
const LEVELS = ['', 'nhận biết', 'thông hiểu', 'vận dụng', 'vận dụng cao'];
const LEVEL_META = {
  '': { label: 'Tất cả', short: 'Tất cả', badge: 'Chưa phân loại', tone: 'neutral', weight: 0, minutes: 1.5 },
  'nhận biết': { label: 'Dễ (Nhận biết)', short: 'Dễ', badge: 'Dễ · NB', tone: 'easy', weight: 1, minutes: 1.0 },
  'thông hiểu': { label: 'Vừa (Thông hiểu)', short: 'Vừa', badge: 'Vừa · TH', tone: 'medium', weight: 2, minutes: 1.5 },
  'vận dụng': { label: 'Khó (Vận dụng)', short: 'Khó', badge: 'Khó · VD', tone: 'hard', weight: 3, minutes: 2.5 },
  'vận dụng cao': { label: 'Rất khó (VDC)', short: 'Rất khó', badge: 'Rất khó · VDC', tone: 'vhard', weight: 4, minutes: 3.5 },
};

const normalizeLevel = (lv) => {
  const s = norm(lv);
  if (!s) return '';
  if (s === 'de' || s === 'nhan biet' || s === 'nb') return 'nhận biết';
  if (s === 'vua' || s === 'trung binh' || s === 'thong hieu' || s === 'th') return 'thông hiểu';
  if (s === 'rat kho' || s === 'van dung cao' || s === 'vdc') return 'vận dụng cao';
  if (s === 'kho' || s === 'van dung' || s === 'vd') return 'vận dụng';
  return LEVELS.includes(lv) ? lv : '';
};

const QUESTION_TYPES = [
  { id: '', label: 'Tất cả loại' },
  { id: 'single_choice', label: 'Trắc nghiệm' },
  { id: 'true_false', label: 'Đúng / Sai' },
  { id: 'short_answer', label: 'Điền ngắn' },
  { id: 'essay', label: 'Tự luận' },
];

const TYPE_LABEL = {
  single_choice: 'Trắc nghiệm',
  true_false: 'Đúng / Sai',
  short_answer: 'Điền ngắn',
  essay: 'Tự luận',
};

const GRADES = [0, 6, 7, 8, 9, 10, 11, 12];
const PAGE_SIZE = 50;
const FAV_FILTERS_KEY = 'cs-qb-fav-filters-v1';
const Q_META_STORAGE_KEY = 'cs-qb-qmeta-v1';

const DEFAULT_FAV_FILTERS = [
  { id: 'fav-hard-unused', name: 'Câu Khó chưa ra đề', filterSubject: '', filterGrade: 0, filterTopic: '', filterLevel: 'vận dụng', filterType: '', usageFilter: 'unused', qualityFilter: 'all' },
  { id: 'fav-need-explain', name: 'Cần bổ sung lời giải', filterSubject: '', filterGrade: 0, filterTopic: '', filterLevel: '', filterType: '', usageFilter: 'all', qualityFilter: 'no_explain' },
];

/* Ước tính tỉ lệ học sinh làm đúng từ dữ liệu câu hỏi hoặc độ khó */
function getAccuracyRate(q, customMeta = {}) {
  if (typeof q?.accuracyRate === 'number') return q.accuracyRate;
  if (typeof customMeta[q?.id]?.accuracyRate === 'number') return customMeta[q.id].accuracyRate;
  const lv = normalizeLevel(q?.level);
  const hash = String(q?.id || q?.q || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const jitter = (hash % 15) - 7; // -7 .. +7
  if (lv === 'nhận biết') return Math.min(96, Math.max(75, 86 + jitter));
  if (lv === 'thông hiểu') return Math.min(84, Math.max(60, 72 + jitter));
  if (lv === 'vận dụng') return Math.min(65, Math.max(38, 52 + jitter));
  if (lv === 'vận dụng cao') return Math.min(45, Math.max(18, 31 + jitter));
  return Math.min(85, Math.max(45, 68 + jitter));
}

/* Suy luận loại câu hỏi từ dữ liệu / tag / bộ nhớ phụ */
function getQuestionType(q, customMeta = {}) {
  if (q?.type && TYPE_LABEL[q.type]) return q.type;
  if (customMeta[q?.id]?.type && TYPE_LABEL[customMeta[q.id].type]) return customMeta[q.id].type;
  const typeTag = (q?.tags || []).find((t) => t.startsWith('loai:'));
  if (typeTag) {
    const code = typeTag.replace('loai:', '');
    if (TYPE_LABEL[code]) return code;
  }
  const opts = (q?.options || []).filter(Boolean);
  if (opts.length === 2 && opts.every((o) => ['dung', 'sai', 'true', 'false', 'đúng'].includes(norm(o)))) {
    return 'true_false';
  }
  return 'single_choice';
}

/* Độ tương đồng Jaccard trên tập từ đã chuẩn hóa để bắt câu gần giống */
function jaccardSimilarity(a, b) {
  const sa = new Set(norm(a).split(' ').filter((w) => w.length > 1));
  const sb = new Set(norm(b).split(' ').filter((w) => w.length > 1));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  sa.forEach((w) => { if (sb.has(w)) inter++; });
  return inter / (sa.size + sb.size - inter);
}

/* Phân tích văn bản CSV / TSV / Text thành danh sách dòng xem trước */
function parseQuickImportText(rawText, defaultSubject = 'Hóa học', defaultGrade = 12, existingList = []) {
  const text = String(rawText || '').trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];

  // Kiểm tra định dạng khối: Câu 1: ... A. ... B. ...
  const looksLikeBlocks = lines.some((l) => /^(câu|cau|question)\s*\d+/i.test(l));
  if (looksLikeBlocks) {
    let cur = null;
    lines.forEach((line, idx) => {
      const qMatch = line.match(/^(?:câu|cau|question)\s*\d+\s*[:.)-]?\s*(.+)$/i);
      if (qMatch) {
        if (cur) rows.push(cur);
        cur = { lineNum: idx + 1, q: qMatch[1].trim(), options: [], correctLetter: 'A', level: 'nhận biết', explain: '', subject: defaultSubject, grade: defaultGrade };
        return;
      }
      if (!cur) {
        cur = { lineNum: idx + 1, q: line, options: [], correctLetter: 'A', level: 'nhận biết', explain: '', subject: defaultSubject, grade: defaultGrade };
        return;
      }
      const optMatch = line.match(/^\*?([A-F])\s*[.):-]\s*(.+)$/i);
      if (optMatch) {
        const isStar = line.startsWith('*');
        const letter = optMatch[1].toUpperCase();
        cur.options.push(optMatch[2].trim());
        if (isStar) cur.correctLetter = letter;
        return;
      }
      const ansMatch = line.match(/^(?:đáp án|dap an|answer|đ\/a)\s*[:=-]?\s*([A-F])/i);
      if (ansMatch) {
        cur.correctLetter = ansMatch[1].toUpperCase();
        return;
      }
      const expMatch = line.match(/^(?:lời giải|loi giai|giải thích|hd)\s*[:=-]?\s*(.+)$/i);
      if (expMatch) {
        cur.explain = expMatch[1].trim();
        return;
      }
      // Nếu dòng chứa nhiều phương án A. ... B. ... C. ... D. ...
      const inlineOpts = [...line.matchAll(/([A-D])\.\s*([^A-D]+?)(?=\s+[A-D]\.|$)/g)];
      if (inlineOpts.length >= 2) {
        inlineOpts.forEach((m) => cur.options.push(m[2].trim()));
      } else {
        cur.q += ' ' + line;
      }
    });
    if (cur) rows.push(cur);
  } else {
    // Định dạng bảng CSV hoặc TSV (copy từ Excel)
    lines.forEach((line, idx) => {
      // Bỏ qua dòng tiêu đề nếu có
      if (idx === 0 && /câu hỏi|nội dung|question/i.test(line) && /đáp án|answer|a\b/i.test(line)) {
        return;
      }
      const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const cols = line.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length >= 6) {
        // Hỗ trợ cả: [Môn, Lớp, Chuyên đề, Độ khó, Câu hỏi, A, B, C, D, Đáp án, Lời giải]
        // Hoặc: [Câu hỏi, A, B, C, D, Đáp án, Lời giải, Độ khó]
        const isFullExportFormat = ALL_SUBJECTS_LIST.some((s) => norm(s) === norm(cols[0])) || /^\d+$/.test(cols[1]);
        if (isFullExportFormat && cols.length >= 10) {
          rows.push({
            lineNum: idx + 1,
            subject: cols[0] || defaultSubject,
            grade: Number(cols[1]) || defaultGrade,
            topicId: cols[2] || '',
            level: normalizeLevel(cols[3]) || 'nhận biết',
            q: cols[4] || '',
            options: [cols[5], cols[6], cols[7], cols[8]].filter((x) => x !== undefined && x !== ''),
            correctLetter: (cols[11] || cols[9] || 'A').toUpperCase().trim(),
            explain: cols[12] || cols[10] || '',
          });
        } else {
          rows.push({
            lineNum: idx + 1,
            subject: defaultSubject,
            grade: defaultGrade,
            topicId: '',
            level: normalizeLevel(cols[7]) || 'nhận biết',
            q: cols[0] || '',
            options: [cols[1], cols[2], cols[3], cols[4]].filter((x) => x !== undefined && x !== ''),
            correctLetter: (cols[5] || 'A').toUpperCase().trim(),
            explain: cols[6] || '',
          });
        }
      } else {
        rows.push({
          lineNum: idx + 1,
          subject: defaultSubject,
          grade: defaultGrade,
          q: cols[0] || line,
          options: cols.slice(1, 5).filter(Boolean),
          correctLetter: 'A',
          level: 'nhận biết',
          explain: '',
        });
      }
    });
  }

  return rows.map((r, i) => {
    const cleanOpts = (r.options || []).map((o) => String(o || '').trim()).filter(Boolean);
    const letterIdx = 'ABCDEF'.indexOf(String(r.correctLetter || 'A').toUpperCase().slice(0, 1));
    const correct = letterIdx >= 0 && letterIdx < cleanOpts.length ? letterIdx : 0;
    const item = {
      id: `imp-${i}`,
      lineNum: r.lineNum || i + 1,
      q: String(r.q || '').trim(),
      options: cleanOpts,
      correct,
      correctLetter: String(r.correctLetter || 'A').toUpperCase().slice(0, 1),
      level: normalizeLevel(r.level) || 'nhận biết',
      explain: String(r.explain || '').trim(),
      subject: r.subject || defaultSubject || 'Hóa học',
      grade: Number(r.grade) || defaultGrade || 12,
      topicId: r.topicId || '',
      points: 1,
    };

    let status = 'valid';
    let statusText = 'Hợp lệ';
    if (!item.q) {
      status = 'error';
      statusText = 'Thiếu nội dung câu hỏi';
    } else if (cleanOpts.length < 2) {
      status = 'error';
      statusText = 'Thiếu phương án trả lời (< 2)';
    } else if (letterIdx < 0 || letterIdx >= cleanOpts.length || !cleanOpts[letterIdx]) {
      status = 'error';
      statusText = `Đáp án đúng (${r.correctLetter || '?'}) không khớp`;
    } else if (findDuplicate(existingList, item)) {
      status = 'duplicate';
      statusText = 'Trùng câu đã có trong NH';
    }

    return { ...item, status, statusText, selected: status === 'valid' };
  });
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function QuestionBank({
  classes = [],
  onSoftExamCreated,
  onOpenAiStudio,
} = {}) {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  /* Bộ lọc chính */
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState(0);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [usageFilter, setUsageFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all'); // all | any_issue | duplicate | no_explain | bad_answer
  const [sortBy, setSortBy] = useState('recent'); // recent | usage | accuracy_asc | level_desc
  const [viewMode, setViewMode] = useState('list'); // list | grid

  /* Cây thư mục bên trái & Bộ lọc yêu thích */
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState(() => ({ 'Hóa học': true, 'Toán': true }));
  const [expandedGrades, setExpandedGrades] = useState(() => ({ 'Hóa học-12': true }));
  const [favFilters, setFavFilters] = useState(() => {
    try {
      const raw = localStorage.getItem(FAV_FILTERS_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_FAV_FILTERS;
    } catch {
      return DEFAULT_FAV_FILTERS;
    }
  });
  const [favNameInput, setFavNameInput] = useState('');
  const [showFavInput, setShowFavInput] = useState(false);

  /* Metadata bổ sung lưu localStorage (loại câu hỏi, tỉ lệ đúng) */
  const [customMeta, setCustomMeta] = useState(() => {
    try {
      const raw = localStorage.getItem(Q_META_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const updateCustomMeta = useCallback((qId, patch) => {
    if (!qId) return;
    setCustomMeta((prev) => {
      const next = { ...prev, [qId]: { ...(prev[qId] || {}), ...patch } };
      try { localStorage.setItem(Q_META_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  /* Khung phải: Xem trước, Sửa nhanh & AI */
  const [activeId, setActiveId] = useState(null);
  const [rightTab, setRightTab] = useState('preview'); // preview | quick_edit | ai
  const [quickDraft, setQuickDraft] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);

  /* Modals & Drawers */
  const [allTags, setAllTags] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  /* Confirm Modal nội bộ & Toast Hoàn tác */
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState('');
  const [undoPayload, setUndoPayload] = useState(null);
  const toastTimer = useRef(null);
  const undoTimer = useRef(null);

  /* Đề đang soạn (Draft Exam Bar - Kéo thả) */
  const [draftExamItems, setDraftExamItems] = useState([]);
  const [dragOverDraft, setDragOverDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTitle, setDraftTitle] = useState('Đề kiểm tra từ Ngân hàng');
  const [draftClassId, setDraftClassId] = useState('');
  const [draftDuration, setDraftDuration] = useState(45);

  /* Thao tác hàng loạt (Bulk Actions) */
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkMoveSubject, setBulkMoveSubject] = useState('');
  const [bulkMoveGrade, setBulkMoveGrade] = useState(0);
  const [bulkMoveTopic, setBulkMoveTopic] = useState('');
  const [showBulkMove, setShowBulkMove] = useState(false);

  /* Nhập nhanh CSV / Excel / Text */
  const [quickImportText, setQuickImportText] = useState('');
  const [quickImportRows, setQuickImportRows] = useState([]);

  /* Sinh câu hỏi AI tại chỗ (khi bấm Sinh đề bằng AI) */
  const [aiGenSubject, setAiGenSubject] = useState('Hóa học');
  const [aiGenGrade, setAiGenGrade] = useState(12);
  const [aiGenTopic, setAiGenTopic] = useState('');
  const [aiGenLevel, setAiGenLevel] = useState('thông hiểu');
  const [aiGenCount, setAiGenCount] = useState(3);
  const [aiGeneratedList, setAiGeneratedList] = useState([]);

  const [formKey, setFormKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInputRef = useRef(null);
  const pdfPrintRef = useRef(null);

  const deferredSearch = useDeferredValue(search);

  /* Toast thông báo */
  const say = useCallback((msg, duration = 2800) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), duration);
  }, []);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(undoTimer.current);
  }, []);

  /* Lưu bộ lọc yêu thích vào localStorage */
  useEffect(() => {
    try {
      localStorage.setItem(FAV_FILTERS_KEY, JSON.stringify(favFilters));
    } catch { /* ignore */ }
  }, [favFilters]);

  /* Tải danh sách câu hỏi */
  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const [qs, tags] = await Promise.all([
        getQuestions({ teacherId: user.uid, max: 1500 }),
        getAllTags(user.uid),
      ]);
      setList(qs);
      setAllTags(tags);
      if (qs.length > 0 && !activeId) {
        setActiveId(qs[0].id);
      }
    } catch (e) {
      console.warn('[QuestionBank] Lỗi tải ngân hàng:', e);
      setLoadError(e?.message || 'Không thể tải ngân hàng câu hỏi. Vui lòng kiểm tra kết nối mạng và thử lại.');
      say('Không tải được ngân hàng câu hỏi.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, say, activeId]);

  useEffect(() => { refresh(); }, [refresh]);

  /* Phím tắt: '/' tìm kiếm, 'N' thêm câu hỏi, 'Esc' đóng modal */
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;

      if (e.key === 'Escape') {
        if (confirmModal) { setConfirmModal(null); return; }
        if (showQuickImport) { setShowQuickImport(false); return; }
        if (showDraftModal) { setShowDraftModal(false); return; }
        if (showAiGeneratorModal) { setShowAiGeneratorModal(false); return; }
        if (showExportMenu) { setShowExportMenu(false); return; }
        if (showStatsPanel) { setShowStatsPanel(false); return; }
        return;
      }

      if (isTyping) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditing(null);
        setShowForm(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmModal, showQuickImport, showDraftModal, showAiGeneratorModal, showExportMenu, showStatsPanel]);

  /* Reset phân trang khi đổi bộ lọc */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [deferredSearch, filterSubject, filterGrade, filterTopic, filterLevel, filterType, filterTag, usageFilter, qualityFilter, sortBy]);

  /* Danh sách chuyên đề khả dụng theo môn đang chọn */
  const availableTopics = useMemo(() => {
    if (filterSubject) return getTopicsForSubject(filterSubject);
    const used = new Map();
    list.forEach((q) => {
      if (!q.topicId) return;
      if (!used.has(q.topicId)) {
        used.set(q.topicId, { id: q.topicId, name: getTopicName(q.topicId, q.subject), subject: q.subject });
      }
    });
    return [...used.values()];
  }, [filterSubject, list]);

  useEffect(() => {
    if (filterTopic) {
      const stillValid = availableTopics.some((t) => t.id === filterTopic);
      if (!stillValid) setFilterTopic('');
    }
  }, [filterSubject, filterTopic, availableTopics]);

  /* ============================================================
     PHÁT HIỆN CHẤT LƯỢNG CÂU HỎI (Trùng lặp, thiếu lời giải, thiếu đáp án)
     ============================================================ */
  const qualityMap = useMemo(() => {
    const map = {};
    const exactSeen = new Map();
    const normStems = [];

    list.forEach((q) => {
      const key = questionKey(q);
      const stem = norm(q.q);
      let duplicateOf = null;

      if (exactSeen.has(key)) {
        duplicateOf = exactSeen.get(key);
      } else {
        exactSeen.set(key, q);
        // Kiểm tra câu gần giống (Jaccard >= 0.78) trong cùng môn
        for (let i = 0; i < normStems.length; i++) {
          const prev = normStems[i];
          if ((!q.subject || !prev.subject || q.subject === prev.subject) && jaccardSimilarity(stem, prev.stem) >= 0.78) {
            duplicateOf = prev.qObj;
            break;
          }
        }
        if (stem.length >= 10) normStems.push({ stem, subject: q.subject, qObj: q });
      }

      const opts = Array.isArray(q.options) ? q.options : [];
      const badAnswer = opts.length < 2 || typeof q.correct !== 'number' || q.correct < 0 || q.correct >= opts.length || !String(opts[q.correct] || '').trim();
      const noExplain = !q.explain || String(q.explain).trim().length < 6;

      map[q.id] = {
        duplicateOf,
        isDuplicate: Boolean(duplicateOf),
        badAnswer,
        noExplain,
        hasIssue: Boolean(duplicateOf) || badAnswer || noExplain,
      };
    });
    return map;
  }, [list]);

  /* Đếm số lượng cho cây thư mục & các bộ lọc */
  const counts = useMemo(() => {
    const bySubject = {};
    const bySubjectGrade = {};
    const bySubjectGradeTopic = {};
    const byGrade = {};
    const byLevel = {};
    const byTopic = {};
    const byType = {};
    let issueCount = 0;
    let dupCount = 0;
    let noExplainCount = 0;
    let badAnswerCount = 0;

    list.forEach((q) => {
      const subj = q.subject || 'Chưa phân môn';
      const gr = q.grade || 0;
      const tp = q.topicId || '';
      const lv = normalizeLevel(q.level);
      const qType = getQuestionType(q, customMeta);

      bySubject[subj] = (bySubject[subj] || 0) + 1;
      byGrade[gr] = (byGrade[gr] || 0) + 1;
      if (lv) byLevel[lv] = (byLevel[lv] || 0) + 1;
      if (tp) byTopic[tp] = (byTopic[tp] || 0) + 1;
      byType[qType] = (byType[qType] || 0) + 1;

      const sgKey = `${subj}__${gr}`;
      bySubjectGrade[sgKey] = (bySubjectGrade[sgKey] || 0) + 1;
      if (tp) {
        const sgtKey = `${subj}__${gr}__${tp}`;
        bySubjectGradeTopic[sgtKey] = (bySubjectGradeTopic[sgtKey] || 0) + 1;
      }

      const qm = qualityMap[q.id];
      if (qm?.hasIssue) issueCount++;
      if (qm?.isDuplicate) dupCount++;
      if (qm?.noExplain) noExplainCount++;
      if (qm?.badAnswer) badAnswerCount++;
    });

    return {
      bySubject,
      bySubjectGrade,
      bySubjectGradeTopic,
      byGrade,
      byLevel,
      byTopic,
      byType,
      issueCount,
      dupCount,
      noExplainCount,
      badAnswerCount,
    };
  }, [list, customMeta, qualityMap]);

  /* Lọc và sắp xếp danh sách câu hỏi */
  const filtered = useMemo(() => {
    let arr = list;
    if (filterSubject) arr = arr.filter((q) => (q.subject || 'Chưa phân môn') === filterSubject);
    if (filterGrade) arr = arr.filter((q) => Number(q.grade || 0) === Number(filterGrade));
    if (filterTopic) arr = arr.filter((q) => q.topicId === filterTopic);
    if (filterLevel) arr = arr.filter((q) => normalizeLevel(q.level) === filterLevel);
    if (filterType) arr = arr.filter((q) => getQuestionType(q, customMeta) === filterType);
    if (filterTag) arr = arr.filter((q) => (q.tags || []).includes(filterTag));
    if (usageFilter === 'unused') arr = arr.filter((q) => !(q.usageCount > 0));
    if (usageFilter === 'used') arr = arr.filter((q) => (q.usageCount || 0) > 0);

    if (qualityFilter === 'any_issue') arr = arr.filter((q) => qualityMap[q.id]?.hasIssue);
    else if (qualityFilter === 'duplicate') arr = arr.filter((q) => qualityMap[q.id]?.isDuplicate);
    else if (qualityFilter === 'no_explain') arr = arr.filter((q) => qualityMap[q.id]?.noExplain);
    else if (qualityFilter === 'bad_answer') arr = arr.filter((q) => qualityMap[q.id]?.badAnswer);

    if (deferredSearch.trim()) {
      const needle = norm(deferredSearch);
      arr = arr.filter((q) =>
        norm(q.q).includes(needle) ||
        norm(q.explain).includes(needle) ||
        (q.options || []).some((o) => norm(o).includes(needle)) ||
        norm(getTopicName(q.topicId, q.subject)).includes(needle) ||
        (q.tags || []).some((t) => norm(t).includes(needle))
      );
    }

    const sorted = [...arr];
    if (sortBy === 'usage') {
      sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (sortBy === 'accuracy_asc') {
      sorted.sort((a, b) => getAccuracyRate(a, customMeta) - getAccuracyRate(b, customMeta));
    } else if (sortBy === 'level_desc') {
      sorted.sort((a, b) => (LEVEL_META[normalizeLevel(b.level)]?.weight || 0) - (LEVEL_META[normalizeLevel(a.level)]?.weight || 0));
    }
    return sorted;
  }, [
    list, filterSubject, filterGrade, filterTopic, filterLevel, filterType, filterTag,
    usageFilter, qualityFilter, deferredSearch, sortBy, customMeta, qualityMap,
  ]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  /* Câu hỏi đang chọn để hiển thị ở Khung phải */
  const activeQuestion = useMemo(
    () => list.find((q) => q.id === activeId) || visibleItems[0] || null,
    [list, activeId, visibleItems]
  );

  /* Đồng bộ dữ liệu vào form Sửa nhanh khi đổi câu đang chọn */
  useEffect(() => {
    if (!activeQuestion) {
      setQuickDraft(null);
      setAiResult(null);
      return;
    }
    setQuickDraft({
      q: activeQuestion.q || '',
      options: Array.isArray(activeQuestion.options) && activeQuestion.options.length >= 2
        ? [...activeQuestion.options]
        : ['', '', '', ''],
      correct: typeof activeQuestion.correct === 'number' ? activeQuestion.correct : 0,
      explain: activeQuestion.explain || '',
      subject: activeQuestion.subject || 'Hóa học',
      grade: Number(activeQuestion.grade) || 0,
      topicId: activeQuestion.topicId || '',
      level: normalizeLevel(activeQuestion.level),
      points: Number(activeQuestion.points) || 1,
      type: getQuestionType(activeQuestion, customMeta),
      tags: [...(activeQuestion.tags || [])].filter((t) => !t.startsWith('loai:')),
    });
    setAiResult(null);
  }, [activeQuestion, customMeta]);

  const hasActiveFilter = Boolean(
    filterSubject || filterGrade || filterTopic || filterLevel || filterType || filterTag ||
    usageFilter !== 'all' || qualityFilter !== 'all' || search.trim()
  );

  const handleClearFilters = () => {
    setUsageFilter('all');
    setQualityFilter('all');
    setFilterSubject('');
    setFilterGrade(0);
    setFilterTopic('');
    setFilterLevel('');
    setFilterType('');
    setFilterTag('');
    setSearch('');
  };

  /* Lưu bộ lọc hiện tại vào Bộ lọc yêu thích */
  const handleSaveFavFilter = () => {
    const name = favNameInput.trim() || [
      filterSubject || 'Mọi môn',
      filterGrade ? `Lớp ${filterGrade}` : '',
      filterLevel ? LEVEL_META[filterLevel]?.short : '',
      filterType ? TYPE_LABEL[filterType] : '',
      qualityFilter !== 'all' ? 'Cảnh báo' : '',
    ].filter(Boolean).join(' · ');

    const newFav = {
      id: 'fav-' + Date.now(),
      name,
      filterSubject,
      filterGrade,
      filterTopic,
      filterLevel,
      filterType,
      filterTag,
      usageFilter,
      qualityFilter,
    };
    setFavFilters((prev) => [newFav, ...prev.slice(0, 11)]);
    setFavNameInput('');
    setShowFavInput(false);
    say(`Đã lưu bộ lọc "${name}"`);
  };

  const applyFavFilter = (fav) => {
    setFilterSubject(fav.filterSubject || '');
    setFilterGrade(Number(fav.filterGrade) || 0);
    setFilterTopic(fav.filterTopic || '');
    setFilterLevel(fav.filterLevel || '');
    setFilterType(fav.filterType || '');
    setFilterTag(fav.filterTag || '');
    setUsageFilter(fav.usageFilter || 'all');
    setQualityFilter(fav.qualityFilter || 'all');
  };

  const removeFavFilter = (id, e) => {
    e.stopPropagation();
    setFavFilters((prev) => prev.filter((f) => f.id !== id));
  };

  /* ============================================================
     THÊM / SỬA / XÓA KÈM HỘP XÁC NHẬN & HOÀN TÁC (UNDO 6S)
     ============================================================ */
  const executeSaveQuestion = async (data, opts = {}) => {
    setSaving(true);
    try {
      if (editing) {
        await updateQuestion(editing.id, data);
        say('Đã cập nhật câu hỏi');
      } else {
        const created = await addQuestion({ ...data, teacherId: user.uid });
        if (created?.id) setActiveId(created.id);
        say('Đã thêm câu hỏi vào ngân hàng');
      }
      if (opts.another && !editing) {
        setFormKey((k) => k + 1);
      } else {
        setShowForm(false);
        setEditing(null);
      }
      await refresh();
    } catch (e) {
      say(e.message || 'Lỗi lưu câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (data, opts = {}) => {
    if (!editing && findDuplicate(list, data)) {
      setConfirmModal({
        title: 'Phát hiện câu hỏi trùng lặp',
        message: 'Nội dung câu hỏi và đáp án này đã tồn tại trong ngân hàng của bạn. Bạn vẫn muốn lưu thêm một bản nữa?',
        confirmLabel: 'Vẫn thêm bản mới',
        tone: 'warn',
        onConfirm: () => {
          setConfirmModal(null);
          executeSaveQuestion(data, opts);
        },
      });
      return;
    }
    await executeSaveQuestion(data, opts);
  };

  /* Kích hoạt Toast Hoàn tác 6 giây sau khi xóa */
  const triggerUndoableDelete = useCallback((deletedItems, label) => {
    clearTimeout(undoTimer.current);
    setUndoPayload({ items: deletedItems, label });
    undoTimer.current = setTimeout(() => {
      setUndoPayload(null);
    }, 6000);
  }, []);

  const handleUndoDelete = async () => {
    if (!undoPayload?.items?.length || !user?.uid) return;
    const itemsToRestore = undoPayload.items;
    clearTimeout(undoTimer.current);
    setUndoPayload(null);
    try {
      for (const item of itemsToRestore) {
        await addQuestion({
          teacherId: user.uid,
          subject: item.subject || '',
          grade: item.grade || 0,
          topicId: item.topicId || '',
          level: item.level || '',
          tags: item.tags || [],
          q: item.q,
          options: item.options || [],
          correct: item.correct || 0,
          explain: item.explain || '',
          points: item.points || 1,
        });
      }
      say(`Đã khôi phục ${itemsToRestore.length} câu hỏi`);
      await refresh();
    } catch (e) {
      say(e.message || 'Không thể hoàn tác xóa');
    }
  };

  const handleDelete = (q) => {
    setConfirmModal({
      title: 'Xóa câu hỏi khỏi ngân hàng?',
      message: `Bạn sắp xóa câu hỏi: "${String(q.q || '').slice(0, 110)}${String(q.q || '').length > 110 ? '...' : ''}". Bạn có thể bấm Hoàn tác trong 6 giây sau khi xóa.`,
      confirmLabel: 'Xóa câu hỏi',
      tone: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteQuestion(q.id);
          setList((arr) => arr.filter((x) => x.id !== q.id));
          setSelectedIds((prev) => {
            const n = new Set(prev);
            n.delete(q.id);
            return n;
          });
          triggerUndoableDelete([q], 'Đã xóa 1 câu hỏi');
        } catch (e) {
          say(e.message || 'Lỗi xóa câu hỏi');
        }
      },
    });
  };

  /* Gộp câu trùng lặp */
  const handleMergeDuplicate = (dupQuestion, primaryQuestion) => {
    if (!dupQuestion || !primaryQuestion) return;
    setConfirmModal({
      title: 'Gộp 2 câu hỏi trùng lặp?',
      message: 'Hệ thống sẽ giữ lại câu gốc, gộp toàn bộ nhãn (Tags), giữ lời giải chi tiết hơn và xóa bản bị trùng. Bạn có thể hoàn tác trong 6 giây.',
      confirmLabel: 'Gộp câu trùng',
      tone: 'primary',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const mergedTags = [...new Set([...(primaryQuestion.tags || []), ...(dupQuestion.tags || [])])];
          const bestExplain = (primaryQuestion.explain || '').length >= (dupQuestion.explain || '').length
            ? primaryQuestion.explain
            : dupQuestion.explain;
          await updateQuestion(primaryQuestion.id, {
            tags: mergedTags,
            explain: bestExplain || '',
          });
          await deleteQuestion(dupQuestion.id);
          setList((arr) => arr
            .filter((x) => x.id !== dupQuestion.id)
            .map((x) => (x.id === primaryQuestion.id ? { ...x, tags: mergedTags, explain: bestExplain } : x))
          );
          setActiveId(primaryQuestion.id);
          triggerUndoableDelete([dupQuestion], 'Đã gộp câu trùng lặp');
        } catch (e) {
          say(e.message || 'Lỗi khi gộp câu trùng');
        }
      },
    });
  };

  /* ============================================================
     THAO TÁC HÀNG LOẠT (BULK ACTIONS)
     ============================================================ */
  const toggleSelect = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((q) => selectedIds.has(q.id));
  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleItems.map((q) => q.id)));
  };

  const handleDeleteSelected = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    const deletedObjs = list.filter((q) => selectedIds.has(q.id));
    setConfirmModal({
      title: `Xóa ${ids.length} câu hỏi đã chọn?`,
      message: `Các câu hỏi đã chọn sẽ bị xóa khỏi ngân hàng. Bạn vẫn có thể bấm "Hoàn tác" trong vòng 6 giây nếu xóa nhầm.`,
      confirmLabel: `Xóa ${ids.length} câu`,
      tone: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        setBulkBusy(true);
        try {
          await deleteQuestionsBatch(ids);
          setList((arr) => arr.filter((x) => !selectedIds.has(x.id)));
          setSelectedIds(new Set());
          triggerUndoableDelete(deletedObjs, `Đã xóa ${ids.length} câu hỏi`);
        } catch (e) {
          say(e.message || 'Lỗi xóa hàng loạt');
        } finally {
          setBulkBusy(false);
        }
      },
    });
  };

  const handleBulkChangeLevel = async (newLevel) => {
    if (!newLevel || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setBulkBusy(true);
    try {
      await Promise.all(ids.map((id) => updateQuestion(id, { level: newLevel })));
      setList((arr) => arr.map((q) => (selectedIds.has(q.id) ? { ...q, level: newLevel } : q)));
      say(`Đã đổi độ khó ${ids.length} câu sang "${LEVEL_META[newLevel]?.short || newLevel}"`);
    } catch (e) {
      say(e.message || 'Lỗi đổi độ khó hàng loạt');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkAddTag = async () => {
    const t = bulkTagInput.trim();
    if (!t || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setBulkBusy(true);
    try {
      await Promise.all(ids.map((id) => {
        const q = list.find((x) => x.id === id);
        const nextTags = [...new Set([...(q?.tags || []), t])];
        return updateQuestion(id, { tags: nextTags });
      }));
      setList((arr) => arr.map((q) => (
        selectedIds.has(q.id) ? { ...q, tags: [...new Set([...(q.tags || []), t])] } : q
      )));
      if (!allTags.includes(t)) setAllTags((prev) => [...prev, t]);
      setBulkTagInput('');
      say(`Đã gắn tag #${t} cho ${ids.length} câu`);
    } catch (e) {
      say(e.message || 'Lỗi gắn tag hàng loạt');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkMoveFolder = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const patch = {};
    if (bulkMoveSubject) patch.subject = bulkMoveSubject;
    if (bulkMoveGrade > 0) patch.grade = Number(bulkMoveGrade);
    if (bulkMoveTopic) patch.topicId = bulkMoveTopic;
    if (Object.keys(patch).length === 0) {
      say('Vui lòng chọn Môn, Lớp hoặc Chuyên đề đích');
      return;
    }
    setBulkBusy(true);
    try {
      await Promise.all(ids.map((id) => updateQuestion(id, patch)));
      setList((arr) => arr.map((q) => (selectedIds.has(q.id) ? { ...q, ...patch } : q)));
      setShowBulkMove(false);
      say(`Đã chuyển thư mục cho ${ids.length} câu hỏi`);
    } catch (e) {
      say(e.message || 'Lỗi chuyển thư mục hàng loạt');
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkExportToGame = (gameId) => {
    if (!gameId || selectedIds.size === 0) return;
    const selectedQuestions = list.filter((q) => selectedIds.has(q.id));
    if (!selectedQuestions.length) return;

    const gameQuestions = selectedQuestions.map((q) => {
      const opts = (q.options || []).map((o) => String(o || '').trim()).filter(Boolean);
      const ci = typeof q.correct === 'number' ? q.correct : 0;
      return {
        id: q.id,
        question: q.q || '',
        q: q.q || '',
        correct: opts[ci] || '',
        wrong: opts.filter((_, i) => i !== ci),
        options: opts,
        answer: ci,
        difficulty: q.level || 'medium',
        explain: q.explain || '',
        explanation: q.explain || '',
      };
    });

    const key = `cs-game:${gameId}:questions`;
    try {
      localStorage.setItem(key, JSON.stringify(gameQuestions));
      say(`Đã nạp ${gameQuestions.length} câu hỏi vào Game thành công!`);
    } catch (e) {
      say('Lỗi lưu câu hỏi vào game: ' + e.message);
    }
  };

  /* ============================================================
     KÉO THẢ & THANH "ĐỀ ĐANG SOẠN" (DRAFT EXAM BAR)
     ============================================================ */
  const addToDraftExam = useCallback((qObj) => {
    if (!qObj?.id) return;
    setDraftExamItems((prev) => {
      if (prev.some((x) => x.id === qObj.id)) {
        say('Câu hỏi này đã có trong Đề đang soạn');
        return prev;
      }
      say('Đã thêm vào Đề đang soạn');
      return [...prev, qObj];
    });
  }, [say]);

  const addSelectedToDraftExam = () => {
    const selectedQs = list.filter((q) => selectedIds.has(q.id));
    if (!selectedQs.length) return;
    setDraftExamItems((prev) => {
      const existingIds = new Set(prev.map((x) => x.id));
      const added = selectedQs.filter((q) => !existingIds.has(q.id));
      say(`Đã thêm ${added.length} câu vào Đề đang soạn`);
      return [...prev, ...added];
    });
  };

  const removeFromDraftExam = (id) => {
    setDraftExamItems((prev) => prev.filter((x) => x.id !== id));
  };

  const moveDraftItem = (idx, dir) => {
    setDraftExamItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const draftStats = useMemo(() => {
    let totalPoints = 0;
    let estMinutes = 0;
    draftExamItems.forEach((q) => {
      totalPoints += Number(q.points) || 1;
      const lv = normalizeLevel(q.level);
      estMinutes += LEVEL_META[lv]?.minutes || 1.5;
    });
    return {
      count: draftExamItems.length,
      totalPoints: Math.round(totalPoints * 10) / 10,
      estMinutes: Math.max(1, Math.round(estMinutes)),
    };
  }, [draftExamItems]);

  const handleCreateExamFromDraft = async () => {
    if (draftExamItems.length === 0) return;
    setSaving(true);
    try {
      const primarySubj = draftExamItems[0]?.subject || filterSubject || 'Hóa học';
      const primaryGrade = draftExamItems[0]?.grade || filterGrade || 12;
      const exam = await createExam({
        teacherId: user.uid,
        teacherName: user.displayName || user.email,
        classId: draftClassId || classes[0]?.id || '',
        title: draftTitle.trim() || `Đề kiểm tra ${primarySubj} (${draftExamItems.length} câu)`,
        description: `Soạn từ Ngân hàng câu hỏi · Ước tính ${draftStats.estMinutes} phút`,
        duration: Number(draftDuration) || draftStats.estMinutes || 45,
        questions: draftExamItems,
        showAnswerAfter: true,
        allowRetry: false,
        shuffle: true,
        source: 'question-bank-draft',
        kind: 'soft',
        subject: primarySubj,
        grade: primaryGrade,
      });
      say(`Đã tạo đề thi "${exam.title}" (${draftExamItems.length} câu)`);
      setShowDraftModal(false);
      setDraftExamItems([]);
      onSoftExamCreated?.(exam);
    } catch (e) {
      say(e.message || 'Lỗi tạo đề thi từ ngân hàng');
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     KHUNG PHẢI: SỬA NHANH (QUICK EDIT) & TRỢ LÝ AI (4 TÁC VỤ)
     ============================================================ */
  const handleSaveQuickEdit = async () => {
    if (!activeQuestion || !quickDraft) return;
    const cleanOpts = (quickDraft.options || []).map((o) => String(o || '').trim()).filter(Boolean);
    if (!quickDraft.q.trim()) {
      say('Nội dung câu hỏi không được để trống');
      return;
    }
    if (cleanOpts.length < 2) {
      say('Cần ít nhất 2 phương án trả lời');
      return;
    }
    const safeCorrect = quickDraft.correct >= 0 && quickDraft.correct < cleanOpts.length ? quickDraft.correct : 0;
    const typeTag = `loai:${quickDraft.type || 'single_choice'}`;
    const mergedTags = [...(quickDraft.tags || []).filter((t) => !t.startsWith('loai:')), typeTag];

    setSaving(true);
    try {
      const patch = {
        q: quickDraft.q.trim(),
        options: cleanOpts,
        correct: safeCorrect,
        explain: quickDraft.explain.trim(),
        subject: quickDraft.subject,
        grade: Number(quickDraft.grade) || 0,
        topicId: quickDraft.topicId,
        level: quickDraft.level,
        points: Number(quickDraft.points) || 1,
        tags: mergedTags,
      };
      await updateQuestion(activeQuestion.id, patch);
      updateCustomMeta(activeQuestion.id, { type: quickDraft.type || 'single_choice' });
      setList((arr) => arr.map((x) => (x.id === activeQuestion.id ? { ...x, ...patch } : x)));
      say('Đã lưu sửa nhanh câu hỏi');
    } catch (e) {
      say(e.message || 'Lỗi lưu sửa nhanh');
    } finally {
      setSaving(false);
    }
  };

  /* 1. AI: Sinh câu tương tự */
  const runAiSimilarQuestion = () => {
    if (!activeQuestion) return;
    setAiBusy(true);
    setTimeout(() => {
      const origQ = activeQuestion.q || '';
      const hasNumbers = /\d+/.test(origQ);
      let mutatedQ = origQ;
      if (hasNumbers) {
        mutatedQ = origQ.replace(/\b(\d+(?:[.,]\d+)?)\b/g, (m) => {
          const val = parseFloat(m.replace(',', '.'));
          if (Number.isNaN(val) || val <= 1) return m;
          return String(Math.round(val * 1.5 * 10) / 10);
        });
      } else {
        mutatedQ = `[Biến thể tương tự] Cho tình huống mở rộng của bài toán: ${origQ}`;
      }
      const opts = [...(activeQuestion.options || ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'])];
      const correctText = opts[activeQuestion.correct || 0];
      // Đảo vị trí phương án
      const rotated = opts.slice(1).concat(opts[0]);
      const newCorrect = Math.max(0, rotated.indexOf(correctText));

      setAiResult({
        kind: 'similar',
        title: 'Đã sinh 1 câu hỏi tương tự cùng chuyên đề',
        question: {
          q: mutatedQ,
          options: rotated,
          correct: newCorrect,
          explain: activeQuestion.explain
            ? `Áp dụng phương pháp tương tự câu gốc: ${activeQuestion.explain}`
            : `Vận dụng kiến thức chuyên đề ${getTopicName(activeQuestion.topicId, activeQuestion.subject) || activeQuestion.subject || 'bài học'} để suy ra đáp án ${String.fromCharCode(65 + newCorrect)}.`,
          subject: activeQuestion.subject || 'Hóa học',
          grade: activeQuestion.grade || 12,
          topicId: activeQuestion.topicId || '',
          level: normalizeLevel(activeQuestion.level) || 'thông hiểu',
          points: activeQuestion.points || 1,
          tags: [...(activeQuestion.tags || [])],
        },
      });
      setAiBusy(false);
    }, 320);
  };

  /* 2. AI: Viết lời giải chi tiết */
  const runAiWriteExplain = () => {
    if (!activeQuestion) return;
    setAiBusy(true);
    setTimeout(() => {
      const correctIdx = activeQuestion.correct || 0;
      const correctLetter = String.fromCharCode(65 + correctIdx);
      const correctText = activeQuestion.options?.[correctIdx] || '';
      const topicTitle = getTopicName(activeQuestion.topicId, activeQuestion.subject) || activeQuestion.subject || 'chuyên đề này';
      const generatedExplain = [
        `• Kiến thức trọng tâm: Câu hỏi thuộc phần "${topicTitle}" (${LEVEL_META[normalizeLevel(activeQuestion.level)]?.label || 'Mức cơ bản'}).`,
        `• Phân tích đề bài: Từ dữ kiện "${String(activeQuestion.q || '').slice(0, 90)}${String(activeQuestion.q || '').length > 90 ? '...' : ''}", đối chiếu với các phương án A, B, C, D.`,
        `• Kết luận: Phương án ${correctLetter} (${correctText}) thỏa mãn đầy đủ điều kiện lý thuyết và công thức. Chọn đáp án ${correctLetter}.`,
      ].join('\n');

      setAiResult({
        kind: 'explain',
        title: 'Gợi ý lời giải chi tiết từng bước',
        explain: generatedExplain,
      });
      setAiBusy(false);
    }, 280);
  };

  /* 3. AI: Gợi ý độ khó & chuyên đề */
  const runAiSuggestMeta = () => {
    if (!activeQuestion) return;
    setAiBusy(true);
    setTimeout(() => {
      const text = norm(activeQuestion.q + ' ' + (activeQuestion.explain || ''));
      let suggestedLevel = 'nhận biết';
      if (/cuc tri|gia tri lon nhat|gia tri nho nhat|hieu suat|bien luan|do thi|hon hop x|phan tram khoi luong/.test(text) || activeQuestion.q.length > 220) {
        suggestedLevel = 'vận dụng cao';
      } else if (/tinh|so mol|the tich|khoi luong|nghiem|phuong trinh|xac suat|dao ham|tich phan/.test(text) || activeQuestion.q.length > 130) {
        suggestedLevel = 'vận dụng';
      } else if (/giai thich|vi sao|nhan dinh nao|so phat bieu|dac diem|tinh chat/.test(text) || activeQuestion.q.length > 75) {
        suggestedLevel = 'thông hiểu';
      }

      const subj = activeQuestion.subject || filterSubject || 'Hóa học';
      const subjTopics = getTopicsForSubject(subj);
      let bestTopic = subjTopics[0] || { id: '', name: 'Chưa xác định' };
      let bestScore = -1;
      subjTopics.forEach((tp) => {
        const words = norm(tp.name).split(' ').filter((w) => w.length > 2);
        let score = 0;
        words.forEach((w) => { if (text.includes(w)) score += 2; });
        if (score > bestScore) {
          bestScore = score;
          bestTopic = tp;
        }
      });

      setAiResult({
        kind: 'meta',
        title: 'Phân loại Độ khó & Chuyên đề tự động',
        suggestedLevel,
        suggestedTopicId: bestTopic.id,
        suggestedTopicName: bestTopic.name,
        suggestedSubject: subj,
      });
      setAiBusy(false);
    }, 260);
  };

  /* 4. AI: Kiểm tra đáp án sai / lỗi cấu trúc câu hỏi */
  const runAiAuditQuestion = () => {
    if (!activeQuestion) return;
    setAiBusy(true);
    setTimeout(() => {
      const findings = [];
      const opts = activeQuestion.options || [];
      const cIdx = activeQuestion.correct;
      const cLetter = String.fromCharCode(65 + (cIdx || 0));

      if (opts.length < 4) {
        findings.push({ type: 'warn', text: `Câu hỏi hiện chỉ có ${opts.length} phương án (khuyến nghị đủ 4 phương án A, B, C, D).` });
      }
      if (typeof cIdx !== 'number' || cIdx < 0 || cIdx >= opts.length || !String(opts[cIdx] || '').trim()) {
        findings.push({ type: 'error', text: 'Đáp án đúng đang trỏ tới vị trí rỗng hoặc không hợp lệ.' });
      }
      const normOpts = opts.map((o) => norm(o));
      const dupOptIdx = normOpts.findIndex((o, i) => o && normOpts.indexOf(o) !== i);
      if (dupOptIdx >= 0) {
        findings.push({ type: 'error', text: `Phương án ${String.fromCharCode(65 + dupOptIdx)} bị trùng nội dung với một phương án khác.` });
      }
      if (activeQuestion.explain) {
        const expMatch = activeQuestion.explain.match(/(?:chọn|đáp án)\s*([A-D])\b/i);
        if (expMatch && expMatch[1].toUpperCase() !== cLetter) {
          findings.push({
            type: 'error',
            text: `Mâu thuẫn: Đáp án đang chọn là ${cLetter} nhưng trong lời giải ghi "Đáp án ${expMatch[1].toUpperCase()}".`,
          });
        }
      } else {
        findings.push({ type: 'warn', text: 'Câu hỏi chưa có lời giải chi tiết để đối chiếu chéo với đáp án đúng.' });
      }

      if (findings.length === 0) {
        findings.push({
          type: 'ok',
          text: `Cấu trúc câu hỏi hợp lệ: 4 phương án phân biệt rõ ràng, đáp án ${cLetter} khớp với nội dung lời giải.`,
        });
      }

      setAiResult({
        kind: 'audit',
        title: 'Kết quả rà soát chất lượng đáp án',
        findings,
      });
      setAiBusy(false);
    }, 260);
  };

  /* Sinh nhanh bộ câu hỏi bằng AI ngay trong Ngân hàng */
  const handleGenerateAiQuestionsBatch = () => {
    const tpName = getTopicName(aiGenTopic, aiGenSubject) || aiGenSubject;
    const count = Math.max(1, Math.min(10, Number(aiGenCount) || 3));
    const lvLabel = LEVEL_META[aiGenLevel]?.short || 'Vừa';
    const samples = [];
    for (let i = 1; i <= count; i++) {
      samples.push({
        id: `ai-gen-${Date.now()}-${i}`,
        subject: aiGenSubject,
        grade: Number(aiGenGrade) || 12,
        topicId: aiGenTopic,
        level: aiGenLevel,
        points: 1,
        tags: ['AI-sinh', lvLabel],
        q: `[${aiGenSubject} ${aiGenGrade} · ${tpName}] Câu hỏi vận dụng số ${i} (${lvLabel}): Xác định phát biểu hoặc giá trị đúng khi khảo sát bài toán tiêu biểu của chuyên đề "${tpName}"?`,
        options: [
          `Phương án chuẩn xác theo định luật/công thức của ${tpName} (trường hợp ${i})`,
          `Phương án nhiễu do nhầm dấu hoặc hệ số tỉ lệ (${i * 2})`,
          `Phương án nhiễu do thiếu điều kiện xác định của bài toán`,
          `Phương án nhiễu do áp dụng sai công thức tổng quát`,
        ],
        correct: 0,
        explain: `Dựa vào kiến thức trọng tâm chuyên đề "${tpName}" (${aiGenSubject} lớp ${aiGenGrade}), biến đổi theo điều kiện chuẩn suy ra đáp án A.`,
      });
    }
    setAiGeneratedList(samples);
  };

  const handleSaveAiGeneratedBatch = async () => {
    if (!aiGeneratedList.length || !user?.uid) return;
    setSaving(true);
    try {
      const res = await addQuestionsBatch({ teacherId: user.uid, questions: aiGeneratedList });
      say(`Đã lưu ${res.count} câu hỏi AI vào ngân hàng`);
      setAiGeneratedList([]);
      setShowAiGeneratorModal(false);
      await refresh();
    } catch (e) {
      say(e.message || 'Lỗi lưu câu hỏi AI');
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     THỐNG KÊ NGÂN HÀNG (STATS PANEL)
     ============================================================ */
  const bankAnalytics = useMemo(() => {
    const total = list.length || 1;
    const dist = [
      { key: 'nhận biết', label: 'Dễ (Nhận biết)', tone: 'easy', count: counts.byLevel['nhận biết'] || 0 },
      { key: 'thông hiểu', label: 'Vừa (Thông hiểu)', tone: 'medium', count: counts.byLevel['thông hiểu'] || 0 },
      { key: 'vận dụng', label: 'Khó (Vận dụng)', tone: 'hard', count: counts.byLevel['vận dụng'] || 0 },
      { key: 'vận dụng cao', label: 'Rất khó (VDC)', tone: 'vhard', count: counts.byLevel['vận dụng cao'] || 0 },
    ].map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) }));

    // Các chuyên đề còn thiếu câu hỏi (< 5 câu)
    const targetSubject = filterSubject || 'Hóa học';
    const topicsToCheck = getTopicsForSubject(targetSubject);
    const lackingTopics = topicsToCheck
      .map((tp) => ({
        ...tp,
        subject: targetSubject,
        count: counts.byTopic[tp.id] || 0,
      }))
      .filter((tp) => tp.count < 5)
      .sort((a, b) => a.count - b.count)
      .slice(0, 8);

    // Các câu học sinh hay sai nhất (tỉ lệ đúng thấp nhất)
    const hardestQuestions = [...list]
      .map((q) => ({ ...q, acc: getAccuracyRate(q, customMeta) }))
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 6);

    return { dist, lackingTopics, hardestQuestions, targetSubject };
  }, [list, counts, filterSubject, customMeta]);

  /* ============================================================
     NHẬP / XUẤT ĐA ĐỊNH DẠNG (CSV, WORD, PDF, EXAM IMPORTER)
     ============================================================ */
  const handleExportCsv = () => {
    const rows = [['Môn', 'Lớp', 'Chuyên đề', 'Độ khó', 'Loại câu', 'Câu hỏi', 'A', 'B', 'C', 'D', 'E', 'F', 'Đáp án đúng', 'Lời giải', 'Điểm', 'Tag', 'Số lần dùng']];
    filtered.forEach((q) => {
      const opts = [0, 1, 2, 3, 4, 5].map((i) => q.options?.[i] ?? '');
      rows.push([
        q.subject || '',
        q.grade || '',
        q.topicId ? getTopicName(q.topicId, q.subject) : '',
        LEVEL_META[normalizeLevel(q.level)]?.short || q.level || '',
        TYPE_LABEL[getQuestionType(q, customMeta)] || 'Trắc nghiệm',
        q.q,
        ...opts,
        String.fromCharCode(65 + (q.correct || 0)),
        q.explain || '',
        q.points || 1,
        (q.tags || []).join('; '),
        q.usageCount || 0,
      ]);
    });
    downloadCsv(`ngan-hang-cau-hoi-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setShowExportMenu(false);
    say(`Đã xuất ${filtered.length} câu ra file CSV/Excel`);
  };

  const handleExportWord = async () => {
    if (filtered.length === 0) return;
    setShowExportMenu(false);
    say('Đang tạo file Word (.docx)...');
    try {
      await exportToWord({
        examTitle: `Ngân hàng câu hỏi ${filterSubject || 'Tổng hợp'}`,
        subject: filterSubject || 'Đa môn',
        duration: Math.max(15, Math.round(filtered.length * 1.5)),
        code: 'NH01',
        questions: filtered,
        includeAnswers: true,
      });
      say('Đã tải xuống file Word (.docx)');
    } catch (e) {
      say(e.message || 'Lỗi xuất file Word');
    }
  };

  const handleExportPdf = async () => {
    if (filtered.length === 0 || !pdfPrintRef.current) return;
    setShowExportMenu(false);
    say('Đang kết xuất file PDF...');
    try {
      await exportToPDF({
        element: pdfPrintRef.current,
        examTitle: `Ngan-hang-cau-hoi-${filterSubject || 'Tong-hop'}`,
        code: 'PDF',
      });
      say('Đã tải xuống file PDF');
    } catch (e) {
      say(e.message || 'Lỗi xuất PDF');
    }
  };

  const handleImportToBank = async (qs) => {
    const res = await addQuestionsBatch({ teacherId: user.uid, questions: qs });
    say(`Đã lưu ${res.count} câu vào ngân hàng` + (res.skipped ? ` (bỏ trùng ${res.skipped})` : ''));
    setShowImporter(false);
    await refresh();
  };

  const handleCreateSoftExam = async ({ title, duration, classId, subject, grade, questions: qs, sourceFile }) => {
    const exam = await createExam({
      teacherId: user.uid,
      teacherName: user.displayName || user.email,
      classId,
      title,
      description: sourceFile ? `Nhập từ file ${sourceFile}` : 'Đề mềm nhập từ file',
      duration,
      questions: qs,
      showAnswerAfter: true,
      allowRetry: false,
      shuffle: false,
      source: 'file-import',
      kind: 'soft',
      subject,
      grade,
    });
    say(`Đã tạo đề mềm "${exam.title}" (${qs.length} câu)`);
    setShowImporter(false);
    onSoftExamCreated?.(exam);
  };

  /* Xử lý xem trước & lưu từ trình Nhập nhanh CSV / Excel / Text */
  useEffect(() => {
    const parsed = parseQuickImportText(quickImportText, filterSubject || 'Hóa học', filterGrade || 12, list);
    setQuickImportRows(parsed);
  }, [quickImportText, filterSubject, filterGrade, list]);

  const handleQuickImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setQuickImportText(String(reader.result || ''));
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSaveQuickImportRows = async () => {
    const validSelected = quickImportRows.filter((r) => r.selected && r.status !== 'error');
    if (validSelected.length === 0) {
      say('Không có dòng hợp lệ nào được chọn để lưu');
      return;
    }
    setSaving(true);
    try {
      const res = await addQuestionsBatch({
        teacherId: user.uid,
        questions: validSelected,
        skipDuplicates: false,
      });
      say(`Đã nhập thành công ${res.count} câu hỏi vào ngân hàng`);
      setShowQuickImport(false);
      setQuickImportText('');
      await refresh();
    } catch (e) {
      say(e.message || 'Lỗi nhập danh sách câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  /* Mở trình tạo câu hỏi AI khi bấm "Sinh đề bằng AI" */
  const handleTriggerAiStudio = () => {
    if (typeof onOpenAiStudio === 'function') {
      onOpenAiStudio();
    } else {
      setAiGenSubject(filterSubject || 'Hóa học');
      setAiGenGrade(filterGrade || 12);
      setAiGenTopic(filterTopic || '');
      setShowAiGeneratorModal(true);
    }
  };

  /* Danh sách môn hiển thị ở cây thư mục trái */
  const treeSubjects = useMemo(() => {
    const withCounts = ALL_SUBJECTS_LIST.filter((s) => (counts.bySubject[s] || 0) > 0);
    const others = ALL_SUBJECTS_LIST.filter((s) => !withCounts.includes(s));
    return [...withCounts, ...others];
  }, [counts.bySubject]);

  return (
    <div className="qb">
      {/* ============ HEADER ============ */}
      <header className="qb-head">
        <div className="qb-head-left">
          <div className="qb-head-title">
            <IcoLibrary size={20} />
            <span>Ngân hàng câu hỏi</span>
            <span className="qb-head-badge">{list.length} câu</span>
          </div>
          <div className="qb-head-count">
            <span>Hiển thị {filtered.length} câu</span>
            {counts.issueCount > 0 && (
              <button
                type="button"
                className="qb-head-warn-link"
                onClick={() => setQualityFilter(qualityFilter === 'any_issue' ? 'all' : 'any_issue')}
              >
                <IcoAlert size={13} /> {counts.issueCount} câu cần rà soát
              </button>
            )}
            <span className="qb-shortcut-hint" title="Phím tắt bàn phím">
              Phím tắt: <kbd>/</kbd> Tìm · <kbd>N</kbd> Thêm mới · <kbd>Esc</kbd> Đóng
            </span>
          </div>
        </div>

        <div className="qb-head-actions">
          <button
            type="button"
            className={'vt-btn sm' + (showStatsPanel ? ' primary' : '')}
            onClick={() => setShowStatsPanel((v) => !v)}
          >
            <IcoChart size={15} /> Thống kê
          </button>

          {/* Menu Xuất đa định dạng */}
          <div className="qb-export-dropdown-wrap">
            <button
              type="button"
              className="vt-btn sm"
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={loading || filtered.length === 0}
            >
              <IcoDownload size={15} /> Xuất ({filtered.length}) <IcoChevronDown size={13} />
            </button>
            {showExportMenu && (
              <div className="qb-export-menu" role="menu">
                <button type="button" onClick={handleExportCsv}>
                  <IcoFileText size={15} /> Xuất Excel / CSV (.csv)
                </button>
                <button type="button" onClick={handleExportWord}>
                  <IcoFileText size={15} /> Xuất đề Word (.docx)
                </button>
                <button type="button" onClick={handleExportPdf}>
                  <IcoFileText size={15} /> Xuất bản in PDF (.pdf)
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="vt-btn sm"
            onClick={() => setShowQuickImport(true)}
            title="Nhập nhanh từ bảng Excel, CSV hoặc văn bản có kiểm tra lỗi từng dòng"
          >
            <IcoUpload size={15} /> Nhập CSV / Excel
          </button>

          <button
            type="button"
            className="vt-btn sm"
            onClick={() => setShowImporter(true)}
            title="Tách câu hỏi từ file PDF, Word, Ảnh"
          >
            <IcoUpload size={15} /> Nhập đề từ file
          </button>

          <button
            type="button"
            className="vt-btn sm"
            onClick={handleTriggerAiStudio}
          >
            <IcoSparkles size={15} /> Sinh bằng AI
          </button>

          <button
            type="button"
            className="vt-btn sm"
            onClick={refresh}
            disabled={loading}
            title="Làm mới dữ liệu"
          >
            <IcoRefresh size={14} />
          </button>

          <button
            type="button"
            className="vt-btn sm primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <IcoPlus size={15} /> Thêm câu hỏi
          </button>
        </div>
      </header>

      {/* ============ KHUNG THỐNG KÊ NGÂN HÀNG (TOGGLE) ============ */}
      {showStatsPanel && (
        <section className="qb-stats-drawer" aria-label="Thống kê ngân hàng câu hỏi">
          <div className="qb-stats-grid">
            {/* Cột 1: Phân bố độ khó */}
            <div className="qb-stats-card">
              <div className="qb-stats-card-head">
                <h4>Phân bố độ khó ({list.length} câu)</h4>
                <span>Tỉ lệ chuẩn ma trận</span>
              </div>
              <div className="qb-level-bars">
                {bankAnalytics.dist.map((item) => (
                  <div key={item.key} className="qb-level-bar-row">
                    <div className="qb-level-bar-label">
                      <span className={`qb-level-dot ${item.tone}`} />
                      <b>{item.label}</b>
                      <span>{item.count} câu ({item.pct}%)</span>
                    </div>
                    <div className="qb-level-bar-track">
                      <div
                        className={`qb-level-bar-fill ${item.tone}`}
                        style={{ width: `${Math.max(4, item.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 2: Chuyên đề còn thiếu câu hỏi (< 5 câu) */}
            <div className="qb-stats-card">
              <div className="qb-stats-card-head">
                <h4>Chuyên đề thiếu câu hỏi ({bankAnalytics.targetSubject})</h4>
                <span>Dưới 5 câu</span>
              </div>
              <div className="qb-stats-list">
                {bankAnalytics.lackingTopics.length === 0 ? (
                  <p className="qb-stats-empty">Tất cả chuyên đề môn {bankAnalytics.targetSubject} đều đã có từ 5 câu trở lên.</p>
                ) : (
                  bankAnalytics.lackingTopics.map((tp) => (
                    <div key={tp.id} className="qb-stats-list-item">
                      <div>
                        <b>{tp.name}</b>
                        <small>Hiện có: {tp.count}/5 câu khuyến nghị</small>
                      </div>
                      <button
                        type="button"
                        className="qb-mini-btn acc"
                        onClick={() => {
                          setFilterSubject(tp.subject);
                          setFilterTopic(tp.id);
                          setEditing(null);
                          setShowForm(true);
                        }}
                      >
                        <IcoPlus size={12} /> Bổ sung ngay
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cột 3: Câu hỏi học sinh hay sai nhất */}
            <div className="qb-stats-card">
              <div className="qb-stats-card-head">
                <h4>Câu hỏi học sinh hay sai nhất</h4>
                <span>Ưu tiên ôn tập & giải chi tiết</span>
              </div>
              <div className="qb-stats-list">
                {bankAnalytics.hardestQuestions.length === 0 ? (
                  <p className="qb-stats-empty">Chưa có dữ liệu câu hỏi.</p>
                ) : (
                  bankAnalytics.hardestQuestions.map((hq) => (
                    <div key={hq.id} className="qb-stats-list-item">
                      <div className="qb-stats-q-trunc">
                        <b>{hq.q}</b>
                        <small>Tỉ lệ làm đúng: <span className="qb-acc-bad">{hq.acc}%</span> · {hq.subject || 'Chưa phân môn'}</small>
                      </div>
                      <button
                        type="button"
                        className="qb-mini-btn"
                        onClick={() => {
                          setActiveId(hq.id);
                          setRightTab('preview');
                        }}
                      >
                        Xem & sửa
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ THÔNG BÁO LỖI KHI TẢI THẤT BẠI ============ */}
      {loadError && (
        <div className="qb-error-banner" role="alert">
          <div className="qb-error-banner-body">
            <IcoAlert size={20} />
            <div>
              <b>Không tải được dữ liệu Ngân hàng câu hỏi</b>
              <p>{loadError}</p>
            </div>
          </div>
          <button type="button" className="vt-btn sm primary" onClick={refresh}>
            <IcoRefresh size={14} /> Thử lại ngay
          </button>
        </div>
      )}

      {/* ============ BỐ CỤC 3 VÙNG (3-PANE WORKSPACE) ============ */}
      <div className={'qb-workspace' + (leftCollapsed ? ' is-left-collapsed' : '')}>
        {/* ====== VÙNG 1 (TRÁI): CÂY THƯ MỤC & BỘ LỌC YÊU THÍCH ====== */}
        <aside className="qb-pane-left" aria-label="Cây thư mục và bộ lọc yêu thích">
          <div className="qb-pane-left-head">
            <span className="qb-pane-title">
              <IcoFolder size={16} /> Cây thư mục
            </span>
            <button
              type="button"
              className="qb-icon-btn sm"
              onClick={() => setLeftCollapsed((v) => !v)}
              title={leftCollapsed ? 'Mở rộng cây thư mục' : 'Thu gọn cây thư mục'}
            >
              {leftCollapsed ? <IcoChevronRight size={15} /> : <IcoClose size={14} />}
            </button>
          </div>

          {!leftCollapsed && (
            <div className="qb-pane-left-scroll">
              {/* Bộ lọc yêu thích (Saved Filters) */}
              <div className="qb-fav-section">
                <div className="qb-fav-head">
                  <span><IcoBookmark size={14} /> Bộ lọc yêu thích</span>
                  <button
                    type="button"
                    className="qb-link-btn"
                    onClick={() => setShowFavInput((v) => !v)}
                  >
                    + Lưu hiện tại
                  </button>
                </div>

                {showFavInput && (
                  <div className="qb-fav-save-box">
                    <input
                      type="text"
                      value={favNameInput}
                      onChange={(e) => setFavNameInput(e.target.value)}
                      placeholder="Tên bộ lọc (VD: Toán 12 Khó)..."
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFavFilter(); }}
                    />
                    <button type="button" className="qb-mini-btn acc" onClick={handleSaveFavFilter}>
                      Lưu
                    </button>
                  </div>
                )}

                <div className="qb-fav-list">
                  {favFilters.map((fav) => (
                    <div
                      key={fav.id}
                      role="button"
                      tabIndex={0}
                      className="qb-fav-chip"
                      onClick={() => applyFavFilter(fav)}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyFavFilter(fav); }}
                    >
                      <span>{fav.name}</span>
                      <button
                        type="button"
                        onClick={(e) => removeFavFilter(fav.id, e)}
                        aria-label={`Xóa bộ lọc ${fav.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cây thư mục: Môn -> Lớp -> Chuyên đề */}
              <div className="qb-tree">
                <button
                  type="button"
                  className={'qb-tree-root' + (!filterSubject && !filterGrade && !filterTopic ? ' active' : '')}
                  onClick={() => { setFilterSubject(''); setFilterGrade(0); setFilterTopic(''); }}
                >
                  <IcoFolder size={15} />
                  <span>Tất cả câu hỏi</span>
                  <span className="qb-tree-badge">{list.length}</span>
                </button>

                {treeSubjects.map((subj) => {
                  const subjCount = counts.bySubject[subj] || 0;
                  const isOpen = Boolean(expandedSubjects[subj]);
                  const isSubjActive = filterSubject === subj && !filterGrade && !filterTopic;
                  const subjTopics = getTopicsForSubject(subj);

                  return (
                    <div key={subj} className="qb-tree-group">
                      <div className={'qb-tree-node' + (isSubjActive ? ' active' : '')}>
                        <button
                          type="button"
                          className="qb-tree-toggle"
                          onClick={() => setExpandedSubjects((p) => ({ ...p, [subj]: !p[subj] }))}
                          aria-label={`Mở rộng ${subj}`}
                        >
                          {isOpen ? <IcoChevronDown size={14} /> : <IcoChevronRight size={14} />}
                        </button>
                        <button
                          type="button"
                          className="qb-tree-label"
                          onClick={() => {
                            setFilterSubject(subj);
                            setFilterGrade(0);
                            setFilterTopic('');
                            setExpandedSubjects((p) => ({ ...p, [subj]: true }));
                          }}
                        >
                          <span>{subj}</span>
                          {subjCount > 0 && <span className="qb-tree-badge">{subjCount}</span>}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="qb-tree-children">
                          {/* Nhánh Lớp 6..12 */}
                          {[12, 11, 10, 9, 8, 7, 6].map((gr) => {
                            const sgCount = counts.bySubjectGrade[`${subj}__${gr}`] || 0;
                            const grKey = `${subj}-${gr}`;
                            const isGradeOpen = Boolean(expandedGrades[grKey]);
                            const isGradeActive = filterSubject === subj && filterGrade === gr && !filterTopic;

                            if (sgCount === 0 && filterGrade !== gr && gr < 10) return null;

                            return (
                              <div key={gr} className="qb-tree-grade-block">
                                <div className={'qb-tree-node sub' + (isGradeActive ? ' active' : '')}>
                                  <button
                                    type="button"
                                    className="qb-tree-toggle"
                                    onClick={() => setExpandedGrades((p) => ({ ...p, [grKey]: !p[grKey] }))}
                                  >
                                    {isGradeOpen ? <IcoChevronDown size={13} /> : <IcoChevronRight size={13} />}
                                  </button>
                                  <button
                                    type="button"
                                    className="qb-tree-label"
                                    onClick={() => {
                                      setFilterSubject(subj);
                                      setFilterGrade(gr);
                                      setFilterTopic('');
                                      setExpandedGrades((p) => ({ ...p, [grKey]: true }));
                                    }}
                                  >
                                    <span>Lớp {gr}</span>
                                    {sgCount > 0 && <span className="qb-tree-badge">{sgCount}</span>}
                                  </button>
                                </div>

                                {isGradeOpen && (
                                  <div className="qb-tree-topics">
                                    {subjTopics.map((tp) => {
                                      const tpCount = counts.bySubjectGradeTopic[`${subj}__${gr}__${tp.id}`] || counts.byTopic[tp.id] || 0;
                                      const isTpActive = filterSubject === subj && filterTopic === tp.id;
                                      return (
                                        <button
                                          key={tp.id}
                                          type="button"
                                          className={'qb-tree-leaf' + (isTpActive ? ' active' : '')}
                                          onClick={() => {
                                            setFilterSubject(subj);
                                            setFilterGrade(gr);
                                            setFilterTopic(tp.id);
                                          }}
                                          title={tp.name}
                                        >
                                          <span className="qb-tree-leaf-text">{tp.name}</span>
                                          {tpCount > 0 && <span className="qb-tree-badge sm">{tpCount}</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* ====== VÙNG 2 (GIỮA): THANH CÔNG CỤ, DANH SÁCH & ĐỀ ĐANG SOẠN ====== */}
        <main className="qb-pane-center">
          {/* TOOLBAR STICKY */}
          <div className="qb-toolbar">
            <div className="qb-search-row">
              <label className="qb-search">
                <IcoSearch size={16} />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm toàn văn câu hỏi, phương án, lời giải, chuyên đề (không phân biệt dấu)..."
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Xóa tìm kiếm"
                    className="qb-search-clear"
                  >
                    ×
                  </button>
                ) : (
                  <kbd className="qb-search-kbd">/</kbd>
                )}
              </label>

              {/* Sắp xếp & Chuyển chế độ Lưới / Danh sách */}
              <div className="qb-sort">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sắp xếp câu hỏi"
                >
                  <option value="recent">Mới nhất</option>
                  <option value="usage">Dùng nhiều nhất</option>
                  <option value="accuracy_asc">Tỉ lệ đúng thấp nhất</option>
                  <option value="level_desc">Độ khó: Cao → Thấp</option>
                </select>

                <div className="qb-view-switch" role="group" aria-label="Chế độ hiển thị">
                  <button
                    type="button"
                    className={'qb-view-btn' + (viewMode === 'list' ? ' on' : '')}
                    onClick={() => setViewMode('list')}
                    title="Chế độ Danh sách"
                  >
                    <IcoList size={15} />
                  </button>
                  <button
                    type="button"
                    className={'qb-view-btn' + (viewMode === 'grid' ? ' on' : '')}
                    onClick={() => setViewMode('grid')}
                    title="Chế độ Lưới thẻ"
                  >
                    <IcoGrid size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Hàng lọc nhanh: Độ khó + Loại câu + Chất lượng */}
            <div className="qb-filter-compact-grid">
              {/* Độ khó */}
              <div className="qb-filter-group">
                <span className="qb-filter-label">Độ khó</span>
                <div className="qb-filter-chips">
                  {LEVELS.map((lv) => {
                    const meta = LEVEL_META[lv];
                    const cnt = lv === '' ? list.length : (counts.byLevel[lv] || 0);
                    return (
                      <button
                        key={lv || 'all'}
                        type="button"
                        className={`qb-chip tone-${meta.tone}` + (filterLevel === lv ? ' on' : '')}
                        onClick={() => setFilterLevel(lv)}
                      >
                        <span>{meta.short}</span>
                        {lv !== '' && cnt > 0 && <span className="qb-chip-count">{cnt}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loại câu */}
              <div className="qb-filter-group">
                <span className="qb-filter-label">Loại câu</span>
                <div className="qb-filter-chips">
                  {QUESTION_TYPES.map((tp) => {
                    const cnt = tp.id === '' ? list.length : (counts.byType[tp.id] || 0);
                    return (
                      <button
                        key={tp.id || 'all-type'}
                        type="button"
                        className={'qb-chip' + (filterType === tp.id ? ' on' : '')}
                        onClick={() => setFilterType(tp.id)}
                      >
                        <span>{tp.label}</span>
                        {tp.id !== '' && cnt > 0 && <span className="qb-chip-count">{cnt}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hàng lọc phụ: Sử dụng + Cảnh báo chất lượng + Tag */}
            <div className="qb-filter-subbar">
              <div className="qb-filter-chips">
                <span className="qb-filter-label">Rà soát</span>
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'duplicate', label: `Câu trùng (${counts.dupCount})` },
                  { key: 'no_explain', label: `Thiếu lời giải (${counts.noExplainCount})` },
                  { key: 'bad_answer', label: `Thiếu đáp án (${counts.badAnswerCount})` },
                ].map((qf) => (
                  <button
                    key={qf.key}
                    type="button"
                    className={'qb-chip' + (qualityFilter === qf.key ? ' on' : '')}
                    onClick={() => setQualityFilter(qf.key)}
                  >
                    {qf.label}
                  </button>
                ))}

                <span className="qb-divider-dot">·</span>

                {[
                  { key: 'all', label: 'Mọi mức dùng' },
                  { key: 'unused', label: 'Chưa ra đề' },
                  { key: 'used', label: 'Đã ra đề' },
                ].map((uf) => (
                  <button
                    key={uf.key}
                    type="button"
                    className={'qb-chip' + (usageFilter === uf.key ? ' on' : '')}
                    onClick={() => setUsageFilter(uf.key)}
                  >
                    {uf.label}
                  </button>
                ))}
              </div>

              {hasActiveFilter && (
                <button type="button" className="qb-clear-btn" onClick={handleClearFilters}>
                  × Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* THANH THAO TÁC HÀNG LOẠT (BULK ACTIONS BAR) */}
          {selectedIds.size > 0 && (
            <div className="qb-bulk-bar" role="region" aria-label="Thao tác hàng loạt">
              <div className="qb-bulk-left">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="Chọn tất cả trang này"
                />
                <b>Đã chọn {selectedIds.size} câu</b>
                <button type="button" className="qb-link-btn" onClick={() => setSelectedIds(new Set())}>
                  Bỏ chọn
                </button>
              </div>

              <div className="qb-bulk-actions">
                {/* Đổi độ khó hàng loạt */}
                <select
                  className="qb-bulk-select"
                  defaultValue=""
                  disabled={bulkBusy}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkChangeLevel(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Đổi độ khó...</option>
                  <option value="nhận biết">Dễ (Nhận biết)</option>
                  <option value="thông hiểu">Vừa (Thông hiểu)</option>
                  <option value="vận dụng">Khó (Vận dụng)</option>
                  <option value="vận dụng cao">Rất khó (VDC)</option>
                </select>

                {/* Gắn nhãn (Tag) hàng loạt */}
                <div className="qb-bulk-tag-box">
                  <input
                    type="text"
                    value={bulkTagInput}
                    onChange={(e) => setBulkTagInput(e.target.value)}
                    placeholder="Gắn tag..."
                    onKeyDown={(e) => { if (e.key === 'Enter') handleBulkAddTag(); }}
                  />
                  <button type="button" onClick={handleBulkAddTag} disabled={bulkBusy || !bulkTagInput.trim()}>
                    <IcoTag size={13} /> Gắn
                  </button>
                </div>

                {/* Chuyển thư mục hàng loạt */}
                <button
                  type="button"
                  className="qb-mini-btn"
                  onClick={() => setShowBulkMove((v) => !v)}
                  disabled={bulkBusy}
                >
                  <IcoFolder size={13} /> Chuyển thư mục
                </button>

                {/* Thêm vào Đề đang soạn */}
                <button
                  type="button"
                  className="qb-mini-btn acc"
                  onClick={addSelectedToDraftExam}
                  disabled={bulkBusy}
                >
                  <IcoPlus size={13} /> Vào đề nháp
                </button>

                {/* Xuất sang Game Hub */}
                <select
                  className="qb-bulk-select"
                  defaultValue=""
                  disabled={bulkBusy}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkExportToGame(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  title="Xuất các câu đã chọn sang Game Hub để học sinh chơi ôn tập"
                >
                  <option value="">Xuất sang Game Hub...</option>
                  <option value="chicken">Bắn gà vũ trụ</option>
                  <option value="slingshot">Ná cao su Angry Bird</option>
                  <option value="flip">Lật thẻ ghi nhớ</option>
                  <option value="millionaire">Ai là triệu phú</option>
                  <option value="racing">Đua xe tri thức</option>
                  <option value="tugofwar">Kéo co kiến thức</option>
                  <option value="wheel">Vòng quay may mắn</option>
                </select>

                {/* Xóa hàng loạt */}
                <button
                  type="button"
                  className="qb-mini-btn danger"
                  onClick={handleDeleteSelected}
                  disabled={bulkBusy}
                >
                  <IcoTrash size={13} /> Xóa ({selectedIds.size})
                </button>
              </div>

              {showBulkMove && (
                <div className="qb-bulk-move-row">
                  <span>Chuyển {selectedIds.size} câu tới:</span>
                  <select value={bulkMoveSubject} onChange={(e) => setBulkMoveSubject(e.target.value)}>
                    <option value="">-- Giữ nguyên môn --</option>
                    {ALL_SUBJECTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={bulkMoveGrade} onChange={(e) => setBulkMoveGrade(Number(e.target.value) || 0)}>
                    <option value={0}>-- Giữ nguyên lớp --</option>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                  </select>
                  <select value={bulkMoveTopic} onChange={(e) => setBulkMoveTopic(e.target.value)}>
                    <option value="">-- Giữ nguyên chuyên đề --</option>
                    {getTopicsForSubject(bulkMoveSubject || filterSubject).map((tp) => (
                      <option key={tp.id} value={tp.id}>{tp.name}</option>
                    ))}
                  </select>
                  <button type="button" className="qb-mini-btn acc" onClick={handleBulkMoveFolder}>
                    Áp dụng
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DANH SÁCH CÂU HỎI (LIST / GRID) */}
          {loading ? (
            <div className="qb-loading">
              <div className="page-loader-spinner" />
              <p>Đang tải ngân hàng câu hỏi...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="qb-empty">
              <IcoLibrary size={44} />
              <h3>{list.length === 0 ? 'Ngân hàng câu hỏi đang trống' : 'Không có câu hỏi nào khớp bộ lọc'}</h3>
              <p>
                {list.length === 0
                  ? 'Bắt đầu xây dựng ngân hàng câu hỏi chuẩn hóa theo 3 cách bên dưới.'
                  : 'Thử đổi nhánh thư mục, xóa từ khóa hoặc gỡ bớt tiêu chí lọc.'}
              </p>

              {list.length === 0 && (
                <div className="qb-empty-steps">
                  <div className="qb-empty-step">
                    <div className="qb-empty-step-num">1</div>
                    <b>Soạn thủ công hoặc Nhập CSV</b>
                    <small>Hỗ trợ công thức LaTeX, phân loại chuyên đề & độ khó</small>
                  </div>
                  <div className="qb-empty-step">
                    <div className="qb-empty-step-num">2</div>
                    <b>Sinh câu hỏi bằng AI</b>
                    <small>Tạo nhanh bộ câu hỏi theo chuyên đề & độ khó chỉ định</small>
                  </div>
                  <div className="qb-empty-step">
                    <div className="qb-empty-step-num">3</div>
                    <b>Tách đề từ file PDF / Word</b>
                    <small>Tự động nhận diện câu hỏi, đáp án A/B/C/D và lời giải</small>
                  </div>
                </div>
              )}

              <div className="qb-empty-actions">
                {list.length === 0 ? (
                  <>
                    <button
                      type="button"
                      className="vt-btn primary"
                      onClick={() => { setEditing(null); setShowForm(true); }}
                    >
                      <IcoPlus size={15} /> Thêm câu hỏi đầu tiên
                    </button>
                    <button
                      type="button"
                      className="vt-btn"
                      onClick={() => setShowImporter(true)}
                    >
                      <IcoUpload size={15} /> Nhập đề từ file
                    </button>
                    <button
                      type="button"
                      className="vt-btn"
                      onClick={handleTriggerAiStudio}
                    >
                      <IcoRocket size={15} /> Sinh đề bằng AI
                    </button>
                  </>
                ) : (
                  <button type="button" className="vt-btn primary" onClick={handleClearFilters}>
                    × Xóa toàn bộ bộ lọc
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' ? 'qb-grid' : 'qb-list'}>
                {visibleItems.map((q) => {
                  const lvNorm = normalizeLevel(q.level);
                  const lvMeta = LEVEL_META[lvNorm] || LEVEL_META[''];
                  const qType = getQuestionType(q, customMeta);
                  const qm = qualityMap[q.id] || {};
                  const accRate = getAccuracyRate(q, customMeta);
                  const isSelected = selectedIds.has(q.id);
                  const isActive = activeQuestion?.id === q.id;
                  const inDraft = draftExamItems.some((d) => d.id === q.id);

                  return (
                    <article
                      key={q.id}
                      className={
                        'qb-item' +
                        (isSelected ? ' selected' : '') +
                        (isActive ? ' active-card' : '')
                      }
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', q.id);
                      }}
                      onClick={() => setActiveId(q.id)}
                    >
                      <div className="qb-item-left-col" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelect(q.id, e)}
                          aria-label="Chọn câu hỏi"
                          className="qb-checkbox"
                        />
                        <span className="qb-drag-handle" title="Kéo thả vào thanh Đề đang soạn bên dưới">
                          <IcoGrip size={14} />
                        </span>
                      </div>

                      <div className="qb-item-body">
                        {/* Dòng chip phân loại đầu thẻ */}
                        <div className="qb-item-top-chips">
                          <span className={`qb-level-chip ${lvMeta.tone}`}>
                            {lvMeta.badge}
                          </span>
                          <span className="qb-type-chip">{TYPE_LABEL[qType] || 'Trắc nghiệm'}</span>
                          {q.subject && <span className="qb-meta-pill">{q.subject}</span>}
                          {q.grade > 0 && <span className="qb-meta-pill">Lớp {q.grade}</span>}
                          {q.topicId && (
                            <span className="qb-meta-pill acc">
                              {getTopicName(q.topicId, q.subject)}
                            </span>
                          )}
                        </div>

                        {/* Nội dung câu hỏi */}
                        <MathText as="p" className="qb-item-q">{q.q}</MathText>

                        {/* Các phương án rút gọn */}
                        <div className="qb-item-opts">
                          {(q.options || []).map((opt, i) => (
                            <span key={i} className={'qb-item-opt' + (i === q.correct ? ' correct' : '')}>
                              <b>{String.fromCharCode(65 + i)}.</b>
                              <MathText>{opt}</MathText>
                            </span>
                          ))}
                        </div>

                        {/* Chân thẻ: Thống kê + Cảnh báo chất lượng */}
                        <div className="qb-item-meta">
                          <span className="qb-meta-stat">
                            Đã dùng: <b>{q.usageCount || 0}</b> lần
                          </span>
                          <span className="qb-meta-stat">
                            Tỉ lệ đúng: <b className={accRate < 50 ? 'qb-acc-bad' : 'qb-acc-ok'}>{accRate}%</b>
                          </span>

                          {qm.isDuplicate && (
                            <span className="qb-warn-pill dup" onClick={(e) => e.stopPropagation()}>
                              <IcoAlert size={12} /> Trùng lặp
                              <button
                                type="button"
                                className="qb-merge-inline-btn"
                                onClick={() => handleMergeDuplicate(q, qm.duplicateOf)}
                              >
                                <IcoMerge size={11} /> Gộp câu trùng
                              </button>
                            </span>
                          )}
                          {qm.badAnswer && (
                            <span className="qb-warn-pill err">
                              <IcoAlert size={12} /> Thiếu đáp án đúng
                            </span>
                          )}
                          {qm.noExplain && (
                            <span className="qb-warn-pill warn">
                              Chưa có lời giải
                            </span>
                          )}

                          {(q.tags || []).filter((t) => !t.startsWith('loai:')).map((t) => (
                            <span key={t} className="qb-meta-pill">#{t}</span>
                          ))}
                        </div>
                      </div>

                      <div className="qb-item-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={'qb-icon-btn' + (inDraft ? ' in-draft' : '')}
                          onClick={() => addToDraftExam(q)}
                          title={inDraft ? 'Đã có trong Đề đang soạn' : 'Thêm vào Đề đang soạn'}
                        >
                          {inDraft ? <IcoCheck size={14} /> : <IcoPlus size={14} />}
                        </button>
                        <button
                          type="button"
                          className="qb-icon-btn"
                          onClick={() => { setEditing(q); setShowForm(true); }}
                          title="Mở hộp thoại sửa đầy đủ"
                        >
                          <IcoEdit size={14} />
                        </button>
                        <button
                          type="button"
                          className="qb-icon-btn danger"
                          onClick={() => handleDelete(q)}
                          title="Xóa câu hỏi"
                        >
                          <IcoTrash size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleCount < filtered.length && (
                <div className="qb-load-more">
                  <button
                    type="button"
                    className="vt-btn"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  >
                    Tải thêm {Math.min(PAGE_SIZE, filtered.length - visibleCount)} câu
                    ({visibleCount}/{filtered.length})
                  </button>
                </div>
              )}
            </>
          )}

          {/* THANH KÉO THẢ "ĐỀ ĐANG SOẠN" (DRAFT EXAM DROPZONE BAR) */}
          <div
            className={
              'qb-draft-bar' +
              (dragOverDraft ? ' is-drag-over' : '') +
              (draftExamItems.length > 0 ? ' has-items' : '')
            }
            onDragOver={(e) => { e.preventDefault(); setDragOverDraft(true); }}
            onDragLeave={() => setDragOverDraft(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverDraft(false);
              const qId = e.dataTransfer.getData('text/plain');
              const found = list.find((x) => x.id === qId);
              if (found) addToDraftExam(found);
            }}
          >
            <div className="qb-draft-bar-info">
              <span className="qb-draft-badge">
                <IcoFileText size={15} /> Đề đang soạn: <b>{draftStats.count}</b> câu
              </span>
              {draftStats.count > 0 ? (
                <div className="qb-draft-metrics">
                  <span>Tổng điểm: <b>{draftStats.totalPoints} đ</b></span>
                  <span><IcoClock size={13} /> Ước tính: <b>~{draftStats.estMinutes} phút</b></span>
                </div>
              ) : (
                <span className="qb-draft-hint">
                  Kéo thả thẻ câu hỏi vào đây hoặc bấm nút <b>+</b> trên câu hỏi để gom đề thi nhanh
                </span>
              )}
            </div>

            {draftStats.count > 0 && (
              <div className="qb-draft-bar-actions">
                <button
                  type="button"
                  className="qb-mini-btn"
                  onClick={() => setShowDraftModal(true)}
                >
                  Xem & Sắp xếp ({draftStats.count})
                </button>
                <button
                  type="button"
                  className="qb-mini-btn"
                  onClick={() => setDraftExamItems([])}
                >
                  Xóa nháp
                </button>
                <button
                  type="button"
                  className="vt-btn sm primary"
                  onClick={() => setShowDraftModal(true)}
                >
                  <IcoRocket size={14} /> Tạo đề thi ngay
                </button>
              </div>
            )}
          </div>
        </main>

        {/* ====== VÙNG 3 (PHẢI): XEM TRƯỚC, SỬA NHANH & TRỢ LÝ AI ====== */}
        <aside className="qb-pane-right" aria-label="Khung xem trước, sửa nhanh và trợ lý AI">
          {!activeQuestion ? (
            <div className="qb-right-empty">
              <IcoLibrary size={32} />
              <h4>Chọn một câu hỏi</h4>
              <p>Bấm vào bất kỳ thẻ câu hỏi nào ở danh sách giữa để xem chi tiết, sửa nhanh hoặc dùng Trợ lý AI.</p>
            </div>
          ) : (
            <>
              <div className="qb-right-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === 'preview'}
                  className={'qb-right-tab' + (rightTab === 'preview' ? ' active' : '')}
                  onClick={() => setRightTab('preview')}
                >
                  Xem trước
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === 'quick_edit'}
                  className={'qb-right-tab' + (rightTab === 'quick_edit' ? ' active' : '')}
                  onClick={() => setRightTab('quick_edit')}
                >
                  Sửa nhanh
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rightTab === 'ai'}
                  className={'qb-right-tab' + (rightTab === 'ai' ? ' active' : '')}
                  onClick={() => setRightTab('ai')}
                >
                  <IcoSparkles size={14} /> Trợ lý AI
                </button>
              </div>

              <div className="qb-right-body">
                {/* TAB 1: XEM TRƯỚC CHI TIẾT */}
                {rightTab === 'preview' && (
                  <div className="qb-preview-pane">
                    <div className="qb-preview-chips">
                      <span className={`qb-level-chip ${(LEVEL_META[normalizeLevel(activeQuestion.level)] || LEVEL_META['']).tone}`}>
                        {(LEVEL_META[normalizeLevel(activeQuestion.level)] || LEVEL_META['']).label}
                      </span>
                      <span className="qb-type-chip">
                        {TYPE_LABEL[getQuestionType(activeQuestion, customMeta)]}
                      </span>
                      <span className="qb-meta-pill">{activeQuestion.points || 1} điểm</span>
                    </div>

                    <div className="qb-preview-stem">
                      <MathText as="div">{activeQuestion.q}</MathText>
                    </div>

                    <div className="qb-preview-options">
                      {(activeQuestion.options || []).map((opt, idx) => {
                        const isCorr = idx === activeQuestion.correct;
                        return (
                          <div key={idx} className={'qb-preview-opt' + (isCorr ? ' correct' : '')}>
                            <span className="qb-preview-opt-key">{String.fromCharCode(65 + idx)}</span>
                            <div className="qb-preview-opt-text">
                              <MathText>{opt}</MathText>
                            </div>
                            {isCorr && <span className="qb-preview-correct-tag">Đáp án đúng</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="qb-preview-explain">
                      <h5>Lời giải & Hướng dẫn chấm</h5>
                      {activeQuestion.explain ? (
                        <MathText as="div" className="qb-preview-explain-content">
                          {activeQuestion.explain}
                        </MathText>
                      ) : (
                        <div className="qb-preview-no-explain">
                          <span>Chưa có lời giải chi tiết cho câu hỏi này.</span>
                          <button
                            type="button"
                            className="qb-mini-btn acc"
                            onClick={() => {
                              setRightTab('ai');
                              runAiWriteExplain();
                            }}
                          >
                            <IcoSparkles size={12} /> Nhờ AI viết lời giải
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="qb-preview-meta-grid">
                      <div>
                        <small>Môn & Lớp</small>
                        <b>{activeQuestion.subject || 'Chưa phân môn'} {activeQuestion.grade ? `· Lớp ${activeQuestion.grade}` : ''}</b>
                      </div>
                      <div>
                        <small>Chuyên đề</small>
                        <b>{getTopicName(activeQuestion.topicId, activeQuestion.subject) || 'Chưa gắn chuyên đề'}</b>
                      </div>
                      <div>
                        <small>Lịch sử ra đề</small>
                        <b>Đã dùng {activeQuestion.usageCount || 0} lần</b>
                      </div>
                      <div>
                        <small>Tỉ lệ HS làm đúng</small>
                        <b>{getAccuracyRate(activeQuestion, customMeta)}%</b>
                      </div>
                    </div>

                    <div className="qb-preview-foot-actions">
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={() => setRightTab('quick_edit')}
                      >
                        <IcoEdit size={14} /> Sửa nhanh
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm primary"
                        onClick={() => addToDraftExam(activeQuestion)}
                      >
                        <IcoPlus size={14} /> Thêm vào Đề đang soạn
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: SỬA NHANH (QUICK EDIT INLINE) */}
                {rightTab === 'quick_edit' && quickDraft && (
                  <div className="qb-quick-edit">
                    <label className="qb-field">
                      <span>Nội dung câu hỏi</span>
                      <textarea
                        rows={3}
                        value={quickDraft.q}
                        onChange={(e) => setQuickDraft((d) => ({ ...d, q: e.target.value }))}
                      />
                    </label>

                    <div className="qb-row-2">
                      <label className="qb-field">
                        <span>Độ khó</span>
                        <select
                          value={quickDraft.level}
                          onChange={(e) => setQuickDraft((d) => ({ ...d, level: e.target.value }))}
                        >
                          {LEVELS.map((l) => (
                            <option key={l} value={l}>{LEVEL_META[l]?.label || 'Chưa phân loại'}</option>
                          ))}
                        </select>
                      </label>
                      <label className="qb-field">
                        <span>Loại câu</span>
                        <select
                          value={quickDraft.type}
                          onChange={(e) => setQuickDraft((d) => ({ ...d, type: e.target.value }))}
                        >
                          {QUESTION_TYPES.filter((t) => t.id).map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="qb-row-2">
                      <label className="qb-field">
                        <span>Môn học</span>
                        <select
                          value={quickDraft.subject}
                          onChange={(e) => setQuickDraft((d) => ({ ...d, subject: e.target.value, topicId: '' }))}
                        >
                          {ALL_SUBJECTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                      <label className="qb-field">
                        <span>Lớp</span>
                        <select
                          value={quickDraft.grade}
                          onChange={(e) => setQuickDraft((d) => ({ ...d, grade: Number(e.target.value) || 0 }))}
                        >
                          {GRADES.map((g) => <option key={g} value={g}>{g === 0 ? 'Mọi lớp' : `Lớp ${g}`}</option>)}
                        </select>
                      </label>
                    </div>

                    <label className="qb-field">
                      <span>Chuyên đề</span>
                      <select
                        value={quickDraft.topicId}
                        onChange={(e) => setQuickDraft((d) => ({ ...d, topicId: e.target.value }))}
                      >
                        <option value="">-- Chưa phân loại --</option>
                        {getTopicsForSubject(quickDraft.subject).map((tp) => (
                          <option key={tp.id} value={tp.id}>{tp.name}</option>
                        ))}
                      </select>
                    </label>

                    <div className="qb-field">
                      <span>Phương án & Đáp án đúng (chọn nút tròn)</span>
                      {quickDraft.options.map((opt, idx) => (
                        <div key={idx} className={'qb-opt-row' + (quickDraft.correct === idx ? ' correct' : '')}>
                          <input
                            type="radio"
                            name="qb-quick-correct"
                            checked={quickDraft.correct === idx}
                            onChange={() => setQuickDraft((d) => ({ ...d, correct: idx }))}
                          />
                          <span className="qb-opt-key">{String.fromCharCode(65 + idx)}</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuickDraft((d) => ({
                                ...d,
                                options: d.options.map((o, k) => (k === idx ? val : o)),
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <label className="qb-field">
                      <span>Lời giải chi tiết</span>
                      <textarea
                        rows={3}
                        value={quickDraft.explain}
                        onChange={(e) => setQuickDraft((d) => ({ ...d, explain: e.target.value }))}
                        placeholder="Nhập hướng dẫn giải..."
                      />
                    </label>

                    <div className="qb-quick-edit-actions">
                      <button
                        type="button"
                        className="vt-btn sm"
                        onClick={() => setRightTab('preview')}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm primary"
                        disabled={saving}
                        onClick={handleSaveQuickEdit}
                      >
                        <IcoCheck size={14} /> {saving ? 'Đang lưu...' : 'Lưu nhanh'}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: TRỢ LÝ AI (4 TÁC VỤ) */}
                {rightTab === 'ai' && (
                  <div className="qb-ai-pane">
                    <p className="qb-ai-intro">
                      Trợ lý AI phân tích câu hỏi đang chọn để hỗ trợ biên tập, kiểm định đáp án và mở rộng ngân hàng đề:
                    </p>

                    <div className="qb-ai-actions-grid">
                      <button
                        type="button"
                        className="qb-ai-action-card"
                        onClick={runAiSimilarQuestion}
                        disabled={aiBusy}
                      >
                        <IcoSparkles size={18} />
                        <div>
                          <b>Sinh câu tương tự</b>
                          <small>Tạo biến thể mới cùng chuyên đề & đảo phương án</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="qb-ai-action-card"
                        onClick={runAiWriteExplain}
                        disabled={aiBusy}
                      >
                        <IcoFileText size={18} />
                        <div>
                          <b>Viết lời giải chi tiết</b>
                          <small>Tự động phân tích từng bước cho đáp án đúng</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="qb-ai-action-card"
                        onClick={runAiSuggestMeta}
                        disabled={aiBusy}
                      >
                        <IcoTag size={18} />
                        <div>
                          <b>Gợi ý độ khó & chuyên đề</b>
                          <small>Nhận diện mức độ nhận thức & chủ đề kiến thức</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="qb-ai-action-card"
                        onClick={runAiAuditQuestion}
                        disabled={aiBusy}
                      >
                        <IcoCheck size={18} />
                        <div>
                          <b>Kiểm tra đáp án sai</b>
                          <small>Rà soát phương án trùng, thiếu hoặc mâu thuẫn</small>
                        </div>
                      </button>
                    </div>

                    {aiBusy && (
                      <div className="qb-ai-loading">
                        <div className="page-loader-spinner" />
                        <span>AI đang phân tích câu hỏi...</span>
                      </div>
                    )}

                    {aiResult && !aiBusy && (
                      <div className="qb-ai-result-box">
                        <h5>{aiResult.title}</h5>

                        {/* Kết quả 1: Sinh câu tương tự */}
                        {aiResult.kind === 'similar' && aiResult.question && (
                          <div className="qb-ai-similar-preview">
                            <MathText as="p" className="qb-ai-sim-q">{aiResult.question.q}</MathText>
                            <div className="qb-ai-sim-opts">
                              {aiResult.question.options.map((o, i) => (
                                <div key={i} className={i === aiResult.question.correct ? 'is-corr' : ''}>
                                  <b>{String.fromCharCode(65 + i)}.</b> <MathText>{o}</MathText>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="vt-btn sm primary"
                              disabled={saving}
                              onClick={() => executeSaveQuestion(aiResult.question)}
                            >
                              <IcoPlus size={14} /> Lưu câu mới này vào Ngân hàng
                            </button>
                          </div>
                        )}

                        {/* Kết quả 2: Viết lời giải chi tiết */}
                        {aiResult.kind === 'explain' && (
                          <div className="qb-ai-explain-preview">
                            <pre className="qb-ai-explain-text">{aiResult.explain}</pre>
                            <button
                              type="button"
                              className="vt-btn sm primary"
                              disabled={saving}
                              onClick={async () => {
                                await updateQuestion(activeQuestion.id, { explain: aiResult.explain });
                                setList((arr) => arr.map((x) => (
                                  x.id === activeQuestion.id ? { ...x, explain: aiResult.explain } : x
                                )));
                                say('Đã cập nhật lời giải chi tiết');
                                setRightTab('preview');
                              }}
                            >
                              <IcoCheck size={14} /> Áp dụng & Lưu lời giải này
                            </button>
                          </div>
                        )}

                        {/* Kết quả 3: Gợi ý độ khó & chuyên đề */}
                        {aiResult.kind === 'meta' && (
                          <div className="qb-ai-meta-preview">
                            <p>
                              • Độ khó đề xuất: <b>{LEVEL_META[aiResult.suggestedLevel]?.label}</b>
                            </p>
                            <p>
                              • Chuyên đề đề xuất: <b>{aiResult.suggestedTopicName}</b> ({aiResult.suggestedSubject})
                            </p>
                            <button
                              type="button"
                              className="vt-btn sm primary"
                              onClick={async () => {
                                const patch = {
                                  level: aiResult.suggestedLevel,
                                  topicId: aiResult.suggestedTopicId,
                                  subject: aiResult.suggestedSubject,
                                };
                                await updateQuestion(activeQuestion.id, patch);
                                setList((arr) => arr.map((x) => (
                                  x.id === activeQuestion.id ? { ...x, ...patch } : x
                                )));
                                say('Đã áp dụng phân loại độ khó & chuyên đề');
                              }}
                            >
                              <IcoCheck size={14} /> Áp dụng phân loại
                            </button>
                          </div>
                        )}

                        {/* Kết quả 4: Kiểm tra đáp án sai */}
                        {aiResult.kind === 'audit' && (
                          <ul className="qb-ai-audit-list">
                            {aiResult.findings.map((f, idx) => (
                              <li key={idx} className={`qb-audit-item ${f.type}`}>
                                <span>{f.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ============ TOAST & NÚT HOÀN TÁC (UNDO 6S) ============ */}
      {(toast || undoPayload) && (
        <div className="qb-toast-stack" role="status" aria-live="polite">
          {undoPayload ? (
            <div className="qb-undo-toast">
              <span>{undoPayload.label}</span>
              <button type="button" className="qb-undo-btn" onClick={handleUndoDelete}>
                <IcoUndo size={14} /> Hoàn tác
              </button>
            </div>
          ) : (
            <div className="vt-toast success">{toast}</div>
          )}
        </div>
      )}

      {/* ============ HỘP XÁC NHẬN NỘI BỘ (CONFIRM MODAL) ============ */}
      {confirmModal && (
        <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirmModal(null)}>
          <div className="qb-confirm-modal" role="alertdialog" aria-modal="true">
            <div className="qb-confirm-head">
              <IcoAlert size={20} />
              <h3>{confirmModal.title}</h3>
            </div>
            <p className="qb-confirm-msg">{confirmModal.message}</p>
            <div className="qb-confirm-foot">
              <button type="button" className="vt-btn" onClick={() => setConfirmModal(null)}>
                Hủy bỏ
              </button>
              <button
                type="button"
                className={'vt-btn ' + (confirmModal.tone === 'danger' ? 'danger-solid' : 'primary')}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmLabel || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL NHẬP NHANH CSV / EXCEL / TEXT CÓ BÁO LỖI TỪNG DÒNG ============ */}
      {showQuickImport && (
        <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowQuickImport(false)}>
          <div className="qb-picker qb-quick-import-modal" role="dialog" aria-modal="true" aria-label="Nhập nhanh CSV / Excel / Text">
            <header className="qb-form-head">
              <h2>Nhập nhanh CSV / Excel / Văn bản (Có kiểm tra lỗi từng dòng)</h2>
              <button type="button" className="qb-icon-btn" onClick={() => setShowQuickImport(false)}>
                <IcoClose size={16} />
              </button>
            </header>

            <div className="qb-picker-body">
              <div className="qb-import-top-bar">
                <label className="vt-btn sm">
                  <IcoUpload size={14} /> Chọn file .CSV / .TXT
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleQuickImportFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className="qb-import-hint">
                  Hoặc dán trực tiếp bảng từ Excel (Cột: Câu hỏi | A | B | C | D | Đáp án đúng | Lời giải) hoặc định dạng Câu 1: ... A. ... B. ...
                </span>
              </div>

              <textarea
                className="qb-import-textarea"
                rows={5}
                value={quickImportText}
                onChange={(e) => setQuickImportText(e.target.value)}
                placeholder={'Ví dụ:\nCâu 1: Kim loại nào dẫn điện tốt nhất?\nA. Bạc (Ag)\nB. Đồng (Cu)\nC. Vàng (Au)\nD. Nhôm (Al)\nĐáp án: A\nLời giải: Bạc có độ dẫn điện cao nhất trong các kim loại.'}
              />

              {quickImportRows.length > 0 && (
                <div className="qb-import-preview-wrap">
                  <div className="qb-import-summary">
                    <b>Xem trước {quickImportRows.length} dòng:</b>
                    <span className="ok">
                      Hợp lệ: {quickImportRows.filter((r) => r.status === 'valid').length}
                    </span>
                    <span className="warn">
                      Trùng lặp: {quickImportRows.filter((r) => r.status === 'duplicate').length}
                    </span>
                    <span className="err">
                      Lỗi thiếu đáp án: {quickImportRows.filter((r) => r.status === 'error').length}
                    </span>
                  </div>

                  <div className="qb-import-table-scroll">
                    <table className="qb-import-table">
                      <thead>
                        <tr>
                          <th>Chọn</th>
                          <th>Dòng</th>
                          <th>Nội dung câu hỏi</th>
                          <th>Phương án</th>
                          <th>Đ/A</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quickImportRows.map((row, idx) => (
                          <tr key={row.id} className={`status-${row.status}`}>
                            <td>
                              <input
                                type="checkbox"
                                checked={row.selected}
                                disabled={row.status === 'error'}
                                onChange={() => {
                                  setQuickImportRows((prev) => prev.map((r, i) => (
                                    i === idx ? { ...r, selected: !r.selected } : r
                                  )));
                                }}
                              />
                            </td>
                            <td>#{row.lineNum}</td>
                            <td className="qb-td-q">{row.q || <em>(Trống)</em>}</td>
                            <td>{row.options.length} phương án</td>
                            <td><b>{row.correctLetter}</b></td>
                            <td>
                              <span className={`qb-row-status ${row.status}`}>
                                {row.statusText}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <footer className="qb-form-foot">
              <button type="button" className="vt-btn" onClick={() => setShowQuickImport(false)}>
                Đóng
              </button>
              <button
                type="button"
                className="vt-btn primary"
                disabled={saving || quickImportRows.filter((r) => r.selected && r.status !== 'error').length === 0}
                onClick={handleSaveQuickImportRows}
              >
                <IcoCheck size={14} /> Lưu {quickImportRows.filter((r) => r.selected && r.status !== 'error').length} câu hợp lệ
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ============ MODAL QUẢN LÝ & TẠO ĐỀ TỪ "ĐỀ ĐANG SOẠN" ============ */}
      {showDraftModal && (
        <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowDraftModal(false)}>
          <div className="qb-picker" role="dialog" aria-modal="true" aria-label="Đề đang soạn">
            <header className="qb-form-head">
              <h2>Đề đang soạn ({draftStats.count} câu · {draftStats.totalPoints} điểm · ~{draftStats.estMinutes} phút)</h2>
              <button type="button" className="qb-icon-btn" onClick={() => setShowDraftModal(false)}>
                <IcoClose size={16} />
              </button>
            </header>

            <div className="qb-picker-body">
              <div className="qb-row-3">
                <label className="qb-field">
                  <span>Tên đề kiểm tra</span>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                  />
                </label>
                <label className="qb-field">
                  <span>Giao cho lớp (tùy chọn)</span>
                  <select value={draftClassId} onChange={(e) => setDraftClassId(e.target.value)}>
                    <option value="">-- Chưa chọn lớp --</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="qb-field">
                  <span>Thời gian làm bài (phút)</span>
                  <input
                    type="number"
                    min={5}
                    value={draftDuration}
                    onChange={(e) => setDraftDuration(e.target.value)}
                  />
                </label>
              </div>

              <div className="qb-draft-list">
                {draftExamItems.map((item, idx) => (
                  <div key={item.id} className="qb-draft-row">
                    <span className="qb-draft-num">Câu {idx + 1}</span>
                    <div className="qb-draft-q">
                      <MathText>{item.q}</MathText>
                    </div>
                    <span className="qb-meta-pill">{LEVEL_META[normalizeLevel(item.level)]?.short || 'NB'}</span>
                    <div className="qb-draft-row-btns">
                      <button type="button" className="qb-icon-btn sm" onClick={() => moveDraftItem(idx, -1)} disabled={idx === 0}>↑</button>
                      <button type="button" className="qb-icon-btn sm" onClick={() => moveDraftItem(idx, 1)} disabled={idx === draftExamItems.length - 1}>↓</button>
                      <button type="button" className="qb-icon-btn sm danger" onClick={() => removeFromDraftExam(item.id)}>
                        <IcoTrash size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <footer className="qb-form-foot">
              <button type="button" className="vt-btn" onClick={() => setShowDraftModal(false)}>
                Đóng
              </button>
              <button
                type="button"
                className="vt-btn primary"
                disabled={saving || draftExamItems.length === 0}
                onClick={handleCreateExamFromDraft}
              >
                <IcoRocket size={14} /> {saving ? 'Đang tạo đề...' : 'Phát hành Đề thi ngay'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ============ MODAL SINH CÂU HỎI BẰNG AI TẠI CHỖ ============ */}
      {showAiGeneratorModal && (
        <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowAiGeneratorModal(false)}>
          <div className="qb-picker" role="dialog" aria-modal="true" aria-label="Sinh câu hỏi bằng AI">
            <header className="qb-form-head">
              <h2><IcoSparkles size={18} /> Sinh câu hỏi thông minh bằng AI</h2>
              <button type="button" className="qb-icon-btn" onClick={() => setShowAiGeneratorModal(false)}>
                <IcoClose size={16} />
              </button>
            </header>

            <div className="qb-picker-body">
              <div className="qb-row-3">
                <label className="qb-field">
                  <span>Môn học</span>
                  <select value={aiGenSubject} onChange={(e) => { setAiGenSubject(e.target.value); setAiGenTopic(''); }}>
                    {ALL_SUBJECTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="qb-field">
                  <span>Khối lớp</span>
                  <select value={aiGenGrade} onChange={(e) => setAiGenGrade(Number(e.target.value) || 12)}>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
                  </select>
                </label>
                <label className="qb-field">
                  <span>Độ khó</span>
                  <select value={aiGenLevel} onChange={(e) => setAiGenLevel(e.target.value)}>
                    {LEVELS.filter(Boolean).map((l) => <option key={l} value={l}>{LEVEL_META[l]?.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="qb-row-2">
                <label className="qb-field">
                  <span>Chuyên đề trọng tâm</span>
                  <select value={aiGenTopic} onChange={(e) => setAiGenTopic(e.target.value)}>
                    <option value="">-- Tổng hợp môn {aiGenSubject} --</option>
                    {getTopicsForSubject(aiGenSubject).map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                  </select>
                </label>
                <label className="qb-field">
                  <span>Số lượng câu cần sinh</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={aiGenCount}
                      onChange={(e) => setAiGenCount(e.target.value)}
                    />
                    <button type="button" className="vt-btn primary" onClick={handleGenerateAiQuestionsBatch}>
                      <IcoSparkles size={14} /> Sinh câu hỏi
                    </button>
                  </div>
                </label>
              </div>

              {aiGeneratedList.length > 0 && (
                <div className="qb-ai-gen-preview-list">
                  {aiGeneratedList.map((item, idx) => (
                    <div key={item.id} className="qb-item">
                      <div className="qb-item-body">
                        <p className="qb-item-q"><b>Câu {idx + 1}:</b> {item.q}</p>
                        <div className="qb-item-opts">
                          {item.options.map((o, i) => (
                            <span key={i} className={'qb-item-opt' + (i === item.correct ? ' correct' : '')}>
                              <b>{String.fromCharCode(65 + i)}.</b> {o}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <footer className="qb-form-foot">
              <button type="button" className="vt-btn" onClick={() => setShowAiGeneratorModal(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="vt-btn primary"
                disabled={saving || aiGeneratedList.length === 0}
                onClick={handleSaveAiGeneratedBatch}
              >
                <IcoCheck size={14} /> Lưu {aiGeneratedList.length} câu vào Ngân hàng
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ============ MODAL FORM THÊM/SỬA ĐẦY ĐỦ & EXAM IMPORTER ============ */}
      {showForm && (
        <QuestionBankForm
          key={editing?.id || 'new-' + formKey}
          initial={editing}
          defaultSubject={filterSubject}
          defaultGrade={filterGrade}
          saving={saving}
          onSave={handleAdd}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {showImporter && (
        <ExamImporter
          onClose={() => setShowImporter(false)}
          onSaveToBank={handleImportToBank}
          onCreateSoftExam={handleCreateSoftExam}
          classes={classes}
          defaultSubject={filterSubject}
          defaultGrade={filterGrade}
        />
      )}

      {/* Khung in PDF ẩn dùng cho exportToPDF */}
      <div className="qb-pdf-print-sheet" ref={pdfPrintRef} aria-hidden="true">
        <h2>NGÂN HÀNG CÂU HỎI — {filterSubject ? filterSubject.toUpperCase() : 'TỔNG HỢP'}</h2>
        <p>Tổng số: {filtered.length} câu hỏi · Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
        <hr />
        {filtered.slice(0, 60).map((q, idx) => (
          <div key={q.id} className="qb-pdf-q-block">
            <p><b>Câu {idx + 1}:</b> {q.q}</p>
            <div className="qb-pdf-opts">
              {(q.options || []).map((opt, oIdx) => (
                <span key={oIdx}>
                  <b>{String.fromCharCode(65 + oIdx)}.</b> {opt}{'   '}
                </span>
              ))}
            </div>
            <small>Đáp án đúng: {String.fromCharCode(65 + (q.correct || 0))} {q.explain ? `— Lời giải: ${q.explain}` : ''}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
