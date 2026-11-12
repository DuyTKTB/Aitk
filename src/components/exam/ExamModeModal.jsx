/* ============================================================
   ExamModeModal.jsx — MODAL TÙY CHỌN CHẾ ĐỘ THI CHUẨN 9STUDY
   ------------------------------------------------------------
   Cho phép học sinh lựa chọn trước khi bước vào phòng thi:
   1. Chế độ: Thi thật (áp lực 50p) vs Thi thử (không giới hạn, kiểm tra ngay)
   2. Hiển thị: Từng câu (OMR) vs Trải dài (Cuộn tự do)
   100% SVG thuần túy, 0 emoji trong mã nguồn.
   ============================================================ */

import { useState } from 'react';

export default function ExamModeModal({ exam, onStart, onClose }) {
  const [examMode, setExamMode] = useState('real'); // 'real' | 'practice'
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'paper'

  if (!exam) return null;

  const durationMin = exam.durationMinutes || 50;

  const handleConfirm = () => {
    onStart({
      practiceMode: examMode === 'practice',
      viewMode,
    });
  };

  return (
    <div className="ns9-mode-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ns9-mode-modal-card" role="dialog" aria-modal="true" aria-labelledby="mode-modal-title">
        {/* Header */}
        <div className="ns9-mm-header">
          <div className="ns9-mm-header-left">
            <span className="ns9-mm-badge">THI TRỰC TUYẾN ELEC AI</span>
            <h3 id="mode-modal-title" className="ns9-mm-title">Chọn cách làm bài</h3>
            <p className="ns9-mm-exam-name">{exam.title}</p>
            <div className="ns9-mm-exam-meta">
              <span>{exam.subject || 'Khoa học Tự nhiên'}</span>
              <span>·</span>
              <span>{durationMin} phút</span>
              <span>·</span>
              <span>{exam.totalQuestions || exam.questions?.length || 28} câu hỏi</span>
            </div>
          </div>
          <button type="button" className="ns9-mm-close-btn" onClick={onClose} aria-label="Đóng hộp thoại">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body Options */}
        <div className="ns9-mm-body">
          {/* Bước 1: Chế độ làm bài */}
          <div className="ns9-mm-section">
            <div className="ns9-mm-step-title-row">
              <span className="ns9-mm-step-num">1</span>
              <span className="ns9-mm-step-name">Chế độ làm bài</span>
            </div>

            <div className="ns9-mm-options-grid">
              {/* Option: Thi thật */}
              <div
                className={`ns9-mm-opt-card ${examMode === 'real' ? 'is-selected' : ''}`}
                onClick={() => setExamMode('real')}
              >
                <div className="ns9-mm-opt-top">
                  <div className="ns9-mm-opt-icon is-real">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span className="ns9-mm-opt-tag">{durationMin} phút</span>
                </div>
                <h4 className="ns9-mm-opt-title">Thi thật</h4>
                <p className="ns9-mm-opt-desc">
                  Tính giờ chuẩn theo kỳ thi, khóa xem lời giải trong lúc làm — mô phỏng 100% áp lực phòng thi thật.
                </p>
                <div className="ns9-mm-opt-radio">
                  <span className="ns9-mm-radio-dot" />
                </div>
              </div>

              {/* Option: Thi thử (Luyện tập) */}
              <div
                className={`ns9-mm-opt-card ${examMode === 'practice' ? 'is-selected' : ''}`}
                onClick={() => setExamMode('practice')}
              >
                <div className="ns9-mm-opt-top">
                  <div className="ns9-mm-opt-icon is-practice">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <span className="ns9-mm-opt-tag is-free-time">Không giới hạn</span>
                </div>
                <h4 className="ns9-mm-opt-title">Thi thử (Ôn luyện)</h4>
                <p className="ns9-mm-opt-desc">
                  Không áp lực giờ, có nút "Kiểm tra đáp án" tức thì từng câu, hiển thị lời giải 4 tầng và biến động Elo ngay lập tức.
                </p>
                <div className="ns9-mm-opt-radio">
                  <span className="ns9-mm-radio-dot" />
                </div>
              </div>
            </div>
          </div>

          {/* Bước 2: Cách hiển thị */}
          <div className="ns9-mm-section">
            <div className="ns9-mm-step-title-row">
              <span className="ns9-mm-step-num">2</span>
              <span className="ns9-mm-step-name">Cách hiển thị</span>
            </div>

            <div className="ns9-mm-options-grid">
              {/* Option: Từng câu */}
              <div
                className={`ns9-mm-opt-card ${viewMode === 'single' ? 'is-selected' : ''}`}
                onClick={() => setViewMode('single')}
              >
                <div className="ns9-mm-opt-top">
                  <div className="ns9-mm-opt-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 3v18" />
                    </svg>
                  </div>
                  <span className="ns9-mm-opt-tag">Khuyên dùng</span>
                </div>
                <h4 className="ns9-mm-opt-title">Từng câu (OMR)</h4>
                <p className="ns9-mm-opt-desc">
                  Một câu mỗi màn hình kèm phiếu trả lời OMR số hóa và phím tắt chuyển câu.
                </p>
                <div className="ns9-mm-opt-radio">
                  <span className="ns9-mm-radio-dot" />
                </div>
              </div>

              {/* Option: Trải dài */}
              <div
                className={`ns9-mm-opt-card ${viewMode === 'paper' ? 'is-selected' : ''}`}
                onClick={() => setViewMode('paper')}
              >
                <div className="ns9-mm-opt-top">
                  <div className="ns9-mm-opt-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <span className="ns9-mm-opt-tag">Trực quan</span>
                </div>
                <h4 className="ns9-mm-opt-title">Trải dài (Đề thi cuộn)</h4>
                <p className="ns9-mm-opt-desc">
                  Tất cả các câu trong một trang duy nhất, cuộn tự do để xem tổng quan toàn bộ đề.
                </p>
                <div className="ns9-mm-opt-radio">
                  <span className="ns9-mm-radio-dot" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ns9-mm-footer">
          <button type="button" className="ns9-mm-cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="ns9-mm-start-btn" onClick={handleConfirm}>
            <span>Bắt đầu làm bài</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
