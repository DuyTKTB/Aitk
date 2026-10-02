import AIMark from './AIMark.jsx';

/* ============================================================
   MOBILE HEADER — chỉ hiện trên mobile (< 720px)
   Logo AI (AIMark) + tên app + nút search/theme
   ============================================================ */
export default function MobileHeader({ page, theme, onSearch, onToggleTheme, onMenu }) {
  return (
    <header className="mhead-bar">
      {/* ----- BÊN TRÁI: logo + text ----- */}
<div className="mhead-logo">
  <img 
    src="/img/logo.png" 
    alt="A7K60 TK MEDIA" 
  />
</div>

      {/* ----- BÊN PHẢI: 2 nút ----- */}
      <div className="mhead-right">
        <button
          type="button"
          className="mhead-btn"
          onClick={onSearch}
          aria-label="Tìm kiếm"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <button
          type="button"
          className="mhead-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {theme === 'dark' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}