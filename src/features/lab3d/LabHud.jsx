/* ============================================================
   LabHud.jsx — GIAO DIỆN PHÒNG LAB CHUYÊN SÂU PHONG CÁCH
   LABSTER 2024+ × PRAXILABS × APPLE SCIENTIFIC STUDIO
   - 3 cụm đảo nổi siêu gọn trên đỉnh (90% viewport mở thoáng cho cảnh 3D)
   - Thanh công cụ dọc 52px bên trái (Hóa chất · Trạm 3D · LabPad · Bài học · Nhật ký)
   - Ngăn kéo LabPad trượt mượt (mặc định đóng để ngắm toàn cảnh phòng Lab)
   - Thẻ thông số dụng cụ Live gọn góc phải trên (mL · pH · °C)
   - Dock thao tác đáy cảm ứng: Chọn dụng cụ · Phản ứng đẹp · Chọn chất · 10/20/30/50mL · Rót vào
   ============================================================ */
import { CHEMS, FLAME_IONS, ELECTROLYTES, MOLECULES_3D, chemLabel, volumeOf } from './engine.js';
import { LiveTelemetryChart } from './LabModals.jsx';

/* ---------- BỘ ICON SVG SẮC NÉT (1.8px STROKE) ---------- */
const Ic = {
  back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>,
  flask: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14 9.31V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>,
  atom: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5" /><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" /><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" /></svg>,
  chart: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
  list: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  book: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
  sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>,
  moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>,
  scope: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>,
  undo: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>,
  expand: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>,
  drop: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>,
  flame: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
  refresh: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>,
  spark: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" /></svg>,
  close: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
};

const RAIL_ITEMS = [
  { id: 'chems', label: 'Hóa chất', Icon: Ic.flask },
  { id: 'stations', label: 'Trạm 3D', Icon: Ic.atom },
  { id: 'monitor', label: 'LabPad', Icon: Ic.chart },
  { id: 'guide', label: '12 Bài', Icon: Ic.list },
  { id: 'log', label: 'Sổ & Lưu', Icon: Ic.book },
];

const SHOWCASE_DEMOS = [
  ['golden-rain', 'Mưa Vàng PbI₂', '#eab308'],
  ['volcano', 'Núi lửa CO₂', '#0ea5e9'],
  ['oxygen-burst', 'Oxy già O₂', '#3b82f6'],
  ['royal-complex', 'Phức xanh lam', '#1d4ed8'],
  ['copper-no2', 'Khí nâu NO₂', '#d97706'],
  ['titration-pink', 'Chuẩn độ hồng', '#ec4899'],
];

export default function LabHud({
  view, focus, walk, setWalk, jumpToStation,
  lightMode, cycleLightMode, cinema, setCinema,
  aiOpen, setAiOpen, onOpenScope, undoLast, historyCount, fullscreen,
  activeDrawer, toggleDrawer, setActiveDrawer,
  containers, selected, selectVessel, selectedContainer,
  curVol, curPH, curSolid, curTotalMass, telemetry,
  chem, setChem, searchQuery, setSearchQuery, catFilter, setCatFilter,
  catFilters, filteredChems, suggestions,
  amount, setAmount, pour, transferTarget, setTransferTarget, pourBetweenVessels,
  measurePH, stir, burnerLit, setBurnerLit, washSelected, resetSession,
  showcaseOpen, setShowcaseOpen, runShowcaseReaction,
  buretteTitrant, setBuretteTitrant, buretteLevel, setBuretteLevel, dripFromBurette,
  flameIon, pickFlameIon, curFlame,
  electrolyteId, setElectrolyteId, electrolysisVoltage, setElectrolysisVoltage, curElectrolyte,
  moleculeId, setMoleculeId, moleculeSpaceFill, setMoleculeSpaceFill, curMolecule, onLogMolecule,
  laserMode, setLaserMode, prismAngle, setPrismAngle, gravity, setGravity,
  pendulumLength, setPendulumLength, pendulumRunning, setPendulumRunning, onLogOptics,
  experiments, experiment, experimentId, setExperimentId, setSession, session, stepStatus,
  log, quality, setQuality, sound, setSound, saveState, saveCloud, loadLast, exportLabReport,
  onClickSfx,
}) {
  const activeChem = CHEMS[chem];
  const isSolidChem = activeChem?.state === 'solid';
  const isIndChem = activeChem?.state === 'indicator';

  return (
    <>
      {/* ===== 1. THANH ĐỈNH 3 CỤM ĐẢO NỔI (PHONG CÁCH LABSTER × APPLE STUDIO) ===== */}
      <header className="ls-topbar">
        <div className="ls-island ls-brand-island">
          <button
            type="button"
            className="ls-icon-btn"
            onClick={() => { window.location.hash = 'games'; }}
            title="Quay lại Trò chơi Khoa học"
            aria-label="Thoát phòng Lab 3D"
          >
            <Ic.back />
          </button>
          <div className="ls-brand-copy">
            <strong>ELEC Lab 3D</strong>
            <span>{experiment ? `${session.completedSteps}/${experiment.steps.length} bước` : 'Phòng thí nghiệm tự do'}</span>
          </div>
        </div>

        <nav className="ls-island ls-seg-nav" aria-label="Khu vực phòng thí nghiệm">
          {[
            ['bench', 'Bàn Hóa'],
            ['titration', 'Burette'],
            ['electrolysis', 'Điện phân'],
            ['molecules', 'Phân tử & DNA'],
            ['optics', 'Quang học'],
            ['room', 'Toàn phòng'],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={'ls-seg-item' + (view === v && !focus ? ' on' : '')}
              onClick={() => jumpToStation(v)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className={'ls-seg-item' + (walk ? ' on' : '')}
            onClick={() => setWalk((w) => !w)}
            title="Đi lại góc nhìn thứ nhất (WASD)"
          >
            {walk ? 'Dừng đi' : 'WASD'}
          </button>
        </nav>

        <div className="ls-island ls-tools-island">
          <button
            type="button"
            className="ls-icon-btn"
            onClick={cycleLightMode}
            title={`Ánh sáng hiện tại: ${lightMode === 'day' ? 'Sáng tự nhiên' : lightMode === 'dark' ? 'Phòng tối Quang học' : 'Cyber STEM'} (bấm để đổi)`}
          >
            {lightMode === 'day' ? <Ic.sun /> : <Ic.moon />}
          </button>
          <button type="button" className="ls-icon-btn" onClick={onOpenScope} title="Kính hiển vi quang học 4×–100×">
            <Ic.scope />
          </button>
          <button type="button" className="ls-icon-btn" onClick={undoLast} disabled={!historyCount} title={`Hoàn tác (${historyCount})`}>
            <Ic.undo />
          </button>
          <button type="button" className="ls-icon-btn" onClick={fullscreen} title="Toàn màn hình">
            <Ic.expand />
          </button>
          <button
            type="button"
            className={'ls-ai-pill' + (aiOpen ? ' on' : '')}
            onClick={() => setAiOpen((a) => !a)}
          >
            <img src="/img/elec/elec-happy.png" alt="" className="ls-ai-mini-icon" draggable={false} />
            <span>Bé Elec AI</span>
          </button>
          <button
            type="button"
            className={'ls-text-pill' + (cinema ? ' on' : '')}
            onClick={() => setCinema((c) => !c)}
            title="Ẩn/hiện giao diện để ngắm trọn cảnh 3D"
          >
            {cinema ? 'Hiện UI' : 'Tối giản'}
          </button>
        </div>
      </header>

      {/* ===== 2. THANH ICON DỌC BÊN TRÁI (52px — LABSTER / FIGMA RAIL) ===== */}
      <aside className="ls-rail" aria-label="Bảng công cụ phòng thí nghiệm">
        {RAIL_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={'ls-rail-btn' + (activeDrawer === id ? ' on' : '')}
            onClick={() => toggleDrawer(id)}
            title={label}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </aside>

      {/* ===== 3. NGĂN KÉO LABPAD DUY NHẤT (TRƯỢT RA KHI CẦN — KHÔNG CHE CẢNH 3D) ===== */}
      {activeDrawer && (
        <section className="ls-drawer" aria-label="Bảng điều khiển LabPad">
          <div className="ls-drawer-head">
            <h3>
              {activeDrawer === 'chems' && 'Kho hóa chất chuẩn THPT'}
              {activeDrawer === 'stations' && 'Điều khiển Đa trạm 3D'}
              {activeDrawer === 'monitor' && 'LabPad · Đo đạc & Đồ thị'}
              {activeDrawer === 'guide' && `Bài thực hành (${experiments.length} bài)`}
              {activeDrawer === 'log' && 'Sổ thí nghiệm & Cài đặt'}
            </h3>
            <button type="button" className="ls-icon-btn sm" onClick={() => setActiveDrawer(null)} aria-label="Đóng ngăn kéo">
              <Ic.close />
            </button>
          </div>

          <div className="ls-drawer-body">
            {/* --- TAB 1: KHO HÓA CHẤT --- */}
            {activeDrawer === 'chems' && (
              <>
                <div className="ls-search-box">
                  <input
                    className="ls-input"
                    placeholder="Tìm tên hoặc công thức (PbI2, H2O2, CuSO4)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" className="ls-clear-btn" onClick={() => setSearchQuery('')}>×</button>
                  )}
                </div>

                <div className="ls-chip-row">
                  {catFilters.map((cf) => (
                    <button
                      key={cf.id}
                      type="button"
                      className={'ls-chip' + (catFilter === cf.id ? ' on' : '')}
                      onClick={() => setCatFilter(cf.id)}
                    >
                      {cf.label}
                    </button>
                  ))}
                </div>

                <div className="ls-chem-grid">
                  {filteredChems.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={'ls-chem-card' + (chem === c.id ? ' on' : '')}
                      onClick={() => { setChem(c.id); onClickSfx?.(); }}
                    >
                      <span className="ls-swatch" style={{ background: c.color }} />
                      <div className="ls-chem-meta">
                        <b>{c.vi}</b>
                        <small>{c.formula}{c.conc ? ` · ${c.conc}M` : ''}</small>
                      </div>
                      {c.hazard?.length > 0 && <span className="ls-hazard">{c.hazard[0]}</span>}
                    </button>
                  ))}
                  {filteredChems.length === 0 && <p className="ls-empty">Không tìm thấy hóa chất phù hợp.</p>}
                </div>

                {suggestions.length > 0 && (
                  <div className="ls-card ls-suggest">
                    <div className="ls-card-title">Gợi ý phản ứng với {selectedContainer?.shortName}</div>
                    {suggestions.map((sg) => (
                      <button
                        key={sg.chemId}
                        type="button"
                        className="ls-suggest-btn"
                        onClick={() => { setChem(sg.chemId); onClickSfx?.(); }}
                      >
                        <span className="ls-swatch sm" style={{ background: CHEMS[sg.chemId]?.color || '#cbd5e1' }} />
                        <span><b>{CHEMS[sg.chemId]?.vi}</b> — {sg.reason}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* --- TAB 2: ĐIỀU KHIỂN 5 TRẠM 3D --- */}
            {activeDrawer === 'stations' && (
              <div className="ls-stack">
                <div className="ls-card">
                  <div className="ls-card-head">
                    <b>Burette chuẩn độ 50 mL</b>
                    <button type="button" className="ls-link-btn" onClick={() => jumpToStation('titration')}>Zoom tới trạm</button>
                  </div>
                  <div className="ls-inline-row">
                    <select className="ls-select" value={buretteTitrant} onChange={(e) => setBuretteTitrant(e.target.value)}>
                      <option value="NaOH">NaOH 1M</option>
                      <option value="HCl">HCl 1M</option>
                      <option value="KMnO4">KMnO4 0.2M</option>
                      <option value="AgNO3">AgNO3 0.5M</option>
                    </select>
                    <span className="ls-mono-val">{buretteLevel.toFixed(1)} mL</span>
                  </div>
                  <div className="ls-inline-row">
                    <button type="button" className="ls-btn primary" onClick={() => dripFromBurette(1)}>Nhỏ 1 mL</button>
                    <button type="button" className="ls-btn" onClick={() => dripFromBurette(5)}>Nhỏ 5 mL</button>
                    <button type="button" className="ls-btn" onClick={() => setBuretteLevel(50)}>Nạp đầy</button>
                  </div>
                </div>

                <div className="ls-card">
                  <div className="ls-card-head">
                    <b>Phổ ngọn lửa Bunsen</b>
                    <button type="button" className="ls-link-btn" onClick={() => { if (lightMode === 'day') cycleLightMode(); jumpToStation('bench'); }}>Phòng tối</button>
                  </div>
                  <div className="ls-chip-row">
                    {FLAME_IONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={'ls-chip' + (flameIon === f.id ? ' on' : '')}
                        onClick={() => pickFlameIon(f.id)}
                      >
                        <span className="ls-dot" style={{ background: f.outer }} />
                        {f.id === 'default' ? 'Chuẩn' : f.id}
                      </button>
                    ))}
                  </div>
                  <p className="ls-hint">{curFlame.ion} ({curFlame.nm}) — {curFlame.note}</p>
                </div>

                <div className="ls-card">
                  <div className="ls-card-head">
                    <b>Trạm Điện phân DC ({electrolysisVoltage.toFixed(1)} V)</b>
                    <button type="button" className="ls-link-btn" onClick={() => jumpToStation('electrolysis')}>Zoom tới trạm</button>
                  </div>
                  <select className="ls-select full" value={electrolyteId} onChange={(e) => setElectrolyteId(e.target.value)}>
                    {Object.values(ELECTROLYTES).map((el) => (
                      <option key={el.id} value={el.id}>{el.name}</option>
                    ))}
                  </select>
                  <input className="ls-range" type="range" min="0" max="12" step="0.5" value={electrolysisVoltage} onChange={(e) => setElectrolysisVoltage(Number(e.target.value))} />
                  <p className="ls-hint"><code>{curElectrolyte.eq}</code></p>
                </div>

                <div className="ls-card">
                  <div className="ls-card-head">
                    <b>Phân tử 3D & Xoắn kép DNA</b>
                    <button type="button" className="ls-link-btn" onClick={() => jumpToStation('molecules')}>Zoom tới trạm</button>
                  </div>
                  <select
                    className="ls-select full"
                    value={moleculeId}
                    onChange={(e) => { setMoleculeId(e.target.value); onLogMolecule(e.target.value); }}
                  >
                    {MOLECULES_3D.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} — {m.geometry}</option>
                    ))}
                  </select>
                  {!curMolecule.isDNA && (
                    <div className="ls-chip-row">
                      <button type="button" className={'ls-chip' + (!moleculeSpaceFill ? ' on' : '')} onClick={() => setMoleculeSpaceFill(false)}>Cầu – Gậy</button>
                      <button type="button" className={'ls-chip' + (moleculeSpaceFill ? ' on' : '')} onClick={() => setMoleculeSpaceFill(true)}>Space-Fill (CPK)</button>
                    </div>
                  )}
                </div>

                <div className="ls-card">
                  <div className="ls-card-head">
                    <b>Quang học Lăng kính & Con lắc 3D</b>
                    <button type="button" className="ls-link-btn" onClick={() => jumpToStation('optics')}>Zoom tới trạm</button>
                  </div>
                  <div className="ls-chip-row">
                    {[['white', 'Trắng 7 màu'], ['red', 'Đỏ'], ['green', 'Lục'], ['blue', 'Lam']].map(([id, lbl]) => (
                      <button key={id} type="button" className={'ls-chip' + (laserMode === id ? ' on' : '')} onClick={() => { setLaserMode(id); onLogOptics(id); }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <label className="ls-label">Góc xoay lăng kính: {prismAngle}°</label>
                  <input className="ls-range" type="range" min="-25" max="25" step="1" value={prismAngle} onChange={(e) => setPrismAngle(Number(e.target.value))} />
                  <label className="ls-label">Trọng trường & dây con lắc ({(pendulumLength * 2.2).toFixed(2)} m)</label>
                  <div className="ls-chip-row">
                    <button type="button" className={'ls-chip' + (gravity === 9.81 ? ' on' : '')} onClick={() => setGravity(9.81)}>Trái Đất</button>
                    <button type="button" className={'ls-chip' + (gravity === 1.62 ? ' on' : '')} onClick={() => setGravity(1.62)}>Mặt Trăng</button>
                    <button type="button" className={'ls-chip' + (gravity === 3.71 ? ' on' : '')} onClick={() => setGravity(3.71)}>Sao Hỏa</button>
                    <button type="button" className="ls-chip" onClick={() => setPendulumRunning((r) => !r)}>{pendulumRunning ? 'Dừng' : 'Chạy'}</button>
                  </div>
                  <input className="ls-range" type="range" min="0.24" max="0.52" step="0.02" value={pendulumLength} onChange={(e) => setPendulumLength(Number(e.target.value))} />
                </div>
              </div>
            )}

            {/* --- TAB 3: LABPAD GIÁM SÁT & ĐỒ THỊ --- */}
            {activeDrawer === 'monitor' && (
              <div className="ls-stack">
                <div className="ls-card">
                  <div className="ls-card-head">
                    <b>{selectedContainer?.name}</b>
                    <button type="button" className="ls-link-btn" onClick={washSelected}>Rửa cốc</button>
                  </div>
                  <div className="ls-kpi-row">
                    <div className="ls-kpi"><span>Thể tích</span><b>{curVol.toFixed(0)} mL</b></div>
                    <div className="ls-kpi"><span>pH</span><b>{curVol > 0 ? curPH.toFixed(2) : '—'}</b></div>
                    <div className="ls-kpi"><span>Nhiệt độ</span><b>{selectedContainer?.temp || 25}°C</b></div>
                    <div className="ls-kpi"><span>Khối lượng</span><b>{curTotalMass.toFixed(1)} g</b></div>
                  </div>
                  <div className="ls-ph-track">
                    <div className="ls-ph-marker" style={{ left: `${Math.max(2, Math.min(98, (curPH / 14) * 100))}%` }} />
                  </div>
                  <div className="ls-tags">
                    {(selectedContainer?.contents || []).map((c, idx) => {
                      const ch = CHEMS[c.id];
                      return ch ? (
                        <span key={idx} className="ls-tag">
                          {ch.formula}: {ch.state === 'solid' ? `${(c.gram || 0).toFixed(1)}g` : `${(c.mL || 0).toFixed(0)}mL`}
                        </span>
                      ) : null;
                    })}
                    {(selectedContainer?.precipitates || []).map((p, idx) => (
                      <span key={'p' + idx} className="ls-tag precip">↓ {p.formula}</span>
                    ))}
                    {!(selectedContainer?.contents?.length || selectedContainer?.precipitates?.length) && (
                      <span className="ls-empty">Dụng cụ đang trống</span>
                    )}
                  </div>
                </div>

                <LiveTelemetryChart points={telemetry} />

                <div className="ls-card">
                  <div className="ls-card-title">Phương trình ghi nhận</div>
                  <div className="ls-eq-list">
                    {log.flatMap((l) => l.events || []).slice(-6).map((e, i) => (
                      <div key={i} className="ls-eq-item">
                        {e.eq && <code>{e.eq}</code>}
                        <small>{e.text}</small>
                      </div>
                    ))}
                    {log.flatMap((l) => l.events || []).length === 0 && <p className="ls-empty">Chưa có phản ứng nào xảy ra.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 4: 12 BÀI THỰC HÀNH --- */}
            {activeDrawer === 'guide' && (
              <div className="ls-stack">
                <select
                  className="ls-select full"
                  value={experimentId || ''}
                  onChange={(e) => {
                    setExperimentId(e.target.value || null);
                    setSession((s) => ({ ...s, experiment: e.target.value }));
                  }}
                >
                  <option value="">Tự do khám phá</option>
                  {experiments.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
                {experiment && (
                  <div className="ls-card">
                    <div className="ls-card-head">
                      <b>Tiến độ bài thực hành</b>
                      <span className="ls-mono-val">{session.completedSteps}/{experiment.steps.length}</span>
                    </div>
                    <div className="ls-progress-bar">
                      <div style={{ width: `${(session.completedSteps / Math.max(1, experiment.steps.length)) * 100}%` }} />
                    </div>
                    <ol className="ls-mission-list">
                      {experiment.steps.map((s, i) => (
                        <li key={i} className={stepStatus[i] ? 'done' : ''}>{s.text}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 5: NHẬT KÝ, LƯU CLOUD & CÀI ĐẶT --- */}
            {activeDrawer === 'log' && (
              <div className="ls-stack">
                <div className="ls-card">
                  <div className="ls-card-title">Chất lượng & Âm thanh</div>
                  <div className="ls-inline-row">
                    <select className="ls-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                      <option value="high">Đồ họa: Siêu nét 2K</option>
                      <option value="low">Đồ họa: Mượt nhẹ</option>
                    </select>
                    <button type="button" className="ls-btn" onClick={() => setSound((s) => !s)}>
                      {sound ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
                    </button>
                  </div>
                </div>

                <div className="ls-card">
                  <div className="ls-card-title">Nhật ký thao tác ({log.length})</div>
                  <div className="ls-log-list">
                    {log.length === 0 && <p className="ls-empty">Chưa có thao tác nào.</p>}
                    {log.slice(-18).reverse().map((l, i) => (
                      <div key={i} className="ls-log-item">
                        <time>{new Date(l.at).toLocaleTimeString('vi-VN')}</time>
                        <span>
                          {l.act === 'pour' && <>Cho <b>{l.ml}{l.isSolid ? 'g' : ' mL'} {chemLabel(CHEMS[l.chem])}</b> vào {containers[l.instrument]?.shortName}</>}
                          {l.act === 'transfer' && <>San <b>{l.ml} mL</b> sang <b>{containers[l.instrument]?.shortName}</b></>}
                          {l.act === 'burette' && <>Burette nhỏ <b>{l.ml} mL {CHEMS[l.chem]?.formula}</b></>}
                          {l.act === 'measure' && <>Đo pH = <b>{l.pH?.toFixed(2)}</b></>}
                          {l.act === 'wash' && <>Rửa sạch {containers[l.instrument]?.shortName}</>}
                          {l.act === 'stir' && <>Khuấy từ {containers[l.instrument]?.shortName}</>}
                          {l.act === 'heat' && <>Đun nóng {containers[l.instrument]?.shortName}</>}
                          {l.act === 'flame' && <>Thử ngọn lửa <b>{l.chem}</b></>}
                          {l.act === 'molecule' && <>Chiếu phân tử <b>{l.chem}</b></>}
                          {l.act === 'optics' && <>Quang học <b>{l.chem}</b></>}
                          {l.act === 'scope' && <>Soi Kính hiển vi</>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ls-inline-row">
                  <button type="button" className="ls-btn primary" onClick={saveCloud}>Lưu Cloud</button>
                  <button type="button" className="ls-btn" onClick={loadLast}>Khôi phục</button>
                  <button type="button" className="ls-btn" onClick={exportLabReport}>Xuất .md</button>
                </div>
                <p className="ls-hint">Trạng thái: {saveState === 'saving' ? 'Đang lưu…' : saveState === 'saved' ? 'Đã lưu Cloud' : 'Tự động lưu cục bộ'}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== 4. THẺ THÔNG SỐ DỤNG CỤ LIVE GỌN GÓC PHẢI TRÊN (KHÔNG CHE CẢNH 3D) ===== */}
      <div className="ls-live-pill" onClick={() => toggleDrawer('monitor')} role="button" tabIndex={0}>
        <div className="ls-live-head">
          <span className="ls-dot lg" style={{ background: curVol > 0 ? selectedContainer?.color : '#94a3b8' }} />
          <b>{selectedContainer?.shortName}</b>
          <span className="ls-live-open">LabPad ↗</span>
        </div>
        <div className="ls-live-metrics">
          <span><b>{curVol.toFixed(0)}</b> mL</span>
          <span>pH <b>{curVol > 0 ? curPH.toFixed(1) : '—'}</b></span>
          <span><b>{selectedContainer?.temp || 25}°C</b></span>
        </div>
        <div className="ls-ph-track mini">
          <div className="ls-ph-marker" style={{ left: `${Math.max(3, Math.min(97, (curPH / 14) * 100))}%` }} />
        </div>
      </div>

      {/* ===== 5. DOCK THAO TÁC ĐÁY PHONG CÁCH APPLE STUDIO × LABSTER ===== */}
      <footer className="ls-dock">
        {showcaseOpen && (
          <div className="ls-showcase-pop">
            <span className="ls-pop-label">Thí nghiệm ấn tượng 1-Click</span>
            {SHOWCASE_DEMOS.map(([id, label, dot]) => (
              <button
                key={id}
                type="button"
                className="ls-demo-pill"
                onClick={() => { setShowcaseOpen(false); runShowcaseReaction(id); }}
              >
                <span className="ls-dot" style={{ background: dot }} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Dải 6 dụng cụ + nút Phản ứng đẹp */}
        <div className="ls-dock-vessels">
          {Object.values(containers).map((v) => (
            <button
              key={v.id}
              type="button"
              className={'ls-vchip' + (selected === v.id ? ' on' : '')}
              onClick={() => selectVessel(v.id, v.position)}
            >
              <span className="ls-dot" style={{ background: volumeOf(v) > 0 ? v.color : '#94a3b8' }} />
              <span>{v.shortName}</span>
              <em>{Math.round(volumeOf(v))}mL</em>
            </button>
          ))}
          <button
            type="button"
            className={'ls-vchip demo' + (showcaseOpen ? ' on' : '')}
            onClick={() => setShowcaseOpen((o) => !o)}
          >
            <Ic.spark />
            <span>Phản ứng đẹp</span>
          </button>
        </div>

        {/* Hàng thao tác chính gọn gàng, nút bấm sắc nét */}
        <div className="ls-dock-actions">
          <button
            type="button"
            className="ls-chem-picker-pill"
            onClick={() => toggleDrawer('chems')}
            title="Bấm để mở kho hóa chất"
          >
            <span className="ls-swatch sm" style={{ background: activeChem?.color || '#cbd5e1' }} />
            <span className="ls-picker-text">
              <b>{activeChem ? activeChem.vi : 'Chọn hóa chất'}</b>
              {activeChem && <small>{activeChem.formula}</small>}
            </span>
          </button>

          {!isSolidChem && !isIndChem && (
            <div className="ls-vol-pills" role="group" aria-label="Thể tích rót">
              {[10, 20, 30, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={'ls-vol-btn' + (amount === v ? ' on' : '')}
                  onClick={() => setAmount(v)}
                >
                  {v}mL
                </button>
              ))}
            </div>
          )}

          <button type="button" className="ls-cta-pour" onClick={pour} disabled={!chem}>
            <Ic.drop />
            <span>
              {isSolidChem
                ? `Thả ${activeChem?.solidGram || 3}g`
                : isIndChem
                ? 'Nhỏ chỉ thị'
                : `Rót ${amount}mL`}
            </span>
          </button>

          <span className="ls-dock-sep" />

          <div className="ls-transfer-group">
            <select
              className="ls-select compact"
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              title="Dụng cụ đích"
            >
              {Object.values(containers).filter((v) => v.id !== selected).map((v) => (
                <option key={v.id} value={v.id}>→ {v.shortName}</option>
              ))}
            </select>
            <button type="button" className="ls-btn sm" onClick={pourBetweenVessels} disabled={curVol <= 0}>
              San
            </button>
          </div>

          <button type="button" className="ls-btn sm" onClick={stir}>Khuấy</button>
          <button type="button" className={'ls-btn sm' + (burnerLit ? ' flame-on' : '')} onClick={() => setBurnerLit((b) => !b)}>
            <Ic.flame />
            <span>{burnerLit ? 'Tắt đèn' : 'Đèn cồn'}</span>
          </button>
          <button type="button" className="ls-btn sm" onClick={measurePH}>Đo pH</button>
          <button type="button" className="ls-btn sm" onClick={washSelected}>Rửa</button>
          <button type="button" className="ls-btn sm danger" onClick={resetSession} title="Đặt lại bàn thí nghiệm">
            <Ic.refresh />
          </button>
        </div>
      </footer>
    </>
  );
}
