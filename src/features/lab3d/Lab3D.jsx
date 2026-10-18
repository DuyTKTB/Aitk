/* ============================================================
   Lab3D.jsx — ELEC AI IMMERSIVE CHEMISTRY LAB 3D
   Full-screen experience: cảnh 3D + HUD (kho hóa chất, sổ thí
   nghiệm, thao tác rót) + nhiệm vụ có hướng dẫn + lưu phiên.
   Engine: engine.js · Cảnh: Scene.jsx
   GIỚI HẠN: mô hình THPT — không mô phỏng động học/bề mặt.
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { db } from '../../lib/firebase.js';
import { doc, setDoc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import {
  CHEMS, createContainer, addChemical, volumeOf, dominantColor, computePH,
  logEntry, chemLabel, REACTIONS,
} from './engine.js';
import LabScene, { VIEWS } from './Scene.jsx';
import './lab3d.css';

/* ---------- Nhiệm vụ có hướng dẫn ---------- */
const EXPERIMENTS = [
  {
    id: 'ex-acid-base', name: 'A. Axit + Bazơ (chỉ thị PPT)',
    steps: [
      { text: 'Rót 20 mL dung dịch HCl vào cốc thủy tinh', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'HCl' && l.ml >= 18 && l.ml <= 22) },
      { text: 'Thêm vài giọt Phenolphthalein', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'PPT') },
      { text: 'Rót NaOH từ từ đến khi dung dịch chuyển hồng (pH > 8.3)', check: (s, log) => (s.beaker1?.pH ?? 7) > 8.3 },
      { text: 'Ghi nhận phương trình: HCl + NaOH → NaCl + H2O', check: (s, log) => log.some((l) => l.events?.some((e) => e.eq)) },
    ],
  },
  {
    id: 'ex-precipitate', name: 'B. Kết tủa BaSO4 trắng',
    steps: [
      { text: 'Rót 20 mL BaCl2 vào bình tam giác', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'BaCl2') },
      { text: 'Rót 10 mL H2SO4 loãng', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'H2SO4') },
      { text: 'Quan sát kết tủa trắng BaSO4', check: (s) => (s.erlenmeyer1?.precipitates || []).some((p) => p.color === '#f5f7fa') },
    ],
  },
  {
    id: 'ex-metal', name: 'C. Kim loại + dung dịch muối (Fe + CuSO4)',
    steps: [
      { text: 'Rót 30 mL dung dịch CuSO4 màu xanh vào cốc', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'CuSO4') },
      { text: 'Thả đinh sắt sạch vào cốc', check: (s, log) => log.some((l) => l.act === 'pour' && l.chem === 'Fe_nail') },
      { text: 'Quan sát lớp đồng đỏ nâu bám trên đinh', check: (s) => (s.beaker1?.precipitates || []).some((p) => p.color === '#a3552f') },
    ],
  },
  {
    id: 'ex-ph', name: 'D. Đo pH bằng máy đo pH',
    steps: [
      { text: 'Chuẩn bị một dung dịch bất kỳ trong cốc', check: (s, log) => log.some((l) => l.act === 'pour' && !['Quy', 'PPT'].includes(l.chem)) },
      { text: 'Nhấn "Đo pH" khi chọn cốc — đọc giá trị trên máy', check: (s, log) => log.some((l) => l.act === 'measure') },
      { text: 'Kết luận môi trường axit / trung tính / bazơ', check: (s, log) => log.some((l) => l.act === 'measure') },
    ],
  },
];

/* ---------- Âm thanh (WebAudio, synthesized) ---------- */
let AC = null;
const ac = () => { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); return AC; };
const sfx = {
  click() { try { const a = ac(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 660; g.gain.setValueAtTime(.04, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .08); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + .09); } catch {} },
  pour() { try { const a = ac(), o = a.createOscillator(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 7; lg.gain.value = 220; l.connect(lg).connect(o.frequency); o.type = 'sine'; g.gain.setValueAtTime(.03, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + 1.1); o.connect(g).connect(a.destination); o.start(); l.start(); o.stop(a.currentTime + 1.15); l.stop(a.currentTime + 1.15); } catch {} },
  done() { try { const a = ac(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.05, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .35); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + .4); } catch {} },
};

const newSession = () => ({
  id: 'L' + Date.now().toString(36).toUpperCase(),
  startedAt: new Date().toISOString(),
  experiment: null,
  log: [],
  completedSteps: 0,
});

const initialContainers = () => ({
  beaker1: { id: 'beaker1', kind: 'beaker', name: 'Cốc thủy tinh 250 mL', maxMl: 250, position: [-0.55, 0.48, -0.35], ...createContainer('beaker1', 250) },
  erlenmeyer1: { id: 'erlenmeyer1', kind: 'erlenmeyer', name: 'Bình tam giác 250 mL', maxMl: 250, position: [0.55, 0.48, -0.3], ...createContainer('erlenmeyer1', 250) },
  cylinder1: { id: 'cylinder1', kind: 'cylinder', name: 'Ống đong 100 mL', maxMl: 100, position: [0, 0.48, -0.4], ...createContainer('cylinder1', 100) },
});

export default function Lab3D() {
  const { user } = useAuth();
  const [containers, setContainers] = useState(initialContainers);
  const [selected, setSelected] = useState('beaker1');
  const [chem, setChem] = useState(null);
  const [amount, setAmount] = useState(20);
  const [log, setLog] = useState([]);
  const [session, setSession] = useState(newSession);
  const [experimentId, setExperimentId] = useState(null);
  const [panelL, setPanelL] = useState(true);
  const [panelR, setPanelR] = useState(true);
  const [view, setView] = useState('room');
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

  /* Theo dõi pointer lock để hiện gợi ý */
  useEffect(() => {
    const h = () => setLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', h);
    return () => document.removeEventListener('pointerlockchange', h);
  }, []);

  const selectedContainer = containers[selected];
  const experiment = EXPERIMENTS.find((e) => e.id === experimentId);

  /* WebGL check */
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setWebgl(!!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))));
    } catch { setWebgl(false); }
  }, []);

  /* Toast auto-hide */
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* Keyboard: WASD + F + Tab + Esc */
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (e.key === 'Escape') { setPanelL(true); setPanelR(true); setFocus(null); }
      if (k === 'f') setView((v) => (v === 'bench' ? 'room' : 'bench'));
      if (e.key === 'Tab') { e.preventDefault(); setPanelL((p) => !p); }
      if (k === 'e' && walk && hoverRef.current) { setSelected(hoverRef.current); setFocus({ id: hoverRef.current, view: VIEWS.close }); }
    };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  /* WebGL fallback: canvas 2D thông báo */
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
  const updateContainer = (id, patch) => setContainers((cs) => ({ ...cs, [id]: { ...cs[id], ...patch } }));

  const pour = () => {
    if (!chem || !selectedContainer) { setToast('Chọn hóa chất + dụng cụ trước đã!'); return; }
    if (!sound) { /* vẫn thực hiện, chỉ không phát tiếng */ } else sfx.pour();
    const container = { ...selectedContainer, contents: [...selectedContainer.contents], precipitates: selectedContainer.precipitates.map((p) => ({ ...p })), indicators: [...selectedContainer.indicators] };
    const res = addChemical(container, chem, Number(amount));
    if (!res.ok) { setToast(res.reason); return; }
    const pourColor = CHEMS[chem].color;
    updateContainer(selected, { ...container, id: selectedContainer.id, kind: selectedContainer.kind, name: selectedContainer.name, maxMl: selectedContainer.maxMl, position: selectedContainer.position, volume: volumeOf(container), color: dominantColor(container), pH: computePH(container), pouring: true, pourColor });
    setTimeout(() => updateContainer(selected, { pouring: false }), 900);
    setLog((l) => logEntry(l, { act: 'pour', chem, ml: Number(amount), instrument: selected, events: res.events }));
    if (res.events?.length) setToast(res.events.map((e) => e.text).join(' '));
  };

  /* Khuấy — tăng phản ứng + hiệu ứng xoáy */
  const stir = () => {
    if (!selectedContainer || volumeOf(selectedContainer) <= 0) { setToast('Dụng cụ trống — không có gì để khuấy.'); return; }
    updateContainer(selected, { stir: true });
    setTimeout(() => updateContainer(selected, { stir: false }), 2200);
    setLog((l) => logEntry(l, { act: 'stir', instrument: selected }));
    setToast('Đã khuấy đều hỗn hợp.');
  };

  /* Đèn cồn: gia nhiệt thật cho tất cả dụng cụ */
  useEffect(() => {
    if (!burnerLit) return undefined;
    const iv = setInterval(() => {
      setContainers((cs) => {
        const next = { ...cs };
        for (const id of ['beaker1', 'erlenmeyer1', 'cylinder1']) {
          if (next[id] && (next[id].volume || 0) > 0 && (next[id].temp || 25) < 98) {
            next[id] = { ...next[id], temp: (next[id].temp || 25) + 2 };
          }
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(iv);
  }, [burnerLit]);

  /* Gas hết hạn tự tắt */
  useEffect(() => {
    const iv = setInterval(() => {
      setContainers((cs) => {
        let changed = false;
        const next = { ...cs };
        for (const id of ['beaker1', 'erlenmeyer1', 'cylinder1']) {
          const g = next[id]?.gas;
          if (g && g.until && Date.now() > g.until) { next[id] = { ...next[id], gas: null }; changed = true; }
        }
        return changed ? next : cs;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const measurePH = () => {
    if (!selectedContainer || volumeOf(selectedContainer) <= 0) { setToast('Cốc trống — không đo được.'); return; }
    const pH = computePH(selectedContainer);
    setLog((l) => logEntry(l, { act: 'measure', instrument: selected, pH }));
    setToast(`pH đo được: ${pH.toFixed(1)} — ${pH < 6.5 ? 'môi trường AXIT' : pH > 7.5 ? 'môi trường BAZƠ' : 'trung tính'}`);
    if (sound) sfx.click();
  };

  const resetSession = () => {
    setContainers(initialContainers());
    setLog([]); setSession(newSession()); setChem(null); setBurnerLit(false);
    setContainers((cs) => ({ ...cs, burnerLit: false }));
    setToast('Đã reset phòng thí nghiệm.');
  };

  /* Nhiệm vụ: auto check bước */
  const stepDone = useMemo(() => {
    if (!experiment) return [];
    return experiment.steps.map((st) => {
      try { return !!st.check({ ...containers, pH: containers[selected]?.pH }, log); } catch { return false; }
    });
  }, [experiment, containers, log, selected]);

  useEffect(() => {
    if (!experiment) return;
    const done = stepDone.filter(Boolean).length;
    setSession((s) => (s.completedSteps !== done ? { ...s, completedSteps: done } : s));
    if (done === experiment.steps.length && sound) sfx.done();
  }, [stepDone]); // eslint-disable-line

  /* ================= LƯU PHIÊN ================= */
  const saveCloud = async () => {
    if (!user?.uid) { setToast('Chưa đăng nhập — phiên chỉ lưu trên máy này.'); return; }
    setSaveState('saving');
    try {
      const payload = {
        uid: user.uid, sessionId: session.id, experiment: experiment?.name || 'Tự do',
        log: log.slice(-60), completedSteps: session.completedSteps,
        totalSteps: experiment?.steps.length || 0, at: Date.now(),
      };
      await setDoc(doc(db, 'users', user.uid, 'lab3dSessions', session.id), payload);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3500);
    }
  };

  const loadLast = async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'lab3dSessions'), limit(5)));
      const rows = snap.docs.map((d) => d.data()).sort((a, b) => (b.at || 0) - (a.at || 0));
      if (rows[0]) setToast(`Phiên gần nhất: ${rows[0].sessionId} — ${rows[0].experiment} (${rows[0].completedSteps}/${rows[0].totalSteps} bước)`);
      else setToast('Chưa có phiên nào được lưu trên cloud.');
    } catch { setToast('Không đọc được phiên đã lưu.'); }
  };

  const fullscreen = () => {
    const el = document.getElementById('lab3d-root');
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => setToast('Trình duyệt chặn fullscreen — dùng chế độ tối đa màn hình.'));
    else document.exitFullscreen?.();
  };

  /* ================= RENDER ================= */
  const chemList = Object.values(CHEMS);
  const stepStatus = experiment ? stepDone : [];

  return (
    <div className={'lab3d-root' + (walk ? ' walking' : '')} id="lab3d-root">
      {/* ===== CẢNH 3D ===== */}
      <div className="lab3d-canvas">
        <LabScene
          vessels={[containers.beaker1, containers.erlenmeyer1, containers.cylinder1]}
          burnerLit={burnerLit}
          testTubes={[{ color: '#dfe9f3' }, { color: '#8b5cf6' }]}
          phDisplay={containers[selected]?.pH}
          onFpsHover={setHover}
          onFpsUse={() => { if (hoverRef.current) { setSelected(hoverRef.current); setFocus({ id: hoverRef.current, view: VIEWS.close }); } }}
          interactRef={interactRef}
          selected={selected}
          onSelect={(id) => { setSelected(id); setFocus({ id, view: VIEWS.close }); if (sound) sfx.click(); }}
          view={view}
          focus={focus}
          walk={walk}
          keysRef={keysRef}
          quality={quality}
        />
        {/* Ngắm + hướng dẫn khi walk */}
        {walk && <div className="lab-crosshair" />}
        {walk && hover && !locked && <div className="lab-hover-hint">Nhấn <b>E</b> hoặc click để dùng: <b>{containers[hover]?.name || 'Ống nghiệm'}</b></div>}
        {walk && !locked && <div className="lab-lock-hint">Bấm vào cảnh để khóa chuột — WASD di chuyển, chuột xoay nhìn, ESC thoát</div>}
        <div className="lab-view-buttons">
          {['room', 'bench', 'close'].map((v) => (
            <button key={v} className={'lab-vbtn' + (view === v && !focus ? ' on' : '')} onClick={() => { setView(v); setFocus(null); }}>
              {{ room: 'Phòng', bench: 'Bàn thí nghiệm', close: 'Cận cảnh' }[v]}
            </button>
          ))}
          <button className={'lab-vbtn' + (walk ? ' on' : '')} onClick={() => setWalk((w) => !w)} title="Di chuyển bằng WASD">
            {walk ? 'Dừng đi lại' : 'Đi lại (WASD)'}
          </button>
        </div>
      </div>

      {/* ===== HUD TRÊN ===== */}
      <header className="lab-top">
        <div className="lab-brand">
          <span className="lab-logo"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" /></svg></span>
          <div>
            <b>ELEC AI Immersive Lab</b>
            <small>{experiment ? experiment.name : 'Chế độ tự do khám phá'} · Phiên {session.id}</small>
          </div>
        </div>
        <div className="lab-top-right">
          <span className={'lab-save' + (saveState === 'saved' ? ' ok' : saveState === 'error' ? ' err' : '')}>
            {saveState === 'saving' ? 'Đang lưu…' : saveState === 'saved' ? 'Đã lưu' : saveState === 'error' ? 'Lỗi lưu' : 'Tự động lưu máy'}
          </span>
          {experiment && <span className="lab-progress">{session.completedSteps}/{experiment.steps.length} bước</span>}
          <select className="lab-mini" value={quality} onChange={(e) => setQuality(e.target.value)} title="Chất lượng đồ họa">
            <option value="high">Đẹp</option>
            <option value="low">Mượt</option>
          </select>
          <button className="lab-ib" onClick={() => setSound((s) => !s)} title={sound ? 'Tắt âm thanh' : 'Bật âm thanh'}>{sound ? 'Âm: bật' : 'Âm: tắt'}</button>
          <button className="lab-ib" onClick={fullscreen}>Toàn màn hình</button>
          <button className="lab-ib danger" onClick={() => { window.location.hash = 'games'; }}>Thoát</button>
        </div>
      </header>

      {/* ===== PANEL TRÁI: KHO HÓA CHẤT ===== */}
      <aside className={'lab-panel left' + (panelL ? '' : ' collapsed')}>
        <button className="lab-panel-toggle" onClick={() => setPanelL((p) => !p)}>{panelL ? '‹ Kho hóa chất' : 'Kho hóa chất ›'}</button>
        {panelL && (
          <div className="lab-panel-body">
            <input className="lab-search" placeholder="Tìm chất: HCl, CuSO4…" value={chem?.vi || ''} readOnly />
            <div className="lab-chem-list">
              {chemList.map((c) => (
                <button key={c.id} className={'lab-chem' + (chem === c.id ? ' on' : '')} onClick={() => setChem(c.id)} title={`${c.en} — M=${c.M}`}>
                  <span className="lab-chem-dot" style={{ background: c.color }} />
                  <span className="lab-chem-name">{c.vi}</span>
                  <span className="lab-chem-formula">{c.formula}{c.conc ? ` ${c.conc}M` : ''}</span>
                  {c.hazard?.map((h) => <em key={h} className={'lab-hz hz-' + h}>{h}</em>)}
                </button>
              ))}
            </div>
            {chem && (
              <div className="lab-chem-info">
                <b>{chemLabel(CHEMS[chem])}</b>
                <small>
                  {CHEMS[chem].state === 'solution' ? `Dung dịch ${CHEMS[chem].conc}M` : CHEMS[chem].state === 'solid' ? 'Chất rắn' : 'Chỉ thị màu'}
                  {CHEMS[chem].M ? ` · M = ${CHEMS[chem].M} g/mol` : ''}
                </small>
                {CHEMS[chem].hazard?.length > 0 && <small className="lab-warn">An toàn: {CHEMS[chem].hazard.join(', ')} — đeo kính + găng tay.</small>}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ===== PANEL PHẢI: SỔ THÍ NGHIỆM ===== */}
      <aside className={'lab-panel right' + (panelR ? '' : ' collapsed')}>
        <button className="lab-panel-toggle" onClick={() => setPanelR((p) => !p)}>{panelR ? 'Sổ thí nghiệm ›' : '‹ Sổ thí nghiệm'}</button>
        {panelR && (
          <div className="lab-panel-body">
            <div className="lab-section">
              <b>Nhiệm vụ</b>
              <select className="lab-mini wide" value={experimentId || ''} onChange={(e) => { setExperimentId(e.target.value || null); setSession((s) => ({ ...s, experiment: e.target.value })); }}>
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
              <b>Nhật ký thao tác</b>
              <div className="lab-log">
                {log.length === 0 && <small className="lab-empty">Chưa có thao tác nào.</small>}
                {log.slice(-12).map((l, i) => (
                  <div key={i} className="lab-log-row">
                    <small>{new Date(l.at).toLocaleTimeString('vi-VN')}</small>
                    <span>
                      {l.act === 'pour' && <>Rót <b>{l.ml} mL {chemLabel(CHEMS[l.chem])}</b> vào {containers[l.instrument]?.name || l.instrument}</>}
                      {l.act === 'measure' && <>Đo pH = <b>{l.pH?.toFixed(1)}</b></>}
                    </span>
                  </div>
                ))}
              </div>
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
            <div className="lab-section row">
              <button className="lab-btn ghost" onClick={saveCloud}>Lưu phiên lên cloud</button>
              <button className="lab-btn ghost" onClick={loadLast}>Phiên gần nhất</button>
            </div>
          </div>
        )}
      </aside>

      {/* ===== HUD DƯỚI: THAO TÁC THEO NGỮ CẢNH ===== */}
      <footer className="lab-bottom">
        <span className="lab-sel">
          Đang chọn: <b>{selectedContainer?.name}</b>
          {selectedContainer && volumeOf(selectedContainer) > 0 && (
            <> · {volumeOf(selectedContainer).toFixed(0)} mL · pH {computePH(selectedContainer).toFixed(1)} · {containers[selected]?.temp || 25}°C</>
          )}
        </span>
        <div className="lab-pour">
          <select className="lab-mini" value={chem || ''} onChange={(e) => setChem(e.target.value || null)}>
            <option value="">— chọn hóa chất —</option>
            {chemList.map((c) => <option key={c.id} value={c.id}>{c.vi} ({c.formula})</option>)}
          </select>
          <input type="range" min="5" max="50" step="5" value={amount} onChange={(e) => setAmount(Number(e.target.value))} disabled={!CHEMS[chem]?.state || CHEMS[chem]?.state === 'indicator'} title="mL" />
          <b className="lab-amount">{CHEMS[chem]?.state === 'solid' ? (CHEMS[chem].solidGram || 3) + ' g' : amount + ' mL'}</b>
          <button className="lab-btn" onClick={pour} disabled={!chem}>Rót</button>
          <button className="lab-btn ghost" onClick={measurePH}>Đo pH</button>
          <button className="lab-btn ghost" onClick={stir}>Khuấy</button>
          <button className="lab-btn ghost" onClick={() => { setBurnerLit((b) => !b); updateContainer(selected, {}); }}>Đèn cồn {burnerLit ? 'TẮT' : 'BẬT'}</button>
          <button className="lab-btn ghost danger" onClick={resetSession}>Đặt lại</button>
        </div>
      </footer>

      {toast && <div className="lab-toast">{toast}</div>}
    </div>
  );
}
