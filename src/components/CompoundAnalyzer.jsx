import { useState, useMemo } from 'react';
import { analyze, COMPOUNDS } from '../data/chemRules.js';
import { IconMicroscope, IconRobot, IconZap } from './Icons.jsx';
import { askAI } from './HomePlus.jsx';

const POPULAR_COMPOUNDS = ['H2SO4', 'NaOH', 'FeCl3', 'CuSO4', 'HNO3', 'NH3', 'CH3COOH', 'C2H5OH', 'CaCO3', 'CH3COOC2H5'];

const SvgIcon = ({ d, size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 5 }}>
    {d}
  </svg>
);
const IconPin = (p) => <SvgIcon {...p} d={<><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-2l-2-3V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7l-2 3v2z" /></>} />;
const IconBulb = (p) => <SvgIcon {...p} d={<><path d="M9 18h6M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" /></>} />;
const IconAlert = (p) => <SvgIcon {...p} d={<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />;
const IconBook = (p) => <SvgIcon {...p} d={<><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10M6 10h10" /></>} />;

export default function CompoundAnalyzer() {
  const [f, setF] = useState('H2SO4');

  const result = useMemo(() => {
    const t = f.replace(/\s/g, '');
    if (!t) return null;
    return analyze(t);
  }, [f]);

  return (
    <section className="wrap narrow ns9-subtool-page">
      <div className="ns9-tool-hero tone-purple">
        <div className="ns9-th-left">
          <span className="ns9-th-badge">
            <IconMicroscope size={12} /> PHÂN TÍCH PHÂN TỬ &amp; PHẢN ỨNG
          </span>
          <h1>Phân tích hợp chất</h1>
          <p>
            Nhập công thức phân tử để nhận diện phân loại chất, gốc ion phân li, tính chất hóa học và phản ứng đặc trưng.
          </p>
        </div>
        <img src="/img/elec/elec-cool.png" alt="Bé Elec Phân tích hợp chất" className="ns9-th-mascot" loading="eager" />
      </div>

      <div className="ns9-quick-strip-wrap">
        <span className="ns9-qs-label"><IconZap size={13} /> Chất tiêu biểu:</span>
        <div className="ns9-chip-strip" role="list">
          {POPULAR_COMPOUNDS.map((comp) => (
            <button
              key={comp}
              className={'chip' + (f.trim() === comp ? ' on' : '')}
              onClick={() => setF(comp)}
              type="button"
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      <div className="card ns9-bento-card">
        <label>
          Công thức hóa học
          <input
            value={f}
            onChange={(e) => setF(e.target.value)}
            placeholder="H2SO4, NaOH, CO2, CH4, ..."
            autoComplete="off"
            spellCheck="false"
            style={{ fontSize: '1.35rem', fontWeight: 600 }}
          />
        </label>

        {result && (
          <>
            <div className="analyze-head" style={{ marginTop: '1rem' }}>
              <span
                className="badge"
                style={{ background: `var(--${badgeColor(result.type)})`, color: '#111' }}
              >
                {result.typeName}
              </span>
              {result.strength && (
                <span className="badge">
                  {result.strength === 'strong'
                    ? 'Mạnh'
                    : result.strength === 'medium'
                      ? 'Trung bình'
                      : 'Yếu'}
                </span>
              )}
              {result.sub && <span className="badge">{result.sub}</span>}
            </div>

            <h2 style={{ marginTop: '.6rem' }}>{result.name || '—'}</h2>

            {result.ions?.length > 0 && (
              <p className="cfg">Ion: {result.ions.join(' + ')}</p>
            )}

            {result.note && <p className="hint"><IconPin size={14} />{result.note}</p>}
            {result.common && <p className="hint"><IconBulb size={14} />Thường gọi: {result.common}</p>}
            {!result.found && (
              <p className="hint" style={{ color: 'var(--acc)' }}>
                <IconAlert size={14} /> Hợp chất chưa có trong database, đang hiển thị theo mẫu nhận diện.
              </p>
            )}

            {result.reactions?.length > 0 && (
              <>
                <h3 style={{ marginTop: '1.2rem' }}>Phản ứng đặc trưng</h3>
                <ul className="reactions">
                  {result.reactions.map((r, i) => (
                    <li key={i}>
                      <b>+ {r.with}</b> → {r.result}
                      {r.condition && (
                        <small className="hint"> ({r.condition})</small>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="ns9-tool-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => askAI(`Hãy trình bày chi tiết tính chất vật lí, tính chất hóa học, điều chế và các phản ứng bẫy thường gặp của chất ${f.trim()}${result.name ? ` (${result.name})` : ''} trong đề thi THPTQG.`)}
              >
                <IconRobot size={14} /> Hỏi AI tính chất &amp; bài tập về {f.trim()}
              </button>
            </div>
          </>
        )}
      </div>

      <details className="card ns9-bento-card" style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <b><IconBook size={15} /> Xem toàn bộ {Object.keys(COMPOUNDS).length} hợp chất có trong thư viện</b>
        </summary>
        <div className="chips" style={{ marginTop: '.75rem' }}>
          {Object.keys(COMPOUNDS).map((k) => (
            <button
              key={k}
              className={'chip' + (f.trim() === k ? ' on' : '')}
              onClick={() => setF(k)}
              type="button"
            >
              {k}
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}

function badgeColor(type) {
  return (
    {
      acid: 'alkali',
      base: 'nonmetal',
      oxide: 'transition',
      salt: 'post',
      organic: 'metalloid',
    }[type] || 'actinide'
  );
}