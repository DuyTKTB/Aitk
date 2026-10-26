# Teacher Analytics verification — post-fix (final)

Target: http://127.0.0.1:5177 (tab tab-vtab-1243606413). Verified after null-guard fix + server restart.

## Route note
`#teacher` is not a route → redirects to `#home`. Teacher dashboard = `#classroom` (pro/admin gate).

## Desktop 1440x900 — `.ta` renders OK
- h2: `Số liệu lớp`
- Default class "Lớp Cô Hà": `Lớp Cô Hà · 1 học sinh · 1 đề · 0 bài nộp · chưa có câu nào gắn chương`
  - 5 `.ta-kpi`, all `—` / `0 em` / `1 em`; `.ta-state`: "Chưa có bài nộp trong khoảng này…"
  - no `.ta-heat-table`, no `.ta-student-table`
- Switched to "Lớp 11A7": `Lớp 11A7 · 29 học sinh · 2 đề · 21 bài nộp · chưa có câu nào gắn chương`
  - KPI: Điểm TB lớp 8% / Tỷ lệ đạt 0% / Mastery TB — / Cần chú ý 0 em / Chưa nộp 12 em
  - `.ta-heat-table` absent → `.ta-note`: "Chưa có câu hỏi nào được gắn chương. Mở đề → sửa câu hỏi → chọn “Chương” để bật heatmap."
  - `.ta-student-table` present, 30 rows, 7 cols (Học sinh, Mastery, Bài, TB, Chương yếu nhất, Cờ, Nộp gần nhất)
  - row 1: acee Nohara | chưa đủ dữ liệu | 0 | — | — | Chưa nộp bài | —

## Drawer (click row 1)
- `.ta-drawer` opens: header "acee Nohara" / noharaacee@gmail.com; score block "— Chưa đủ dữ liệu"; "5 thành phần" = 5 items (Độ chính xác 45% 0, Độ phủ chương 20% –, Độ đều 15% –, Đúng hạn 10% –, Tiến bộ 10% –); `.ta-drawer-x` closes fine.
- BUG: `.ta-drawer` computed `position: static`, `background: rgba(255,255,255,0.04)`, z-index auto → drawer is transparent and overlaps page content (unreadable). Backdrop is fixed rgba(6,8,20,0.45).

## Range chip "30 ngày"
- Chip becomes aria-selected; KPI unchanged (8% / 0% / — / 0 em / 12 em), same subtitle/tables, no new empty state (all 21 submissions inside 30 days).

## Console / network (post-fix session, 15:30+)
- No app errors/warnings. Only `🔍 DashFrame: autoHideNav=true → hidden=true` (log).
- Pre-fix errors still in the buffer from 15:24: `[boot] Lỗi JS: Uncaught TypeError: Cannot read properties of null (reading 'kpi')`, React "The above error occurred in the <ClassAnalytics> component …", `[ErrorBoundary] TypeError: …` — historical.
- Separate app warning (pre-fix run, 15:23): `[insightAi] Không gọi được AI, dùng fallback thuật toán: Lỗi AI (429): You exceeded your current quota … model: gemini-3.8-flash …`
- Failed requests: none (all 200; two generativelanguage generateContent POSTs have no status = quota-429 path).

## Mobile 390x844 dsf3
- No bottom-nav exists for the teacher dashboard; nav is the same `.t-rail-sidebar` (icon-only 59px when unpinned; hidden by default; "Ghim menu" pins it to 236px which squeezes `.ta` to ~122px).
- Reached analytics via rail item (Số liệu lớp) at icon-only state.
- `.ta-kpis` grid-template-columns: `163px 163px` (2 cols), .ta width 358, .ta-kpis 334.
- Overflow: `.ta` itself does not exceed viewport; `.ta-student-table` right edge ≈805px but inside `.ta-scroll` (width 300, overflow-x:auto) → horizontally scrollable, clipped.
- documentElement.scrollWidth 390 == innerWidth 390 (no page-level horizontal scroll).

## Artifacts
- report/teacher-analytics-desktop.png (Lớp 11A7, populated)
- report/teacher-analytics-drawer.png (drawer open, shows transparency bug)
- report/teacher-analytics-mobile.png (390x844)
