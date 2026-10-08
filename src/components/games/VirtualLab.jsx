/* ============================================================
   VirtualLab v3 — Nhiều dụng cụ + Tìm kiếm hóa chất
   ============================================================ */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  CHEMICALS,
  findReaction,
  LAB_MISSIONS,
  SAFETY_TIPS,
} from '../../data/reactions';
import { sound } from '../../lib/gameSound';
import GameBar from './GameBar';
import { GIcon } from './GameIcons';
import LabScene from './LabScene';
import { ChemCard, useDragDrop } from './LabKit';
import './lab.css';

const MAX_UNITS = 8;
const MAX_VESSELS = 4;
const BANNER_MS = 1600;
const FX_MS = 2600;
const POUR_MS = 1600;
const SETTLE_MS = 700;

const TYPE_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'metal', label: 'Kim loại' },
  { key: 'acid', label: 'Axit' },
  { key: 'base', label: 'Bazơ' },
  { key: 'salt', label: 'Muối' },
  { key: 'oxide', label: 'Oxit' },
  { key: 'gas', label: 'Khí' },
  { key: 'indicator', label: 'Chỉ thị' },
];

const VESSEL_TYPES = [
  { key: 'beaker', label: 'Cốc', icon: 'beaker' },
  { key: 'flask', label: 'Bình tam giác', icon: 'flask' },
  { key: 'tube', label: 'Ống nghiệm', icon: 'tube' },
];

let vesselIdCounter = 0;
const newVessel = (type = 'beaker') => ({
  id: `v-${++vesselIdCounter}`,
  vessel: type,
  contents: {},
  heat: false,
  stir: false,
  temp: 25,
  fx: null,
  pour: null,
});

export default function VirtualLab() {
  /* ---------- STATE ---------- */
  const [vessels, setVessels] = useState(() => [newVessel('beaker')]);
  const [selectedId, setSelectedId] = useState(() => vessels[0]?.id);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('mission');
  const [mission, setMission] = useState(null);
  const [log, setLog] = useState([]);
  const [last, setLast] = useState(null);
  const [toast, setToast] = useState('');
  const [banner, setBanner] = useState(null);
  const [shake, setShake] = useState(false);
  const [goggles, setGoggles] = useState(true);

  const [prog, setProg] = useState(() => {
    try {
      const raw = localStorage.getItem('cs-game:lab2:progress');
      return raw ? { found: [], done: [], score: 0, ...JSON.parse(raw) } : { found: [], done: [], score: 0 };
    } catch {
      return { found: [], done: [], score: 0 };
    }
  });

  const timersRef = useRef({ toast: null, banner: null });

  /* ---------- Lấy dụng cụ đang chọn ---------- */
  const current = useMemo(
    () => vessels.find((v) => v.id === selectedId) || vessels[0] || null,
    [vessels, selectedId]
  );

  /* ---------- SAVE ---------- */
  useEffect(() => {
    try { localStorage.setItem('cs-game:lab2:progress', JSON.stringify(prog)); } catch {}
  }, [prog]);

  /* ---------- NHIỆT ĐỘ cho TẤT CẢ dụng cụ đang bật đèn ---------- */
  useEffect(() => {
    const id = setInterval(() => {
      setVessels((vs) => vs.map((v) => {
        if (!v.heat) return v.temp > 25 ? { ...v, temp: Math.max(25, v.temp - 1) } : v;
        return { ...v, temp: Math.min(100, v.temp + 2.2) };
      }));
    }, 250);
    return () => clearInterval(id);
  }, []);

  /* ---------- TOAST / BANNER / SHAKE ---------- */
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timersRef.current.toast);
    timersRef.current.toast = setTimeout(() => setToast(''), 2600);
  }, []);

  const showBanner = useCallback((msg) => {
    setBanner(msg);
    clearTimeout(timersRef.current.banner);
    timersRef.current.banner = setTimeout(() => setBanner(null), BANNER_MS);
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  }, []);

  /* ---------- Cập nhật dụng cụ ---------- */
  const updateVessel = useCallback((id, patch) => {
    setVessels((vs) => vs.map((v) => (v.id === id ? { ...v, ...(typeof patch === 'function' ? patch(v) : patch) } : v)));
  }, []);

  /* ---------- CHẠY PHẢN ỨNG trên dụng cụ ---------- */
  const settle = useCallback((vesselId, nextContents, heatOn) => {
    const keys = Object.keys(nextContents);
    const rxn = findReaction(keys);

    console.log('[Lab] settle:', {
      vesselId, keys,
      units: Object.values(nextContents).reduce((s, v) => s + v, 0),
      rxn: rxn?.equation || 'KHÔNG TÌM THẤY',
    });

    if (!rxn) {
      if (keys.length >= 2 && Object.values(nextContents).reduce((s, v) => s + v, 0) >= 2) {
        showToast('Chưa thấy phản ứng nào xảy ra.');
      }
      return false;
    }

    const newContents = { ...nextContents };
    rxn.inputs.forEach((k) => {
      newContents[k] = (newContents[k] || 0) - 1;
      if (newContents[k] <= 0) delete newContents[k];
    });
    rxn.outputs.forEach((k) => {
      const c = CHEMICALS[k];
      if (c && c.state !== 'gas') {
        newContents[k] = (newContents[k] || 0) + 1;
      }
    });
    updateVessel(vesselId, (v) => ({
      contents: newContents,
      fx: { id: Date.now(), ...rxn.effect },
      temp: (rxn.effect.type === 'heat' || rxn.effect.type === 'fire')
        ? Math.min(100, v.temp + (rxn.effect.intensity || 2) * 3)
        : v.temp,
    }));

    setTimeout(() => updateVessel(vesselId, { fx: null }), FX_MS);

    if (rxn.danger >= 3 || rxn.effect?.type === 'fire') triggerShake();
    if (rxn.danger >= 3 && !goggles) showToast(`Cảnh báo: nguy hiểm cấp ${rxn.danger}! Đeo kính bảo hộ!`);
    setProg((p) => {
      const isNew = !p.found.includes(rxn.equation);
      let gain = isNew ? 10 : 0;
      const doneNow = LAB_MISSIONS.filter((m) => !p.done.includes(m.id) &&
        m.required.length === rxn.inputs.length &&
        m.required.every((k) => rxn.inputs.includes(k))
      );
      doneNow.forEach((m) => { gain += m.difficulty * 20; });
      if (doneNow.length) showBanner(`✓ ${doneNow[0].title} (+${doneNow[0].difficulty * 20})`);
      else if (isNew) showBanner('✦ Phản ứng mới!');
      return {
        found: isNew ? [...p.found, rxn.equation] : p.found,
        done: [...new Set([...p.done, ...doneNow.map((m) => m.id)])],
        score: p.score + gain,
      };
    });

    setLast(rxn);
    setLog((l) => [{ id: Date.now(), equation: rxn.equation, note: rxn.note }, ...l].slice(0, 30));
    sound.correct?.();
    return true;
  }, [goggles, showBanner, showToast, triggerShake, updateVessel]);

  /* ---------- THÊM HÓA CHẤT vào dụng cụ đang chọn ---------- */
  const addChemical = useCallback((key, vesselId = null) => {
    const targetId = vesselId || selectedId;
    if (!targetId) {
      showToast('Chưa có dụng cụ nào!');
      return;
    }
    if (!CHEMICALS[key]) return;

    const target = vessels.find((v) => v.id === targetId);
    if (!target) return;

    const total = Object.values(target.contents).reduce((s, v) => s + v, 0);
    if (total >= MAX_UNITS) {
      showToast('Dụng cụ đã đầy, đổ bỏ bớt đã nhé!');
      sound.wrong?.();
      return;
    }

    const c = CHEMICALS[key];
    updateVessel(targetId, {
      pour: { color: c.color || '#cfe6f3', id: Date.now() },
    });
    setTimeout(() => updateVessel(targetId, { pour: null }), POUR_MS);

    sound.click?.();
    setLast(null);
    updateVessel(targetId, (v) => {
      const next = { ...v.contents, [key]: (v.contents[key] || 0) + 1 };
      setTimeout(() => settle(targetId, next, v.heat), SETTLE_MS);
      return { contents: next };
    });
  }, [selectedId, vessels, settle, showToast, updateVessel]);

  /* ---------- DRAG & DROP vào sân ---------- */
  const { ref: stageRef, dragging } = useDragDrop((chemKey) => {
    addChemical(chemKey, selectedId);
  });

  /* ---------- THÊM / XÓA DỤNG CỤ ---------- */
  const addVessel = (type = 'beaker') => {
    if (vessels.length >= MAX_VESSELS) {
      showToast(`Tối đa ${MAX_VESSELS} dụng cụ trên bàn.`);
      return;
    }
    const v = newVessel(type);
    setVessels((vs) => [...vs, v]);
    setSelectedId(v.id);
    sound.click?.();
  };

  const removeVessel = (id) => {
    if (vessels.length <= 1) {
      showToast('Phải giữ ít nhất 1 dụng cụ.');
      return;
    }
    setVessels((vs) => vs.filter((v) => v.id !== id));
    if (selectedId === id) {
      const rest = vessels.filter((v) => v.id !== id);
      setSelectedId(rest[0]?.id);
    }
    sound.click?.();
  };

  const changeVesselType = (type) => {
    if (!current) return;
    updateVessel(current.id, { vessel: type });
  };

  /* ---------- HÀNH ĐỘNG ---------- */
  const toggleHeat = () => {
    if (!current) return;
    updateVessel(current.id, (v) => ({ heat: !v.heat }));
    showToast(current.heat ? 'Tắt đèn cồn.' : 'Bật đèn cồn — đang đun nóng...');
  };

  const doStir = () => {
    if (!current) return;
    const total = Object.values(current.contents).reduce((s, v) => s + v, 0);
    if (!total) return;
    updateVessel(current.id, { stir: true });
    setTimeout(() => updateVessel(current.id, { stir: false }), 1400);
    if (!settle(current.id, current.contents, current.heat)) {
      showToast('Khuấy đều nhưng không có gì thay đổi.');
    }
  };

  const dump = () => {
    if (!current) return;
    updateVessel(current.id, { contents: {}, fx: null, pour: null });
    setLast(null);
    showToast('Đã đổ bỏ dung dịch.');
    sound.click?.();
  };

  const removeOne = (key) => {
    if (!current) return;
    updateVessel(current.id, (v) => {
      const n = { ...v.contents, [key]: v.contents[key] - 1 };
      if (n[key] <= 0) delete n[key];
      return { contents: n };
    });
  };

  const resetAll = () => {
    if (!confirm('Xóa toàn bộ tiến trình phòng thí nghiệm?')) return;
    setProg({ found: [], done: [], score: 0 });
    setLog([]);
    setVessels([newVessel('beaker')]);
    setSelectedId(vessels[0]?.id || null);
    setLast(null);
  };

  /* ---------- LỌC HÓA CHẤT + TÌM KIẾM ---------- */
  const shelf = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(CHEMICALS).filter(([k, c]) => {
      if (filter !== 'all' && c.type !== filter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        k.toLowerCase().includes(q)
      );
    });
  }, [filter, search]);

  /* ---------- PHÂN TÍCH dụng cụ đang chọn ---------- */
  const analysis = useMemo(() => {
    if (!current) return { totalUnits: 0, hasLiquid: false, ph: 7 };
    const contents = current.contents || {};
    const totalUnits = Object.values(contents).reduce((s, v) => s + v, 0);
    const hasLiquid = Object.keys(contents).some((k) => {
      const c = CHEMICALS[k];
      return c && (c.state === 'liquid' || c.type === 'acid' || c.type === 'base' || c.type === 'indicator');
    });
    let acid = 0, base = 0;
    Object.entries(contents).forEach(([k, v]) => {
      const c = CHEMICALS[k];
      if (!c) return;
      if (c.type === 'acid') acid += v;
      if (c.type === 'base') base += v;
    });
    const net = acid - base;
    const ph = net === 0 ? 7 : Math.max(0.5, Math.min(13.5, 7 - Math.sign(net) * Math.min(6.5, 2 + 1.5 * Math.abs(net))));
    return { totalUnits, hasLiquid, ph };
  }, [current]);

  /* ==================== RENDER ==================== */
  return (
    <section className="lk-page">
      <GameBar />
      <a href="#games" className="btn sm" style={{ marginBottom: '1.2rem' }}>← Danh sách trò chơi</a>

      {/* HEADER */}
      <header className="lk-head">
        <div>
          <h1>Phòng thí nghiệm <em>ảo</em></h1>
          <p>Đặt nhiều dụng cụ trên bàn, kéo hóa chất vào từng cái, bật đèn cồn, khuấy — quan sát phản ứng.</p>
        </div>
        <div className="lk-score">
          <b>{prog.score}</b>
          <div>
            <span>điểm</span>
            <i>{prog.found.length} phản ứng · {prog.done.length}/{LAB_MISSIONS.length} nhiệm vụ</i>
          </div>
        </div>
      </header>

      {/* GRID 3 CỘT */}
      <div className="lk-grid">

        {/* ============ KHO HÓA CHẤT ============ */}
        <aside className="lk-shelf">
          <h3 className="lk-shelf-title">Kho hóa chất</h3>

          {/* Thanh tìm kiếm */}
          <div className="lk-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Tìm: Na, axit, nước…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Xóa">×</button>
            )}
          </div>

          {/* Filter */}
          <div className="lk-filters">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={'chip' + (filter === f.key ? ' on' : '')}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))}
          </div>

          {/* Số kết quả */}
          <p className="lk-shelf-count">
            {shelf.length} / {Object.keys(CHEMICALS).length} chất
          </p>

          {/* Grid hóa chất */}
          <div className="lk-chems">
            {shelf.length === 0 ? (
              <p className="lk-empty-search">Không tìm thấy chất nào khớp.</p>
            ) : (
              shelf.map(([key]) => (
                <ChemCard
                  key={key}
                  chemKey={key}
                  disabled={analysis.totalUnits >= MAX_UNITS}
                  onClick={addChemical}
                />
              ))
            )}
          </div>
        </aside>

        {/* ============ BÀN THÍ NGHIỆM ============ */}
        <div className="lk-stage-col">
          {/* Toolbar */}
          <div className="lk-tools">
            {/* Chọn loại dụng cụ đang dùng */}
            <div className="lk-seg">
              {VESSEL_TYPES.map((vt) => (
                <button
                  key={vt.key}
                  type="button"
                  className={current?.vessel === vt.key ? 'on' : ''}
                  onClick={() => changeVesselType(vt.key)}
                  title={vt.label}
                ><GIcon name={vt.icon} /> {vt.label}</button>
              ))}
            </div>

            {/* Thêm dụng cụ */}
            <button
              type="button"
              className="lk-toggle"
              onClick={() => addVessel(current?.vessel || 'beaker')}
              disabled={vessels.length >= MAX_VESSELS}
              title={vessels.length >= MAX_VESSELS ? 'Bàn đã đầy' : 'Thêm dụng cụ mới'}
            ><GIcon name="plus" /> Thêm ({vessels.length}/{MAX_VESSELS})</button>

            <button
              type="button"
              className={'lk-toggle' + (current?.heat ? ' on' : '')}
              onClick={toggleHeat}
            ><GIcon name="fire" /> Đèn cồn {current?.heat ? 'BẬT' : 'tắt'}</button>

            <button
              type="button"
              className="lk-toggle"
              onClick={doStir}
              disabled={!analysis.totalUnits}
            ><GIcon name="stir" /> Khuấy</button>

            <button
              type="button"
              className="lk-toggle"
              onClick={dump}
              disabled={!analysis.totalUnits}
            ><GIcon name="trash" /> Đổ bỏ</button>

            <label className="lk-toggle" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={goggles}
                onChange={(e) => setGoggles(e.target.checked)}
              /> <GIcon name="goggles" /> Kính bảo hộ
            </label>
          </div>

          {/* Sân thí nghiệm */}
          <div
            ref={stageRef}
            className={'lk-stage' + (dragging ? ' drag-over' : '') + (shake ? ' shake' : '')}
          >
            <LabScene
              vessels={vessels}
              selectedId={selectedId}
              onSelect={setSelectedId}
              dragging={dragging}
            />
            {toast && <div className="lk-toast">{toast}</div>}
            {banner && <div className="lk-banner">{banner}</div>}
          </div>

          {/* HUD */}
          <div className="lk-hud">
            <div>
              <span className="lk-lbl">
                Dụng cụ đang chọn: {current?.vessel === 'beaker' ? 'Cốc' : current?.vessel === 'flask' ? 'Bình tam giác' : 'Ống nghiệm'} ({analysis.totalUnits}/{MAX_UNITS})
              </span>
              <div className="lk-chips">
                {(!current || Object.keys(current.contents).length === 0) && (
                  <em style={{ color: 'var(--mut)', fontSize: '.82rem' }}>Trống</em>
                )}
                {current && Object.entries(current.contents).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    className="lk-tag"
                    style={{ '--c': CHEMICALS[k]?.color || '#ccc' }}
                    onClick={() => removeOne(k)}
                    title="Bấm để lấy bớt 1 đơn vị"
                  >
                    <i />
                    {CHEMICALS[k]?.formula || k} <b>×{v}</b>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="lk-lbl">
                pH {analysis.hasLiquid ? analysis.ph.toFixed(1) : '—'}
              </span>
              <div className="lk-ph-bar">
                <i style={{
                  left: `${(analysis.hasLiquid ? analysis.ph : 7) / 14 * 100}%`,
                  opacity: analysis.hasLiquid ? 1 : 0.25,
                }} />
              </div>
              <div className="lk-ph-labels">
                <span>Axit</span><span>Trung tính</span><span>Bazơ</span>
              </div>
            </div>
          </div>

          {/* Kết quả phản ứng */}
          {last && (
            <div className={'lk-result d' + last.danger}>
              <div className="lk-result-eq">{last.equation}</div>
              <p><b>Hiện tượng:</b> {last.note}</p>
              <div className="lk-result-products">
                {last.outputs.map((k) => (
                  <span key={k} className="lk-prod-chip"
                    style={{ '--c': CHEMICALS[k]?.color || '#eee' }}>
                    {CHEMICALS[k]?.formula || k}
                  </span>
                ))}
              </div>
              <p className="lk-result-safe"><GIcon name="warning" /> {SAFETY_TIPS[last.danger]}</p>
            </div>
          )}
        </div>

        {/* ============ SỔ THÍ NGHIỆM ============ */}
        <aside className="lk-book">
          <div className="lk-tabs" role="tablist">
            {[
              ['mission', 'Nhiệm vụ'],
              ['log', 'Nhật ký'],
              ['wiki', 'Bách khoa'],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={tab === k ? 'on' : ''}
                onClick={() => setTab(k)}
              >{l}</button>
            ))}
          </div>

          {tab === 'mission' && (
            <ul className="lk-list">
              {LAB_MISSIONS.map((m) => {
                const done = prog.done.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={'lk-mission' + (done ? ' done' : '') + (mission === m.id ? ' sel' : '')}
                      onClick={() => setMission(m.id)}
                    >
                      <span className="lk-mission-n">{done ? '✓' : '★'.repeat(m.difficulty)}</span>
                      <span>
                        <b>{m.title}</b>
                        <small>{m.hint}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
              <li style={{ padding: '.4rem 0', fontSize: '.75rem', color: 'var(--mut)', fontFamily: 'var(--mono)' }}>
                {prog.done.length}/{LAB_MISSIONS.length} nhiệm vụ đã xong
              </li>
            </ul>
          )}

          {tab === 'log' && (
            <ul className="lk-list">
              {log.length === 0 && <li className="lk-empty">Chưa có phản ứng nào trong phiên này.</li>}
              {log.map((l) => (
                <li key={l.id} className="lk-log">
                  <b>{l.equation}</b>
                  <small>{l.note}</small>
                </li>
              ))}
            </ul>
          )}

          {tab === 'wiki' && (
            <ul className="lk-list">
              {LAB_MISSIONS.map((m) => {
                const done = prog.done.includes(m.id);
                return (
                  <li key={m.id} className={'lk-log' + (done ? '' : ' lock')}>
                    <b>{done ? m.title : '??? — chưa khám phá'}</b>
                    <small>
                      {done ? m.desc : 'Gợi ý: ' + m.required.map((k) => CHEMICALS[k]?.formula || k).join(' + ')}
                    </small>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            className="btn sm"
            style={{ marginTop: '.8rem', width: '100%' }}
            onClick={resetAll}
          >Xóa tiến trình</button>
        </aside>
      </div>
    </section>
  );
}