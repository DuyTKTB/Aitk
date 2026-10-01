import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

// ===== CSS IMPORTS — THỨ TỰ QUAN TRỌNG =====
import './index.css';           // 1. Base + component styles (file gốc)
import './theme-sandra.css';    // 2. Theme xanh navy (KHÔNG còn @import font)
import './home-fx.css';         // 3. Hiệu ứng trang chủ (marquee, split text, bento)
import './home-stack.css';
import './home-polish.css'; // 5. Sửa lỗi + nâng cấp trang chủ (PHẢI nằm cuối)
import './tools-page.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);