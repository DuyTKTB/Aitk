/* ============================================================
   MascotWardrobeModal.jsx — TỦ ĐỒ LINH VẬT ELEC AI (105 TRƯỜNG ĐH & 21 BIỂU CẢM)
   ------------------------------------------------------------
   - Cho phép học sinh thay đồng phục 105 Trường Đại học & Học viện Bắc - Trung - Nam
     hoặc 21 biểu cảm gốc cho nhân vật ELEC AI ở góc màn hình.
   - Hỗ trợ chế độ "Tự động theo Nguyện vọng 1" (Auto NV1): khi đổi NV1, linh vật
     ở góc màn hình tự động khoác áo đồng phục trường NV1 tương ứng.
   ============================================================ */
import React, { useMemo, useState } from 'react';
import {
  CLASSIC_ELEC_OUTFITS,
  getUniversityMascotOutfits,
  resolveCornerMascotOutfit,
} from './PetSkins.jsx';

const REGIONS = [
  { id: 'all', label: 'Tất cả (105)' },
  { id: 'Miền Bắc', label: 'Miền Bắc (46)' },
  { id: 'Miền Trung', label: 'Miền Trung (13)' },
  { id: 'Tây Nguyên', label: 'Tây Nguyên (3)' },
  { id: 'Miền Nam', label: 'Miền Nam (43)' },
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

  if (!isOpen) return null;

  return (
    <div
      className="ns9-wardrobe-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Tủ đồ linh vật ELEC AI"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="ns9-wardrobe-modal"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.28)',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#0f172a',
        }}
      >
        {/* ── Header + Live Stage Preview ── */}
        <div
          style={{
            padding: '18px 22px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '20px',
                background: 'radial-gradient(circle at 50% 45%, rgba(56,189,248,0.28), rgba(15,23,42,0.75))',
                border: '1.5px solid rgba(125, 211, 252, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)',
              }}
            >
              <img
                src={activeResolved.src}
                alt={activeResolved.fullName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))',
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#7dd3fc',
                    border: '1px solid rgba(125, 211, 252, 0.35)',
                  }}
                >
                  TỦ ĐỒ LINH VẬT ELEC AI
                </span>
                {activeResolved.badge && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      background: '#2563eb',
                      color: '#ffffff',
                    }}
                  >
                    Đang mặc: {activeResolved.badge}
                  </span>
                )}
              </div>
              <h3
                style={{
                  margin: '6px 0 3px',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.25,
                }}
              >
                {activeResolved.fullName}
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1' }}>
                Khoác áo đồng phục 105 trường Đại học mơ ước để tiếp thêm động lực ôn thi mỗi ngày!
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => onSelectOutfit?.({ mode: 'auto_nv1', value: nv1SchoolCode || 'hello' })}
              style={{
                padding: '8px 13px',
                borderRadius: '12px',
                border:
                  outfitConfig?.mode === 'auto_nv1'
                    ? '1.5px solid #38bdf8'
                    : '1px solid rgba(255,255,255,0.22)',
                background:
                  outfitConfig?.mode === 'auto_nv1'
                    ? 'rgba(14, 165, 233, 0.25)'
                    : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Tự động mặc đồng phục trường Nguyện vọng 1 của bạn"
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: outfitConfig?.mode === 'auto_nv1' ? '#38bdf8' : '#94a3b8',
                }}
              />
              <span>
                Theo NV1 ({nv1SchoolCode || nv1SchoolName || 'Mặc định'})
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng tủ đồ"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Toolbar: Tabs + Search + Region Filter ── */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                background: '#e2e8f0',
                padding: '4px',
                borderRadius: '12px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setTab('uni')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: tab === 'uni' ? '#ffffff' : 'transparent',
                  color: tab === 'uni' ? '#1d4ed8' : '#475569',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  boxShadow: tab === 'uni' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none',
                }}
              >
                Đồng phục 105 Trường ĐH (105)
              </button>
              <button
                type="button"
                onClick={() => setTab('classic')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  border: 'none',
                  background: tab === 'classic' ? '#ffffff' : 'transparent',
                  color: tab === 'classic' ? '#1d4ed8' : '#475569',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  boxShadow: tab === 'classic' ? '0 2px 6px rgba(15,23,42,0.08)' : 'none',
                }}
              >
                Biểu cảm & Trang phục Gốc ({CLASSIC_ELEC_OUTFITS.length})
              </button>
            </div>

            {tab === 'uni' && (
              <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm trường: NEU, BKA, FTU, YHA, ANND, HCMUT..."
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 13px',
                    borderRadius: '11px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12.5px',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {tab === 'uni' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {REGIONS.map((r) => {
                const active = region === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegion(r.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      background: active ? '#eff6ff' : '#ffffff',
                      color: active ? '#1d4ed8' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Grid Danh sách Trang phục ── */}
        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            flex: 1,
            background: '#ffffff',
          }}
        >
          {tab === 'uni' ? (
            filteredUniOutfits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b', fontSize: '13.5px' }}>
                Không tìm thấy trường Đại học nào khớp với từ khóa <b>"{query}"</b>.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                  gap: '12px',
                }}
              >
                {filteredUniOutfits.map((u) => {
                  const isSelected =
                    activeResolved.schoolId === u.schoolId &&
                    (outfitConfig?.mode === 'uni' || outfitConfig?.mode === 'auto_nv1');
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => onSelectOutfit?.({ mode: 'uni', value: u.schoolId })}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '12px 10px',
                        borderRadius: '16px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: isSelected
                          ? 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)'
                          : '#f8fafc',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: isSelected ? '0 8px 20px rgba(37, 99, 235, 0.18)' : 'none',
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 7,
                            right: 7,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 800,
                          }}
                        >
                          Đang mặc
                        </span>
                      )}

                      <div
                        style={{
                          width: '88px',
                          height: '88px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <img
                          src={u.src}
                          alt={u.name}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 8px rgba(15, 23, 42, 0.14))',
                          }}
                        />
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#1d4ed8',
                          background: 'rgba(37, 99, 235, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          marginBottom: '4px',
                        }}
                      >
                        {u.schoolId}
                        {u.admissionCode && u.admissionCode !== u.schoolId ? ` (${u.admissionCode})` : ''}
                      </span>

                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {u.name}
                      </div>

                      <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                        {u.city}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px',
              }}
            >
              {CLASSIC_ELEC_OUTFITS.map((c) => {
                const isSelected = outfitConfig?.mode === 'classic' && outfitConfig?.value === c.key;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectOutfit?.({ mode: 'classic', value: c.key })}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '12px 10px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: isSelected
                        ? 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)'
                        : '#f8fafc',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 7,
                          right: 7,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 800,
                        }}
                      >
                        Đang mặc
                      </span>
                    )}

                    <div
                      style={{
                        width: '86px',
                        height: '86px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <img
                        src={c.src}
                        alt={c.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 4px 8px rgba(15, 23, 42, 0.14))',
                        }}
                      />
                    </div>

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        color: '#7c3aed',
                        background: 'rgba(124, 58, 237, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        marginBottom: '4px',
                      }}
                    >
                      {c.tag}
                    </span>

                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                      {c.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
