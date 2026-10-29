import fs from 'fs';

const css = `/* ============================================================
   nav-dropdowns.css — STYLESHEET CHUYÊN DỤNG CHO 2 DROPDOWN TRÊN NAV
   1. StudyGoalNavDropdown (.sg-*) — Mục tiêu học tập & Nguyện vọng
   2. UserProfileNavDropdown (.ns9-uprof-*) — Menu Avatar học sinh
   Đảm bảo:
     • Nền đặc 100% không xuyên thấu (loại bỏ hoàn toàn lỗi chồng chữ / lòi viền)
     • Cột phải và cột trái nằm chung trong 1 thẻ duy nhất (không lòi ra ngoài)
     • Backdrop che mờ toàn màn hình khi mở trên mobile
     • Bo tròn mượt mà kiểu Apple iOS / visionOS
     • Tối ưu kích thước trên mọi màn hình mobile 360px - 412px và Desktop
   ============================================================ */

:root {
  --sg-font: 'Be Vietnam Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --sg-accent: #2f6bff;
}

/* ============================================================
   1. STUDY GOAL NAV DROPDOWN (.sg-*)
   ============================================================ */
.sg-nav-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
}

/* Trigger Pill trên Navbar — Viền trắng nổi bật sang chảnh */
.sg-nav-trigger {
  display: inline-flex;
  align-items: center;
  padding: 3px 6px;
  background: #ffffff !important;
  border: 1.5px solid #ffffff !important;
  border-radius: 999px;
  color: var(--ink, #0f172a);
  font-family: var(--sg-font);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all .18s ease;
  -webkit-tap-highlight-color: transparent;
  gap: 5px;
  max-width: 100%;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.9) !important;
}

[data-theme="dark"] .sg-nav-trigger {
  background: rgba(30, 41, 59, 0.88) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.35) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
  color: #f8fafc;
}

.sg-nav-trigger:hover,
.sg-nav-trigger.is-open {
  background: #ffffff !important;
  border-color: #ffffff !important;
  box-shadow: 0 4px 16px rgba(47, 107, 255, 0.22), 0 0 0 2px #ffffff !important;
  transform: translateY(-1px);
}

[data-theme="dark"] .sg-nav-trigger:hover,
[data-theme="dark"] .sg-nav-trigger.is-open {
  background: rgba(30, 41, 59, 0.98) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.55), 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
}

.sg-trigger-exam {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #2f6bff;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.sg-trigger-school {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  color: var(--ink, #0f172a);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

[data-theme="dark"] .sg-trigger-school {
  color: #f8fafc;
}

.sg-chev {
  transition: transform .2s ease;
  color: var(--mut, #64748b);
}

.sg-nav-trigger.is-open .sg-chev {
  transform: rotate(180deg);
}

/* Mobile responsive trigger */
@media (max-width: 480px) {
  .sg-nav-trigger {
    padding: 2px;
    gap: 2px;
  }
  .sg-trigger-exam span {
    display: none;
  }
  .sg-trigger-exam {
    padding: 4px 6px;
  }
  .sg-trigger-school {
    padding: 2px 4px;
    font-size: 0.74rem;
  }
}

/* Backdrop phủ nền */
.sg-mobile-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .sg-mobile-backdrop {
    display: block !important;
    position: fixed !important;
    inset: 0 !important;
    background: rgba(15, 23, 42, 0.65) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    backdrop-filter: blur(8px) !important;
    z-index: 100004 !important;
    animation: sgFadeIn .2s ease;
  }
}

@keyframes sgFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes sgSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes sgSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* ── BẢNG MỤC TIÊU HỌC TẬP: TRÊN MÁY TÍNH (>= 769px) ── */
@media (min-width: 769px) {
  .sg-dropdown-panel {
    position: absolute !important;
    top: calc(100% + 12px) !important;
    right: 0 !important;
    left: auto !important;
    width: 760px !important;
    max-width: calc(100vw - 32px) !important;
    background: #ffffff !important;
    color: #0f172a !important;
    opacity: 1 !important;
    border-radius: 24px !important;
    border: 1px solid rgba(148, 163, 184, 0.22) !important;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(148, 163, 184, 0.12) !important;
    z-index: 100005 !important;
    padding: 22px 24px !important;
    box-sizing: border-box !important;
    animation: sgSlideDown .2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    font-family: var(--sg-font);
  }

  [data-theme="dark"] .sg-dropdown-panel {
    background: #151824 !important;
    color: #f8fafc !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6) !important;
  }

  .sg-sheet-grip {
    display: none !important;
  }

  .sg-panel-cols {
    display: grid !important;
    grid-template-columns: 240px 1fr !important;
    gap: 22px !important;
    align-items: stretch !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .sg-col-exams {
    border-right: 1px solid rgba(148, 163, 184, 0.18) !important;
    padding-right: 18px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 7px !important;
    min-width: 0 !important;
  }

  .sg-col-schools {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    min-width: 0 !important;
  }
}

/* ── BẢNG MỤC TIÊU HỌC TẬP: TRÊN ĐIỆN THOẠI (<= 768px) ── */
@media (max-width: 768px) {
  .sg-dropdown-panel {
    position: fixed !important;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 88dvh !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    border-radius: 26px 26px 0 0 !important;
    border: none !important;
    padding: 14px 16px calc(24px + env(safe-area-inset-bottom, 0px)) !important;
    background: #ffffff !important;
    color: #0f172a !important;
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.25) !important;
    z-index: 100005 !important;
    animation: sgSlideUp .25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    font-family: var(--sg-font);
    box-sizing: border-box !important;
  }

  [data-theme="dark"] .sg-dropdown-panel {
    background: #151824 !important;
    color: #f8fafc !important;
  }

  .sg-sheet-grip {
    display: block !important;
    width: 38px;
    height: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.4);
    margin: 0 auto 12px;
  }

  .sg-panel-cols {
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    width: 100% !important;
  }

  .sg-col-exams {
    border-right: none !important;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16) !important;
    padding-right: 0 !important;
    padding-bottom: 10px !important;
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    scrollbar-width: none;
    gap: 8px !important;
    -webkit-overflow-scrolling: touch;
  }

  .sg-col-exams::-webkit-scrollbar {
    display: none;
  }

  .sg-exam-item {
    flex: 0 0 auto !important;
    min-width: 135px !important;
    padding: 8px 10px !important;
    border-radius: 12px !important;
  }

  .sg-col-schools {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
  }

  .sg-head-row-top h3 {
    font-size: 1.05rem !important;
  }

  .sg-head-row-sub {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 4px !important;
  }

  .sg-wish-major-line .major {
    max-width: 110px !important;
  }
}

/* ── CÁC PHẦN TỬ CHUNG TRONG PANEL ── */
.sg-panel-head {
  display: block;
  margin-bottom: 16px;
  width: 100%;
}

.sg-head-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.sg-head-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.sg-head-row-top h3 {
  margin: 0;
  font-size: 1.22rem;
  font-weight: 800;
  color: inherit;
  letter-spacing: -0.015em;
  white-space: nowrap;
}

.sg-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(148, 163, 184, 0.14);
  color: var(--mut, #64748b);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all .15s ease;
  flex-shrink: 0;
}

.sg-close-btn:hover {
  background: rgba(148, 163, 184, 0.25);
  color: var(--ink, #0f172a);
}

.sg-head-row-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.sg-head-row-sub p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--mut, #64748b);
  line-height: 1.4;
}

.sg-ref-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(47, 107, 255, 0.1);
  color: #2f6bff;
  border: 1px solid rgba(47, 107, 255, 0.25);
  white-space: nowrap;
  flex-shrink: 0;
}

.sg-col-title {
  display: block;
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--mut, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

/* Danh sách 6 kỳ thi */
.sg-exam-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sg-exam-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.06);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all .15s ease;
  color: inherit;
  user-select: none;
}

.sg-exam-item:hover {
  background: rgba(47, 107, 255, 0.06);
  border-color: rgba(47, 107, 255, 0.3);
}

.sg-exam-item.is-active {
  background: rgba(47, 107, 255, 0.1);
  border-color: #2f6bff;
}

.sg-exam-info b {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
}

.sg-exam-info small {
  display: block;
  font-size: 0.72rem;
  color: var(--mut, #64748b);
}

.sg-exam-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.sg-score-ring {
  position: relative;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
}

.sg-ring-bg {
  fill: none;
  stroke: rgba(148, 163, 184, 0.2);
  stroke-width: 3.2;
}

.sg-ring-fg {
  fill: none;
  stroke: #2f6bff;
  stroke-width: 3.2;
  stroke-linecap: round;
  transition: stroke-dashoffset .3s ease;
}

.sg-ring-txt {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.sg-ring-txt b {
  font-size: 0.74rem;
  font-weight: 800;
  color: #2f6bff;
}

.sg-ring-txt small {
  font-size: 0.58rem;
  color: var(--mut, #64748b);
}

.sg-exam-edit-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sg-exam-edit-inline input {
  width: 48px;
  padding: 3px 4px;
  border-radius: 6px;
  border: 1px solid #2f6bff;
  background: var(--bg, #fff);
  color: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
}

.sg-exam-edit-inline button {
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  background: #2f6bff;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.sg-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(148, 163, 184, 0.08);
  color: var(--mut, #64748b);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all .15s ease;
}

.sg-icon-btn:hover {
  background: rgba(47, 107, 255, 0.12);
  color: #2f6bff;
  border-color: #2f6bff;
}

.sg-icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border-color: #ef4444;
}

/* Cột phải: Trường đang hướng tới */
.sg-schools-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.sg-via-exam {
  font-size: 0.74rem;
  color: var(--mut, #64748b);
  display: block;
  margin-top: -4px;
}

.sg-add-school-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  background: #2f6bff;
  color: #ffffff;
  font: 700 0.78rem var(--sg-font);
  cursor: pointer;
  transition: all .15s ease;
  box-shadow: 0 4px 12px rgba(47, 107, 255, 0.25);
  flex-shrink: 0;
}

.sg-add-school-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.sg-add-school-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.sg-schools-counter {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}

.sg-ratio-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(47, 107, 255, 0.12);
  color: #2f6bff;
}

.sg-dots {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.sg-dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.3);
  transition: all .15s ease;
}

.sg-dots i.on {
  background: #2f6bff;
  transform: scale(1.15);
}

.sg-empty-wishes {
  padding: 24px 16px;
  text-align: center;
  border-radius: 16px;
  border: 1.5px dashed rgba(148, 163, 184, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.sg-empty-ico {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(47, 107, 255, 0.1);
  color: #2f6bff;
  display: grid;
  place-items: center;
}

.sg-empty-wishes p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--mut, #64748b);
}

.sg-wish-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sg-wish-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.18);
  transition: all .15s ease;
  cursor: pointer;
  box-sizing: border-box;
}

.sg-wish-item:hover {
  border-color: rgba(47, 107, 255, 0.4);
  background: rgba(47, 107, 255, 0.03);
}

.sg-wish-item.is-selected {
  border-color: #2f6bff;
  background: rgba(47, 107, 255, 0.06);
  box-shadow: 0 4px 16px rgba(47, 107, 255, 0.12);
}

.sg-wish-item.is-drag-over {
  border-style: dashed;
  border-color: #2f6bff;
}

.sg-wish-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
}

.sg-wish-num.n1 { background: #f59e0b; }
.sg-wish-num.n2 { background: #3b82f6; }
.sg-wish-num.n3 { background: #ec4899; }

.sg-wish-thumb {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
  line-height: 1;
  gap: 1px;
}

.sg-wish-thumb small {
  font-size: 0.58rem;
  font-weight: 800;
}

.sg-wish-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sg-wish-title {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 0.88rem;
  font-weight: 700;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sg-wish-title .code {
  color: #2f6bff;
  font-weight: 800;
}

.sg-wish-title .name {
  color: inherit;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sg-wish-major-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  color: var(--mut, #64748b);
  white-space: nowrap;
  overflow: hidden;
}

.sg-wish-major-line .major {
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: var(--ink, #334155);
}

[data-theme="dark"] .sg-wish-major-line .major {
  color: #cbd5e1;
}

.sg-wish-major-line .meta-tag {
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
  font-weight: 700;
  font-size: 0.7rem;
}

.sg-wish-major-line .meta-score b {
  color: #2f6bff;
  font-weight: 800;
}

.sg-wish-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.sg-admission-footer {
  margin-top: 6px;
}

.sg-admission-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid rgba(47, 107, 255, 0.28);
  background: rgba(47, 107, 255, 0.08);
  color: #2f6bff;
  font: 700 0.82rem var(--sg-font);
  cursor: pointer;
  transition: all .16s ease;
  box-sizing: border-box;
}

.sg-admission-btn:hover {
  background: #2f6bff;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(47, 107, 255, 0.28);
  transform: translateY(-1px);
}

.sg-adm-btn-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sg-admission-detail {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(47, 107, 255, 0.06);
  border: 1px solid rgba(47, 107, 255, 0.18);
  font-size: 0.78rem;
  line-height: 1.45;
}

.sg-admission-detail p {
  margin: 0;
}

.sg-admission-detail code {
  background: rgba(47, 107, 255, 0.12);
  color: #2f6bff;
  padding: 1px 4px;
  border-radius: 4px;
}

/* ============================================================
   2. USER PROFILE NAV DROPDOWN (.ns9-uprof-*)
   ============================================================ */
.ns9-uprof-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ns9-uprof-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 4px 2px 2px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(148, 163, 184, 0.08);
  cursor: pointer;
  transition: all .15s ease;
  -webkit-tap-highlight-color: transparent;
}

.ns9-uprof-trigger:hover,
.ns9-uprof-trigger.is-open {
  border-color: #2f6bff;
  box-shadow: 0 0 0 3px rgba(47, 107, 255, 0.15);
}

.ns9-uprof-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2f6bff;
  color: #ffffff;
  display: grid;
  place-items: center;
  font: 800 0.9rem var(--sg-font);
  overflow: hidden;
}

.ns9-uprof-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ns9-uprof-chev {
  color: var(--mut, #64748b);
  transition: transform .2s ease;
}

.ns9-uprof-chev.up {
  transform: rotate(180deg);
}

/* Backdrop phủ nền cho User Profile Menu */
.ns9-uprof-backdrop {
  position: fixed !important;
  inset: 0 !important;
  z-index: 100004 !important;
  background: transparent;
}

/* NỀN ĐẶC OPAQUE 100% CHO MENU PROFILE */
.ns9-uprof-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 300px;
  background: #ffffff !important;
  color: #0f172a;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 16px 45px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 14px;
  z-index: 100005 !important;
  box-sizing: border-box;
  animation: sgSlideDown .2s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: var(--sg-font);
}

[data-theme="dark"] .ns9-uprof-menu {
  background: #181a26 !important;
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

/* Header thông tin trong dropdown */
.ns9-uprof-head-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 4px 10px;
}

.ns9-uprof-avatar-lg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #5c6bc0;
  color: #fff;
  display: grid;
  place-items: center;
  font: 800 1.25rem var(--sg-font);
  flex-shrink: 0;
  overflow: hidden;
}

.ns9-uprof-avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ns9-uprof-head-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ns9-uprof-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ns9-uprof-school {
  font-size: 0.72rem;
  color: var(--mut, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ns9-uprof-score-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(47, 107, 255, 0.1);
  color: #2f6bff;
  font-size: 0.68rem;
  font-weight: 800;
  margin-top: 2px;
}

.ns9-uprof-divider {
  height: 1px;
  background: rgba(148, 163, 184, 0.16);
  margin: 6px 0;
}

/* Danh sách mục bấm */
.ns9-uprof-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ns9-uprof-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: inherit;
  font: 600 0.8rem var(--sg-font);
  text-align: left;
  cursor: pointer;
  transition: background .12s ease;
  width: 100%;
  box-sizing: border-box;
}

.ns9-uprof-item:hover {
  background: rgba(148, 163, 184, 0.12);
}

.ns9-uprof-item:active {
  background: rgba(148, 163, 184, 0.2);
}

.ns9-uprof-ico {
  color: var(--mut, #64748b);
  display: grid;
  place-items: center;
}

.ns9-uprof-item.is-logout {
  color: #ef4444;
}

.ns9-uprof-item.is-logout .ns9-uprof-ico {
  color: #ef4444;
}

.ns9-uprof-sheet-grip {
  display: none;
  width: 38px;
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.4);
  margin: 0 auto 12px;
}

@media (max-width: 768px) {
  .ns9-uprof-sheet-grip {
    display: block;
  }

  .ns9-uprof-backdrop {
    background: rgba(15, 23, 42, 0.65) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    backdrop-filter: blur(8px) !important;
  }

  .ns9-uprof-menu {
    position: fixed !important;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-height: 85dvh !important;
    overflow-y: auto !important;
    border-radius: 26px 26px 0 0 !important;
    border: none !important;
    padding: 16px 18px calc(24px + env(safe-area-inset-bottom, 0px)) !important;
    animation: sgSlideUp .25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    background: #ffffff !important;
    color: #0f172a !important;
    z-index: 100005 !important;
  }

  [data-theme="dark"] .ns9-uprof-menu {
    background: #181a26 !important;
    color: #f8fafc !important;
  }
}

/* ============================================================
   3. MOBILE HEADER PILLS & SLOTS (.mhead-*)
   ============================================================ */
@media (max-width: 768px) {
  .mhead-bar {
    z-index: 10000 !important;
    padding: 8px 12px !important;
    gap: 8px !important;
  }

  .mhead-theme-btn {
    display: none !important;
  }
}

.mhead-goal-slot {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 130px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

@media (max-width: 600px) {
  .sg-trigger-exam span {
    display: none !important;
  }
  .mhead-goal-slot {
    max-width: 85px;
  }
}

.mhead-right {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.mhead-streak-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.32);
  color: #ea580c;
  font: 800 0.72rem var(--sg-font);
  text-decoration: none;
  flex-shrink: 0;
  transition: transform .15s ease;
}

.mhead-streak-pill:active {
  transform: scale(0.95);
}

.mhead-streak-svg.active {
  color: #ea580c;
  filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.6));
}

.mhead-credit-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(47, 107, 255, 0.1);
  border: 1px solid rgba(47, 107, 255, 0.28);
  color: #2f6bff;
  font: 800 0.72rem var(--sg-font);
  text-decoration: none;
  flex-shrink: 0;
  white-space: nowrap;
  transition: transform .15s ease;
}

.mhead-credit-pill:active {
  transform: scale(0.95);
}

.mhead-search-btn {
  width: 34px !important;
  height: 34px !important;
  display: grid !important;
  place-items: center !important;
  border-radius: 50% !important;
  border: 1px solid rgba(148, 163, 184, 0.2) !important;
  background: rgba(148, 163, 184, 0.08) !important;
  color: var(--ink, #0f172a) !important;
}

[data-theme="dark"] .mhead-search-btn {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: #f8fafc !important;
}

/* ============================================================
   4. DESKTOP NAV TỐI ƯU CÂN ĐỐI (>= 769px)
   ============================================================ */
@media (min-width: 769px) {
  .nav-apple {
    max-width: min(1280px, 98vw) !important;
    padding: 0 12px 0 14px !important;
    gap: 8px !important;
    overflow: visible !important;
  }

  .nav-left-cluster {
    display: inline-flex !important;
    align-items: center !important;
    gap: 10px !important;
    flex-shrink: 0 !important;
    height: 100% !important;
  }

  .nav-left-cluster .nav-logo {
    margin-right: 0 !important;
  }

  .nav-actions {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding-left: 8px !important;
    margin-left: 4px !important;
    border-left: 1px solid rgba(148, 163, 184, 0.2) !important;
    flex-shrink: 0 !important;
  }

  .nav-actions-icons-cluster {
    display: inline-flex !important;
    align-items: center !important;
    gap: 5px !important;
    flex-shrink: 0 !important;
    margin-left: 2px !important;
  }

  /* 3 nút icon tròn: Tìm kiếm SVG • Đổi giao diện • Thông báo */
  .nav-action-icon-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 34px !important;
    height: 34px !important;
    min-width: 34px !important;
    min-height: 34px !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 50% !important;
    border: 1px solid rgba(148, 163, 184, 0.24) !important;
    background: rgba(255, 255, 255, 0.85) !important;
    color: var(--ink, #0f172a) !important;
    cursor: pointer !important;
    flex-shrink: 0 !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
    transition: transform 0.15s ease, background 0.2s ease, border-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  .nav-action-icon-btn:hover {
    transform: translateY(-1px) !important;
    background: #ffffff !important;
    border-color: #2f6bff !important;
    color: #2f6bff !important;
    box-shadow: 0 3px 10px rgba(47, 107, 255, 0.18) !important;
  }

  .nav-action-icon-btn:active {
    transform: scale(0.92) !important;
  }

  [data-theme="dark"] .nav-action-icon-btn {
    background: rgba(30, 41, 59, 0.8) !important;
    border-color: rgba(255, 255, 255, 0.16) !important;
    color: #f8fafc !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3) !important;
  }

  [data-theme="dark"] .nav-action-icon-btn:hover {
    background: rgba(47, 107, 255, 0.25) !important;
    border-color: #60a5fa !important;
    color: #60a5fa !important;
    box-shadow: 0 3px 12px rgba(47, 107, 255, 0.35) !important;
  }

  /* Nút Avatar cá nhân góc phải (Pill 34px bo tròn khớp với 3 icon) */
  .ns9-uprof-trigger {
    display: inline-flex !important;
    align-items: center !important;
    gap: 3px !important;
    height: 34px !important;
    min-height: 34px !important;
    padding: 2px 6px 2px 3px !important;
    border-radius: 999px !important;
    border: 1px solid rgba(148, 163, 184, 0.24) !important;
    background: rgba(255, 255, 255, 0.85) !important;
    cursor: pointer !important;
    flex-shrink: 0 !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
    transition: transform 0.15s ease, background 0.2s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  .ns9-uprof-trigger:hover,
  .ns9-uprof-trigger.is-open {
    transform: translateY(-1px) !important;
    background: #ffffff !important;
    border-color: #2f6bff !important;
    box-shadow: 0 3px 10px rgba(47, 107, 255, 0.18) !important;
  }

  [data-theme="dark"] .ns9-uprof-trigger {
    background: rgba(30, 41, 59, 0.8) !important;
    border-color: rgba(255, 255, 255, 0.16) !important;
  }

  [data-theme="dark"] .ns9-uprof-trigger:hover,
  [data-theme="dark"] .ns9-uprof-trigger.is-open {
    background: rgba(47, 107, 255, 0.25) !important;
    border-color: #60a5fa !important;
    box-shadow: 0 3px 12px rgba(47, 107, 255, 0.35) !important;
  }

  .ns9-uprof-avatar {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    min-height: 28px !important;
    border-radius: 50% !important;
    background: #2f6bff !important;
    color: #ffffff !important;
    display: grid !important;
    place-items: center !important;
    font: 800 0.8rem var(--sg-font) !important;
    overflow: hidden !important;
  }

  .ns9-uprof-avatar img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  .ns9-uprof-chev {
    color: var(--mut, #64748b) !important;
    width: 13px !important;
    height: 13px !important;
    transition: transform .2s ease !important;
  }

  .nav-credit-pill {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    height: 34px !important;
    padding: 0 11px !important;
    border-radius: 999px !important;
    background: rgba(47, 107, 255, 0.1) !important;
    border: 1px solid rgba(47, 107, 255, 0.28) !important;
    color: #2f6bff !important;
    font: 800 13px var(--sg-font) !important;
    text-decoration: none !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    transition: transform 0.15s ease, border-color 0.15s ease, background 0.2s ease !important;
  }

  .nav-credit-pill:hover {
    transform: translateY(-1px) !important;
    border-color: #2f6bff !important;
    background: rgba(47, 107, 255, 0.16) !important;
  }

  [data-theme="dark"] .nav-credit-pill {
    background: rgba(47, 107, 255, 0.16) !important;
    border-color: rgba(47, 107, 255, 0.35) !important;
    color: #60a5fa !important;
  }
}
`;

fs.writeFileSync('src/styles/nav-dropdowns.css', css, 'utf8');
console.log('Successfully generated clean nav-dropdowns.css!');
