import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import './index.css';
import './theme-sandra.css';
import './fx.css';
import './tools-page.css';
import './tools-upgrade.css';
import './tools-upgrade-2.css';
import './tools-upgrade-3.css';
import './admin.css';
import './admin-dashboard.css';
import './admin-upgrade.css';   // sau admin-dashboard.css
import './stats.css';
import './study-sheet.css';
import './nav-home-v2.css';
import './home-plus.css';
import './home-extras.css';
import './AIChat-glass-v2.css';
import './components/CommandPalette.css';
import './styles/tools-apple.css';
import './games-upgrade.css'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <App />
        <CommandPalette />
      </AuthProvider>
    </SettingsProvider>
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