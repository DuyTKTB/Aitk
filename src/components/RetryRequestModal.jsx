/* ============================================================
   RetryRequestModal.jsx — Modal HS xin thi lại
   ------------------------------------------------------------
   HS gõ lý do (tuỳ chọn) rồi gửi yêu cầu tới GV.
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import '../styles/dash-vitality.css';   // ← THÊM DÒNG NÀY

/* ============ SVG ICONS ============ */
const IcoX = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoSend = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
const IcoBell = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IcoAlert = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5" />
    <circle cx="12" cy="16.2" r=".6" fill="currentColor" />
  </svg>
);

const PRESET_REASONS = [
  'Mất mạng giữa giờ làm bài',
  'Nhập nhầm đáp án, muốn làm lại',
  'Gặp sự cố kỹ thuật (máy đơ, trình duyệt lỗi)',
  'Tự động nộp do vi phạm oan',
  'Muốn cải thiện điểm',
];

export default function RetryRequestModal({ exam, onClose, onSubmit, sending = false, error = '' }) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef(null);

  /* Focus textarea khi mở + ESC đóng */
  useEffect(() => {
    textareaRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape' && !sending) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  const handleSubmit = () => {
    if (sending) return;
    onSubmit?.(reason.trim());
  };

  return (
    <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !sending && onClose?.()}>
      <div
        className="vt-modal sm"
        role="dialog"
        aria-modal="true"
        aria-label="Xin thi lại"
        style={{ width: 'min(480px, 94vw)' }}
      >
        <header className="vt-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', minWidth: 0 }}>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'color-mix(in srgb, var(--acc) 14%, var(--panel))',
                color: 'var(--acc)',
                flexShrink: 0,
              }}
            >
              <IcoBell size={22} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, font: '800 1.05rem var(--sans)', letterSpacing: '-.02em' }}>
                Xin thi lại
              </h3>
              <p
                style={{
                  margin: '.15rem 0 0',
                  color: 'var(--mut)',
                  font: '500 .78rem var(--sans)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {exam?.title || 'Bài kiểm tra'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="vt-icon-btn"
            onClick={onClose}
            disabled={sending}
            aria-label="Đóng"
          >
            <IcoX size={16} />
          </button>
        </header>

        <div className="vt-modal-body">
          <p
            style={{
              margin: '0 0 1rem',
              color: 'var(--ink)',
              font: '500 .9rem/1.55 var(--sans)',
            }}
          >
            Yêu cầu của bạn sẽ được gửi tới giáo viên. Khi cô duyệt, bạn có thể vào lại link này để thi lại.
          </p>

          <label className="vt-field" style={{ display: 'grid', gap: '.4rem', marginBottom: '.6rem' }}>
            <span style={{ font: '700 .8rem var(--sans)', color: 'var(--mut)' }}>
              Lý do (không bắt buộc)
            </span>
            <textarea
              ref={textareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Mất mạng giữa giờ làm bài, em muốn làm lại ạ…"
              maxLength={300}
              rows={3}
              disabled={sending}
              style={{
                width: '100%',
                padding: '.7rem .9rem',
                border: '1.5px solid var(--soft)',
                borderRadius: 14,
                background: 'var(--vt-tint)',
                color: 'var(--ink)',
                font: '500 .9rem/1.5 var(--sans)',
                resize: 'vertical',
                outline: 0,
                minHeight: 70,
              }}
            />
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '.9rem',
              font: '600 .72rem var(--sans)',
              color: 'var(--mut)',
            }}
          >
            <span>Chọn nhanh lý do:</span>
            <span>{reason.length}/300</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1rem' }}>
            {PRESET_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                disabled={sending}
                style={{
                  padding: '.4rem .8rem',
                  border: '1.5px solid var(--soft)',
                  borderRadius: 999,
                  background: reason === r
                    ? 'color-mix(in srgb, var(--acc) 14%, var(--panel))'
                    : 'transparent',
                  borderColor: reason === r ? 'var(--acc)' : 'var(--soft)',
                  color: reason === r ? 'var(--acc)' : 'var(--mut)',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  font: '600 .74rem var(--sans)',
                  transition: 'all .15s',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {error && (
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '.5rem',
                padding: '.65rem .9rem',
                borderRadius: 12,
                background: 'color-mix(in srgb, #dc2626 10%, var(--panel))',
                borderLeft: '3px solid #dc2626',
                color: '#dc2626',
                font: '600 .84rem/1.4 var(--sans)',
                margin: '0 0 1rem',
              }}
            >
              <IcoAlert size={15} />
              {error}
            </p>
          )}
        </div>

        <footer className="vt-modal-foot">
          <button
            type="button"
            className="vt-btn"
            onClick={onClose}
            disabled={sending}
          >
            Hủy
          </button>
          <button
            type="button"
            className="vt-btn primary"
            onClick={handleSubmit}
            disabled={sending}
          >
            {sending ? (
              <>Đang gửi…</>
            ) : (
              <>
                <IcoSend size={14} /> Gửi yêu cầu
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}