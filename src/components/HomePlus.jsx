import { Fragment, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  IconRobot, IconAtom, IconScale, IconTimer, IconCalendar, IconCalc, IconQuiz,
  IconFlask, IconGamepad, IconArrowUpRight, IconTarget, IconBook, IconChart,
  IconNote, IconMicroscope,
} from './Icons.jsx';

/* ============================================================
   HomePlus.jsx — các phần mới của trang chủ
   Style: ./home-plus.css (class hp-*)

   Dữ liệu cá nhân (kỳ thi, sổ tay, pomodoro, điểm game) được đọc từ
   localStorage. Mặc định tự dò key theo tên; nếu bạn biết key thật,
   điền vào KEYS bên dưới để chính xác 100%.
   ============================================================ */
export const KEYS = { exams: null, wrong: null, pomodoro: null, scores: null };

/* ---------- tiện ích ---------- */
const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayNo = () => {
  const d = new Date();
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
};
const jget = (k, f) => {
  try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch { return f; }
};
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bị chặn */ } };
const scanKeys = (re) => { try { return Object.keys(localStorage).filter((k) => re.test(k)); } catch { return []; } };
const findData = (name, re) => {
  const keys = KEYS[name] ? [KEYS[name]] : scanKeys(re);
  for (const k of keys) { const v = jget(k, null); if (v != null) return v; }
  return null;
};
const flatten = (v) => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    const vals = Object.values(v);
    return vals.find(Array.isArray) || vals;
  }
  return [];
};
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (s) => String(s).split('').map((c) => SUP[c] ?? c).join('');

export function askAI(text, grade) {
  try { localStorage.setItem('cs-ai-pending', JSON.stringify({ text, grade, t: Date.now() })); } catch { /* */ }
  location.hash = 'ai';
}

/* Ghi nhớ trang gần nhất để có nút "Tiếp tục" */
if (typeof window !== 'undefined' && !window.__hpLast) {
  window.__hpLast = true;
  const save = () => {
    const h = location.hash.slice(1);
    if (h && h !== 'home') jset('cs-home-last', h);
  };
  save();
  window.addEventListener('hashchange', save);
}
const PAGE_LABEL = {
  ai: 'Trợ lý AI', table: 'Bảng tuần hoàn', tools: 'Công cụ', formulas: 'Công thức nhanh',
  analyze: 'Phân tích', balance: 'Cân bằng PTHH', pomodoro: 'Pomodoro', exam: 'Kỳ thi',
  notes: 'Ghi chú', notebook: 'Sổ tay', grade: 'Tính điểm', quiz: 'Ôn tập', stats: 'Thống kê',
  games: 'Trò chơi', profile: 'Trang cá nhân',
};

/* ---------- hooks ---------- */
function useSeen(threshold = 0.15) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window) || reduced()) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, on];
}

function useTyped(text, speed = 24) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced()) { setN(text.length); return undefined; }
    setN(0);
    let i = 0;
    const t = setInterval(() => { i += 1; setN(i); if (i >= text.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return text.slice(0, n);
}

function useCycle(len, ms) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return undefined;
    const t = setInterval(() => setI((c) => (c + 1) % len), ms);
    return () => clearInterval(t);
  }, [len, ms]);
  return i;
}

/* Ánh sáng đi theo con trỏ trên mọi phần tử .hp-spot */
export function useSpotlight() {
  useEffect(() => {
    if (reduced()) return undefined;
    const on = (e) => {
      const el = e.target.closest?.('.hp-spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', e.clientX - r.left + 'px');
      el.style.setProperty('--my', e.clientY - r.top + 'px');
    };
    document.addEventListener('pointermove', on, { passive: true });
    return () => document.removeEventListener('pointermove', on);
  }, []);
}

function Rv({ as: Tag = 'div', d = 0, className = '', style, children, ...rest }) {
  const [ref, on] = useSeen(0.12);
  return (
    <Tag
      ref={ref}
      className={'hp-rv' + (on ? ' in' : '') + (className ? ' ' + className : '')}
      style={{ '--d': d + 'ms', ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Title({ children, lead }) {
  return (
    <Rv as="header" className="hm-head">
      <h2 className="hm-h2">{children}</h2>
      {lead && <p className="hm-sublead">{lead}</p>}
    </Rv>
  );
}

/* ============================================================
   1. HERO — nền mạng phân tử + cực quang
   ============================================================ */
export function HeroNet() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || reduced()) return undefined;
    const ctx = cv.getContext('2d');
    const host = cv.parentElement;
    const mouse = { x: -999, y: -999 };
    let w = 0; let h = 0; let raf = 0; let vis = true; let tick = 0; let nodes = [];
    const readColor = () => getComputedStyle(document.documentElement).getPropertyValue('--acc-soft').trim() || '#7db3ff';
    let col = readColor();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = host.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const small = window.matchMedia('(max-width: 720px)').matches;
      const n = small ? 22 : Math.round(Math.min(64, (w * h) / 20000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: 1.4 + Math.random() * 2.2, hl: Math.random() < 0.12,
      }));
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!vis || document.hidden) return;
      tick += 1;
      if (tick % 120 === 0) col = readColor();
      ctx.clearRect(0, 0, w, h);
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = mouse.x - p.x; const dy = mouse.y - p.y;
        if (dx * dx + dy * dy < 24000) { p.x += dx * 0.005; p.y += dy * 0.005; }
      }
      ctx.lineWidth = 1; ctx.strokeStyle = col; ctx.fillStyle = col;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x; const dy = a.y - b.y; const d = dx * dx + dy * dy;
          if (d < 17000) {
            ctx.globalAlpha = (1 - d / 17000) * 0.3;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.globalAlpha = a.hl ? 0.85 : 0.45;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.hl ? a.r * 1.7 : a.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro && ro.observe(host);
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; });
    io.observe(host);
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro && ro.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div className="hp-aurora" aria-hidden="true"><i /><i /><i /></div>
      <canvas ref={ref} className="hp-net" aria-hidden="true" />
    </>
  );
}

/* ============================================================
   2a. MARQUEE CHỮ LỚN — chữ đặc xen chữ rỗng, 2 hàng ngược chiều
   ============================================================ */
export function WordMarquee({ words }) {
  const row = (list, rev) => (
    <div className={'hp-words-row' + (rev ? ' rev' : '')}>
      <div>
        {[...list, ...list].map((w, i) => (
          <Fragment key={i}>
            <span className={i % 2 ? 'o' : ''}>{w}</span>
            <i aria-hidden="true">✦</i>
          </Fragment>
        ))}
      </div>
    </div>
  );
  return (
    <div className="hp-words" aria-hidden="true">
      {row(words, false)}
      {row([...words.slice(4), ...words.slice(0, 4)], true)}
    </div>
  );
}

/* ============================================================
   2. MARQUEE — 2 hàng chip nguyên tố chạy ngược chiều
   ============================================================ */
const EL = [
  ['H', 1, 'Hiđro', '--nonmetal', 1.008, 'Nguyên tố nhẹ nhất và nhiều nhất vũ trụ.'],
  ['He', 2, 'Heli', '--noble', 4.0026, 'Được phát hiện trên Mặt Trời trước khi tìm thấy trên Trái Đất.'],
  ['Li', 3, 'Liti', '--alkali', 6.94, 'Kim loại nhẹ nhất, là linh hồn của pin sạc điện thoại.'],
  ['C', 6, 'Cacbon', '--nonmetal', 12.011, 'Kim cương và than chì đều chỉ là cacbon, khác nhau ở cách xếp nguyên tử.'],
  ['N', 7, 'Nitơ', '--nonmetal', 14.007, 'Chiếm khoảng 78% thể tích khí quyển Trái Đất.'],
  ['O', 8, 'Oxi', '--nonmetal', 15.999, 'Chiếm khoảng 21% khí quyển và duy trì sự cháy lẫn sự sống.'],
  ['Ne', 10, 'Neon', '--noble', 20.18, 'Phát ánh sáng đỏ cam khi có dòng điện đi qua, làm nên đèn neon.'],
  ['Na', 11, 'Natri', '--alkali', 22.99, 'Phản ứng mạnh với nước nên phải ngâm trong dầu hỏa.'],
  ['Mg', 12, 'Magie', '--alkaline', 24.305, 'Cháy với ánh sáng trắng chói, từng dùng làm đèn flash chụp ảnh.'],
  ['Al', 13, 'Nhôm', '--post', 26.982, 'Kim loại phổ biến nhất trong vỏ Trái Đất.'],
  ['Si', 14, 'Silic', '--metalloid', 28.085, 'Nguyên liệu chính của chip bán dẫn trong mọi thiết bị điện tử.'],
  ['S', 16, 'Lưu huỳnh', '--nonmetal', 32.06, 'Cháy với ngọn lửa màu xanh lam đặc trưng.'],
  ['Cl', 17, 'Clo', '--halogen', 35.45, 'Dùng để khử trùng nước sinh hoạt và nước hồ bơi.'],
  ['K', 19, 'Kali', '--alkali', 39.098, 'Cần cho hoạt động của thần kinh và cơ, có nhiều trong chuối.'],
  ['Ca', 20, 'Canxi', '--alkaline', 40.078, 'Thành phần chính của xương và răng.'],
  ['Fe', 26, 'Sắt', '--transition', 55.845, 'Có trong hemoglobin giúp máu vận chuyển oxi.'],
  ['Cu', 29, 'Đồng', '--transition', 63.546, 'Dẫn điện rất tốt nên có mặt trong hầu hết dây điện.'],
  ['Zn', 30, 'Kẽm', '--transition', 65.38, 'Dùng mạ thép để chống gỉ.'],
  ['Ag', 47, 'Bạc', '--transition', 107.87, 'Dẫn điện và dẫn nhiệt tốt nhất trong các kim loại.'],
  ['Au', 79, 'Vàng', '--transition', 196.97, 'Gần như không bị oxi hóa trong không khí nên giữ được độ sáng bóng.'],
  ['Hg', 80, 'Thủy ngân', '--transition', 200.59, 'Kim loại duy nhất ở thể lỏng trong điều kiện thường.'],
];

export function ElementMarquee() {
  const row = (list, rev) => (
    <div className={'hp-marq-row' + (rev ? ' rev' : '')}>
      <div>
        {[...list, ...list].map(([s, n, name, tint], i) => (
          <span key={i} className="hp-mchip" style={{ '--t': `var(${tint})` }}>
            <small>{n}</small><b>{s}</b><em>{name}</em>
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <div className="hp-marq" aria-hidden="true">
      {row(EL.slice(0, 11), false)}
      {row(EL.slice(10), true)}
    </div>
  );
}

/* ============================================================
   3. HÔM NAY CỦA BẠN — dữ liệu cá nhân + thử thách + nguyên tố
   ============================================================ */
const STREAK_KEY = 'cs-home-streak-v1';
const DAILY_KEY = 'cs-home-daily-v1';

function readStreak() {
  const s = jget(STREAK_KEY, { days: [] });
  const days = new Set(s.days || []);
  let count = 0;
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { count += 1; d.setDate(d.getDate() - 1); }
  let week = 0;
  const dow = (new Date().getDay() + 6) % 7;
  for (let i = 0; i <= dow; i += 1) {
    const x = new Date(); x.setDate(x.getDate() - i);
    if (days.has(dayKey(x))) week += 1;
  }
  return { count, week, done: days.has(dayKey()), correct: s.correct || 0 };
}
function markDone(ok) {
  const s = jget(STREAK_KEY, { days: [], correct: 0 });
  const k = dayKey();
  if (!s.days.includes(k)) s.days.push(k);
  s.days = s.days.slice(-60);
  if (ok) s.correct = (s.correct || 0) + 1;
  jset(STREAK_KEY, s);
}

function nextExam() {
  const items = flatten(findData('exams', /exam/i));
  const now = Date.now();
  let best = null;
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const raw = it.date ?? it.day ?? it.when ?? it.at ?? it.deadline ?? it.examDate ?? it.time;
    const t = raw ? new Date(raw).getTime() : NaN;
    if (!Number.isFinite(t) || t < now - 864e5) continue;
    if (!best || t < best.t) best = { t, name: it.name ?? it.title ?? it.subject ?? 'Kỳ thi' };
  }
  return best && { ...best, days: Math.max(0, Math.ceil((best.t - now) / 864e5)) };
}
function wrongCount() {
  const d = findData('wrong', /wrong|notebook/i);
  return d == null ? null : flatten(d).length;
}
function pomoToday() {
  const d = findData('pomodoro', /pomo/i);
  if (d == null) return null;
  const today = dayKey();
  if (typeof d === 'number') return { v: d, unit: 'phiên' };
  const isToday = (x) => {
    const raw = x && (x.date ?? x.day ?? x.ts ?? x.t ?? x.at ?? x.end ?? x.start);
    if (!raw) return false;
    const dt = new Date(raw);
    return Number.isFinite(dt.getTime()) && dayKey(dt) === today;
  };
  if (Array.isArray(d)) return { v: d.filter(isToday).length, unit: 'phiên' };
  if (typeof d === 'object') {
    const v = d[today];
    if (typeof v === 'number') return { v, unit: 'phiên' };
    if (v && typeof v === 'object') return { v: v.sessions ?? v.count ?? v.minutes ?? 0, unit: v.minutes ? 'phút' : 'phiên' };
  }
  return { v: 0, unit: 'phiên' };
}

const DAILY = [
  { q: 'Ký hiệu hóa học của vàng là gì?', o: ['Ag', 'Au', 'Fe', 'Gd'], a: 1, why: 'Au viết tắt từ tiếng Latinh "aurum". Ag là bạc, Fe là sắt.' },
  { q: 'Dung dịch có pH = 7 (ở 25 °C) có môi trường nào?', o: ['Axit', 'Bazơ', 'Trung tính', 'Lưỡng tính'], a: 2, why: 'pH = 7 nghĩa là [H⁺] = [OH⁻] = 10⁻⁷ M, nên là môi trường trung tính.' },
  { q: 'Khí nào chiếm tỉ lệ lớn nhất trong khí quyển Trái Đất?', o: ['Oxi', 'Cacbon đioxit', 'Nitơ', 'Argon'], a: 2, why: 'Nitơ chiếm khoảng 78%, oxi khoảng 21%.' },
  { q: '11,2 lít khí ở đktc có số mol là bao nhiêu?', o: ['0,25 mol', '0,5 mol', '1 mol', '2 mol'], a: 1, why: 'Ở đktc 1 mol khí = 22,4 lít, nên 11,2 / 22,4 = 0,5 mol.' },
  { q: 'Kim loại nào ở thể lỏng trong điều kiện thường?', o: ['Natri', 'Chì', 'Thủy ngân', 'Thiếc'], a: 2, why: 'Thủy ngân (Hg) nóng chảy ở khoảng −39 °C.' },
  { q: 'Nguyên tố nào có độ âm điện lớn nhất?', o: ['Oxi', 'Flo', 'Clo', 'Nitơ'], a: 1, why: 'Flo (F) có độ âm điện cao nhất bảng tuần hoàn, 3,98 theo thang Pauling.' },
  { q: 'Hạt nào trong nguyên tử mang điện tích dương?', o: ['Electron', 'Neutron', 'Proton', 'Positron'], a: 2, why: 'Proton mang điện dương nằm trong hạt nhân, electron mang điện âm.' },
  { q: 'Nhóm VIIA trong bảng tuần hoàn được gọi là gì?', o: ['Kim loại kiềm', 'Halogen', 'Khí hiếm', 'Kiềm thổ'], a: 1, why: 'Halogen gồm F, Cl, Br, I, At với 7 electron lớp ngoài cùng.' },
  { q: 'Hệ số của H₂ khi cân bằng H₂ + O₂ → H₂O là gì?', o: ['1', '2', '3', '4'], a: 1, why: '2H₂ + O₂ → 2H₂O: mỗi bên có 4 nguyên tử H và 2 nguyên tử O.' },
  { q: 'Chất xúc tác có vai trò gì trong phản ứng?', o: ['Tăng tốc độ phản ứng, không bị tiêu hao', 'Làm tăng khối lượng sản phẩm', 'Làm giảm nhiệt độ sôi', 'Biến đổi thành sản phẩm'], a: 0, why: 'Chất xúc tác làm giảm năng lượng hoạt hóa và được tái tạo sau phản ứng.' },
  { q: 'Số Avogadro xấp xỉ bằng bao nhiêu?', o: ['6,022 × 10²³', '3,14 × 10²³', '9,81 × 10²³', '1,602 × 10¹⁹'], a: 0, why: '1 mol chất chứa khoảng 6,022 × 10²³ hạt.' },
  { q: 'Axit chính trong dịch vị dạ dày là gì?', o: ['H₂SO₄', 'HNO₃', 'CH₃COOH', 'HCl'], a: 3, why: 'HCl giúp tiêu hóa và diệt vi khuẩn, pH dịch vị khoảng 1,5 đến 2.' },
];

function Tile({ label, value, sub, href, children, wide }) {
  const inner = (
    <>
      <span className="hp-tile-l">{label}</span>
      <b className="hp-tile-v">{value}</b>
      <span className="hp-tile-s">{sub}</span>
      {children}
    </>
  );
  return href
    ? <a href={href} className={'hp-tile hp-spot' + (wide ? ' wide' : '')}>{inner}</a>
    : <div className={'hp-tile hp-spot' + (wide ? ' wide' : '')}>{inner}</div>;
}

function Ring({ done, total = 7, size = 84 }) {
  const r = size / 2 - 7; const c = 2 * Math.PI * r;
  return (
    <svg className="hp-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="bg" />
      <circle
        cx={size / 2} cy={size / 2} r={r} className="fg"
        strokeDasharray={c} strokeDashoffset={c * (1 - done / total)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function DailyChallenge({ grade, onDone }) {
  const item = DAILY[dayNo() % DAILY.length];
  const saved = jget(DAILY_KEY, null);
  const [pick, setPick] = useState(saved && saved.day === dayNo() ? saved.pick : null);
  const answered = pick != null;

  const choose = (i) => {
    if (answered) return;
    setPick(i);
    jset(DAILY_KEY, { day: dayNo(), pick: i });
    markDone(i === item.a);
    onDone();
  };

  return (
    <div className="hp-daily">
      <div className="hp-card-top">
        <span className="hp-pill">Thử thách hôm nay</span>
        <span className="hp-card-hint">{answered ? 'Quay lại vào ngày mai nhé' : 'Trả lời để giữ chuỗi ngày học'}</span>
      </div>
      <h3 className="hp-q">{item.q}</h3>
      <div className="hp-opts" role="group" aria-label="Các đáp án">
        {item.o.map((t, i) => {
          let cls = 'hp-opt';
          if (answered && i === item.a) cls += ' ok';
          else if (answered && i === pick) cls += ' bad';
          else if (answered) cls += ' dim';
          return (
            <button key={t} type="button" className={cls} onClick={() => choose(i)} disabled={answered}>
              <i>{String.fromCharCode(65 + i)}</i>{t}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="hp-why" role="status">
          <b>{pick === item.a ? 'Chính xác!' : 'Chưa đúng, không sao.'}</b> {item.why}
          <button type="button" onClick={() => askAI(`Giải thích kỹ hơn giúp mình: ${item.q} (${item.why})`, grade)}>
            Hỏi AI giải thích thêm <IconArrowUpRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function ElementOfDay() {
  const e = EL[(dayNo() * 7) % EL.length];
  const [s, n, name, tint, mass, fact] = e;
  return (
    <div className="hp-eod" style={{ '--t': `var(${tint})` }}>
      <span className="hp-pill">Nguyên tố của ngày</span>
      <div className="hp-eod-body">
        <div className="hp-cell" aria-hidden="true">
          <small>{n}</small>
          <b>{s}</b>
          <em>{mass}</em>
        </div>
        <div>
          <h3>{name}</h3>
          <p>{fact}</p>
        </div>
      </div>
      <a className="hp-link" href="#table">Xem trên bảng tuần hoàn <IconArrowUpRight size={15} /></a>
    </div>
  );
}

export function useGreeting() {
  const { user } = useAuth();
  const h = new Date().getHours();
  const hello = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const raw = user?.displayName || (user?.email || '').split('@')[0] || 'bạn';
  const name = raw.trim().split(/\s+/).slice(-1)[0];
  const date = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  return { hello, name, date };
}

export function TodayBody({ grade }) {
  const [, force] = useState(0);
  const st = readStreak();
  const exam = nextExam();
  const wrong = wrongCount();
  const pomo = pomoToday();
  const last = jget('cs-home-last', null);

  return (
    <div className="hp-today">
      {last && PAGE_LABEL[last] && (
        <div className="hp-today-bar">
          <a className="hp-continue" href={'#' + last}>
            <span>Tiếp tục</span><b>{PAGE_LABEL[last]}</b>
            <IconArrowUpRight size={16} />
          </a>
        </div>
      )}

      <div className="hp-tiles">
        <Tile label="Chuỗi ngày học" value={<>{st.count}<small> ngày</small></>} sub={st.done ? 'Hôm nay đã hoàn thành' : 'Làm thử thách để giữ chuỗi'}>
          <Ring done={st.week} />
          <span className="hp-ring-n">{st.week}/7</span>
        </Tile>
        <Tile
          label="Kỳ thi gần nhất"
          href="#exam"
          value={exam ? <>{exam.days}<small> ngày</small></> : '—'}
          sub={exam ? exam.name : 'Chưa đặt ngày thi'}
        />
        <Tile
          label="Câu cần ôn lại"
          href="#notebook"
          value={wrong == null ? '—' : wrong}
          sub={wrong ? 'Mở Sổ tay để ôn ngay' : 'Sổ tay đang trống'}
        />
        <Tile
          label="Tập trung hôm nay"
          href="#pomodoro"
          value={pomo ? <>{pomo.v}<small> {pomo.unit}</small></> : '—'}
          sub={pomo && pomo.v ? 'Giữ nhịp thật tốt' : 'Bắt đầu một phiên Pomodoro'}
        />
      </div>

      <div className="hp-today-grid">
        <DailyChallenge grade={grade} onDone={() => force((x) => x + 1)} />
        <ElementOfDay />
      </div>
    </div>
  );
}

/* ============================================================
   4. BENTO CÔNG CỤ — mỗi ô có một bản demo sống
   ============================================================ */
const AI_DEMO = [
  ['Cân bằng giúp mình Al + HCl → AlCl₃ + H₂', '2Al + 6HCl → 2AlCl₃ + 3H₂. Mỗi vế có 2 Al, 6 H và 6 Cl.'],
  ['Tính pH của dung dịch HCl 0,01M', 'HCl điện li hoàn toàn nên [H⁺] = 0,01 M, vậy pH = 2.'],
  ['Sinh 3 câu hỏi về bảng tuần hoàn', 'Câu 1: Nguyên tố nào có độ âm điện lớn nhất? Câu 2: …'],
];
function BentoAI() {
  const i = useCycle(AI_DEMO.length, 7000);
  const [q, a] = AI_DEMO[i];
  const tq = useTyped(q, 20);
  const done = tq.length >= q.length;
  const ta = useTyped(done ? a : '', 16);
  return (
    <div className="hp-demo hp-chat" aria-hidden="true">
      <p className="me">{tq}</p>
      <p className="ai">{ta || <span className="dots"><i /><i /><i /></span>}</p>
    </div>
  );
}

function BentoTable() {
  const cells = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'];
  const [on, setOn] = useState(0);
  useEffect(() => {
    if (reduced()) return undefined;
    const t = setInterval(() => setOn(Math.floor(Math.random() * cells.length)), 650);
    return () => clearInterval(t);
  }, [cells.length]);
  return (
    <div className="hp-demo hp-mini-pt" aria-hidden="true">
      {cells.map((c, k) => <span key={c} className={k === on ? 'on' : ''}>{c}</span>)}
    </div>
  );
}

const EQS = [
  ['Fe + O₂ → Fe₂O₃', '4Fe + 3O₂ → 2Fe₂O₃'],
  ['Al + HCl → AlCl₃ + H₂', '2Al + 6HCl → 2AlCl₃ + 3H₂'],
  ['CH₄ + O₂ → CO₂ + H₂O', 'CH₄ + 2O₂ → CO₂ + 2H₂O'],
];
function BentoBalance() {
  const [k, setK] = useState(0);
  const [bal, setBal] = useState(false);
  useEffect(() => {
    if (reduced()) { setBal(true); return undefined; }
    const t = setInterval(() => {
      setBal((b) => { if (b) setK((x) => (x + 1) % EQS.length); return !b; });
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={'hp-demo hp-eq' + (bal ? ' bal' : '')} aria-hidden="true">
      <code key={k + '' + bal}>{EQS[k][bal ? 1 : 0]}</code>
      <span>{bal ? 'Đã cân bằng' : 'Chưa cân bằng'}</span>
    </div>
  );
}

function BentoPomo() {
  const [s, setS] = useState(24 * 60 + 41);
  useEffect(() => {
    if (reduced()) return undefined;
    const t = setInterval(() => setS((v) => (v <= 1 ? 25 * 60 : v - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const c = 2 * Math.PI * 34;
  return (
    <div className="hp-demo hp-pomo" aria-hidden="true">
      <svg viewBox="0 0 80 80" width="84" height="84">
        <circle cx="40" cy="40" r="34" className="bg" />
        <circle cx="40" cy="40" r="34" className="fg" strokeDasharray={c} strokeDashoffset={c * (1 - s / 1500)} transform="rotate(-90 40 40)" />
      </svg>
      <b>{pad(Math.floor(s / 60))}:{pad(s % 60)}</b>
    </div>
  );
}

function BentoExam() {
  const exam = nextExam();
  return (
    <div className="hp-demo hp-exam" aria-hidden="true">
      <b>{exam ? exam.days : '--'}</b>
      <span>{exam ? 'ngày nữa là ' + exam.name : 'ngày tới kỳ thi'}</span>
    </div>
  );
}

function BentoGrade() {
  const [ref, on] = useSeen(0.4);
  return (
    <div ref={ref} className={'hp-demo hp-grade' + (on ? ' on' : '')} aria-hidden="true">
      <div className="bar"><i /></div>
      <span>Ví dụ: cần ≥ 7,5 điểm cuối kỳ</span>
    </div>
  );
}

function BentoQuiz() {
  const flip = useCycle(2, 2600) === 1;
  return (
    <div className={'hp-demo hp-flip' + (flip ? ' back' : '')} aria-hidden="true">
      <div className="f">Công thức muối ăn?</div>
      <div className="b">NaCl</div>
    </div>
  );
}

const FORMS = ['n = m / M', 'pH = −log[H⁺]', 'C = n / V', 'PV = nRT'];
function BentoFormula() {
  const i = useCycle(FORMS.length, 2200);
  return <div className="hp-demo hp-form" aria-hidden="true"><code key={i}>{FORMS[i]}</code></div>;
}

const GAMES = [
  ['chicken', 'Gà hóa học'], ['slingshot', 'Ná bắn'], ['jeopardy', 'Jeopardy'],
  ['lab', 'Phòng Lab'], ['battle', 'Đấu nguyên tố'], ['sudoku', 'Sudoku'],
];

const BENTO = [
  { id: 'ai', cls: 'ai', title: 'Trợ lý AI', desc: 'Chụp đề, hỏi đáp, sinh câu hỏi. Gia sư 24/7.', Icon: IconRobot, Demo: BentoAI },
  { id: 'table', cls: 'table', title: 'Bảng tuần hoàn', desc: '118 nguyên tố, lọc và tìm tức thì.', Icon: IconAtom, tint: '--nonmetal', Demo: BentoTable },
  { id: 'balance', cls: 'balance', title: 'Cân bằng PTHH', desc: 'Nhập phương trình, ra hệ số.', Icon: IconScale, tint: '--metalloid', Demo: BentoBalance },
  { id: 'pomodoro', cls: 'pomo', title: 'Pomodoro', desc: 'Tập trung sâu, nghỉ đúng lúc.', Icon: IconTimer, tint: '--alkali', Demo: BentoPomo },
  { id: 'exam', cls: 'exam', title: 'Kỳ thi', desc: 'Đếm ngược tới ngày quyết định.', Icon: IconCalendar, tint: '--alkaline', Demo: BentoExam },
  { id: 'grade', cls: 'grade', title: 'Tính điểm', desc: 'Cần bao nhiêu để đạt mục tiêu.', Icon: IconTarget, tint: '--transition', Demo: BentoGrade },
  { id: 'quiz', cls: 'quiz', title: 'Ôn tập', desc: 'Quiz giúp nhớ lâu hơn.', Icon: IconQuiz, tint: '--halogen', Demo: BentoQuiz },
  { id: 'formulas', cls: 'form', title: 'Công thức nhanh', desc: 'Mol, pH, vô cơ, hữu cơ.', Icon: IconFlask, tint: '--post', Demo: BentoFormula },
];

export function BentoTools() {
  return (
    <>
      <div className="hp-bento">
        {BENTO.map(({ id, cls, title, desc, Icon, tint, Demo }) => (
          <div key={id} className={'hp-bt hp-spot ' + cls} style={tint ? { '--t': `var(${tint})` } : undefined}>
            <a href={'#' + id} className="hp-bt-link" aria-label={title}>
              <span className="hp-bt-ico"><Icon size={cls === 'ai' ? 26 : 20} /></span>
              <span className="hp-bt-txt"><b>{title}</b><small>{desc}</small></span>
              <IconArrowUpRight size={18} className="hp-bt-go" />
            </a>
            <Demo />
          </div>
        ))}
        <div className="hp-bt hp-spot games" style={{ '--t': 'var(--noble)' }}>
          <a href="#games" className="hp-bt-link" aria-label="Trò chơi">
            <span className="hp-bt-ico"><IconGamepad size={20} /></span>
            <span className="hp-bt-txt"><b>Trò chơi</b><small>6 trò chơi hóa học, giáo viên tự nhập câu hỏi.</small></span>
            <IconArrowUpRight size={18} className="hp-bt-go" />
          </a>
          <div className="hp-games">
            {GAMES.map(([id, n], k) => (
              <a key={id} href={'#games/' + id} style={{ '--k': k }}>{n}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="hp-more-tools">
        {[['analyze', 'Phân tích', IconMicroscope], ['notebook', 'Sổ tay', IconBook], ['notes', 'Ghi chú', IconNote], ['stats', 'Thống kê', IconChart], ['tools', 'Xem cả 12 công cụ', IconCalc]].map(([id, n, I]) => (
          <a key={id} href={'#' + id}><I size={15} />{n}</a>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   5. PHÒNG THÍ NGHIỆM — kéo thanh pH, dung dịch đổi màu
   ============================================================ */
const hue = (ph) => (ph <= 7 ? (ph / 7) * 120 : 120 + ((ph - 7) / 7) * 160);
const phColor = (ph) => `hsl(${hue(ph).toFixed(0)} 78% 52%)`;
const SUBS = [
  ['Dịch vị', 1.5], ['Nước chanh', 2], ['Giấm', 3], ['Cà phê', 5], ['Nước tinh khiết', 7],
  ['Nước biển', 8], ['Baking soda', 9], ['Xà phòng', 10], ['Amoniac', 11.5], ['Thuốc tẩy', 13],
];
const SCALE_BG = `linear-gradient(90deg, ${Array.from({ length: 15 }, (_, i) => phColor(i)).join(',')})`;

export function LabBody({ grade }) {
  const [ph, setPh] = useState(7);
  const kind = ph < 6.5 ? 'Axit' : ph > 7.5 ? 'Bazơ' : 'Trung tính';
  const [m, e] = (10 ** -ph).toExponential(1).split('e');
  const near = SUBS.reduce((a, b) => (Math.abs(b[1] - ph) < Math.abs(a[1] - ph) ? b : a));
  const intensity = Math.min(1, Math.abs(ph - 7) / 7);

  return (
    <div className="hp-lab-box">
        <div className="hp-beaker" style={{ '--c': phColor(ph) }}>
          <svg viewBox="0 0 260 320" role="img" aria-label={`Cốc dung dịch pH ${ph}`}>
            <defs>
              <clipPath id="hp-bk"><path d="M52 40H208V270Q208 290 188 290H72Q52 290 52 270Z" /></clipPath>
            </defs>
            <g clipPath="url(#hp-bk)">
              <rect x="40" y="130" width="180" height="170" className="liq" />
              <g className="hp-wave"><path d="M-100 130Q-75 118 -50 130T0 130T50 130T100 130T150 130T200 130T250 130T300 130V180H-100Z" className="liq" /></g>
              <g className="hp-bub" style={{ opacity: 0.25 + intensity * 0.75 }}>
                {[78, 104, 128, 150, 172, 192, 116].map((x, i) => (
                  <circle key={i} cx={x} cy={280} r={3 + (i % 3) * 1.6} style={{ '--dl': -i * 0.7 + 's', '--sp': 2.6 + (i % 4) * 0.5 + 's' }} />
                ))}
              </g>
            </g>
            <path d="M44 34H216M52 40V270Q52 290 72 290H188Q208 290 208 270V40" className="glass" />
            {[90, 130, 170, 210, 250].map((y) => <path key={y} d={`M52 ${y}h16`} className="tick" />)}
            <path d="M64 56V250" className="shine" />
          </svg>
        </div>

        <div className="hp-lab-ctl">
          <div className="hp-ph">
            <span>pH</span><b>{ph.toFixed(1).replace('.', ',')}</b>
            <em style={{ '--c': phColor(ph) }}>{kind}</em>
          </div>
          <p className="hp-h">[H⁺] ≈ {m.replace('.', ',')} × 10{sup(parseInt(e, 10))} mol/L</p>
          <input
            className="hp-range" type="range" min="0" max="14" step="0.1" value={ph}
            onChange={(ev) => setPh(parseFloat(ev.target.value))}
            aria-label="Giá trị pH" style={{ '--bar': SCALE_BG }}
          />
          <div className="hp-scale"><span>0</span><span>7</span><span>14</span></div>
          <div className="hp-subs" role="group" aria-label="Chọn chất">
            {SUBS.map(([n, v]) => (
              <button key={n} type="button" className={near[0] === n && Math.abs(near[1] - ph) < 0.35 ? 'on' : ''} onClick={() => setPh(v)}>
                {n}
              </button>
            ))}
          </div>
          <p className="hp-lab-note">Gần giá trị này nhất: <b>{near[0]}</b> (pH xấp xỉ {String(near[1]).replace('.', ',')}).</p>
          <button type="button" className="btn primary" onClick={() => askAI(`Giải thích vì sao ${near[0].toLowerCase()} có pH khoảng ${near[1]} và cách tính pH`, grade)}>
            Hỏi AI vì sao
          </button>
        </div>
    </div>
  );
}

/* ============================================================
   6. HÓA HỌC QUANH TA
   ============================================================ */
const EVERYDAY = [
  { sym: 'S', tint: '--alkaline', tag: 'Đời sống', t: 'Vì sao cắt hành lại cay mắt?', p: 'Một chuỗi phản ứng enzym tạo ra khí kích ứng chỉ trong vài giây.', q: 'Giải thích vì sao cắt hành tây lại làm cay mắt, dưới góc nhìn hóa học' },
  { sym: 'Li', tint: '--alkali', tag: 'Công nghệ', t: 'Pin lithium-ion hoạt động thế nào?', p: 'Ion Li⁺ chạy qua lại giữa hai điện cực mỗi lần sạc và xả.', q: 'Giải thích nguyên lý hoạt động của pin lithium-ion cho học sinh lớp 12' },
  { sym: 'Fe', tint: '--transition', tag: 'Vật liệu', t: 'Vì sao sắt gỉ còn vàng thì không?', p: 'Câu trả lời nằm ở thế điện cực và khả năng bị oxi hóa.', q: 'Vì sao sắt bị gỉ còn vàng thì không? Giải thích bằng thế điện cực' },
  { sym: 'Sr', tint: '--halogen', tag: 'Lễ hội', t: 'Pháo hoa có màu nhờ đâu?', p: 'Mỗi ion kim loại phát ra một màu riêng khi bị kích thích.', q: 'Vì sao pháo hoa có nhiều màu? Mỗi kim loại cho màu nào?' },
];
export function EverydaySection({ grade }) {
  return (
    <section className="hm-wrap hm-section">
      <Title lead="Những câu hỏi nhỏ ở quanh bạn, và lời giải nằm trong sách Hóa. Bấm vào để hỏi AI.">Hóa học quanh ta</Title>
      <div className="hp-ed">
        {EVERYDAY.map((c, i) => (
          <Rv as="button" type="button" key={c.sym} d={i * 90} className="hp-ed-c hp-spot" style={{ '--t': `var(${c.tint})` }} onClick={() => askAI(c.q, grade)}>
            <span className="sym" aria-hidden="true">{c.sym}</span>
            <small>{c.tag}</small>
            <b>{c.t}</b>
            <p>{c.p}</p>
            <span className="go">Hỏi AI <IconArrowUpRight size={15} /></span>
          </Rv>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   7. LỘ TRÌNH THEO LỚP
   ============================================================ */
const ROAD = {
  'Lớp 10': {
    goal: 'Vững nền tảng: cấu tạo nguyên tử, bảng tuần hoàn, liên kết và phản ứng.',
    topics: ['Cấu tạo nguyên tử', 'Bảng tuần hoàn', 'Liên kết hóa học', 'Phản ứng oxi hóa – khử', 'Năng lượng hóa học', 'Tốc độ phản ứng', 'Nhóm halogen'],
    tools: [['table', 'Bảng tuần hoàn'], ['balance', 'Cân bằng PTHH'], ['quiz', 'Ôn tập']],
  },
  'Lớp 11': {
    goal: 'Mở rộng sang cân bằng hóa học, nitơ – lưu huỳnh và hóa hữu cơ.',
    topics: ['Cân bằng hóa học', 'Nitrogen và sulfur', 'Đại cương hóa hữu cơ', 'Hydrocarbon', 'Alcohol và phenol', 'Carbonyl và carboxylic acid'],
    tools: [['formulas', 'Công thức nhanh'], ['analyze', 'Phân tích'], ['notebook', 'Sổ tay']],
  },
  'Lớp 12': {
    goal: 'Về đích: hệ thống kiến thức, luyện đề và đếm ngược tới kỳ thi.',
    topics: ['Ester và lipid', 'Carbohydrate', 'Amine, amino acid, protein', 'Polymer', 'Pin điện và điện phân', 'Đại cương kim loại', 'Kim loại nhóm IA, IIA, nhôm', 'Sắt và hợp chất'],
    tools: [['exam', 'Kỳ thi'], ['grade', 'Tính điểm'], ['stats', 'Thống kê']],
  },
  'Đại học': {
    goal: 'Nâng lên tư duy định lượng: nhiệt động, động hóa học và phân tích.',
    topics: ['Hóa đại cương', 'Nhiệt động hóa học', 'Động hóa học', 'Cân bằng ion', 'Hóa phân tích'],
    tools: [['analyze', 'Phân tích'], ['formulas', 'Công thức nhanh'], ['notes', 'Ghi chú']],
  },
};

export function RoadBody({ grade, setGrade }) {
  const r = ROAD[grade] || ROAD['Lớp 11'];
  return (
    <div className="hp-road">
        <div className="hp-tabs" role="tablist" aria-label="Chọn lớp">
          {Object.keys(ROAD).map((g) => (
            <button key={g} type="button" role="tab" aria-selected={g === grade} className={g === grade ? 'on' : ''} onClick={() => setGrade(g)}>{g}</button>
          ))}
        </div>
        <div className="hp-road-body" key={grade}>
          <div className="hp-road-l">
            <p className="hp-goal">{r.goal}</p>
            <div className="hp-road-tools">
              {r.tools.map(([id, n]) => <a key={id} className="btn" href={'#' + id}>{n}</a>)}
            </div>
          </div>
          <ol className="hp-topics">
            {r.topics.map((t, i) => (
              <li key={t} style={{ '--i': i }}>
                <button type="button" onClick={() => askAI(`Tóm tắt kiến thức trọng tâm chương "${t}" Hóa học ${grade} kèm 3 câu hỏi ôn tập`, grade)}>
                  <span>{i + 1}</span>{t}
                </button>
              </li>
            ))}
          </ol>
        </div>
    </div>
  );
}

/* ============================================================
   8. CỘNG ĐỒNG — bảng xếp hạng + cập nhật mới
   ============================================================ */
function readScores() {
  const rows = [];
  for (const k of (KEYS.scores ? [KEYS.scores] : scanKeys(/score|leader|rank/i))) {
    for (const it of flatten(jget(k, null))) {
      if (it && typeof it === 'object' && Number.isFinite(Number(it.score ?? it.points))) {
        rows.push({ name: it.name ?? it.user ?? it.player ?? it.displayName ?? 'Ẩn danh', score: Number(it.score ?? it.points), game: it.game ?? '' });
      }
    }
  }
  return rows.sort((a, b) => b.score - a.score).slice(0, 5);
}

const LOG = [
  ['Mới', 'Trang chủ cá nhân hóa', 'Chuỗi ngày học, thử thách mỗi ngày, nguyên tố của ngày và lộ trình theo lớp.'],
  ['Mới', 'Điều hướng mới', 'Menu công cụ dạng mega menu trên máy tính, thanh điều hướng có nút AI nổi trên điện thoại.'],
  ['Cải tiến', 'Trang Công cụ', 'Ảnh bìa sách thật và danh sách sách trong cửa sổ riêng.'],
  ['Cải tiến', 'Trợ lý AI', 'Giao diện kính mờ mới, dễ đọc hơn khi hỏi dài.'],
];

export function CommunitySection() {
  const rows = readScores();
  const max = rows[0]?.score || 1;
  return (
    <section className="hm-wrap hm-section">
      <Title lead="Điểm cao của lớp và những gì vừa được cập nhật.">Cùng nhau tiến bộ</Title>
      <div className="hp-comm">
        <Rv className="hp-board hp-spot" d={40}>
          <h3>Bảng xếp hạng trò chơi</h3>
          {rows.length ? (
            <ol>
              {rows.map((r, i) => (
                <li key={i} style={{ '--w': (r.score / max) * 100 + '%', '--i': i }}>
                  <span className="rk">{i + 1}</span>
                  <span className="nm">{r.name}</span>
                  <span className="sc">{r.score}</span>
                  <i aria-hidden="true" />
                </li>
              ))}
            </ol>
          ) : (
            <div className="hp-empty">
              <p>Chưa có điểm nào được ghi. Chơi một ván để mở bảng xếp hạng.</p>
              <a className="btn primary" href="#games">Chơi ngay</a>
            </div>
          )}
        </Rv>
        <Rv className="hp-log hp-spot" d={120}>
          <h3>Mới cập nhật</h3>
          <ul>
            {LOG.map(([tag, t, d]) => (
              <li key={t}>
                <span className={'hp-tag ' + (tag === 'Mới' ? 'new' : '')}>{tag}</span>
                <div><b>{t}</b><p>{d}</p></div>
              </li>
            ))}
          </ul>
        </Rv>
      </div>
    </section>
  );
}

/* ============================================================
   9. HỎI NHANH (FAQ)
   ============================================================ */
const FAQ = [
  ['Trợ lý AI có chính xác tuyệt đối không?', 'AI giải thích và gợi ý rất nhanh nhưng vẫn có thể sai. Hãy đối chiếu với sách giáo khoa, nhất là khi tính toán nhiều bước hoặc làm đề thi.'],
  ['Dùng web có mất phí không?', 'Hiện tại miễn phí cho học sinh. Gói VIP đang được chuẩn bị và sẽ thông báo rõ trước khi mở.'],
  ['Mình có thể chụp ảnh đề để hỏi không?', 'Có. Bấm biểu tượng ảnh ở ô hỏi AI, chụp hoặc chọn ảnh đề rồi gửi.'],
  ['Dữ liệu học của mình được lưu ở đâu?', 'Chuỗi ngày học, ghi chú và nhiều thiết lập được lưu ngay trên trình duyệt của bạn. Xóa dữ liệu trình duyệt thì chúng cũng mất.'],
  ['Giáo viên có thể tự nhập câu hỏi cho trò chơi không?', 'Có. Các trò chơi cho phép giáo viên tự nhập bộ câu hỏi để dùng trong lớp.'],
];
export function FaqSection() {
  return (
    <section className="hm-wrap hm-section">
      <Title>Hỏi nhanh, đáp gọn</Title>
      <Rv className="hp-faq" d={60}>
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </Rv>
    </section>
  );
}