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

const IcoPhysics = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="2" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
  </svg>
);

const IcoBio = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4c4 4 12 4 16 0" />
    <path d="M4 20c4-4 12-4 16 0" />
    <path d="M6 8a8 8 0 0 0 12 0" />
    <path d="M6 16a8 8 0 0 1 12 0" />
    <line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.5" />
  </svg>
);

const IcoChemistry = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 2v7.31L4.69 17.5A2 2 0 0 0 6.36 21h11.28a2 2 0 0 0 1.67-3.5L14 9.31V2h-4z" />
    <path d="M8.5 2h7" />
  </svg>
);

/* ============================================================
   DANH SÁCH COMMANDS — KHOA HỌC TỰ NHIÊN (VẬT LÍ — HÓA HỌC — SINH HỌC)
   ============================================================ */
const COMMANDS = [
  // ── Điều hướng cốt lõi KHTN ──
  { id: 'home',          group: 'Điều hướng', label: 'Trang chủ KHTN',         Icon: IconHome,      keywords: 'home trang chu khtn vat ly hoa hoc sinh hoc' },
  { id: 'ai',            group: 'Điều hướng', label: 'Trợ lý AI KHTN (Lý — Hóa — Sinh)', Icon: IconRobot, keywords: 'chat ai khtn gia su giai bai tap vat ly hoa hoc sinh hoc' },
  { id: 'virtual-exams', group: 'Điều hướng', label: 'Phòng thi ảo KHTN (THPTQG & ĐGNL)', Icon: IconQuiz, keywords: 'phong thi ao luyen de thpt thi thu khtn ly hoa sinh' },
  { id: 'roadmap',       group: 'Điều hướng', label: 'Lộ trình kiến thức KHTN', Icon: IcoBook,       keywords: 'roadmap lo trinh kien thuc tien do ly hoa sinh' },
  { id: 'tools',         group: 'Điều hướng', label: 'Bộ công cụ Khoa học Tự nhiên', Icon: IconTools, keywords: 'tools cong cu khtn' },
  { id: 'profile',       group: 'Điều hướng', label: 'Trang cá nhân & Tiến độ', Icon: IconUser,      keywords: 'profile ca nhan' },

  // ── Môn Vật lí ──
  { id: 'formulas?subject=ly', group: 'Môn Vật lí', label: 'Sổ tay công thức Vật lí (Cơ, Sóng, Điện, Quang)', Icon: IcoPhysics, keywords: 'vat ly cong thuc dao dong song dien xoay chieu quang hoc hat nhan' },
  { id: 'tools?subject=ly',    group: 'Môn Vật lí', label: 'Máy tính Vật lí: Dao động điều hòa & Mạch RLC', Icon: IconCalc, keywords: 'may tinh vat ly con lac lo xo don mach rlc tong tro tan so' },
  { id: 'virtual-exams?subject=ly', group: 'Môn Vật lí', label: 'Đề thi thử THPT Quốc Gia môn Vật lí', Icon: IconQuiz, keywords: 'de thi vat ly thptqg 2026 2027 trac nghiem' },

  // ── Môn Hóa học ──
  { id: 'table',         group: 'Môn Hóa học', label: 'Bảng tuần hoàn 118 nguyên tố IUPAC', Icon: IconAtom, keywords: 'pt bang tuan hoan nguyen to hoa tri cau hinh e' },
  { id: 'balance',       group: 'Môn Hóa học', label: 'Cân bằng phương trình Hóa học (PTHH)', Icon: IconScale, keywords: 'balance can bang pthh phan ung oxh khu' },
  { id: 'analyze',       group: 'Môn Hóa học', label: 'Phân tích hợp chất & phản ứng đặc trưng', Icon: IconMicroscope, keywords: 'analyze phan tich hop chat este kim loai axit' },
  { id: 'formulas?subject=hoa', group: 'Môn Hóa học', label: 'Sổ tay công thức Hóa học (Mol, CM, pH, Hữu cơ)', Icon: IcoChemistry, keywords: 'cong thuc hoa hoc mol ph dung dich nong do este' },
  { id: 'virtual-exams?subject=hoa', group: 'Môn Hóa học', label: 'Đề thi thử THPT Quốc Gia môn Hóa học', Icon: IconQuiz, keywords: 'de thi hoa hoc thptqg 2026 2027 trac nghiem' },

  // ── Môn Sinh học ──
  { id: 'formulas?subject=sinh', group: 'Môn Sinh học', label: 'Sổ tay công thức Sinh học (ADN, Gen, Menđen)', Icon: IcoBio, keywords: 'sinh hoc cong thuc adn arn gen men den quan the nguyen phan giam phan' },
  { id: 'tools?subject=sinh',    group: 'Môn Sinh học', label: 'Công cụ Sinh học: Mã di truyền & Ma trận lai Menđen', Icon: IconCalc, keywords: 'may tinh sinh hoc codon adn phep lai punnett di truyen' },
  { id: 'virtual-exams?subject=sinh', group: 'Môn Sinh học', label: 'Đề thi thử THPT Quốc Gia môn Sinh học', Icon: IconQuiz, keywords: 'de thi sinh hoc thptqg 2026 2027 trac nghiem' },

  // ── Ôn luyện & Tiện ích ──
  { id: 'notebook',      group: 'Ôn luyện',   label: 'Sổ tay câu sai (SRS theo môn)', Icon: IcoNotebook, keywords: 'notebook so tay cau sai on tap' },
  { id: 'quiz',          group: 'Ôn luyện',   label: 'Quiz phản xạ thông minh (Lý - Hóa - Sinh)', Icon: IconQuiz, keywords: 'quiz on tap khtn' },
  { id: 'stats',         group: 'Ôn luyện',   label: 'Thống kê năng lực & Điểm Elo 3 môn', Icon: IconChart, keywords: 'stats thong ke elo nang luc' },
  { id: 'doc-studio',    group: 'Tiện ích',   label: 'AI Doc Studio (Học tài liệu & Tạo quiz)', Icon: IconNote, keywords: 'doc studio tai lieu pdf word tao quiz flashcard' },
  { id: 'admission',     group: 'Tiện ích',   label: 'Tra cứu điểm chuẩn ĐH (Khối A00, B00, A01, D07)', Icon: IconTarget, keywords: 'tra cuu diem chuan dai hoc xet tuyen khoi a00 b00 a01' },
  { id: 'career',        group: 'Tiện ích',   label: 'Định hướng nghề nghiệp AI (RIASEC)', Icon: IcoBook, keywords: 'huong nghiep dinh huong nghe riasec holland chon nganh' },
  { id: 'pomodoro',      group: 'Tiện ích',   label: 'Clock Hub (Pomodoro tập trung & Bấm giờ)', Icon: IconTimer, keywords: 'pomodoro timer dong ho' },
  { id: 'schedule',      group: 'Tiện ích',   label: 'Thời khóa biểu ôn tập KHTN', Icon: IconCalendar, keywords: 'thoi khoa bieu lich hoc' },
  { id: 'grade',         group: 'Tiện ích',   label: 'Tính điểm tốt nghiệp & Điểm xét tuyển', Icon: IconTarget, keywords: 'grade tinh diem' },
  { id: 'leaderboard',   group: 'Tiện ích',   label: 'Bảng xếp hạng chuỗi học tập', Icon: IconChart, keywords: 'leaderboard bang xep hang vinh danh chuoi' },
  { id: 'my-classes',    group: 'Lớp học',    label: 'Lớp học của tôi', Icon: IconHome, keywords: 'lop hoc my classes bai tap de thi' },
  { id: 'classroom',     group: 'Lớp học',    label: 'Quản lý lớp (Giáo viên)', Icon: IconTools, keywords: 'quan ly lop giao vien teacher dashboard' },

  // ── Trò chơi Khoa học ──
  { id: 'games',            group: 'Trò chơi', label: 'Tất cả trò chơi Khoa học', Icon: IconGamepad, keywords: 'games tro choi' },
  { id: 'games/tugofwar',   group: 'Trò chơi', label: 'Kéo co tri thức (Đấu đội KHTN)', Icon: IconGamepad, keywords: 'keo co tug of war doi khang' },
  { id: 'games/wheel',      group: 'Trò chơi', label: 'Vòng quay may mắn', Icon: IconGamepad, keywords: 'vong quay may man lucky wheel' },
  { id: 'games/flip',       group: 'Trò chơi', label: 'Lật mảnh ghép bí mật Khoa học', Icon: IconGamepad, keywords: 'lat manh ghep flip puzzle' },
  { id: 'games/millionaire', group: 'Trò chơi', label: 'Ai là triệu phú Khoa học', Icon: IconGamepad, keywords: 'ai la trieu phu millionaire' },
  { id: 'games/racing',     group: 'Trò chơi', label: 'Đua xe tri thức KHTN', Icon: IconGamepad, keywords: 'dua xe racing grand prix' },
  { id: 'games/mines',      group: 'Trò chơi', label: 'Dò mìn kiến thức Khoa học', Icon: IconGamepad, keywords: 'do min minesweeper' },
  { id: 'games/duel',       group: 'Trò chơi', label: 'Quiz đối kháng 1v1', Icon: IconGamepad, keywords: 'doi khang duel 1v1' },
  { id: 'games/lab-3d',     group: 'Trò chơi', label: 'Phòng thí nghiệm ảo 3D', Icon: IcoFlask, keywords: 'lab 3d thi nghiem ba chieu' },

  // ── Hệ thống & Hành động ──
  { id: 'settings',         group: 'Hệ thống', label: 'Cài đặt giao diện & học tập', Icon: IconTools, keywords: 'cai dat settings' },
  { id: 'feedback',         group: 'Hệ thống', label: 'Góp ý & Báo lỗi', Icon: IconTools, keywords: 'gop y bao loi feedback' },
  { id: 'action:theme',     group: 'Hành động', label: 'Đổi chế độ sáng/tối', Icon: IcoTheme, keywords: 'theme dark light' },
  { id: 'action:newchat',   group: 'Hành động', label: 'Tạo chat AI mới', Icon: IcoPlus, keywords: 'new chat moi' },
  { id: 'action:random',    group: 'Hành động', label: 'Đi tới trang ngẫu nhiên', Icon: IcoRandom, keywords: 'random ngau nhien' },
];

/* Bỏ dấu + hạ chữ thường: gõ "lo trinh" hay "lộ trình" đều ra, gõ "elecai" khớp "ELECAI" */
const norm = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

/* Điểm khớp: nhãn bắt đầu bằng từ khoá > nhãn chứa > từ khoá phụ > tên nhóm */
function scoreOf(cmd, q) {
  const label = norm(cmd.label);
  if (label.startsWith(q)) return 4;
  if (label.includes(q)) return 3;
  if (norm(cmd.keywords).includes(q)) return 2;
  if (norm(cmd.group).includes(q)) return 1;
  return 0;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const lastFocus = useRef(null);

  /* ---------- Mở / đóng bằng Ctrl/Cmd + K hoặc Custom Event ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!open) lastFocus.current = document.activeElement;
        setOpen((o) => !o);
        setQuery('');
        setSelectedIdx(0);
        return;
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    const onCustomOpen = () => {
      if (!open) lastFocus.current = document.activeElement;
      setOpen(true);
      setQuery('');
      setSelectedIdx(0);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onCustomOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onCustomOpen);
    };
  }, [open]);

  /* ---------- Focus input khi mở, trả focus về chỗ cũ khi đóng ---------- */
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    const el = lastFocus.current;
    if (el && el.focus && document.contains(el)) el.focus();
    return undefined;
  }, [open]);

  /* ---------- Lọc commands ---------- */
  const filtered = useMemo(() => {
    const q = norm(query).trim();
    if (!q) return COMMANDS;
    return COMMANDS
      .map((c, i) => ({ c, i, s: scoreOf(c, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => x.c);
  }, [query]);

  /* ---------- Nhóm theo group; danh sách phẳng khớp ĐÚNG thứ tự hiển thị
     (chọn bằng phím mũi tên không bị lệch khi kết quả xen kẽ nhiều nhóm) ---------- */
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((c) => {
      if (!map[c.group]) map[c.group] = [];
      map[c.group].push(c);
    });
    return map;
  }, [filtered]);
  const flat = useMemo(() => Object.values(grouped).flat(), [grouped]);

  /* ---------- Reset selection khi query đổi ---------- */
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  /* ---------- Cuộn item đang chọn vào view ---------- */
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
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
      setSelectedIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flat[selectedIdx];
      if (cmd) runCommand(cmd);
    }
    /* Home/End để nguyên cho ô nhập (di chuyển con trỏ) */
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
            role="combobox"
            aria-expanded="true"
            aria-controls="cp-listbox"
            aria-activedescendant={flat[selectedIdx] ? `cp-opt-${selectedIdx}` : undefined}
            autoComplete="off"
            spellCheck="false"
          />
          <kbd>ESC</kbd>
        </div>

        <div className="cp-list" ref={listRef} id="cp-listbox" role="listbox" aria-label="Kết quả">
          {filtered.length === 0 ? (
            <p className="cp-empty" role="status">
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
                      id={`cp-opt-${idx}`}
                      role="option"
                      aria-selected={selectedIdx === idx}
                      tabIndex={-1}
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
          <span className="cp-foot-brand">ELEC AI</span>
        </div>
      </div>
    </div>
  );
}