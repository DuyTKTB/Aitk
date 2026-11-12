const fs = require('fs');
const filePath = 'src/components/chat-widget.css';
let content = fs.readFileSync(filePath, 'utf8');

const additionalStyles = `
/* ============================================================
   NÂNG CẤP GIAO DIỆN CHAT CỘNG ĐỒNG THEO CHUẨN CARD FLOATING IMAGE 3
   ============================================================ */

/* Ẩn FAB nổi góc dưới để dùng icon trên Navbar làm nút kích hoạt chính */
.cw-fab {
  display: none !important;
}

/* Thẻ Dialog nổi (Floating Card) bo góc 24px sang trọng */
.cw-pane {
  position: fixed !important;
  right: 28px !important;
  bottom: 28px !important;
  z-index: 220 !important;
  width: min(440px, calc(100vw - 32px)) !important;
  height: min(680px, calc(100dvh - 110px)) !important;
  display: flex !important;
  flex-direction: column !important;
  background: #ffffff !important;
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  border-radius: 24px !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.14), 0 6px 20px rgba(0, 0, 0, 0.06) !important;
  overflow: hidden !important;
  animation: cw-in .3s cubic-bezier(.34, 1.56, .64, 1) !important;
  transition: width 0.25s ease, height 0.25s ease !important;
}

.cw-pane.is-expanded {
  width: min(880px, calc(100vw - 40px)) !important;
  height: min(820px, calc(100dvh - 80px)) !important;
}

[data-theme="dark"] .cw-pane {
  background: #0f172a !important;
  border-color: #1e293b !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3) !important;
}

/* Header chuẩn Card Image 3 */
.cw-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 12px 18px !important;
  border-bottom: 1px solid #f1f5f9 !important;
  background: #ffffff !important;
  flex-shrink: 0 !important;
  gap: 12px !important;
}

[data-theme="dark"] .cw-head {
  background: #0f172a !important;
  border-bottom-color: #1e293b !important;
}

.cw-head-left {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  min-width: 0 !important;
}

.cw-head-ico-badge {
  width: 34px !important;
  height: 34px !important;
  border-radius: 10px !important;
  background: #eff6ff !important;
  color: #2563eb !important;
  display: grid !important;
  place-items: center !important;
  flex-shrink: 0 !important;
}

[data-theme="dark"] .cw-head-ico-badge {
  background: rgba(37, 99, 235, 0.2) !important;
  color: #60a5fa !important;
}

.cw-head-titles {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  min-width: 0 !important;
}

.cw-title {
  font-size: 14.5px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

[data-theme="dark"] .cw-title {
  color: #f8fafc !important;
}

.cw-status {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 11.5px !important;
  color: #10b981 !important;
  font-weight: 500 !important;
}

.cw-dot {
  width: 7px !important;
  height: 7px !important;
  border-radius: 50% !important;
  background: #10b981 !important;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25) !important;
  flex-shrink: 0 !important;
}

.cw-head-actions {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  flex-shrink: 0 !important;
}

.cw-head-actions .cw-ib {
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: #64748b !important;
  border: none !important;
  cursor: pointer !important;
  display: grid !important;
  place-items: center !important;
  transition: all 0.15s ease !important;
}

.cw-head-actions .cw-ib:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

[data-theme="dark"] .cw-head-actions .cw-ib {
  color: #94a3b8 !important;
}

[data-theme="dark"] .cw-head-actions .cw-ib:hover {
  background: #1e293b !important;
  color: #f8fafc !important;
}

/* 3-Tab Segmented Bar */
.cw-tab-bar {
  display: flex !important;
  align-items: center !important;
  background: #f8fafc !important;
  border-bottom: 1px solid #f1f5f9 !important;
  padding: 6px 12px !important;
  gap: 4px !important;
  flex-shrink: 0 !important;
}

[data-theme="dark"] .cw-tab-bar {
  background: #131d31 !important;
  border-bottom-color: #1e293b !important;
}

.cw-tab-btn {
  flex: 1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 5px !important;
  padding: 6px 10px !important;
  border: none !important;
  background: transparent !important;
  border-radius: 999px !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #64748b !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.cw-tab-btn:hover {
  background: rgba(0, 0, 0, 0.04) !important;
  color: #0f172a !important;
}

[data-theme="dark"] .cw-tab-btn {
  color: #94a3b8 !important;
}

[data-theme="dark"] .cw-tab-btn:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #f8fafc !important;
}

.cw-tab-btn.active {
  background: #ffffff !important;
  color: #2563eb !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
}

[data-theme="dark"] .cw-tab-btn.active {
  background: #1e293b !important;
  color: #60a5fa !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25) !important;
}

/* Danh sách tin nhắn & bong bóng chat */
.cw-list {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 14px 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

.cw-day {
  align-self: center !important;
  margin: 10px 0 6px !important;
  padding: 3px 12px !important;
  border-radius: 999px !important;
  background: #f1f5f9 !important;
  color: #64748b !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
}

[data-theme="dark"] .cw-day {
  background: #1e293b !important;
  color: #94a3b8 !important;
}

.cw-msg {
  display: flex !important;
  flex-direction: column !important;
  max-width: 82% !important;
  align-self: flex-start !important;
  gap: 3px !important;
}

.cw-msg.me {
  align-self: flex-end !important;
  align-items: flex-end !important;
}

.cw-meta {
  font-size: 11.5px !important;
  color: #64748b !important;
  padding: 0 4px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}

[data-theme="dark"] .cw-meta {
  color: #94a3b8 !important;
}

.cw-author {
  font-weight: 700 !important;
  color: #0f172a !important;
}

[data-theme="dark"] .cw-author {
  color: #f1f5f9 !important;
}

.cw-bubble {
  padding: 9px 14px !important;
  border-radius: 18px 18px 18px 4px !important;
  background: #f1f5f9 !important;
  color: #0f172a !important;
  font-size: 13.5px !important;
  line-height: 1.5 !important;
  white-space: pre-wrap !important;
  word-break: break-word !important;
  transition: filter 0.15s ease !important;
  border: none !important;
}

[data-theme="dark"] .cw-bubble {
  background: #1e293b !important;
  color: #f8fafc !important;
}

.cw-msg.me .cw-bubble {
  background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  color: #ffffff !important;
  border-radius: 18px 18px 4px 18px !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2) !important;
}

/* Khung soạn thảo tin nhắn dạng viên thuốc bo tròn như Image 3 */
.cw-form {
  padding: 10px 14px 14px !important;
  border-top: 1px solid #f1f5f9 !important;
  background: #ffffff !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  flex-shrink: 0 !important;
}

[data-theme="dark"] .cw-form {
  background: #0f172a !important;
  border-top-color: #1e293b !important;
}

.cw-sender-identity-strip {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: 11.5px !important;
  color: #64748b !important;
  padding: 0 4px !important;
}

[data-theme="dark"] .cw-sender-identity-strip {
  color: #94a3b8 !important;
}

.cw-id-name-box {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}

.cw-id-name-input {
  border: none !important;
  background: transparent !important;
  color: #2563eb !important;
  font-weight: 700 !important;
  font-size: 11.5px !important;
  outline: none !important;
  max-width: 140px !important;
}

[data-theme="dark"] .cw-id-name-input {
  color: #60a5fa !important;
}

.cw-pill-composer-wrap {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  background: #f8fafc !important;
  border: 1.5px solid #e2e8f0 !important;
  border-radius: 999px !important;
  padding: 4px 6px 4px 10px !important;
  transition: all 0.2s ease !important;
}

[data-theme="dark"] .cw-pill-composer-wrap {
  background: #131d31 !important;
  border-color: #1e293b !important;
}

.cw-pill-composer-wrap:focus-within {
  border-color: #2563eb !important;
  background: #ffffff !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12) !important;
}

[data-theme="dark"] .cw-pill-composer-wrap:focus-within {
  border-color: #3b82f6 !important;
  background: #0f172a !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
}

.cw-attach-tools {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  flex-shrink: 0 !important;
}

.cw-composer-plus-btn {
  width: 28px !important;
  height: 28px !important;
  border-radius: 50% !important;
  background: #e2e8f0 !important;
  border: none !important;
  color: #475569 !important;
  font-size: 17px !important;
  font-weight: 700 !important;
  display: grid !important;
  place-items: center !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  line-height: 1 !important;
}

.cw-composer-plus-btn:hover,
.cw-composer-plus-btn.on {
  background: #2563eb !important;
  color: #ffffff !important;
}

[data-theme="dark"] .cw-composer-plus-btn {
  background: #1e293b !important;
  color: #94a3b8 !important;
}

[data-theme="dark"] .cw-composer-plus-btn:hover,
[data-theme="dark"] .cw-composer-plus-btn.on {
  background: #2563eb !important;
  color: #ffffff !important;
}

.cw-composer-img-btn {
  width: 28px !important;
  height: 28px !important;
  border-radius: 50% !important;
  display: grid !important;
  place-items: center !important;
  color: #64748b !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.cw-composer-img-btn:hover {
  color: #2563eb !important;
  background: #eff6ff !important;
}

.cw-pill-textarea {
  flex: 1 !important;
  min-width: 0 !important;
  border: none !important;
  background: transparent !important;
  outline: none !important;
  font-size: 13.5px !important;
  color: #0f172a !important;
  line-height: 1.4 !important;
  padding: 6px 4px !important;
  resize: none !important;
  max-height: 90px !important;
}

[data-theme="dark"] .cw-pill-textarea {
  color: #f1f5f9 !important;
}

.cw-pill-send-btn {
  width: 34px !important;
  height: 34px !important;
  border-radius: 50% !important;
  background: #2563eb !important;
  color: #ffffff !important;
  border: none !important;
  display: grid !important;
  place-items: center !important;
  cursor: pointer !important;
  flex-shrink: 0 !important;
  transition: all 0.15s ease !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3) !important;
}

.cw-pill-send-btn:hover:not(:disabled) {
  background: #1d4ed8 !important;
  transform: scale(1.05) !important;
}

.cw-pill-send-btn:disabled {
  opacity: 0.4 !important;
  cursor: default !important;
  box-shadow: none !important;
}
`;

fs.writeFileSync(filePath, content + '\n' + additionalStyles, 'utf8');
console.log('Appended additionalStyles to chat-widget.css');
