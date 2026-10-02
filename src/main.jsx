import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

// ===== CSS — THỨ TỰ QUAN TRỌNG (file sau ghi đè file trước) =====
import './index.css';          // 1. Nền + component gốc
import './theme-sandra.css';   // 2. Theme xanh navy
import './home-fx.css';        // 3. Hiệu ứng chữ + bố cục trang chủ
import './home-stack.css';     // 4. Nền của card stack
import './home-polish.css';    // 5. Sửa lỗi trang chủ
import './tools-page.css';     // 6. Trang Công cụ
import './home-glass.css';     // 7. Lớp kính + blur nhẹ
import './tools-plus.css';     // 8. Trang Công cụ: hình mẫu + Prompt Free (PHẢI nằm cuối)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);