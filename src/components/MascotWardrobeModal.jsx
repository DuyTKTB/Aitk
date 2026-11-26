/* ============================================================
   MascotWardrobeModal.jsx — PHÒNG THAY ĐỒ LINH VẬT ELEC AI (105 ĐH & 21 BIỂU CẢM)
   ------------------------------------------------------------
   - Bố cục 2 cột Phòng Thay Đồ 3D:
     + Trái: Bục trình diễn hologram có đèn spotlight, parallax 3D theo chuột,
       3 tông ánh sáng phòng thử đồ & hiệu ứng lóe sáng khi thay trang phục.
     + Phải: Tủ đồ kính mờ tối với tìm kiếm tức thì, lọc vùng miền & chọn nhanh.
   - Hỗ trợ chế độ "Tự động theo Nguyện vọng 1" (Auto NV1) & "Thử ngẫu nhiên".
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CLASSIC_ELEC_OUTFITS,
  getUniversityMascotOutfits,
  resolveCornerMascotOutfit,
} from './PetSkins.jsx';
import { sound } from '../lib/gameSound.js';
import '../styles/mascot-wardrobe.css';

const REGIONS = [
  { id: 'all', label: 'Tất cả (105)' },
  { id: 'Miền Bắc', label: 'Miền Bắc (46)' },
  { id: 'Miền Trung', label: 'Miền Trung (13)' },
  { id: 'Tây Nguyên', label: 'Tây Nguyên (3)' },
  { id: 'Miền Nam', label: 'Miền Nam (43)' },
];

const STAGE_MOODS = [
  { id: 'blue', label: 'Ánh sáng Studio Xanh', cls: 'd-blue' },
  { id: 'gold', label: 'Ánh sáng Hoàng hôn Vàng', cls: 'd-gold' },
  { id: 'neon', label: 'Ánh sáng Neon Tím', cls: 'd-neon' },
];

const AMBIENT_MOTES = [
  { left: '18%', bottom: '24%', dur: '5.6s', delay: '0s' },
  { left: '32%', bottom: '18%', dur: '6.8s', delay: '1.1s' },
  { left: '54%', bottom: '20%', dur: '6.1s', delay: '0.5s' },
  { left: '72%', bottom: '26%', dur: '5.9s', delay: '1.8s' },
  { left: '84%', bottom: '22%', dur: '7.2s', delay: '0.9s' },
  { left: '42%', bottom: '32%', dur: '6.4s', delay: '2.4s' },
];

function normalizeVi(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export default function MascotWardrobeModal({
  isOpen,
  onClose,
  outfitConfig,
  onSelectOutfit,
  nv1SchoolCode,
  nv1SchoolName,
}) {
  const [tab, setTab] = useState('uni'); // 'uni' | 'classic'
  const [region, setRegion] = useState('all');
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState('blue'); // 'blue' | 'gold' | 'neon'
  const [swapTick, setSwapTick] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const swapTimerRef = useRef(null);

  const allUniOutfits = useMemo(() => getUniversityMascotOutfits(), []);

  const filteredUniOutfits = useMemo(() => {
    const q = normalizeVi(query);
    return allUniOutfits.filter((item) => {
      if (region !== 'all' && item.region !== region) return false;
      if (q) {
        const hay = normalizeVi(
          `${item.schoolId} ${item.code} ${item.admissionCode} ${item.name} ${item.shortName} ${item.city} ${item.group}`
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allUniOutfits, region, query]);

  const activeResolved = useMemo(
    () =>
      resolveCornerMascotOutfit({
        outfitConfig,
        nv1SchoolCode,
        isOpen: false,
      }),
    [outfitConfig, nv1SchoolCode]
  );

  const activeUniMeta = useMemo(() => {
    if (!activeResolved.schoolId) return null;
    return allUniOutfits.find((u) => u.schoolId === activeResolved.schoolId) || null;
  }, [allUniOutfits, activeResolved.schoolId]);

  const triggerSwapEffect = () => {
    clearTimeout(swapTimerRef.current);
    setSwapTick((k) => k + 1);
    setIsSwapping(true);
    try { sound?.click?.(); } catch { /* ignore */ }
    swapTimerRef.current = setTimeout(() => setIsSwapping(false), 600);
  };

  useEffect(() => () => clearTimeout(swapTimerRef.current), []);

  // Phím tắt Esc đóng phòng thay đồ & phím R thử đồ ngẫu nhiên
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (e.key === 'Escape') {
        onClose?.();
      } else if ((e.key === 'r' || e.key === 'R') && tag !== 'input' && tag !== 'textarea') {
        handleRandomTry();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tab, filteredUniOutfits]);

  const handleEquip = (nextCfg) => {
    triggerSwapEffect();
    onSelectOutfit?.(nextCfg);
  };

  const handleRandomTry = () => {
    if (tab === 'classic') {
      const pick = CLASSIC_ELEC_OUTFITS[Math.floor(Math.random() * CLASSIC_ELEC_OUTFITS.length)];
      if (pick) handleEquip({ mode: 'classic', value: pick.key });
      return;
    }
    const pool = filteredUniOutfits.length > 0 ? filteredUniOutfits : allUniOutfits;
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) handleEquip({ mode: 'uni', value: pick.schoolId });
  };

  const handleStageMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ rx: -ny * 7, ry: nx * 10 });
  };

  if (!isOpen) return null;

  return (
    <div
      className="mw-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Phòng thay đồ linh vật ELEC AI"
    >
      <div className="mw-shell">
        {/* ── CỘT TRÁI: PHÒNG THỬ ĐỒ 3D SPOTLIGHT ── */}
        <section
          className={`mw-stage mood-${mood}`}
          onMouseMove={handleStageMove}
          onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
        >
          <div className="mw-spotlight-cone" aria-hidden="true" />
          <div className="mw-mirror-frame" aria-hidden="true" />
          <div className="mw-particles" aria-hidden="true">
            {AMBIENT_MOTES.map((m, i) => (
              <span
                key={i}
                className="mw-particle"
                style={{
                  left: m.left,
                  bottom: m.bottom,
                  '--dur': m.dur,
                  '--delay': m.delay,
                }}
              />
            ))}
          </div>

          <div className="mw-stage-top">
            <span className="mw-studio-tag">
              <span className="mw-studio-dot" />
              Phòng Thay Đồ
            </span>

            <div className="mw-stage-top-right">
              <div className="mw-lighting-pills" role="group" aria-label="Đổi ánh sáng phòng thay đồ">
                {STAGE_MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`mw-light-dot ${m.cls} ${mood === m.id ? 'is-active' : ''}`}
                    onClick={() => setMood(m.id)}
                    title={m.label}
                    aria-label={m.label}
                  />
                ))}
              </div>

              <button
                type="button"
                className="mw-close-btn mw-close-mobile"
                onClick={onClose}
                aria-label="Đóng phòng thay đồ"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mw-showcase">
            <div
              key={swapTick}
              className={`mw-mascot-rig ${isSwapping ? 'is-swapping' : ''}`}
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              }}
            >
              <div className="mw-mascot-aura" aria-hidden="true" />
              <div className="mw-flash-burst" aria-hidden="true" />
              <div className="mw-shimmer-beam" aria-hidden="true" />
              <img
                src={activeResolved.src}
                alt={activeResolved.fullName}
                className="mw-hero-img"
                draggable={false}
              />
            </div>

            <div className="mw-pedestal" aria-hidden="true">
              <img
                src={activeResolved.src}
                alt=""
                className="mw-hero-reflection"
                draggable={false}
              />
              <div className="mw-pedestal-orbit" />
              <div className="mw-pedestal-disc" />
              <div className="mw-pedestal-shadow" />
            </div>
          </div>

          <div>
            <div className="mw-stage-info">
              <span className="mw-equipped-pill">
                Đang mặc{activeResolved.badge ? ` · ${activeResolved.badge}` : ''}
              </span>
              <h3 className="mw-stage-name">{activeResolved.fullName}</h3>
              <p className="mw-stage-sub">
                {activeUniMeta
                  ? `${activeUniMeta.city} · ${activeUniMeta.region}`
                  : 'Biểu cảm & trang phục gốc ELEC AI'}
              </p>
            </div>

            <div className="mw-stage-actions">
              <button
                type="button"
                className="mw-stage-btn"
                onClick={handleRandomTry}
                title="Thử nhanh một bộ ngẫu nhiên (Phím R)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8" />
                  <line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" />
                  <line x1="15" y1="15" x2="21" y2="21" />
                  <line x1="4" y1="4" x2="9" y2="9" />
                </svg>
                <span>Thử ngẫu nhiên</span>
              </button>

              <button
                type="button"
                className={`mw-stage-btn ${outfitConfig?.mode === 'auto_nv1' ? 'is-active' : ''}`}
                onClick={() => handleEquip({ mode: 'auto_nv1', value: nv1SchoolCode || 'hello' })}
                title="Tự động mặc đồng phục trường Nguyện vọng 1 của bạn"
              >
                <span className="mw-nv1-dot" />
                <span>Theo NV1 ({nv1SchoolCode || nv1SchoolName || 'Mặc định'})</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── CỘT PHẢI: KỆ TỦ ĐỒ KÍNH MỜ ── */}
        <section className="mw-closet">
          <header className="mw-closet-head">
            <div className="mw-closet-toprow">
              <div className="mw-seg-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'uni'}
                  className={`mw-seg-tab ${tab === 'uni' ? 'is-active' : ''}`}
                  onClick={() => setTab('uni')}
                >
                  Đồng phục ĐH (105)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'classic'}
                  className={`mw-seg-tab ${tab === 'classic' ? 'is-active' : ''}`}
                  onClick={() => setTab('classic')}
                >
                  Biểu cảm gốc ({CLASSIC_ELEC_OUTFITS.length})
                </button>
              </div>

              <div className="mw-closet-right">
                {tab === 'uni' && (
                  <div className="mw-search-wrap">
                    <span className="mw-search-ico" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      className="mw-search-input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tìm NEU, BKA, FTU, YHA, ANND…"
                    />
                    {query && (
                      <button
                        type="button"
                        className="mw-search-clear"
                        onClick={() => setQuery('')}
                        aria-label="Xóa tìm kiếm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="mw-close-btn mw-close-desktop"
                  onClick={onClose}
                  aria-label="Đóng phòng thay đồ"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {tab === 'uni' && (
              <div className="mw-region-row">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`mw-region-pill ${region === r.id ? 'is-active' : ''}`}
                    onClick={() => setRegion(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </header>

          <div className="mw-grid-scroll">
            {tab === 'uni' ? (
              filteredUniOutfits.length === 0 ? (
                <div className="mw-empty">
                  Không tìm thấy trường Đại học nào khớp với từ khóa <b>&ldquo;{query}&rdquo;</b>.
                </div>
              ) : (
                <div className="mw-grid">
                  {filteredUniOutfits.map((u) => {
                    const isSelected =
                      activeResolved.schoolId === u.schoolId &&
                      (outfitConfig?.mode === 'uni' || outfitConfig?.mode === 'auto_nv1');
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`mw-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleEquip({ mode: 'uni', value: u.schoolId })}
                      >
                        {isSelected && <span className="mw-card-equipped">Đang mặc</span>}
                        <div className="mw-card-thumb">
                          <img src={u.src} alt={u.name} loading="lazy" draggable={false} />
                        </div>
                        <span className="mw-card-code">
                          {u.schoolId}
                          {u.admissionCode && u.admissionCode !== u.schoolId ? ` (${u.admissionCode})` : ''}
                        </span>
                        <div className="mw-card-name">{u.name}</div>
                        <span className="mw-card-city">{u.city}</span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="mw-grid">
                {CLASSIC_ELEC_OUTFITS.map((c) => {
                  const isSelected = outfitConfig?.mode === 'classic' && outfitConfig?.value === c.key;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`mw-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleEquip({ mode: 'classic', value: c.key })}
                    >
                      {isSelected && <span className="mw-card-equipped">Đang mặc</span>}
                      <div className="mw-card-thumb">
                        <img src={c.src} alt={c.name} loading="lazy" draggable={false} />
                      </div>
                      <span className="mw-card-code is-classic">{c.tag}</span>
                      <div className="mw-card-name">{c.name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
