/* ============================================================
   main.jsx — entry point (v3)
   ============================================================ */
import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './hooks/useAuth.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import { ToastProvider } from './ui/index.jsx';

/* ============ CSS NỀN ============ */
import './index.css';
import './theme-sandra.css';
import './fx.css';
import './fx-fallback.css';

/* ============ CSS TÍNH NĂNG ============ */
import './admin.css';
import './admin-dashboard.css';
import './admin-upgrade.css';
import './stats.css';
import './study-sheet.css';

/* ============ CSS TRANG CHỦ ============ */
import './nav-home-v2.css';
import './styles/home-apple-bento.css';

/* ============ CSS APP ============ */
import './app-extra.css';
import './exam-formula.css';
import './games-upgrade.css';

/* ============ CSS TRONG styles/ ============ */
import './styles/tokens.css';
import './styles/tools-apple.css';
import './styles/violation-overlay.css';
import './styles/round-polish.css';

/* Chế độ nhẹ cho máy yếu — phải import SAU các file CSS khác để ghi đè */
import './perf-lite.css';

import App from './App.jsx';
import { applySettings } from './lib/settings.js';
import { initFeedbackQueue } from './lib/feedback.js';
import { applyPerfMode } from './lib/perf.js';

applyPerfMode();
applySettings();
initFeedbackQueue();

/* ============================================================
   ERROR BOUNDARY
   ============================================================ */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[App] Uncaught error:', error, info);
    this.setState({ errorInfo: info });
  }

  handleReload = () => {
    try {
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
        });
      }
    } catch { /* ignore */ }
    setTimeout(() => window.location.reload(), 200);
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError =
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(
        String(this.state.error?.message || '')
      );

    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        background: '#f3f6ff',
        color: '#0a1230',
      }}>
        <div style={{ maxWidth: 600, width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 .8rem', letterSpacing: '-.02em', color: '#1e293b' }}>
            {isChunkError ? 'Ứng dụng đã cập nhật' : 'Có lỗi xảy ra'}
          </h1>
          <p style={{ color: '#5d6a94', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            {isChunkError
              ? 'Phiên bản mới đã được tải lên. Bấm nút dưới đây để tải lại trang.'
              : 'Vui lòng tải lại trang. Nếu lỗi vẫn tiếp diễn, xem chi tiết lỗi bên dưới:'}
          </p>

          {/* HIỂN THỊ LỖI RÕ RÀNG ĐỂ DEBUG NGAY */}
          <div style={{
            textAlign: 'left',
            background: '#ffffff',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.82rem',
            overflowX: 'auto',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)'
          }}>
            <p style={{ margin: '0 0 6px', fontWeight: 800 }}>
              {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown error'}
            </p>
            {this.state.error?.stack && (
              <pre style={{
                margin: 0,
                fontSize: '0.74rem',
                color: '#64748b',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Consolas, monospace',
                maxHeight: 180,
                overflowY: 'auto'
              }}>
                {this.state.error.stack}
              </pre>
            )}
            {this.state.errorInfo?.componentStack && (
              <pre style={{
                margin: '8px 0 0',
                fontSize: '0.72rem',
                color: '#94a3b8',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Consolas, monospace',
                maxHeight: 120,
                overflowY: 'auto'
              }}>
                Component: {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '.8rem 1.8rem',
              borderRadius: 999,
              border: 0,
              background: 'linear-gradient(180deg, #4d86ff, #1f4fe6)',
              color: '#fff',
              fontSize: '.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(47, 107, 255, .4)',
            }}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}

/* ============================================================
   RENDER
   ============================================================ */
const rootEl = document.getElementById('root');

/* Đánh dấu đã mount để index.html biết app chạy bình thường (nếu không,
   sau 4s trang sẽ hiện cảnh báo lỗi JS thay vì im lặng). */
rootEl?.setAttribute('data-app-mounted', '1');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>
);

/* ============================================================
   PWA
   ============================================================ */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[PWA] SW registered:', reg.scope))
      .catch((err) => console.warn('[PWA] SW register fail:', err));
  });
}
