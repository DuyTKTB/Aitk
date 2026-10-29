import fs from 'fs';

// 1. Cập nhật StudyGoalNavDropdown.jsx
let jsx = fs.readFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', 'utf8');

// Thay thế Header bị lỗi co thắt thành Header 2 hàng sang trọng
const oldHeader = `<div className="sg-panel-head">
            <div>
              <h3>Mục tiêu học tập</h3>
              <p>Chọn kỳ thi và theo dõi các trường em đang hướng tới</p>
            </div>
            <div className="sg-panel-head-right">
              <span className="sg-ref-badge">{meta.nhanHienThi}</span>
              <button
                type="button"
                className="sg-close-mobile"
                onClick={() => setPanelOpen(false)}
                aria-label="Đóng bảng mục tiêu học tập"
              >
                <IcoClose size={16} />
              </button>
            </div>
          </div>`;

const newHeader = `<div className="sg-panel-head">
            <div className="sg-head-main">
              <div className="sg-head-row-top">
                <h3>Mục tiêu học tập &amp; Nguyện vọng</h3>
                <button
                  type="button"
                  className="sg-close-btn"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Đóng bảng mục tiêu học tập"
                >
                  <IcoClose size={18} />
                </button>
              </div>
              <div className="sg-head-row-sub">
                <p>Chọn kỳ thi mục tiêu và theo dõi tiến độ 3 nguyện vọng đại học ưu tiên</p>
                <span className="sg-ref-badge">Đề án tuyển sinh 2026</span>
              </div>
            </div>
          </div>`;

jsx = jsx.replace(oldHeader, newHeader);

// Cập nhật thẻ nguyện vọng hiển thị đầy đủ tên trường và ngành
const oldWishBody = `<div className="sg-wish-body">
                          <div className="sg-wish-title">
                            <b className="code">{asp.school.code}</b>
                            <span> - {asp.school.name}</span>
                          </div>
                          <small className="sg-wish-major" title={asp.major.name}>
                            {asp.major.name}
                          </small>
                        </div>`;

const newWishBody = `<div className="sg-wish-body">
                          <div className="sg-wish-title">
                            <b className="code">{asp.school?.code || 'ĐH'}</b>
                            <span className="name"> · {asp.school?.name || 'Trường Đại học'}</span>
                          </div>
                          <div className="sg-wish-major-line">
                            <span className="major" title={asp.major?.name}>{asp.major?.name || 'Ngành xét tuyển'}</span>
                            <span className="meta-tag">Khối {asp.block || 'A00'}</span>
                            <span className="meta-score">Mục tiêu <b>{asp.targetScore}đ</b></span>
                          </div>
                        </div>`;

jsx = jsx.replace(oldWishBody, newWishBody);

// Cập nhật nút Đề án tuyển sinh to đẹp hơn
const oldAdmBtn = `<button
                    type="button"
                    className="sg-admission-btn"
                    onClick={() => {
                      setSelectedSchoolId(activeAsp?.school?.code || activeAsp?.school?.id || 'NEU');
                      setUniversityModalOpen(true);
                      setPanelOpen(false);
                    }}
                  >
                    <span>Đề án tuyển sinh {activeAsp?.school?.code || 'trường'}</span>
                    <IcoArrowRight size={15} />
                  </button>`;

const newAdmBtn = `<button
                    type="button"
                    className="sg-admission-btn"
                    onClick={() => {
                      setSelectedSchoolId(activeAsp?.school?.code || activeAsp?.school?.id || 'NEU');
                      setUniversityModalOpen(true);
                      setPanelOpen(false);
                    }}
                  >
                    <span className="sg-adm-btn-left">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                        <path d="M6 6h10" />
                        <path d="M6 10h10" />
                      </svg>
                      <span>Xem Đề án tuyển sinh chi tiết {activeAsp?.school?.code || 'trường'} (2026)</span>
                    </span>
                    <IcoArrowRight size={16} />
                  </button>`;

jsx = jsx.replace(oldAdmBtn, newAdmBtn);

fs.writeFileSync('src/components/aspiration/StudyGoalNavDropdown.jsx', jsx, 'utf8');
console.log('✓ Updated StudyGoalNavDropdown.jsx layout');

// 2. Cập nhật CSS trong nav-dropdowns.css
let css = fs.readFileSync('src/styles/nav-dropdowns.css', 'utf8');

const enhancedCss = `
/* ============================================================
   ENHANCED STYLES FOR STUDY GOAL MODAL & WISH LIST
   Tối ưu kích thước rộng rãi 780px, không cắt chữ, chuẩn Apple & 9Study
   ============================================================ */
.sg-dropdown-panel {
  width: 780px !important;
  max-width: calc(100vw - 32px) !important;
  border-radius: 24px !important;
  padding: 22px 24px !important;
  background: #ffffff !important;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(148, 163, 184, 0.15) !important;
}

[data-theme="dark"] .sg-dropdown-panel {
  background: #151824 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6) !important;
}

/* Header 2 hàng hoàn hảo */
.sg-panel-head {
  display: block !important;
  margin-bottom: 18px !important;
}

.sg-head-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.sg-head-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.sg-head-row-top h3 {
  margin: 0 !important;
  font-size: 1.28rem !important;
  font-weight: 800 !important;
  color: var(--ink, #0f172a) !important;
  letter-spacing: -0.02em !important;
  white-space: nowrap !important;
}

[data-theme="dark"] .sg-head-row-top h3 {
  color: #f8fafc !important;
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
}

.sg-close-btn:hover {
  background: rgba(148, 163, 184, 0.25);
  color: var(--ink, #0f172a);
}

.sg-head-row-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.sg-head-row-sub p {
  margin: 0 !important;
  font-size: 0.82rem !important;
  color: var(--mut, #64748b) !important;
  line-height: 1.4 !important;
}

.sg-ref-badge {
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  padding: 3px 10px !important;
  border-radius: 999px !important;
  background: rgba(47, 107, 255, 0.1) !important;
  color: #2f6bff !important;
  border: 1px solid rgba(47, 107, 255, 0.25) !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

/* Chia 2 cột tỷ lệ 240px - 1fr */
.sg-panel-cols {
  display: grid !important;
  grid-template-columns: 240px 1fr !important;
  gap: 22px !important;
  align-items: start !important;
}

/* Thẻ nguyện vọng hiển thị rộng rãi, không bị cắt chữ */
.sg-wish-item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 11px 14px !important;
  border-radius: 16px !important;
  background: rgba(148, 163, 184, 0.05) !important;
  border: 1.5px solid rgba(148, 163, 184, 0.18) !important;
  transition: all .18s ease !important;
}

.sg-wish-item:hover {
  border-color: rgba(47, 107, 255, 0.4) !important;
  background: rgba(47, 107, 255, 0.03) !important;
}

.sg-wish-item.is-selected {
  border-color: #2f6bff !important;
  background: rgba(47, 107, 255, 0.06) !important;
  box-shadow: 0 4px 18px rgba(47, 107, 255, 0.15) !important;
}

.sg-wish-body {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
}

.sg-wish-title {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  font-size: 0.9rem !important;
  font-weight: 700 !important;
  color: var(--ink, #0f172a) !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

[data-theme="dark"] .sg-wish-title {
  color: #f8fafc !important;
}

.sg-wish-title .code {
  color: #2f6bff !important;
  font-weight: 800 !important;
}

.sg-wish-title .name {
  color: inherit !important;
  font-weight: 600 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.sg-wish-major-line {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-size: 0.76rem !important;
  color: var(--mut, #64748b) !important;
  white-space: nowrap !important;
  overflow: hidden !important;
}

.sg-wish-major-line .major {
  font-weight: 600 !important;
  color: var(--ink, #334155) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 170px !important;
}

[data-theme="dark"] .sg-wish-major-line .major {
  color: #cbd5e1 !important;
}

.sg-wish-major-line .meta-tag {
  padding: 1px 6px !important;
  border-radius: 6px !important;
  background: rgba(148, 163, 184, 0.12) !important;
  font-weight: 700 !important;
  font-size: 0.72rem !important;
}

.sg-wish-major-line .meta-score b {
  color: #2f6bff !important;
}

/* Nút hành động Up, Edit, Delete */
.sg-wish-actions {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  flex-shrink: 0 !important;
}

.sg-icon-btn {
  width: 28px !important;
  height: 28px !important;
  border-radius: 8px !important;
  border: 1px solid rgba(148, 163, 184, 0.2) !important;
  background: rgba(148, 163, 184, 0.08) !important;
  color: var(--mut, #64748b) !important;
  display: grid !important;
  place-items: center !important;
  cursor: pointer !important;
  transition: all .15s ease !important;
}

.sg-icon-btn:hover {
  background: rgba(47, 107, 255, 0.12) !important;
  color: #2f6bff !important;
  border-color: #2f6bff !important;
}

.sg-icon-btn.danger:hover {
  background: rgba(239, 68, 68, 0.12) !important;
  color: #ef4444 !important;
  border-color: #ef4444 !important;
}

/* Nút Đề án tuyển sinh dạng Action Card nổi bật */
.sg-admission-footer {
  margin-top: 14px !important;
}

.sg-admission-btn {
  width: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 12px 16px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(47, 107, 255, 0.28) !important;
  background: rgba(47, 107, 255, 0.08) !important;
  color: #2f6bff !important;
  font-family: inherit !important;
  font-size: 0.84rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all .18s ease !important;
  box-shadow: 0 2px 8px rgba(47, 107, 255, 0.08) !important;
}

.sg-admission-btn:hover {
  background: #2f6bff !important;
  color: #ffffff !important;
  border-color: #2f6bff !important;
  box-shadow: 0 4px 16px rgba(47, 107, 255, 0.3) !important;
  transform: translateY(-1px) !important;
}

.sg-adm-btn-left {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
}
`;

css = css + '\n' + enhancedCss;
fs.writeFileSync('src/styles/nav-dropdowns.css', css, 'utf8');
console.log('✓ Appended enhanced modal CSS to nav-dropdowns.css');
