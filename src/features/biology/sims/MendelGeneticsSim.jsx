import React, { useMemo, useState } from 'react';
import { computeMendelCross, simulateMendelOffspring } from '../bioEngine.js';

const MONO_OPTIONS = ['AA', 'Aa', 'aa'];
const DI_OPTIONS = ['AABB', 'AaBb', 'AABb', 'AaBB', 'Aabb', 'aaBb', 'AAbb', 'aaBB', 'aabb'];

function PeaIcon({ phenotype }) {
  const isGreen = phenotype.includes('Xanh');
  const isWrinkled = phenotype.includes('Nhăn');
  const isLight = phenotype.includes('Trung gian');
  const fill = isGreen ? '#22c55e' : isLight ? '#fde047' : '#f59e0b';
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" aria-hidden="true">
      {isWrinkled ? (
        <path
          d="M14 3 C18 4 21 3 23 7 C25 11 23 14 24 18 C22 23 18 24 14 25 C9 24 6 23 4 18 C5 14 3 10 6 7 C9 4 11 4 14 3 Z"
          fill={fill}
          stroke="#1e293b"
          strokeWidth="1.5"
        />
      ) : (
        <circle cx="14" cy="14" r="10.5" fill={fill} stroke="#1e293b" strokeWidth="1.5" />
      )}
    </svg>
  );
}

export default function MendelGeneticsSim() {
  const [mode, setMode] = useState('di'); // 'mono' | 'di'
  const [p1, setP1] = useState('AaBb');
  const [p2, setP2] = useState('AaBb');
  const [incomplete, setIncomplete] = useState(false);
  const [sampleSize, setSampleSize] = useState(400);
  const [trial, setTrial] = useState(null);

  const switchMode = (next) => {
    setMode(next);
    setTrial(null);
    if (next === 'mono') {
      setP1('Aa');
      setP2('Aa');
    } else {
      setP1('AaBb');
      setP2('AaBb');
      setIncomplete(false);
    }
  };

  const cross = useMemo(
    () => computeMendelCross(p1, p2, { incompleteDominance: mode === 'mono' && incomplete }),
    [p1, p2, mode, incomplete]
  );

  const opts = mode === 'mono' ? MONO_OPTIONS : DI_OPTIONS;

  return (
    <div className="bl-grid-2">
      <div className="bl-controls">
        <div className="bl-tabs">
          <button type="button" className={`bl-tab${mode === 'mono' ? ' on' : ''}`} onClick={() => switchMode('mono')}>
            Lai 1 cặp tính trạng (2×2)
          </button>
          <button type="button" className={`bl-tab${mode === 'di' ? ' on' : ''}`} onClick={() => switchMode('di')}>
            Lai 2 cặp tính trạng (4×4)
          </button>
          {mode === 'mono' && (
            <button type="button" className={`bl-tab${incomplete ? ' on' : ''}`} onClick={() => setIncomplete((v) => !v)}>
              {incomplete ? 'Trội không hoàn toàn: Bật' : 'Trội hoàn toàn'}
            </button>
          )}
        </div>

        <div className="bl-panel">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Kiểu gen Bố (♂):{' '}
              <select className="bl-search-input" style={{ width: 'auto', margin: 0 }} value={p1} onChange={(e) => { setP1(e.target.value); setTrial(null); }}>
                {opts.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <strong style={{ fontSize: '1.1rem' }}>×</strong>
            <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Kiểu gen Mẹ (♀):{' '}
              <select className="bl-search-input" style={{ width: 'auto', margin: 0 }} value={p2} onChange={(e) => { setP2(e.target.value); setTrial(null); }}>
                {opts.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bl-table" style={{ textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>♂ \ ♀</th>
                  {cross.gametes2.map((g, i) => (
                    <th key={i} style={{ textAlign: 'center', color: '#2f6bff' }}>{g}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cross.grid.map((row, ri) => (
                  <tr key={ri}>
                    <th style={{ textAlign: 'center', color: '#059669' }}>{cross.gametes1[ri]}</th>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ textAlign: 'center', padding: '8px 6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <PeaIcon phenotype={cell.phenotype} />
                          <strong style={{ fontSize: '0.86rem' }}>{cell.genotype}</strong>
                          <small style={{ fontSize: '0.68rem', color: 'var(--bl-mut)' }}>{cell.phenotype}</small>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bl-controls">
        <div className="bl-panel">
          <h4>Tỉ lệ Kiểu hình lý thuyết ({cross.total} tổ hợp)</h4>
          <table className="bl-table">
            <thead>
              <tr><th>Kiểu hình</th><th>Tỉ lệ</th><th>Phần trăm</th></tr>
            </thead>
            <tbody>
              {cross.phenotypeSummary.map((r) => (
                <tr key={r.phenotype}>
                  <td><strong>{r.phenotype}</strong></td>
                  <td>{r.count}/{cross.total}</td>
                  <td><b>{r.pct}%</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bl-panel">
          <h4>Tỉ lệ Kiểu gen lý thuyết ({cross.genotypeSummary.length} kiểu gen)</h4>
          <div className="bl-check-list">
            {cross.genotypeSummary.map((g) => (
              <span key={g.genotype} className="bl-check-chip">
                <b>{g.genotype}</b>: {g.count}/{cross.total} ({g.pct}%)
              </span>
            ))}
          </div>
        </div>

        <div className="bl-panel">
          <h4>Gieo đời con thực nghiệm &amp; Kiểm định χ²</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <select className="bl-search-input" style={{ width: 'auto', margin: 0 }} value={sampleSize} onChange={(e) => setSampleSize(Number(e.target.value))}>
              <option value={100}>100 hạt F₂</option>
              <option value={400}>400 hạt F₂</option>
              <option value={1600}>1.600 hạt F₂</option>
            </select>
            <button
              type="button"
              className="bl-btn primary"
              onClick={() => setTrial(simulateMendelOffspring(cross, sampleSize))}
            >
              Gieo ngẫu nhiên
            </button>
          </div>
          {trial && (
            <>
              <table className="bl-table">
                <thead>
                  <tr><th>Kiểu hình</th><th>Kì vọng</th><th>Thực nghiệm</th></tr>
                </thead>
                <tbody>
                  {trial.rows.map((r) => (
                    <tr key={r.phenotype}>
                      <td>{r.phenotype}</td>
                      <td>{r.expected}</td>
                      <td><b>{r.observed}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ margin: '8px 0 0', fontSize: '0.79rem', color: '#059669', fontWeight: 700 }}>
                Giá trị χ² = {trial.chiSquare} (bậc tự do df = {trial.df}) — số mẫu càng lớn, tỉ lệ thực nghiệm càng tiến sát lý thuyết Mendel!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
