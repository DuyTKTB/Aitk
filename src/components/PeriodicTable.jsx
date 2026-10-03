import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ELEMENTS, CATS, TRENDS, norm } from '../data/elements.js';
import ElementCard from './ElementCard.jsx';
import ElementModal from './ElementModal.jsx';
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
const initialZoom = () => (innerWidth < 640 ? 0.6 : Math.min(1.15, (innerWidth - 48) / 1060));
const clampZoom = (z) => Math.min(2, Math.max(0.4, +z.toFixed(2)));
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
  const [compare, setCompare] = useState([]);       // mảng element, max 2
  const [trend, setTrend] = useState(init.trend || '');
  const [study, setStudy] = useState(false);
  const [studyStats, setStudyStats] = useState({ ok: 0, no: 0 });
  const [revealed, setRevealed] = useState(new Set()); // z đã lật trong study
  const [cursor, setCursor] = useState(null);       // { g, p } ô đang focus bàn phím
  const [zoom, setZoom] = useState(initialZoom);
  const { vip } = useVip();
  const [favs, setFavs] = useState(loadFavs);
  const [onlyFav, setOnlyFav] = useState(false);
  const [stateF, setStateF] = useState('');
  const [quizOpen, setQuizOpen] = useState(false);
  const gridRef = useRef(null);
  useEffect(() => {
    try { localStorage.setItem('pt-favs', JSON.stringify([...favs])); } catch { /* bỏ qua */ }
  }, [favs]);
  const toggleFav = (z) => setFavs((f) => { const n = new Set(f); if (n.has(z)) n.delete(z); else n.add(z); return n; });
  const pickRandom = () => setSel(ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]);
  const close = useCallback(() => setSel(null), []);
  useEffect(() => {
    if (preview) return;
    const onKey = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === '+' || e.key === '=') setZoom((z) => clampZoom(z + 0.1));
      if (e.key === '-') setZoom((z) => clampZoom(z - 0.1));
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
      (!nq || (/^\d+$/.test(nq) ? e.atomicNumber === +nq : e.s.symbol === nq || e.s.name.includes(nq) || e.s.vn.includes(nq))) &&
      (!hl || (hl.t === 'g' ? e.group === hl.v : e.period === hl.v)) &&
      (!onlyFav || favs.has(e.atomicNumber)) &&
      (!stateF || e.stateAtRoomTemp === stateF);
    return new Set(ELEMENTS.filter(isOn).map((e) => e.atomicNumber));
  }, [nq, cat, hl, onlyFav, favs, stateF]);
  const trendInfo = useMemo(() => {
    if (!trend) return null;
    const vals = ELEMENTS.map((e) => e[trend]).filter((v) => typeof v === 'number');
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [trend]);

  const toggle = (t, v) => setHl((h) => (h && h.t === t && h.v === v ? null : { t, v }));
  const reset = () => { setQ(''); setCat('all'); setHl(null); setTrend(''); setCompare([]); setOnlyFav(false); setStateF(''); };
  const filtering = !!(q || cat !== 'all' || hl || trend || onlyFav || stateF);
  const active = (t, v) => (hl && hl.t === t && hl.v === v ? ' act' : '');
  const handleSelect = (e, ev) => {
    if (preview) return goTable();

    if (study) {
      setRevealed((r) => {
        const n = new Set(r);
        if (n.has(e.atomicNumber)) n.delete(e.atomicNumber); else n.add(e.atomicNumber);
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
  };
  useEffect(() => {
    if (!gridRef.current) return;
    const onKey = (ev) => {
      if (/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(ev.key)) return;
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
  }, [cursor, study, preview]);

  return (
    <div>
      {!preview && (
        <div className="toolbar">
          <div className="searchbox">
            <Icon name="search" size={18} />
            <input
              id="search" type="search" value={q} autoComplete="off"
              placeholder="Tìm kiếm nguyên tố... (Ctrl + K)"
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
          <div className="zoom" role="group" aria-label="Thu phóng bảng">
            <button className="btn" onClick={() => setZoom((z) => clampZoom(z - 0.1))} aria-label="Thu nhỏ"><Icon name="minus" size={16} /></button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button className="btn" onClick={() => setZoom((z) => clampZoom(z + 0.1))} aria-label="Phóng to"><Icon name="plus" size={16} /></button>
          </div>
        </div>
      )}

      {!preview && (
        <div className="pt-tools">
          <label className="pt-trend">
            <span>Trend</span>
            <select value={trend} onChange={(e) => setTrend(e.target.value)}>
              <option value="">— Không —</option>
              {TRENDS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </label>
          <button
            className={'chip' + (study ? ' on' : '')}
            onClick={() => { setStudy(!study); setRevealed(new Set()); setStudyStats({ ok: 0, no: 0 }); }}
          >
            <Icon name="cap" size={16} /> Chế độ học
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
            <Icon name="sparkle" size={16} /> AI Quiz <em className="vip-badge">VIP</em>
          </button>
          {compare.length > 0 && (
            <button className="chip" onClick={() => setCompare([])}>
              <Icon name="close" size={14} /> Bỏ chọn ({compare.length}/2)
            </button>
          )}
        </div>
      )}

      {trendInfo && !preview && (
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
          <button className="chip reset" onClick={reset} disabled={!filtering}>Reset Filter</button>
        </div>
      )}

      {!preview && (
        <p className="hint">
          {study && `Chế độ học: ${studyStats.ok} đúng / ${studyStats.no} sai. `}
          {filtering && !study ? `${matches.size} nguyên tố phù hợp. ` : ''}
          {!study && 'Bấm số nhóm/chu kỳ để làm nổi bật. Shift+Click chọn 2 nguyên tố để so sánh. Dùng phím ←→↑↓ di chuyển.'}
        </p>
      )}

      <div className="ptwrap" ref={gridRef}>
        <div className="pt" style={{ '--z': zoom }}>
          {Array.from({ length: 18 }, (_, i) => (
            <button key={'g' + i} className={'lab' + active('g', i + 1)} style={{ gridRow: 1, gridColumn: i + 2 }}
              onClick={() => toggle('g', i + 1)} aria-label={`Nhóm ${i + 1}`}>{i + 1}</button>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <button key={'p' + i} className={'lab' + active('p', i + 1)} style={{ gridRow: i + 2, gridColumn: 1 }}
              onClick={() => toggle('p', i + 1)} aria-label={`Chu kỳ ${i + 1}`}>{i + 1}</button>
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
                trend={trend}
                trendInfo={trendInfo}
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
          vip={vip}
          fav={!sel.__compare && favs.has(sel.atomicNumber)}
          onToggleFav={() => !sel.__compare && toggleFav(sel.atomicNumber)}
        />
      )}

      {quizOpen && <AiQuiz vip={vip} onClose={() => setQuizOpen(false)} />}
    </div>
  );
}