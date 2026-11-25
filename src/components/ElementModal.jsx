/* ============================================================
   ElementModal.jsx — Phòng Thí Nghiệm Nguyên Tố 3D + Ảnh Thực Tế + Quang Phổ + AI Pro
   - Cột trái: Ảnh thực tế Wikimedia Commons (bấm phóng to) + Trình mô phỏng 3D WebGL (Bohr / Obitan / Tinh thể)
   - Cột giữa: Tổng quan thông số vật lý-hóa học, Ví dụ đời sống, PTHH GDPT 2018, Ô lượng tử Hund/Pauli,
     Quang phổ vạch phát xạ (380–750nm) & Thí nghiệm màu ngọn lửa
   - Cột phải: Gia sư ELEC AI Pro (6 nút chuyên sâu + KaTeX + hỏi đáp nhiều lượt)
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATS, ELEMENTS } from '../data/elements.js';
import { getEmissionLines, wavelengthToCss } from '../data/elementMedia.js';
import Atom3DViewer from './Atom3DViewer.jsx';
import AiPanel from './AiPanel.jsx';
import Icon from './Icon.jsx';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const OX_LABEL = (ox) => {
  if (!ox || ox.length === 0) return '—';
  return ox.map((n) => (n > 0 ? `+${n}` : `${n}`)).join(', ');
};
const MASS_LABEL = (m) => (m.endsWith(']') ? `${m} (đồng vị bền nhất)` : `${m} u`);
const catNameOf = (e) => CATS.find((c) => c[0] === e.category)?.[1] ?? e.category;
const fmtTemp = (k) => {
  if (typeof k !== 'number') return '—';
  const c = Math.round(k - 273.15);
  return `${k} K (${c}°C)`;
};

/* ---------- Phân tích phân lớp hóa trị để vẽ Ô lượng tử (Hund & Pauli) ---------- */
const SUB_BOXES = { s: 1, p: 3, d: 5, f: 7 };
function parseValenceSubshells(fullCfg = '') {
  const parts = [];
  for (const m of String(fullCfg).matchAll(/(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g)) {
    const n = Number(m[1]);
    const l = m[2];
    const count = Number([...m[3]].map((c) => SUP.indexOf(c)).join(''));
    parts.push({ label: `${n}${l}`, n, l, count, boxes: SUB_BOXES[l] || 1 });
  }
  if (parts.length <= 2) return parts;
  return parts.slice(-2);
}

function fillOrbitalBoxes(boxes, count) {
  const arr = Array.from({ length: boxes }, () => ({ up: false, down: false }));
  let left = count;
  // Quy tắc Hund: điền mũi tên hướng lên (↑) vào từng ô trước
  for (let i = 0; i < boxes && left > 0; i++) {
    arr[i].up = true;
    left--;
  }
  // Nguyên lý Pauli: ghép đôi mũi tên hướng xuống (↓)
  for (let i = 0; i < boxes && left > 0; i++) {
    arr[i].down = true;
    left--;
  }
  return arr;
}

function QuantumBoxDiagram({ e }) {
  const subs = useMemo(() => parseValenceSubshells(e.electronConfiguration), [e.electronConfiguration]);
  const unpaired = useMemo(() => {
    let u = 0;
    subs.forEach((s) => {
      fillOrbitalBoxes(s.boxes, s.count).forEach((b) => {
        if (b.up && !b.down) u++;
      });
    });
    return u;
  }, [subs]);

  return (
    <div className="em-lab-card">
      <div className="em-lab-head">
        <strong>Ô lượng tử phân lớp ngoài cùng (Hund / Pauli)</strong>
        <span className="em-lab-tag">{unpaired} e độc thân</span>
      </div>
      <div className="em-qboxes-wrap">
        {subs.map((sub) => {
          const filled = fillOrbitalBoxes(sub.boxes, sub.count);
          return (
            <div key={sub.label} className="em-qsub">
              <span className="em-qsub-lbl">{sub.label}<sup>{sub.count}</sup></span>
              <div className="em-qsub-row">
                {filled.map((b, idx) => (
                  <span key={idx} className={`em-qbox ${b.up && b.down ? 'is-pair' : b.up ? 'is-single' : ''}`}>
                    {b.up && <i className="em-arr-up">↑</i>}
                    {b.down && <i className="em-arr-dn">↓</i>}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Quang phổ vạch phát xạ (380–750 nm) ---------- */
function EmissionSpectrum({ e }) {
  const lines = useMemo(() => getEmissionLines(e), [e]);
  const [activeWl, setActiveWl] = useState(null);

  return (
    <div className="em-lab-card">
      <div className="em-lab-head">
        <strong>Quang phổ vạch phát xạ (380–750 nm)</strong>
        <span className="em-lab-tag">
          {activeWl ? `${activeWl} nm` : `${lines.length} vạch nổi bật`}
        </span>
      </div>
      <div className="em-spec-bar" role="img" aria-label={`Quang phổ vạch của ${e.name}`}>
        {lines.map((wl) => {
          const pct = Math.max(2, Math.min(98, ((wl - 380) / (750 - 380)) * 100));
          const col = wavelengthToCss(wl);
          return (
            <button
              key={wl}
              type="button"
              className="em-spec-line"
              style={{ left: `${pct}%`, background: col, boxShadow: `0 0 8px ${col}` }}
              onMouseEnter={() => setActiveWl(wl)}
              onMouseLeave={() => setActiveWl(null)}
              onFocus={() => setActiveWl(wl)}
              title={`Vạch phát xạ ${wl} nm`}
            />
          );
        })}
      </div>
      <div className="em-spec-scale">
        <span>380 nm (Tím)</span>
        <span>550 nm (Lục)</span>
        <span>750 nm (Đỏ)</span>
      </div>
    </div>
  );
}

/* ---------- Thí nghiệm đốt màu ngọn lửa ---------- */
function FlameTestLab({ e }) {
  const [lit, setLit] = useState(true);
  if (!e.flame) return null;

  return (
    <div className="em-lab-card em-flame-card">
      <div className="em-lab-head">
        <strong>Thí nghiệm màu ngọn lửa</strong>
        <button type="button" className="em-flame-toggle" onClick={() => setLit((v) => !v)}>
          {lit ? 'Tắt lửa' : 'Đốt mẫu thử'}
        </button>
      </div>
      <div className="em-flame-stage">
        <div className="em-burner">
          {lit && (
            <div
              className="em-flame-cone"
              style={{
                '--fl-main': e.flame.color,
                '--fl-soft': e.flame.glow,
              }}
            >
              <span className="em-flame-inner" />
            </div>
          )}
          <div className="em-burner-nozzle" />
        </div>
        <div className="em-flame-copy">
          <b>{e.flame.label}</b>
          <span>
            Khi đốt muối chứa ion {e.symbol}, electron bị kích thích lên mức năng lượng cao rồi phát xạ ánh sáng đặc trưng này.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dữ liệu hàng thuộc tính ---------- */
const ROWS = (e) => [
  ['Khối lượng', MASS_LABEL(e.atomicMass)],
  ['Vị trí', `Chu kỳ ${e.period} · Nhóm ${e.group ?? 'khối f'} · Khối ${e.block || '?'}`],
  ['Phân loại', catNameOf(e)],
  ['Trạng thái (25°C)', e.stateAtRoomTemp],
  ['Độ âm điện (Pauling)', e.electronegativity ?? '—'],
  ['Năng lượng ion hóa I₁', e.ionizationEnergy ? `${e.ionizationEnergy} kJ/mol` : '—'],
  ['Số oxi hóa', OX_LABEL(e.oxidationStates)],
  ['Bán kính nguyên tử', e.atomicRadius ? `${e.atomicRadius} pm` : '—'],
  ['Nhiệt độ nóng chảy', fmtTemp(e.meltingPoint)],
  ['Nhiệt độ sôi', fmtTemp(e.boilingPoint)],
  ['Khối lượng riêng', e.density ? `${e.density} g/cm³` : '—'],
  ['Năm phát hiện', e.discovered ?? 'Hiện đại / Tổng hợp'],
];

export default function ElementModal({ e, compare, onClose, onNavigate, vip, fav, onToggleFav }) {
  const ref = useRef(null);
  const [midTab, setMidTab] = useState('overview'); // 'overview' | 'lab'
  const [imgErr, setImgErr] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(false);

  useEffect(() => {
    setImgErr(false);
    setPhotoZoom(false);
  }, [e?.atomicNumber]);

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === 'Escape') {
        if (photoZoom) setPhotoZoom(false);
        else onClose();
      }
    };
    addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => removeEventListener('keydown', onKey);
  }, [onClose, photoZoom]);

  const backdropClose = (ev) => ev.target === ev.currentTarget && onClose();

  /* ===== SO SÁNH 2 NGUYÊN TỐ ===== */
  if (compare && compare.length === 2) {
    const [a, b] = compare;
    const rowsA = ROWS(a);
    const rowsB = ROWS(b);
    return (
      <div className="backdrop" onMouseDown={backdropClose}>
        <div className="emodal" role="dialog" aria-modal="true" aria-label="So sánh nguyên tố" tabIndex={-1} ref={ref}>
          <header className="em-head">
            <button className="em-pill em-back" onClick={onClose}><Icon name="back" /><span>Quay lại</span></button>
            <h2 className="em-title">So sánh {a.name} ({a.symbol}) và {b.name} ({b.symbol})</h2>
            <button className="em-pill em-x" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
          </header>
          <div className="em-grid two">
            <section className="em-col">
              <div className="cmp-heroes">
                {[a, b].map((x) => (
                  <div key={x.atomicNumber} className="em-card sm" style={{ '--cat': `var(--${x.category})` }}>
                    {x.image && <img src={x.image} alt={x.name} className="em-card-bg-img" />}
                    <span className="em-z">{x.atomicNumber}</span>
                    <div className="em-sym">{x.symbol}</div>
                    <div className="em-name">{x.name}</div>
                    <div className="em-en">Khối {x.block} · {x.atomicMass}</div>
                  </div>
                ))}
              </div>
              <table className="compare-table">
                <tbody>
                  {rowsA.map((r, i) => {
                    const va = r[1];
                    const vb = rowsB[i][1];
                    const na = parseFloat(String(va));
                    const nb = parseFloat(String(vb));
                    const aWin = !isNaN(na) && !isNaN(nb) && na > nb && !r[0].includes('Vị trí');
                    const bWin = !isNaN(na) && !isNaN(nb) && nb > na && !r[0].includes('Vị trí');
                    return (
                      <tr key={r[0]}>
                        <td className={aWin ? 'win' : ''}>{va}</td>
                        <th>{r[0]}</th>
                        <td className={bWin ? 'win' : ''}>{vb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="cmp-cfgs">
                {[a, b].map((x) => (
                  <div key={x.atomicNumber}><h3>Cấu hình {x.symbol}</h3><p className="em-cfg">{x.shortConfiguration}</p></div>
                ))}
              </div>
            </section>
            <section className="em-col em-right">
              <AiPanel elements={[a, b]} vip={vip} />
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* ===== 1 NGUYÊN TỐ — PHÒNG THÍ NGHIỆM 3D + ẢNH THỰC + AI PRO ===== */
  const rows = ROWS(e);
  const prevEl = e.atomicNumber > 1 ? ELEMENTS[e.atomicNumber - 2] : null;
  const nextEl = e.atomicNumber < ELEMENTS.length ? ELEMENTS[e.atomicNumber] : null;
  const realExamples = e.examples?.length
    ? e.examples
    : e.uses
      ? e.uses.split(',').map((s) => s.trim()).filter(Boolean)
      : [`Nguyên tố nhóm ${catNameOf(e)} (khối ${e.block}) trong bảng tuần hoàn IUPAC`];

  return (
    <div className="backdrop" onMouseDown={backdropClose}>
      <div
        className="emodal emodal-pro"
        role="dialog"
        aria-modal="true"
        aria-label={e.name}
        tabIndex={-1}
        ref={ref}
        style={{ '--cat': `var(--${e.category})` }}
      >
        <header className="em-head">
          <button className="em-pill em-back" onClick={onClose}><Icon name="back" /><span>Quay lại</span></button>
          <span className="em-head-sym" style={{ background: `var(--${e.category})` }}>{e.symbol}</span>
          <h2 className="em-title">
            {e.name} <em>Z = {e.atomicNumber}</em>
          </h2>

          {typeof onNavigate === 'function' && (
            <div className="em-nav-pair">
              <button
                type="button"
                className="em-pill em-step"
                disabled={!prevEl}
                onClick={() => prevEl && onNavigate(prevEl)}
                title={prevEl ? `Nguyên tố trước: ${prevEl.symbol} (${prevEl.name})` : ''}
              >
                ← {prevEl ? prevEl.symbol : ''}
              </button>
              <button
                type="button"
                className="em-pill em-step"
                disabled={!nextEl}
                onClick={() => nextEl && onNavigate(nextEl)}
                title={nextEl ? `Nguyên tố tiếp: ${nextEl.symbol} (${nextEl.name})` : ''}
              >
                {nextEl ? nextEl.symbol : ''} →
              </button>
            </div>
          )}

          <button className={'em-pill em-fav' + (fav ? ' on' : '')} onClick={onToggleFav} aria-pressed={!!fav}>
            <Icon name="star" fill={!!fav} /><span>{fav ? 'Đã lưu' : 'Yêu thích'}</span>
          </button>
          <button className="em-pill em-x" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
        </header>

        <div className="em-grid em-grid-pro">
          {/* CỘT TRÁI: ẢNH THỰC TẾ + MÔ PHỎNG 3D WEBGL */}
          <section className="em-col em-left">
            <div
              className={`em-photo-hero ${e.image && !imgErr ? 'has-photo' : ''}`}
              onClick={() => e.image && !imgErr && setPhotoZoom(true)}
              title={e.image && !imgErr ? 'Bấm để phóng to ảnh mẫu vật thực tế' : ''}
            >
              {e.image && !imgErr && (
                <img
                  src={e.image}
                  alt={e.imageTitle || e.name}
                  className="em-real-photo"
                  loading="eager"
                  onError={() => setImgErr(true)}
                />
              )}
              <div className="em-photo-scrim" />
              <div className="em-photo-top">
                <span className="em-z-badge">Z = {e.atomicNumber}</span>
                <span className="em-block-badge">Khối {e.block}</span>
                <span className="em-mass-badge">{e.atomicMass}</span>
              </div>
              <div className="em-photo-bottom">
                <strong className="em-photo-sym">{e.symbol}</strong>
                <div className="em-photo-meta">
                  <b>{e.name}</b>
                  <span>{catNameOf(e)} · {e.stateAtRoomTemp}</span>
                </div>
              </div>
              {e.image && !imgErr && (
                <span className="em-photo-zoom-tag">Ảnh thực tế · Phóng to</span>
              )}
            </div>

            {e.imageTitle && !imgErr && (
              <p className="em-photo-caption">{e.imageTitle}</p>
            )}

            {/* TRÌNH MÔ PHỎNG 3D THREE.JS (BOHR / OBITAN / TINH THỂ) */}
            <div>
              <h3>Mô phỏng 3D tương tác (WebGL)</h3>
              <Atom3DViewer element={e} />
            </div>
          </section>

          {/* CỘT GIỮA: THÔNG SỐ CHI TIẾT, VÍ DỤ THỰC TẾ, PTHH, QUANG PHỔ & NGỌN LỬA */}
          <section className="em-col em-mid">
            <div className="em-mid-tabs" role="tablist">
              <button
                type="button"
                className={`em-mid-tab ${midTab === 'overview' ? 'is-on' : ''}`}
                onClick={() => setMidTab('overview')}
              >
                Chi tiết &amp; Ứng dụng
              </button>
              <button
                type="button"
                className={`em-mid-tab ${midTab === 'lab' ? 'is-on' : ''}`}
                onClick={() => setMidTab('lab')}
              >
                Lượng tử &amp; Thí nghiệm
              </button>
            </div>

            {midTab === 'overview' ? (
              <div className="em-mid-stack">
                {/* 4 chỉ số nổi bật 2×2 dễ quét mắt tức thì */}
                <div className="em-kpi-grid">
                  <div className="em-kpi-card">
                    <span>Khối lượng</span>
                    <b>{e.atomicMass} u</b>
                  </div>
                  <div className="em-kpi-card">
                    <span>Độ âm điện</span>
                    <b>{e.electronegativity ?? '—'}</b>
                  </div>
                  <div className="em-kpi-card">
                    <span>Nóng chảy</span>
                    <b>{typeof e.meltingPoint === 'number' ? `${Math.round(e.meltingPoint - 273.15)}°C` : '—'}</b>
                  </div>
                  <div className="em-kpi-card">
                    <span>Khối lượng riêng</span>
                    <b>{e.density ? `${e.density} g/cm³` : '—'}</b>
                  </div>
                </div>

                {/* Ví dụ thực tế đời sống */}
                <div className="em-examples-box">
                  <h4>Ví dụ thực tế &amp; Ứng dụng nổi bật</h4>
                  <ul>
                    {realExamples.map((ex, idx) => (
                      <li key={idx}>{ex}</li>
                    ))}
                  </ul>
                </div>

                {/* PTHH trọng tâm GDPT 2018 */}
                {e.reactions && e.reactions.length > 0 && (
                  <div className="em-reactions-box">
                    <h4>Phản ứng đặc trưng (GDPT 2018)</h4>
                    <div className="em-rxn-list">
                      {e.reactions.map((rx, idx) => (
                        <code key={idx} className="em-rxn-item">{rx}</code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cấu hình electron */}
                <div className="em-cfg-card">
                  <div>
                    <span>Cấu hình rút gọn</span>
                    <strong className="mono">{e.shortConfiguration}</strong>
                  </div>
                  <div>
                    <span>Cấu hình đầy đủ</span>
                    <small className="mono">{e.electronConfiguration}</small>
                  </div>
                </div>

                {/* Bảng thông số vật lý - hóa học */}
                <dl className="em-dl">
                  {rows.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>
                        {k === 'Phân loại' && <i className="em-dot" style={{ background: `var(--${e.category})` }} />}
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <div className="em-mid-stack">
                <QuantumBoxDiagram e={e} />
                <EmissionSpectrum e={e} />
                <FlameTestLab e={e} />
                {!e.flame && (
                  <div className="em-lab-note">
                    Nguyên tố <b>{e.name} ({e.symbol})</b> không tạo màu ngọn lửa đặc trưng trong thử nghiệm đèn Bunsen thông thường — hãy xem các vạch phát xạ của nó ở dải quang phổ phía trên hoặc xoay mô hình <b>Obitan 3D / Tinh thể 3D</b> ở cột bên trái!
                  </div>
                )}
              </div>
            )}
          </section>

          {/* CỘT PHẢI: GIA SƯ ELEC AI PRO */}
          <section className="em-col em-right">
            <AiPanel elements={[e]} vip={vip} />
          </section>
        </div>

        {/* Lightbox phóng to ảnh thực tế nguyên tố */}
        {photoZoom && e.image && (
          <div className="em-lightbox" onClick={() => setPhotoZoom(false)}>
            <div className="em-lightbox-box" onClick={(ev) => ev.stopPropagation()}>
              <img src={e.image} alt={e.name} />
              <div className="em-lightbox-cap">
                <strong>{e.name} ({e.symbol}) · Z={e.atomicNumber}</strong>
                <span>{e.imageTitle || 'Ảnh mẫu vật thực tế từ Wikimedia Commons'}</span>
              </div>
              <button type="button" className="em-pill em-x" onClick={() => setPhotoZoom(false)}>
                <Icon name="close" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
