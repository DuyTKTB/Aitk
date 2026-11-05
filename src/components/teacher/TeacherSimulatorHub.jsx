/* ============================================================
   TeacherSimulatorHub.jsx — Trung Tâm Trộn Đề Thi & Mô Phỏng (v4.0)
   ------------------------------------------------------------
   • Tích hợp giao diện "TRỘN ĐỀ THI" chuẩn 4 mục:
     1. NHẬP ĐỀ GỐC (Nhập đề từ File Word, Nhập File Word English, Xem lại đề gốc, Xóa đề đã nạp)
     2. THÔNG TIN TRANG ĐẦU CỦA ĐỀ THI (Sở GD, Tên trường, Tên kì thi, Môn thi, Lớp, Năm học, Thời gian)
     3. CẤU HÌNH TRỘN (Phần I + đảo A/B/C/D, Phần II + đảo a/b/c/d, Phần III, Định dạng công thức)
     4. SỐ LƯỢNG MÃ ĐỀ CẦN TẠO & XUẤT FILE WORD / IN A4 / MÔ PHỎNG
   • Kết nối trực tiếp với ExamImporter v4.0 (tự động nhận diện hình ảnh, MathType/OMML, 3 phần GDPT 2025)
   ============================================================ */
import { useState, useMemo, useEffect } from 'react';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import ExamImporter from './ExamImporter.jsx';
import { PRESET_SAMPLE_EXAMS } from '../../lib/sampleExamsData.js';
import { hasPositionalOption, generateShuffledVersions } from '../../lib/examShuffle.js';
import { exportBundleZip, exportToWord } from '../../lib/examExport.js';
import { normLevel } from '../../lib/matrixAiService.js';
import sound from '../../lib/gameSound.js';
import '../../styles/teacher-simulator-hub.css';

const HISTORY_STORAGE_KEY = 'cs-shuffle-history-v1';

/* ============ SVG ICONS ============ */
const Svg = ({ size = 16, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>;
const IcoPrinter = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoShuffle = (p) => <Svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></Svg>;
const IcoBook = (p) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Svg>;
const IcoSpark = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
const IcoPlay = (p) => <Svg {...p}><polygon points="5 3 19 12 5 21 5 3" /></Svg>;
const IcoSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Svg>;
const IcoGrid = (p) => <Svg {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></Svg>;
const IcoList = (p) => <Svg {...p}><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></Svg>;
const IcoSliders = (p) => <Svg {...p}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></Svg>;
const IcoSend = (p) => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></Svg>;
const IcoHistory = (p) => <Svg {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><polyline points="3 3 3 8 8 8" /><polyline points="12 7 12 12 15 15" /></Svg>;
const IcoShieldCheck = (p) => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></Svg>;
const IcoDoc = (p) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></Svg>;
const IcoGlobe = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Svg>;
const IcoEye = (p) => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>;
const IcoTrash = (p) => <Svg {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>;
const IcoDownload = (p) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>;
const IcoCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IcoImage = (p) => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></Svg>;

function readShuffleHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function summarizeExamQuestions(questions = []) {
  const counts = { nb: 0, th: 0, vd: 0, vdc: 0 };
  const parts = { p1: 0, p2: 0, p3: 0 };
  let specialCount = 0;
  let imageCount = 0;
  let explainCount = 0;
  let validAnswerCount = 0;

  questions.forEach((q) => {
    const lv = normLevel(q.level);
    counts[lv] = (counts[lv] || 0) + 1;
    const type = q.type || (Array.isArray(q.statements) && q.statements.length > 0 ? 'true_false' : 'single_choice');
    if (type === 'true_false') {
      parts.p2 += 1;
      const st = q.statements || [];
      if (st.length === 4 && st.every((s) => typeof (s.answer ?? s.correct) === 'boolean')) {
        validAnswerCount += 1;
      }
    } else if (type === 'short_answer') {
      parts.p3 += 1;
      if (String(q.answer ?? (q.accepted || [])[0] ?? '').trim() !== '') {
        validAnswerCount += 1;
      }
    } else {
      parts.p1 += 1;
      if (typeof q.correct === 'number' && q.correct >= 0 && q.correct < (q.options || []).length) {
        validAnswerCount += 1;
      }
    }
    if (q.image || q.imageUrl || (Array.isArray(q.images) && q.images.length > 0)) {
      imageCount += 1;
    }
    if (String(q.explain || '').trim()) {
      explainCount += 1;
    }
    if (hasPositionalOption(q.options || [])) {
      specialCount += 1;
    }
  });
  return {
    counts,
    parts,
    specialCount,
    imageCount,
    explainCount,
    validAnswerCount,
    total: questions.length,
  };
}

/* ============ MAIN COMPONENT ============ */
export default function TeacherSimulatorHub({
  teacherExams = [],
  classes = [],
  onImportPreset,
  onAssignShuffled,
  initialImportedExam = null,
}) {
  const [activeExam, setActiveExam] = useState(null);
  const [initialTab, setInitialTab] = useState('sim');
  const [initialWizardStep, setInitialWizardStep] = useState(null);
  const [hubTab, setHubTab] = useState('my-exams');

  // Importer modal inside "TRỘN ĐỀ THI"
  const [importerOpen, setImporterOpen] = useState(false);
  const [importerEnglishMode, setImporterEnglishMode] = useState(false);

  // Loaded exam in "1. NHẬP ĐỀ GỐC"
  const [loadedExam, setLoadedExam] = useState(() => {
    if (initialImportedExam?.questions?.length) return initialImportedExam;
    if (teacherExams[0]?.questions?.length) {
      return {
        id: teacherExams[0].id,
        title: teacherExams[0].title,
        fileName: `${teacherExams[0].title}.docx`,
        questions: teacherExams[0].questions,
        subject: teacherExams[0].subject || 'Hóa học',
        duration: teacherExams[0].duration || 45,
      };
    }
    if (PRESET_SAMPLE_EXAMS[0]?.questions?.length) {
      return {
        id: PRESET_SAMPLE_EXAMS[0].id,
        title: PRESET_SAMPLE_EXAMS[0].title,
        fileName: '15. BÀI 15 - NGUỒN ĐIỆN HÓA HỌC - P2 (GV).docx',
        questions: PRESET_SAMPLE_EXAMS[0].questions,
        subject: PRESET_SAMPLE_EXAMS[0].subject || 'Hóa học',
        duration: PRESET_SAMPLE_EXAMS[0].duration || 45,
      };
    }
    return null;
  });

  useEffect(() => {
    if (initialImportedExam?.questions?.length) {
      setLoadedExam(initialImportedExam);
    }
  }, [initialImportedExam]);

  // "2. THÔNG TIN TRANG ĐẦU CỦA ĐỀ THI"
  const [headerInfo, setHeaderInfo] = useState({
    deptName: 'Sở GD - ĐT Quảng Trị',
    schoolName: 'THPT Nguyễn Chí Thanh',
    examName: 'KIỂM TRA ĐÁNH GIÁ GIỮA KÌ I',
    subject: 'Hóa học',
    grade: '12',
    schoolYear: '2026 - 2027',
    duration: 45,
  });

  // "3. CẤU HÌNH TRỘN"
  const [mixConfig, setMixConfig] = useState({
    shufflePart1: true,
    shufflePart1Options: true,
    shufflePart2: true,
    shufflePart2Statements: true,
    shufflePart3: true,
    formulaFormat: 'mathtype',
  });

  // "4. SỐ LƯỢNG MÃ ĐỀ CẦN TẠO"
  const [codeCount, setCodeCount] = useState(4);
  const [exportingZip, setExportingZip] = useState(false);

  // Step 1 Filters, Search, Sort, View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  const [historyList, setHistoryList] = useState(() => readShuffleHistory());

  const refreshHistory = () => {
    setHistoryList(readShuffleHistory());
  };

  const loadedStats = useMemo(
    () => summarizeExamQuestions(loadedExam?.questions || []),
    [loadedExam]
  );

  const handleOpenPreview = (exam, tab = 'sim', step = null) => {
    sound.pop();
    setInitialTab(tab);
    setInitialWizardStep(step);
    setActiveExam({
      ...exam,
      title: headerInfo.examName || exam.title || 'Đề kiểm tra',
      subject: headerInfo.subject || exam.subject || 'Hóa học',
      duration: Number(headerInfo.duration) || exam.duration || 45,
      headerInfo,
      shuffleConfig: {
        codeCount,
        seedInput: String(exam.seed || '2025'),
        shuffleQuestions: mixConfig.shufflePart1 || mixConfig.shufflePart2 || mixConfig.shufflePart3,
        shuffleOptions: mixConfig.shufflePart1Options,
        shufflePart1: mixConfig.shufflePart1,
        shufflePart1Options: mixConfig.shufflePart1Options,
        shufflePart2: mixConfig.shufflePart2,
        shufflePart2Statements: mixConfig.shufflePart2Statements,
        shufflePart3: mixConfig.shufflePart3,
        keepDifficultyGroups: true,
        keepLinkedGroups: true,
        smartSpecialOptions: true,
      },
    });
  };

  const handleMixLoadedExam = (targetTab = 'shuffle', targetStep = 3) => {
    const candidate = loadedExam || teacherExams[0] || PRESET_SAMPLE_EXAMS[0];
    if (!candidate || !candidate.questions?.length) {
      setImporterEnglishMode(false);
      setImporterOpen(true);
      return;
    }
    handleOpenPreview(candidate, targetTab, targetStep);
  };

  const handleDirectDownloadWordZip = async () => {
    const candidate = loadedExam || teacherExams[0] || PRESET_SAMPLE_EXAMS[0];
    if (!candidate || !candidate.questions?.length) return;
    try {
      setExportingZip(true);
      const versions = generateShuffledVersions(candidate.questions, codeCount, {
        seedText: '2025',
        shufflePart1: mixConfig.shufflePart1,
        shufflePart1Options: mixConfig.shufflePart1Options,
        shufflePart2: mixConfig.shufflePart2,
        shufflePart2Statements: mixConfig.shufflePart2Statements,
        shufflePart3: mixConfig.shufflePart3,
      });
      if (versions.length === 1) {
        await exportToWord({
          examTitle: headerInfo.examName || candidate.title,
          subject: headerInfo.subject,
          duration: Number(headerInfo.duration) || 45,
          code: versions[0].code,
          questions: versions[0].questions,
          includeAnswers: true,
          headerInfo,
        });
      } else {
        await exportBundleZip({
          examTitle: headerInfo.examName || candidate.title,
          subject: headerInfo.subject,
          duration: Number(headerInfo.duration) || 45,
          versions,
          headerInfo,
        });
      }
      sound.cheer();
    } catch (e) {
      console.error(e);
    } finally {
      setExportingZip(false);
    }
  };

  // Available subjects for filter
  const allSubjects = useMemo(() => {
    const set = new Set(['Hóa học', 'Vật lý', 'Sinh học', 'Toán học', 'Tiếng Anh']);
    teacherExams.forEach((e) => {
      if (e.subject) set.add(e.subject);
    });
    PRESET_SAMPLE_EXAMS.forEach((e) => {
      if (e.subject) set.add(e.subject);
    });
    return [...set];
  }, [teacherExams]);

  // Filtered & sorted exams for current tab
  const filteredExams = useMemo(() => {
    const rawList = hubTab === 'my-exams' ? teacherExams : PRESET_SAMPLE_EXAMS;
    const q = searchQuery.trim().toLowerCase();

    const filtered = rawList.filter((ex) => {
      const targetCls = classes.find((c) => c.id === ex.classId);
      const classLabel = targetCls?.name || (ex.grade ? `Khối ${ex.grade}` : 'Chung');
      const subj = ex.subject || 'Hóa học';

      if (q) {
        const matchTitle = (ex.title || '').toLowerCase().includes(q);
        const matchSubj = subj.toLowerCase().includes(q);
        const matchClass = classLabel.toLowerCase().includes(q);
        if (!matchTitle && !matchSubj && !matchClass) return false;
      }

      if (gradeFilter !== 'all') {
        if (gradeFilter.startsWith('grade-')) {
          const g = gradeFilter.replace('grade-', '');
          const examGrade = String(ex.grade || targetCls?.grade || '');
          if (examGrade !== g && !classLabel.includes(g)) return false;
        } else if (ex.classId !== gradeFilter) {
          return false;
        }
      }

      if (subjectFilter !== 'all' && subj !== subjectFilter) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'questions-desc') {
        return (b.questions?.length || 0) - (a.questions?.length || 0);
      }
      if (sortBy === 'duration-asc') {
        return (a.duration || 45) - (b.duration || 45);
      }
      if (sortBy === 'title-asc') {
        return String(a.title || '').localeCompare(String(b.title || ''), 'vi');
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [hubTab, teacherExams, classes, searchQuery, gradeFilter, subjectFilter, sortBy]);

  return (
    <div className="tsh-root">
      {/* ============================================================
          BẢNG ĐIỀU KHIỂN TRỘN ĐỀ THI (CHUẨN GIAO DIỆN 4 MỤC - INDIGO SLATE)
          ============================================================ */}
      <div
        style={{
          background: 'var(--panel, #fff)',
          borderRadius: 16,
          border: '1px solid var(--line, #dbe4f0)',
          boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        {/* Thanh tiêu đề Indigo-Slate chủ đạo */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 48%, #4338ca 100%)',
            padding: '13px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 9,
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IcoShuffle size={16} />
            </span>
            <strong style={{ fontSize: '1.02rem', fontWeight: 900, letterSpacing: '0.02em' }}>
              TRỘN ĐỀ THI &amp; PHÂN TÍCH ĐỀ TỰ ĐỘNG
            </strong>
            <span
              style={{
                background: 'rgba(224, 231, 255, 0.16)',
                border: '1px solid rgba(224, 231, 255, 0.28)',
                color: '#e0e7ff',
                padding: '3px 10px',
                borderRadius: 99,
                fontSize: '0.73rem',
                fontWeight: 700,
              }}
            >
              Chuẩn GDPT 2025 · Tự động nhận diện Hình ảnh, Công thức &amp; Đáp án đúng
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleMixLoadedExam('sim', 3)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: 99,
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <IcoPlay size={13} /> Thi thử đề đã nạp
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 1. NHẬP ĐỀ GỐC */}
          <section
            style={{
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: 12,
              padding: '14px 16px',
              background: 'var(--bg-soft, #f8fafc)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 900,
                color: '#3730a3',
                marginBottom: 10,
                letterSpacing: '0.02em',
              }}
            >
              1. NHẬP ĐỀ GỐC &amp; PHÂN TÍCH CẤU TRÚC
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setImporterEnglishMode(false);
                  setImporterOpen(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #4338ca, #4f46e5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: '0.81rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.24)',
                }}
              >
                <IcoDoc size={15} /> NHẬP ĐỀ TỪ FILE WORD
              </button>

              <button
                type="button"
                onClick={() => {
                  setImporterEnglishMode(true);
                  setImporterOpen(true);
                }}
                style={{
                  background: '#eef2ff',
                  color: '#3730a3',
                  border: '1px solid #c7d2fe',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: '0.81rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <IcoGlobe size={15} /> NHẬP FILE WORD ENGLISH
              </button>

              <button
                type="button"
                onClick={() => {
                  if (loadedExam?.questions?.length) {
                    handleOpenPreview(loadedExam, 'shuffle', 3);
                  } else {
                    setImporterOpen(true);
                  }
                }}
                style={{
                  background: '#fff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: '0.81rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <IcoEye size={15} /> XEM LẠI &amp; CHỈNH ĐỀ GỐC
              </button>

              <button
                type="button"
                onClick={() => setLoadedExam(null)}
                disabled={!loadedExam}
                style={{
                  background: loadedExam ? '#fff1f2' : '#f1f5f9',
                  color: loadedExam ? '#be123c' : '#94a3b8',
                  border: loadedExam ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '9px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: loadedExam ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IcoTrash size={14} /> XÓA ĐỀ ĐÃ NẠP
              </button>
            </div>

            <div
              style={{
                fontSize: '0.77rem',
                color: '#475569',
                marginBottom: 10,
                lineHeight: 1.48,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 7,
              }}
            >
              <span style={{ color: '#4f46e5', marginTop: 2, flexShrink: 0 }}>
                <IcoSpark size={14} />
              </span>
              <span>
                <b>Tự động phân tích thông minh:</b> Nhận diện đáp án đúng qua <u>gạch chân</u>, <b>in đậm</b>, tô màu đỏ/vàng, bảng đáp án cuối bài hoặc mục <b>Lời giải chi tiết</b>. Với đề Tiếng Anh: câu hỏi nhóm đặt trong <b>[ ]</b>; nhóm có <b>"Read the"</b> giữ nguyên số thứ tự câu, chỉ đảo A, B, C, D.
              </span>
            </div>

            {loadedExam && loadedExam.questions?.length > 0 ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #c7d2fe',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 800, color: '#1e1b4b' }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 99,
                      background: '#dcfce7',
                      color: '#15803d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IcoCheck size={13} />
                  </span>
                  <span>
                    Đã nạp <b>{loadedStats.total} câu</b> từ &ldquo;{loadedExam.fileName || loadedExam.title}&rdquo;
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.73rem', fontWeight: 800 }}>
                  <span style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '3px 9px', borderRadius: 99 }}>
                    Phần I: {loadedStats.parts.p1} · Phần II: {loadedStats.parts.p2} · Phần III: {loadedStats.parts.p3}
                  </span>
                  <span
                    style={{
                      background: loadedStats.validAnswerCount === loadedStats.total ? '#dcfce7' : '#fef3c7',
                      color: loadedStats.validAnswerCount === loadedStats.total ? '#166534' : '#92400e',
                      border: loadedStats.validAnswerCount === loadedStats.total ? '1px solid #86efac' : '1px solid #fde68a',
                      padding: '3px 9px',
                      borderRadius: 99,
                    }}
                  >
                    Đáp án đúng: {loadedStats.validAnswerCount}/{loadedStats.total} câu
                  </span>
                  <span style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '3px 9px', borderRadius: 99 }}>
                    Mức độ: NB {loadedStats.counts.nb} · TH {loadedStats.counts.th} · VD {loadedStats.counts.vd} · VDC {loadedStats.counts.vdc}
                  </span>
                  {loadedStats.imageCount > 0 && (
                    <span style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <IcoImage size={12} /> {loadedStats.imageCount} hình vẽ
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#fff',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: '0.79rem',
                  color: '#64748b',
                }}
              >
                Chưa nạp đề gốc. Hãy bấm <b>&ldquo;NHẬP ĐỀ TỪ FILE WORD&rdquo;</b> hoặc chọn một đề bên dưới để nạp vào bộ trộn.
              </div>
            )}
          </section>

          {/* 2. THÔNG TIN TRANG ĐẦU CỦA ĐỀ THI */}
          <section
            style={{
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: 12,
              padding: '14px 16px',
              background: 'var(--bg-soft, #f8fafc)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 900,
                color: '#3730a3',
                marginBottom: 10,
                letterSpacing: '0.02em',
              }}
            >
              2. THÔNG TIN TRANG ĐẦU CỦA ĐỀ THI
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                gap: 10,
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>SỞ GIÁO DỤC</span>
                <input
                  type="text"
                  value={headerInfo.deptName}
                  onChange={(e) => setHeaderInfo((p) => ({ ...p, deptName: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>TÊN TRƯỜNG</span>
                <input
                  type="text"
                  value={headerInfo.schoolName}
                  onChange={(e) => setHeaderInfo((p) => ({ ...p, schoolName: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>TÊN KÌ THI</span>
                <input
                  type="text"
                  value={headerInfo.examName}
                  onChange={(e) => setHeaderInfo((p) => ({ ...p, examName: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>MÔN THI</span>
                <input
                  type="text"
                  list="tsh-subject-datalist"
                  value={headerInfo.subject}
                  onChange={(e) => setHeaderInfo((p) => ({ ...p, subject: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
                <datalist id="tsh-subject-datalist">
                  {allSubjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>LỚP</span>
                <input
                  type="text"
                  value={headerInfo.grade}
                  onChange={(e) => setHeaderInfo((p) => ({ ...p, grade: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>NĂM HỌC</span>
                <input
                  type="text"
                  value={headerInfo.schoolYear}
                  onChange={(e) => setHeaderInfo((p) => ({ ...p, schoolYear: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569' }}>
                  THỜI GIAN LÀM BÀI (PHÚT)
                </span>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={headerInfo.duration}
                  onChange={(e) => setHeaderInfo((p) => ({ ...p, duration: e.target.value }))}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />
              </label>
            </div>
          </section>

          {/* 3. CẤU HÌNH TRỘN */}
          <section
            style={{
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: 12,
              padding: '14px 16px',
              background: 'var(--bg-soft, #f8fafc)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 900,
                color: '#3730a3',
                marginBottom: 10,
                letterSpacing: '0.02em',
              }}
            >
              3. CẤU HÌNH TRỘN
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.83rem', fontWeight: 700, color: '#0f172a' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mixConfig.shufflePart1}
                  onChange={(e) => setMixConfig((p) => ({ ...p, shufflePart1: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                />
                Trộn thứ tự các câu Phần I (nhiều lựa chọn)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mixConfig.shufflePart1Options}
                  onChange={(e) => setMixConfig((p) => ({ ...p, shufflePart1Options: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                />
                Đảo vị trí các phương án A, B, C, D trong mỗi câu
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mixConfig.shufflePart2}
                  onChange={(e) => setMixConfig((p) => ({ ...p, shufflePart2: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                />
                Trộn thứ tự các câu Phần II (đúng – sai)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mixConfig.shufflePart2Statements}
                  onChange={(e) => setMixConfig((p) => ({ ...p, shufflePart2Statements: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                />
                Đảo vị trí các ý a), b), c), d) trong mỗi câu
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mixConfig.shufflePart3}
                  onChange={(e) => setMixConfig((p) => ({ ...p, shufflePart3: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#4f46e5' }}
                />
                Trộn thứ tự các câu Phần III (trả lời ngắn)
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                ĐỊNH DẠNG CÔNG THỨC TOÁN – LÝ – HÓA TRONG FILE WORD
              </div>
              <select
                value={mixConfig.formulaFormat}
                onChange={(e) => setMixConfig((p) => ({ ...p, formulaFormat: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#fff',
                }}
              >
                <option value="mathtype">
                  MathType (đối tượng công thức MathType, bấm đúp để sửa)
                </option>
                <option value="omml">
                  OMML Equation (công thức chuẩn Microsoft Word 365 / 2021)
                </option>
                <option value="unicode">
                  Unicode &amp; Chỉ số hóa học (H₂SO₄, Zn²⁺, nhanh và nhẹ)
                </option>
              </select>
            </div>
          </section>

          {/* 4. SỐ LƯỢNG MÃ ĐỀ CẦN TẠO */}
          <section
            style={{
              border: '1px solid var(--line, #e2e8f0)',
              borderRadius: 12,
              padding: '14px 16px',
              background: 'var(--bg-soft, #f8fafc)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#3730a3' }}>
                4. SỐ LƯỢNG MÃ ĐỀ CẦN TẠO:
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[2, 4, 6, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCodeCount(n)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: codeCount === n ? '2px solid #4338ca' : '1px solid #cbd5e1',
                      background: codeCount === n ? '#eef2ff' : '#fff',
                      color: codeCount === n ? '#312e81' : '#334155',
                      fontWeight: 800,
                      fontSize: '0.81rem',
                      cursor: 'pointer',
                    }}
                  >
                    {n} mã đề (101–{100 + n})
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleMixLoadedExam('shuffle', 3)}
                style={{
                  background: 'linear-gradient(135deg, #4338ca, #4f46e5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 4px 14px rgba(67, 56, 202, 0.25)',
                }}
              >
                <IcoShuffle size={15} /> TRỘN ĐỀ &amp; XEM BỘ MÃ
              </button>

              <button
                type="button"
                onClick={handleDirectDownloadWordZip}
                disabled={exportingZip}
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: '10px 15px',
                  fontSize: '0.81rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <IcoDownload size={15} />
                {exportingZip ? 'Đang đóng gói (.zip)...' : `TẢI ${codeCount} MÃ ĐỀ WORD (.ZIP)`}
              </button>

              <button
                type="button"
                onClick={() => handleMixLoadedExam('assign', 4)}
                style={{
                  background: '#eef2ff',
                  color: '#3730a3',
                  border: '1px solid #c7d2fe',
                  borderRadius: 10,
                  padding: '10px 15px',
                  fontSize: '0.81rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <IcoSend size={14} /> GIAO PHÒNG THI
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ============================================================
          2. TOOLBAR: TABS + TÌM KIẾM + BỘ LỌC + LƯỚI/DANH SÁCH
          ============================================================ */}
      <div className="tsh-toolbar-wrap">
        <div className="tsh-tab-switcher">
          <div className="tsh-tabs">
            <button
              type="button"
              className={`tsh-tab ${hubTab === 'my-exams' ? 'on' : ''}`}
              onClick={() => setHubTab('my-exams')}
            >
              Đề thi trong lớp ({teacherExams.length})
            </button>
            <button
              type="button"
              className={`tsh-tab ${hubTab === 'preset-library' ? 'on' : ''}`}
              onClick={() => setHubTab('preset-library')}
            >
              Thư viện Đề mẫu 2025 ({PRESET_SAMPLE_EXAMS.length})
            </button>
            <button
              type="button"
              className={`tsh-tab ${hubTab === 'shuffle-history' ? 'on' : ''}`}
              onClick={() => {
                refreshHistory();
                setHubTab('shuffle-history');
              }}
            >
              <IcoHistory size={14} /> Lịch sử các lần đảo ({historyList.length})
            </button>
          </div>
        </div>

        {hubTab !== 'shuffle-history' && (
          <div className="tsh-filter-bar">
            <div className="tsh-search-box">
              <IcoSearch size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên đề, chuyên đề, lớp..."
              />
            </div>

            <select
              className="tsh-filter-select"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              aria-label="Lọc theo lớp hoặc khối"
            >
              <option value="all">Tất cả Lớp / Khối</option>
              <option value="grade-10">Khối 10</option>
              <option value="grade-11">Khối 11</option>
              <option value="grade-12">Khối 12</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
            </select>

            <select
              className="tsh-filter-select"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Lọc theo môn học"
            >
              <option value="all">Tất cả môn học</option>
              {allSubjects.map((s) => (
                <option key={s} value={s}>
                  Môn {s}
                </option>
              ))}
            </select>

            <select
              className="tsh-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sắp xếp"
            >
              <option value="newest">Sắp xếp: Mới nhất</option>
              <option value="questions-desc">Nhiều câu hỏi nhất</option>
              <option value="duration-asc">Thời lượng ngắn → dài</option>
              <option value="title-asc">Tên đề A → Z</option>
            </select>

            <div className="tsh-view-toggle" role="group" aria-label="Chế độ hiển thị">
              <button
                type="button"
                className={`tsh-view-btn ${viewMode === 'grid' ? 'on' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Chế độ Lưới"
              >
                <IcoGrid size={15} />
              </button>
              <button
                type="button"
                className={`tsh-view-btn ${viewMode === 'list' ? 'on' : ''}`}
                onClick={() => setViewMode('list')}
                title="Chế độ Danh sách"
              >
                <IcoList size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          3. DANH SÁCH ĐỀ THI (MY EXAMS & PRESET LIBRARY)
          ============================================================ */}
      {hubTab !== 'shuffle-history' && (
        <>
          {hubTab === 'my-exams' && teacherExams.length === 0 ? (
            <div className="tsh-empty">
              <div className="tsh-empty-icon">
                <IcoBook size={32} />
              </div>
              <h3 className="tsh-empty-title">Chưa có đề thi nào trong lớp</h3>
              <p className="tsh-empty-desc">
                Bạn có thể bấm <b>&ldquo;NHẬP ĐỀ TỪ FILE WORD&rdquo;</b> ở khung Trộn Đề Thi phía trên hoặc chọn bộ đề mẫu chuẩn Bộ GD&amp;ĐT 2025 ở tab bên cạnh.
              </p>
              <button
                type="button"
                className="tsh-btn primary"
                onClick={() => setHubTab('preset-library')}
              >
                <IcoSpark size={14} /> Xem Thư Viện Đề Mẫu 2025
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="tsh-empty">
              <h3 className="tsh-empty-title">Không tìm thấy đề thi phù hợp</h3>
              <p className="tsh-empty-desc">
                Thử xóa bộ lọc hoặc từ khóa tìm kiếm để hiển thị toàn bộ danh sách đề.
              </p>
              <button
                type="button"
                className="tsh-btn primary"
                onClick={() => {
                  setSearchQuery('');
                  setGradeFilter('all');
                  setSubjectFilter('all');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className={viewMode === 'list' ? 'tsh-list' : 'tsh-grid'}>
              {filteredExams.map((ex) => {
                const isPreset = hubTab === 'preset-library';
                const targetCls = classes.find((c) => c.id === ex.classId);
                const stats = summarizeExamQuestions(ex.questions || []);
                const isLoaded = loadedExam?.id === ex.id;
                return (
                  <article
                    key={ex.id}
                    className={`tsh-exam-card ${isPreset ? 'preset' : ''} ${viewMode === 'list' ? 'list-row' : ''}`}
                  >
                    <div className="tsh-exam-main">
                      <div className="tsh-exam-head">
                        <span className={`tsh-exam-class ${isPreset ? 'primary' : ''}`}>
                          {isPreset ? `Khối ${ex.grade}` : `Lớp ${targetCls?.name || 'Chung'}`}
                        </span>
                        <span className="tsh-exam-duration">
                          <IcoClock size={12} /> {ex.duration || 45} phút · {stats.total} câu
                        </span>
                      </div>

                      <h3 className="tsh-exam-title">{ex.title}</h3>
                      <p className="tsh-exam-desc">
                        Phần I: {stats.parts.p1} · Phần II: {stats.parts.p2} · Phần III: {stats.parts.p3} (NB {stats.counts.nb} · TH {stats.counts.th} · VD {stats.counts.vd + stats.counts.vdc})
                        {stats.specialCount > 0 && (
                          <span className="tsh-special-pill">
                            <IcoShieldCheck size={12} /> {stats.specialCount} câu đáp án đặc biệt
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="tsh-exam-actions">
                      <button
                        type="button"
                        className={`tsh-action-btn ${isLoaded ? 'orange' : 'purple'}`}
                        onClick={() => {
                          setLoadedExam({
                            id: ex.id,
                            title: ex.title,
                            fileName: `${ex.title}.docx`,
                            questions: ex.questions || [],
                            subject: ex.subject || 'Hóa học',
                            duration: ex.duration || 45,
                          });
                          sound.pop();
                        }}
                      >
                        {isLoaded ? <IcoCheck size={13} /> : <IcoSliders size={13} />}{' '}
                        {isLoaded ? 'Đang nạp ở khung Trộn' : 'Nạp vào khung Trộn đề'}
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn primary"
                        onClick={() => handleOpenPreview(ex, 'shuffle', 3)}
                      >
                        <IcoShuffle size={13} /> Đảo &amp; So sánh
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn info"
                        onClick={() => handleOpenPreview(ex, 'sim', 3)}
                      >
                        <IcoPlay size={13} /> Thi thử
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn orange"
                        onClick={() => handleOpenPreview(ex, 'assign', 4)}
                      >
                        <IcoSend size={13} /> In &amp; Giao đề
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================================
          4. TAB LỊCH SỬ CÁC LẦN ĐẢO ĐỀ
          ============================================================ */}
      {hubTab === 'shuffle-history' && (
        <div className="tsh-history-section">
          {historyList.length === 0 ? (
            <div className="tsh-empty">
              <div className="tsh-empty-icon">
                <IcoHistory size={32} />
              </div>
              <h3 className="tsh-empty-title">Chưa có lịch sử đảo đề nào</h3>
              <p className="tsh-empty-desc">
                Khi bạn thực hiện đảo đề hoặc giao đề vào Phòng thi, hệ thống sẽ tự động lưu lại mã hạt giống (Seed) và cấu hình để có thể khôi phục y hệt 100% bất cứ lúc nào.
              </p>
              <button
                type="button"
                className="tsh-btn primary"
                onClick={() => setHubTab('preset-library')}
              >
                <IcoShuffle size={14} /> Chọn đề để đảo ngay
              </button>
            </div>
          ) : (
            <div className="tsh-list">
              {historyList.map((item) => {
                const matchedExam =
                  teacherExams.find((e) => e.id === item.examId) ||
                  PRESET_SAMPLE_EXAMS.find((e) => e.id === item.examId) ||
                  PRESET_SAMPLE_EXAMS[0];
                return (
                  <article key={item.id} className="tsh-exam-card list-row">
                    <div className="tsh-exam-main">
                      <div className="tsh-exam-head">
                        <span className="tsh-exam-class primary">
                          {item.codeCount} mã đề ({(item.codes || []).join(', ')})
                        </span>
                        <span className="tsh-exam-duration">
                          <IcoClock size={12} /> {new Date(item.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <h3 className="tsh-exam-title">{item.examTitle}</h3>
                      <p className="tsh-exam-desc">
                        Hạt giống (Seed): <b>{item.seedInput}</b> · {item.questionCount} câu hỏi · {item.note}
                      </p>
                    </div>
                    <div className="tsh-exam-actions">
                      <button
                        type="button"
                        className="tsh-action-btn primary"
                        onClick={() =>
                          handleOpenPreview(
                            { ...matchedExam, seed: item.seedInput },
                            'shuffle',
                            3
                          )
                        }
                      >
                        <IcoShuffle size={13} /> Khôi phục &amp; Xem bộ mã
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn orange"
                        onClick={() =>
                          handleOpenPreview(
                            { ...matchedExam, seed: item.seedInput },
                            'assign',
                            4
                          )
                        }
                      >
                        <IcoPrinter size={13} /> Xuất bản / Giao lại
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          5. MODAL NHẬP ĐỀ TỪ FILE WORD (ExamImporter v5.0)
          ============================================================ */}
      <ExamImporter
        open={importerOpen}
        onClose={() => setImporterOpen(false)}
        initialEnglishMode={importerEnglishMode}
        classes={classes}
        defaultSubject={headerInfo.subject || 'Hóa học'}
        defaultTitle={headerInfo.examName || 'Đề kiểm tra'}
        defaultDuration={Number(headerInfo.duration) || 45}
        allowBank={true}
        allowSoftExam={true}
        allowSendToMixer={true}
        onCreateSoftExam={onImportPreset}
        onSendToMixer={(data) => {
          setLoadedExam({
            id: `imp-${Date.now()}`,
            title: data.title || headerInfo.examName || 'Đề vừa nạp',
            fileName: data.sourceFile || data.fileName || `${data.title || 'De-thi'}.docx`,
            questions: data.questions || [],
            subject: data.subject || headerInfo.subject || 'Hóa học',
            duration: data.duration || Number(headerInfo.duration) || 45,
          });
          setImporterOpen(false);
          sound.cheer();
        }}
        onConfirm={(data) => {
          setLoadedExam({
            id: `imp-${Date.now()}`,
            title: data.title || headerInfo.examName || 'Đề vừa nạp',
            fileName: data.sourceFile || data.fileName || `${data.title || 'De-thi'}.docx`,
            questions: data.questions || [],
            subject: data.subject || headerInfo.subject || 'Hóa học',
            duration: data.duration || Number(headerInfo.duration) || 45,
          });
          if (typeof onImportPreset === 'function') {
            onImportPreset(data);
          }
          setImporterOpen(false);
          sound.cheer();
        }}
      />

      {/* ============================================================
          6. MODAL MÔ PHỎNG & ĐẢO ĐỀ 4 BƯỚC
          ============================================================ */}
      {activeExam && (
        <ExamPreviewSimulator
          exam={activeExam}
          questions={activeExam.questions || []}
          classes={classes}
          onClose={() => {
            setActiveExam(null);
            refreshHistory();
          }}
          defaultTab={initialTab}
          initialWizardStep={initialWizardStep}
          onAssignShuffled={onAssignShuffled}
        />
      )}
    </div>
  );
}
