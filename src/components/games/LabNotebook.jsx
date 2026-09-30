/* ============================================================
   LabNotebook — Sổ tay 5 tab: Nhiệm vụ / Nhật ký / So sánh /
   Bảng tuần hoàn / Thư viện
   ============================================================ */
import { useState, useMemo } from 'react';
import {
  CHEMICALS,
  REACTIONS,
  LAB_MISSIONS,
  findReaction,
} from '../../data/reactions';
import { compareReactions, suggestNext } from '../../lib/labEngine';

const ELEMENTS_MINI = [
  { sym: 'H',  name: 'Hiđro',    z: 1,  color: '#a7c4f2' },
  { sym: 'C',  name: 'Cacbon',   z: 6,  color: '#a7c4f2' },
  { sym: 'N',  name: 'Nitơ',     z: 7,  color: '#a7c4f2' },
  { sym: 'O',  name: 'Oxi',      z: 8,  color: '#a7c4f2' },
  { sym: 'Na', name: 'Natri',    z: 11, color: '#ff9b85' },
  { sym: 'Mg', name: 'Magie',    z: 12, color: '#ffc46b' },
  { sym: 'Al', name: 'Nhôm',     z: 13, color: '#8fd6c4' },
  { sym: 'Si', name: 'Silic',    z: 14, color: '#8fd6c4' },
  { sym: 'P',  name: 'Photpho',  z: 15, color: '#a7c4f2' },
  { sym: 'S',  name: 'Lưu huỳnh',z: 16, color: '#a7c4f2' },
  { sym: 'Cl', name: 'Clo',      z: 17, color: '#c1b4f0' },
  { sym: 'K',  name: 'Kali',     z: 19, color: '#ff9b85' },
  { sym: 'Ca', name: 'Canxi',    z: 20, color: '#ffc46b' },
  { sym: 'Fe', name: 'Sắt',      z: 26, color: '#8fd6c4' },
  { sym: 'Cu', name: 'Đồng',     z: 29, color: '#8fd6c4' },
  { sym: 'Zn', name: 'Kẽm',      z: 30, color: '#8fd6c4' },
  { sym: 'Ag', name: 'Bạc',      z: 47, color: '#8fd6c4' },
  { sym: 'Ba', name: 'Bari',     z: 56, color: '#ffc46b' },
  { sym: 'I',  name: 'Iot',      z: 53, color: '#c1b4f0' },
  { sym: 'Pb', name: 'Chì',      z: 82, color: '#c9c5b8' },
];

const TABS = [
  { key: 'mission', label: 'Nhiệm vụ' },
  { key: 'log',     label: 'Nhật ký' },
  { key: 'compare', label: 'So sánh' },
  { key: 'pt',      label: 'Bảng TH' },
  { key: 'lib',     label: 'Thư viện' },
];

export default function LabNotebook({
  tab, onTabChange,
  log = [],
  missions = LAB_MISSIONS,
  missionsDone = [],
  activeMission,
  onPickMission,
  onLoadEquation,       // (equation) => void — load phản ứng vào cốc
  onAddChemical,        // (chemKey) => void — click nguyên tố → thêm vào cốc
  currentContents = {},
}) {
  const [eqA, setEqA] = useState('');
  const [eqB, setEqB] = useState('');

  const compare = useMemo(() => {
    if (!eqA || !eqB || eqA === eqB) return null;
    return compareReactions(eqA, eqB);
  }, [eqA, eqB]);

  const suggestions = useMemo(
    () => suggestNext(currentContents),
    [currentContents]
  );

  return (
    <aside className="lk-book">
      <div className="lk-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={'lk-tab' + (tab === t.key ? ' on' : '')}
            onClick={() => onTabChange?.(t.key)}
          >{t.label}</button>
        ))}
      </div>

      <div className="lk-tab-body">
        {/* ============ NHIỆM VỤ ============ */}
        {tab === 'mission' && (
          <>
            {/* Gợi ý thông minh */}
            {suggestions.length > 0 && (
              <div style={{
                padding: '.6rem .8rem',
                background: 'color-mix(in srgb, var(--acc) 10%, var(--bg))',
                borderRadius: '12px',
                marginBottom: '.8rem',
                borderLeft: '3px solid var(--acc)',
              }}>
                <div style={{
                  font: '700 .7rem var(--mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--acc)',
                  marginBottom: '.35rem',
                }}>💡 Gợi ý</div>
                {suggestions.slice(0, 2).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => onAddChemical?.(s.key)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '.35rem .5rem',
                      marginTop: '.25rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--soft)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      font: '500 .75rem var(--sans)',
                      color: 'var(--ink)',
                    }}
                  >
                    <b>{CHEMICALS[s.key]?.formula || s.key}</b> — {s.reason}
                  </button>
                ))}
              </div>
            )}

            <div className="lk-missions">
              {missions.map((m, i) => {
                const done = missionsDone.includes(m.id);
                const sel = activeMission === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={'lk-mission' + (done ? ' done' : '') + (sel ? ' sel' : '')}
                    onClick={() => onPickMission?.(m.id)}
                  >
                    <span className="lk-mission-num">{done ? '✓' : `0${i + 1}`}</span>
                    <span className="lk-mission-info">
                      <span className="lk-mission-title">{m.title}</span>
                      <span className="lk-mission-hint">{m.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p style={{
              marginTop: '.8rem',
              font: '500 .72rem var(--mono)',
              color: 'var(--mut)',
              textAlign: 'center',
            }}>
              {missionsDone.length}/{missions.length} nhiệm vụ hoàn thành
            </p>
          </>
        )}

        {/* ============ NHẬT KÝ ============ */}
        {tab === 'log' && (
          <>
            {log.length === 0 ? (
              <p className="lk-empty-text">Chưa có phản ứng nào trong phiên này.</p>
            ) : (
              <div className="lk-log-list">
                {log.map((item) => (
                  <div key={item.id} className="lk-log-item">
                    <span className="lk-log-eq">{item.equation}</span>
                    <span className="lk-log-note">{item.note}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ SO SÁNH ============ */}
        {tab === 'compare' && (
          <>
            <p style={{
              margin: '0 0 .6rem',
              font: '400 .78rem var(--sans)',
              color: 'var(--mut)',
            }}>
              Chọn 2 phản ứng để so sánh:
            </p>

            <select
              value={eqA}
              onChange={(e) => setEqA(e.target.value)}
              style={{
                width: '100%',
                padding: '.5rem .6rem',
                marginBottom: '.4rem',
                background: 'var(--bg)',
                border: '1.5px solid var(--soft)',
                borderRadius: '10px',
                color: 'var(--ink)',
                font: '500 .78rem var(--mono)',
              }}
            >
              <option value="">— Phản ứng A —</option>
              {REACTIONS.map((r) => (
                <option key={r.equation} value={r.equation}>{r.equation}</option>
              ))}
            </select>

            <select
              value={eqB}
              onChange={(e) => setEqB(e.target.value)}
              style={{
                width: '100%',
                padding: '.5rem .6rem',
                marginBottom: '.8rem',
                background: 'var(--bg)',
                border: '1.5px solid var(--soft)',
                borderRadius: '10px',
                color: 'var(--ink)',
                font: '500 .78rem var(--mono)',
              }}
            >
              <option value="">— Phản ứng B —</option>
              {REACTIONS.map((r) => (
                <option key={r.equation} value={r.equation}>{r.equation}</option>
              ))}
            </select>

            {compare ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                border: '1.5px solid var(--soft)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 0,
                  background: 'var(--ink)',
                  color: 'var(--bg)',
                  font: '700 .68rem var(--mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}>
                  <span style={{ padding: '.4rem .5rem' }}></span>
                  <span style={{ padding: '.4rem .5rem', textAlign: 'center' }}>A</span>
                  <span style={{ padding: '.4rem .5rem', textAlign: 'center' }}>B</span>
                </div>
                {compare.map(([label, a, b], i) => (
                  <div
                    key={label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      background: i % 2 ? 'var(--soft)' : 'transparent',
                      font: '500 .74rem var(--mono)',
                    }}
                  >
                    <span style={{ padding: '.4rem .5rem', color: 'var(--mut)' }}>{label}</span>
                    <span style={{ padding: '.4rem .5rem', textAlign: 'center' }}>{a}</span>
                    <span style={{ padding: '.4rem .5rem', textAlign: 'center' }}>{b}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="lk-empty-text">Chọn 2 phản ứng để so sánh.</p>
            )}
          </>
        )}

        {/* ============ BẢNG TUẦN HOÀN ============ */}
        {tab === 'pt' && (
          <>
            <p style={{
              margin: '0 0 .6rem',
              font: '400 .78rem var(--sans)',
              color: 'var(--mut)',
            }}>
              Click nguyên tố để thêm vào cốc đang chọn.
            </p>
            <div className="lk-pt-grid">
              {ELEMENTS_MINI.map((el) => {
                const chemKey = el.sym;
                const hasChem = CHEMICALS[chemKey];
                return (
                  <button
                    key={el.sym}
                    type="button"
                    className={'lk-pt-cell' + (hasChem ? '' : ' selected')}
                    style={{
                      background: hasChem
                        ? `color-mix(in srgb, ${el.color} 40%, var(--bg))`
                        : 'var(--soft)',
                      cursor: hasChem ? 'pointer' : 'not-allowed',
                      opacity: hasChem ? 1 : 0.4,
                    }}
                    onClick={() => hasChem && onAddChemical?.(chemKey)}
                    disabled={!hasChem}
                    title={hasChem ? `${el.name} (Z=${el.z})` : `${el.name} — chưa có trong kho`}
                  >
                    {el.sym}
                  </button>
                );
              })}
            </div>
            <p style={{
              marginTop: '.8rem',
              font: '500 .68rem var(--mono)',
              color: 'var(--mut)',
              textAlign: 'center',
            }}>
              Đã tô màu: có trong kho
            </p>
          </>
        )}

        {/* ============ THƯ VIỆN ============ */}
        {tab === 'lib' && (
          <>
            <p style={{
              margin: '0 0 .6rem',
              font: '400 .78rem var(--sans)',
              color: 'var(--mut)',
            }}>
              {REACTIONS.length} phản ứng có sẵn — click để load vào cốc:
            </p>
            <div className="lk-lib-list">
              {REACTIONS.map((r) => (
                <button
                  key={r.equation}
                  type="button"
                  className="lk-lib-item"
                  onClick={() => onLoadEquation?.(r.equation)}
                >
                  <b>{r.equation}</b>
                  <small>{r.note}</small>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}