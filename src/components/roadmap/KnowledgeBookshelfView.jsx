/* ============================================================
   KnowledgeBookshelfView.jsx — THƯ VIỆN GIÁO TRÌNH KHTN ELEC AI
   ------------------------------------------------------------
   Thiết kế độc quyền mang bản sắc ELEC AI (Electric Cobalt · Lab Slate · Emerald Bio):
   Tập trung 100% vào 3 trụ cột Khoa học Tự nhiên: HOÁ HỌC · VẬT LÍ · SINH HỌC
   (THPT GDPT 2018 Lớp 10–12 + Giáo trình Đại học & Bồi dưỡng HSG).

   4 Chế độ trải nghiệm hiện đại:
     1. 'catalog' : Thư viện Giáo trình KHTN dạng Card 3D & Bộ lọc Môn/Cấp bậc (Mặc định)
                    + Kệ sách Gáy 3D mini tương tác ngay trong kho sách.
     2. 'programmes': Tổng quan 5 Chuyên khoa KHTN (Hoá THPT · Vật lí THPT · Sinh THPT · Hoá ĐH · Sinh & Lí ĐH).
     3. 'toc'     : Mục lục Giáo trình dạng Lab Dossier (Các Phần · Danh sách Chương · Thanh tiến độ đọc).
     4. 'reader'  : Phòng Đọc KHTN 3 Cột:
                    - Trái: Mục lục chương thu/mở nhanh
                    - Giữa: Nghe đọc Tiếng Việt (TTS), Mục tiêu đạt chuẩn, Ghi chú Linh vật ELEC AI,
                            Nội dung lý thuyết + Công thức khoa học KaTeX/MathText, Nút Luyện tập & Hỏi Gia sư AI
                    - Phải: Mục lục nội dung trong chương cố định
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KNOWLEDGE_PROGRAMMES,
  KNOWLEDGE_SHELF_TIERS,
  getAllKnowledgeVolumes,
  getDetailedBookCurriculum,
} from '../../data/aiducationKnowledgeLibrary.js';
import MathText from '../MathText.jsx';

const SUBJECT_BADGES = {
  hoa: { label: 'Hoá học', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.10)', border: 'rgba(37, 99, 235, 0.24)' },
  ly: { label: 'Vật lí', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.10)', border: 'rgba(2, 132, 199, 0.24)' },
  sinh: { label: 'Sinh học', color: '#059669', bg: 'rgba(5, 150, 105, 0.10)', border: 'rgba(5, 150, 105, 0.24)' },
};

const norm = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd');

/* Bộ icon SVG tinh gọn — 0 emoji */
const Svg = ({ size = 15, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoSearch = () => (
  <Svg size={15}>
    <circle cx="11" cy="11" r="7.5" />
    <line x1="20.5" y1="20.5" x2="16.4" y2="16.4" />
  </Svg>
);

const IcoBook = () => (
  <Svg size={15}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);

const IcoArrowRight = () => (
  <Svg size={14}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Svg>
);

const IcoArrowLeft = () => (
  <Svg size={14}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </Svg>
);

const IcoVolume = () => (
  <Svg size={15}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </Svg>
);

const IcoStop = () => (
  <Svg size={15}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </Svg>
);

const IcoSparkles = () => (
  <Svg size={14}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </Svg>
);

const IcoSidebar = () => (
  <Svg size={15}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </Svg>
);

const IcoCheckCircle = () => (
  <Svg size={15}>
    <circle cx="12" cy="12" r="9.5" />
    <polyline points="8.5 12.2 10.8 14.5 15.8 9.5" />
  </Svg>
);

const IcoFlask = () => (
  <Svg size={15}>
    <path d="M10 2v7.3L4.4 18.2A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-2.8L14 9.3V2" />
    <line x1="8.5" y1="2" x2="15.5" y2="2" />
  </Svg>
);

const IcoBolt = () => (
  <Svg size={15}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Svg>
);

const IcoDna = () => (
  <Svg size={15}>
    <path d="M2 15c6.7-6 13.3 0 20-6" />
    <path d="M2 9c6.7 6 13.3 0 20 6" />
    <path d="M9 22c1.8-2 2.5-4 2.8-6" />
    <path d="M15 2c-1.8 2-2.5 4-2.8 6" />
  </Svg>
);

const renderSubIcon = (sub) => {
  if (sub === 'ly') return <IcoBolt />;
  if (sub === 'sinh') return <IcoDna />;
  return <IcoFlask />;
};

export default function KnowledgeBookshelfView({
  subjectKey = 'hoa',
  onOpenChapterLesson,
  onAskAiTopic,
}) {
  const allVolumes = useMemo(() => getAllKnowledgeVolumes(), []);

  const [viewMode, setViewMode] = useState('catalog'); // 'catalog' | 'programmes' | 'toc' | 'reader'
  const [subjectFilter, setSubjectFilter] = useState('all'); // 'all' | 'hoa' | 'ly' | 'sinh'
  const [levelFilter, setLevelFilter] = useState('all'); // 'all' | 'thpt' | 'dai-hoc'
  const [searchQuery, setSearchQuery] = useState('');

  const [openBookVolume, setOpenBookVolume] = useState(null);
  const [activeChapterSlug, setActiveChapterSlug] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [readSlugs, setReadSlugs] = useState(() => {
    try {
      const raw = localStorage.getItem('elec-khtn-read-chapters-v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Đọc giọng nói Tiếng Việt (Web Speech API)
  const [speaking, setSpeaking] = useState(false);
  const readerTopRef = useRef(null);

  useEffect(() => () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
  }, []);

  const filteredVolumes = useMemo(() => {
    const q = norm(searchQuery).trim();
    return allVolumes.filter((v) => {
      if (subjectFilter !== 'all' && v.subjectKey !== subjectFilter) return false;
      if (levelFilter === 'thpt' && !v.grade) return false;
      if (levelFilter === 'dai-hoc' && Boolean(v.grade)) return false;
      if (!q) return true;
      return norm(`${v.title} ${v.desc} ${v.tags} ${v.tierLabel}`).includes(q);
    });
  }, [allVolumes, subjectFilter, levelFilter, searchQuery]);

  const totalChaptersCount = useMemo(
    () => allVolumes.reduce((s, v) => s + (Number(v.chapters) || 0), 0),
    [allVolumes],
  );

  const activeBookCurriculum = useMemo(
    () => (openBookVolume ? getDetailedBookCurriculum(openBookVolume) : null),
    [openBookVolume],
  );

  const flatChapters = useMemo(() => {
    if (!activeBookCurriculum) return [];
    const list = [];
    activeBookCurriculum.parts.forEach((p) => {
      (p.chapters || []).forEach((ch) => {
        list.push({ ...ch, partNum: p.partNum, partTitle: p.title });
      });
    });
    return list;
  }, [activeBookCurriculum]);

  const activeChapter = useMemo(() => {
    if (!flatChapters.length) return null;
    return flatChapters.find((c) => c.slug === activeChapterSlug) || flatChapters[0];
  }, [flatChapters, activeChapterSlug]);

  const activeChapterIndex = useMemo(
    () => (activeChapter ? flatChapters.findIndex((c) => c.slug === activeChapter.slug) : -1),
    [flatChapters, activeChapter],
  );

  const stopSpeech = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    setSpeaking(false);
  };

  const markChapterRead = (bookId, chSlug) => {
    const key = `${bookId}:${chSlug}`;
    setReadSlugs((prev) => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      try {
        localStorage.setItem('elec-khtn-read-chapters-v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleOpenBook = (vol) => {
    stopSpeech();
    setOpenBookVolume(vol);
    setViewMode('toc');
  };

  const handleOpenChapter = (ch) => {
    stopSpeech();
    setActiveChapterSlug(ch.slug);
    if (openBookVolume) markChapterRead(openBookVolume.id, ch.slug);
    setViewMode('reader');
    setTimeout(() => {
      readerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleToggleSpeech = () => {
    if (!activeChapter) return;
    if (speaking) {
      stopSpeech();
      return;
    }
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const textParts = [
        `Chương ${activeChapter.num}. ${activeChapter.title}.`,
        activeChapter.desc,
        ...(activeChapter.sections || []).map((s) => `${s.heading}. ${s.body}`),
      ];
      const utter = new SpeechSynthesisUtterance(textParts.join(' '));
      utter.lang = 'vi-VN';
      utter.rate = 1.0;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  };

  /* ── RENDER 1: THƯ VIỆN GIÁO TRÌNH KHTN ELEC AI (BRANDED UI) ── */
  const renderCatalogView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Hero Banner Độc quyền ELEC AI Science Library */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 24,
          padding: '28px 30px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 58%, #0369A1 100%)',
          color: '#FFFFFF',
          boxShadow: '0 18px 44px rgba(15, 23, 42, 0.16)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -60,
            top: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              <IcoBook />
              <span>ELEC AI · THƯ VIỆN GIÁO TRÌNH KHOA HỌC TỰ NHIÊN</span>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Trọn bộ Giáo trình Hoá học · Vật lí · Sinh học
            </h2>
            <p style={{ margin: 0, fontSize: 14.5, color: 'rgba(226, 232, 240, 0.92)', lineHeight: 1.6 }}>
              Hệ thống <strong>{allVolumes.length} đầu sách tương tác</strong> ({totalChaptersCount}+ chương chuẩn hoá) phủ kín từ THPT GDPT 2018 (Lớp 10–12) tới Hoá Đại cương – Vô cơ, Hoá Hữu cơ 40 chương, Sinh học Đại cương 21 chương và Vật lí Đại cương.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', minWidth: 110 }}>
              <div style={{ fontSize: 11, color: '#BAE6FD', fontWeight: 600 }}>TỔNG GIÁO TRÌNH</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{allVolumes.length} cuốn</div>
            </div>
            <div style={{ padding: '12px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', minWidth: 110 }}>
              <div style={{ fontSize: 11, color: '#BAE6FD', fontWeight: 600 }}>ĐÃ ĐỌC XONG</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{readSlugs.length} chương</div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Bộ lọc Môn KHTN + Cấp bậc + Tìm kiếm */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 18,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Lọc 3 môn KHTN */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {[
            ['all', 'Tất cả KHTN'],
            ['hoa', 'Hoá học'],
            ['ly', 'Vật lí'],
            ['sinh', 'Sinh học'],
          ].map(([key, label]) => {
            const active = subjectFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSubjectFilter(key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: active ? '1px solid #2563EB' : '1px solid #E2E8F0',
                  background: active ? '#2563EB' : '#F8FAFC',
                  color: active ? '#FFFFFF' : '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                }}
              >
                {key !== 'all' && renderSubIcon(key)}
                <span>{label}</span>
              </button>
            );
          })}

          <div style={{ width: 1, height: 22, background: '#E2E8F0', margin: '0 4px' }} />

          {[
            ['all', 'Mọi cấp bậc'],
            ['thpt', 'THPT (10–12)'],
            ['dai-hoc', 'Đại học & HSG'],
          ].map(([key, label]) => {
            const active = levelFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setLevelFilter(key)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 10,
                  border: active ? '1px solid #0F172A' : '1px solid transparent',
                  background: active ? '#0F172A' : '#F1F5F9',
                  color: active ? '#FFFFFF' : '#475569',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tìm kiếm + Chuyển chế độ Chuyên khoa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: 12, color: '#64748B', display: 'flex' }}>
              <IcoSearch />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm giáo trình Hoá, Lý, Sinh..."
              style={{
                padding: '8px 14px 8px 34px',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                width: 230,
                outline: 'none',
                color: '#0F172A',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setViewMode('programmes')}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Xem theo 5 Chuyên khoa
          </button>
        </div>
      </div>

      {/* Lưới Giáo trình KHTN 3D Bìa cứng ELEC AI */}
      {filteredVolumes.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', borderRadius: 20, background: '#FFFFFF', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          Không tìm thấy giáo trình khớp từ khoá “{searchQuery}”. Hãy thử tìm <b>Hoá Hữu Cơ</b>, <b>Sinh học</b> hoặc <b>Vật lí 12</b>.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
          {filteredVolumes.map((vol) => {
            const subStyle = SUBJECT_BADGES[vol.subjectKey] || SUBJECT_BADGES.hoa;
            const readInBook = readSlugs.filter((k) => k.startsWith(`${vol.id}:`)).length;
            const isUni = !vol.grade;
            return (
              <article
                key={vol.id}
                onClick={() => handleOpenBook(vol)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 20,
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(15, 23, 42, 0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.04)';
                }}
              >
                {/* Thanh gáy màu đặc trưng từng cuốn sách */}
                <div
                  style={{
                    height: 8,
                    background: `linear-gradient(90deg, ${vol.accent}, ${subStyle.color})`,
                  }}
                />

                <div style={{ padding: '18px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: subStyle.bg,
                        color: subStyle.color,
                        border: `1px solid ${subStyle.border}`,
                      }}
                    >
                      {renderSubIcon(vol.subjectKey)}
                      <span>{subStyle.label}</span>
                    </span>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 8,
                        background: isUni ? '#FEF3C7' : '#F1F5F9',
                        color: isUni ? '#92400E' : '#475569',
                      }}
                    >
                      {isUni ? 'ĐẠI HỌC · HSG' : `LỚP ${vol.grade} · GDPT 2018`}
                    </span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                    {vol.title}
                  </h3>

                  <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.55 }}>
                    {vol.desc}
                  </p>

                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 'auto', paddingTop: 6 }}>
                    {vol.tags}
                  </div>
                </div>

                {/* Footer card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    background: '#F8FAFC',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                    {vol.chapters} chương {readInBook > 0 ? `· Đã đọc ${readInBook}` : ''}
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      color: vol.accent,
                    }}
                  >
                    <span>Mở giáo trình</span>
                    <IcoArrowRight />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ── RENDER 2: DANH SÁCH 5 CHUYÊN KHOA KHTN ── */
  const renderProgrammesView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#2563EB', letterSpacing: '0.08em' }}>
            ELEC AI · 5 CHUYÊN KHOA KHTN
          </span>
          <h2 style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
            Chọn chuyên khoa Hoá – Lý – Sinh bạn đang học
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setViewMode('catalog')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 12,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#0F172A',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <IcoArrowLeft />
          <span>Quay lại Thư viện Giáo trình</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {KNOWLEDGE_PROGRAMMES.map((prog) => {
          const tier = KNOWLEDGE_SHELF_TIERS.find((t) => t.id === prog.tierId);
          return (
            <div
              key={prog.id}
              style={{
                padding: 22,
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: prog.accent }}>CHUYÊN KHOA {prog.number}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{tier?.volumes?.length || 0} giáo trình</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A' }}>{prog.title}</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: '#475569', lineHeight: 1.55 }}>{prog.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {(tier?.volumes || []).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleOpenBook(v)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: `1px solid ${v.accent}33`,
                      background: `${v.accent}0D`,
                      color: v.accent,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {v.title} ({v.chapters} ch)
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── RENDER 3: MỤC LỤC GIÁO TRÌNH (LAB DOSSIER TOC) ── */
  const renderTocView = () => {
    if (!activeBookCurriculum || !openBookVolume) return null;
    const subStyle = SUBJECT_BADGES[openBookVolume.subjectKey] || SUBJECT_BADGES.hoa;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setViewMode('catalog');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 11,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <IcoArrowLeft />
            <span>Thư viện Giáo trình KHTN</span>
          </button>

          {flatChapters[0] && (
            <button
              type="button"
              onClick={() => handleOpenChapter(flatChapters[0])}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 12,
                border: 'none',
                background: openBookVolume.accent,
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Bắt đầu đọc từ Chương {flatChapters[0].num}</span>
              <IcoArrowRight />
            </button>
          )}
        </div>

        {/* Header Giáo trình + Thẻ Bản quyền ELEC AI */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
            padding: 26,
            borderRadius: 22,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 28px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                background: subStyle.bg,
                color: subStyle.color,
                marginBottom: 10,
              }}
            >
              {renderSubIcon(openBookVolume.subjectKey)}
              <span>{activeBookCurriculum.categoryLabel}</span>
            </span>
            <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {activeBookCurriculum.title}
            </h2>
            <div style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600, marginBottom: 14 }}>
              {activeBookCurriculum.metaLine}
            </div>
            <p style={{ margin: 0, fontSize: 14.5, color: '#334155', lineHeight: 1.65 }}>
              {openBookVolume.desc}
            </p>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: '#F8FAFC',
              borderLeft: `4px solid ${openBookVolume.accent}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: openBookVolume.accent }}>
              {activeBookCurriculum.authorCard.kicker}
            </span>
            <strong style={{ fontSize: 16, color: '#0F172A' }}>
              {activeBookCurriculum.authorCard.author}
            </strong>
            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>
              {activeBookCurriculum.authorCard.role}
            </span>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
              {activeBookCurriculum.authorCard.note}
            </p>
          </div>
        </div>

        {/* Các Phần & Chương */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeBookCurriculum.parts.map((part) => (
            <section
              key={part.partNum}
              style={{
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '18px 22px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: openBookVolume.accent, letterSpacing: '0.08em' }}>
                  {part.partNum}
                </span>
                <h3 style={{ margin: '3px 0 4px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{part.title}</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: '#64748B' }}>{part.desc}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, background: '#E2E8F0' }}>
                {part.chapters.map((ch) => {
                  const isRead = readSlugs.includes(`${openBookVolume.id}:${ch.slug}`);
                  return (
                    <button
                      key={ch.slug}
                      type="button"
                      onClick={() => handleOpenChapter(ch)}
                      style={{
                        textAlign: 'left',
                        padding: '18px 20px',
                        background: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, fontWeight: 800, color: openBookVolume.accent }}>
                          CHƯƠNG {ch.num}
                        </span>
                        {isRead && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: '#059669' }}>
                            <IcoCheckCircle />
                            <span>Đã đọc</span>
                          </span>
                        )}
                      </div>
                      <strong style={{ fontSize: 15.5, color: '#0F172A', lineHeight: 1.35 }}>{ch.title}</strong>
                      <span style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: '#94A3B8', letterSpacing: '0.04em' }}>
                        {ch.enTitle}
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                        {ch.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  };

  /* ── RENDER 4: PHÒNG ĐỌC KHTN 3 CỘT ELEC AI ── */
  const renderReaderView = () => {
    if (!activeBookCurriculum || !activeChapter || !openBookVolume) return null;
    const prevCh = activeChapterIndex > 0 ? flatChapters[activeChapterIndex - 1] : null;
    const nextCh = activeChapterIndex < flatChapters.length - 1 ? flatChapters[activeChapterIndex + 1] : null;

    return (
      <div ref={readerTopRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 16,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#0F172A',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <IcoSidebar />
              <span>Mục lục</span>
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                setViewMode('toc');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <IcoArrowLeft />
              <span>{openBookVolume.title}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleSpeech}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 11,
              border: 'none',
              background: speaking ? '#DC2626' : '#0F172A',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {speaking ? <IcoStop /> : <IcoVolume />}
            <span>{speaking ? 'Dừng đọc giọng nói' : 'Nghe đọc chương này'}</span>
          </button>
        </div>

        {/* 3-Column Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: sidebarOpen ? '250px minmax(0, 1fr) 210px' : 'minmax(0, 1fr) 210px',
            gap: 18,
            alignItems: 'start',
          }}
        >
          {/* Cột Trái: Danh sách chương */}
          {sidebarOpen && (
            <aside
              style={{
                position: 'sticky',
                top: 84,
                maxHeight: 'calc(100vh - 110px)',
                overflowY: 'auto',
                padding: 14,
                borderRadius: 18,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.07em', marginBottom: 10 }}>
                DANH SÁCH CHƯƠNG ({flatChapters.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {flatChapters.map((ch) => {
                  const active = ch.slug === activeChapter.slug;
                  return (
                    <button
                      key={ch.slug}
                      type="button"
                      onClick={() => handleOpenChapter(ch)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: 'none',
                        background: active ? `${openBookVolume.accent}14` : 'transparent',
                        color: active ? openBookVolume.accent : '#334155',
                        fontWeight: active ? 800 : 600,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ opacity: 0.7, marginRight: 6 }}>{ch.num}.</span>
                      {ch.title}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          {/* Cột Giữa: Nội dung chương */}
          <article
            style={{
              padding: '28px 32px',
              borderRadius: 22,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 28px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <header style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: openBookVolume.accent, letterSpacing: '0.07em', marginBottom: 6 }}>
                {activeChapter.partNum} · CHƯƠNG {activeChapter.num}
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                {activeChapter.title}
              </h1>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>
                {activeChapter.enTitle}
              </div>
              <p style={{ margin: 0, fontSize: 15, color: '#334155', lineHeight: 1.65 }}>
                {activeChapter.desc}
              </p>
            </header>

            {/* Mục tiêu học tập */}
            {activeChapter.objectives?.length > 0 && (
              <section style={{ padding: 20, borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', letterSpacing: '0.08em', marginBottom: 12 }}>
                  MỤC TIÊU CẦN ĐẠT SAU CHƯƠNG NÀY
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {activeChapter.objectives.map((obj, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          background: openBookVolume.accent,
                          color: '#FFFFFF',
                          fontSize: 11.5,
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>{obj}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hộp ghi chú Linh vật ELEC AI */}
            {activeChapter.mentorQuote && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
                  border: '1px solid #BFDBFE',
                }}
              >
                <img
                  src="/img/elec/elec-teacher.png"
                  alt="ELEC AI Mentor"
                  style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', letterSpacing: '0.06em', marginBottom: 4 }}>
                    GÓC NHÌN BẢN CHẤT · ELEC AI MENTOR
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#1E293B', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {activeChapter.mentorQuote}
                  </p>
                </div>
              </div>
            )}

            {/* Các mục lý thuyết & Công thức KaTeX */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {(activeChapter.sections || []).map((sec, sIdx) => (
                <section key={sIdx} id={`elec-sec-${sIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A' }}>{sec.heading}</h2>
                    {sec.slideRef && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '3px 9px', borderRadius: 8 }}>
                        {sec.slideRef}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                    <MathText text={sec.body} />
                  </div>

                  {sec.formula && (
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: 14,
                        background: '#0F172A',
                        color: '#F8FAFC',
                        fontSize: 16,
                        overflowX: 'auto',
                        textAlign: 'center',
                      }}
                    >
                      <MathText text={`$$${sec.formula}$$`} />
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Hành động thực chiến + Điều hướng chương */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingTop: 20,
                borderTop: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {onOpenChapterLesson && (
                  <button
                    type="button"
                    onClick={() => onOpenChapterLesson(activeChapter.subjectKey || openBookVolume.subjectKey || subjectKey, activeChapter.chapterId || null)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: 'none',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span>Luyện bài tập chương này</span>
                    <IcoArrowRight />
                  </button>
                )}

                {onAskAiTopic && (
                  <button
                    type="button"
                    onClick={() => onAskAiTopic(`Hãy giảng sâu hơn và cho 3 câu hỏi trắc nghiệm vận dụng về chuyên đề "${activeChapter.title}" trong giáo trình "${openBookVolume.title}".`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: '1px solid #BFDBFE',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <IcoSparkles />
                    <span>Hỏi Gia sư ELEC AI</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {prevCh && (
                  <button
                    type="button"
                    onClick={() => handleOpenChapter(prevCh)}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 11,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0F172A',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ← Chương {prevCh.num}
                  </button>
                )}
                {nextCh && (
                  <button
                    type="button"
                    onClick={() => handleOpenChapter(nextCh)}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 11,
                      border: 'none',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Chương {nextCh.num} →
                  </button>
                )}
              </div>
            </div>
          </article>

          {/* Cột Phải: Trong chương */}
          <aside
            style={{
              position: 'sticky',
              top: 84,
              padding: 16,
              borderRadius: 18,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.07em', marginBottom: 10 }}>
              TRONG CHƯƠNG NÀY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(activeChapter.sections || []).map((sec, sIdx) => (
                <a
                  key={sIdx}
                  href={`#elec-sec-${sIdx}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`elec-sec-${sIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{
                    fontSize: 12.5,
                    color: '#475569',
                    textDecoration: 'none',
                    lineHeight: 1.45,
                    fontWeight: 600,
                  }}
                >
                  {sec.heading}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', padding: '6px 0 24px' }}>
      {viewMode === 'catalog' && renderCatalogView()}
      {viewMode === 'programmes' && renderProgrammesView()}
      {viewMode === 'toc' && renderTocView()}
      {viewMode === 'reader' && renderReaderView()}
    </div>
  );
}
