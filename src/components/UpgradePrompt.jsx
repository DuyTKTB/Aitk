import { useEffect, useRef } from 'react';
import AIMark from './AIMark.jsx';
import { IcoClose, IcoCrown, IcoSparkle, IconInfinity, IconZap, IconBook, IconBan } from './Icons.jsx';

/* ============================================================
   UpgradePrompt — Popup mời nâng cấp VIP khi bấm tính năng khóa
   ============================================================ */
export default function UpgradePrompt({ open, feature, onClose, onUpgrade }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const handleUpgrade = () => {
    ref.current?.close();
    onUpgrade?.();
  };

  return (
    <dialog
      ref={ref}
      className="upgrade-prompt"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="upgrade-prompt-inner">
        <button
          type="button"
          className="upgrade-prompt-x"
          onClick={() => ref.current.close()}
          aria-label="Đóng"
        >
          <IcoClose size={18} />
        </button>

        <div className="upgrade-prompt-mark">
          <AIMark size={120} look mode="talk" animate />
          <span className="upgrade-prompt-crown" aria-hidden="true">
            <IcoCrown size={28} />
          </span>
        </div>

        <span className="upgrade-prompt-badge">
          <IcoSparkle size={12} />
          TÍNH NĂNG VIP
        </span>

        <h2 className="upgrade-prompt-title">
          Tính năng <em>{feature || 'này'}</em> chỉ dành cho VIP
        </h2>

        <p className="upgrade-prompt-desc">
          Nâng cấp lên <b>ELECAI VIP</b> để mở khóa toàn bộ tính năng cao cấp:
          so sánh công cụ bằng AI, hỏi AI không giới hạn, ưu tiên xử lý, và nhiều thứ khác.
        </p>

        <ul className="upgrade-prompt-feats">
          <li><IcoSparkle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />So sánh công cụ AI thông minh</li>
          <li><IconInfinity size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Chat AI không giới hạn</li>
          <li><IconZap size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Ưu tiên xử lý, phản hồi nhanh</li>
          <li><IconBook size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Bộ đề chuyên sâu theo lớp</li>
          <li><IconBan size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Không quảng cáo</li>
        </ul>

        <div className="upgrade-prompt-actions">
          <button
            type="button"
            className="upgrade-prompt-btn primary"
            onClick={handleUpgrade}
          >
            <IcoCrown size={16} />
            Nâng cấp ngay
          </button>
          <button
            type="button"
            className="upgrade-prompt-btn ghost"
            onClick={() => ref.current.close()}
          >
            Để sau
          </button>
        </div>

        <p className="upgrade-prompt-note">
          Sẽ mở đăng ký trong thời gian tới. Theo dõi để không bỏ lỡ.
        </p>
      </div>
    </dialog>
  );
}