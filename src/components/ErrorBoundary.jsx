/* ============================================================
   ErrorBoundary.jsx — Bắt lỗi render + lỗi tải chunk sau khi deploy
   ------------------------------------------------------------
   Sau deploy với service worker, file JS cũ không còn → import() lỗi
   → màn hình trắng. Component này hiện thông báo và tự reload 1 lần.
   ============================================================ */
import { Component } from 'react';

const RELOAD_FLAG = 'cs-chunk-reloaded';
const isChunkError = (e) =>
  /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i
    .test(String(e?.message || e));

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
    if (isChunkError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1');
      // xóa cache của service worker rồi tải lại bản mới
      (async () => {
        try {
          const keys = await caches?.keys?.();
          await Promise.all((keys || []).map((k) => caches.delete(k)));
          const regs = await navigator.serviceWorker?.getRegistrations?.();
          await Promise.all((regs || []).map((r) => r.update().catch(() => {})));
        } catch { /* bỏ qua */ }
        location.reload();
      })();
    }
  }

  componentDidUpdate(prev) {
    // đổi trang (resetKey đổi) → thử render lại
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) {
      try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* */ }
      return this.props.children;
    }
    const chunk = isChunkError(this.state.error);
    return (
      <div role="alert" style={{ maxWidth: 480, margin: '18vh auto', padding: '1.6rem', textAlign: 'center', font: '500 .95rem/1.6 var(--sans, system-ui)' }}>
        <h2 style={{ margin: '0 0 .5rem', font: '800 1.3rem var(--sans, system-ui)' }}>
          {chunk ? 'Đã có bản cập nhật mới' : 'Có lỗi xảy ra'}
        </h2>
        <p style={{ margin: '0 0 1.2rem', color: 'var(--mut, #6b7280)' }}>
          {chunk ? 'Hãy tải lại trang để dùng phiên bản mới nhất.' : 'Trang này gặp sự cố. Bạn thử tải lại nhé — dữ liệu đang làm bài đã được lưu tự động.'}
        </p>
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center' }}>
          <button type="button" onClick={() => location.reload()}
            style={{ padding: '.6rem 1.2rem', border: 0, borderRadius: 999, background: 'var(--acc, #2f6bff)', color: '#fff', font: '700 .88rem var(--sans, system-ui)', cursor: 'pointer' }}>
            Tải lại trang
          </button>
          <button type="button" onClick={() => { this.setState({ error: null }); location.hash = ''; }}
            style={{ padding: '.6rem 1.2rem', border: '1.5px solid var(--soft, #e5e7eb)', borderRadius: 999, background: 'transparent', color: 'inherit', font: '700 .88rem var(--sans, system-ui)', cursor: 'pointer' }}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }
}
