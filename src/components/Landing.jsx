import { useEffect, useRef, useState, lazy, Suspense, useCallback } from 'react';
import AIMark from './AIMark.jsx';
import './landing-v3.css';
import './landing-ocean.css';

const LoginPage = lazy(() => import('./LoginPage.jsx'));

const LOGO = '/img/logo.png';
const openAuth = (mode = 'login') => { location.hash = mode; };
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   ICONS
   ============================================================ */
const Ico = ({ size = 18, sw = 1.8, solid = false, children }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={solid ? 'currentColor' : 'none'}
    stroke={solid ? 'none' : 'currentColor'}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    {children}
  </svg>
);
const IcoSun = (p) => <Ico {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Ico>;
const IcoMoon = (p) => <Ico {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Ico>;
const IcoSend = (p) => <Ico sw={2.4} {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Ico>;
const IcoThink = (p) => <Ico {...p}><path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.6.7.6 1.2v.9h5.8v-.9c0-.5.2-.9.6-1.2A6 6 0 0 0 12 3z" /><path d="M9.5 19h5M10.5 21.5h3" /></Ico>;
const IcoSearch = (p) => <Ico sw={2} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Ico>;
const IcoPlay = (p) => <Ico solid {...p}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></Ico>;
const IcoPause = (p) => <Ico solid {...p}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></Ico>;
const IcoVolOn = (p) => <Ico solid {...p}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></Ico>;
const IcoVolOff = (p) => <Ico solid {...p}><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></Ico>;
const IcoCheck = (p) => <Ico sw={3} {...p}><path d="M20 6L9 17l-5-5" /></Ico>;
const IcoClose = (p) => <Ico sw={2.2} {...p}><path d="M18 6L6 18M6 6l12 12" /></Ico>;
const IcoChat = (p) => <Ico sw={2} {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></Ico>;
const IcoBug = (p) => <Ico {...p}><rect x="8" y="6" width="8" height="14" rx="4" /><path d="M9 6V4a3 3 0 0 1 6 0v2M3 13h2M19 13h2M4 19l2-1M18 18l2 1M4 7l2 1M18 8l2-1" /></Ico>;
const IcoBulb = (p) => <Ico {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></Ico>;
const IcoStar = (p) => <Ico {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Ico>;
const IcoArrow = (p) => <Ico sw={2.2} {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Ico>;
const IcoPlus = (p) => <Ico sw={2.4} {...p}><path d="M12 5v14M5 12h14" /></Ico>;

const IcoLogoFallback = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="30" height="30" rx="9" fill="currentColor" opacity=".14" />
    <circle cx="16" cy="16" r="3" fill="currentColor" />
    <ellipse cx="16" cy="16" rx="11" ry="4.5" stroke="currentColor" strokeWidth="1.6" transform="rotate(35 16 16)" />
    <ellipse cx="16" cy="16" rx="11" ry="4.5" stroke="currentColor" strokeWidth="1.6" transform="rotate(-35 16 16)" />
  </svg>
);

/* ============================================================
   NỘI DUNG
   ============================================================ */
const PLACEHOLDERS = [
  'Hỏi bất cứ điều gì về Hóa học…',
  'Cân bằng giúp mình: Al + HCl → AlCl₃ + H₂',
  'Sinh 10 câu trắc nghiệm về este, có đáp án',
  'Vì sao nước đá nổi trên mặt nước?',
];

const CHIPS = [
  ['Giải thích', 'Giải thích định luật bảo toàn khối lượng'],
  ['Tạo quiz', 'Sinh 5 câu hỏi trắc nghiệm về este'],
  ['Tính pH', 'Cách tính pH của HCl 0,01M'],
  ['Cân bằng PTHH', 'Cân bằng: Fe + O2 → Fe2O3'],
];

const NAV = [
  ['Video', 'lp-video'],
  ['Xem thử', 'lp-story'],
  ['Tính năng', 'lp-feat'],
  ['Hỏi đáp', 'lp-faq'],
  ['Bắt đầu', 'lp-cta'],
];

const BUBBLES = [[6, 18, 22, 0], [14, 10, 17, 4], [27, 26, 25, 9], [41, 12, 19, 2], [58, 22, 23, 7], [70, 9, 16, 11], [82, 28, 27, 5], [92, 14, 20, 13]];

const STEP_WORDS = ['thông minh hơn', 'nhanh hơn', 'nhớ lâu hơn', 'hiệu quả hơn'];

const TILES = [
  ['H', 1, '6%', { left: '-2%' }, 40],
  ['C', 6, '70%', { left: '4%' }, -30],
  ['O', 8, '34%', { right: '-4%' }, 70],
  ['Fe', 26, '84%', { right: '10%' }, -60],
  ['Na', 11, '-4%', { right: '18%' }, 25],
];

const MANIFESTO =
  'Hóa học không khó vì có nhiều công thức. Khó vì ít ai chỉ ra lý do của từng bước. Ở đây, mỗi lời giải đi chậm từng dòng, mỗi câu sai được giữ lại để ôn, và mọi thứ nằm gọn trong một tài khoản.';

const STORY = [
  ['Hỏi', 'Gõ câu hỏi hoặc chụp ảnh đề bài. Không cần viết lại công thức, AI đọc được cả phương trình trong ảnh.'],
  ['Hiểu', 'Lời giải đi từng bước, mỗi bước kèm lý do và bảng kiểm tra số nguyên tử. Chưa rõ chỗ nào thì hỏi tiếp ngay.'],
  ['Nhớ', 'Từ bài vừa học, AI sinh quiz. Câu làm sai được lưu vào sổ tay để cuối tuần chỉ cần mở lại là đủ.'],
];

const MINI_TABLE = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'];

const GAMES = ['Bắt gà', 'Ná cao su', 'Jeopardy', 'Phòng lab ảo', 'Đấu nguyên tố', 'Sudoku hóa học'];

const STATS = [[118, '', 'nguyên tố trong bảng tuần hoàn'], [9, '', 'công cụ học tập'], [6, '', 'trò chơi ôn Hóa'], [24, '/7', 'trợ lý AI luôn sẵn sàng']];

const TRACK = [
  {
    g: 'Lớp 10', lvl: 'Nền tảng',
    body: 'Cấu tạo nguyên tử, bảng tuần hoàn, liên kết hóa học, phản ứng oxi hóa – khử, tốc độ phản ứng.',
    tools: ['Bảng tuần hoàn', 'Cân bằng PTHH', 'Hỏi AI'],
    tip: 'Học bảng tuần hoàn theo nhóm: nhớ một nguyên tố là đoán được tính chất của cả nhóm.',
  },
  {
    g: 'Lớp 11', lvl: 'Đào sâu',
    body: 'Cân bằng hóa học, nitơ – photpho, hiđrocacbon, ancol – phenol, anđehit – axit cacboxylic.',
    tools: ['Tính pH', 'Phân tích hợp chất', 'Công thức nhanh'],
    tip: 'pH = −log[H⁺]. Axit mạnh phân li hoàn toàn nên HCl 0,01M có pH = 2.',
  },
  {
    g: 'Lớp 12', lvl: 'Tăng tốc ôn thi',
    body: 'Este – lipit, cacbohiđrat, amin – amino axit, polime, kim loại và điện phân.',
    tools: ['Quiz theo chuyên đề', 'Sổ câu sai', 'Kỳ thi đếm ngược'],
    tip: 'Ghi mỗi câu sai kèm lý do sai. Ôn lại đúng những câu đó sẽ nhanh hơn làm đề mới.',
  },
  {
    g: 'Đại học', lvl: 'Mở rộng',
    body: 'Hóa đại cương, hóa phân tích, nhiệt động hóa học và động hóa học.',
    tools: ['Công thức nhanh', 'Hỏi AI', 'Ghi chú'],
    tip: 'Dùng AI để kiểm tra kết quả, còn phần lập luận hãy tự viết ra trước.',
  },
];

const FAQS = [
  {
    cat: 'Cơ bản',
    icon: '💡',
    q: 'Mình có phải trả phí không?',
    a: 'Không. Tài khoản học sinh miễn phí. Gói VIP đang được chuẩn bị và sẽ chỉ là tùy chọn. Bạn có thể dùng đầy đủ các công cụ cơ bản mà không mất phí.',
  },
  {
    cat: 'AI',
    icon: '🤖',
    q: 'AI có giải được bài từ ảnh chụp không?',
    a: 'Có. Bạn chụp đề bài, AI đọc nội dung và giải từng bước. Ảnh rõ nét, đủ sáng sẽ cho kết quả tốt nhất. Nếu ảnh mờ, AI sẽ hỏi lại bạn.',
  },
  {
    cat: 'AI',
    icon: '🎯',
    q: 'Kết quả của AI có chính xác tuyệt đối không?',
    a: 'Không. AI có thể sai, nhất là bài tính toán dài. Hãy đọc kỹ từng bước và đối chiếu với sách giáo khoa khi cần. AI được thiết kế để hỗ trợ, không thay thế bạn.',
  },
  {
    cat: 'Tính năng',
    icon: '📚',
    q: 'Sổ câu sai hoạt động thế nào?',
    a: 'Khi làm quiz, câu sai được lưu lại cùng đáp án đúng. Bạn mở sổ tay để ôn riêng những câu đó, không phải làm lại cả đề. Cuối tuần chỉ cần xem lại là đủ.',
  },
  {
    cat: 'Cơ bản',
    icon: '📱',
    q: 'Mình dùng được trên điện thoại không?',
    a: 'Được. Trang chạy trên trình duyệt điện thoại và có thể thêm vào màn hình chính như một ứng dụng. Giao diện tự động điều chỉnh cho màn hình nhỏ.',
  },
  {
    cat: 'Bảo mật',
    icon: '🔒',
    q: 'Dữ liệu học tập của mình được lưu ở đâu?',
    a: 'Tiến độ, sổ câu sai và ghi chú gắn với tài khoản của bạn, nên đăng nhập trên máy khác vẫn thấy lại. Chúng tôi không chia sẻ dữ liệu với bên thứ ba.',
  },
];

const FEEDBACK = [['bug', 'Báo lỗi'], ['idea', 'Góp ý'], ['star', 'Khen ngợi']];

const VIDEO = { src: '/video/ai-intro.mp4', poster: '', youtubeId: '' };
const VIDEO_POINTS = [
  ['Hỏi bằng chữ hoặc ảnh', 'Gõ câu hỏi hoặc chụp đề bài.'],
  ['Lời giải từng bước', 'Mỗi bước kèm lý do, hỏi tiếp ngay trong cùng cuộc trò chuyện.'],
  ['Ôn lại bằng quiz', 'AI sinh câu hỏi từ bài vừa học và lưu câu sai.'],
];

/* ============================================================
   HOOKS
   ============================================================ */
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on];
}

function useTypewriter(lines, active) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!active) return undefined;
    let i = 0, j = 0, dir = 1, timer;
    const tick = () => {
      const line = lines[i];
      j += dir;
      setText(line.slice(0, j));
      let wait = dir > 0 ? 42 : 18;
      if (dir > 0 && j === line.length) { dir = -1; wait = 1800; }
      else if (dir < 0 && j === 0) { dir = 1; i = (i + 1) % lines.length; wait = 400; }
      timer = setTimeout(tick, wait);
    };
    timer = setTimeout(tick, 700);
    return () => clearTimeout(timer);
  }, [lines, active]);
  return text;
}

function useScrollEngine(root) {
  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;

    if (prefersReduced()) {
      el.classList.add('is-static');
      return undefined;
    }

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const scrubs = Array.from(el.querySelectorAll('[data-scrub]'));
    const hsecs = Array.from(el.querySelectorAll('[data-hscroll]'));
    let raf = 0, lastY = window.scrollY, vel = 0;

    const measure = () => {
      hsecs.forEach((sec) => {
        const tr = sec.querySelector('[data-track]');
        if (!tr) return;
        const dx = Math.max(0, tr.scrollWidth - window.innerWidth);
        sec.style.setProperty('--dx', dx + 'px');
        sec.style.height = window.innerHeight + dx + 'px';
      });
    };

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const sp = max > 0 ? clamp(y / max) : 0;

      el.style.setProperty('--sp', sp.toFixed(4));
      el.classList.toggle('scrolled', y > 12);

      vel += (y - lastY - vel) * 0.2;
      lastY = y;
      el.style.setProperty('--vel', clamp(vel, -40, 40).toFixed(2));

      scrubs.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        const mode = s.dataset.scrub;
        let p;
        if (mode === 'pin') p = clamp(-r.top / Math.max(1, r.height - vh));
        else if (mode === 'out') p = clamp(-r.top / Math.max(1, r.height));
        else p = clamp((vh - r.top) / (vh * 0.85));
        s.style.setProperty('--p', p.toFixed(4));
        if (s.dataset.steps) {
          const n = Number(s.dataset.steps);
          const st = String(Math.min(n - 1, Math.floor(p * n)));
          if (s.dataset.step !== st) s.dataset.step = st;
        }
      });

      if (Math.abs(vel) > 0.1) raf = requestAnimationFrame(update);
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { measure(); onScroll(); };

    measure();
    update();
    const t = setTimeout(onResize, 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [root]);
}

function useHeroPointer(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced() || window.matchMedia('(pointer: coarse)').matches) return undefined;
    let raf = 0, nx = 0, ny = 0, x = 0, y = 0;
    const loop = () => {
      raf = 0;
      x += (nx - x) * 0.08; y += (ny - y) * 0.08;
      el.style.setProperty('--px', x.toFixed(3));
      el.style.setProperty('--py', y.toFixed(3));
      if (Math.abs(nx - x) > 0.002 || Math.abs(ny - y) > 0.002) raf = requestAnimationFrame(loop);
    };
    const move = (e) => {
      nx = (e.clientX / window.innerWidth - 0.5) * 2;
      ny = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.setProperty('--cx', e.clientX + 'px');
      el.style.setProperty('--cy', e.clientY + 'px');
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); if (raf) cancelAnimationFrame(raf); };
  }, [ref]);
}

/* ============================================================
   THÀNH PHẦN NHỎ
   ============================================================ */
function Split({ text, as: Tag = 'h2', className = '' }) {
  const [ref, on] = useInView(0.35);
  return (
    <Tag ref={ref} className={'sp' + (on ? ' on' : '') + (className ? ' ' + className : '')} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="sp-w" aria-hidden="true">
          <span style={{ '--i': i }}>{w}</span>
        </span>
      ))}
    </Tag>
  );
}

function Count({ to, suffix }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReduced()) { setN(to); return undefined; }
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / 1200, 1);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <b ref={ref}>{n}{suffix}</b>;
}

function MagBtn({ as: Tag = 'button', className = '', children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced() || window.matchMedia('(pointer: coarse)').matches) return undefined;
    let raf = 0, x = 0, y = 0, tx = 0, ty = 0;
    const loop = () => {
      raf = 0;
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      el.style.setProperty('--mx', x.toFixed(2) + 'px');
      el.style.setProperty('--my', y.toFixed(2) + 'px');
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(loop);
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * 0.2;
      ty = (e.clientY - (r.top + r.height / 2)) * 0.2;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <Tag ref={ref} className={className} {...rest}>{children}</Tag>;
}

function Logo({ size = 40 }) {
  const [err, setErr] = useState(false);
  if (err) return <IcoLogoFallback size={size} />;
  return <img src={LOGO} alt="A7 K60 DTA" width={size} height={size} onError={() => setErr(true)} />;
}

/* ============================================================
   TYPING HEADLINE
   ============================================================ */
function TypingHeadline() {
  const WORDS = STEP_WORDS;
  const [wordIdx, setWordIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showCaret, setShowCaret] = useState(true);

  useEffect(() => {
    if (prefersReduced()) {
      setText(WORDS[wordIdx]);
      return undefined;
    }
    const current = WORDS[wordIdx];
    let timer;

    if (!deleting && text === current) {
      timer = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && text === '') {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % WORDS.length);
    } else {
      const speed = deleting ? 35 : 65;
      timer = setTimeout(() => {
        setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1));
      }, speed);
    }
    return () => clearTimeout(timer);
  }, [text, deleting, wordIdx, WORDS]);

  useEffect(() => {
    const t = setInterval(() => setShowCaret((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <h1 className="lp-hero-title">
      <span className="lht-line lht-line1">
        <span className="lht-black">Học</span>{' '}
        <span className="lht-blue">Hóa học</span>
      </span>
      <span className="lht-line lht-line2">
        <span className="lht-blue">{text}</span>
        <span className={'lht-caret' + (showCaret ? ' on' : '')} aria-hidden="true" />
      </span>
    </h1>
  );
}

/* ============================================================
   MANIFESTO
   ============================================================ */
function Manifesto() {
  const words = MANIFESTO.split(' ');
  return (
    <section className="lp-mani" id="lp-about" data-scrub="pin">
      <div className="lp-mani-stick lp-wrap">
        <p>
          {words.map((w, i) => (
            <span key={i} style={{ '--w': (i / (words.length - 1)).toFixed(3) }}>{w} </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   VIDEO
   ============================================================ */
function VideoSection() {
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const vref = useRef(null);

  const togglePlay = () => {
    const v = vref.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  const toggleMute = () => {
    const v = vref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <section className="lp-video" id="lp-video">
      <div className="lp-wrap lp-video-head">
        <Split text="Xem AI giải một bài Hóa từ đầu đến cuối" />
        <p>Video ngắn cho thấy cách hỏi, cách AI lập luận và cách ôn lại sau đó.</p>
      </div>

      <div className="lp-vstage" data-scrub="enter">
        <div className="lp-vframe">
          {VIDEO.youtubeId ? (
            <iframe
              title="Video giới thiệu trợ lý AI"
              src={`https://www.youtube-nocookie.com/embed/${VIDEO.youtubeId}?autoplay=1&mute=1&rel=0&loop=1`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={vref}
              src={VIDEO.src}
              poster={VIDEO.poster || undefined}
              preload="auto"
              playsInline
              muted={muted}
              autoPlay
              loop
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => setFailed(true)}
              aria-label="Video giới thiệu trợ lý AI"
            />
          )}

          {!failed && !VIDEO.youtubeId && (
            <div className="lp-vctl">
              <button type="button" onClick={togglePlay} aria-label={playing ? 'Tạm dừng' : 'Phát'}>
                {playing ? <IcoPause /> : <IcoPlay size={18} />}
              </button>
              <button type="button" onClick={toggleMute} aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}>
                {muted ? <IcoVolOff /> : <IcoVolOn />}
              </button>
            </div>
          )}

          {failed && (
            <div className="lp-vfail" role="status">
              <b>Chưa tìm thấy video</b>
              <p>Đặt file vào <code>public/video/ai-intro.mp4</code> hoặc điền <code>youtubeId</code> trong Landing.jsx.</p>
            </div>
          )}
        </div>
      </div>

      <ul className="lp-wrap lp-vpoints">
        {VIDEO_POINTS.map(([t, d]) => (
          <li key={t}><b>{t}</b><span>{d}</span></li>
        ))}
      </ul>
    </section>
  );
}

/* ============================================================
   STORY
   ============================================================ */
const Co = ({ n }) => (
  <b className="co"><em className="q" aria-hidden="true" /><em className="n">{n}</em></b>
);

function Story() {
  return (
    <section className="lp-story" id="lp-story" data-scrub="pin" data-steps="3" data-step="0">
      <div className="lp-story-stick lp-wrap">
        <div className="lp-story-copy">
          <Split text="Từ một câu hỏi đến hiểu bài" />
          <ol className="lp-story-list">
            {STORY.map(([t, d], i) => (
              <li key={t} data-i={i}>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="lp-story-vis" aria-hidden="true">
          <div className="lv-bar"><i /><i /><i /><span>Trợ lý AI</span></div>
          <p className="lv-eq">
            <Co n="4" />Fe + <Co n="3" />O₂ → <Co n="2" />Fe₂O₃
          </p>

          <div className="lv-pn lv-0">
            <div className="lv-msg me">Cân bằng giúp mình: Fe + O₂ → Fe₂O₃</div>
            <div className="lv-typing"><i /><i /><i /></div>
          </div>

          <div className="lv-pn lv-1">
            <ol>
              <li>Vế phải có 2 Fe và 3 O. Nhân đôi để O thành số chẵn: 4 Fe, 6 O.</li>
              <li>6 O ở vế trái cần 3 phân tử O₂.</li>
              <li>Kiểm tra số nguyên tử hai vế.</li>
            </ol>
            <table>
              <thead><tr><th>Nguyên tố</th><th>Vế trái</th><th>Vế phải</th></tr></thead>
              <tbody>
                <tr><td>Fe</td><td>4</td><td>4</td></tr>
                <tr><td>O</td><td>6</td><td>6</td></tr>
              </tbody>
            </table>
          </div>

          <div className="lv-pn lv-2">
            <p className="lv-q">Hệ số của O₂ khi cân bằng Fe + O₂ → Fe₂O₃ là bao nhiêu?</p>
            <div className="lv-opts">
              <span>2</span><span className="ok">3</span><span className="no">4</span>
            </div>
            <small>Chọn sai sẽ được lưu vào Sổ câu sai để ôn lại.</small>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CÔNG CỤ
   ============================================================ */
function Tools() {
  return (
    <section className="lp-h" id="lp-feat" data-scrub="pin" data-hscroll>
      <div className="lp-h-stick">
        <div className="lp-h-track" data-track>
          <div className="lp-h-intro">
            <Split text="Mọi công cụ học Hóa, một tài khoản" />
            <p>Cuộn xuống để lướt qua từng công cụ. Tất cả đều chạy thật sau khi bạn đăng nhập.</p>
          </div>

          <article className="lp-hp hp-ai">
            <div className="hp-vis" aria-hidden="true">
              <u className="me">Giải bài tập giúp mình</u>
              <u className="ai">Bước 1: Viết phương trình…</u>
              <u className="ai">4Fe + 3O₂ → 2Fe₂O₃ ✓</u>
            </div>
            <h3>Trợ lý AI</h3>
            <p>Giải đề, giảng lý thuyết, đọc đề từ ảnh chụp. Chọn chế độ Suy luận để xem từng bước hoặc Tra cứu để tìm nhanh.</p>
            <button type="button" className="lp-link" onClick={() => openAuth('login')}>Hỏi thử <IcoArrow size={15} /></button>
          </article>

          <article className="lp-hp hp-pt">
            <div className="hp-vis" aria-hidden="true">
              {MINI_TABLE.map((e, i) => <u key={e} style={{ '--k': i }}>{e}</u>)}
            </div>
            <h3>Bảng tuần hoàn</h3>
            <p>118 nguyên tố, tìm kiếm tức thì, lọc theo nhóm và xem chi tiết từng nguyên tố.</p>
            <button type="button" className="lp-link" onClick={() => openAuth('login')}>Mở bảng <IcoArrow size={15} /></button>
          </article>

          <article className="lp-hp hp-eq">
            <div className="hp-vis" aria-hidden="true">
              <span className="from">Fe + O₂ → Fe₂O₃</span>
              <i />
              <span className="to">4Fe + 3O₂ → 2Fe₂O₃</span>
            </div>
            <h3>Cân bằng PTHH</h3>
            <p>Nhập phương trình, nhận kết quả đã cân bằng. Phù hợp để tự kiểm tra bài làm.</p>
            <button type="button" className="lp-link" onClick={() => openAuth('login')}>Cân bằng thử <IcoArrow size={15} /></button>
          </article>

          <article className="lp-hp hp-qz">
            <div className="hp-vis" aria-hidden="true">
              <u>Quiz theo chuyên đề</u><u>Sổ câu sai</u><u>Thống kê tiến độ</u>
            </div>
            <h3>Quiz và sổ câu sai</h3>
            <p>Làm quiz, câu sai tự vào sổ tay. Xem thống kê để biết chuyên đề nào cần ôn thêm.</p>
            <button type="button" className="lp-link" onClick={() => openAuth('login')}>Bắt đầu ôn <IcoArrow size={15} /></button>
          </article>

          <article className="lp-hp hp-gm">
            <div className="hp-vis" aria-hidden="true">
              {GAMES.map((g) => <u key={g}>{g}</u>)}
            </div>
            <h3>Sáu trò chơi</h3>
            <p>Ôn Hóa mà không thấy chán: từ phòng lab ảo đến đấu nguyên tố và Sudoku hóa học.</p>
            <button type="button" className="lp-link" onClick={() => openAuth('login')}>Chơi thử <IcoArrow size={15} /></button>
          </article>

          <article className="lp-hp hp-st">
            <div className="hp-vis" aria-hidden="true">
              <u>Clock Hub</u><u>Kỳ thi đếm ngược</u><u>Tính điểm</u><u>Ghi chú</u>
            </div>
            <h3>Quản lý việc học</h3>
            <p>Pomodoro, đếm ngược ngày thi, tính điểm trung bình và ghi chú, tất cả nằm cạnh bài học.</p>
            <button type="button" className="lp-link" onClick={() => openAuth('register')}>Tạo tài khoản <IcoArrow size={15} /></button>
          </article>
        </div>
        <div className="lp-h-rail" aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}

/* ============================================================
   LỘ TRÌNH
   ============================================================ */
function Grades() {
  const [k, setK] = useState(1);
  const t = TRACK[k];
  return (
    <section className="lp-wrap lp-sec lp-grades" id="lp-grades">
      <Split text="Học đúng chương trình của bạn" />
      <div className="lp-gbox">
        <div className="lp-gtabs" role="tablist" aria-label="Chọn lớp">
          {TRACK.map((x, i) => (
            <button key={x.g} type="button" role="tab" aria-selected={i === k} className={i === k ? 'on' : ''} onClick={() => setK(i)}>
              {x.g}
            </button>
          ))}
        </div>
        <div className="lp-gbody" key={k} role="tabpanel">
          <h3>{t.lvl}</h3>
          <p>{t.body}</p>
          <div className="lp-gtools">
            {t.tools.map((x) => <span key={x}>{x}</span>)}
          </div>
          <blockquote>{t.tip}</blockquote>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */
function FaqItem({ item, index }) {
  const [ref, on] = useInView(0.1);
  const [open, setOpen] = useState(false);

  return (
    <article
      ref={ref}
      className={'lp-faq-item' + (on ? ' in' : '') + (open ? ' open' : '')}
      style={{ '--i': index }}
    >
      <button
        type="button"
        className="lp-faq-q"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="lp-faq-icon" aria-hidden="true">{item.icon}</span>
        <span className="lp-faq-text">
          <span className="lp-faq-cat">{item.cat}</span>
          <span className="lp-faq-title">{item.q}</span>
        </span>
        <span className="lp-faq-toggle" aria-hidden="true">
          <IcoPlus size={16} />
        </span>
      </button>
      <div className="lp-faq-a" role="region">
        <div className="lp-faq-a-inner">
          <p>{item.a}</p>
        </div>
      </div>
    </article>
  );
}

function Faq() {
  const [headRef, headOn] = useInView(0.2);
  const [cats, setCats] = useState('Tất cả');
  const allCats = ['Tất cả', ...Array.from(new Set(FAQS.map((f) => f.cat)))];
  const list = cats === 'Tất cả' ? FAQS : FAQS.filter((f) => f.cat === cats);

  return (
    <section className="lp-wrap lp-sec lp-faq" id="lp-faq">
      <div ref={headRef} className={'lp-faq-head' + (headOn ? ' in' : '')}>
        <span className="lp-faq-tag">Hỏi đáp</span>
        <h2 className="lp-faq-h2">
          Câu hỏi <span className="lp-faq-em">thường gặp</span>
        </h2>
        <p className="lp-faq-lead">
          Những thắc mắc phổ biến nhất khi bắt đầu học Hóa cùng A7 K60 DTA.
          Không thấy câu trả lời? Gửi phản hồi cho tụi mình.
        </p>
      </div>

      <div className="lp-faq-cats" role="tablist" aria-label="Lọc câu hỏi">
        {allCats.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cats === c}
            className={'lp-faq-cat-btn' + (cats === c ? ' on' : '')}
            onClick={() => setCats(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="lp-faq-grid">
        {list.map((item, i) => (
          <FaqItem key={item.q} item={item} index={i} />
        ))}
      </div>

      <div className="lp-faq-cta">
        <p>Vẫn còn thắc mắc?</p>
        <button
          type="button"
          className="lp-btn pri"
          onClick={() => openAuth('login')}
        >
          Hỏi AI ngay <IcoArrow size={16} />
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export default function Landing({ theme, onToggleTheme, authOpen, authMode }) {
  const [prompt, setPrompt] = useState('');
  const [focus, setFocus] = useState(false);
  const [grade] = useState('Lớp 11');
  const [aiMode, setAiMode] = useState('think');
  const [fbOpen, setFbOpen] = useState(false);
  const [fbSent, setFbSent] = useState(false);
  const [fbType, setFbType] = useState('idea');

  const [navScrolled, setNavScrolled] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);

  const dlg = useRef(null);
  const fbDlg = useRef(null);
  const root = useRef(null);
  const heroRef = useRef(null);
  const ph = useTypewriter(PLACEHOLDERS, !prompt && !focus);

  useScrollEngine(root);
  useHeroPointer(heroRef);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 80) {
        setNavScrolled(true);
        setNavExpanded(false);
      } else {
        setNavScrolled(false);
        setNavExpanded(false);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const expandNav = () => setNavExpanded(true);
  const collapseNav = () => setNavExpanded(false);
  const isNavCollapsed = navScrolled && !navExpanded;

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (authOpen && !d.open) d.showModal();
    if (!authOpen && d.open) d.close();
  }, [authOpen]);

  useEffect(() => {
    const d = fbDlg.current;
    if (!d) return;
    if (fbOpen && !d.open) d.showModal();
    if (!fbOpen && d.open) d.close();
  }, [fbOpen]);

  const ask = useCallback((text) => {
    const q = (typeof text === 'string' ? text : prompt).trim();
    if (q) {
      try {
        localStorage.setItem('cs-ai-pending', JSON.stringify({ text: q, grade, mode: aiMode, t: Date.now() }));
      } catch { /* localStorage bị chặn */ }
    }
    openAuth('login');
  }, [prompt, grade, aiMode]);

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (navExpanded) collapseNav();
  };

  const sendFeedback = (e) => {
    e.preventDefault();
    setFbSent(true);
    setTimeout(() => { setFbOpen(false); setTimeout(() => setFbSent(false), 300); }, 1400);
  };

  return (
    <div className="lp" ref={root}>
      <div className="lp-progress" aria-hidden="true"><i /></div>
      <div className="lp-bg" aria-hidden="true">
        <i /><i />
        {BUBBLES.map(([x, sz, t, d]) => <b key={x} style={{ '--x': x + '%', '--s': sz + 'px', '--t': t + 's', '--d': '-' + d + 's' }} />)}
      </div>

      {/* ============ NAV — CHỈ CÒN LOGO.PNG ============ */}
      <header className={'lp-nav' + (isNavCollapsed ? ' collapsed' : '') + (navExpanded ? ' expanded' : '')}>
        <a
          className="lp-logo"
          href="#home"
          aria-label="Trang chủ"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <Logo size={38} />
        </a>

        <nav className="lp-links" aria-label="Điều hướng">
          {NAV.map(([t, id]) => <button key={id} type="button" onClick={() => go(id)}>{t}</button>)}
        </nav>

        <div className="lp-acts">
          <button
            type="button"
            className="lp-ico"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          >
            {theme === 'dark' ? <IcoSun /> : <IcoMoon />}
          </button>

          <a className="lp-login" href="#login">Đăng nhập</a>

          <MagBtn as="a" className="lp-btn pri" href="#register">Đăng ký</MagBtn>

          <button
            type="button"
            className="lp-expand"
            aria-label={navExpanded ? 'Đóng menu' : 'Mở rộng menu'}
            onClick={navExpanded ? collapseNav : expandNav}
          >
            {navExpanded ? <IcoClose size={16} /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {/* ============ HERO ============ */}
        <section className="lp-hero" ref={heroRef} data-scrub="pin" data-steps="3" data-step="0">
          <div className="lp-hero-stick">
            <div className="lp-side lp-side-l">
              <small>AI · TRỢ LÝ HÓA HỌC</small>
              <TypingHeadline />
              <span className="lp-count" aria-hidden="true"><b><i>01</i><i>02</i><i>03</i></b> / 03</span>
            </div>

            <div className="lp-side lp-side-r" aria-hidden="true">
              <small>AI · HÓA HỌC</small>
              <small className="sc">SCROLL</small>
              <span className="lp-rail"><i /></span>
              <ol className="lp-steps"><li>01</li><li>02</li><li>03</li></ol>
            </div>

            <div className="lp-stage">
              <div className="lp-bigword" aria-hidden="true">
                <span className="o w1">HÓA</span>
                <span className="f w2">HỌC</span>
                <span className="o w3">AI</span>
              </div>
              <div className="lp-mascot" aria-hidden="true">
                <span className="lp-mascot-halo" />
                <AIMark size={240} look mode={focus ? 'think' : 'idle'} />
                {TILES.map(([s, n, top, side, k]) => (
                  <span key={s} className="lp-tile" style={{ top, ...side, '--k': k }}>
                    <small>{n}</small>{s}
                  </span>
                ))}
              </div>
              <p className="lp-brand-tag" aria-hidden="true">A7 K60 DTA</p>
            </div>

            <div className="lp-hero-ask">
              <div className={'lp-ask' + (focus ? ' on' : '')}>
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
                  placeholder={ph || ' '}
                  aria-label="Câu hỏi cho trợ lý AI"
                />
                <div className="lp-ask-bar">
                  <div className="lp-modes">
                    <button type="button" className={aiMode === 'think' ? 'on' : ''} onClick={() => setAiMode('think')} aria-pressed={aiMode === 'think'}>
                      <IcoThink size={16} /> Suy luận
                    </button>
                    <button type="button" className={aiMode === 'search' ? 'on' : ''} onClick={() => setAiMode('search')} aria-pressed={aiMode === 'search'}>
                      <IcoSearch size={16} /> Tra cứu
                    </button>
                  </div>
                  <button type="button" className="lp-send" onClick={() => ask()} disabled={!prompt.trim()} aria-label="Gửi câu hỏi">
                    <IcoSend size={20} />
                  </button>
                </div>
              </div>

              <div className="lp-chips">
                {CHIPS.map(([t, q]) => <button key={t} type="button" onClick={() => ask(q)}>{t}</button>)}
              </div>
              <p className="lp-free">Miễn phí cho học sinh. Bạn chỉ cần đăng nhập khi gửi câu hỏi.</p>
            </div>
          </div>
        </section>

        {/* ============ MARQUEE ============ */}
        <div className="lp-marquee" aria-hidden="true">
          <div className="lp-marquee-track">
            {[0, 1].map((k) => (
              <span key={k}>
                <i>H₂O</i> Nước <em />
                <i>Fe₂O₃</i> Sắt(III) oxit <em />
                <i>NaCl</i> Muối ăn <em />
                <i>H₂SO₄</i> Axit sunfuric <em />
                <i>C₆H₁₂O₆</i> Glucozơ <em />
                <i>CH₃COOH</i> Axit axetic <em />
                <i>CaCO₃</i> Đá vôi <em />
                <i>NH₃</i> Amoniac <em />
              </span>
            ))}
          </div>
        </div>

        <Manifesto />
        <VideoSection />
        <Story />
        <Tools />

        <section className="lp-wrap lp-stats" aria-label="Số liệu">
          {STATS.map(([n, s, l]) => <div key={l}><Count to={n} suffix={s} /><span>{l}</span></div>)}
        </section>

        <Grades />
        <Faq />

        {/* ============ CTA ============ */}
        <section className="lp-wrap lp-sec" id="lp-cta">
          <div className="lp-cta">
            <Split text="Bắt đầu từ câu hỏi đầu tiên của bạn" />
            <p>Tạo tài khoản miễn phí trong vài giây. Không cần thẻ, không cần cài đặt.</p>
            <div className="lp-cta-btns">
              <MagBtn as="a" className="lp-btn pri lg" href="#register">Đăng ký miễn phí <IcoArrow /></MagBtn>
              <MagBtn as="a" className="lp-btn lg" href="#login">Tôi đã có tài khoản</MagBtn>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="lp-foot lp-wrap">
        <div className="lp-foot-top">
          <div className="lp-foot-brand">
            <b>A7 K60 DTA</b>
            <small>Trợ lý AI Hóa học cho học sinh 10–12. Học chủ động, hiểu tận gốc.</small>
          </div>
          <div className="lp-foot-links">
            <div>
              <b>Sản phẩm</b>
              <button type="button" onClick={() => go('lp-story')}>Cách học</button>
              <button type="button" onClick={() => go('lp-feat')}>Công cụ</button>
              <button type="button" onClick={() => go('lp-grades')}>Lộ trình</button>
            </div>
            <div>
              <b>Hỗ trợ</b>
              <button type="button" onClick={() => setFbOpen(true)}>Gửi phản hồi</button>
              <a href="#login">Đăng nhập</a>
              <a href="#register">Đăng ký</a>
            </div>
          </div>
        </div>
        <div className="lp-foot-bot">
          <small>© 2026 · bycode Duy TK</small>
          <small>Made with ⚗ in Vietnam</small>
        </div>
      </footer>

      <button type="button" className="lp-fab" onClick={() => setFbOpen(true)} aria-label="Gửi phản hồi">
        <IcoChat />
        <b>Phản hồi</b>
      </button>

      {/* ============ FEEDBACK DIALOG ============ */}
      <dialog
        ref={fbDlg}
        className="lp-dialog lp-dialog-sm"
        onClose={() => setFbOpen(false)}
        onClick={(e) => e.target === fbDlg.current && fbDlg.current.close()}
      >
        <button type="button" className="lp-x" aria-label="Đóng" onClick={() => fbDlg.current.close()}><IcoClose /></button>
        {!fbSent ? (
          <form className="lp-fb" onSubmit={sendFeedback}>
            <h3>Bạn thấy trang này thế nào?</h3>
            <p>Mọi góp ý đều giúp tụi mình làm tốt hơn.</p>
            <div className="lp-fb-types">
              {FEEDBACK.map(([ic, t]) => (
                <label key={t}>
                  <input type="radio" name="fb-type" checked={fbType === ic} onChange={() => setFbType(ic)} />
                  <span>
                    <i>{ic === 'bug' ? <IcoBug size={16} /> : ic === 'idea' ? <IcoBulb size={16} /> : <IcoStar size={16} />}</i>
                    {t}
                  </span>
                </label>
              ))}
            </div>
            <textarea name="fb-msg" rows={4} placeholder="Viết gì đó cho tụi mình…" required />
            <input type="email" name="fb-email" placeholder="Email (không bắt buộc)" />
            <button type="submit" className="lp-btn pri lg">Gửi phản hồi</button>
          </form>
        ) : (
          <div className="lp-fb-done">
            <div className="lp-fb-check" aria-hidden="true"><IcoCheck size={28} /></div>
            <h3>Cảm ơn bạn!</h3>
            <p>Phản hồi đã được ghi nhận.</p>
          </div>
        )}
      </dialog>

      {/* ============ AUTH DIALOG ============ */}
      <dialog
        ref={dlg}
        className="lp-dialog lp-dialog-auth"
        onClose={() => { if (/^#(login|register)/.test(location.hash) || authOpen) location.hash = 'home'; }}
        onClick={(e) => e.target === dlg.current && dlg.current.close()}
      >
        <button type="button" className="lp-x" aria-label="Đóng" onClick={() => dlg.current.close()}><IcoClose /></button>
        {authOpen && (
          <Suspense fallback={<p className="lp-load">Đang tải…</p>}>
            <LoginPage initialMode={authMode} />
          </Suspense>
        )}
      </dialog>
    </div>
  );
}