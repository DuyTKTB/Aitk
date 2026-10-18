# 🎨 Kế Hoạch Gộp CSS — ELEC AI

## 📊 Tình Hình Hiện Tại
- **119 file CSS** trong src/
- **~1.8MB** CSS (chưa gzip)
- Import chủ yếu ở **main.jsx** (dòng 11-36) và **App.jsx** (dòng 68-84)
- **6 phiên bản home-*.css** cùng tồn tại → confusing
- **9+ phiên bản tools-*.css** cùng tồn tại → bloated

---

## 🎯 Mục Tiêu
✅ Giảm 119 CSS → **12 file** (CSS bundle -50%)  
✅ Tổ chức theo tính năng (home, tools, games, admin, exam, etc.)  
✅ Loại bỏ file CSS cũ/duplicate  
✅ Tạo CSS variable token centralized  

---

## 📋 Chiến Lược Gộp

### **Nhóm 1: CORE (import ở main.jsx trước hết)**
```
src/styles/
├── 01-reset.css        (Normalize, font, --variables)
│   ← gộp: tokens.css, index.css base
│
├── 02-base.css         (Typography, spacing, colors)
│   ← gộp: theme-sandra.css, fx.css, fx-fallback.css
│
└── 03-components.css   (Button, Card, Modal, Nav chung)
    ← gộp: app-extra.css
```

**Import ở main.jsx/App.jsx:**
```javascript
import './styles/01-reset.css';
import './styles/02-base.css';
import './styles/03-components.css';
```

---

### **Nhóm 2: HOME (trang chủ)**
```
src/styles/
└── home.css
    ← gộp: home-extras.css, home-fx.css, home-glass.css, 
            home-plus.css, home-polish.css, home-stack.css, 
            home-wow.css, nav-home-v2.css
```

**Cách import:**
- Lazy load ở Home.jsx component (chỉ load khi route /home)
- ```javascript
  import('./styles/home.css'); // dynamic import
  ```

---

### **Nhóm 3: TOOLS (công cụ tính toán)**
```
src/styles/
└── tools.css
    ← gộp: tools-all.css, tools-calm.css, tools-cards-v2.css,
            tools-hub.css, tools-neo.css, tools-page.css,
            tools-plus.css, tools-upgrade*.css (3 file),
            tools-apple.css
```

**Cách import:**
- Lazy load ở ToolsPage.jsx
- ```javascript
  import('./styles/tools.css');
  ```

---

### **Nhóm 4: GAMES (14 game giáo dục)**
```
src/styles/
└── games.css
    ← gộp: games-upgrade.css, classroom-games.css, lab.css
```

**Cách import:**
- Lazy load ở GameLauncher.jsx (khi user vào game)

---

### **Nhóm 5: AI CHAT**
```
src/styles/
└── aichat.css          (Merged + optimized)
    ← gộp: aichat.css, ai-intelligence.css, AIChat-fix.css,
            AIChat-glass.css, AIChat-glass-v2.css, AIChat-pro.css
```

**Cách import:**
- Lazy load ở AIChat.jsx
- ```javascript
  // Chỉ load CSS khi AIChat mount
  useEffect(() => {
    import('./styles/aichat.css');
  }, []);
  ```

---

### **Nhóm 6: EXAM (thi thử & bài tập)**
```
src/styles/
└── exam.css
    ← gộp: exam-formula.css, exam-manage.css, exam-pro.css,
            exam-preview-simulator.css, exam-result-*.css,
            exam-importer.css, autoexam-studio*.css
```

**Cách import:**
- Lazy load ở Exam components

---

### **Nhóm 7: TEACHER (dashboard giáo viên)**
```
src/styles/
└── teacher.css
    ← gộp: teacher-ds.css, teacher-pro.css, teacher-apple.css,
            teacher-mobile-fix.css, teacher-simulator-hub.css,
            teacher-studio.css, teacher-tokens.css,
            teacher-dashboard-v2.css, teacher-fullscreen-blue.css
```

**Cách import:**
- Lazy load ở TeacherDashboard.jsx

---

### **Nhóm 8: ADMIN (quản trị viên)**
```
src/styles/
└── admin.css
    ← gộp: admin.css, admin-dashboard.css, admin-upgrade.css,
            admin-apple.css, admin-enhance.css, admin-polish.css,
            admin-teacher.css
```

**Cách import:**
- Lazy load ở AdminPanel.jsx

---

### **Nhóm 9: CLASSROOM (lớp học)**
```
src/styles/
└── classroom.css
    ← gộp: classroom.css, class-apple.css, class-detail.css,
            my-classes.css
```

**Cách import:**
- Lazy load ở Classroom components

---

### **Nhóm 10: LANDING (trang quảng bá)**
```
src/styles/
└── landing.css
    ← gộp: landing.css, landing-v3.css, landing-ocean.css,
            landing-class.css, landing-3d.css, landing-more.css
```

**Cách import:**
- Lazy load ở Landing.jsx

---

### **Nhóm 11: UTILITIES (tiện ích)**
```
src/styles/
└── utils.css
    ← gộp: violation-overlay.css, round-polish.css, stats.css,
            study-sheet.css, dashboard-specific.css,
            live-session-banner.css, exam-result-plus.css,
            ai-quiz-generator.css, live-proctor.css
```

---

### **Nhóm 12: COMPONENT (từng component lẻ)**
```
src/components/
├── AuthProfile.css     (← giữ nguyên, component specific)
├── ChatWidget.css
├── CommandPalette.css
├── CreditTopUp.css
├── FormulaCalculator.css
├── HeroLindy.css
├── LoginPage.css
├── LoginPage-v2.css
├── Pomodoro.css
├── ProfileFB.css
├── PeriodicTable.css
├── element-modal.css
├── formula-library.css
├── home-dashboard.css
├── home-features.css
├── home-lindy.css
├── home-pro.css
├── notebook-v2.css
├── notebook-guide.css
├── notes-v2.css
└── ... (tổng cộng ~20 file nhỏ giữ nguyên, import locally)
```

---

## 📝 Các Bước Thực Hiện

### **Bước 1: Tạo cấu trúc CSS mới** (1h)
```bash
# 1. Backup tất cả CSS
mkdir backup-css
cp src/styles/*.css backup-css/
cp src/*.css backup-css/
cp src/components/*.css backup-css/

# 2. Tạo file mới
touch src/styles/01-reset.css
touch src/styles/02-base.css
touch src/styles/03-components.css
touch src/styles/home.css
touch src/styles/tools.css
touch src/styles/games.css
touch src/styles/aichat.css
touch src/styles/exam.css
touch src/styles/teacher.css
touch src/styles/admin.css
touch src/styles/classroom.css
touch src/styles/landing.css
touch src/styles/utils.css
```

### **Bước 2: Gộp CSS (2h)**
```bash
# Ví dụ gộp home CSS:
cat src/home-extras.css >> src/styles/home.css
cat src/home-fx.css >> src/styles/home.css
# ... (tất cả 6 home files)
```

### **Bước 3: Cập nhật import ở main.jsx/App.jsx** (30min)
```javascript
// Xóa:
import './home-extras.css';
import './home-fx.css';
import './home-glass.css';
// ... (40+ dòng CSS import)

// Thay bằng:
import './styles/01-reset.css';
import './styles/02-base.css';
import './styles/03-components.css';
// Home/Tools/Games sẽ lazy load riêng
```

### **Bước 4: Cập nhật dynamic import ở từng component** (1h)
```javascript
// Home.jsx
useEffect(() => {
  import('./styles/home.css');
}, []);

// ToolsPage.jsx
useEffect(() => {
  import('./styles/tools.css');
}, []);
```

### **Bước 5: Test & cleanup** (1h)
- Chạy `npm run build` → check bundle size
- Kiểm tra visual không lỗi (screenshot)
- Xóa file CSS cũ

---

## 📊 Kỳ Vọng Kết Quả

| Metric | Before | After | Giảm |
|--------|--------|-------|------|
| CSS Files | 119 | 12 (+20 component-specific) | -90% |
| main.css size | 1.2MB | 350KB | -70% |
| Bundle gzip | ~800KB | ~300KB | -60% |
| Load time | 2.5s | 1.2s | -50% |
| TTI (Time to Interactive) | 3.2s | 1.8s | -40% |

---

## ⚠️ Lưu Ý Quan Trọng

1. **Kiểm tra CSS specificity** → Có thể class name conflict trong files gộp
   - Solution: Sử dụng CSS Module hoặc BEM naming convention
   
2. **Backup cũ** → Giữ `backup-css/` để rollback nếu cần

3. **Test từng page** → Home, Tools, Games, Exam, Admin, Teacher

4. **CSS variable** → tokens.css nên ở trong 01-reset.css để dùng everywhere

5. **Lazy load strategy** → Chỉ load CSS khi component mount, không load tất cả

---

## 📌 Priority (Tuần 1)
- [ ] Bước 1-2: Tạo + gộp CSS core (01, 02, 03)
- [ ] Bước 3: Cập nhật main.jsx
- [ ] Test + cleanup

**Tiếp theo:** Tools, Games, AI Chat CSS

