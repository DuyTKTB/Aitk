/* ============================================================
   ChapterInspectorPanel.jsx — CỘT THANH TRA CHUYÊN ĐỀ CỐ ĐỊNH
   ------------------------------------------------------------
   Đồng bộ trực tiếp với cả Dây lộ trình 3D và Bản đồ đồ thị DAG:
     • Mạch nối kiến thức tương tác (Gốc tiên quyết → Hiện tại → Mở đường cho)
     • Cảnh báo Adaptive Detour (vá lỗ hổng gốc tức thời)
     • Thanh mức sẵn sàng theo 3 Phần đề thi 2025–2026 (I · II · III)
     • Tóm tắt 10 giây (Công thức cốt lõi + Bẫy sai chí mạng)
     • Danh sách bài học con & Nút gọi nhanh Casio fx-580VN X / AI
   ============================================================ */

import { useMemo } from 'react';
import {
  getChapterMeta,
  getDirectDependents,
  SUBJECT_META,
} from '../../data/curriculumDag.js';
import { findLessonsByChapter } from '../../data/dedicatedLessonsData.js';
import { formatMathAndChemSymbols } from '../../lib/chemFormulaFormatter.js';

const SvgIcon = ({ size = 15, className = '', children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

const IcoBookOpen = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </SvgIcon>
);

const IcoPlay = ({ size = 13 }) => (
  <SvgIcon size={size}>
    <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
  </SvgIcon>
);

const IcoLink = ({ size = 13 }) => (
  <SvgIcon size={size}>
    <path d="M10 13a5 5 0 0 0 7.54.54l2.5-2.5a5 5 0 0 0-7.07-7.07l-1.4 1.4" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-2.5 2.5a5 5 0 0 0 7.07 7.07l1.4-1.4" />
  </SvgIcon>
);

const IcoAlert = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </SvgIcon>
);

const IcoCalc = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="11" x2="8.01" y2="11" />
    <line x1="12" y1="11" x2="12.01" y2="11" />
    <line x1="16" y1="11" x2="16.01" y2="11" />
    <line x1="8" y1="15" x2="8.01" y2="15" />
    <line x1="12" y1="15" x2="12.01" y2="15" />
    <line x1="16" y1="15" x2="16.01" y2="15" />
    <line x1="8" y1="19" x2="12" y2="19" />
  </SvgIcon>
);

const IcoSparkles = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </SvgIcon>
);

const IcoClose = ({ size = 16 }) => (
  <SvgIcon size={size}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </SvgIcon>
);

const IcoArrow = ({ size = 12 }) => (
  <SvgIcon size={size}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </SvgIcon>
);

export default function ChapterInspectorPanel({
  chapterView,
  onSelectChapter,
  onOpenChapter,
  onPracticeChapter,
  onOpenLesson,
  onAiChapter,
  onOpenCasio,
  mobileOpen = false,
  onCloseMobile,
}) {
  const chId = chapterView?.chapter?.id || null;
  const meta = useMemo(() => (chId ? getChapterMeta(chId) : null), [chId]);

  const prereqNodes = useMemo(
    () => (meta?.prereq || []).map((id) => getChapterMeta(id)).filter(Boolean),
    [meta],
  );
  const nextNodes = useMemo(
    () => (chId ? getDirectDependents(chId).map((id) => getChapterMeta(id)).filter(Boolean) : []),
    [chId],
  );
  const subLessons = useMemo(() => {
    if (!chId) return [];
    const targetId = meta?.dedicatedChapterId || chId;
    return findLessonsByChapter(targetId);
  }, [chId, meta]);

  if (!chapterView) {
    return (
      <aside className="rm-pro-inspector is-empty" aria-label="Chi tiết chuyên đề">
        <div className="rm-pro-insp-empty">
          <img src="/img/elec/elec-hello.png" alt="Bé Elec chào đón" className="rm-pro-insp-empty-mascot" draggable={false} />
          <b>Chọn một chuyên đề trên lộ trình</b>
          <p>Bấm vào bất kỳ nút chuyên đề nào để xem mạch tiên quyết, 3 phần đề thi, công thức và bẫy sai.</p>
        </div>
      </aside>
    );
  }

  const subMeta = SUBJECT_META[meta?.subject || chapterView.chapter?.subjectKey || 'hoa'];
  const masteryPct = chapterView.masteryPct ?? chapterView.mastery?.score ?? 0;
  const answers = chapterView.answers ?? chapterView.summary?.answers ?? 0;
  const accuracyPct = chapterView.accuracyPct ?? chapterView.mastery?.accuracy ?? 0;
  const wrongDue = chapterView.wrongDue || 0;
  const isDueReview = Boolean(chapterView.review?.isDue);
  const detour = chapterView.adaptiveDetour;
  const examParts = meta?.examParts || { part1: 50, part2: 30, part3: 20 };

  const inspMascot =
    answers >= 6 && masteryPct >= 78
      ? '/img/elec/elec-celebrate.png'
      : isDueReview
        ? '/img/elec/elec-fighting.png'
        : '/img/elec/elec-think.png';

  const body = (
    <div className="rm-pro-insp-card">
      <img src={inspMascot} alt="" className="rm-pro-insp-mascot" aria-hidden="true" />
      {/* Header gọn */}
      <div className="rm-pro-insp-head is-with-mascot">
        <div className="rm-pro-insp-badges">
          <span className={`rm-pro-sub-pill sub-${subMeta?.key || 'hoa'}`}>
            {subMeta?.name || 'KHTN'} · Lớp {meta?.grade || chapterView.chapter?.grade || 12}
          </span>
          {meta?.code && <span className="rm-pro-code-pill">#{meta.code}</span>}
          <span className="rm-pro-weight-pill">{meta?.questionsInExam || chapterView.questionsInExam || '2 câu'}</span>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            className="rm-pro-insp-close"
            onClick={onCloseMobile}
            aria-label="Đóng bảng chi tiết"
          >
            <IcoClose size={16} />
          </button>
        )}
      </div>

      <h3 className="rm-pro-insp-title">
        {formatMathAndChemSymbols(chapterView.chapter.name)}
      </h3>
      <p className="rm-pro-insp-desc">
        {formatMathAndChemSymbols(meta?.desc || chapterView.chapter.desc || '')}
      </p>

      {/* Thanh trạng thái thành thạo */}
      <div className={`rm-pro-mastery-box tone-${chapterView.studentTone || 'muted'}`}>
        <div className="rm-pro-mastery-top">
          <span className="rm-pro-mastery-status">
            {isDueReview
              ? `Cần ôn chống quên${chapterView.review?.overdueDays ? ` (quá ${chapterView.review.overdueDays} ngày)` : ''}`
              : (chapterView.studentStatus || 'Chưa bắt đầu')}
          </span>
          <b>{answers > 0 ? `${masteryPct}%` : 'Chưa đo'}</b>
        </div>
        <div className="rm-pro-mastery-track" aria-hidden="true">
          <i style={{ width: `${answers > 0 ? Math.max(8, masteryPct) : 0}%` }} />
        </div>
        <div className="rm-pro-mastery-meta">
          <span>Đã luyện: <b>{answers}</b> câu</span>
          <span>Độ chính xác: <b>{answers > 0 ? `${accuracyPct}%` : '—'}</b></span>
          <span>Trọng tâm: <b>{meta?.weightLabel || chapterView.weightLabel || 'Nền tảng'}</b></span>
        </div>
      </div>

      {/* Adaptive Detour Alert nếu phát hiện lỗ hổng gốc */}
      {detour && (
        <div className="rm-pro-detour-box" role="note">
          <div className="rm-pro-detour-head">
            <img src="/img/elec/elec-cool.png" alt="" className="rm-pro-mini-sticker" aria-hidden="true" />
            <IcoAlert size={14} />
            <b>Phát hiện kiến thức gốc cần vá</b>
          </div>
          <p>{formatMathAndChemSymbols(detour.reason)}</p>
          <button
            type="button"
            className="rm-pro-detour-jump"
            onClick={() => onSelectChapter?.(detour.rootId)}
          >
            <span>Đi tới gốc: {formatMathAndChemSymbols(detour.rootName)}</span>
            <IcoArrow size={12} />
          </button>
        </div>
      )}

      {/* Mạch nối kiến thức (DAG Lineage) */}
      <div className="rm-pro-section">
        <div className="rm-pro-sec-label">
          <IcoLink size={13} />
          <span>Mạch logic kiến thức (DAG)</span>
        </div>
        {meta?.bridge && (
          <p className="rm-pro-bridge-txt">{formatMathAndChemSymbols(meta.bridge)}</p>
        )}
        <div className="rm-pro-lineage-grid">
          <div className="rm-pro-lineage-col">
            <small>Gốc tiên quyết ({prereqNodes.length})</small>
            {prereqNodes.length === 0 ? (
              <span className="rm-pro-lineage-none">Chương mở đầu</span>
            ) : (
              <div className="rm-pro-lineage-chips">
                {prereqNodes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="rm-pro-lineage-chip is-up"
                    onClick={() => onSelectChapter?.(p.id)}
                  >
                    <span>{p.code}</span> {formatMathAndChemSymbols(p.name)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="rm-pro-lineage-col">
            <small>Mở đường cho ({nextNodes.length})</small>
            {nextNodes.length === 0 ? (
              <span className="rm-pro-lineage-none">Chuyên đề chốt đích</span>
            ) : (
              <div className="rm-pro-lineage-chips">
                {nextNodes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="rm-pro-lineage-chip is-down"
                    onClick={() => onSelectChapter?.(n.id)}
                  >
                    <span>{n.code}</span> {formatMathAndChemSymbols(n.name)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phân bổ 3 phần đề thi 2025-2026 */}
      <div className="rm-pro-section">
        <div className="rm-pro-sec-label">
          <span>Tỉ trọng trong 3 phần đề thi 2025–2026</span>
        </div>
        <div className="rm-pro-exam-split">
          <div className="rm-pro-split-row">
            <span>Phần I (4 chọn 1)</span>
            <div className="rm-pro-split-bar"><i className="p1" style={{ width: `${examParts.part1}%` }} /></div>
            <b>{examParts.part1}%</b>
          </div>
          <div className="rm-pro-split-row">
            <span>Phần II (Đúng/Sai)</span>
            <div className="rm-pro-split-bar"><i className="p2" style={{ width: `${examParts.part2}%` }} /></div>
            <b>{examParts.part2}%</b>
          </div>
          <div className="rm-pro-split-row">
            <span>Phần III (Điền số)</span>
            <div className="rm-pro-split-bar"><i className="p3" style={{ width: `${examParts.part3}%` }} /></div>
            <b>{examParts.part3}%</b>
          </div>
        </div>
      </div>

      {/* Tóm tắt nhanh 10 giây: Công thức + Bẫy thi */}
      {(meta?.formulas?.length > 0 || meta?.keyTrap) && (
        <div className="rm-pro-section">
          <div className="rm-pro-sec-label">
            <span>Tóm tắt 10 giây · Công thức &amp; Bẫy thi</span>
          </div>
          {meta?.formulas?.length > 0 && (
            <div className="rm-pro-formulas">
              {meta.formulas.map((f, idx) => (
                <code key={idx} className="rm-pro-formula-chip">
                  {formatMathAndChemSymbols(f)}
                </code>
              ))}
            </div>
          )}
          {meta?.keyTrap && (
            <div className="rm-pro-trap-note">
              <IcoAlert size={13} />
              <span><b>Bẫy hay mất điểm:</b> {formatMathAndChemSymbols(meta.keyTrap)}</span>
            </div>
          )}
        </div>
      )}

      {/* Danh sách bài học chi tiết */}
      {subLessons.length > 0 && (
        <div className="rm-pro-section">
          <div className="rm-pro-sec-label">
            <span>Bài học chuyên sâu ({subLessons.length})</span>
          </div>
          <div className="rm-pro-sublessons">
            {subLessons.slice(0, 4).map((les) => (
              <button
                key={les.id}
                type="button"
                className="rm-pro-sublesson-btn"
                onClick={() => onOpenLesson?.(les.id, les.subjectKey, chId)}
              >
                <span className="rm-pro-sl-idx">Bài {les.lessonIndex}</span>
                <span className="rm-pro-sl-title">{formatMathAndChemSymbols(les.title)}</span>
                <IcoArrow size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nút hành động chính */}
      <div className="rm-pro-insp-actions">
        <button
          type="button"
          className="rm-pro-act-primary"
          onClick={() => onOpenChapter?.(chId)}
        >
          <IcoBookOpen size={14} />
          <span>Vào học bài bản</span>
        </button>
        <button
          type="button"
          className="rm-pro-act-secondary"
          onClick={() => onPracticeChapter?.(chId, wrongDue > 0 ? 'review' : 'fresh')}
        >
          <IcoPlay size={13} />
          <span>{wrongDue > 0 ? `Ôn ${wrongDue} câu sai` : 'Luyện tập'}</span>
        </button>
      </div>

      {/* Vũ khí hỗ trợ: Casio fx-580VN X & Gia sư AI */}
      <div className="rm-pro-insp-tools">
        {meta?.useCasio && (
          <button
            type="button"
            className="rm-pro-tool-btn is-casio"
            onClick={() => onOpenCasio?.()}
          >
            <IcoCalc size={14} />
            <span>Mở Casio fx-580VN X</span>
          </button>
        )}
        <button
          type="button"
          className="rm-pro-tool-btn is-ai"
          onClick={() => onAiChapter?.(chapterView.chapter, 'summary')}
        >
          <IcoSparkles size={14} />
          <span>AI tóm tắt &amp; giải bẫy</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="rm-pro-inspector desktop-only" aria-label="Bảng thanh tra chuyên đề">
        {body}
      </aside>

      {mobileOpen && (
        <div
          className="rm-pro-mobile-backdrop"
          role="presentation"
          onClick={onCloseMobile}
        >
          <div
            className="rm-pro-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết chuyên đề ${chapterView.chapter.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rm-pro-sheet-handle" aria-hidden="true" />
            {body}
          </div>
        </div>
      )}
    </>
  );
}
