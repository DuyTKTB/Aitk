/* ============================================================
   TeacherSimulatorHub.jsx — Trung Tâm Mô Phỏng & Đảo Đề (v3.0)
   ------------------------------------------------------------
   • Quy trình 4 bước (4-Step Wizard) trực quan:
     1. Chọn đề gốc (Tìm kiếm, lọc lớp/môn, sắp xếp, Lưới/Danh sách)
     2. Cấu hình đảo đề (2/4/6/8 mã, Seed, Khóa câu, Mẫu đảo Presets)
     3. Xem trước, Kiểm định tự động, Thi thử & Dự đoán điểm
     4. Xuất bản A4/OMR/Word/PDF, Giao thẳng Phòng thi & Lịch sử đảo
   • Chỉ dùng SVG icons nét mảnh chuẩn Apple HIG + visionOS Glassmorphism
   ============================================================ */
import { useState, useMemo } from 'react';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import { PRESET_SAMPLE_EXAMS } from '../../lib/sampleExamsData.js';
import { hasPositionalOption } from '../../lib/examShuffle.js';
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
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>;
const IcoPrinter = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoShuffle = (p) => <Svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></Svg>;
const IcoSim = (p) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></Svg>;
const IcoTable = (p) => <Svg {...p}><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>;
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
  let specialCount = 0;
  questions.forEach((q) => {
    const lv = normLevel(q.level);
    counts[lv] = (counts[lv] || 0) + 1;
    if (hasPositionalOption(q.options || [])) {
      specialCount += 1;
    }
  });
  return { counts, specialCount, total: questions.length };
}

/* ============ MAIN COMPONENT ============ */
export default function TeacherSimulatorHub({
  teacherExams = [],
  classes = [],
  onImportPreset,
  onAssignShuffled,
}) {
  const [activeExam, setActiveExam] = useState(null);
  const [initialTab, setInitialTab] = useState('sim');
  const [initialWizardStep, setInitialWizardStep] = useState(null);
  const [hubTab, setHubTab] = useState('my-exams');

  // Step 1 Filters, Search, Sort, View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [historyList, setHistoryList] = useState(() => readShuffleHistory());

  const refreshHistory = () => {
    setHistoryList(readShuffleHistory());
  };

  const handleOpenPreview = (exam, tab = 'sim', step = null) => {
    sound.pop();
    setInitialTab(tab);
    setInitialWizardStep(step);
    setActiveExam(exam);
  };

  const handleWizardQuickJump = (stepNum) => {
    if (stepNum === 1) return;
    const candidateExam =
      (hubTab === 'my-exams' && teacherExams[0]) ||
      PRESET_SAMPLE_EXAMS[0] ||
      teacherExams[0];
    if (!candidateExam) return;
    const tabMap = {
      2: 'config',
      3: 'shuffle',
      4: 'assign',
    };
    handleOpenPreview(candidateExam, tabMap[stepNum] || 'shuffle', stepNum);
  };

  // Available subjects for filter
  const allSubjects = useMemo(() => {
    const set = new Set(['Hóa học']);
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
          1. HERO BANNER + 4-STEP WIZARD PROGRESS BAR
          ============================================================ */}
      <div className="tsh-hero">
        <div className="tsh-hero-top">
          <div className="tsh-hero-text">
            <div className="tsh-hero-badge">
              <IcoSpark size={13} /> ELEC AI Exam Suite 2025
            </div>
            <h1 className="tsh-hero-title">
              Trung Tâm Mô Phỏng, Kiểm Định & Đảo Mã Đề Thông Minh
            </h1>
            <p className="tsh-hero-desc">
              Quy trình 4 bước khép kín: Chọn đề gốc → Cấu hình đảo 2–8 mã đề (101–108), khóa câu cố định &
              bảo vệ đáp án "Cả A và B đúng" → Xem trước song song, dự đoán phổ điểm & thi thử → Xuất bản A4/OMR
              hoặc giao thẳng vào Phòng thi kèm gán mã tự động cho từng học sinh.
            </p>
          </div>

          <div className="tsh-hero-stats">
            <div className="tsh-stat-pill">
              <span className="tsh-stat-num">{teacherExams.length}</span>
              <span className="tsh-stat-label">Đề trong lớp</span>
            </div>
            <div className="tsh-stat-pill cyan">
              <span className="tsh-stat-num">{PRESET_SAMPLE_EXAMS.length}</span>
              <span className="tsh-stat-label">Đề mẫu 2025</span>
            </div>
            <div className="tsh-stat-pill purple">
              <span className="tsh-stat-num">{historyList.length}</span>
              <span className="tsh-stat-label">Lịch sử đảo</span>
            </div>
          </div>
        </div>

        {/* THANH TIẾN TRÌNH 4 BƯỚC (4-STEP WIZARD) */}
        <div className="tsh-wizard-bar" role="navigation" aria-label="Quy trình 4 bước">
          <button
            type="button"
            className="tsh-wizard-step active"
            onClick={() => handleWizardQuickJump(1)}
          >
            <span className="tsh-wizard-num">1</span>
            <div className="tsh-wizard-info">
              <b>Bước 1: Chọn đề gốc</b>
              <small>Tìm kiếm, lọc lớp/môn & chọn đề</small>
            </div>
          </button>

          <button
            type="button"
            className="tsh-wizard-step"
            onClick={() => handleWizardQuickJump(2)}
          >
            <span className="tsh-wizard-num">2</span>
            <div className="tsh-wizard-info">
              <b>Bước 2: Cấu hình đảo đề</b>
              <small>Chọn 2–8 mã, Seed, Ghim câu & Mẫu đảo</small>
            </div>
          </button>

          <button
            type="button"
            className="tsh-wizard-step"
            onClick={() => handleWizardQuickJump(3)}
          >
            <span className="tsh-wizard-num">3</span>
            <div className="tsh-wizard-info">
              <b>Bước 3: Xem trước & Thi thử</b>
              <small>Kiểm định 4 tiêu chí, So sánh 2 mã & Phổ điểm</small>
            </div>
          </button>

          <button
            type="button"
            className="tsh-wizard-step"
            onClick={() => handleWizardQuickJump(4)}
          >
            <span className="tsh-wizard-num">4</span>
            <div className="tsh-wizard-info">
              <b>Bước 4: Xuất bản & Giao đề</b>
              <small>In A4/OMR, Giao Phòng thi & Hoàn tác</small>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================
          2. BƯỚC 1 TOOLBAR: TABS + TÌM KIẾM + BỘ LỌC + LƯỚI/DANH SÁCH
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
                Bạn có thể tạo đề mới bằng AutoExam Studio hoặc trải nghiệm ngay
                các bộ đề mẫu chuẩn Bộ GD&ĐT 2025 ở tab bên cạnh.
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
                        Phân bố: NB {stats.counts.nb} · TH {stats.counts.th} · VD {stats.counts.vd} · VDC {stats.counts.vdc} câu
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
                        className="tsh-action-btn purple"
                        onClick={() => handleOpenPreview(ex, 'config', 2)}
                      >
                        <IcoSliders size={13} /> Bước 2: Cấu hình đảo
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn primary"
                        onClick={() => handleOpenPreview(ex, 'shuffle', 3)}
                      >
                        <IcoShuffle size={13} /> Bước 3: Đảo & So sánh
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn info"
                        onClick={() => handleOpenPreview(ex, 'sim', 3)}
                      >
                        <IcoPlay size={13} /> Mô phỏng thi thử
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn orange"
                        onClick={() => handleOpenPreview(ex, 'assign', 4)}
                      >
                        <IcoSend size={13} /> Bước 4: In & Giao đề
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
                        <IcoShuffle size={13} /> Khôi phục & Xem bộ mã
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
          5. MODAL MÔ PHỎNG & ĐẢO ĐỀ 4 BƯỚC
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
