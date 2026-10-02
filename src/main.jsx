import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';

// ===== CSS — THỨ TỰ QUAN TRỌNG =====
import './index.css';
import './theme-sandra.css';
import './home-fx.css';
import './home-stack.css';
import './home-polish.css';
import './tools-page.css';
import './home-glass.css';
import './tools-plus.css';
import './tools-calm.css';
import './exam-formula.css';
import './tools-upgrade.css';
import './tools-upgrade-2.css';
import './tools-upgrade-3.css';
import './admin.css';
import './admin-dashboard.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>
);