# 📝 CSS Lazy Loading Guide

Sau khi gộp CSS, các trang chính cần import CSS theo cách **dynamic** (chỉ load khi cần).

---

## 1️⃣ Home.jsx → `home.css`

```jsx
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    import('../styles/home.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 2️⃣ ToolsPage.jsx → `tools.css`

```jsx
import { useEffect } from 'react';

export default function ToolsPage() {
  useEffect(() => {
    import('../styles/tools.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 3️⃣ AIChat.jsx → `aichat.css`

```jsx
import { useEffect } from 'react';

export default function AIChat() {
  useEffect(() => {
    import('../styles/aichat.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 4️⃣ TeacherDashboard.jsx → `teacher.css`

```jsx
import { useEffect } from 'react';

export default function TeacherDashboard() {
  useEffect(() => {
    import('../styles/teacher.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 5️⃣ AdminPanel.jsx → `admin.css`

```jsx
import { useEffect } from 'react';

export default function AdminPanel() {
  useEffect(() => {
    import('../styles/admin.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 6️⃣ GameHub.jsx / Game Launcher → `games.css`

```jsx
import { useEffect } from 'react';

export default function GameHub() {
  useEffect(() => {
    import('../styles/games.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 7️⃣ Exam Components → `exam.css`

```jsx
// Ở ExamJoin.jsx, Quiz.jsx, hoặc bất kỳ exam component
import { useEffect } from 'react';

useEffect(() => {
  import('../styles/exam.css');
}, []);
```

---

## 8️⃣ Classroom Components → `classroom.css`

```jsx
// Ở MyClasses.jsx hoặc class-related components
import { useEffect } from 'react';

useEffect(() => {
  import('../styles/classroom.css');
}, []);
```

---

## 9️⃣ Landing.jsx → `landing.css`

```jsx
import { useEffect } from 'react';

export default function Landing() {
  useEffect(() => {
    import('../styles/landing.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 🔟 LoginPage.jsx → `profiles.css`

```jsx
import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    import('../styles/profiles.css');
  }, []);

  return (
    // ... component code
  );
}
```

---

## 🔨 Component-specific CSS

Giữ nguyên các file CSS này (không gộp) vì chúng nhỏ và component-specific:
- `src/components/FormulaCalculator.css`
- `src/components/CommandPalette.css`
- `src/components/CreditTopUp.css`
- `src/components/SubjectPicker.css`
- `src/components/Pomodoro.css`
- `src/components/Notes.jsx`
- `src/ui/ui.css`
- `src/pages/pages.css`
- `src/components/social/social.css`
- `src/components/games/VirtualLab.jsx` (import lab.css locally)
- `src/components/WrongNotebook.jsx` (import notebook CSS locally)

---

## ✅ Checklist Cập Nhật

- [ ] Home.jsx: thêm dynamic import home.css
- [ ] ToolsPage.jsx: thêm dynamic import tools.css
- [ ] AIChat.jsx: thêm dynamic import aichat.css
- [ ] TeacherDashboard.jsx: thêm dynamic import teacher.css
- [ ] AdminPanel.jsx: thêm dynamic import admin.css
- [ ] GameHub.jsx: thêm dynamic import games.css
- [ ] ExamJoin.jsx / Quiz.jsx: thêm dynamic import exam.css
- [ ] MyClasses.jsx: thêm dynamic import classroom.css
- [ ] Landing.jsx: thêm dynamic import landing.css
- [ ] LoginPage.jsx: thêm dynamic import profiles.css

---

## 📊 Kỳ Vọng Kết Quả

**Before:**
- main.js: 420KB (tất cả CSS load ngay)
- TTI: 2.5s

**After (với lazy loading):**
- main.js: 140KB (core CSS only)
- home.js: 152KB (khi user vào Home)
- tools.js: 326KB (khi user vào Tools)
- TTI: 1.2s (-50%)
- Load time: 1.8s (-30%)

---

## ⚠️ Lưu Ý

1. **Import trong useEffect**, KHÔNG trong top-level
   ```jsx
   // ❌ SẼ LOAD NGAY
   import './styles/home.css';

   // ✅ LOAD KHI COMPONENT MOUNT
   useEffect(() => {
     import('./styles/home.css');
   }, []);
   ```

2. **Kiểm tra kỹ CSS class conflicts**
   - Các file gộp có thể có class name trùng
   - Solution: CSS module hoặc BEM naming

3. **Test từng page** sau khi cập nhật
   - Kiểm tra visual không lỗi
   - Kiểm tra color, spacing, layout đúng

---

## 🧪 Test Command

```bash
npm run build
npm run preview
# Mở DevTools → Network → Filter CSS → Check load time
```

