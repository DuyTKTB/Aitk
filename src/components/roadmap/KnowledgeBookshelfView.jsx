/* ============================================================
   KnowledgeBookshelfView.jsx — KỆ SÁCH 3D KHOA HỌC TỰ NHIÊN ELEC AI
   ------------------------------------------------------------
   Trải nghiệm Kệ sách gỗ/pha lê 3D THỰC THỤ mang bản sắc ELEC AI:
     1. 'shelf' (Mặc định): Kệ sách 3D tương tác trực tiếp
        - Các cuốn giáo trình Hoá học · Vật lí · Sinh học (16 đầu sách)
          xếp đứng thành gáy sách 3D trên mặt kệ gỗ sồi ấm có chiều sâu & bóng đổ.
        - Độ dày của mỗi gáy sách tỉ lệ thuận với số chương thực tế
          (VD: Hoá Hữu Cơ 40 chương cực dày, Sinh Đại cương 21 chương...).
        - Bấm vào bất kỳ gáy sách nào: cuốn sách trượt xoay mở ra BÌA SÁCH 3D
          có mép giấy trang sách + thẻ thông tin nổi (số chương, mô tả, nút "Mở sách →").
        - Thanh chọn 5 Tầng Kệ KHTN + nút "Tìm sách ⌘K" + nút đổi "Xem dạng lưới thẻ".
     2. 'grid'  : Chế độ xem dạng lưới thẻ giáo trình KHTN.
     3. 'toc'   : Mục lục Giáo trình dạng Lab Dossier (Các Phần · Danh sách Chương).
     4. 'reader': Phòng đọc 3 cột có công thức KaTeX, Nghe đọc Tiếng Việt & Hỏi ELEC AI.
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

/* Bộ icon SVG tinh gọn */
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

/* Tính độ dày gáy sách (px) theo số chương thực tế */
function getSpineWidth(chapters) {
  const n = Number(chapters) || 8;
  return Math.max(44, Math.min(82, Math.round(38 + n * 1.1)));
}

/* Tính chiều cao sách hơi lệch tự nhiên như kệ sách thật */
function getBookHeight(chapters, idx) {
  const n = Number(chapters) || 8;
  const base = n >= 20 ? 316 : n >= 12 ? 302 : 288;
  const jitter = ((idx * 17) % 18) - 8;
  return base + jitter;
}

export default function KnowledgeBookshelfView({
  subjectKey = 'hoa',
  onOpenChapterLesson,
  onAskAiTopic,
}) {
  const allVolumes = useMemo(() => getAllKnowledgeVolumes(), []);

  const [viewMode, setViewMode] = useState('shelf'); // 'shelf' | 'grid' | 'toc' | 'reader'
  const [activeTierId, setActiveTierId] = useState('all'); // 'all' | tier.id
  const [selectedVolumeId, setSelectedVolumeId] = useState(() => allVolumes[0]?.id || 'hoa-hoc-10');
  const [searchOpen, setSearchOpen] = useState(false);
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

  const [speaking, setSpeaking] = useState(false);
  const readerTopRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
  }, []);

  /* Phím tắt Cmd/Ctrl + K mở hộp tìm sách nhanh */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [searchOpen]);

  const shelfVolumes = useMemo(() => {
    if (activeTierId === 'all') return allVolumes;
    const tier = KNOWLEDGE_SHELF_TIERS.find((t) => t.id === activeTierId);
    return tier ? (tier.volumes || []).map((v) => ({ ...v, slug: v.id, tierId: tier.id, tierLabel: tier.label })) : allVolumes;
  }, [activeTierId, allVolumes]);

  /* Đảm bảo luôn có 1 cuốn đang xoay bìa mở trên kệ */
  const selectedVolume = useMemo(() => {
    return shelfVolumes.find((v) => v.id === selectedVolumeId) || shelfVolumes[0] || allVolumes[0];
  }, [shelfVolumes, selectedVolumeId, allVolumes]);

  const searchResults = useMemo(() => {
    const q = norm(searchQuery).trim();
    if (!q) return allVolumes;
    return allVolumes.filter((v) => norm(`${v.title} ${v.desc} ${v.tags} ${v.tierLabel}`).includes(q));
  }, [allVolumes, searchQuery]);

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
    setSelectedVolumeId(vol.id);
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

  /* ── RENDER 1: KỆ SÁCH 3D THỰC THỤ (REAL 3D INTERACTIVE BOOKSHELF) ── */
  const renderBookshelfView = () => {
    const selSub = selectedVolume ? (SUBJECT_BADGES[selectedVolume.subjectKey] || SUBJECT_BADGES.hoa) : SUBJECT_BADGES.hoa;
    const readInSelected = selectedVolume ? readSlugs.filter((k) => k.startsWith(`${selectedVolume.id}:`)).length : 0;

    return (
      <div
        style={{
          borderRadius: 26,
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 55%, #F1F5F9 100%)',
          border: '1px solid #DBEAFE',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header Kệ sách */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '24px 28px 18px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#0284C7', textTransform: 'uppercase', marginBottom: 4 }}>
              <IcoBook />
              <span>THƯ VIỆN KHTN ELEC AI · {allVolumes.length} GIÁO TRÌNH · {totalChaptersCount}+ CHƯƠNG</span>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Kệ sách Giáo trình Hoá học · Vật lí · Sinh học
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: '#475569' }}>
              Mỗi gáy sách là một bộ giáo trình tương tác. <b>Độ dày của gáy sách</b> tương ứng số chương đã biên soạn — bấm vào gáy sách để kéo ra xem bìa 3D và mở đọc.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 14px',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
              }}
            >
              <IcoSearch />
              <span>Tìm sách</span>
              <kbd style={{ padding: '2px 6px', borderRadius: 6, background: '#F1F5F9', fontSize: 11, color: '#64748B', fontWeight: 700 }}>⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '9px 14px',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xem dạng thẻ
            </button>
          </div>
        </div>

        {/* KHÔNG GIAN KỆ SÁCH 3D THỰC THỤ */}
        <div style={{ padding: '32px 24px 0', position: 'relative' }}>
          {/* Ánh đèn rọi từ trần tủ sách */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: 120,
              background: 'radial-gradient(ellipse at top, rgba(56, 189, 248, 0.16) 0%, transparent 72%)',
              pointerEvents: 'none',
            }}
          />

          {/* Hàng sách xếp đứng trên kệ (cuộn ngang mượt trên màn hình nhỏ) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: shelfVolumes.length <= 7 ? 'center' : 'flex-start',
              gap: 8,
              overflowX: 'auto',
              padding: '22px 20px 0',
              minHeight: 356,
              scrollbarWidth: 'thin',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {shelfVolumes.map((vol, idx) => {
              const isSelected = selectedVolume?.id === vol.id;
              const spineW = getSpineWidth(vol.chapters);
              const bookH = getBookHeight(vol.chapters, idx);
              const subBadge = SUBJECT_BADGES[vol.subjectKey] || SUBJECT_BADGES.hoa;

              if (isSelected) {
                /* CUỐN SÁCH ĐANG ĐƯỢC RÚT RA & XOAY BÌA 3D */
                return (
                  <div
                    key={vol.id}
                    onClick={() => handleOpenBook(vol)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenBook(vol); }}
                    style={{
                      position: 'relative',
                      width: 224,
                      height: 326,
                      flexShrink: 0,
                      margin: '0 14px',
                      cursor: 'pointer',
                      transform: 'translateY(-10px)',
                      transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                      display: 'flex',
                      alignItems: 'stretch',
                    }}
                    title={`Bấm để mở giáo trình ${vol.title}`}
                  >
                    {/* Gáy sách 3D bên trái */}
                    <div
                      style={{
                        width: 18,
                        borderRadius: '6px 0 0 6px',
                        background: `linear-gradient(90deg, rgba(0,0,0,0.34), rgba(255,255,255,0.14) 50%, rgba(0,0,0,0.12)), ${vol.accent}`,
                        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.22)',
                      }}
                    />

                    {/* Bìa trước 3D sang trọng */}
                    <div
                      style={{
                        flex: 1,
                        borderRadius: '0 12px 12px 0',
                        background: `linear-gradient(155deg, ${vol.accent} 0%, #0F172A 100%)`,
                        color: '#FFFFFF',
                        padding: '18px 18px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '14px 16px 28px rgba(15, 23, 42, 0.28), inset 1px 1px 0 rgba(255,255,255,0.26)',
                      }}
                    >
                      {/* Vệt phản quang bìa cứng */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(115deg, rgba(255,255,255,0.18) 0%, transparent 42%, rgba(255,255,255,0.05) 100%)',
                          pointerEvents: 'none',
                        }}
                      />

                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', textTransform: 'uppercase' }}>
                            {subBadge.label}
                          </span>
                          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, opacity: 0.85, fontWeight: 700 }}>
                            {vol.grade ? `LỚP ${vol.grade}` : 'ĐẠI HỌC'}
                          </span>
                        </div>

                        <div style={{ width: 32, height: 3, borderRadius: 2, background: '#38BDF8', marginBottom: 12 }} />

                        <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                          {vol.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(226, 232, 240, 0.86)', lineHeight: 1.48, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {vol.desc}
                        </p>
                      </div>

                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.16)' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#BAE6FD' }}>
                          {vol.chapters} chương
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#FFFFFF', background: 'rgba(56, 189, 248, 0.28)', padding: '5px 10px', borderRadius: 8 }}>
                          <span>Mở sách</span>
                          <IcoArrowRight />
                        </span>
                      </div>
                    </div>

                    {/* Mép các trang giấy trắng 3D bên phải */}
                    <div
                      style={{
                        width: 7,
                        margin: '6px 0',
                        borderRadius: '0 3px 3px 0',
                        background: 'repeating-linear-gradient(90deg, #F8FAFC 0px, #E2E8F0 1.5px, #FFFFFF 3px)',
                        boxShadow: '2px 0 4px rgba(15, 23, 42, 0.16)',
                      }}
                    />
                  </div>
                );
              }

              /* GÁY SÁCH ĐỨNG 3D (Độ dày tỉ lệ theo số chương) */
              return (
                <button
                  key={vol.id}
                  type="button"
                  onClick={() => setSelectedVolumeId(vol.id)}
                  onDoubleClick={() => handleOpenBook(vol)}
                  style={{
                    position: 'relative',
                    width: spineW,
                    height: bookH,
                    flexShrink: 0,
                    border: 'none',
                    borderRadius: '7px 7px 3px 3px',
                    padding: '14px 4px',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    background: `linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 18%, rgba(0,0,0,0.04) 82%, rgba(0,0,0,0.30) 100%), ${vol.accent}`,
                    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.28), 3px 0 10px rgba(15, 23, 42, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-14px)';
                    e.currentTarget.style.boxShadow = 'inset 0 2px 0 rgba(255,255,255,0.38), 6px 12px 20px rgba(15, 23, 42, 0.28)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'inset 0 2px 0 rgba(255,255,255,0.28), 3px 0 10px rgba(15, 23, 42, 0.18)';
                  }}
                  title={`${vol.title} (${vol.chapters} chương) — Bấm để kéo sách ra`}
                >
                  {/* Vạch chỉ vàng/trắng trên đầu gáy sách */}
                  <div style={{ width: '68%', height: 2, background: 'rgba(255,255,255,0.45)', borderRadius: 2 }} />

                  {/* Tên sách xoay dọc chuẩn gáy sách */}
                  <span
                    style={{
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      fontSize: spineW >= 58 ? 14 : 12.5,
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      textShadow: '0 1px 2px rgba(0,0,0,0.32)',
                      maxHeight: bookH - 86,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {vol.title}
                  </span>

                  {/* Số chương ở chân gáy sách */}
                  <span
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: 5,
                      background: 'rgba(15, 23, 42, 0.28)',
                      color: '#E0F2FE',
                    }}
                  >
                    {vol.chapters}ch
                  </span>
                </button>
              );
            })}
          </div>

          {/* MẶT KỆ GỖ SỒI 3D (REAL WOODEN SHELF PLANK + BÓNG ĐỔ) */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Mặt trên ván gỗ */}
            <div
              style={{
                height: 16,
                margin: '0 8px',
                background: 'linear-gradient(180deg, #E2C7A3 0%, #CFA97B 100%)',
                borderRadius: '4px 4px 0 0',
                boxShadow: 'inset 0 4px 8px rgba(69, 39, 14, 0.18)',
              }}
            />
            {/* Mặt trước dày của tấm ván gỗ */}
            <div
              style={{
                height: 22,
                background: 'linear-gradient(180deg, #B88B58 0%, #8C6239 100%)',
                borderRadius: '3px 3px 8px 8px',
                boxShadow: '0 14px 28px rgba(69, 39, 14, 0.28), inset 0 1px 0 rgba(255,255,255,0.32)',
              }}
            />
          </div>
        </div>

        {/* KHUNG THÔNG TIN CHI TIẾT CUỐN SÁCH ĐANG CHỌN TRÊN KỆ */}
        {selectedVolume && (
          <div
            style={{
              margin: '26px 28px 22px',
              padding: '20px 24px',
              borderRadius: 18,
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
            }}
          >
            <div style={{ flex: '1 1 420px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: selSub.bg, color: selSub.color, border: `1px solid ${selSub.border}` }}>
                  {renderSubIcon(selectedVolume.subjectKey)}
                  <span>{selSub.label}</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                  {selectedVolume.tierLabel} · {selectedVolume.chapters} chương {readInSelected > 0 ? `· Đã đọc ${readInSelected} chương` : ''}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                {selectedVolume.title}
              </h3>
              <p style={{ margin: '0 0 6px', fontSize: 14, color: '#475569', lineHeight: 1.55 }}>
                {selectedVolume.desc}
              </p>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                {selectedVolume.tags}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenBook(selectedVolume)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg, ${selectedVolume.accent} 0%, #0284C7 100%)`,
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(2, 132, 199, 0.28)',
                flexShrink: 0,
              }}
            >
              <span>Mở giáo trình & Đọc ngay</span>
              <IcoArrowRight />
            </button>
          </div>
        )}

        {/* THANH CHỌN 5 TẦNG KỆ KHTN Ở ĐÁY */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '14px 28px 20px',
            borderTop: '1px solid rgba(148, 163, 184, 0.22)',
            background: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTierId('all')}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                border: activeTierId === 'all' ? '1px solid #0F172A' : '1px solid #CBD5E1',
                background: activeTierId === 'all' ? '#0F172A' : '#FFFFFF',
                color: activeTierId === 'all' ? '#FFFFFF' : '#334155',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tất cả kệ ({allVolumes.length})
            </button>
            {KNOWLEDGE_SHELF_TIERS.map((tier) => {
              const active = activeTierId === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setActiveTierId(tier.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: active ? `1px solid ${tier.accent}` : '1px solid #CBD5E1',
                    background: active ? tier.accent : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#334155',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tier.label} ({tier.volumes.length})
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /* ── RENDER 2: DẠNG LƯỚI THẺ KHTN ── */
  const renderGridView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0284C7', letterSpacing: '0.08em' }}>
            ELEC AI · 5 CHUYÊN KHOA KHTN
          </span>
          <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
            Danh mục toàn bộ 16 Giáo trình Hoá – Lý – Sinh
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setViewMode('shelf')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 12,
            border: 'none',
            background: '#0F172A',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <IcoArrowLeft />
          <span>Quay lại Kệ sách 3D</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {KNOWLEDGE_PROGRAMMES.map((prog) => {
          const tier = KNOWLEDGE_SHELF_TIERS.find((t) => t.id === prog.tierId);
          return (
            <div
              key={prog.id}
              style={{
                padding: 20,
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: prog.accent }}>CHUYÊN KHOA {prog.number}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>{tier?.volumes?.length || 0} cuốn</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{prog.title}</h3>
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

  /* ── RENDER 3: MỤC LỤC GIÁO TRÌNH (TOC) ── */
  const renderTocView = () => {
    if (!activeBookCurriculum || !openBookVolume) return null;
    const subStyle = SUBJECT_BADGES[openBookVolume.subjectKey] || SUBJECT_BADGES.hoa;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              setViewMode('shelf');
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
            <span>Quay lại Kệ sách 3D</span>
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: subStyle.bg, color: subStyle.color, marginBottom: 10 }}>
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
            <strong style={{ fontSize: 16, color: '#0F172A' }}>{activeBookCurriculum.authorCard.author}</strong>
            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>{activeBookCurriculum.authorCard.role}</span>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{activeBookCurriculum.authorCard.note}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {activeBookCurriculum.parts.map((part) => (
            <section key={part.partNum} style={{ borderRadius: 20, background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: openBookVolume.accent, letterSpacing: '0.08em' }}>{part.partNum}</span>
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
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, fontWeight: 800, color: openBookVolume.accent }}>
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
                      <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#94A3B8' }}>{ch.enTitle}</span>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{ch.desc}</p>
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

  /* ── RENDER 4: PHÒNG ĐỌC 3 CỘT ── */
  const renderReaderView = () => {
    if (!activeBookCurriculum || !activeChapter || !openBookVolume) return null;
    const prevCh = activeChapterIndex > 0 ? flatChapters[activeChapterIndex - 1] : null;
    const nextCh = activeChapterIndex < flatChapters.length - 1 ? flatChapters[activeChapterIndex + 1] : null;

    return (
      <div ref={readerTopRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '12px 16px', borderRadius: 16, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#334155', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
            >
              <IcoArrowLeft />
              <span>{openBookVolume.title}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleSpeech}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 11, border: 'none', background: speaking ? '#DC2626' : '#0F172A', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
          >
            {speaking ? <IcoStop /> : <IcoVolume />}
            <span>{speaking ? 'Dừng đọc giọng nói' : 'Nghe đọc chương này'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: sidebarOpen ? '250px minmax(0, 1fr) 210px' : 'minmax(0, 1fr) 210px', gap: 18, alignItems: 'start' }}>
          {sidebarOpen && (
            <aside style={{ position: 'sticky', top: 84, maxHeight: 'calc(100vh - 110px)', overflowY: 'auto', padding: 14, borderRadius: 18, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
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

          <article style={{ padding: '28px 32px', borderRadius: 22, background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 8px 28px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <header style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: openBookVolume.accent, letterSpacing: '0.07em', marginBottom: 6 }}>
                {activeChapter.partNum} · CHƯƠNG {activeChapter.num}
              </div>
              <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{activeChapter.title}</h1>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>{activeChapter.enTitle}</div>
              <p style={{ margin: 0, fontSize: 15, color: '#334155', lineHeight: 1.65 }}>{activeChapter.desc}</p>
            </header>

            {activeChapter.objectives?.length > 0 && (
              <section style={{ padding: 20, borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', letterSpacing: '0.08em', marginBottom: 12 }}>
                  MỤC TIÊU CẦN ĐẠT SAU CHƯƠNG NÀY
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {activeChapter.objectives.map((obj, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: openBookVolume.accent, color: '#FFFFFF', fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>{obj}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeChapter.mentorQuote && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)', border: '1px solid #BFDBFE' }}>
                <img src="/img/elec/elec-teacher.png" alt="ELEC AI Mentor" style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', letterSpacing: '0.06em', marginBottom: 4 }}>GÓC NHÌN BẢN CHẤT · ELEC AI MENTOR</div>
                  <p style={{ margin: 0, fontSize: 14, color: '#1E293B', fontStyle: 'italic', lineHeight: 1.6 }}>{activeChapter.mentorQuote}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {(activeChapter.sections || []).map((sec, sIdx) => (
                <section key={sIdx} id={`elec-sec-${sIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A' }}>{sec.heading}</h2>
                    {sec.slideRef && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '3px 9px', borderRadius: 8 }}>{sec.slideRef}</span>}
                  </div>
                  <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                    <MathText text={sec.body} />
                  </div>
                  {sec.formula && (
                    <div style={{ padding: '16px 20px', borderRadius: 14, background: '#0F172A', color: '#F8FAFC', fontSize: 16, overflowX: 'auto', textAlign: 'center' }}>
                      <MathText text={`$$${sec.formula}$$`} />
                    </div>
                  )}
                </section>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {onOpenChapterLesson && (
                  <button
                    type="button"
                    onClick={() => onOpenChapterLesson(activeChapter.subjectKey || openBookVolume.subjectKey || subjectKey, activeChapter.chapterId || null)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: 'none', background: '#2563EB', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <span>Luyện bài tập chương này</span>
                    <IcoArrowRight />
                  </button>
                )}
                {onAskAiTopic && (
                  <button
                    type="button"
                    onClick={() => onAskAiTopic(`Hãy giảng sâu hơn và cho 3 câu hỏi trắc nghiệm vận dụng về chuyên đề "${activeChapter.title}" trong giáo trình "${openBookVolume.title}".`)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <IcoSparkles />
                    <span>Hỏi Gia sư ELEC AI</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {prevCh && (
                  <button type="button" onClick={() => handleOpenChapter(prevCh)} style={{ padding: '9px 14px', borderRadius: 11, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    ← Chương {prevCh.num}
                  </button>
                )}
                {nextCh && (
                  <button type="button" onClick={() => handleOpenChapter(nextCh)} style={{ padding: '9px 14px', borderRadius: 11, border: 'none', background: '#0F172A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Chương {nextCh.num} →
                  </button>
                )}
              </div>
            </div>
          </article>

          <aside style={{ position: 'sticky', top: 84, padding: 16, borderRadius: 18, background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.07em', marginBottom: 10 }}>TRONG CHƯƠNG NÀY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(activeChapter.sections || []).map((sec, sIdx) => (
                <a
                  key={sIdx}
                  href={`#elec-sec-${sIdx}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`elec-sec-${sIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  style={{ fontSize: 12.5, color: '#475569', textDecoration: 'none', lineHeight: 1.45, fontWeight: 600 }}
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
      {viewMode === 'shelf' && renderBookshelfView()}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'toc' && renderTocView()}
      {viewMode === 'reader' && renderReaderView()}

      {/* MODAL TÌM SÁCH NHANH ⌘K */}
      {searchOpen && (
        <div
          role="presentation"
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '10vh 16px',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tìm nhanh giáo trình KHTN"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 540,
              borderRadius: 20,
              background: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid #E2E8F0' }}>
              <IcoSearch />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm giáo trình Hoá học, Vật lí, Sinh học..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#0F172A' }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                style={{ border: 'none', background: '#F1F5F9', borderRadius: 8, padding: '4px 9px', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                ESC
              </button>
            </div>

            <div style={{ maxHeight: 360, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {searchResults.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                    handleOpenBook(v);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 10, height: 32, borderRadius: 4, background: v.accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{v.title}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{v.tierLabel} · {v.chapters} chương</div>
                    </div>
                  </div>
                  <IcoArrowRight />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
