/* ============================================================
   Lab3D.jsx — ELEC AI IMMERSIVE CHEMISTRY LAB 3D (Nâng cấp v2)
   Full-screen experience: cảnh 3D + HUD (kho hóa chất có tìm kiếm/lọc,
   6 dụng cụ tương tác gồm 3 ống nghiệm, san dung dịch giữa các cốc,
   hoàn tác, rửa cốc, 8 bài thực hành THPT, gợi ý phản ứng thông minh,
   lưu/khôi phục phiên thật & xuất báo cáo thí nghiệm).
   Engine: engine.js · Cảnh: Scene.jsx
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { db } from '../../lib/firebase.js';
import { doc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import {
  CHEMS, FLAME_IONS, ELECTROLYTES, MOLECULES_3D,
  createContainer, addChemical, transferLiquid, applyHeatReactions,
  volumeOf, solidMassOf, totalMassOf, dominantColor, computePH,
  logEntry, chemLabel, suggestReactionsFor,
} from './engine.js';
import LabScene from './Scene.jsx';
import LabHud from './LabHud.jsx';
import { MicroscopeOverlay, LabAiTutorDrawer } from './LabModals.jsx';
import './lab3d.css';

const LOCAL_STORAGE_KEY = 'cs-lab3d-session-v2';

/* ---------- 8 Nhiệm vụ thực hành chuẩn THPT ---------- */
const EXPERIMENTS = [
  {
    id: 'ex-acid-base',
    name: 'A. Chuẩn độ Axit – Bazơ (chỉ thị PPT)',
    steps: [
      { text: 'Rót 20 mL dung dịch HCl vào cốc thủy tinh', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'HCl' && l.ml >= 15) },
      { text: 'Nhỏ vài giọt chỉ thị Phenolphthalein', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'PPT') },
      { text: 'Rót NaOH đến khi dung dịch chuyển hồng (pH > 8.3)', check: (s) => Object.values(s).some((v) => v?.indicators?.includes('PPT') && (v?.pH ?? 7) > 8.3) },
      { text: 'Ghi nhận phương trình: HCl + NaOH → NaCl + H2O', check: (s, log) => log.some((l) => l.events?.some((e) => e.eq?.includes('HCl + NaOH'))) },
    ],
  },
  {
    id: 'ex-precipitate',
    name: 'B. Nhận biết ion SO₄²⁻ (Kết tủa BaSO₄)',
    steps: [
      { text: 'Rót 20 mL dung dịch BaCl2 vào dụng cụ', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'BaCl2') },
      { text: 'Rót thêm dung dịch H2SO4 loãng hoặc CuSO4', check: (s, log) => log.some((l) => l.act === 'pour' && (l.chem === 'H2SO4' || l.chem === 'CuSO4')) },
      { text: 'Quan sát kết tủa trắng BaSO4 bền ở đáy dụng cụ', check: (s) => Object.values(s).some((v) => (v?.precipitates || []).some((p) => p.formula === 'BaSO4' || p.color === '#f5f7fa')) },
    ],
  },
  {
    id: 'ex-metal',
    name: 'C. Kim loại + Muối (Fe + CuSO₄)',
    steps: [
      { text: 'Rót 30 mL dung dịch CuSO4 màu xanh lam vào cốc', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'CuSO4') },
      { text: 'Thả đinh sắt sạch (Fe) vào dung dịch CuSO4', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'Fe_nail') },
      { text: 'Quan sát lớp đồng đỏ nâu bám lên đinh sắt', check: (s) => Object.values(s).some((v) => (v?.precipitates || []).some((p) => p.color === '#a3552f')) },
    ],
  },
  {
    id: 'ex-amphoteric',
    name: 'D. Tính lưỡng tính của Al(OH)₃',
    steps: [
      { text: 'Rót 15 mL dung dịch AlCl3 vào cốc hoặc ống nghiệm', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'AlCl3') },
      { text: 'Rót vừa đủ 15 mL NaOH để tạo kết tủa keo trắng Al(OH)3', check: (s, log) => log.some((l) => l.events?.some((e) => e.eq?.includes('AlCl3 + 3NaOH'))) },
      { text: 'Rót tiếp NaOH dư để hòa tan hoàn toàn kết tủa keo trắng', check: (s, log) => log.some((l) => l.events?.some((e) => e.type === 'hoa-tan-kettua')) },
    ],
  },
  {
    id: 'ex-complex',
    name: 'E. Phức chất đồng [Cu(NH₃)₄](OH)₂',
    steps: [
      { text: 'Rót 15 mL dung dịch CuSO4 vào cốc hoặc ống nghiệm', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'CuSO4') },
      { text: 'Rót 10 mL dung dịch NH3 để tạo kết tủa xanh lam Cu(OH)2', check: (s, log) => log.some((l) => l.events?.some((e) => e.eq?.includes('CuSO4 + 2NH3'))) },
      { text: 'Rót tiếp 25 mL NH3 dư để kết tủa tan thành phức xanh lam thẫm', check: (s, log) => log.some((l) => l.events?.some((e) => e.type === 'tao-phuc')) },
    ],
  },
  {
    id: 'ex-thermal',
    name: 'F. Nhiệt phân Cu(OH)₂ bằng đèn cồn',
    steps: [
      { text: 'Tạo kết tủa xanh lam Cu(OH)2 từ CuSO4 và NaOH', check: (s) => Object.values(s).some((v) => (v?.precipitates || []).some((p) => p.formula === 'Cu(OH)2' || p.formula === 'CuO')) },
      { text: 'Bật Đèn cồn để đun nóng hỗn hợp lên trên 65°C', check: (s) => Object.values(s).some((v) => (v?.temp || 25) >= 65) },
      { text: 'Quan sát kết tủa xanh lam chuyển thành CuO màu đen', check: (s, log) => log.some((l) => l.events?.some((e) => e.type === 'nhiet-phan')) },
    ],
  },
  {
    id: 'ex-redox',
    name: 'G. Oxi hóa FeSO₄ bằng thuốc tím KMnO₄',
    steps: [
      { text: 'Rót 20 mL FeSO4 và 15 mL H2SO4 loãng vào bình tam giác', check: (s, log) => log.some((l) => l.chem === 'FeSO4') && log.some((l) => l.chem === 'H2SO4') },
      { text: 'Rót 10 mL dung dịch thuốc tím KMnO4 vào hỗn hợp', check: (s, log) => log.some((l) => l.chem === 'KMnO4') },
      { text: 'Quan sát thuốc tím KMnO4 mất màu tím, tạo muối Fe³⁺ vàng nhạt', check: (s, log) => log.some((l) => l.events?.some((e) => e.type === 'oxi-hoa')) },
    ],
  },
  {
    id: 'ex-ph',
    name: 'H. Đo pH & Khảo sát môi trường dung dịch',
    steps: [
      { text: 'Chuẩn bị một dung dịch axit hoặc bazơ trong dụng cụ', check: (s, log) => log.some((l) => l.act === 'pour' && !['Quy', 'PPT', 'MO'].includes(l.chem)) },
      { text: 'Nhấn "Đo pH" hoặc bấm vào Máy đo pH trên bàn 3D', check: (s, log) => log.some((l) => l.act === 'measure') },
      { text: 'Thêm chất chỉ thị (Quỳ tím / PPT / Metyl da cam) để kiểm chứng màu', check: (s, log) => log.some((l) => l.act === 'pour' && ['Quy', 'PPT', 'MO'].includes(l.chem)) },
    ],
  },
  {
    id: 'ex-golden-rain',
    name: 'I. Hiệu ứng Mưa Vàng PbI₂ & Phân hủy H₂O₂',
    steps: [
      { text: 'Rót dung dịch Pb(NO3)2 vào cốc hoặc ống nghiệm', check: (s, log) => log.some((l) => l.chem === 'PbNO32') },
      { text: 'Rót thêm dung dịch KI để quan sát kết tủa Mưa Vàng PbI2', check: (s, log) => log.some((l) => l.events?.some((e) => e.eq?.includes('PbI2'))) },
      { text: 'Thử nghiệm thêm H2O2 + xúc tác rắn MnO2 tạo bọt khí O2 mạnh', check: (s, log) => log.some((l) => l.events?.some((e) => e.eq?.includes('2H2O2'))) },
    ],
  },
  {
    id: 'ex-burette',
    name: 'J. Chuẩn độ nhỏ giọt bằng Burette 50 mL',
    steps: [
      { text: 'Chọn Bình tam giác, rót 20 mL HCl và nhỏ chỉ thị Phenolphthalein', check: (s) => (s.erlenmeyer1?.indicators || []).includes('PPT') && volumeOf(s.erlenmeyer1) >= 15 },
      { text: 'Mở van Burette (hoặc bấm Nhỏ giọt) nhỏ NaOH xuống Bình tam giác', check: (s, log) => log.some((l) => l.act === 'burette') },
      { text: 'Đạt điểm tương đương — dung dịch chuyển hồng (pH > 8.3) trên đồ thị', check: (s) => (s.erlenmeyer1?.pH ?? 7) > 8.3 },
    ],
  },
  {
    id: 'ex-flame',
    name: 'K. Quang phổ màu ngọn lửa ion kim loại',
    steps: [
      { text: 'Bật đèn Bunsen và chuyển sang chế độ Phòng tối Quang học', check: (s) => Boolean(s._burnerLit) },
      { text: 'Thử ion Cu²⁺ (xanh lục ngọc 515 nm) hoặc Na⁺ (vàng 589 nm)', check: (s) => s._flameIon && s._flameIon !== 'default' },
      { text: 'So sánh bước sóng phát xạ của ít nhất 2 ion kim loại', check: (s, log) => log.filter((l) => l.act === 'flame').length >= 2 },
    ],
  },
  {
    id: 'ex-multi-station',
    name: 'L. Khám phá Đa trạm: Điện phân · DNA · Lăng kính',
    steps: [
      { text: 'Tăng điện áp Trạm Điện phân DC lên > 4V để quan sát mạ đồng / bọt khí', check: (s) => (s._voltage || 0) >= 4 },
      { text: 'Chiếu mô hình Phân tử 3D hoặc Xoắn kép DNA trên bệ Hologram', check: (s, log) => log.some((l) => l.act === 'molecule') },
      { text: 'Mở Kính hiển vi quang học hoặc khảo sát Tán sắc 7 màu qua Lăng kính', check: (s, log) => log.some((l) => l.act === 'scope' || l.act === 'optics') },
    ],
  },
];

const CAT_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'axit', label: 'Axit' },
  { id: 'bazơ', label: 'Bazơ' },
  { id: 'muối', label: 'Muối' },
  { id: 'kim-loai', label: 'Rắn / KL' },
  { id: 'chi-thi', label: 'Chỉ thị' },
];

/* ---------- Âm thanh (WebAudio, synthesized) ---------- */
let AC = null;
const ac = () => { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; };
const sfx = {
  click() { try { const a = ac(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 660; g.gain.setValueAtTime(0.04, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.08); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.09); } catch {} },
  pour() { try { const a = ac(), o = a.createOscillator(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 7; lg.gain.value = 220; l.connect(lg).connect(o.frequency); o.type = 'sine'; g.gain.setValueAtTime(0.03, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.1); o.connect(g).connect(a.destination); o.start(); l.start(); o.stop(a.currentTime + 1.15); l.stop(a.currentTime + 1.15); } catch {} },
  done() { try { const a = ac(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.05, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.35); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.4); } catch {} },
};

const newSession = () => ({
  id: 'L' + Date.now().toString(36).toUpperCase(),
  startedAt: new Date().toISOString(),
  experiment: null,
  log: [],
  completedSteps: 0,
});

const initialContainers = (empty = false) => {
  const mk = (id, kind, name, shortName, maxMl, position, preload = []) => {
    const base = createContainer(id, maxMl);
    if (!empty) {
      for (const [cid, qty] of preload) {
        addChemical(base, cid, qty);
      }
    }
    return {
      id,
      kind,
      name,
      shortName,
      maxMl,
      position,
      ...base,
      volume: volumeOf(base),
      color: dominantColor(base),
      pH: computePH(base),
    };
  };
  return {
    beaker1: mk('beaker1', 'beaker', 'Cốc thủy tinh 250 mL', 'Cốc 250mL', 250, [-0.46, 0.528, -0.32], [['H2O', 80]]),
    cylinder1: mk('cylinder1', 'cylinder', 'Ống đong 100 mL', 'Ống đong 100mL', 100, [0.34, 0.482, -0.35], [['CuSO4', 55]]),
    erlenmeyer1: mk('erlenmeyer1', 'erlenmeyer', 'Bình tam giác 250 mL', 'Bình tam giác', 250, [0.88, 0.502, -0.3], [['HCl', 25], ['PPT', 1]]),
    tube1: mk('tube1', 'tube', 'Ống nghiệm 1 (30 mL)', 'Ống nghiệm 1', 30, [-1.26, 0.48, -0.32], [['PbNO32', 15]]),
    tube2: mk('tube2', 'tube', 'Ống nghiệm 2 (30 mL)', 'Ống nghiệm 2', 30, [-1.16, 0.48, -0.32], [['FeCl3', 15]]),
    tube3: mk('tube3', 'tube', 'Ống nghiệm 3 (30 mL)', 'Ống nghiệm 3', 30, [-1.06, 0.48, -0.32], [['KMnO4', 12]]),
  };
};

const cloneContainers = (cs) => JSON.parse(JSON.stringify(cs));

export default function Lab3D() {
  const { user } = useAuth();
  const [containers, setContainers] = useState(initialContainers);
  const [selected, setSelected] = useState('beaker1');
  const [chem, setChem] = useState('HCl');
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [amount, setAmount] = useState(20);
  const [transferTarget, setTransferTarget] = useState('erlenmeyer1');
  const [log, setLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [session, setSession] = useState(newSession);
  const [experimentId, setExperimentId] = useState('ex-acid-base');
  const [activeDrawer, setActiveDrawer] = useState(null); // null | 'chems' | 'stations' | 'monitor' | 'guide' | 'log'
  const [view, setView] = useState('bench');
  const [focus, setFocus] = useState(null);
  const [walk, setWalk] = useState(false);
  const [sound, setSound] = useState(true);
  const [quality, setQuality] = useState('high');
  const [toast, setToast] = useState(null);
  const [webgl, setWebgl] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [burnerLit, setBurnerLit] = useState(false);
  const [flameIon, setFlameIon] = useState('default');
  const [lightMode, setLightMode] = useState('day'); // 'day' | 'dark' | 'cyber'
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  // Trạm Burette chuẩn độ
  const [buretteLevel, setBuretteLevel] = useState(50);
  const [buretteTitrant, setBuretteTitrant] = useState('NaOH');
  const [buretteDripping, setBuretteDripping] = useState(false);
  // Trạm Điện phân 3D
  const [electrolyteId, setElectrolyteId] = useState('CuSO4');
  const [electrolysisVoltage, setElectrolysisVoltage] = useState(0);
  // Trạm Phân tử 3D & DNA
  const [moleculeId, setMoleculeId] = useState('H2O');
  const [moleculeSpaceFill, setMoleculeSpaceFill] = useState(false);
  // Trạm Quang học & Con lắc đơn 3D
  const [laserMode, setLaserMode] = useState('white');
  const [prismAngle, setPrismAngle] = useState(0);
  const [pendulumLength, setPendulumLength] = useState(0.42);
  const [gravity, setGravity] = useState(9.81);
  const [pendulumRunning, setPendulumRunning] = useState(true);
  // Kính hiển vi & Gia sư Đa AI & Đồ thị chuẩn độ & Rửa vòi nước & Cinema HUD
  const [scopeOpen, setScopeOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [washing, setWashing] = useState(false);
  const [cinema, setCinema] = useState(false);
  const [telemetry, setTelemetry] = useState([{ idx: 0, pH: 7, temp: 25 }]);
  const [hover, setHover] = useState(null);
  const [locked, setLocked] = useState(false);
  const hoverRef = useRef(null); hoverRef.current = hover;
  const interactRef = useRef(null);
  const keysRef = useRef({});

  /* Theo dõi pointer lock */
  useEffect(() => {
    const h = () => setLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', h);
    return () => document.removeEventListener('pointerlockchange', h);
  }, []);

  const selectedContainer = containers[selected] || containers.beaker1;
  const experiment = EXPERIMENTS.find((e) => e.id === experimentId);

  /* WebGL check */
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setWebgl(!!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))));
    } catch { setWebgl(false); }
  }, []);

  /* Tự động lưu vào localStorage mỗi khi thao tác */
  useEffect(() => {
    if (log.length === 0) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        session,
        experimentId,
        containers,
        log: log.slice(-40),
        savedAt: Date.now(),
      }));
    } catch {}
  }, [containers, log, experimentId, session]);

  /* Toast auto-hide */
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  /* Keyboard: WASD + F + Tab + Esc (bỏ qua khi đang gõ chữ trong ô input) */
  useEffect(() => {
    const down = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') e.target.blur?.();
        return;
      }
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (e.key === 'Escape') { setActiveDrawer(null); setShowcaseOpen(false); setFocus(null); }
      if (k === 'f') { setView((v) => (v === 'bench' ? 'room' : 'bench')); setFocus(null); }
      if (e.key === 'Tab') { e.preventDefault(); setActiveDrawer((d) => (d === 'chems' ? null : 'chems')); }
      if (k === 'e' && walk && hoverRef.current && containers[hoverRef.current]) {
        const c = containers[hoverRef.current];
        setSelected(c.id);
        setFocus({ id: c.id, pos: c.position });
      }
    };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [walk, containers]);

  const timersRef = useRef([]);
  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  /* Đèn cồn: gia nhiệt + kiểm tra phản ứng nhiệt phân (Cu(OH)2 -> CuO) */
  useEffect(() => {
    if (!burnerLit) return undefined;
    const iv = setInterval(() => {
      let pendingHeatEvents = [];
      setContainers((cs) => {
        const next = { ...cs };
        const heatEvents = [];
        for (const id of Object.keys(next)) {
          const v = next[id];
          if (!v || ((v.volume || 0) <= 0 && (v.precipitates || []).length === 0)) continue;
          const newTemp = Math.min(98, (v.temp || 25) + 3);
          const cloned = {
            ...v,
            temp: newTemp,
            precipitates: (v.precipitates || []).map((p) => ({ ...p })),
          };
          const evs = applyHeatReactions(cloned);
          if (evs.length) heatEvents.push({ instrument: id, events: evs });
          next[id] = cloned;
        }
        pendingHeatEvents = heatEvents;
        return next;
      });
      if (pendingHeatEvents.length) {
        setLog((l) => {
          let cur = l;
          for (const h of pendingHeatEvents) {
            cur = logEntry(cur, { act: 'heat', instrument: h.instrument, events: h.events });
          }
          return cur;
        });
        setToast(pendingHeatEvents[0].events.map((e) => e.text).join(' '));
      }
    }, 1400);
    return () => clearInterval(iv);
  }, [burnerLit]);

  /* Gas hết hạn tự tắt */
  useEffect(() => {
    const iv = setInterval(() => {
      setContainers((cs) => {
        let changed = false;
        const next = { ...cs };
        for (const id of Object.keys(next)) {
          const g = next[id]?.gas;
          if (g && g.until && Date.now() > g.until) { next[id] = { ...next[id], gas: null }; changed = true; }
        }
        return changed ? next : cs;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  /* Nhiệm vụ: auto check bước */
  const stepDone = useMemo(() => {
    if (!experiment) return [];
    const ctxState = {
      ...containers,
      pH: selectedContainer?.pH,
      _burnerLit: burnerLit,
      _flameIon: flameIon,
      _voltage: electrolysisVoltage,
    };
    return experiment.steps.map((st) => {
      try { return !!st.check(ctxState, log); } catch { return false; }
    });
  }, [experiment, containers, log, selectedContainer, burnerLit, flameIon, electrolysisVoltage]);

  /* Tự động ghi nhận điểm pH & Nhiệt độ cho đồ thị thời gian thực */
  useEffect(() => {
    if (!selectedContainer) return;
    const pH = computePH(selectedContainer);
    const temp = selectedContainer.temp || 25;
    setTelemetry((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.pH - pH) < 0.05 && Math.abs(last.temp - temp) < 0.5) return prev;
      return [...prev.slice(-29), { idx: prev.length, pH, temp }];
    });
  }, [selectedContainer]);

  useEffect(() => {
    if (!experiment) return;
    const done = stepDone.filter(Boolean).length;
    setSession((s) => (s.completedSteps !== done ? { ...s, completedSteps: done } : s));
    if (done === experiment.steps.length && done > 0 && sound) sfx.done();
  }, [stepDone, experiment, sound]);

  /* Danh sách hóa chất đã lọc theo tìm kiếm & danh mục */
  const filteredChems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return Object.values(CHEMS).filter((c) => {
      if (c.hiddenInList) return false;
      if (catFilter !== 'all') {
        if (catFilter === 'kim-loai' && c.state !== 'solid') return false;
        if (catFilter !== 'kim-loai' && c.cat !== catFilter) return false;
      }
      if (!q) return true;
      return (
        c.vi.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.en.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, catFilter]);

  /* Gợi ý phản ứng thông minh cho dụng cụ đang chọn */
  const suggestions = useMemo(() => suggestReactionsFor(selectedContainer), [selectedContainer]);

  if (!webgl) {
    return (
      <div className="lab3d-root">
        <div className="lab3d-fallback">
          <h2>Thiết bị không hỗ trợ WebGL</h2>
          <p>Phòng lab 3D cần WebGL. Hãy thử trình duyệt Chrome/Edge mới nhất hoặc dùng <a href="#games/lab">Phòng Lab 2D</a>.</p>
          <a className="lab-btn" href="#games">Quay lại ELEC AI</a>
        </div>
      </div>
    );
  }

  /* ================= THAO TÁC ================= */
  const pushUndo = () => {
    setHistory((h) => [...h.slice(-14), { containers: cloneContainers(containers), log: [...log] }]);
  };

  const undoLast = () => {
    if (!history.length) { setToast('Chưa có thao tác nào để hoàn tác.'); return; }
    const last = history[history.length - 1];
    setContainers(last.containers);
    setLog(last.log);
    setHistory((h) => h.slice(0, -1));
    if (sound) sfx.click();
    setToast('Đã hoàn tác thao tác vừa rồi.');
  };

  const updateContainer = (id, patch) => setContainers((cs) => ({ ...cs, [id]: { ...cs[id], ...patch } }));

  const selectVessel = (id, pos) => {
    if (!containers[id]) return;
    setSelected(id);
    const targetPos = pos || containers[id].position;
    setFocus({ id, pos: targetPos });
    if (transferTarget === id) {
      const other = Object.keys(containers).find((k) => k !== id);
      if (other) setTransferTarget(other);
    }
    if (sound) sfx.click();
  };

  const pour = () => {
    if (!chem || !selectedContainer) { setToast('Chọn hóa chất + dụng cụ trước đã!'); return; }
    pushUndo();
    if (sound) sfx.pour();
    const container = cloneContainers(selectedContainer);
    const isSolid = CHEMS[chem]?.state === 'solid';
    const qty = isSolid ? (CHEMS[chem].solidGram || 3) : Number(amount);
    const res = addChemical(container, chem, qty);
    if (!res.ok) { setToast(res.reason); return; }
    const pourColor = CHEMS[chem]?.color || '#cfe3f2';
    const nextColor = dominantColor(container);
    const hasRx = Boolean(res.events?.length && res.events.some((e) => e.type !== 'no-reaction' && e.type !== 'solid-added'));
    updateContainer(selected, {
      ...container,
      volume: volumeOf(container),
      color: nextColor,
      pH: computePH(container),
      pouring: !isSolid,
      pourColor,
      ...(hasRx ? { reactionFx: { color: nextColor, kind: res.events[0]?.type, ts: Date.now() } } : {}),
    });
    if (!isSolid) later(() => updateContainer(selected, { pouring: false }), 1350);
    setLog((l) => logEntry(l, {
      act: 'pour',
      chem,
      ml: qty,
      isSolid,
      instrument: selected,
      events: res.events,
    }));
    if (res.events?.length) setToast(res.events.map((e) => e.text).join(' '));
  };

  /* San / đổ dung dịch từ dụng cụ đang chọn sang dụng cụ khác */
  const pourBetweenVessels = () => {
    if (!selectedContainer || !transferTarget || transferTarget === selected) return;
    const dst = containers[transferTarget];
    if (!dst) return;
    pushUndo();
    const srcClone = cloneContainers(selectedContainer);
    const dstClone = cloneContainers(dst);
    const res = transferLiquid(srcClone, dstClone, Number(amount));
    if (!res.ok) { setToast(res.reason); return; }
    if (sound) sfx.pour();
    const dstColor = dominantColor(dstClone);
    const hasRx = Boolean(res.events?.length && res.events.some((e) => e.type !== 'no-reaction'));
    setContainers((cs) => ({
      ...cs,
      [selected]: {
        ...srcClone,
        volume: volumeOf(srcClone),
        color: dominantColor(srcClone),
        pH: computePH(srcClone),
      },
      [transferTarget]: {
        ...dstClone,
        volume: volumeOf(dstClone),
        color: dstColor,
        pH: computePH(dstClone),
        pouring: true,
        pourColor: selectedContainer.color || '#cfe3f2',
        ...(hasRx ? { reactionFx: { color: dstColor, kind: res.events[0]?.type, ts: Date.now() } } : {}),
      },
    }));
    later(() => updateContainer(transferTarget, { pouring: false }), 1350);
    setLog((l) => logEntry(l, {
      act: 'transfer',
      from: selected,
      instrument: transferTarget,
      ml: res.movedMl,
      events: res.events,
    }));
    if (res.events?.length) setToast(`Rót sang ${dst.shortName}: ` + res.events.map((e) => e.text).join(' '));
    else setToast(`Đã rót ${res.movedMl} mL từ ${selectedContainer.shortName} sang ${dst.shortName}.`);
  };

  /* 1-Click trình diễn các phản ứng hóa học đẹp mắt nhất ngay trên Cốc 250mL / Bình tam giác */
  const runShowcaseReaction = (preset) => {
    pushUndo();
    if (preset === 'titration-pink') {
      setSelected('erlenmeyer1');
      setView('titration');
      setFocus(null);
      const base = createContainer('erlenmeyer1', 250);
      addChemical(base, 'HCl', 20);
      addChemical(base, 'PPT', 1);
      updateContainer('erlenmeyer1', {
        ...base,
        volume: volumeOf(base),
        color: dominantColor(base),
        pH: computePH(base),
      });
      later(() => dripFromBurette(25), 420);
      return;
    }

    const targetId = 'beaker1';
    setSelected(targetId);
    setView('bench');
    setFocus(null);
    const clean = createContainer(targetId, 250);
    const steps = {
      'golden-rain': [['PbNO32', 45], ['KI', 45]],
      'volcano': [['NaHCO3', 50], ['HCl', 40]],
      'oxygen-burst': [['H2O2', 65], ['MnO2', 2]],
      'royal-complex': [['CuSO4', 35], ['NH3', 55]],
      'copper-no2': [['HNO3', 55], ['Cu_wire', 3]],
    }[preset];
    if (!steps) return;

    const [firstChem, firstQty] = steps[0];
    const [secondChem, secondQty] = steps[1];
    addChemical(clean, firstChem, firstQty);
    if (sound) sfx.pour();
    updateContainer(targetId, {
      ...clean,
      volume: volumeOf(clean),
      color: dominantColor(clean),
      pH: computePH(clean),
      pouring: CHEMS[firstChem]?.state !== 'solid',
      pourColor: CHEMS[firstChem]?.color || '#cfe3f2',
    });

    later(() => {
      const stage2 = cloneContainers({ ...containers[targetId], ...clean });
      const res = addChemical(stage2, secondChem, secondQty);
      const nextColor = dominantColor(stage2);
      if (sound) sfx.pour();
      updateContainer(targetId, {
        ...stage2,
        volume: volumeOf(stage2),
        color: nextColor,
        pH: computePH(stage2),
        pouring: CHEMS[secondChem]?.state !== 'solid',
        pourColor: CHEMS[secondChem]?.color || '#cfe3f2',
        reactionFx: { color: nextColor, kind: res.events?.[0]?.type || 'kettua', ts: Date.now() },
      });
      setLog((l) => logEntry(l, {
        act: 'pour',
        chem: secondChem,
        ml: secondQty,
        isSolid: CHEMS[secondChem]?.state === 'solid',
        instrument: targetId,
        events: res.events,
      }));
      if (res.events?.length) setToast(res.events.map((e) => e.text).join(' '));
      later(() => updateContainer(targetId, { pouring: false }), 1350);
    }, 850);
  };

  /* Rửa sạch riêng dụng cụ đang chọn + bật vòi nước chảy thật ở bồn rửa */
  const washSelected = () => {
    if (!selectedContainer) return;
    pushUndo();
    const clean = createContainer(selected, selectedContainer.maxMl);
    updateContainer(selected, {
      ...clean,
      volume: 0,
      color: '#dfe9f3',
      pH: 7,
      pouring: false,
      reactionFx: null,
    });
    setWashing(true);
    later(() => setWashing(false), 1600);
    setLog((l) => logEntry(l, { act: 'wash', instrument: selected }));
    if (sound) sfx.click();
    setToast(`Đã rửa sạch ${selectedContainer.name}.`);
  };

  /* Khuấy — tăng phản ứng + hiệu ứng xoáy */
  const stir = () => {
    if (!selectedContainer || (volumeOf(selectedContainer) <= 0 && solidMassOf(selectedContainer) <= 0)) {
      setToast('Dụng cụ trống — không có gì để khuấy.');
      return;
    }
    updateContainer(selected, { stir: true });
    later(() => updateContainer(selected, { stir: false }), 2200);
    setLog((l) => logEntry(l, { act: 'stir', instrument: selected }));
    setToast('Đã khuấy đều hỗn hợp.');
  };

  const measurePH = () => {
    if (!selectedContainer || volumeOf(selectedContainer) <= 0) { setToast('Dụng cụ chưa có dung dịch để đo pH.'); return; }
    const pH = computePH(selectedContainer);
    setLog((l) => logEntry(l, { act: 'measure', instrument: selected, pH }));
    setToast(`pH đo được (${selectedContainer.shortName}): ${pH.toFixed(2)} — ${pH < 6.5 ? 'môi trường AXIT' : pH > 7.5 ? 'môi trường BAZƠ' : 'môi trường TRUNG TÍNH'}`);
    if (sound) sfx.click();
  };

  const resetSession = () => {
    clearTimers();
    pushUndo();
    setContainers(initialContainers());
    setLog([]);
    setSession(newSession());
    setBurnerLit(false);
    setToast('Đã đặt lại toàn bộ bàn thí nghiệm.');
  };

  /* ================= LƯU & KHÔI PHỤC PHIÊN ================= */
  const saveCloud = async () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        session, experimentId, containers, log: log.slice(-50), savedAt: Date.now(),
      }));
    } catch {}
    if (!user?.uid) { setToast('Đã lưu phiên vào bộ nhớ trình duyệt trên máy này.'); return; }
    setSaveState('saving');
    try {
      const payload = {
        uid: user.uid,
        sessionId: session.id,
        experimentId: experimentId || null,
        experiment: experiment?.name || 'Tự do',
        containers,
        log: log.slice(-50),
        completedSteps: session.completedSteps,
        totalSteps: experiment?.steps.length || 0,
        at: Date.now(),
      };
      await setDoc(doc(db, 'users', user.uid, 'lab3dSessions', session.id), payload);
      setSaveState('saved');
      setToast('Đã lưu toàn bộ trạng thái bàn thí nghiệm lên Cloud.');
      later(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
      setToast('Đã lưu bản sao cục bộ trên máy (Cloud tạm bận).');
      later(() => setSaveState('idle'), 3500);
    }
  };

  const loadLast = async () => {
    // 1. Thử đọc từ Cloud nếu đã đăng nhập
    if (user?.uid) {
      try {
        const snap = await getDocs(query(collection(db, 'users', user.uid, 'lab3dSessions'), limit(5)));
        const rows = snap.docs.map((d) => d.data()).sort((a, b) => (b.at || 0) - (a.at || 0));
        if (rows[0]?.containers) {
          pushUndo();
          setContainers({ ...initialContainers(), ...rows[0].containers });
          setLog(rows[0].log || []);
          if (rows[0].experimentId !== undefined) setExperimentId(rows[0].experimentId);
          setToast(`Đã khôi phục phiên ${rows[0].sessionId} (${rows[0].experiment}).`);
          return;
        }
      } catch {}
    }
    // 2. Fallback: khôi phục từ localStorage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.containers) {
          pushUndo();
          setContainers({ ...initialContainers(), ...parsed.containers });
          setLog(parsed.log || []);
          if (parsed.experimentId !== undefined) setExperimentId(parsed.experimentId);
          setToast('Đã khôi phục phiên làm việc gần nhất từ máy.');
          return;
        }
      }
    } catch {}
    setToast('Chưa có phiên thí nghiệm nào được lưu trước đó.');
  };

  /* Xuất báo cáo thí nghiệm ra file Markdown */
  const exportLabReport = () => {
    const eqList = log.flatMap((l) => l.events || []).filter((e) => e.eq || e.text);
    const lines = [
      `# BÁO CÁO THỰC HÀNH HÓA HỌC 3D — ELEC AI`,
      `- **Mã phiên:** ${session.id}`,
      `- **Thời gian:** ${new Date().toLocaleString('vi-VN')}`,
      `- **Bài thực hành:** ${experiment ? experiment.name : 'Tự do khám phá'}`,
      experiment ? `- **Tiến độ:** Hoàn thành ${session.completedSteps}/${experiment.steps.length} bước` : '',
      ``,
      `## 1. Trạng thái các dụng cụ trên bàn`,
      ...Object.values(containers).map((v) => {
        const vol = volumeOf(v).toFixed(0);
        const ph = computePH(v).toFixed(1);
        const precips = (v.precipitates || []).map((p) => p.formula || 'Kết tủa').join(', ');
        return `- **${v.name}**: ${vol} mL · pH ${ph} · ${v.temp || 25}°C${precips ? ` · Kết tủa: ${precips}` : ''}`;
      }),
      ``,
      `## 2. Hiện tượng & Phương trình hóa học ghi nhận`,
      ...(eqList.length
        ? eqList.map((e, i) => `${i + 1}. ${e.eq ? `\`${e.eq}\` — ` : ''}${e.text}`)
        : ['_Chưa có phản ứng hóa học nào được ghi nhận._']),
      ``,
      `## 3. Nhật ký thao tác chi tiết`,
      ...(log.length
        ? log.map((l) => {
            const t = new Date(l.at).toLocaleTimeString('vi-VN');
            if (l.act === 'pour') return `- [${t}] Cho ${l.ml}${l.isSolid ? 'g' : ' mL'} ${chemLabel(CHEMS[l.chem])} vào ${containers[l.instrument]?.name || l.instrument}`;
            if (l.act === 'transfer') return `- [${t}] Rót ${l.ml} mL từ ${containers[l.from]?.shortName} sang ${containers[l.instrument]?.shortName}`;
            if (l.act === 'measure') return `- [${t}] Đo pH tại ${containers[l.instrument]?.shortName}: pH = ${l.pH?.toFixed(2)}`;
            if (l.act === 'wash') return `- [${t}] Rửa sạch ${containers[l.instrument]?.shortName}`;
            return `- [${t}] Thao tác ${l.act} trên ${containers[l.instrument]?.shortName || ''}`;
          })
        : ['_Chưa có thao tác._']),
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-lab3d-${session.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Đã tải xuống Báo cáo thí nghiệm (.md).');
  };

  const fullscreen = () => {
    const el = document.getElementById('lab3d-root');
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => setToast('Trình duyệt chặn fullscreen.'));
    else document.exitFullscreen?.();
  };

  /* Nhỏ giọt từ Burette 50mL xuống Bình tam giác (erlenmeyer1) */
  const dripFromBurette = (dropMl = 2) => {
    if (buretteLevel <= 0) {
      setToast('Burette đã cạn — nhấn "Nạp đầy 50 mL" để tiếp tục chuẩn độ.');
      return;
    }
    const actual = Math.min(buretteLevel, dropMl);
    const flask = containers.erlenmeyer1;
    if (!flask) return;
    pushUndo();
    const cloned = cloneContainers(flask);
    const res = addChemical(cloned, buretteTitrant, actual);
    if (!res.ok) { setToast(res.reason); return; }
    if (sound) sfx.pour();
    setBuretteLevel((lvl) => Math.max(0, +(lvl - actual).toFixed(1)));
    setBuretteDripping(true);
    later(() => setBuretteDripping(false), 750);
    setSelected('erlenmeyer1');
    const nextErlenColor = dominantColor(cloned);
    updateContainer('erlenmeyer1', {
      ...cloned,
      volume: volumeOf(cloned),
      color: nextErlenColor,
      pH: computePH(cloned),
      reactionFx: { color: nextErlenColor, kind: 'titration', ts: Date.now() },
    });
    setLog((l) => logEntry(l, {
      act: 'burette',
      chem: buretteTitrant,
      ml: actual,
      instrument: 'erlenmeyer1',
      events: res.events,
    }));
    const newPH = computePH(cloned);
    setToast(res.events?.length
      ? `Burette nhỏ ${actual} mL ${CHEMS[buretteTitrant]?.formula}: ${res.events.map((e) => e.text).join(' ')} (pH = ${newPH.toFixed(2)})`
      : `Burette nhỏ ${actual} mL ${CHEMS[buretteTitrant]?.formula} vào Bình tam giác (pH = ${newPH.toFixed(2)})`);
  };

  const pickFlameIon = (ionId) => {
    setFlameIon(ionId);
    const info = FLAME_IONS.find((f) => f.id === ionId);
    if (ionId !== 'default') {
      setBurnerLit(true);
      setLog((l) => logEntry(l, { act: 'flame', chem: info?.formula, instrument: 'burner', events: [{ text: `Phổ ngọn lửa ${info?.ion}: ${info?.note}` }] }));
      setToast(`Phổ ngọn lửa ${info?.ion} (${info?.nm}): ${info?.note}`);
    } else {
      setToast('Đã rút que thử muối — đèn Bunsen về ngọn lửa chuẩn.');
    }
    if (sound) sfx.click();
  };

  const jumpToStation = (vKey) => {
    setView(vKey);
    setFocus(null);
    if (['titration', 'electrolysis', 'molecules', 'optics'].includes(vKey)) {
      setActiveDrawer('stations');
    }
    if (sound) sfx.click();
  };

  const toggleDrawer = (id) => {
    setActiveDrawer((cur) => (cur === id ? null : id));
    if (sound) sfx.click();
  };

  const cycleLightMode = () => {
    setLightMode((m) => (m === 'day' ? 'dark' : m === 'dark' ? 'cyber' : 'day'));
    if (sound) sfx.click();
  };

  /* ================= RENDER ================= */
  const stepStatus = experiment ? stepDone : [];
  const mainVessels = [containers.beaker1, containers.cylinder1, containers.erlenmeyer1];
  const tubeVessels = [containers.tube1, containers.tube2, containers.tube3];
  const curPH = computePH(selectedContainer);
  const curVol = volumeOf(selectedContainer);
  const curSolid = solidMassOf(selectedContainer);
  const curTotalMass = totalMassOf(selectedContainer);
  const curElectrolyte = ELECTROLYTES[electrolyteId] || ELECTROLYTES.CuSO4;
  const curMolecule = MOLECULES_3D.find((m) => m.id === moleculeId) || MOLECULES_3D[0];
  const curFlame = FLAME_IONS.find((f) => f.id === flameIon) || FLAME_IONS[0];
  const latestEqObj = [...log].reverse().flatMap((l) => l.events || []).find((e) => e.eq);
  const latestEquation = latestEqObj?.eq || '';

  const labAiContextText = [
    `Góc nhìn / Trạm hiện tại: ${view}`,
    `Dụng cụ đang chọn: ${selectedContainer?.name} (${curVol.toFixed(0)}/${selectedContainer?.maxMl} mL, pH=${curPH.toFixed(2)}, T=${selectedContainer?.temp || 25}°C)`,
    `Thành phần trong dụng cụ: ${(selectedContainer?.contents || []).map((c) => `${CHEMS[c.id]?.formula || c.id} (${c.gram ? c.gram + 'g' : Math.round(c.mL || 0) + 'mL'})`).join(', ') || 'Trống'}`,
    `Kết tủa: ${(selectedContainer?.precipitates || []).map((p) => p.formula).join(', ') || 'Không có'}`,
    `Đèn Bunsen: ${burnerLit ? `Đang bật (ion ${curFlame.ion}, ${curFlame.nm})` : 'Tắt'}`,
    `Trạm Điện phân DC: ${curElectrolyte.name} · Điện áp ${electrolysisVoltage.toFixed(1)}V (${curElectrolyte.eq})`,
    `Phân tử 3D đang chiếu: ${curMolecule.name} (${curMolecule.geometry}, ${curMolecule.hybrid})`,
    `Phản ứng ghi nhận gần nhất: ${log.flatMap((l) => l.events || []).slice(-4).map((e) => e.eq || e.text).join(' ; ') || 'Chưa có'}`,
  ].join('\n');

  return (
    <div
      className={
        'lab3d-root'
        + (walk ? ' walking' : '')
        + (cinema ? ' cinema' : '')
        + (lightMode !== 'day' ? ' theme-dark' : ' theme-light')
      }
      id="lab3d-root"
    >
      {/* ===== CẢNH 3D ===== */}
      <div className="lab3d-canvas">
        <LabScene
          vessels={mainVessels}
          testTubes={tubeVessels}
          burnerLit={burnerLit}
          flameIon={flameIon}
          lightMode={lightMode}
          washing={washing}
          onToggleBurner={() => {
            setBurnerLit((b) => {
              const next = !b;
              setToast(next ? 'Đã bật đèn Bunsen — đang đun nóng các dụng cụ.' : 'Đã tắt đèn Bunsen.');
              return next;
            });
          }}
          buretteLevel={buretteLevel}
          buretteTitrant={buretteTitrant}
          buretteDripping={buretteDripping}
          onBuretteDrip={() => dripFromBurette(2)}
          beakerStirring={Boolean(containers.beaker1?.stir)}
          beakerTemp={containers.beaker1?.temp || 25}
          onToggleStir={() => {
            setSelected('beaker1');
            updateContainer('beaker1', { stir: !containers.beaker1?.stir });
            setToast(containers.beaker1?.stir ? 'Đã tắt máy khuấy từ.' : 'Đã bật máy khuấy từ 600 RPM.');
          }}
          electrolyteId={electrolyteId}
          electrolysisVoltage={electrolysisVoltage}
          moleculeId={moleculeId}
          moleculeSpaceFill={moleculeSpaceFill}
          laserMode={laserMode}
          prismAngle={prismAngle}
          pendulumLength={pendulumLength}
          gravity={gravity}
          pendulumRunning={pendulumRunning}
          onOpenMicroscope={() => {
            setScopeOpen(true);
            setLog((l) => logEntry(l, { act: 'scope', instrument: 'microscope' }));
          }}
          onJumpView={jumpToStation}
          phDisplay={curVol > 0 ? curPH : null}
          scaleMass={curTotalMass}
          latestEquation={latestEquation}
          onMeasurePH={measurePH}
          onPickChem={(id) => {
            setChem(id);
            setToast(`Đã chọn từ kệ: ${chemLabel(CHEMS[id])}`);
            if (sound) sfx.click();
          }}
          selectedChem={chem}
          onWashSelected={washSelected}
          onFpsHover={setHover}
          onFpsUse={() => { if (hoverRef.current) selectVessel(hoverRef.current); }}
          interactRef={interactRef}
          selected={selected}
          onSelect={selectVessel}
          view={view}
          focus={focus}
          walk={walk}
          keysRef={keysRef}
          quality={quality}
        />
        {/* Ngắm + hướng dẫn khi walk */}
        {walk && <div className="lab-crosshair" />}
        {walk && hover && !locked && <div className="lab-hover-hint">Nhấn <b>E</b> hoặc click để chọn: <b>{containers[hover]?.name || 'Dụng cụ'}</b></div>}
        {walk && !locked && <div className="lab-lock-hint">Bấm vào cảnh để khóa chuột — WASD di chuyển, chuột xoay nhìn, ESC thoát</div>}
      </div>

      <LabHud
        view={view} focus={focus} walk={walk} setWalk={setWalk} jumpToStation={jumpToStation}
        lightMode={lightMode} cycleLightMode={cycleLightMode} cinema={cinema} setCinema={setCinema}
        aiOpen={aiOpen} setAiOpen={setAiOpen}
        onOpenScope={() => { setScopeOpen(true); setLog((l) => logEntry(l, { act: 'scope', instrument: 'microscope' })); }}
        undoLast={undoLast} historyCount={history.length} fullscreen={fullscreen}
        activeDrawer={activeDrawer} toggleDrawer={toggleDrawer} setActiveDrawer={setActiveDrawer}
        containers={containers} selected={selected} selectVessel={selectVessel} selectedContainer={selectedContainer}
        curVol={curVol} curPH={curPH} curSolid={curSolid} curTotalMass={curTotalMass} telemetry={telemetry}
        chem={chem} setChem={setChem} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        catFilter={catFilter} setCatFilter={setCatFilter} catFilters={CAT_FILTERS}
        filteredChems={filteredChems} suggestions={suggestions}
        amount={amount} setAmount={setAmount} pour={pour}
        transferTarget={transferTarget} setTransferTarget={setTransferTarget} pourBetweenVessels={pourBetweenVessels}
        measurePH={measurePH} stir={stir} burnerLit={burnerLit} setBurnerLit={setBurnerLit}
        washSelected={washSelected} resetSession={resetSession}
        showcaseOpen={showcaseOpen} setShowcaseOpen={setShowcaseOpen} runShowcaseReaction={runShowcaseReaction}
        buretteTitrant={buretteTitrant} setBuretteTitrant={setBuretteTitrant}
        buretteLevel={buretteLevel} setBuretteLevel={(v) => { setBuretteLevel(v); setToast('Đã nạp đầy Burette 50 mL.'); }}
        dripFromBurette={dripFromBurette}
        flameIon={flameIon} pickFlameIon={pickFlameIon} curFlame={curFlame}
        electrolyteId={electrolyteId} setElectrolyteId={setElectrolyteId}
        electrolysisVoltage={electrolysisVoltage} setElectrolysisVoltage={setElectrolysisVoltage}
        curElectrolyte={curElectrolyte}
        moleculeId={moleculeId} setMoleculeId={setMoleculeId}
        moleculeSpaceFill={moleculeSpaceFill} setMoleculeSpaceFill={setMoleculeSpaceFill}
        curMolecule={curMolecule}
        onLogMolecule={(id) => setLog((l) => logEntry(l, { act: 'molecule', chem: id, instrument: 'hologram' }))}
        laserMode={laserMode} setLaserMode={setLaserMode} prismAngle={prismAngle} setPrismAngle={setPrismAngle}
        gravity={gravity} setGravity={setGravity} pendulumLength={pendulumLength} setPendulumLength={setPendulumLength}
        pendulumRunning={pendulumRunning} setPendulumRunning={setPendulumRunning}
        onLogOptics={(id) => setLog((l) => logEntry(l, { act: 'optics', chem: id, instrument: 'prism' }))}
        experiments={EXPERIMENTS} experiment={experiment} experimentId={experimentId} setExperimentId={setExperimentId}
        setSession={setSession} session={session} stepStatus={stepStatus}
        log={log} quality={quality} setQuality={setQuality} sound={sound} setSound={setSound}
        saveState={saveState} saveCloud={saveCloud} loadLast={loadLast} exportLabReport={exportLabReport}
        onClickSfx={() => { if (sound) sfx.click(); }}
      />

      {toast && <div className="lab-toast">{toast}</div>}
      <MicroscopeOverlay open={scopeOpen} onClose={() => setScopeOpen(false)} />
      <LabAiTutorDrawer open={aiOpen} onClose={() => setAiOpen(false)} labContextText={labAiContextText} />
    </div>
  );
}
