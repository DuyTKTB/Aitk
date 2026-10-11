/* ============================================================
   main.jsx — entry point (v3)
   ------------------------------------------------------------
   v3:
     • Khớp cấu trúc thư mục thực tế trong src/.
     • home-dashboard.css nằm trong components/ (không phải src/).
     • Bọc ErrorBoundary quanh App để bắt lỗi chunk sau deploy.
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
import './home-extras.css';
import './home-fx.css';
import './home-glass.css';
import './home-plus.css';
import './home-polish.css';
import './home-stack.css';
import './home-wow.css';
import './nav-home-v2.css';
import './components/home-dashboard.css';

/* ============ CSS AI CHAT ============ */
import './AIChat-fix.css';
import './AIChat-glass.css';
import './AIChat-glass-v2.css';
import './AIChat-pro.css';

/* ============ CSS APP ============ */
import './app-extra.css';
import './exam-formula.css';
import './games-upgrade.css';

/* ============ CSS TRONG styles/ ============ */
import './styles/tokens.css';
import './styles/tools-apple.css';
import './styles/violation-overlay.css';
import './styles/round-polish.css';

import App from './App.jsx';
import { applySettings } from './lib/settings.js';
import { initFeedbackQueue } from './lib/feedback.js';

applySettings();
initFeedbackQueue();

/* v4: sau khi deploy bản mới, chunk cũ không còn → Vite bắn 'vite:preloadError'.
   Tự tải lại ĐÚNG 1 lần (có khóa sessionStorage để không lặp vô hạn). */
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    if (sessionStorage.getItem('cs-chunk-reloaded')) return;
    sessionStorage.setItem('cs-chunk-reloaded', '1');
  } catch { /* */ }
  window.location.reload();
});
window.addEventListener('load', () => {
  setTimeout(() => { try { sessionStorage.removeItem('cs-chunk-reloaded'); } catch { /* */ } }, 10000);
});

/* ============================================================
   ERROR BOUNDARY — bắt lỗi chunk cũ sau deploy
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

  /* v4: chờ xóa cache + gỡ service worker xong RỒI mới reload (bản cũ reload sau 200ms
     cố định nên có thể tải lại bản cache cũ và lỗi chunk lặp lại). */
  handleReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError =
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(
        String(this.state.error?.message || '')
      );

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          background: '#f3f6ff',
          color: '#0a1230',
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2f6bff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: 16 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
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
   PWA — đăng ký service worker (chỉ production)
   ============================================================ */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker đã đăng ký:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Không đăng ký được Service Worker:', err);
      });
  });
}