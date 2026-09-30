import { IconSearch, IconMenu, IconSun, IconMoon } from './Icons.jsx';
import AIMark from './AIMark.jsx';

/* Tên trang hiển thị trên header */
const LABELS = {
  home: { sub: 'A7 K60 DTA', main: 'Học Hóa' },
  table: { sub: 'Bảng tuần hoàn', main: '118 nguyên tố' },
  formulas: { sub: 'Công thức', main: 'Tính nhanh' },
  ai: { sub: 'Trợ lý AI', main: 'Hỏi Hóa học' },
  analyze: { sub: 'Phân tích', main: 'Hợp chất' },
  balance: { sub: 'Cân bằng', main: 'Phương trình' },
  pomodoro: { sub: 'Pomodoro', main: 'Tập trung' },
  exam: { sub: 'Kỳ thi', main: 'Đếm ngược' },
  notes: { sub: 'Ghi chú', main: 'Sổ tay' },
  grade: { sub: 'Tính điểm', main: 'Học tập' },
  quiz: { sub: 'Ôn tập', main: 'Quiz' },
  games: { sub: 'Trò chơi', main: 'Học mà chơi' },
  profile: { sub: 'Trang cá nhân', main: 'Tài khoản' },
};

export default function MobileHeader({ page, onSearch, theme, onToggleTheme }) {
  const info = LABELS[page] || LABELS.home;

  return (
    <header className="mhead-bar">
      <div className="mhead-left">
        <AIMark size={36} mode="idle" className="mhead-logo" />
        <div className="mhead-text">
          <span className="mhead-sub">{info.sub}</span>
          <span className="mhead-main">{info.main}</span>
        </div>
      </div>

      <div className="mhead-right">
        <button
          type="button"
          className="mhead-btn"
          onClick={onSearch}
          aria-label="Tìm kiếm"
        >
          <IconSearch />
        </button>

        {/* Nút đổi sáng/tối */}
        <button
          type="button"
          className="mhead-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển chế độ sáng' : 'Chuyển chế độ tối'}
          title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
      </div>
    </header>
  );
}