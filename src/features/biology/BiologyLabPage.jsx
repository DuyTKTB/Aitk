import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { askAI } from '../../components/HomePlus.jsx';
import { BIO_GROUPS, BIOLOGY_MODULES, VALID_BIO_SIM_IDS } from './biologyCatalog.js';
import BiologyInquiryWorkbench from './BiologyInquiryWorkbench.jsx';
import './biology-lab.css';

/* ── Lazy-load từng mô phỏng độc lập để giữ bundle ban đầu siêu nhẹ ── */
const SIM_COMPONENTS = {
  'cell-3d': lazy(() => import('./sims/Cell3DExplorerSim.jsx')),
  'cell-compare': lazy(() => import('./sims/CellCompareSim.jsx')),
  'mitosis-meiosis': lazy(() => import('./sims/MitosisMeiosisSim.jsx')),
  photosynthesis: lazy(() => import('./sims/PhotosynthesisSim.jsx')),
  respiration: lazy(() => import('./sims/CellularRespirationSim.jsx')),
  'dna-3d': lazy(() => import('./sims/DnaReplication3DSim.jsx')),
  transcription: lazy(() => import('./sims/TranscriptionTranslationSim.jsx')),
  mendel: lazy(() => import('./sims/MendelGeneticsSim.jsx')),
  'gel-dna': lazy(() => import('./sims/GelElectrophoresisSim.jsx')),
  'natural-selection': lazy(() => import('./sims/NaturalSelectionSim.jsx')),
  'human-atlas': lazy(() => import('./sims/HumanAtlas3DSim.jsx')),
  circulatory: lazy(() => import('./sims/CirculatorySim.jsx')),
  respiratory: lazy(() => import('./sims/RespiratorySim.jsx')),
  digestive: lazy(() => import('./sims/DigestiveSim.jsx')),
  nervous: lazy(() => import('./sims/NervousSystemSim.jsx')),
  'food-web': lazy(() => import('./sims/FoodWebSim.jsx')),
  population: lazy(() => import('./sims/PopulationGrowthSim.jsx')),
  'epidemic-sir': lazy(() => import('./sims/EpidemicSirSim.jsx')),
  microscope: lazy(() => import('./sims/VirtualMicroscopeSim.jsx')),
  'bio-workbench': lazy(() => import('./sims/BioLabWorkbenchSim.jsx')),
};

const EXPLORED_STORAGE_KEY = 'elec-bio-explored-v1';

function readBioSimFromHash() {
  if (typeof window === 'undefined') return 'cell-3d';
  const q = (window.location.hash || '').split('?')[1] || '';
  const sim = new URLSearchParams(q).get('sim');
  return sim && VALID_BIO_SIM_IDS.has(sim) ? sim : 'cell-3d';
}

function loadExploredIds() {
  if (typeof window === 'undefined' || !window.localStorage) return ['cell-3d'];
  try {
    const raw = JSON.parse(window.localStorage.getItem(EXPLORED_STORAGE_KEY) || '[]');
    if (Array.isArray(raw) && raw.length) {
      return raw.filter((id) => VALID_BIO_SIM_IDS.has(id));
    }
  } catch {
    /* ignore storage errors */
  }
  return ['cell-3d'];
}

function GroupIcon({ groupId }) {
  if (groupId === 'cell') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17" cy="8.5" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  if (groupId === 'genetics') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M7 3c0 5 10 5 10 9s-10 4-10 9" />
        <path d="M17 3c0 5-10 5-10 9s10 4 10 9" />
        <path d="M8.5 7.5h7M8.5 16.5h7" />
      </svg>
    );
  }
  if (groupId === 'anatomy') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7-4.4-9-9.2C1.6 8.2 3.8 5 7.2 5c1.9 0 3.6 1 4.8 2.6C13.2 6 14.9 5 16.8 5c3.4 0 5.6 3.2 4.2 6.8C19 16.6 12 21 12 21z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 18h12M9 18v-4a5 5 0 0 1 5-5h1" />
      <path d="M13 5l3 3-5 5-3-3z" />
    </svg>
  );
}

export default function BiologyLabPage({ onNavigate }) {
  const [activeId, setActiveId] = useState(readBioSimFromHash);
  const [viewMode, setViewMode] = useState('workbench'); // 'workbench' | 'gallery'
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState(0); // 0 = all, 10, 11, 12, '3d'
  const [presentMode, setPresentMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [explored, setExplored] = useState(loadExploredIds);

  const markExplored = useCallback((id) => {
    setExplored((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(EXPLORED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    markExplored(activeId);
  }, [activeId, markExplored]);

  useEffect(() => {
    const sync = () => setActiveId(readBioSimFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const selectSim = useCallback((id, switchToWorkbench = true) => {
    setActiveId(id);
    if (switchToWorkbench) setViewMode('workbench');
    if (typeof window !== 'undefined' && window.location.hash !== `#biology-lab?sim=${id}`) {
      window.history.replaceState(null, '', `#biology-lab?sim=${id}`);
    }
  }, []);

  const activeIndex = useMemo(
    () => Math.max(0, BIOLOGY_MODULES.findIndex((m) => m.id === activeId)),
    [activeId]
  );
  const activeMod = BIOLOGY_MODULES[activeIndex] || BIOLOGY_MODULES[0];
  const activeGroup = BIO_GROUPS.find((g) => g.id === activeMod.group) || BIO_GROUPS[0];
  const prevMod = BIOLOGY_MODULES[(activeIndex - 1 + BIOLOGY_MODULES.length) % BIOLOGY_MODULES.length];
  const nextMod = BIOLOGY_MODULES[(activeIndex + 1) % BIOLOGY_MODULES.length];

  // Phím tắt bàn phím ← / → để giáo viên lướt 20 mô phỏng như slide Keynote
  useEffect(() => {
    if (viewMode !== 'workbench') return undefined;
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowRight' && (e.altKey || presentMode)) {
        e.preventDefault();
        selectSim(nextMod.id, false);
      } else if (e.key === 'ArrowLeft' && (e.altKey || presentMode)) {
        e.preventDefault();
        selectSim(prevMod.id, false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode, presentMode, nextMod.id, prevMod.id, selectSim]);

  const filteredModules = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return BIOLOGY_MODULES.filter((m) => {
      if (gradeFilter === '3d' && !m.is3D) return false;
      if (typeof gradeFilter === 'number' && gradeFilter > 0 && m.gradeNum !== gradeFilter && !m.grade.includes(String(gradeFilter))) {
        return false;
      }
      if (!needle) return true;
      return (
        m.label.toLowerCase().includes(needle) ||
        m.desc.toLowerCase().includes(needle) ||
        m.tag.toLowerCase().includes(needle) ||
        m.num.includes(needle)
      );
    });
  }, [search, gradeFilter]);

  const ActiveSim = SIM_COMPONENTS[activeMod.id] || SIM_COMPONENTS['cell-3d'];
  const exploredPct = Math.round((explored.length / BIOLOGY_MODULES.length) * 100);

  const handleAskAI = (prompt) => {
    askAI(prompt);
  };

  return (
    <section
      className={`wrap bl-page${presentMode ? ' is-present' : ''}`}
      data-bio-group={activeMod.group}
      style={{ '--bl-group-accent': activeGroup.accent }}
    >
      <header className="bl-topbar">
        <div className="bl-brand">
          <div className="bl-brand-avatar">
            <img
              src={activeMod.mascot}
              alt="ELEC Sinh học Studio"
              width="44"
              height="44"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="bl-title-row">
              <h1>Phòng Thí Nghiệm Sinh Học Ảo</h1>
              <span className="bl-pill">20 Mô Phỏng · 2D/3D PBR</span>
              <span className="bl-pill-soft">
                #{activeMod.num} · {activeMod.tag} · {activeMod.grade}
              </span>
            </div>
            <p>
              {activeGroup.label} — Đã khám phá <strong>{explored.length}/{BIOLOGY_MODULES.length}</strong> phòng lab ({exploredPct}%)
            </p>
          </div>
        </div>

        <div className="bl-top-actions">
          <div className="bl-view-switch" role="tablist" aria-label="Chế độ hiển thị">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'workbench'}
              className={viewMode === 'workbench' ? 'active' : ''}
              onClick={() => setViewMode('workbench')}
            >
              Bàn thí nghiệm
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'gallery'}
              className={viewMode === 'gallery' ? 'active' : ''}
              onClick={() => { setPresentMode(false); setViewMode('gallery'); }}
            >
              Thư viện 20 Lab
            </button>
          </div>

          {viewMode === 'workbench' && (
            <button
              type="button"
              className={`bl-btn${presentMode ? ' is-on' : ''}`}
              onClick={() => setPresentMode((v) => !v)}
              title="Phóng lớn sân khấu mô phỏng để chiếu bảng trên lớp (dùng phím ← / → để chuyển bài)"
            >
              {presentMode ? 'Thoát Trình chiếu' : 'Trình chiếu lớp'}
            </button>
          )}
          <button
            type="button"
            className="bl-btn cobalt"
            onClick={() =>
              handleAskAI(
                `Tôi đang xem mô phỏng "${activeMod.label}" (${activeMod.grade}). Hãy tóm tắt kiến thức trọng tâm SGK GDPT 2018 và 3 bẫy trắc nghiệm thường gặp!`
              )
            }
          >
            Hỏi Bé ELEC AI
          </button>
          {onNavigate && (
            <button type="button" className="bl-btn" onClick={() => onNavigate('formulas')}>
              Sổ công thức
            </button>
          )}
        </div>
      </header>

      {/* ── CHẾ ĐỘ THƯ VIỆN LƯỚI BENTO 20 MÔ PHỎNG ── */}
      {viewMode === 'gallery' ? (
        <div className="bl-gallery-wrap">
          <div className="bl-gallery-toolbar">
            <input
              type="search"
              className="bl-search-input"
              style={{ marginBottom: 0, maxWidth: 340 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm trong 20 mô phỏng (VD: tế bào, DNA, tim, kính hiển vi...)"
            />
            <div className="bl-grade-pills" style={{ marginBottom: 0 }}>
              {[
                { v: 0, l: 'Tất cả (20)' },
                { v: '3d', l: 'Mô hình 3D (6)' },
                { v: 10, l: 'Lớp 10' },
                { v: 11, l: 'Lớp 11' },
                { v: 12, l: 'Lớp 12' },
              ].map((g) => (
                <button
                  key={String(g.v)}
                  type="button"
                  className={`bl-grade-pill${gradeFilter === g.v ? ' on' : ''}`}
                  onClick={() => setGradeFilter(g.v)}
                >
                  {g.l}
                </button>
              ))}
            </div>
            <div className="bl-progress-pill" title="Tiến độ trải nghiệm các mô phỏng">
              <span>Tiến độ: <b>{explored.length}/20</b></span>
              <div className="bl-progress-track">
                <div className="bl-progress-fill" style={{ width: `${exploredPct}%` }} />
              </div>
            </div>
          </div>

          {BIO_GROUPS.map((grp) => {
            const items = filteredModules.filter((m) => m.group === grp.id);
            if (!items.length) return null;
            return (
              <div key={grp.id} className="bl-gallery-section">
                <div className="bl-gallery-sec-head" style={{ '--grp-col': grp.accent }}>
                  <span className="bl-gallery-sec-ico">
                    <GroupIcon groupId={grp.id} />
                  </span>
                  <h3>{grp.label}</h3>
                  <span className="bl-pill-soft">{items.length} mô phỏng</span>
                </div>
                <div className="bl-gallery-grid">
                  {items.map((m) => {
                    const isVisited = explored.includes(m.id);
                    const isCurrent = m.id === activeMod.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`bl-gallery-card${isCurrent ? ' is-current' : ''}`}
                        style={{ '--card-col': grp.accent }}
                        onClick={() => selectSim(m.id, true)}
                      >
                        <div className="bl-gc-top">
                          <span className="bl-gc-num">#{m.num}</span>
                          <div className="bl-gc-badges">
                            {m.is3D && <span className="bl-tag-3d">3D PBR</span>}
                            <span className="bl-gc-grade">{m.grade}</span>
                            {isVisited && <span className="bl-explored-dot" title="Đã khám phá">✓</span>}
                          </div>
                        </div>
                        <h4>{m.label}</h4>
                        <p>{m.desc}</p>
                        <div className="bl-gc-foot">
                          <span className="bl-gc-tag">{m.tag}</span>
                          <span className="bl-gc-cta">{isCurrent ? 'Đang mở' : 'Khám phá →'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── CHẾ ĐỘ BÀN THÍ NGHIỆM (WORKBENCH) ── */
        <>
          {/* Dải chọn nhanh trên Mobile / Tablet */}
          {!presentMode && (
            <div className="bl-mobile-strip" aria-label="Chọn nhanh mô phỏng">
              {BIOLOGY_MODULES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`bl-mobile-chip${m.id === activeMod.id ? ' active' : ''}`}
                  onClick={() => selectSim(m.id, false)}
                >
                  <span>{m.num}</span> {m.label}
                </button>
              ))}
            </div>
          )}

          <div className={`bl-layout${sidebarCollapsed ? ' is-collapsed' : ''}`}>
            {!presentMode && !sidebarCollapsed && (
              <aside className="bl-sidebar" aria-label="Danh sách 20 mô phỏng Sinh học">
                <div className="bl-sidebar-progress">
                  <div className="bl-sp-row">
                    <span>Hành trình khám phá</span>
                    <strong>{explored.length} / {BIOLOGY_MODULES.length}</strong>
                  </div>
                  <div className="bl-progress-track">
                    <div className="bl-progress-fill" style={{ width: `${exploredPct}%` }} />
                  </div>
                </div>

                <input
                  type="search"
                  className="bl-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm mô phỏng (VD: tế bào, DNA, tim, SIR...)"
                />
                <div className="bl-grade-pills">
                  {[
                    { v: 0, l: 'Tất cả' },
                    { v: '3d', l: '3D' },
                    { v: 10, l: 'L10' },
                    { v: 11, l: 'L11' },
                    { v: 12, l: 'L12' },
                  ].map((g) => (
                    <button
                      key={String(g.v)}
                      type="button"
                      className={`bl-grade-pill${gradeFilter === g.v ? ' on' : ''}`}
                      onClick={() => setGradeFilter(g.v)}
                    >
                      {g.l}
                    </button>
                  ))}
                </div>

                {BIO_GROUPS.map((grp) => {
                  const items = filteredModules.filter((m) => m.group === grp.id);
                  if (!items.length) return null;
                  return (
                    <div key={grp.id} className="bl-group-block">
                      <div className="bl-group-title">
                        <span className="bl-group-dot" style={{ background: grp.accent }} />
                        <span>{grp.short}</span>
                      </div>
                      {items.map((m) => {
                        const isVisited = explored.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`bl-nav-item${m.id === activeMod.id ? ' active' : ''}`}
                            onClick={() => selectSim(m.id, false)}
                          >
                            <span className="bl-nav-num">{m.num}</span>
                            <span className="bl-nav-main">
                              <strong>{m.label}</strong>
                              <small>{m.grade} · {m.tag}</small>
                            </span>
                            {m.is3D ? (
                              <span className="bl-tag-3d">3D</span>
                            ) : isVisited ? (
                              <span className="bl-visited-check" title="Đã khám phá">✓</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </aside>
            )}

            <main className="bl-main">
              <article key={activeMod.id} className="bl-sim-card bl-fade-in">
                <div className="bl-sim-header">
                  <div>
                    <div className="bl-sim-group-kicker" style={{ color: activeGroup.accent }}>
                      <GroupIcon groupId={activeGroup.id} />
                      <span>{activeGroup.label}</span>
                    </div>
                    <h2>{activeMod.num}. {activeMod.label}</h2>
                    <p>{activeMod.desc}</p>
                  </div>
                  <div className="bl-sim-nav-bar">
                    {!presentMode && (
                      <button
                        type="button"
                        className="bl-mini-btn bl-hide-mobile"
                        onClick={() => setSidebarCollapsed((c) => !c)}
                        title={sidebarCollapsed ? 'Hiện danh sách 20 mô phỏng' : 'Thu gọn thanh bên để mở rộng không gian'}
                      >
                        {sidebarCollapsed ? 'Hiện danh sách' : 'Mở rộng khung'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="bl-mini-btn"
                      onClick={() => selectSim(prevMod.id, false)}
                      title={`Bài trước: ${prevMod.label} (Alt + ←)`}
                    >
                      ← Bài trước
                    </button>
                    <span className="bl-sim-counter">
                      {activeMod.num} / {BIOLOGY_MODULES.length}
                    </span>
                    <button
                      type="button"
                      className="bl-mini-btn"
                      onClick={() => selectSim(nextMod.id, false)}
                      title={`Bài tiếp theo: ${nextMod.label} (Alt + →)`}
                    >
                      Bài tiếp →
                    </button>
                    {presentMode && (
                      <select
                        className="bl-search-input"
                        style={{ width: 'auto', margin: 0 }}
                        value={activeMod.id}
                        onChange={(e) => selectSim(e.target.value, false)}
                        aria-label="Chọn nhanh mô phỏng"
                      >
                        {BIOLOGY_MODULES.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.num}. {m.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <Suspense fallback={<div className="bl-loader">Đang khởi tạo mô phỏng {activeMod.label}...</div>}>
                  <ActiveSim onAskAI={handleAskAI} />
                </Suspense>

                <div className="bl-tip-banner">
                  <strong>Mẹo ghi nhớ SGK GDPT 2018:</strong> {activeMod.tip}
                </div>
              </article>

              {!presentMode && (
                <BiologyInquiryWorkbench key={activeMod.id} simId={activeMod.id} onAskAI={handleAskAI} />
              )}
            </main>
          </div>
        </>
      )}
    </section>
  );
}
