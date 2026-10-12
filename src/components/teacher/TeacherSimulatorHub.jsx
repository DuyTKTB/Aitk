/* ============================================================
   TeacherSimulatorHub.jsx — Trung Tâm Mô Phỏng & Đảo Đề Đa Năng
   - Kết nối trực tiếp với ExamPreviewSimulator:
     • Chế độ 1: 📱 Mô phỏng học sinh thi thật (Student Simulator)
     • Chế độ 2: 📄 Bản in A4 chuẩn Bộ GD&ĐT 2025 (Print Engine)
     • Chế độ 3: 🔀 Đảo 4 mã đề tự động (101 - 104) & Bảng đối chiếu
     • Chế độ 4: 📊 Bảng đặc tả đề thi & chuẩn năng lực GDPT 2018
   - Hỗ trợ cả Đề thi trong lớp và Thư viện Đề mẫu chuẩn Bộ GD&ĐT 2025
   ============================================================ */

import { useState } from 'react';
import MathText from '../MathText.jsx';
import ExamPreviewSimulator from './ExamPreviewSimulator.jsx';
import { PRESET_SAMPLE_EXAMS } from '../../lib/sampleExamsData.js';
import sound from '../../lib/gameSound.js';

const Svg = ({ size = 16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcoClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>;
const IcoPrinter = (p) => <Svg {...p}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Svg>;
const IcoShuffle = (p) => <Svg {...p}><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></Svg>;
const IcoSim = (p) => <Svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></Svg>;
const IcoTable = (p) => <Svg {...p}><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>;
const IcoBook = (p) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Svg>;
const IcoSpark = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
const IcoPlay = (p) => <Svg {...p}><polygon points="5 3 19 12 5 21 5 3" /></Svg>;
const IcoCopy = (p) => <Svg {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Svg>;

export default function TeacherSimulatorHub({
  teacherExams = [],
  classes = [],
  onImportPreset,
}) {
  const [activeExam, setActiveExam] = useState(null);
  const [initialTab, setInitialTab] = useState('sim');
  const [hubTab, setHubTab] = useState('my-exams'); // 'my-exams' | 'preset-library'

  const handleOpenPreview = (exam, tab = 'sim') => {
    sound.pop();
    setInitialTab(tab);
    setActiveExam(exam);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ============================================================
          1. HERO BANNER CHỦ ĐẠO MÀU XANH SAPPHIRE ELEC AI
          ============================================================ */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(37, 99, 235, 0.16) 100%), rgba(9, 18, 42, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.22)',
          borderRadius: 24,
          padding: '1.6rem 2rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.75rem', borderRadius: 999, background: 'rgba(14, 165, 233, 0.18)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              <IcoSpark size={13} /> ELEC AI Exam Suite 2025
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Bộ Xem Trước, Mô Phỏng & Đảo 4 Mã Đề
            </h1>
            <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.92rem', maxWidth: 750, lineHeight: 1.5 }}>
              Kiểm tra trải nghiệm làm bài thi của học sinh, xuất bản in đề thi A4 chuẩn Bộ GD&ĐT 2 cột sẵn sàng in ấn, và thuật toán tự động đảo 4 mã đề (101 - 104) kèm ma trận đối chiếu đáp án A-B-C-D.
            </p>
          </div>

          {/* Quick stats pills */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.7rem 1.1rem', borderRadius: 14, background: 'rgba(15, 30, 68, 0.7)', border: '1px solid rgba(56, 189, 248, 0.18)', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{teacherExams.length}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đề trong lớp</span>
            </div>
            <div style={{ padding: '0.7rem 1.1rem', borderRadius: 14, background: 'rgba(15, 30, 68, 0.7)', border: '1px solid rgba(56, 189, 248, 0.18)', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: '#06b6d4' }}>{PRESET_SAMPLE_EXAMS.length}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Đề mẫu 2025</span>
            </div>
          </div>
        </div>

        {/* 4 Cards chế độ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem', marginTop: '0.5rem' }}>
          <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(12, 24, 56, 0.55)', border: '1px solid rgba(56, 189, 248, 0.14)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7, #2563eb)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
              <IcoSim size={18} />
            </div>
            <div>
              <b style={{ display: 'block', fontSize: '0.88rem', color: '#f1f5f9' }}>Mô phỏng thi</b>
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Bấm giờ & nộp bài</small>
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(12, 24, 56, 0.55)', border: '1px solid rgba(56, 189, 248, 0.14)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0d9488, #059669)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
              <IcoPrinter size={18} />
            </div>
            <div>
              <b style={{ display: 'block', fontSize: '0.88rem', color: '#f1f5f9' }}>Bản in A4 chuẩn</b>
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>2 cột chuẩn Bộ GD&ĐT</small>
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(12, 24, 56, 0.55)', border: '1px solid rgba(56, 189, 248, 0.14)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #9333ea)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
              <IcoShuffle size={18} />
            </div>
            <div>
              <b style={{ display: 'block', fontSize: '0.88rem', color: '#f1f5f9' }}>Đảo 4 mã đề</b>
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Mã 101-104 & Đáp án</small>
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(12, 24, 56, 0.55)', border: '1px solid rgba(56, 189, 248, 0.14)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #d97706, #ea580c)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
              <IcoTable size={18} />
            </div>
            <div>
              <b style={{ display: 'block', fontSize: '0.88rem', color: '#f1f5f9' }}>Bảng đặc tả đề</b>
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Chuẩn năng lực 2018</small>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. CHỌN TAB: ĐỀ THI CỦA BẠN vs THƯ VIỆN ĐỀ MẪU 2025
          ============================================================ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'inline-flex', padding: 4, borderRadius: 999, background: 'rgba(10, 20, 48, 0.65)', border: '1px solid rgba(56, 189, 248, 0.18)' }}>
          <button
            type="button"
            className={`vt-tab ${hubTab === 'my-exams' ? 'on' : ''}`}
            onClick={() => setHubTab('my-exams')}
          >
            Đề thi trong lớp ({teacherExams.length})
          </button>
          <button
            type="button"
            className={`vt-tab ${hubTab === 'preset-library' ? 'on' : ''}`}
            onClick={() => setHubTab('preset-library')}
          >
            Thư viện Đề mẫu chuẩn Bộ GD&ĐT 2025 ({PRESET_SAMPLE_EXAMS.length})
          </button>
        </div>
      </div>

      {/* ============================================================
          3. TAB 1: DANH SÁCH ĐỀ THI CỦA GIÁO VIÊN
          ============================================================ */}
      {hubTab === 'my-exams' && (
        <>
          {teacherExams.length === 0 ? (
            <div className="vt-empty" style={{ background: 'rgba(11, 22, 50, 0.65)', borderRadius: 20, border: '1px solid rgba(56, 189, 248, 0.14)', padding: '3.5rem 1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(14, 165, 233, 0.15)', display: 'grid', placeItems: 'center', color: '#38bdf8', margin: '0 auto 1rem' }}>
                <IcoBook size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9' }}>Chưa có đề thi nào trong lớp</h3>
              <p style={{ margin: '0.5rem 0 1.25rem', color: '#94a3b8', fontSize: '0.88rem', maxWidth: 480 }}>
                Bạn có thể tạo đề mới bằng AutoExam Studio hoặc trải nghiệm ngay các bộ đề mẫu chuẩn Bộ GD&ĐT 2025 ở tab bên cạnh.
              </p>
              <button
                type="button"
                className="vt-btn primary"
                onClick={() => setHubTab('preset-library')}
              >
                <IcoSpark size={14} /> Xem Thư Viện Đề Mẫu 2025
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {teacherExams.map((ex) => {
                const targetCls = classes.find((c) => c.id === ex.classId);
                const qCount = ex.questions?.length || 0;
                return (
                  <article
                    key={ex.id}
                    className="vt-card"
                    style={{
                      padding: '1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      border: '1px solid rgba(56, 189, 248, 0.16)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        <span style={{ padding: '0.2rem 0.55rem', borderRadius: 8, background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
                          Lớp {targetCls?.name || 'Chung'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <IcoClock size={12} /> {ex.duration || 45} phút
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.08rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.4 }}>
                        {ex.title}
                      </h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem' }}>
                        Quy mô {qCount} câu hỏi · Có thể xuất in hoặc đảo 4 mã đề lập tức
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(56, 189, 248, 0.1)' }}>
                      <button
                        type="button"
                        className="vt-btn sm"
                        style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', border: 'none' }}
                        onClick={() => handleOpenPreview(ex, 'sim')}
                      >
                        <IcoPlay size={13} /> Mô phỏng thi
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm"
                        style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}
                        onClick={() => handleOpenPreview(ex, 'print')}
                      >
                        <IcoPrinter size={13} /> Bản in A4
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm"
                        style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.25)' }}
                        onClick={() => handleOpenPreview(ex, 'shuffle')}
                      >
                        <IcoShuffle size={13} /> Đảo 4 mã đề
                      </button>
                      <button
                        type="button"
                        className="vt-btn sm"
                        style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#fb923c', border: '1px solid rgba(251, 146, 60, 0.25)' }}
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
          4. TAB 2: THƯ VIỆN ĐỀ MẪU CHUẨN MA TRẬN 2025
          ============================================================ */}
      {hubTab === 'preset-library' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {PRESET_SAMPLE_EXAMS.map((sample) => (
            <article
              key={sample.id}
              className="vt-card"
              style={{
                padding: '1.35rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                background: 'linear-gradient(180deg, rgba(14, 28, 64, 0.75) 0%, rgba(10, 20, 48, 0.75) 100%)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 8, background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800 }}>
                    Khối {sample.grade}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <IcoSpark size={13} /> Chuẩn Bộ GD&ĐT 2025
                  </span>
                </div>

                <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.4 }}>
                  {sample.title}
                </h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Thời gian: {sample.duration} phút · {sample.questions.length} câu bám sát 4 mức độ nhận thức (NB - TH - VD - VDC).
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(56, 189, 248, 0.12)' }}>
                <button
                  type="button"
                  className="vt-btn sm"
                  style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', border: 'none' }}
                  onClick={() => handleOpenPreview(sample, 'sim')}
                >
                  <IcoPlay size={13} /> Mô phỏng thi
                </button>
                <button
                  type="button"
                  className="vt-btn sm"
                  style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)' }}
                  onClick={() => handleOpenPreview(sample, 'print')}
                >
                  <IcoPrinter size={13} /> Bản in A4
                </button>
                <button
                  type="button"
                  className="vt-btn sm"
                  style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.25)' }}
                  onClick={() => handleOpenPreview(sample, 'shuffle')}
                >
                  <IcoShuffle size={13} /> Đảo 4 mã đề
                </button>
                <button
                  type="button"
                  className="vt-btn sm"
                  style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#fb923c', border: '1px solid rgba(251, 146, 60, 0.25)' }}
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
          5. MODAL MÔ PHỎNG & ĐẢO ĐỀ (ExamPreviewSimulator)
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
