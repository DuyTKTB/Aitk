/* Thanh điều hướng khách — hiện không còn dùng trong App (Landing đã có thanh riêng).
   Giữ lại, dùng logo.png gốc, phòng khi cần tái sử dụng. */
const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function GuestBar({ theme, scrolled, onToggleTheme }) {
  return (
    <header className={'gb' + (scrolled ? ' sc' : '')}>
      <a className="gb-logo" href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <img src="/logo.png" alt="" width="30" height="30" /> A7 K60 DTA
      </a>
      <nav className="gb-nav" aria-label="Điều hướng khách">
        <button type="button" onClick={() => scrollTo('tools')}>Công cụ</button>
      </nav>
      <div className="gb-actions">
        <button
          type="button"
          className="gb-theme"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <a className="btn primary gb-login wow-glow" href="#login">Đăng nhập</a>
      </div>
    </header>
  );
}