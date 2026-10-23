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
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[App] Uncaught error:', error, info);
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
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 .8rem', letterSpacing: '-.02em' }}>
            {isChunkError ? 'Ứng dụng đã cập nhật' : 'Có lỗi xảy ra'}
          </h1>
          <p style={{ color: '#5d6a94', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            {isChunkError
              ? 'Phiên bản mới đã được tải lên. Bấm nút dưới đây để tải lại trang.'
              : 'Vui lòng tải lại trang. Nếu lỗi vẫn tiếp diễn, hãy báo cho đội phát triển.'}
          </p>
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
createRoot(document.getElementById('root')).render(
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