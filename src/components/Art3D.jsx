import { useMemo } from 'react';

/* ============================================================
   Art3D.jsx — icon SVG + cảnh 3D thuần CSS/SVG (không cần thư viện)
   Mọi cảnh đọc biến CSS do useScrollEngine đặt: --p, --px, --py
   ============================================================ */

/* ---------- ICON SVG (thay emoji) ---------- */
const ICONS = {
  bulb: (<><path className="d" d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.8V17h5.4v-1.4c0-.7.3-1.3.9-1.8A6 6 0 0 0 12 3z" /><path d="M9.7 20.2h4.6M10.6 22.4h2.8" /></>),
  bot: (<><rect className="d" x="4" y="8" width="16" height="12" rx="3.5" /><path d="M12 8V5" /><circle cx="12" cy="3.8" r="1.2" /><circle cx="9" cy="14" r="1.1" /><circle cx="15" cy="14" r="1.1" /><path d="M2 13.5v3M22 13.5v3" /></>),
  target: (<><circle className="d" cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /><path d="M12 12l6.5-6.5M16.5 4.5v3h3" /></>),
  book: (<><path className="d" d="M4 20.5V5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M8.5 7.5h6M4 20.5A2.5 2.5 0 0 0 6.5 23H19v-5" /></>),
  game: (<><rect className="d" x="2" y="7.5" width="20" height="10" rx="5" /><path d="M7 10.5v4M5 12.5h4" /><circle cx="15.5" cy="11.5" r=".9" /><circle cx="18" cy="13.5" r=".9" /></>),
  school: (<><path className="d" d="M3 10l9-6 9 6v1H3z" /><path d="M5 11v8M9.7 11v8M14.3 11v8M19 11v8M3 20.5h18" /></>),
  note: (<><path className="d" d="M5 3h9l5 5v13H5z" /><path d="M14 3v5h5M8.5 13h7M8.5 17h5" /></>),
  phone: (<><rect className="d" x="7" y="2" width="10" height="20" rx="2.8" /><path d="M10.5 18.5h3" /></>),
  lock: (<><rect className="d" x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1.2" /></>),
  spark: (<><path className="d" d="M11 3l2 5.6L18.6 10.6 13 12.6 11 18.2 9 12.6 3.4 10.6 9 8.6z" /><path d="M19 16l.8 2.2 2.2.8-2.2.8L19 22l-.8-2.2-2.2-.8 2.2-.8z" /></>),
  grid: (<><rect className="d" x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>),
  flask: (<><path className="d" d="M10 3v6L4.6 18.6A2 2 0 0 0 6.3 21.6h11.4a2 2 0 0 0 1.7-3L14 9V3" /><path d="M8.5 3h7M7.5 15h9" /></>),
  calc: (<><rect className="d" x="5" y="2.5" width="14" height="19" rx="3" /><path d="M8.5 7h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" /></>),
  cards: (<><rect className="d" x="3" y="6" width="13" height="15" rx="2.5" /><path d="M8 3h11a2 2 0 0 1 2 2v12M7 11h5M7 15h3" /></>),
  wrong: (<><path className="d" d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V3z" /><path d="M9.5 9.5l4 4M13.5 9.5l-4 4" /></>),
  repeat: (<><path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" /></>),
  trophy: (<><path className="d" d="M7 3h10v6a5 5 0 0 1-10 0V3z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M9.5 18h5" /></>),
  shield: (<><path className="d" d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5L15.5 10" /></>),
  users: (<><circle className="d" cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>),
  clock: (<><circle className="d" cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>),
  paw: (<><circle cx="7" cy="9" r="1.8" /><circle cx="12" cy="6.5" r="1.8" /><circle cx="17" cy="9" r="1.8" /><path className="d" d="M12 12c-3 0-5.5 3-5.5 5.2 0 1.6 1.3 2.3 2.8 2.3 1 0 1.8-.5 2.7-.5s1.7.5 2.7.5c1.5 0 2.8-.7 2.8-2.3C17.5 15 15 12 12 12z" /></>),
  library: (<><rect className="d" x="4" y="4" width="4.5" height="17" rx="1" /><rect x="9.5" y="7" width="4.5" height="14" rx="1" /><path d="M15.5 20.5L19.5 7.8l-3.4-1" /></>),
  upload: (<><path className="d" d="M5 3h9l5 5v13H5z" /><path d="M12 17v-6M9 13.5l3-3 3 3" /></>),
  chart: (<><path d="M4 4v16h16" /><rect className="d" x="7.5" y="12" width="3" height="5" rx="1" /><rect className="d" x="12.5" y="8" width="3" height="9" rx="1" /><rect className="d" x="17.5" y="5" width="2.5" height="12" rx="1" /></>),
  globe: (<><circle className="d" cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>),
  bolt: (<><path className="d" d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z" /></>),
  mic: (<><rect className="d" x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>),
  image: (<><rect className="d" x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M4 18l5-5 4 4 3-3 4 4" /></>),
  keys: (<><rect className="d" x="3" y="6" width="18" height="12" rx="3" /><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8" /></>),
};

export const FaqIcon = ({ name, size = 22 }) => (
  <svg className="cs-fi" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="url(#cs-ig)"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

export const FeatIcon = FaqIcon;

/* Gradient dùng chung — render đúng một lần ở gốc trang */
export const IconDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="cs-ig" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21">
        <stop offset="0" stopColor="#4aa3ff" />
        <stop offset="1" stopColor="#1f6fe6" />
      </linearGradient>
    </defs>
  </svg>
);

/* ---------- KHỐI 3D CƠ BẢN ---------- */
const COL = { H: '#e6efff', C: '#44536e', O: '#ff5b61', N: '#4f7dff', Na: '#a970ff', Cl: '#2fd08c', A: '#4d9dff', B: '#ff7ab6' };
const RAD = { H: 13, C: 20, O: 22, N: 21, Na: 13, Cl: 18, A: 9, B: 9 };
const px = (v) => v.toFixed(1) + 'px';

export function Scene3D({ className = '', scrub = false, children }) {
  return (
    <div className={'s3 ' + className} aria-hidden="true" {...(scrub ? { 'data-scrub': 'thru' } : {})}>
      <div className="s3-world">{children}</div>
    </div>
  );
}

function Ball({ at, el }) {
  return <i className="s3-ball" style={{ '--x': px(at[0]), '--y': px(at[1]), '--z': px(at[2]), '--r': px(RAD[el]), '--c': COL[el] }} />;
}

/* Liên kết = hai mặt phẳng vuông góc → nhìn từ góc nào cũng như hình trụ */
function Bond({ a, b, w = 8 }) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const st = {
    '--x': px((a[0] + b[0]) / 2), '--y': px((a[1] + b[1]) / 2), '--z': px((a[2] + b[2]) / 2),
    '--L': px(Math.hypot(dx, dy, dz)), '--w': w + 'px',
    '--ba': (Math.atan2(-dz, dx) * 180 / Math.PI).toFixed(2) + 'deg',
    '--bz': (Math.atan2(dy, Math.hypot(dx, dz)) * 180 / Math.PI).toFixed(2) + 'deg',
  };
  return (<><i className="s3-bond" style={st} /><i className="s3-bond b2" style={st} /></>);
}

/* ---------- PHÂN TỬ ---------- */
const hex = (r, k, y = 0) => [Math.cos(k * Math.PI / 3) * r, y, Math.sin(k * Math.PI / 3) * r];
const MOLS = {
  water: { atoms: [['O', [0, 0, 0]], ['H', [-47, 37, 0]], ['H', [47, 37, 0]]], bonds: [[0, 1], [0, 2]] },
  methane: {
    atoms: [['C', [0, 0, 0]], ['H', [38, 38, 38]], ['H', [38, -38, -38]], ['H', [-38, 38, -38]], ['H', [-38, -38, 38]]],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  benzene: {
    atoms: [...[0, 1, 2, 3, 4, 5].map((k) => ['C', hex(46, k)]), ...[0, 1, 2, 3, 4, 5].map((k) => ['H', hex(84, k)])],
    bonds: [...[0, 1, 2, 3, 4, 5].map((k) => [k, (k + 1) % 6]), ...[0, 1, 2, 3, 4, 5].map((k) => [k, 6 + k])],
  },
};

export function Molecule({ kind = 'water', className = '' }) {
  const m = MOLS[kind];
  return (
    <Scene3D className={'mol ' + className}>
      {m.bonds.map(([i, j]) => <Bond key={i + '-' + j} a={m.atoms[i][1]} b={m.atoms[j][1]} />)}
      {m.atoms.map(([el, at], i) => <Ball key={i} el={el} at={at} />)}
    </Scene3D>
  );
}

/* ---------- TINH THỂ NaCl ---------- */
export function Crystal({ className = '' }) {
  const balls = useMemo(() => {
    const out = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
      out.push([(i + j + k) % 2 === 0 ? 'Na' : 'Cl', [(i - 1) * 40, (j - 1) * 40, (k - 1) * 40]]);
    }
    return out;
  }, []);
  return (
    <Scene3D scrub className={'cry ' + className}>
      {balls.map(([el, at], i) => <Ball key={i} el={el} at={at} />)}
    </Scene3D>
  );
}

/* ---------- XOẮN KÉP ADN ---------- */
export function Helix({ className = '' }) {
  const { balls, bonds } = useMemo(() => {
    const n = 16, A = [], B = [], rungs = [];
    for (let i = 0; i < n; i++) {
      const y = (i - (n - 1) / 2) * 20, a = i * 0.62;
      const x = Math.cos(a) * 46, z = Math.sin(a) * 46;
      A.push([x, y, z]); B.push([-x, y, -z]); rungs.push([[x, y, z], [-x, y, -z]]);
    }
    const back = [];
    for (let i = 0; i < n - 1; i++) { back.push([A[i], A[i + 1]]); back.push([B[i], B[i + 1]]); }
    return { balls: [...A.map((p) => ['A', p]), ...B.map((p) => ['B', p])], bonds: { rungs, back } };
  }, []);
  return (
    <Scene3D scrub className={'hx ' + className}>
      {bonds.rungs.map(([a, b], i) => <Bond key={'r' + i} a={a} b={b} w={5} />)}
      {bonds.back.map(([a, b], i) => <Bond key={'b' + i} a={a} b={b} w={6} />)}
      {balls.map(([el, at], i) => <Ball key={i} el={el} at={at} />)}
    </Scene3D>
  );
}

/* ---------- MÔ HÌNH NGUYÊN TỬ: 3 quỹ đạo nghiêng + electron ---------- */
const ORBITS = [[0, 15], [60, 19], [120, 23]];
export function AtomOrbit({ className = '', hero = false, core = false, scrub = false }) {
  return (
    <Scene3D scrub={scrub} className={'s3-atom ' + (hero ? 'hero-atom ' : '') + className}>
      {core && <Ball at={[0, 0, 0]} el="A" />}
      {ORBITS.map(([off, t]) => (
        <div key={off} className="orb" style={{ '--off': off + 'deg', '--t': t + 's' }}>
          <i className="orb-ring" />
          <div className="orb-spin"><i className="orb-e" /></div>
        </div>
      ))}
    </Scene3D>
  );
}

/* ---------- BÌNH TAM GIÁC: mức dung dịch + màu theo cuộn trang ---------- */
const FLASK = 'M36 6h28v6h-5.5v36.5L88 100c4.5 8-1.2 18-10.4 18H22.4C13.2 118 7.5 108 12 100l29.5-51.5V12H36z';
export function Flask({ className = '' }) {
  return (
    <svg className={'lp-flask ' + className} viewBox="0 0 100 130" aria-hidden="true">
      <defs>
        <clipPath id="cs-fl-c"><path d={FLASK} /></clipPath>
        <linearGradient id="cs-fl-g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" />
          <stop offset=".4" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#fff" stopOpacity=".28" />
        </linearGradient>
      </defs>
      <ellipse className="fl-sh" cx="50" cy="124" rx="38" ry="4" />
      <g clipPath="url(#cs-fl-c)">
        <g className="fl-liq">
          <rect className="fl-fill" x="-10" y="2" width="120" height="140" />
          <path className="fl-wave fl-fill" d="M-10 2q15-7 30 0t30 0t30 0t30 0t30 0t30 0V10H-10z" />
          <circle className="fl-b" cx="34" cy="70" r="3" />
          <circle className="fl-b b2" cx="58" cy="62" r="2" />
          <circle className="fl-b b3" cx="70" cy="76" r="2.6" />
        </g>
      </g>
      <path className="fl-glass" d={FLASK} />
      <path className="fl-hi" d="M30 98l12-21" />
    </svg>
  );
}