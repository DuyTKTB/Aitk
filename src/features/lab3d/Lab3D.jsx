/* ============================================================
   Lab3D.jsx — ELEC AI IMMERSIVE CHEMISTRY LAB 3D (Nâng cấp v2)
   Full-screen experience: cảnh 3D + HUD (kho hóa chất có tìm kiếm/lọc,
   6 dụng cụ tương tác gồm 3 ống nghiệm, san dung dịch giữa các cốc,
   hoàn tác, rửa cốc, 8 bài thực hành THPT, gợi ý phản ứng thông minh,
   lưu/khôi phục phiên thật & xuất báo cáo thí nghiệm).
   Engine: engine.js · Cảnh: Scene.jsx
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { db } from '../../lib/firebase.js';
import { doc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import {
  CHEMS, createContainer, addChemical, transferLiquid, applyHeatReactions,
  volumeOf, solidMassOf, totalMassOf, dominantColor, computePH,
  logEntry, chemLabel, suggestReactionsFor,
} from './engine.js';
import LabScene, { VIEWS } from './Scene.jsx';
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

const initialContainers = () => ({
  beaker1: { id: 'beaker1', kind: 'beaker', name: 'Cốc thủy tinh 250 mL', shortName: 'Cốc 250mL', maxMl: 250, position: [-0.55, 0.48, -0.32], ...createContainer('beaker1', 250) },
  cylinder1: { id: 'cylinder1', kind: 'cylinder', name: 'Ống đong 100 mL', shortName: 'Ống đong 100mL', maxMl: 100, position: [0.02, 0.48, -0.36], ...createContainer('cylinder1', 100) },
  erlenmeyer1: { id: 'erlenmeyer1', kind: 'erlenmeyer', name: 'Bình tam giác 250 mL', shortName: 'Bình tam giác', maxMl: 250, position: [0.58, 0.48, -0.3], ...createContainer('erlenmeyer1', 250) },
  tube1: { id: 'tube1', kind: 'tube', name: 'Ống nghiệm 1 (30 mL)', shortName: 'Ống nghiệm 1', maxMl: 30, position: [-1.15, 0.48, -0.32], ...createContainer('tube1', 30) },
  tube2: { id: 'tube2', kind: 'tube', name: 'Ống nghiệm 2 (30 mL)', shortName: 'Ống nghiệm 2', maxMl: 30, position: [-1.05, 0.48, -0.32], ...createContainer('tube2', 30) },
  tube3: { id: 'tube3', kind: 'tube', name: 'Ống nghiệm 3 (30 mL)', shortName: 'Ống nghiệm 3', maxMl: 30, position: [-0.95, 0.48, -0.32], ...createContainer('tube3', 30) },
});

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
  const [panelL, setPanelL] = useState(true);
  const [panelR, setPanelR] = useState(true);
  const [view, setView] = useState('bench');
  const [focus, setFocus] = useState(null);
  const [walk, setWalk] = useState(false);
  const [sound, setSound] = useState(true);
  const [quality, setQuality] = useState('high');
  const [toast, setToast] = useState(null);
  const [webgl, setWebgl] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [burnerLit, setBurnerLit] = useState(false);
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
      if (e.key === 'Escape') { setPanelL(true); setPanelR(true); setFocus(null); }
      if (k === 'f') { setView((v) => (v === 'bench' ? 'room' : 'bench')); setFocus(null); }
      if (e.key === 'Tab') { e.preventDefault(); setPanelL((p) => !p); }
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

  /* Đèn cồn: gia nhiệt + kiểm tra phản ứng nhiệt phân (Cu(OH)2 -> CuO) */
  useEffect(() => {
    if (!burnerLit) return undefined;
    const iv = setInterval(() => {
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
        if (heatEvents.length) {
          setLog((l) => {
            let cur = l;
            for (const h of heatEvents) {
              cur = logEntry(cur, { act: 'heat', instrument: h.instrument, events: h.events });
            }
            return cur;
          });
          setToast(heatEvents[0].events.map((e) => e.text).join(' '));
        }
        return next;
      });
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
    return experiment.steps.map((st) => {
      try { return !!st.check({ ...containers, pH: selectedContainer?.pH }, log); } catch { return false; }
    });
  }, [experiment, containers, log, selectedContainer]);

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
    const res = addChemical(container, chem, Number(amount));
    if (!res.ok) { setToast(res.reason); return; }
    const pourColor = CHEMS[chem]?.color || '#cfe3f2';
    updateContainer(selected, {
      ...container,
      volume: volumeOf(container),
      color: dominantColor(container),
      pH: computePH(container),
      pouring: true,
      pourColor,
    });
    setTimeout(() => updateContainer(selected, { pouring: false }), 900);
    setLog((l) => logEntry(l, {
      act: 'pour',
      chem,
      ml: CHEMS[chem]?.state === 'solid' ? (CHEMS[chem].solidGram || 3) : Number(amount),
      isSolid: CHEMS[chem]?.state === 'solid',
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
        color: dominantColor(dstClone),
        pH: computePH(dstClone),
        pouring: true,
        pourColor: selectedContainer.color || '#cfe3f2',
      },
    }));
    setTimeout(() => updateContainer(transferTarget, { pouring: false }), 900);
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

  /* Rửa sạch riêng dụng cụ đang chọn */
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
    });
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
    setTimeout(() => updateContainer(selected, { stir: false }), 2200);
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
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
      setToast('Đã lưu bản sao cục bộ trên máy (Cloud tạm bận).');
      setTimeout(() => setSaveState('idle'), 3500);
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

  /* ================= RENDER ================= */
  const stepStatus = experiment ? stepDone : [];
  const mainVessels = [containers.beaker1, containers.cylinder1, containers.erlenmeyer1];
  const tubeVessels = [containers.tube1, containers.tube2, containers.tube3];
  const curPH = computePH(selectedContainer);
  const curVol = volumeOf(selectedContainer);
  const curSolid = solidMassOf(selectedContainer);
  const curTotalMass = totalMassOf(selectedContainer);

  return (
    <div className={'lab3d-root' + (walk ? ' walking' : '')} id="lab3d-root">
      {/* ===== CẢNH 3D ===== */}
      <div className="lab3d-canvas">
        <LabScene
          vessels={mainVessels}
          testTubes={tubeVessels}
          burnerLit={burnerLit}
          onToggleBurner={() => {
            setBurnerLit((b) => {
              const next = !b;
              setToast(next ? 'Đã bật đèn cồn — đang đun nóng các dụng cụ.' : 'Đã tắt đèn cồn.');
              return next;
            });
          }}
          phDisplay={curVol > 0 ? curPH : null}
          scaleMass={curTotalMass}
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

        {/* Thanh chuyển góc nhìn + chọn nhanh 6 dụng cụ */}
        <div className="lab-view-buttons">
          {['room', 'bench', 'close'].map((v) => (
            <button key={v} className={'lab-vbtn' + (view === v && !focus ? ' on' : '')} onClick={() => { setView(v); setFocus(null); }}>
              {{ room: 'Toàn phòng', bench: 'Bàn thí nghiệm', close: 'Cận cảnh' }[v]}
            </button>
          ))}
          <button className={'lab-vbtn' + (walk ? ' on' : '')} onClick={() => setWalk((w) => !w)} title="Di chuyển góc nhìn thứ nhất bằng WASD">
            {walk ? 'Dừng đi lại' : 'Đi lại (WASD)'}
          </button>
          <span className="lab-vbtn-sep" />
          {Object.values(containers).map((v) => (
            <button
              key={v.id}
              className={'lab-vbtn vessel-pill' + (selected === v.id ? ' on' : '')}
              onClick={() => selectVessel(v.id, v.position)}
              title={`${v.name} (${volumeOf(v).toFixed(0)}/${v.maxMl} mL)`}
            >
              <span className="lab-vessel-dot" style={{ background: volumeOf(v) > 0 ? v.color : 'rgba(148,163,184,0.4)' }} />
              {v.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* ===== HUD TRÊN ===== */}
      <header className="lab-top">
        <div className="lab-brand">
          <span className="lab-logo"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" /></svg></span>
          <div>
            <b>ELEC AI Immersive Lab 3D</b>
            <small>{experiment ? experiment.name : 'Chế độ tự do khám phá'} · Phiên {session.id}</small>
          </div>
        </div>
        <div className="lab-top-right">
          <span className={'lab-save' + (saveState === 'saved' ? ' ok' : saveState === 'error' ? ' err' : '')}>
            {saveState === 'saving' ? 'Đang lưu…' : saveState === 'saved' ? 'Đã lưu Cloud' : saveState === 'error' ? 'Đã lưu máy' : 'Tự động lưu'}
          </span>
          {experiment && <span className="lab-progress">{session.completedSteps}/{experiment.steps.length} bước</span>}
          <button className="lab-ib" onClick={undoLast} disabled={!history.length} title="Hoàn tác thao tác trước">
            Hoàn tác ({history.length})
          </button>
          <select className="lab-mini" value={quality} onChange={(e) => setQuality(e.target.value)} title="Chất lượng đồ họa">
            <option value="high">Đồ họa: Cao</option>
            <option value="low">Đồ họa: Mượt</option>
          </select>
          <button className="lab-ib" onClick={() => setSound((s) => !s)} title={sound ? 'Tắt âm thanh' : 'Bật âm thanh'}>{sound ? 'Âm: Bật' : 'Âm: Tắt'}</button>
          <button className="lab-ib" onClick={fullscreen}>Toàn màn hình</button>
          <button className="lab-ib danger" onClick={() => { window.location.hash = 'games'; }}>Thoát</button>
        </div>
      </header>

      {/* ===== PANEL TRÁI: KHO HÓA CHẤT + TÌM KIẾM & LỌC ===== */}
      <aside className={'lab-panel left' + (panelL ? '' : ' collapsed')}>
        <button className="lab-panel-toggle" onClick={() => setPanelL((p) => !p)}>{panelL ? '‹ Kho hóa chất' : 'Kho ›'}</button>
        {panelL && (
          <div className="lab-panel-body">
            <div className="lab-search-wrap">
              <input
                className="lab-search"
                placeholder="Tìm tên, công thức (VD: CuSO4, KMnO4, NH3)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="lab-search-clear" onClick={() => setSearchQuery('')} title="Xóa tìm kiếm">×</button>
              )}
            </div>

            <div className="lab-cat-chips">
              {CAT_FILTERS.map((cf) => (
                <button
                  key={cf.id}
                  className={'lab-cat-chip' + (catFilter === cf.id ? ' on' : '')}
                  onClick={() => setCatFilter(cf.id)}
                >
                  {cf.label}
                </button>
              ))}
            </div>

            <div className="lab-chem-list">
              {filteredChems.map((c) => (
                <button
                  key={c.id}
                  className={'lab-chem' + (chem === c.id ? ' on' : '')}
                  onClick={() => { setChem(c.id); if (sound) sfx.click(); }}
                  title={`${c.en}${c.M ? ` — M = ${c.M} g/mol` : ''}`}
                >
                  <span className="lab-chem-dot" style={{ background: c.color }} />
                  <span className="lab-chem-name">{c.vi}</span>
                  <span className="lab-chem-formula">{c.formula}{c.conc ? ` ${c.conc}M` : ''}</span>
                  {c.hazard?.map((h) => <em key={h} className={'lab-hz hz-' + h}>{h}</em>)}
                </button>
              ))}
              {filteredChems.length === 0 && (
                <small className="lab-empty">Không tìm thấy hóa chất phù hợp.</small>
              )}
            </div>

            {chem && CHEMS[chem] && (
              <div className="lab-chem-info">
                <b>{chemLabel(CHEMS[chem])}</b>
                <small>
                  {CHEMS[chem].state === 'solution'
                    ? (CHEMS[chem].conc ? `Dung dịch ${CHEMS[chem].conc}M` : 'Dung môi tinh khiết')
                    : CHEMS[chem].state === 'solid'
                    ? `Chất rắn (${CHEMS[chem].solidGram || 3}g / lần thả)`
                    : 'Chất chỉ thị pH'}
                  {CHEMS[chem].M ? ` · M = ${CHEMS[chem].M} g/mol` : ''}
                </small>
                {CHEMS[chem].hazard?.length > 0 && (
                  <small className="lab-warn">An toàn: {CHEMS[chem].hazard.join(', ')} — đeo kính bảo hộ & găng tay.</small>
                )}
              </div>
            )}

            {/* Gợi ý phản ứng thông minh theo chất đang có trong cốc */}
            {suggestions.length > 0 && (
              <div className="lab-suggest-box">
                <b>Gợi ý thử nghiệm với {selectedContainer?.shortName}</b>
                {suggestions.map((sg) => (
                  <button
                    key={sg.chemId}
                    className="lab-suggest-item"
                    onClick={() => { setChem(sg.chemId); if (sound) sfx.click(); }}
                  >
                    <span className="lab-chem-dot" style={{ background: CHEMS[sg.chemId]?.color || '#ccc' }} />
                    <span><b>{CHEMS[sg.chemId]?.vi}</b>: {sg.reason}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ===== PANEL PHẢI: CHI TIẾT DỤNG CỤ & SỔ THÍ NGHIỆM ===== */}
      <aside className={'lab-panel right' + (panelR ? '' : ' collapsed')}>
        <button className="lab-panel-toggle" onClick={() => setPanelR((p) => !p)}>{panelR ? 'Sổ thí nghiệm ›' : '‹ Sổ'}</button>
        {panelR && (
          <div className="lab-panel-body">
            {/* Khung giám sát trực tiếp dụng cụ đang chọn */}
            <div className="lab-inspector">
              <div className="lab-inspector-head">
                <b>{selectedContainer?.name}</b>
                <button className="lab-wash-mini" onClick={washSelected} title="Rửa sạch dụng cụ này">Rửa cốc</button>
              </div>
              <div className="lab-inspector-metrics">
                <span>Thể tích: <b>{curVol.toFixed(0)}/{selectedContainer?.maxMl} mL</b></span>
                <span>Rắn/Tủa: <b>{curSolid.toFixed(1)} g</b></span>
                <span>Nhiệt độ: <b>{selectedContainer?.temp || 25}°C</b></span>
              </div>
              {/* Thang màu pH trực quan 0 -> 14 */}
              <div className="lab-ph-bar-wrap">
                <div className="lab-ph-bar-labels">
                  <span>Axit (0)</span>
                  <b>pH: {curVol > 0 ? curPH.toFixed(2) : '—'}</b>
                  <span>Bazơ (14)</span>
                </div>
                <div className="lab-ph-bar">
                  <div
                    className="lab-ph-pin"
                    style={{ left: `${Math.max(2, Math.min(98, (curPH / 14) * 100))}%` }}
                  />
                </div>
              </div>
              {/* Thành phần bên trong cốc */}
              {(selectedContainer?.contents?.length > 0 || selectedContainer?.precipitates?.length > 0) ? (
                <div className="lab-contents-tags">
                  {selectedContainer.contents.map((c, idx) => {
                    const ch = CHEMS[c.id];
                    if (!ch) return null;
                    return (
                      <span key={idx} className="lab-content-tag">
                        {ch.formula}: {ch.state === 'solid' ? `${(c.gram || 0).toFixed(1)}g` : `${(c.mL || 0).toFixed(0)}mL`}
                      </span>
                    );
                  })}
                  {(selectedContainer.precipitates || []).map((p, idx) => (
                    <span key={'p-' + idx} className="lab-content-tag precip">
                      ↓ {p.formula || 'Kết tủa'}
                    </span>
                  ))}
                </div>
              ) : (
                <small className="lab-empty">Dụng cụ đang trống.</small>
              )}
            </div>

            <div className="lab-section">
              <b>Bài thực hành có hướng dẫn (8 bài)</b>
              <select
                className="lab-mini wide"
                value={experimentId || ''}
                onChange={(e) => {
                  setExperimentId(e.target.value || null);
                  setSession((s) => ({ ...s, experiment: e.target.value }));
                }}
              >
                <option value="">Tự do khám phá</option>
                {EXPERIMENTS.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
              {experiment && (
                <ol className="lab-steps">
                  {experiment.steps.map((s, i) => (
                    <li key={i} className={stepStatus[i] ? 'done' : ''}>{s.text}</li>
                  ))}
                </ol>
              )}
            </div>

            <div className="lab-section">
              <b>Hiện tượng & phương trình</b>
              <div className="lab-eqs">
                {log.flatMap((l) => l.events || []).slice(-6).map((e, i) => (
                  <div key={i} className="lab-eq">
                    {e.eq && <code>{e.eq}</code>}
                    <small>{e.text}</small>
                  </div>
                ))}
                {log.flatMap((l) => l.events || []).length === 0 && <small className="lab-empty">Chưa quan sát được hiện tượng nào.</small>}
              </div>
            </div>

            <div className="lab-section">
              <b>Nhật ký thao tác ({log.length})</b>
              <div className="lab-log">
                {log.length === 0 && <small className="lab-empty">Chưa có thao tác nào.</small>}
                {log.slice(-14).reverse().map((l, i) => (
                  <div key={i} className="lab-log-row">
                    <small>{new Date(l.at).toLocaleTimeString('vi-VN')}</small>
                    <span>
                      {l.act === 'pour' && <>Cho <b>{l.ml}{l.isSolid ? 'g' : ' mL'} {chemLabel(CHEMS[l.chem])}</b> vào {containers[l.instrument]?.shortName || l.instrument}</>}
                      {l.act === 'transfer' && <>San <b>{l.ml} mL</b> từ {containers[l.from]?.shortName} sang <b>{containers[l.instrument]?.shortName}</b></>}
                      {l.act === 'measure' && <>Đo pH ({containers[l.instrument]?.shortName}) = <b>{l.pH?.toFixed(2)}</b></>}
                      {l.act === 'stir' && <>Khuấy đều {containers[l.instrument]?.shortName}</>}
                      {l.act === 'wash' && <>Rửa sạch {containers[l.instrument]?.shortName}</>}
                      {l.act === 'heat' && <>Đun nóng {containers[l.instrument]?.shortName}</>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lab-section row">
              <button className="lab-btn ghost" onClick={saveCloud}>Lưu phiên</button>
              <button className="lab-btn ghost" onClick={loadLast}>Khôi phục</button>
              <button className="lab-btn ghost" onClick={exportLabReport} title="Tải báo cáo thí nghiệm .md">Xuất BC</button>
            </div>
          </div>
        )}
      </aside>

      {/* ===== HUD DƯỚI: THAO TÁC THEO NGỮ CẢNH ===== */}
      <footer className="lab-bottom">
        <div className="lab-pour">
          <select className="lab-mini" value={chem || ''} onChange={(e) => setChem(e.target.value || null)}>
            <option value="">— chọn hóa chất —</option>
            {Object.values(CHEMS).filter((c) => !c.hiddenInList).map((c) => (
              <option key={c.id} value={c.id}>{c.vi} ({c.formula})</option>
            ))}
          </select>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={!CHEMS[chem]?.state || CHEMS[chem]?.state === 'indicator'}
            title="Lượng hóa chất thêm vào"
          />
          <b className="lab-amount">
            {CHEMS[chem]?.state === 'solid'
              ? `${CHEMS[chem].solidGram || 3} g`
              : CHEMS[chem]?.state === 'indicator'
              ? '3 giọt'
              : `${amount} mL`}
          </b>
          <button className="lab-btn" onClick={pour} disabled={!chem}>
            {CHEMS[chem]?.state === 'solid' ? 'Thả rắn' : CHEMS[chem]?.state === 'indicator' ? 'Nhỏ chỉ thị' : 'Rót vào'}
          </button>

          {/* San dung dịch sang dụng cụ khác */}
          <span className="lab-bottom-sep" />
          <select
            className="lab-mini"
            value={transferTarget}
            onChange={(e) => setTransferTarget(e.target.value)}
            title="Chọn dụng cụ đích để san dung dịch sang"
          >
            {Object.values(containers)
              .filter((v) => v.id !== selected)
              .map((v) => (
                <option key={v.id} value={v.id}>→ {v.shortName}</option>
              ))}
          </select>
          <button
            className="lab-btn ghost"
            onClick={pourBetweenVessels}
            disabled={curVol <= 0}
            title="San dung dịch từ dụng cụ đang chọn sang dụng cụ đích"
          >
            San {Math.min(amount, Math.round(curVol || amount))}mL
          </button>

          <span className="lab-bottom-sep" />
          <button className="lab-btn ghost" onClick={measurePH}>Đo pH</button>
          <button className="lab-btn ghost" onClick={stir}>Khuấy</button>
          <button
            className={'lab-btn ghost' + (burnerLit ? ' burner-on' : '')}
            onClick={() => setBurnerLit((b) => !b)}
          >
            Đèn cồn: {burnerLit ? 'ĐANG BẬT' : 'TẮT'}
          </button>
          <button className="lab-btn ghost" onClick={washSelected} title="Chỉ rửa dụng cụ đang chọn">Rửa cốc</button>
          <button className="lab-btn ghost danger" onClick={resetSession}>Đặt lại bàn</button>
        </div>
      </footer>

      {toast && <div className="lab-toast">{toast}</div>}
    </div>
  );
}
