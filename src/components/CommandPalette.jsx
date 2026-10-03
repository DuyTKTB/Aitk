import { useState, useEffect, useMemo, useRef } from 'react';
import {
  IconHome, IconRobot, IconAtom, IconTools, IconUser,
  IconCalc, IconMicroscope, IconScale, IconTimer, IconCalendar,
  IconNote, IconTarget, IconQuiz, IconChart, IconGamepad,
  IconSun, IconMoon,
} from './Icons.jsx';
import './CommandPalette.css';

/* ============================================================
   Icon bổ sung (chưa có trong Icons.jsx)
   ============================================================ */
const IcoBook = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4a2 2 0 0 1 2-2h11v18H7a2 2 0 0 0-2 2V4z" />
    <path d="M5 20a2 2 0 0 1 2-2h11" />
  </svg>
);

const IcoNotebook = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M12 8h5M12 12h5M12 16h5" />
  </svg>
);

const IcoChicken = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 18c0-3 2-5 5-5h4c3 0 5 2 5 5v2H5v-2z" />
    <circle cx="12" cy="7" r="4" />
    <path d="M15 5l3 1-3 1M9 7h.01M15 7h.01" />
  </svg>
);

const IcoTarget = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const IcoDice = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8" cy="8" r="1" fill="currentColor" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="8" cy="16" r="1" fill="currentColor" />
    <circle cx="16" cy="16" r="1" fill="currentColor" />
  </svg>
);

const IcoFlask = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3v6L5 19a1.5 1.5 0 0 0 1.3 2.3h11.4A1.5 1.5 0 0 0 19 19l-5-10V3" />
    <path d="M8.5 3h7M7 14h10" />
  </svg>
);

const IcoSword = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
  </svg>
);

const IcoGrid = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
);

const IcoRandom = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);

const IcoPlus = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IcoTheme = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
  </svg>
);

/* ============================================================
   DANH SÁCH COMMANDS — dùng SVG thay emoji
   ============================================================ */
const COMMANDS = [
  { id: 'home',       group: 'Điều hướng', label: 'Trang chủ',          Icon: IconHome,      keywords: 'home trang chu' },
  { id: 'ai',         group: 'Điều hướng', label: 'Trợ lý AI',          Icon: IconRobot,     keywords: 'chat ai cuai' },
  { id: 'table',      group: 'Điều hướng', label: 'Bảng tuần hoàn',     Icon: IconAtom,      keywords: 'pt bang tuan hoan' },
  { id: 'tools',      group: 'Điều hướng', label: 'Công cụ',            Icon: IconTools,     keywords: 'tools cong cu' },
  { id: 'profile',    group: 'Điều hướng', label: 'Trang cá nhân',      Icon: IconUser,      keywords: 'profile ca nhan' },
  { id: 'formulas',   group: 'Công cụ',    label: 'Công thức nhanh',    Icon: IconCalc,      keywords: 'formula cong thuc' },
  { id: 'analyze',    group: 'Công cụ',    label: 'Phân tích hợp chất', Icon: IconMicroscope,keywords: 'analyze phan tich' },
  { id: 'balance',    group: 'Công cụ',    label: 'Cân bằng PTHH',      Icon: IconScale,     keywords: 'balance can bang pthh' },
  { id: 'pomodoro',   group: 'Công cụ',    label: 'Pomodoro',           Icon: IconTimer,     keywords: 'pomodoro timer' },
  { id: 'exam',       group: 'Công cụ',    label: 'Đếm ngược kỳ thi',   Icon: IconCalendar,  keywords: 'exam thi' },
  { id: 'notes',      group: 'Công cụ',    label: 'Ghi chú',            Icon: IconNote,      keywords: 'notes ghi chu' },
  { id: 'notebook',   group: 'Công cụ',    label: 'Sổ tay câu sai',     Icon: IcoNotebook,   keywords: 'notebook so tay' },
  { id: 'grade',      group: 'Công cụ',    label: 'Tính điểm',          Icon: IconTarget,    keywords: 'grade tinh diem' },
  { id: 'quiz',       group: 'Công cụ',    label: 'Ôn tập',             Icon: IconQuiz,      keywords: 'quiz on tap' },
  { id: 'stats',      group: 'Công cụ',    label: 'Thống kê',           Icon: IconChart,     keywords: 'stats thong ke' },
  { id: 'games',            group: 'Trò chơi', label: 'Tất cả trò chơi',        Icon: IconGamepad,   keywords: 'games tro choi' },
  { id: 'games/chicken',    group: 'Trò chơi', label: 'Bắt gà',                 Icon: IcoChicken,    keywords: 'chicken ga' },
  { id: 'games/slingshot',  group: 'Trò chơi', label: 'Bắn súng',               Icon: IcoTarget,     keywords: 'slingshot ban' },
  { id: 'games/jeopardy',   group: 'Trò chơi', label: 'Chọn ô may mắn',         Icon: IcoDice,       keywords: 'jeopardy o' },
  { id: 'games/lab',        group: 'Trò chơi', label: 'Phòng thí nghiệm ảo',    Icon: IcoFlask,      keywords: 'lab phong thi nghiem' },
  { id: 'games/battle',     group: 'Trò chơi', label: 'Đấu trường nguyên tố',   Icon: IcoSword,      keywords: 'battle dau truong' },
  { id: 'games/sudoku',     group: 'Trò chơi', label: 'Sudoku hóa học',         Icon: IcoGrid,       keywords: 'sudoku' },
  { id: 'action:theme',   group: 'Hành động', label: 'Đổi chế độ sáng/tối',    Icon: IcoTheme,      keywords: 'theme dark light' },
  { id: 'action:newchat', group: 'Hành động', label: 'Tạo chat AI mới',         Icon: IcoPlus,       keywords: 'new chat moi' },
  { id: 'action:random',  group: 'Hành động', label: 'Đi tới trang ngẫu nhiên', Icon: IcoRandom,     keywords: 'random ngau nhien' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  /* ---------- Mở / đóng bằng Ctrl/Cmd + K ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setSelectedIdx(0);
        return;
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* ---------- Focus input khi mở ---------- */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  /* ---------- Lọc commands ---------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) =>
      c.label.toLowerCase().includes(q) ||
      (c.keywords || '').includes(q) ||
      c.group.toLowerCase().includes(q)
    );
  }, [query]);

  /* ---------- Nhóm theo group ---------- */
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((c) => {
      if (!map[c.group]) map[c.group] = [];
      map[c.group].push(c);
    });
    return map;
  }, [filtered]);

  /* ---------- Reset selection khi query đổi ---------- */
  useEffect(() => {
    setSelectedIdx(0);
  }, [filtered.length]);

  /* ---------- Cuộn item đang chọn vào view ---------- */
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIdx]);

  /* ---------- Chạy command ---------- */
  const runCommand = (cmd) => {
    setOpen(false);

    if (cmd.id === 'action:theme') {
      const cur = document.documentElement.dataset.theme || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('cs-theme-v2', JSON.stringify(next)); } catch {}
      return;
    }

    if (cmd.id === 'action:newchat') {
      window.location.hash = 'ai';
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cs-new-chat'));
      }, 150);
      return;
    }

    if (cmd.id === 'action:random') {
      const pool = COMMANDS.filter((c) => !c.id.startsWith('action:'));
      const rand = pool[Math.floor(Math.random() * pool.length)];
      window.location.hash = rand.id;
      return;
    }

    window.location.hash = cmd.id;
  };

  /* ---------- Bàn phím trong modal ---------- */
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[selectedIdx];
      if (cmd) runCommand(cmd);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedIdx(filtered.length - 1);
    }
  };

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="cp-backdrop" onClick={() => setOpen(false)}>
      <div
        className="cp-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="cp-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tìm công cụ, trang, hành động…"
            aria-label="Tìm lệnh"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd>ESC</kbd>
        </div>

        <div className="cp-list" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="cp-empty">
              Không tìm thấy kết quả nào cho &ldquo;{query}&rdquo;
            </p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="cp-group">
                <p className="cp-group-label">{group}</p>
                {items.map((c) => {
                  flatIdx++;
                  const idx = flatIdx;
                  const IconComp = c.Icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-idx={idx}
                      className={'cp-item' + (selectedIdx === idx ? ' on' : '')}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => runCommand(c)}
                    >
                      <span className="cp-icon">
                        <IconComp size={18} />
                      </span>
                      <span className="cp-label">{c.label}</span>
                      <span className="cp-arrow">↵</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="cp-foot">
          <span><kbd>↑↓</kbd> di chuyển</span>
          <span><kbd>↵</kbd> chọn</span>
          <span><kbd>ESC</kbd> đóng</span>
          <span className="cp-foot-brand">A7 K60 DTA</span>
        </div>
      </div>
    </div>
  );
}