/* ============================================================
   TeacherSimulatorHub.jsx — Trung Tâm Mô Phỏng & Đảo Đề (v2)
   ------------------------------------------------------------
   • Bỏ 100% inline style → dùng CSS class
   • Theo theme sáng/tối tự động (data-theme)
   • Fix nút bấm, text mờ, chồng lớp
   • Chuẩn Apple HIG + visionOS Glassmorphism
   • Responsive mobile
   ============================================================ */
import { useState } from 'react';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import { PRESET_SAMPLE_EXAMS } from '../../lib/sampleExamsData.js';
import sound from '../../lib/gameSound.js';
import '../../styles/teacher-simulator-hub.css';

/* ============ SVG ICONS ============ */
const Svg = ({ size = 16, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
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

/* ============ MAIN COMPONENT ============ */
export default function TeacherSimulatorHub({
  teacherExams = [],
  classes = [],
  onImportPreset,
}) {
  const [activeExam, setActiveExam] = useState(null);
  const [initialTab, setInitialTab] = useState('sim');
  const [hubTab, setHubTab] = useState('my-exams');

  const handleOpenPreview = (exam, tab = 'sim') => {
    sound.pop();
    setInitialTab(tab);
    setActiveExam(exam);
  };

  return (
    <div className="tsh-root">
      {/* ============================================================
          1. HERO BANNER
          ============================================================ */}
      <div className="tsh-hero">
        <div className="tsh-hero-top">
          <div className="tsh-hero-text">
            <div className="tsh-hero-badge">
              <IcoSpark size={13} /> ELEC AI Exam Suite 2025
            </div>
            <h1 className="tsh-hero-title">
              Bộ Xem Trước, Mô Phỏng & Đảo 4 Mã Đề
            </h1>
            <p className="tsh-hero-desc">
              Kiểm tra trải nghiệm làm bài thi của học sinh, xuất bản in đề thi A4 chuẩn
              Bộ GD&ĐT 2 cột sẵn sàng in ấn, và thuật toán tự động đảo 4 mã đề (101 - 104)
              kèm ma trận đối chiếu đáp án A-B-C-D.
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
          </div>
        </div>

        {/* 4 mode cards */}
        <div className="tsh-modes-grid">
          <div className="tsh-mode-card">
            <div className="tsh-mode-icon blue">
              <IcoSim size={18} />
            </div>
            <div>
              <b className="tsh-mode-title">Mô phỏng thi</b>
              <small className="tsh-mode-desc">Bấm giờ & nộp bài</small>
            </div>
          </div>

          <div className="tsh-mode-card">
            <div className="tsh-mode-icon green">
              <IcoPrinter size={18} />
            </div>
            <div>
              <b className="tsh-mode-title">Bản in A4 chuẩn</b>
              <small className="tsh-mode-desc">2 cột chuẩn Bộ GD&ĐT</small>
            </div>
          </div>

          <div className="tsh-mode-card">
            <div className="tsh-mode-icon purple">
              <IcoShuffle size={18} />
            </div>
            <div>
              <b className="tsh-mode-title">Đảo 4 mã đề</b>
              <small className="tsh-mode-desc">Mã 101-104 & Đáp án</small>
            </div>
          </div>

          <div className="tsh-mode-card">
            <div className="tsh-mode-icon orange">
              <IcoTable size={18} />
            </div>
            <div>
              <b className="tsh-mode-title">Bảng đặc tả đề</b>
              <small className="tsh-mode-desc">Chuẩn năng lực 2018</small>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. TAB SWITCHER
          ============================================================ */}
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
        </div>
      </div>

      {/* ============================================================
          3. TAB 1: ĐỀ THI CỦA GIÁO VIÊN
          ============================================================ */}
      {hubTab === 'my-exams' && (
        <>
          {teacherExams.length === 0 ? (
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
          ) : (
            <div className="tsh-grid">
              {teacherExams.map((ex) => {
                const targetCls = classes.find((c) => c.id === ex.classId);
                const qCount = ex.questions?.length || 0;
                return (
                  <article key={ex.id} className="tsh-exam-card">
                    <div className="tsh-exam-head">
                      <span className="tsh-exam-class">
                        Lớp {targetCls?.name || 'Chung'}
                      </span>
                      <span className="tsh-exam-duration">
                        <IcoClock size={12} /> {ex.duration || 45} phút
                      </span>
                    </div>

                    <h3 className="tsh-exam-title">{ex.title}</h3>
                    <p className="tsh-exam-desc">
                      Quy mô {qCount} câu hỏi · Có thể xuất in hoặc đảo 4 mã đề lập tức
                    </p>

                    <div className="tsh-exam-actions">
                      <button
                        type="button"
                        className="tsh-action-btn primary"
                        onClick={() => handleOpenPreview(ex, 'sim')}
                      >
                        <IcoPlay size={13} /> Mô phỏng thi
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn info"
                        onClick={() => handleOpenPreview(ex, 'print')}
                      >
                        <IcoPrinter size={13} /> Bản in A4
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn purple"
                        onClick={() => handleOpenPreview(ex, 'shuffle')}
                      >
                        <IcoShuffle size={13} /> Đảo 4 mã đề
                      </button>
                      <button
                        type="button"
                        className="tsh-action-btn orange"
                        onClick={() => handleOpenPreview(ex, 'specs')}
                      >
                        <IcoTable size={13} /> Bảng đặc tả
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
          4. TAB 2: THƯ VIỆN ĐỀ MẪU 2025
          ============================================================ */}
      {hubTab === 'preset-library' && (
        <div className="tsh-grid">
          {PRESET_SAMPLE_EXAMS.map((sample) => (
            <article key={sample.id} className="tsh-exam-card preset">
              <div className="tsh-exam-head">
                <span className="tsh-exam-class primary">
                  Khối {sample.grade}
                </span>
                <span className="tsh-exam-duration preset">
                  <IcoSpark size={13} /> Chuẩn Bộ GD&ĐT 2025
                </span>
              </div>

              <h3 className="tsh-exam-title">{sample.title}</h3>
              <p className="tsh-exam-desc">
                Thời gian: {sample.duration} phút · {sample.questions.length} câu bám sát
                4 mức độ nhận thức (NB - TH - VD - VDC).
              </p>

              <div className="tsh-exam-actions">
                <button
                  type="button"
                  className="tsh-action-btn primary"
                  onClick={() => handleOpenPreview(sample, 'sim')}
                >
                  <IcoPlay size={13} /> Mô phỏng thi
                </button>
                <button
                  type="button"
                  className="tsh-action-btn info"
                  onClick={() => handleOpenPreview(sample, 'print')}
                >
                  <IcoPrinter size={13} /> Bản in A4
                </button>
                <button
                  type="button"
                  className="tsh-action-btn purple"
                  onClick={() => handleOpenPreview(sample, 'shuffle')}
                >
                  <IcoShuffle size={13} /> Đảo 4 mã đề
                </button>
                <button
                  type="button"
                  className="tsh-action-btn orange"
                  onClick={() => handleOpenPreview(sample, 'specs')}
                >
                  <IcoTable size={13} /> Bảng đặc tả
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ============================================================
          5. MODAL MÔ PHỎNG
          ============================================================ */}
      {activeExam && (
        <ExamPreviewSimulator
          exam={activeExam}
          questions={activeExam.questions || []}
          onClose={() => setActiveExam(null)}
          defaultTab={initialTab}
        />
      )}
    </div>
  );
}