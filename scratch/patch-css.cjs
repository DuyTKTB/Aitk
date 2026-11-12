const fs = require('fs');
const filePath = 'src/styles/dedicated-lesson.css';
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = '/* Thẻ bài học */\n.ns9-sidebar-lesson-card {';
const targetEnd = '/* ── NÚT CHẠM AI NỔI GÓC DƯỚI BÊN PHẢI ── */';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Target not found!', { startIndex, endIndex });
  process.exit(1);
}

const replacement = `/* ── THẺ BÀI HỌC SIDEBAR (CHUẨN 100% ẢNH THỰC TẾ) ── */
.ns9-sidebar-lesson-item,
.ns9-sidebar-lesson-card {
  border-radius: 14px;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

.ns9-sidebar-lesson-item:hover:not(.is-active),
.ns9-sidebar-lesson-card:hover:not(.is-active) {
  background: #f8fafc;
}

[data-theme='dark'] .ns9-sidebar-lesson-item:hover:not(.is-active),
[data-theme='dark'] .ns9-sidebar-lesson-card:hover:not(.is-active) {
  background: #1e293b;
}

/* Active lesson item: Thẻ nổi viền bo tròn trắng sạch như ảnh */
.ns9-sidebar-lesson-item.is-active,
.ns9-sidebar-lesson-card.is-active {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 14px 14px 12px;
}

[data-theme='dark'] .ns9-sidebar-lesson-item.is-active,
[data-theme='dark'] .ns9-sidebar-lesson-card.is-active {
  background: #131c31;
  border-color: #2563eb;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.ns9-lesson-head,
.ns9-lesson-card-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

/* Biểu tượng tròn rỗng cho bài chưa chọn: ○ */
.ns9-inactive-circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  flex-shrink: 0;
  margin-top: 3px;
  transition: border-color 0.15s ease;
}

.ns9-sidebar-lesson-item:hover .ns9-inactive-circle {
  border-color: #94a3b8;
}

[data-theme='dark'] .ns9-inactive-circle {
  border-color: #475569;
}

.ns9-lesson-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ns9-lesson-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.ns9-sidebar-lesson-item:not(.is-active) .ns9-lesson-title {
  font-weight: 500;
  color: #334155;
}

[data-theme='dark'] .ns9-lesson-title {
  color: #f1f5f9;
}

[data-theme='dark'] .ns9-sidebar-lesson-item:not(.is-active) .ns9-lesson-title {
  color: #94a3b8;
}

.ns9-lesson-meta {
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 400;
}

/* 4 Mục con bên dưới thẻ active */
.ns9-active-sub-anchors {
  list-style: none;
  margin: 12px 0 0 2px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ns9-active-sub-anchors li {
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  line-height: 1.4;
}

.ns9-active-sub-anchors li:hover {
  color: #2563eb;
}

.ns9-active-sub-anchors li.is-current {
  color: #2563eb;
  font-weight: 700;
}

[data-theme='dark'] .ns9-active-sub-anchors li {
  color: #94a3b8;
}

[data-theme='dark'] .ns9-active-sub-anchors li.is-current {
  color: #60a5fa;
}

/* ── 4. CỘT PHẢI: KHUNG NỘI DUNG LÝ THUYẾT & THẺ CÔNG THỨC ── */
.ns9-study-canvas {
  flex: 1;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #eef2f6;
  padding: 40px 48px 80px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  box-sizing: border-box;
  min-height: calc(100vh - 160px);
}

[data-theme='dark'] .ns9-study-canvas {
  background: #0f172a;
  border-color: #1e293b;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
}

.ns9-pure-content-flow {
  max-width: 920px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.ns9-pure-section {
  display: flex;
  flex-direction: column;
}

.ns9-pure-sec-heading {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

[data-theme='dark'] .ns9-pure-sec-heading {
  color: #f8fafc;
}

/* 1. KHÁI NIỆM */
.ns9-pure-concepts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ns9-pure-concept-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ns9-pure-concept-title {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: #0f172a;
}

[data-theme='dark'] .ns9-pure-concept-title {
  color: #f1f5f9;
}

.ns9-pure-concept-desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.65;
  color: #334155;
}

[data-theme='dark'] .ns9-pure-concept-desc {
  color: #cbd5e1;
}

/* 2. QUY TRÌNH LÀM BÀI */
.ns9-pure-algo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ns9-pure-algo-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef2f6;
}

[data-theme='dark'] .ns9-pure-algo-row {
  background: #131c31;
  border-color: #1e293b;
}

.ns9-pure-step-badge {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: #eff6ff;
  color: #2563eb;
}

[data-theme='dark'] .ns9-pure-step-badge {
  background: rgba(37, 99, 235, 0.2);
  color: #60a5fa;
}

.ns9-pure-step-body {
  font-size: 13.5px;
  line-height: 1.6;
  color: #334155;
}

[data-theme='dark'] .ns9-pure-step-body {
  color: #cbd5e1;
}

/* 3. CÔNG THỨC CẦN NHỚ (CHUẨN 100% ẢNH THỰC TẾ) */
.ns9-pure-formula-stream {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ns9-pure-formula-block {
  display: flex;
  flex-direction: column;
}

.ns9-pure-formula-label {
  font-size: 13.5px;
  color: #334155;
  margin: 0 0 8px 0;
  line-height: 1.5;
  font-weight: 400;
}

[data-theme='dark'] .ns9-pure-formula-label {
  color: #cbd5e1;
}

/* Khung công thức bo tròn chuẩn 100% ảnh thực tế */
.ns9-pure-formula-box {
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 52px;
  box-sizing: border-box;
}

[data-theme='dark'] .ns9-pure-formula-box {
  background: #111a2e;
  border-color: #1e293b;
}

/* Ép KaTeX bên trong khung công thức sang màu xanh Royal Blue đậm nét */
.ns9-pure-formula-box .katex,
.ns9-pure-formula-box .katex-display {
  margin: 0 !important;
  text-align: left !important;
  color: #2563eb !important;
  font-size: 1.15rem;
}

.ns9-pure-formula-box .katex * {
  color: #2563eb !important;
}

[data-theme='dark'] .ns9-pure-formula-box .katex,
[data-theme='dark'] .ns9-pure-formula-box .katex-display,
[data-theme='dark'] .ns9-pure-formula-box .katex * {
  color: #60a5fa !important;
}

/* 4. LỖI THƯỜNG GẶP (CHUẨN 100% ẢNH THỰC TẾ) */
.ns9-pure-traps-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ns9-pure-trap-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.ns9-pure-trap-text {
  font-size: 13.5px;
  line-height: 1.55;
  color: #334155;
}

[data-theme='dark'] .ns9-pure-trap-text {
  color: #cbd5e1;
}

/* ĐÁY HÀNH ĐỘNG (CHUẨN ẢNH THỰC TẾ) */
.ns9-pure-footer-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-top: 40px;
  padding-top: 24px;
}

.ns9-pure-complete-btn {
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
  transition: all 0.2s ease;
}

.ns9-pure-complete-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
}

.ns9-pure-complete-btn.is-done {
  background: #10b981;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
}

.ns9-pure-next-link {
  background: transparent;
  border: none;
  padding: 4px 6px;
  font-size: 12.5px;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s ease;
}

.ns9-pure-next-link:hover {
  color: #2563eb;
}

[data-theme='dark'] .ns9-pure-next-link {
  color: #94a3b8;
}

[data-theme='dark'] .ns9-pure-next-link:hover {
  color: #60a5fa;
}

.ns9-pure-back-link {
  background: transparent;
  border: none;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.ns9-pure-back-link:hover {
  background: #eff6ff;
}

[data-theme='dark'] .ns9-pure-back-link {
  color: #60a5fa;
}

[data-theme='dark'] .ns9-pure-back-link:hover {
  background: rgba(37, 99, 235, 0.15);
}

.ns9-practice-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef2f6;
  gap: 16px;
  flex-wrap: wrap;
}

[data-theme='dark'] .ns9-practice-header-bar {
  border-color: #1e293b;
}

`;

const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated dedicated-lesson.css!');
