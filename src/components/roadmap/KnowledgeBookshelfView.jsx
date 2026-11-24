/* ============================================================
   KnowledgeBookshelfView.jsx — THƯ VIỆN KỆ SÁCH KIẾN THỨC & GIÁO TRÌNH TƯƠNG TÁC
   ------------------------------------------------------------
   Tái hiện trọn vẹn hệ sinh thái Kệ sách Kiến thức (/console/kien-thuc):
   1. Kệ sách Kiến thức (Bookshelf View):
      - Mỗi gáy sách là một giáo trình, độ dày tỉ lệ với số chương đã viết.
      - Bấm vào gáy sách: sách xoay mở bìa trước + hiện thẻ giới thiệu nổi "Mở sách →".
      - Thanh tầng kệ phía dưới: 8 tầng (Được yêu thích nhất, KHMT, Đại học, Tiếng Anh,
        THPT, Game Dev, AI Ứng dụng, Đang biên soạn) + Tìm sách (Ctrl+K / ⌘K).
   2. Danh sách Chương trình học (Programme List View):
      - 14 hồ sơ chương trình (01 Tiếng Anh .. 14 MƯỜI).
   3. Trang Mục lục Giáo trình (Editorial TOC View):
      - Khung CHƯƠNG TRÌNH GỐC + Lưới 3 cột chia theo PHẦN I, PHẦN II, PHẦN III.
   4. Trình đọc Chương Tương tác 3 Cột (Interactive Chapter Reader):
      - Cột trái: Mục lục sách đóng/mở.
      - Giữa: Thanh "Nghe đọc chương này" (TTS Tiếng Việt), MỤC TIÊU 01..04,
        Lời nhắn Gia sư, các mục lý thuyết + công thức LaTeX + liên kết Luyện đề.
      - Cột phải: Điều hướng nhanh "TRONG CHƯƠNG".
   ============================================================ */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KNOWLEDGE_PROGRAMMES,
  KNOWLEDGE_SHELF_TIERS,
  getAllKnowledgeVolumes,
  getDetailedBookCurriculum,
} from '../../data/aiducationKnowledgeLibrary.js';
import MathText from '../MathText.jsx';
import { ELEC_SRC } from '../PetSkins.jsx';

function normalizeVi(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

export default function KnowledgeBookshelfView({
  onOpenChapterLesson,
  onAskAiTopic,
}) {
  // 'shelf' | 'list' | 'toc' | 'reader'
  const [viewMode, setViewMode] = useState('shelf');
  const [activeTierId, setActiveTierId] = useState('all');
  const [selectedVolume, setSelectedVolume] = useState(null);
  const [openedVolume, setOpenedVolume] = useState(null);
  const [activeChapterSlug, setActiveChapterSlug] = useState(null);
  const [tocSidebarOpen, setTocSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Search modal (⌘K)
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // TTS Audio Reader
  const [isSpeaking, setIsSpeaking] = useState(false);
  const readerContainerRef = useRef(null);

  const allVolumes = useMemo(() => getAllKnowledgeVolumes(), []);

  const visibleTiers = useMemo(() => {
    if (activeTierId === 'all') return KNOWLEDGE_SHELF_TIERS;
    return KNOWLEDGE_SHELF_TIERS.filter((t) => t.id === activeTierId);
  }, [activeTierId]);

  const searchResults = useMemo(() => {
    const q = normalizeVi(searchQuery);
    if (!q) return allVolumes.slice(0, 18);
    return allVolumes.filter((v) => {
      const hay = normalizeVi(`${v.title} ${v.desc} ${v.tags} ${v.tierLabel}`);
      return hay.includes(q);
    });
  }, [allVolumes, searchQuery]);

  const activeBookCurriculum = useMemo(() => {
    if (!openedVolume) return null;
    return getDetailedBookCurriculum(openedVolume);
  }, [openedVolume]);

  const allBookChapters = useMemo(() => {
    if (!activeBookCurriculum) return [];
    const list = [];
    (activeBookCurriculum.parts || []).forEach((part) => {
      (part.chapters || []).forEach((ch) => {
        list.push({ ...ch, partNum: part.partNum, partTitle: part.title });
      });
    });
    return list;
  }, [activeBookCurriculum]);

  const currentChapter = useMemo(() => {
    if (!allBookChapters.length) return null;
    if (activeChapterSlug) {
      const hit = allBookChapters.find((c) => c.slug === activeChapterSlug);
      if (hit) return hit;
    }
    return allBookChapters[0];
  }, [allBookChapters, activeChapterSlug]);

  // Keyboard shortcut Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        else if (selectedVolume) setSelectedVolume(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, selectedVolume]);

  // Stop TTS when changing chapter or unmounting
  useEffect(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch { /* ignore */ }
    setIsSpeaking(false);
  }, [currentChapter?.slug, viewMode]);

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !currentChapter) return;
    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const textToRead = [
        `${currentChapter.partNum}. Chương ${currentChapter.num}: ${currentChapter.title}.`,
        `Mục tiêu chương: ${(currentChapter.objectives || []).join('. ')}.`,
        currentChapter.mentorQuote || '',
        ...(currentChapter.sections || []).map((s) => `${s.heading}. ${s.body}`),
      ].join(' ');
      const u = new SpeechSynthesisUtterance(textToRead.slice(0, 1800));
      u.lang = 'vi-VN';
      u.rate = 1.03;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  const handleOpenBookToc = (vol) => {
    setOpenedVolume(vol);
    setSelectedVolume(null);
    setSearchOpen(false);
    setViewMode('toc');
  };

  const handleOpenChapterReader = (chapterSlug) => {
    setActiveChapterSlug(chapterSlug);
    setViewMode('reader');
  };

  /* ============================================================
     VIEW 3: TRANG MỤC LỤC GIÁO TRÌNH (EDITORIAL BOOK TOC)
     ============================================================ */
  if (viewMode === 'toc' && openedVolume && activeBookCurriculum) {
    return (
      <div
        style={{
          background: '#FAF8F3',
          color: '#18181B',
          borderRadius: '22px',
          border: '1px solid #E5E0D5',
          padding: '28px 32px 40px',
          minHeight: '680px',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* Top breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setViewMode('shelf')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#57534E',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
            }}
          >
            <span>←</span>
            <span>{activeBookCurriculum.categoryLabel || 'Kệ sách Kiến thức'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid #D6D1C4',
              background: '#FFFFFF',
              color: '#44403C',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tìm sách ⌘K
          </button>
        </div>

        {/* Hero Book Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '26px',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(28px, 3.6vw, 42px)',
                fontWeight: 500,
                color: '#18181B',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              {activeBookCurriculum.title}
            </h1>
            <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#78716C' }}>
              {activeBookCurriculum.metaLine}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleOpenChapterReader(allBookChapters[0]?.slug)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2E8B67',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Bắt đầu học</span>
                <span>→</span>
              </button>

              {openedVolume.subjectKey && onOpenChapterLesson && (
                <button
                  type="button"
                  onClick={() => onOpenChapterLesson(openedVolume.subjectKey, allBookChapters[0]?.linkedChapterId)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #D6D1C4',
                    background: '#FFFFFF',
                    color: '#18181B',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Luyện đề trắc nghiệm {openedVolume.title}
                </button>
              )}
            </div>
          </div>

          <img
            src={ELEC_SRC.hello}
            alt="ELEC AI"
            style={{ width: '76px', height: '76px', objectFit: 'contain' }}
          />
        </div>

        {/* Author / Original Program Credit Box */}
        {activeBookCurriculum.authorCard && (
          <div
            style={{
              maxWidth: '540px',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #E5E0D5',
              background: '#F4F1EA',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#78716C',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              {activeBookCurriculum.authorCard.kicker}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#18181B' }}>
              {activeBookCurriculum.authorCard.author}
            </div>
            <div style={{ fontSize: '12.5px', color: '#57534E', marginTop: '2px' }}>
              {activeBookCurriculum.authorCard.role}
            </div>
            <p style={{ fontSize: '12.5px', color: '#78716C', margin: '10px 0 0', lineHeight: 1.55 }}>
              {activeBookCurriculum.authorCard.note}
            </p>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #E5E0D5', margin: '0 0 28px' }} />

        {/* Parts & 3-Column Hairline Chapter Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {(activeBookCurriculum.parts || []).map((part) => (
            <section key={part.partNum}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    color: '#2E8B67',
                    fontWeight: 700,
                  }}
                >
                  {part.partNum}
                </span>
                <h2
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '22px',
                    fontWeight: 500,
                    margin: 0,
                    color: '#18181B',
                  }}
                >
                  {part.title}
                </h2>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#57534E', maxWidth: '640px' }}>
                {part.desc}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '1px',
                  background: '#E5E0D5',
                  border: '1px solid #E5E0D5',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {(part.chapters || []).map((ch) => (
                  <button
                    key={ch.slug}
                    type="button"
                    onClick={() => handleOpenChapterReader(ch.slug)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '18px 18px 20px',
                      background: '#FAF8F3',
                      border: 'none',
                      minHeight: '154px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F2EFE6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FAF8F3';
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: '11.5px',
                        color: '#2E8B67',
                        fontWeight: 700,
                      }}
                    >
                      {ch.num}
                    </span>
                    <h3
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontSize: '18px',
                        fontWeight: 500,
                        color: '#18181B',
                        margin: '8px 0 3px',
                        lineHeight: 1.3,
                      }}
                    >
                      {ch.title}
                    </h3>
                    <div
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: '9.5px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#A8A29E',
                        marginBottom: '10px',
                      }}
                    >
                      {ch.enTitle}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        color: '#57534E',
                      }}
                    >
                      {ch.desc}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  /* ============================================================
     VIEW 4: TRÌNH ĐỌC CHƯƠNG GIÁO TRÌNH TƯƠNG TÁC 3 CỘT (READER)
     ============================================================ */
  if (viewMode === 'reader' && openedVolume && activeBookCurriculum && currentChapter) {
    const currentIdx = allBookChapters.findIndex((c) => c.slug === currentChapter.slug);
    const prevChapter = currentIdx > 0 ? allBookChapters[currentIdx - 1] : null;
    const nextChapter = currentIdx < allBookChapters.length - 1 ? allBookChapters[currentIdx + 1] : null;

    return (
      <div
        ref={readerContainerRef}
        style={{
          background: '#FAF8F3',
          color: '#18181B',
          borderRadius: isFullscreen ? '0' : '22px',
          border: '1px solid #E5E0D5',
          minHeight: isFullscreen ? '100vh' : '740px',
          position: isFullscreen ? 'fixed' : 'relative',
          inset: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 10020 : 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Reader Top Header */}
        <div
          style={{
            padding: '10px 18px',
            borderBottom: '1px solid #E5E0D5',
            background: '#F5F2EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setTocSidebarOpen((v) => !v)}
              title="Ẩn/Hiện mục lục sách"
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid #D6D1C4',
                background: '#FFFFFF',
                color: '#44403C',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tocSidebarOpen ? 'Ẩn mục lục' : 'Mục lục sách'}
            </button>

            <button
              type="button"
              onClick={() => setViewMode('toc')}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#18181B',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2E8B67' }} />
              <span>{activeBookCurriculum.title}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid #D6D1C4',
                background: '#FFFFFF',
                color: '#44403C',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isFullscreen ? 'Thu nhỏ' : 'Trình chiếu'}
            </button>

            <button
              type="button"
              onClick={() => setViewMode('shelf')}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#57534E',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ← Kệ sách
            </button>
          </div>
        </div>

        {/* 3-Column Textbook Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: tocSidebarOpen ? '230px minmax(0, 1fr) 210px' : 'minmax(0, 1fr) 210px',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Left TOC Sidebar */}
          {tocSidebarOpen && (
            <aside
              style={{
                borderRight: '1px solid #E5E0D5',
                background: '#F5F2EB',
                padding: '16px 14px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: '#78716C',
                  marginBottom: '8px',
                }}
              >
                BẮT ĐẦU
              </div>
              <button
                type="button"
                onClick={() => setViewMode('toc')}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#57534E',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  marginBottom: '14px',
                }}
              >
                · Toàn bộ mục lục sách
              </button>

              {(activeBookCurriculum.parts || []).map((part) => (
                <div key={part.partNum} style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      color: '#78716C',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}
                  >
                    {part.partNum} · {part.title}
                  </div>
                  {(part.chapters || []).map((ch) => {
                    const active = ch.slug === currentChapter.slug;
                    return (
                      <button
                        key={ch.slug}
                        type="button"
                        onClick={() => setActiveChapterSlug(ch.slug)}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '7px',
                          width: '100%',
                          textAlign: 'left',
                          padding: '7px 9px',
                          borderRadius: '7px',
                          border: 'none',
                          background: active ? 'rgba(46, 139, 103, 0.13)' : 'transparent',
                          color: active ? '#14532D' : '#44403C',
                          fontWeight: active ? 700 : 500,
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          marginBottom: '2px',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#2E8B67', fontFamily: 'monospace' }}>
                          {ch.num}
                        </span>
                        <span>{ch.title}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </aside>
          )}

          {/* Center Chapter Content */}
          <main style={{ padding: '22px 32px 48px', overflowY: 'auto' }}>
            {/* Audio Reader Banner ("Nghe đọc chương này") */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #A7F3D0',
                background: '#ECFDF5',
                marginBottom: '28px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>
                  Nghe đọc chương này
                </div>
                <div style={{ fontSize: '12px', color: '#047857' }}>
                  Chương này sẽ được đọc cho bạn từng phần một. Dừng lúc nào cũng được.
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSpeech}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  background: isSpeaking ? '#DC2626' : '#2E8B67',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {isSpeaking ? '■ Dừng đọc' : '▶ Bắt đầu'}
              </button>
            </div>

            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <div
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  color: '#2E8B67',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                {currentChapter.partNum} · CHƯƠNG {currentChapter.num}
              </div>

              <h1
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 'clamp(26px, 3.2vw, 38px)',
                  fontWeight: 500,
                  color: '#18181B',
                  margin: '0 0 22px',
                }}
              >
                {currentChapter.title}
              </h1>

              {/* MỤC TIÊU Box */}
              {Array.isArray(currentChapter.objectives) && currentChapter.objectives.length > 0 && (
                <div
                  style={{
                    padding: '18px 22px',
                    borderRadius: '12px',
                    border: '1px solid #E5E0D5',
                    background: '#FFFFFF',
                    marginBottom: '22px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: '10.5px',
                      letterSpacing: '0.1em',
                      color: '#A8A29E',
                      marginBottom: '12px',
                    }}
                  >
                    MỤC TIÊU
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentChapter.objectives.map((obj, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '12px', fontSize: '13.5px', color: '#27272A', lineHeight: 1.5 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#2E8B67', fontWeight: 700 }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>
                          <MathText text={obj} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mascot Mentor Quote */}
              {currentChapter.mentorQuote && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(46, 139, 103, 0.07)',
                    marginBottom: '28px',
                  }}
                >
                  <img
                    src={ELEC_SRC.wink}
                    alt="ELEC AI"
                    style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontStyle: 'italic',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#14532D',
                    }}
                  >
                    {currentChapter.mentorQuote}
                  </p>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #E5E0D5', margin: '0 0 28px' }} />

              {/* Chapter Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {(currentChapter.sections || []).map((sec, sIdx) => (
                  <article key={sIdx} id={`kb-sec-${sIdx}`}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                      <h2
                        style={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: '22px',
                          fontWeight: 500,
                          color: '#18181B',
                          margin: 0,
                        }}
                      >
                        {sec.heading}
                      </h2>
                      {sec.slideRef && (
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            fontSize: '11px',
                            color: '#78716C',
                            background: '#EFECE4',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {sec.slideRef}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#27272A' }}>
                      <MathText text={sec.body} />
                    </div>

                    {sec.formula && (
                      <div
                        style={{
                          marginTop: '14px',
                          padding: '14px 18px',
                          borderRadius: '10px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E0D5',
                          borderLeft: '4px solid #2E8B67',
                          fontSize: '15px',
                        }}
                      >
                        <MathText text={`$$${sec.formula}$$`} />
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Action Bar: Ask AI Tutor & Practice Questions */}
              <div
                style={{
                  marginTop: '36px',
                  padding: '18px 20px',
                  borderRadius: '14px',
                  background: '#F4F1EA',
                  border: '1px solid #E5E0D5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#18181B' }}>
                    Thực hành & Hỏi đáp chuyên sâu cùng ELEC AI
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#57534E' }}>
                    Nhờ Gia sư AI giải thích thêm hoặc vào làm bài tập tương tác của chương này.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {onAskAiTopic && (
                    <button
                      type="button"
                      onClick={() =>
                        onAskAiTopic(
                          `Hãy giảng giải thật sâu sắc và lấy 2 ví dụ bài tập thực chiến về "${currentChapter.title}" trong giáo trình "${activeBookCurriculum.title}".`
                        )
                      }
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9px',
                        border: '1px solid #2E8B67',
                        background: '#FFFFFF',
                        color: '#14532D',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Hỏi Gia sư AI chương này
                    </button>
                  )}

                  {(currentChapter.linkedChapterId || openedVolume.subjectKey) && onOpenChapterLesson && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenChapterLesson(
                          openedVolume.subjectKey || 'hoa',
                          currentChapter.linkedChapterId
                        )
                      }
                      style={{
                        padding: '8px 16px',
                        borderRadius: '9px',
                        border: 'none',
                        background: '#2E8B67',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Luyện bài tập chương →
                    </button>
                  )}
                </div>
              </div>

              {/* Prev / Next Chapter Navigation */}
              <div
                style={{
                  marginTop: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                {prevChapter ? (
                  <button
                    type="button"
                    onClick={() => setActiveChapterSlug(prevChapter.slug)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #D6D1C4',
                      background: '#FFFFFF',
                      color: '#18181B',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ← Chương {prevChapter.num}: {prevChapter.title}
                  </button>
                ) : <div />}

                {nextChapter && (
                  <button
                    type="button"
                    onClick={() => setActiveChapterSlug(nextChapter.slug)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #D6D1C4',
                      background: '#FFFFFF',
                      color: '#18181B',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Chương {nextChapter.num}: {nextChapter.title} →
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* Right Mini-TOC ("TRONG CHƯƠNG") */}
          <aside
            style={{
              borderLeft: '1px solid #E5E0D5',
              padding: '20px 14px',
              background: '#FAF8F3',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', color: '#78716C', marginBottom: '10px' }}>
              <span>TRONG CHƯƠNG</span>
              <span>{currentIdx + 1}/{allBookChapters.length}</span>
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#2E8B67', marginBottom: '10px' }}>
              {currentChapter.partNum} · {currentChapter.title.toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(currentChapter.sections || []).map((sec, sIdx) => (
                <a
                  key={sIdx}
                  href={`#kb-sec-${sIdx}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`kb-sec-${sIdx}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    fontSize: '12px',
                    color: '#57534E',
                    textDecoration: 'none',
                    lineHeight: 1.4,
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
  }

  /* ============================================================
     VIEW 2: DANH SÁCH 14 CHƯƠNG TRÌNH HỌC ("Chọn chương trình bạn đang học")
     ============================================================ */
  if (viewMode === 'list') {
    return (
      <div
        style={{
          background: '#FAF8F3',
          color: '#18181B',
          borderRadius: '22px',
          border: '1px solid #E5E0D5',
          padding: '28px 24px 40px',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <header style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '11px',
                letterSpacing: '0.18em',
                color: '#2E8B67',
                fontWeight: 700,
                marginBottom: '6px',
              }}
            >
              KIẾN THỨC
            </div>
            <h1
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '28px',
                fontWeight: 500,
                color: '#18181B',
                margin: '0 0 8px',
              }}
            >
              Chọn chương trình bạn đang học
            </h1>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#57534E' }}>
              Mỗi hồ sơ chứa môn học, tài liệu và bài giảng tương tác được biên soạn riêng.
            </p>
            <button
              type="button"
              onClick={() => setViewMode('shelf')}
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                border: '1px solid #D6D1C4',
                background: '#FFFFFF',
                color: '#18181B',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📚 Xem kệ sách (85+ giáo trình)
            </button>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {KNOWLEDGE_PROGRAMMES.map((prog) => (
              <button
                key={prog.id}
                type="button"
                onClick={() => {
                  setActiveTierId(prog.tierId || 'all');
                  setViewMode('shelf');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  width: '100%',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '1px solid #E5E0D5',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                }}
              >
                <div
                  style={{
                    height: '92px',
                    width: '100%',
                    background: `linear-gradient(135deg, ${prog.accent} 0%, #1E293B 100%)`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 22px',
                    justifyContent: 'space-between',
                  }}
                >
                  <img
                    src={ELEC_SRC.hello}
                    alt={prog.title}
                    style={{ width: '68px', height: '68px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.28))' }}
                  />
                  <span
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.92)',
                      color: '#18181B',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {prog.number}
                  </span>
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
                      {prog.title}
                    </div>
                    <div style={{ fontSize: '13px', color: '#57534E', marginBottom: '8px' }}>
                      {prog.desc}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#78716C' }}>
                      📖 {prog.tags}
                    </div>
                  </div>
                  <span
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `1px solid ${prog.accent}`,
                      color: prog.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     VIEW 1: KỆ SÁCH KIẾN THỨC 3D/2.5D ("Toàn bộ sách trên kệ")
     ============================================================ */
  return (
    <div
      style={{
        background: '#F6F3EC',
        color: '#18181B',
        borderRadius: '22px',
        border: '1px solid #E5E0D5',
        overflow: 'hidden',
        boxShadow: '0 14px 36px rgba(15, 23, 42, 0.06)',
        position: 'relative',
      }}
    >
      {/* Top Library Header */}
      <div
        style={{
          padding: '22px 26px 16px',
          borderBottom: '1px solid #E5E0D5',
          background: '#FAF8F3',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '10.5px',
              letterSpacing: '0.18em',
              color: '#2E8B67',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            THƯ VIỆN
          </div>
          <h2
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(22px, 2.6vw, 30px)',
              fontWeight: 500,
              color: '#18181B',
              margin: '0 0 4px',
            }}
          >
            Toàn bộ sách trên kệ
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#78716C' }}>
            Mỗi gáy sách là một giáo trình. Độ dày của gáy là số chương đã viết ({allVolumes.length} đầu sách).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: '1px solid #D6D1C4',
              background: '#FFFFFF',
              color: '#44403C',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <span>🔍 Tìm sách</span>
            <kbd
              style={{
                padding: '1px 6px',
                borderRadius: '5px',
                border: '1px solid #D6D1C4',
                background: '#F5F2EB',
                fontSize: '10.5px',
                fontFamily: 'monospace',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Shelves Area */}
      <div
        style={{
          padding: '22px 24px 16px',
          maxHeight: '590px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
        }}
      >
        {visibleTiers.map((tier) => (
          <section key={tier.id}>
            {/* Wooden Shelf Box */}
            <div
              style={{
                background: '#EFECE3',
                border: '1px solid #DED9CC',
                borderRadius: '14px 14px 4px 4px',
                padding: '22px 20px 0',
                boxShadow: 'inset 0 10px 24px rgba(0,0,0,0.03)',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '5px',
                  minHeight: '238px',
                  paddingBottom: '2px',
                }}
              >
                {(tier.volumes || []).map((vol) => {
                  const isSelected = selectedVolume?.id === vol.id;
                  const anySelected = Boolean(selectedVolume);
                  // Spine width proportional to chapters count (between 44px and 72px)
                  const spineWidth = Math.max(44, Math.min(72, 36 + Math.round((vol.chapters || 10) * 1.1)));
                  const spineHeight = Math.max(198, Math.min(232, 192 + ((vol.title.length * 3) % 36)));

                  if (isSelected) {
                    // Unfolded 3D Front Book Cover + Floating Editorial Preview Card
                    return (
                      <div
                        key={vol.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '14px',
                          margin: '0 8px',
                          zIndex: 5,
                        }}
                      >
                        {/* 3D Front Cover */}
                        <div
                          onClick={() => handleOpenBookToc(vol)}
                          style={{
                            width: '158px',
                            height: `${spineHeight}px`,
                            borderRadius: '6px 10px 10px 6px',
                            background: '#FFFFFF',
                            border: `2px solid ${vol.accent}`,
                            boxShadow: '6px 10px 24px rgba(15, 23, 42, 0.22)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              height: '54%',
                              background: `linear-gradient(145deg, ${vol.accent} 0%, #1E293B 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '10px',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={ELEC_SRC.hello}
                              alt={vol.title}
                              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                            />
                            <span
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                fontSize: '10px',
                                fontFamily: 'monospace',
                                color: 'rgba(255,255,255,0.85)',
                                background: 'rgba(0,0,0,0.25)',
                                padding: '2px 6px',
                                borderRadius: '999px',
                              }}
                            >
                              {vol.chapters} ch
                            </span>
                          </div>
                          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                            <div>
                              <div style={{ fontSize: '9px', fontFamily: 'monospace', color: vol.accent, fontWeight: 700 }}>
                                {vol.number}
                              </div>
                              <div
                                style={{
                                  fontFamily: 'Georgia, "Times New Roman", serif',
                                  fontSize: '13.5px',
                                  fontWeight: 700,
                                  color: '#18181B',
                                  lineHeight: 1.25,
                                  marginTop: '2px',
                                }}
                              >
                                {vol.title}
                              </div>
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#78716C', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {vol.desc}
                            </div>
                          </div>
                        </div>

                        {/* Floating Editorial Preview Card */}
                        <div
                          style={{
                            width: '265px',
                            background: '#FAF8F3',
                            border: '1px solid #27272A',
                            borderRadius: '16px',
                            padding: '16px 18px',
                            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18)',
                            marginBottom: '8px',
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#2E8B67', fontWeight: 700 }}>
                              {vol.number}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVolume(null);
                              }}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#78716C',
                                cursor: 'pointer',
                                fontSize: '13px',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                          <h4
                            style={{
                              fontFamily: 'Georgia, "Times New Roman", serif',
                              fontSize: '18px',
                              fontWeight: 500,
                              color: '#18181B',
                              margin: '0 0 6px',
                            }}
                          >
                            {vol.title}
                          </h4>
                          <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#57534E', lineHeight: 1.45 }}>
                            {vol.desc}
                          </p>
                          <div style={{ fontSize: '11px', color: '#78716C', marginBottom: '6px' }}>
                            📖 {vol.tags}
                          </div>
                          <div style={{ fontSize: '11px', color: '#78716C', marginBottom: '12px', fontWeight: 600 }}>
                            {vol.chapters} chương
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenBookToc(vol)}
                            style={{
                              width: '100%',
                              padding: '8px 14px',
                              borderRadius: '999px',
                              border: '1px solid #2E8B67',
                              background: '#FFFFFF',
                              color: '#14532D',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Mở sách</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Standing Vertical Book Spine
                  return (
                    <button
                      key={vol.id}
                      type="button"
                      onClick={() => setSelectedVolume(vol)}
                      title={`${vol.title} (${vol.chapters} chương) — ${vol.desc}`}
                      style={{
                        width: `${spineWidth}px`,
                        height: `${spineHeight}px`,
                        background: vol.accent || '#3E5B70',
                        borderRadius: '4px 4px 2px 2px',
                        border: 'none',
                        borderLeft: '2px solid rgba(255,255,255,0.2)',
                        borderRight: '2px solid rgba(0,0,0,0.18)',
                        boxShadow: '2px 0 6px rgba(0,0,0,0.14)',
                        color: '#FAF8F3',
                        cursor: 'pointer',
                        padding: '12px 4px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        opacity: anySelected ? 0.52 : 1,
                        transition: 'transform 0.18s ease, opacity 0.18s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-6px)';
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.opacity = anySelected ? '0.52' : '1';
                      }}
                    >
                      {/* Top decorative gold/ivory bookbinding line */}
                      <span
                        style={{
                          width: '68%',
                          height: '1px',
                          background: 'rgba(255,255,255,0.38)',
                          display: 'block',
                        }}
                      />

                      {/* Vertical Spine Title */}
                      <span
                        style={{
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          color: '#FAF8F3',
                          maxHeight: `${spineHeight - 54}px`,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {vol.title}
                      </span>

                      {/* Bottom number & decorative line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', width: '100%' }}>
                        <span
                          style={{
                            width: '68%',
                            height: '1px',
                            background: 'rgba(255,255,255,0.35)',
                            display: 'block',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.85)',
                            fontWeight: 700,
                          }}
                        >
                          {vol.number}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wooden Shelf Ledge Plank */}
            <div
              style={{
                background: '#DFD9C8',
                border: '1px solid #CFC8B4',
                borderTop: '2px solid #EAE5D7',
                height: '24px',
                borderRadius: '0 0 8px 8px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 18px',
                boxShadow: '0 6px 12px rgba(15, 23, 42, 0.06)',
              }}
            >
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '9.5px',
                  letterSpacing: '0.16em',
                  color: '#6B665B',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {tier.kicker} ({tier.volumes.length} CUỐN)
              </span>
            </div>
          </section>
        ))}
      </div>

      {/* Bottom Tier Filter Bar (Khớp 100% thiết kế Aiducation) */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #E5E0D5',
          background: '#FAF8F3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTierId('all')}
            style={{
              padding: '5px 11px',
              borderRadius: '999px',
              border: 'none',
              background: activeTierId === 'all' ? 'rgba(46, 139, 103, 0.14)' : 'transparent',
              color: activeTierId === 'all' ? '#14532D' : '#78716C',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            TẤT CẢ KỆ SÁCH
          </button>

          {KNOWLEDGE_SHELF_TIERS.map((t) => {
            const active = activeTierId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTierId(t.id)}
                style={{
                  padding: '5px 11px',
                  borderRadius: '999px',
                  border: 'none',
                  background: active ? 'rgba(46, 139, 103, 0.14)' : 'transparent',
                  color: active ? '#14532D' : '#78716C',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                {t.kicker}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              marginLeft: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              border: '1px solid #D6D1C4',
              background: '#FFFFFF',
              color: '#44403C',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Xem dạng danh sách
          </button>
        </div>

        <span style={{ fontSize: '11px', color: '#A8A29E' }}>
          Bấm vào gáy sách để xem bìa & mở giáo trình
        </span>
      </div>

      {/* ── SEARCH MODAL (Tìm sách ⌘K) ── */}
      {searchOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10040,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '72px 16px 16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '580px',
              background: '#FAF8F3',
              borderRadius: '18px',
              border: '1px solid #D6D1C4',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E0D5', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🔍</span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm giáo trình: Hoá Đại cương, Vật lí 12, Học sâu, IELTS, Xác suất..."
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  color: '#18181B',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                style={{
                  border: '1px solid #D6D1C4',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                ESC
              </button>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
              {searchResults.map((vol) => (
                <button
                  key={vol.id}
                  type="button"
                  onClick={() => handleOpenBookToc(vol)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EFECE3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span
                      style={{
                        width: '12px',
                        height: '34px',
                        borderRadius: '3px',
                        background: vol.accent || '#3E5B70',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#18181B' }}>
                        {vol.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#78716C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vol.tierLabel} · {vol.desc}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#2E8B67', fontWeight: 700, flexShrink: 0 }}>
                    {vol.chapters} chương →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
