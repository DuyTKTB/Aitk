import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { addUserReport } from '../data/virtualExamsBank.js';
import '../styles/feedback-modal.css';

/* Mascot minh họa hình ảnh chuẩn SVG */
function MascotSvg() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#3b82f6" />
      <circle cx="50" cy="50" r="42" fill="#ffffff" />
      {/* Thân linh vật xanh */}
      <circle cx="50" cy="56" r="28" fill="#2563eb" />
      <ellipse cx="50" cy="60" rx="18" ry="14" fill="#ffffff" />
      <circle cx="50" cy="60" r="8" fill="#2563eb" />
      {/* Đầu */}
      <circle cx="50" cy="38" r="22" fill="#3b82f6" />
      <ellipse cx="50" cy="41" rx="17" ry="14" fill="#ffffff" />
      {/* Mắt */}
      <circle cx="43" cy="38" r="3.8" fill="#0f172a" />
      <circle cx="57" cy="38" r="3.8" fill="#0f172a" />
      <circle cx="44.2" cy="36.8" r="1.4" fill="#ffffff" />
      <circle cx="58.2" cy="36.8" r="1.4" fill="#ffffff" />
      {/* Má hồng */}
      <circle cx="38" cy="43" r="2.8" fill="#fda4af" />
      <circle cx="62" cy="43" r="2.8" fill="#fda4af" />
      {/* Miệng cười */}
      <path d="M46 44 Q50 49 54 44" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Tai / antenna */}
      <circle cx="50" cy="18" r="4" fill="#fbbf24" />
      <line x1="50" y1="18" x2="50" y2="24" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Cặp sách / sách */}
      <rect x="22" y="52" width="14" height="18" rx="3" fill="#60a5fa" />
      <path d="M22 56h14" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

export default function FeedbackModal({ isOpen: propIsOpen, onClose }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(Boolean(propIsOpen));
  const [category, setCategory] = useState('Đánh giá');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (propIsOpen !== undefined) setIsOpen(propIsOpen);
  }, [propIsOpen]);

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail?.category) setCategory(e.detail.category);
      setIsOpen(true);
      setSubmitted(false);
    };
    window.addEventListener('elec-open-feedback-modal', handleOpen);
    return () => window.removeEventListener('elec-open-feedback-modal', handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim().length < 5) return;

    const reportData = {
      kind: category === 'Báo lỗi đề thi' ? 'report' : 'feedback',
      category,
      rating: rating || 5,
      content: content.trim(),
      userEmail: user?.email || 'Học sinh ELEC AI',
      submittedAt: Date.now(),
    };

    try {
      addUserReport(user?.uid || 'guest', reportData);
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
        setContent('');
        setRating(0);
        setSubmitted(false);
      }, 1500);
    } catch (err) {
      console.warn('Gửi góp ý lỗi:', err);
    }
  };

  const handleViewSubmitted = () => {
    handleClose();
    if (window.location.hash !== '#profile?tab=reports') {
      window.location.hash = '#profile?tab=reports';
    }
  };

  if (!isOpen) return null;

  const starDisplay = hoverRating || rating;
  const ratingTexts = [
    'Chọn từ 1 đến 5 sao',
    '1 sao — Cần cải thiện nhiều',
    '2 sao — Khá ổn, cần thêm tính năng',
    '3 sao — Hài lòng',
    '4 sao — Rất tốt, bài giảng hay',
    '5 sao — Tuyệt vời! Rất yêu thích ELEC AI',
  ];

  return (
    <div className="ns9-fb-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="ns9-fb-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header nổi bật với Linh vật */}
        <div className="ns9-fb-header">
          <div className="ns9-fb-mascot-wrap">
            <MascotSvg />
          </div>
          <div className="ns9-fb-title-wrap">
            <h3 className="ns9-fb-title">Góp ý của em với ELEC AI</h3>
            <p className="ns9-fb-sub">Mỗi góp ý đều được đội ngũ ELEC AI đọc và phản hồi</p>
          </div>
          <button
            type="button"
            className="ns9-fb-close"
            onClick={handleClose}
            aria-label="Đóng"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nội dung form */}
        {submitted ? (
          <div className="ns9-fb-body" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div style={{ color: '#10b981', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="16 10 11 15 8 12" />
              </svg>
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800 }}>Đã gửi góp ý thành công!</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Cảm ơn em đã chung tay giúp ELEC AI ngày càng hoàn thiện hơn. Chúc em học tốt và đạt điểm cao nhé!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="ns9-fb-body">
              <button
                type="button"
                className="ns9-fb-link-history"
                onClick={handleViewSubmitted}
              >
                Xem góp ý đã gửi và phản hồi
              </button>

              {/* Loại góp ý */}
              <div className="ns9-fb-field">
                <label className="ns9-fb-label" htmlFor="fb-cat">Loại góp ý</label>
                <select
                  id="fb-cat"
                  className="ns9-fb-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Đánh giá">Đánh giá chung</option>
                  <option value="Báo lỗi đề thi">Báo lỗi câu hỏi / Đề thi</option>
                  <option value="Đóng góp tính năng">Đóng góp ý tưởng &amp; Tính năng mới</option>
                  <option value="Tốc độ & Hiệu năng">Tốc độ &amp; Trải nghiệm sử dụng</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* Đánh giá sao */}
              <div className="ns9-fb-field">
                <label className="ns9-fb-label">
                  Đánh giá <span className="ns9-fb-req">*</span>
                </label>
                <div className="ns9-fb-stars-box">
                  <div className="ns9-fb-stars-row" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={'ns9-fb-star-btn' + (star <= starDisplay ? ' is-active' : '')}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setRating(star)}
                        aria-label={`${star} sao`}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <p className="ns9-fb-stars-hint">{ratingTexts[starDisplay]}</p>
                </div>
              </div>

              {/* Nội dung */}
              <div className="ns9-fb-field">
                <label className="ns9-fb-label" htmlFor="fb-content">
                  Nội dung <span className="ns9-fb-req">*</span>
                </label>
                <div className="ns9-fb-textarea-wrap">
                  <textarea
                    id="fb-content"
                    className="ns9-fb-textarea"
                    placeholder="Chia sẻ góp ý hoặc mô tả chi tiết lỗi bạn gặp phải..."
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                    rows={4}
                  />
                  <div className="ns9-fb-counter-row">
                    <span>Tối thiểu 5 ký tự.</span>
                    <span>{content.length}/2000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="ns9-fb-footer">
              <button
                type="button"
                className="ns9-fb-btn cancel"
                onClick={handleClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="ns9-fb-btn submit"
                disabled={content.trim().length < 5}
              >
                Gửi góp ý
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
