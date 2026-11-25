import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ELEMENTS, CATS, TRENDS, norm } from '../data/elements.js';
import { getStateAtTemp } from '../data/elementMedia.js';
import ElementCard from './ElementCard.jsx';
import ElementModal from './ElementModal.jsx';
import Periodic3DView from './Periodic3DView.jsx';
import CompareBar from './CompareBar.jsx';
import TrendLegend from './TrendLegend.jsx';
import AiQuiz from './AiQuiz.jsx';
import useVip from '../hooks/useVip.js';
import './periodic-table.css';
import './ai-features.css';
import './element-modal.css';
import Icon from './Icon.jsx';

const loadFavs = () => {
  try { return new Set(JSON.parse(localStorage.getItem('pt-favs') || '[]')); } catch { return new Set(); }
};
const goTable = () => { location.hash = 'table'; };
const clampZoom = (z) => Math.min(1.6, Math.max(0.42, +z.toFixed(2)));
// Tổng độ rộng bảng 18 cột ở zoom=1: 26 + 18*52 + 18*4 = 1034px
const BASE_GRID_WIDTH = 1034;

const TEMP_PRESETS = [
  { label: '0°C (Đóng băng)', k: 273 },
  { label: '25°C (Phòng)', k: 298 },
  { label: '100°C (Nước sôi)', k: 373 },
  { label: '1000°C (Nung đỏ)', k: 1273 },
  { label: '3500°C (Hồ quang)', k: 3773 },
];

function readHash() {
  const hash = location.hash;
  const qIdx = hash.indexOf('?');
  if (qIdx < 0) return {};
  return Object.fromEntries(new URLSearchParams(hash.slice(qIdx + 1)));
}

function writeHash(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.cat && state.cat !== 'all') params.set('cat', state.cat);
  if (state.trend) params.set('trend', state.trend);
  const qs = params.toString();
  const next = qs ? `#table?${qs}` : '#table';
  if (location.hash !== next) history.replaceState(null, '', next);
}

export default function PeriodicTable({ preview = false }) {
  const init = useMemo(readHash, []);
  const [q, setQ] = useState(init.q || '');
  const [cat, setCat] = useState(init.cat || 'all');
  const [hl, setHl] = useState(null);
  const [sel, setSel] = useState(null);
  const [hoveredEl, setHoveredEl] = useState(ELEMENTS[25]); // Mặc định hiện Fe (Z=26) cho sinh động
  const [compare, setCompare] = useState([]);
  const [trend, setTrend] = useState(init.trend || '');
  const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d' | 'temp' | 'blocks'
  const [tempK, setTempK] = useState(298); // 25°C
  const [study, setStudy] = useState(false);
  const [studyStats, setStudyStats] = useState({ ok: 0, no: 0 });
  const [revealed, setRevealed] = useState(new Set());
  const [cursor, setCursor] = useState(null);
  const [zoom, setZoom] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 0.58 : 1));
  const [userZoomed, setUserZoomed] = useState(false);
  const { vip } = useVip();
  const [favs, setFavs] = useState(loadFavs);
  const [onlyFav, setOnlyFav] = useState(false);
  const [stateF, setStateF] = useState('');
  const [quizOpen, setQuizOpen] = useState(false);
  const gridRef = useRef(null);
  const favSyncReadyRef = useRef(false);

  // Tự động tính zoom vừa khít 18 cột (không bao giờ bị cắt mất cột 18 He/Ne/Ar!)
  const fitToContainer = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const avail = el.clientWidth - 40;
    if (avail <= 0) return;
    const ideal = Math.min(1.16, Math.max(0.55, avail / BASE_GRID_WIDTH));
    setZoom(clampZoom(ideal));
  }, []);

  useEffect(() => {
    if (preview || viewMode === '3d') return undefined;
    if (!userZoomed) fitToContainer();
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      if (!userZoomed) fitToContainer();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [preview, viewMode, userZoomed, fitToContainer]);

  useEffect(() => {
    if (!favSyncReadyRef.current) {
      favSyncReadyRef.current = true;
      return;
    }
    try {
      localStorage.setItem('pt-favs', JSON.stringify([...favs]));
      window.dispatchEvent(new CustomEvent('cs-ls', { detail: 'pt-favs' }));
    } catch { /* bỏ qua */ }
  }, [favs]);

  useEffect(() => {
    const onCloudSync = () => setFavs(loadFavs());
    window.addEventListener('cs-cloud-sync-update', onCloudSync);
    return () => window.removeEventListener('cs-cloud-sync-update', onCloudSync);
  }, []);

  const toggleFav = (z) => setFavs((f) => { const n = new Set(f); if (n.has(z)) n.delete(z); else n.add(z); return n; });
  const pickRandom = () => setSel(ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]);
  const close = useCallback(() => setSel(null), []);

  useEffect(() => {
    if (preview) return undefined;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === '+' || e.key === '=') { setUserZoomed(true); setZoom((z) => clampZoom(z + 0.08)); }
      if (e.key === '-') { setUserZoomed(true); setZoom((z) => clampZoom(z - 0.08)); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    writeHash({ q, cat, trend });
  }, [q, cat, trend, preview]);

  const nq = norm(q);
  const matches = useMemo(() => {
    const isOn = (e) =>
      (cat === 'all' || e.category === cat) &&
      (!nq || (/^\d+$/.test(nq) ? e.atomicNumber === +nq : e.s.symbol === nq || e.s.name.includes(nq) || (e.uses && norm(e.uses).includes(nq)))) &&
      (!hl || (hl.t === 'g' ? e.group === hl.v : e.period === hl.v)) &&
      (!onlyFav || favs.has(e.atomicNumber)) &&
      (!stateF || (viewMode === 'temp' ? getStateAtTemp(e, tempK) : e.stateAtRoomTemp) === stateF);
    return new Set(ELEMENTS.filter(isOn).map((e) => e.atomicNumber));
  }, [nq, cat, hl, onlyFav, favs, stateF, viewMode, tempK]);

  const trendInfo = useMemo(() => {
    if (!trend) return null;
    const vals = ELEMENTS.map((e) => e[trend]).filter((v) => typeof v === 'number');
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [trend]);

  const tempStats = useMemo(() => {
    if (viewMode !== 'temp') return null;
    let solid = 0; let liquid = 0; let gas = 0;
    for (const el of ELEMENTS) {
      const st = getStateAtTemp(el, tempK);
      if (st === 'Rắn') solid++;
      else if (st === 'Lỏng') liquid++;
      else gas++;
    }
    return { solid, liquid, gas };
  }, [viewMode, tempK]);

  const toggle = (t, v) => setHl((h) => (h && h.t === t && h.v === v ? null : { t, v }));
  const reset = () => { setQ(''); setCat('all'); setHl(null); setTrend(''); setCompare([]); setOnlyFav(false); setStateF(''); };
  const filtering = !!(q || cat !== 'all' || hl || trend || onlyFav || stateF);
  const active = (t, v) => (hl && hl.t === t && hl.v === v ? ' act' : '');

  const handleSelect = useCallback((e, ev) => {
    if (preview) return goTable();

    if (study) {
      setRevealed((r) => {
        const n = new Set(r);
        if (n.has(e.atomicNumber)) {
          n.delete(e.atomicNumber);
        } else {
          n.add(e.atomicNumber);
          setStudyStats((st) => ({ ...st, ok: st.ok + 1 }));
        }
        return n;
      });
      return;
    }

    if (ev?.shiftKey) {
      setCompare((c) => {
        if (c.find((x) => x.atomicNumber === e.atomicNumber)) {
          return c.filter((x) => x.atomicNumber !== e.atomicNumber);
        }
        return [...c, e].slice(-2);
      });
      return;
    }
    setSel(e);
  }, [preview, study]);

  useEffect(() => {
    if (!gridRef.current || viewMode === '3d') return undefined;
    const onKey = (ev) => {
      if (/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(ev.target.tagName) || ev.target?.isContentEditable) return;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(ev.key)) return;
      if (!cursor) {
        setCursor({ g: 1, p: 1 });
        ev.preventDefault();
        return;
      }
      ev.preventDefault();
      if (ev.key === 'ArrowUp') setCursor({ g: cursor.g, p: Math.max(1, cursor.p - 1) });
      else if (ev.key === 'ArrowDown') setCursor({ g: cursor.g, p: Math.min(7, cursor.p + 1) });
      else if (ev.key === 'ArrowLeft') setCursor({ g: Math.max(1, cursor.g - 1), p: cursor.p });
      else if (ev.key === 'ArrowRight') setCursor({ g: Math.min(18, cursor.g + 1), p: cursor.p });
      else if (ev.key === 'Enter' || ev.key === ' ') {
        const found = ELEMENTS.find((x) => x.group === cursor.g && x.period === cursor.p);
        if (found) handleSelect(found, ev);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [cursor, study, preview, viewMode, handleSelect]);

  const activeHoverState = hoveredEl
    ? (viewMode === 'temp' ? getStateAtTemp(hoveredEl, tempK) : hoveredEl.stateAtRoomTemp)
    : '';

  return (
    <div className={'pt-root' + (preview ? ' is-preview' : '')}>
      {!preview && (
        <div className="pt-hero-pro">
          <div className="pt-hero-left">
            <span className="ns9-pt-pill">IUPAC 2026 · 118 NGUYÊN TỐ · 3D WEBGL &amp; AI PRO</span>
            <h1>Bảng Tuần Hoàn Tương Tác 3D</h1>
            <p>Khám phá ảnh thực tế, mô hình nguyên tử – obitan – tinh thể 3D, quang phổ vạch và gia sư ELEC AI.</p>
          </div>

          {/* 4 CHẾ ĐỘ XEM CHÍNH */}
          <div className="pt-mode-tabs" role="tablist" aria-label="Chế độ hiển thị bảng tuần hoàn">
            {[
              { id: '2d', label: 'Bảng 2D' },
              { id: '3d', label: 'Không gian 3D' },
              { id: 'temp', label: 'Nhiệt độ K/°C' },
              { id: 'blocks', label: 'Khối s·p·d·f' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={viewMode === m.id}
                className={`pt-mode-tab ${viewMode === m.id ? 'is-on' : ''}`}
                onClick={() => {
                  setViewMode(m.id);
                  if (m.id !== '2d') setTrend('');
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <img src="/img/elec/elec-happy.png" alt="Bé Elec Bảng tuần hoàn" className="ns9-pt-mascot" loading="eager" draggable={false} />
        </div>
      )}

      {!preview && (
        <div className="toolbar">
          <div className="searchbox">
            <Icon name="search" size={18} />
            <input
              id="search"
              type="search"
              value={q}
              autoComplete="off"
              placeholder="Tìm nguyên tố theo tên, ký hiệu, Z hoặc ứng dụng (vd: pin, thép, bóng bay)..."
              aria-label="Tìm kiếm nguyên tố"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const f = ELEMENTS.find((x) => matches.has(x.atomicNumber));
                  if (f) setSel(f);
                }
              }}
            />
          </div>

          {viewMode !== '3d' && (
            <div className="zoom" role="group" aria-label="Thu phóng bảng">
              <button className="btn" onClick={() => { setUserZoomed(true); setZoom((z) => clampZoom(z - 0.08)); }} aria-label="Thu nhỏ"><Icon name="minus" size={16} /></button>
              <span aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button className="btn" onClick={() => { setUserZoomed(true); setZoom((z) => clampZoom(z + 0.08)); }} aria-label="Phóng to"><Icon name="plus" size={16} /></button>
              <button
                className="btn pt-fit-btn"
                onClick={() => { setUserZoomed(false); fitToContainer(); }}
                title="Tự động căn vừa màn hình"
              >
                Vừa khít
              </button>
            </div>
          )}
        </div>
      )}

      {!preview && (
        <div className="pt-tools">
          <label className="pt-trend">
            <span>Xu hướng</span>
            <select
              value={trend}
              onChange={(e) => {
                setTrend(e.target.value);
                if (e.target.value && viewMode !== '2d') setViewMode('2d');
              }}
            >
              <option value="">— Màu nhóm —</option>
              {TRENDS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </label>
          <button
            className={'chip' + (study ? ' on' : '')}
            onClick={() => {
              setStudy(!study);
              setRevealed(new Set());
              setStudyStats({ ok: 0, no: 0 });
              if (viewMode === '3d') setViewMode('2d');
            }}
          >
            <Icon name="cap" size={16} /> Chế độ ôn nhớ
          </button>
          <label className="pt-trend">
            <span>Trạng thái</span>
            <select value={stateF} onChange={(e) => setStateF(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="Rắn">Rắn</option>
              <option value="Lỏng">Lỏng</option>
              <option value="Khí">Khí</option>
            </select>
          </label>
          <button className={'chip' + (onlyFav ? ' on' : '')} onClick={() => setOnlyFav(!onlyFav)}>
            <Icon name="star" size={15} fill={onlyFav} /> Yêu thích ({favs.size})
          </button>
          <button className="chip" onClick={pickRandom}><Icon name="dice" size={16} /> Ngẫu nhiên</button>
          <button className="chip vip" onClick={() => setQuizOpen(true)}>
            <Icon name="sparkle" size={16} /> AI Quiz <em className="vip-badge">PRO</em>
          </button>
          {compare.length > 0 && (
            <button className="chip" onClick={() => setCompare([])}>
              <Icon name="close" size={14} /> Bỏ so sánh ({compare.length}/2)
            </button>
          )}
        </div>
      )}

      {/* THANH TRƯỢT NHIỆT ĐỘ THỜI GIAN THỰC (0 K – 6000 K) */}
      {!preview && viewMode === 'temp' && (
        <div className="pt-temp-bar">
          <div className="pt-temp-head">
            <div className="pt-temp-val">
              <strong>{tempK} K</strong>
              <span>({Math.round(tempK - 273.15)}°C)</span>
            </div>
            <div className="pt-temp-counts">
              <span className="is-solid"><i />Rắn: <b>{tempStats?.solid}</b></span>
              <span className="is-liquid"><i />Lỏng: <b>{tempStats?.liquid}</b></span>
              <span className="is-gas"><i />Khí: <b>{tempStats?.gas}</b></span>
            </div>
            <div className="pt-temp-presets">
              {TEMP_PRESETS.map((pr) => (
                <button
                  key={pr.k}
                  type="button"
                  className={`pt-tp-btn ${tempK === pr.k ? 'is-on' : ''}`}
                  onClick={() => setTempK(pr.k)}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            className="pt-temp-slider"
            min={0}
            max={6000}
            step={5}
            value={tempK}
            onChange={(e) => setTempK(Number(e.target.value))}
            aria-label="Thanh trượt nhiệt độ Kelvin"
          />
        </div>
      )}

      {/* CHÚ THÍCH KHỐI OBITAN s / p / d / f */}
      {!preview && viewMode === 'blocks' && (
        <div className="pt-blocks-legend">
          <span><i style={{ background: 'var(--pt-blk-s)' }} /> <b>Khối s</b> (Nhóm IA, IIA &amp; He)</span>
          <span><i style={{ background: 'var(--pt-blk-p)' }} /> <b>Khối p</b> (Nhóm IIIA – VIIIA)</span>
          <span><i style={{ background: 'var(--pt-blk-d)' }} /> <b>Khối d</b> (Kim loại chuyển tiếp)</span>
          <span><i style={{ background: 'var(--pt-blk-f)' }} /> <b>Khối f</b> (Lanthanide &amp; Actinide)</span>
        </div>
      )}

      {trendInfo && !preview && viewMode === '2d' && (
        <TrendLegend trend={TRENDS.find((t) => t.key === trend)} min={trendInfo.min} max={trendInfo.max} />
      )}

      {!preview && (
        <div className="chips" role="group" aria-label="Bộ lọc và chú thích">
          <button className={'chip' + (cat === 'all' ? ' on' : '')} onClick={() => setCat('all')}>Tất cả</button>
          {CATS.map(([k, label]) => (
            <button key={k} className={'chip' + (cat === k ? ' on' : '')} onClick={() => setCat(cat === k ? 'all' : k)}>
              <i style={{ background: `var(--${k})` }} />{label}
            </button>
          ))}
          <button className="chip reset" onClick={reset} disabled={!filtering}>Đặt lại lọc</button>
        </div>
      )}

      {/* THANH XEM NHANH NGUYÊN TỐ KHI RÊ CHUỘT (ẢNH THỰC + THÔNG SỐ + VÍ DỤ) */}
      {!preview && viewMode !== '3d' && hoveredEl && !study && (
        <div className="pt-spotlight-strip" onClick={() => setSel(hoveredEl)} role="button" tabIndex={0}>
          <div className="pt-sp-thumb" style={{ background: `var(--${hoveredEl.category})` }}>
            {hoveredEl.image ? (
              <img src={hoveredEl.image} alt={hoveredEl.name} />
            ) : (
              <b>{hoveredEl.symbol}</b>
            )}
          </div>
          <div className="pt-sp-main">
            <div className="pt-sp-top">
              <strong>{hoveredEl.symbol} — {hoveredEl.name}</strong>
              <span className="pt-sp-pill">Z = {hoveredEl.atomicNumber}</span>
              <span className="pt-sp-pill">{hoveredEl.atomicMass} u</span>
              <span className="pt-sp-pill">Khối {hoveredEl.block}</span>
              <span className="pt-sp-pill">{activeHoverState}</span>
              {hoveredEl.flame && (
                <span className="pt-sp-pill is-flame" style={{ '--fl': hoveredEl.flame.color }}>
                  Lửa: {hoveredEl.flame.label}
                </span>
              )}
            </div>
            <div className="pt-sp-sub">
              <code className="pt-sp-cfg">{hoveredEl.shortConfiguration}</code>
              <span>{hoveredEl.examples?.[0] || hoveredEl.uses || 'Bấm để khám phá mô hình 3D, quang phổ & Gia sư AI'}</span>
            </div>
          </div>
          <span className="pt-sp-cta">Xem 3D &amp; AI →</span>
        </div>
      )}

      {!preview && viewMode !== '3d' && (
        <p className="hint">
          {study && `Chế độ ôn nhớ: đã lật ${revealed.size}/${ELEMENTS.length} nguyên tố (${studyStats.ok} lượt). `}
          {filtering && !study ? `Tìm thấy ${matches.size} nguyên tố phù hợp. ` : ''}
          {!study && <span className="pt-desktop-hint">Bấm số nhóm/chu kỳ để tô sáng · Shift+Click chọn 2 nguyên tố để so sánh · Bấm bất kỳ ô nào để mở mô hình 3D &amp; Ảnh thực tế.</span>}
        </p>
      )}

      {/* KHUNG HIỂN THỊ CHÍNH: KHÔNG GIAN 3D HOẶC BẢNG 2D */}
      {viewMode === '3d' && !preview ? (
        <Periodic3DView matches={matches} onSelect={handleSelect} />
      ) : (
        <div className="ptwrap" ref={gridRef}>
          <div className="pt" style={{ '--z': zoom }}>
            {Array.from({ length: 18 }, (_, i) => (
              <button
                key={'g' + i}
                className={'lab' + active('g', i + 1)}
                style={{ gridRow: 1, gridColumn: i + 2 }}
                onClick={() => toggle('g', i + 1)}
                aria-label={`Nhóm ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <button
                key={'p' + i}
                className={'lab' + active('p', i + 1)}
                style={{ gridRow: i + 2, gridColumn: 1 }}
                onClick={() => toggle('p', i + 1)}
                aria-label={`Chu kỳ ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
            <div className="ph" style={{ gridRow: 7, gridColumn: 4, background: 'var(--lanthanide)' }}>57–71</div>
            <div className="ph" style={{ gridRow: 8, gridColumn: 4, background: 'var(--actinide)' }}>89–103</div>
            <div className="rowlab" style={{ gridRow: 10, gridColumn: '1 / 4' }}>Lanthanide</div>
            <div className="rowlab" style={{ gridRow: 11, gridColumn: '1 / 4' }}>Actinide</div>

            {ELEMENTS.map((e) => {
              const on = study ? !revealed.has(e.atomicNumber) : matches.has(e.atomicNumber);
              const selected = compare.some((x) => x.atomicNumber === e.atomicNumber);
              const isCursor = cursor && e.group === cursor.g && e.period === cursor.p;
              return (
                <ElementCard
                  key={e.atomicNumber}
                  e={e}
                  on={on}
                  onSelect={handleSelect}
                  onHover={setHoveredEl}
                  trend={trend}
                  trendInfo={trendInfo}
                  viewMode={viewMode}
                  tempK={tempK}
                  study={study}
                  revealed={revealed.has(e.atomicNumber)}
                  selected={selected}
                  fav={favs.has(e.atomicNumber)}
                  cursor={isCursor}
                />
              );
            })}
          </div>
        </div>
      )}

      {compare.length === 2 && (
        <CompareBar
          elements={compare}
          onOpen={() => setSel({ __compare: compare })}
          onClear={() => setCompare([])}
        />
      )}

      {sel && (
        <ElementModal
          e={sel.__compare ? null : sel}
          compare={sel.__compare}
          onClose={close}
          onNavigate={(nextEl) => setSel(nextEl)}
          vip={vip}
          fav={!sel.__compare && favs.has(sel.atomicNumber)}
          onToggleFav={() => !sel.__compare && toggleFav(sel.atomicNumber)}
        />
      )}

      {quizOpen && <AiQuiz vip={vip} onClose={() => setQuizOpen(false)} />}
    </div>
  );
}
