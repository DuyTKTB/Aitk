/* ============================================================================
   GlobalPushBanner.jsx — Thanh Thông Báo Đẩy Nổi Góc Phải Trên (ELEC AI Push)
   ----------------------------------------------------------------------------
   - Lắng nghe sự kiện 'elec-live-push-banner' (khi có người tag @mọi người hoặc
     nhận thông báo đẩy quan trọng)
   - Lắng nghe postMessage từ Service Worker khi người dùng bấm vào OS Push Notification
   - Bấm vào banner mở ngay Cộng đồng ELEC / Lớp học tương ứng
   ============================================================================ */
import { useEffect, useRef, useState } from 'react';
import '../styles/nav-notifications.css';

export default function GlobalPushBanner() {
  const [banner, setBanner] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const onLivePush = (e) => {
      const detail = e?.detail;
      if (!detail?.title) return;
      clearTimeout(timerRef.current);
      setBanner(detail);
      timerRef.current = setTimeout(() => setBanner(null), 6500);
    };

    const onSwMessage = (e) => {
      if (e?.data?.type === 'OPEN_COMMUNITY') {
        window.dispatchEvent(
          new CustomEvent('elec-open-community-chat', {
            detail: { tab: e.data.tab || 'community' },
          })
        );
      }
    };

    window.addEventListener('elec-live-push-banner', onLivePush);
    navigator.serviceWorker?.addEventListener?.('message', onSwMessage);
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('elec-live-push-banner', onLivePush);
      navigator.serviceWorker?.removeEventListener?.('message', onSwMessage);
    };
  }, []);

  if (!banner) return null;

  return (
    <div className="epush-banner-wrap" role="status" aria-live="polite">
      <div
        className="epush-banner"
        onClick={() => {
          clearTimeout(timerRef.current);
          const tab = banner.channel || 'community';
          setBanner(null);
          window.dispatchEvent(new CustomEvent('elec-open-community-chat', { detail: { tab } }));
        }}
      >
        <div className="epush-banner-icon">
          <img src="/img/elec/elec-cool.png" alt="ELEC AI" draggable={false} />
          <span className="epush-banner-ping" aria-hidden="true" />
        </div>
        <div className="epush-banner-copy">
          <div className="epush-banner-kicker">
            <span>@MỌI NGƯỜI · THÔNG BÁO ĐẨY</span>
            <small>Vừa xong</small>
          </div>
          <strong>{banner.title}</strong>
          {banner.body && <p>{banner.body}</p>}
        </div>
        <button
          type="button"
          className="epush-banner-close"
          aria-label="Đóng thông báo"
          onClick={(e) => {
            e.stopPropagation();
            clearTimeout(timerRef.current);
            setBanner(null);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
