import { useState, useMemo, useEffect, useCallback } from 'react';
import { ELEMENTS, CATS, norm } from '../data/elements.js';
import ElementCard from './ElementCard.jsx';
import ElementModal from './ElementModal.jsx';

const goTable = () => { location.hash = 'table'; };
const initialZoom = () => (innerWidth < 640 ? 0.6 : Math.min(1.15, (innerWidth - 48) / 1060));
const clampZoom = (z) => Math.min(2, Math.max(0.4, +z.toFixed(2)));

export default function PeriodicTable({ preview = false }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [hl, setHl] = useState(null); // { t: 'g' | 'p', v: number }
  const [sel, setSel] = useState(null);
  const [zoom, setZoom] = useState(initialZoom);
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

  const nq = norm(q);
  const matches = useMemo(() => {
    const isOn = (e) =>
      (cat === 'all' || e.category === cat) &&
      (!nq || (/^\d+$/.test(nq) ? e.atomicNumber === +nq : e.s.symbol === nq || e.s.name.includes(nq) || e.s.vn.includes(nq))) &&
      (!hl || (hl.t === 'g' ? e.group === hl.v : e.period === hl.v));
    return new Set(ELEMENTS.filter(isOn).map((e) => e.atomicNumber));
  }, [nq, cat, hl]);

  const toggle = (t, v) => setHl((h) => (h && h.t === t && h.v === v ? null : { t, v }));
  const reset = () => { setQ(''); setCat('all'); setHl(null); };
  const filtering = q || cat !== 'all' || hl;
  const onSelect = preview ? goTable : setSel;
  const active = (t, v) => (hl && hl.t === t && hl.v === v ? ' act' : '');

  return (
    <div>
      {!preview && (
        <div className="toolbar">
          <input
            id="search" type="search" value={q} autoComplete="off"
            placeholder="🔍 Tìm kiếm nguyên tố... (Ctrl + K)" aria-label="Tìm kiếm nguyên tố"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { const f = ELEMENTS.find((x) => matches.has(x.atomicNumber)); if (f) setSel(f); }
            }}
          />
          <div className="zoom" role="group" aria-label="Thu phóng bảng">
            <button className="btn" onClick={() => setZoom((z) => clampZoom(z - 0.1))} aria-label="Thu nhỏ">−</button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button className="btn" onClick={() => setZoom((z) => clampZoom(z + 0.1))} aria-label="Phóng to">+</button>
          </div>
        </div>
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
          {filtering ? `${matches.size} nguyên tố phù hợp. ` : ''}Bấm số nhóm hoặc chu kỳ để làm nổi bật. Nhấn Enter trong ô tìm kiếm để mở kết quả đầu tiên.
        </p>
      )}

      <div className="ptwrap">
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
          {ELEMENTS.map((e) => (
            <ElementCard key={e.atomicNumber} e={e} on={matches.has(e.atomicNumber)} onSelect={onSelect} />
          ))}
        </div>
      </div>

      {sel && <ElementModal e={sel} onClose={close} />}
    </div>
  );
}
