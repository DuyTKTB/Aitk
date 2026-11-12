/* ============================================================
   ExamTrapReport.jsx — BÁO CÁO AI CHẨN ĐOÁN BẪY ĐỀ THI & LỖI SAI
   ------------------------------------------------------------
   Chuẩn Apple VisionOS · 100% SVG thuần · 0 emoji
   Bóc tách nguyên nhân sai lầm: Bẫy từ phủ định, Lỗi đổi đơn vị, Hổng kiến thức
   ============================================================ */

import { useMemo } from 'react';
import { analyzeExamTraps } from '../../lib/examTrapAnalyzer.js';
import '../../styles/digital-omr.css';

/* ── Bộ Icon SVG thuần (0 emoji) ── */
const IcoRadarTrap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
    <path d="M12 6a6 6 0 1 0 6 6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IcoSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
  </svg>
);

export default function ExamTrapReport({
  questions = [],
  answers = {},
  detail = [],
}) {
  const report = useMemo(() => {
    return analyzeExamTraps({ questions, answers, detail });
  }, [questions, answers, detail]);

  if (!report || report.totalErrors === 0) {
    return (
      <div className="trap-report-container" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#166534' }}>
          <IcoSparkle />
          <strong>Xuất sắc! Bạn không mắc bất kỳ bẫy trắc nghiệm hay lỗi tính toán nào trong bài thi.</strong>
        </div>
      </div>
    );
  }

  return (
    <section className="trap-report-container" aria-label="Báo cáo chẩn đoán bẫy đề thi">
      {/* ── HEADER BÁO CÁO ── */}
      <div className="trap-report-header">
        <div className="trap-report-title">
          <h4>
            <IcoRadarTrap />
            <span>AI Chẩn đoán Bẫy trắc nghiệm & Nguyên nhân mất điểm</span>
          </h4>
          <p>Thuật toán phân tích ngữ nghĩa bóc tách các câu hỏi bạn bị lừa hoặc tính ẩu</p>
        </div>
      </div>

      {/* ── 3 Ô THỐNG KÊ NHÓM LỖI ── */}
      <div className="trap-summary-boxes">
        <div className="trap-sum-box trap">
          <div className="trap-sum-num" style={{ color: '#d97706' }}>{report.trapCount}</div>
          <span className="trap-sum-label">Bẫy từ phủ định / Gài đề</span>
        </div>
        <div className="trap-sum-box calc">
          <div className="trap-sum-num" style={{ color: '#2563eb' }}>{report.calcCount}</div>
          <span className="trap-sum-label">Lỗi đổi đơn vị / Tính ẩu</span>
        </div>
        <div className="trap-sum-box knowledge">
          <div className="trap-sum-num" style={{ color: '#dc2626' }}>{report.knowledgeCount}</div>
          <span className="trap-sum-label">Lỗ hổng kiến thức</span>
        </div>
      </div>

      {/* Lời khuyên tổng quan */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14, fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
        <strong>Nhận xét AI:</strong> {report.summaryAdvice}
      </div>

      {/* ── DANH SÁCH CHI TIẾT CÁC CÂU MẮC BẪY ── */}
      <div className="trap-items-list">
        {report.trapItems.map((item) => (
          <div key={item.questionIndex} className="trap-item-card">
            <div className="trap-item-top">
              <span className="trap-item-q-badge">
                Câu {item.questionIndex}: <span style={{ fontWeight: 500, color: '#64748b' }}>{item.questionText.slice(0, 75)}...</span>
              </span>
              <span className={`trap-tag-pill tone-${item.diagnosis.typeTone}`}>
                {item.diagnosis.tag}
              </span>
            </div>
            <p className="trap-item-reason">{item.diagnosis.reason}</p>
            <p className="trap-item-advice">
              <strong>Gợi ý khắc phục:</strong> {item.diagnosis.advice}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
