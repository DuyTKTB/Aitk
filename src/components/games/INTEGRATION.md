# Tích hợp (đọc theo thứ tự)

## 0. Chép file
- `src/styles/tokens.css`, `src/ui/*`, `src/lib/*` → vào `src/`
- `src/pages/*` → vào `src/pages/` (hoặc đổi đường dẫn import). `Home.jsx` import `../HomePlus.jsx`
  (chỉ dùng `useGreeting`); nếu HomePlus nằm chỗ khác thì sửa dòng đó.
- `public/*` → vào `public/`

## 1. main.jsx
```jsx
import './index.css';
import './theme-sandra.css';        // các theme cũ giữ nguyên
import './styles/tokens.css';       // CUỐI CÙNG: nguồn token duy nhất
import { applySettings } from './lib/settings.js';
import { registerSW } from './lib/pwa.js';
import { initFeedbackQueue } from './lib/feedback.js';

applySettings();
initFeedbackQueue();
// registerSW cần toast nên gọi trong App (bước 2)
```

## 2. App.jsx
```jsx
import { ToastProvider, useToast } from './ui/index.jsx';
import { useRoute } from './lib/routes.js';
import Settings from './pages/Settings.jsx';
import Feedback from './pages/Feedback.jsx';
import NotFound from './pages/NotFound.jsx';

function Shell() {
  const toast = useToast();
  const { route, known } = useRoute();
  useEffect(() => registerSW({ onUpdate: (apply) =>
    toast('Có phiên bản mới', { action: { label: 'Tải lại', onClick: apply } }) }), []);
  if (!known) return <NotFound />;
  if (route === 'settings') return <Settings theme={theme} onToggleTheme={toggleTheme} />;
  if (route === 'feedback') return <Feedback />;
  /* …các route cũ… */
}
// bọc: <ToastProvider><Shell /></ToastProvider>
```
Sửa `ROUTES` trong `lib/routes.js` cho đủ route thật (mình chỉ biết: home, ai, quiz, balance, stats, login, tools).

## 3. index.html (thêm vào <head>)
```html
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#2f6bff">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```
Cần tạo 3 icon: `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`
(maskable: logo nằm trong vùng an toàn 80% ở giữa).

## 4. Nối dữ liệu tiến độ (để Home có số thật)
Gọi `recordActivity` ở nơi hoàn thành việc:
```js
import { recordActivity } from '../lib/progress.js';
recordActivity({ type: 'quiz', title: 'Quiz Este – Lipit', hash: 'quiz', topic: 'este-lipit', correct: 4, total: 5, count: 5 });
recordActivity({ type: 'ai', title: 'Cân bằng Fe + O₂ → Fe₂O₃', hash: 'ai', count: 1 });
```
Ô chương trên Home ghi `cs-quiz-topic` rồi chuyển sang `#quiz`; trang Quiz cần đọc key này nếu muốn mở đúng chương.

## 5. Backend phản hồi
Xem hợp đồng ở đầu `lib/feedback.js`. Đặt `VITE_FEEDBACK_URL` hoặc làm route `POST /api/feedback`.
Server nên: giới hạn kích thước, rate-limit theo IP/clientId, lưu DB hoặc chuyển vào Telegram/Slack/email.

## 6. Dọn
Home mới không còn dùng `home-pro.css`, `home-lindy.css`, `HeroLindy`, `HeroNet`, `PeriodicTable`.
`HeroLindy.css` có hai khối `.hl-wrap` trùng nhau (dòng 5 và 473): gộp lại nếu còn dùng HeroLindy ở Landing.
