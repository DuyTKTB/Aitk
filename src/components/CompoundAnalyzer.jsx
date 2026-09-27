import { useState, useMemo } from 'react';
import { analyze, COMPOUNDS } from '../data/chemRules.js';

export default function CompoundAnalyzer() {
  const [f, setF] = useState('H2SO4');

  const result = useMemo(() => {
    const t = f.replace(/\s/g, '');
    if (!t) return null;
    return analyze(t);
  }, [f]);

  return (
    <section className="wrap narrow">
      <h1>Phân tích hợp chất</h1>
      <p className="lead" style={{ fontSize: '1rem' }}>
        Nhập công thức để biết loại hợp chất, tính chất và phản ứng đặc trưng.
      </p>

      <div className="card">
        <label>
          Công thức
          <input
            value={f}
            onChange={(e) => setF(e.target.value)}
            placeholder="H2SO4, NaOH, CO2, CH4, ..."
            autoComplete="off"
            spellCheck="false"
            style={{ fontSize: '1.4rem', fontWeight: 500 }}
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

            {result.note && <p className="hint">📌 {result.note}</p>}
            {result.common && <p className="hint">💡 Thường gọi: {result.common}</p>}
            {!result.found && (
              <p className="hint" style={{ color: 'var(--acc)' }}>
                ⚠️ Hợp chất chưa có trong database, đang hiển thị theo mẫu nhận diện.
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
          </>
        )}
      </div>

      <details className="card" style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer' }}>
          <b>📚 Xem {Object.keys(COMPOUNDS).length} hợp chất có trong database</b>
        </summary>
        <div className="chips" style={{ marginTop: '.6rem' }}>
          {Object.keys(COMPOUNDS).map((k) => (
            <button
              key={k}
              className="chip"
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