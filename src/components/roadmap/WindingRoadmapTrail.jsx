/* ============================================================
   WindingRoadmapTrail.jsx — DÂY LỘ TRÌNH 5 CHẶNG CHUẨN GDPT 2018
   ------------------------------------------------------------
   Kiến trúc Siêu VIP (ELEC Roadmap Studio Pro):
     • Hiển thị 1 môn duy nhất mỗi lần (Hóa · Lý · Sinh) — không còn
       trộn lẫn 39 nút 3 môn rối mắt.
     • Phân đúng 5 Chặng sư phạm từ `SUBJECT_STAGES` (curriculumDag.js).
     • Tích hợp "Checkpoint nhảy cóc" ngay trên từng Banner Chặng.
     • 5 trạng thái Node chuẩn Duolingo × Brilliant:
       Sẵn sàng · Đang luyện (vòng SVG) · Thành thạo (3 sao) ·
       Suy giảm trí nhớ (Amber pulse) · Thiếu gốc tiên quyết (gợi ý).
     • Bấm Node đồng bộ ngay sang Cột Thanh tra (ChapterInspectorPanel).
   ============================================================ */

import { useMemo, useRef } from 'react';
import {
  getChapterMeta,
  getCurriculumStages,
  SUBJECT_META,
} from '../../data/curriculumDag.js';
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

const IcoCheck = ({ size = 14 }) => (
  <SvgIcon size={size}>
    <polyline points="20 6 9 17 4 12" />
  </SvgIcon>
);

const IcoStar = ({ size = 12, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />
  </svg>
);

const IcoFlag = ({ size = 13 }) => (
  <SvgIcon size={size}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </SvgIcon>
);

const IcoClock = ({ size = 12 }) => (
  <SvgIcon size={size}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </SvgIcon>
);

const IcoCalc = ({ size = 12 }) => (
  <SvgIcon size={size}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </SvgIcon>
);

const IcoArrow = ({ size = 13 }) => (
  <SvgIcon size={size}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </SvgIcon>
);

const IcoShield = ({ size = 13 }) => (
  <SvgIcon size={size}>
    <path d="M12 3 4.5 6.2v5.4c0 4.7 3.2 8.2 7.5 9.6 4.3-1.4 7.5-4.9 7.5-9.6V6.2z" />
    <path d="m9 12.2 2 2 4-4.2" />
  </SvgIcon>
);

function getNodeState(c) {
  const answers = c.answers ?? c.summary?.answers ?? 0;
  const mastery = c.masteryPct ?? c.mastery?.score ?? 0;
  if (c.review?.isDue) return { kind: 'decay', stars: mastery >= 75 ? 2 : 1 };
  if (answers >= 6 && mastery >= 85) return { kind: 'mastered', stars: 3 };
  if (answers >= 6 && mastery >= 78) return { kind: 'mastered', stars: 2 };
  if (answers > 0 && mastery < 55) return { kind: 'weak', stars: 1 };
  if (answers > 0) return { kind: 'active', stars: mastery >= 65 ? 2 : 1 };
  return { kind: 'ready', stars: 0 };
}

export default function WindingRoadmapTrail({
  chapters = [],
  subjectKey = 'hoa',
  selectedId = null,
  checkpoints = {},
  onSelectChapter,
  onOpenChapter,
  onStartCheckpoint,
}) {
  const stageRefs = useRef({});
  const stages = useMemo(() => getCurriculumStages(subjectKey), [subjectKey]);
  const subMeta = SUBJECT_META[subjectKey] || SUBJECT_META.hoa;

  const groupedStages = useMemo(() => {
    const map = new Map(stages.map((s) => [s.id, []]));
    (chapters || []).forEach((c) => {
      const meta = getChapterMeta(c.chapter?.id);
      const sid = meta?.stageId && map.has(meta.stageId)
        ? meta.stageId
        : stages[0]?.id;
      if (sid) map.get(sid).push(c);
    });

    return stages
      .map((stage) => {
        const items = (map.get(stage.id) || []).sort((a, b) => {
          const oa = getChapterMeta(a.chapter.id)?.order ?? a.orderIndex ?? 0;
          const ob = getChapterMeta(b.chapter.id)?.order ?? b.orderIndex ?? 0;
          return oa - ob;
        });
        const masteredCount = items.filter((it) => {
          const ans = it.answers ?? it.summary?.answers ?? 0;
          const m = it.masteryPct ?? it.mastery?.score ?? 0;
          return ans >= 6 && m >= 78;
        }).length;
        const pct = items.length ? Math.round((masteredCount / items.length) * 100) : 0;
        const cp = checkpoints?.[stage.id] || null;
        return { stage, items, masteredCount, pct, checkpoint: cp };
      })
      .filter((g) => g.items.length > 0);
  }, [stages, chapters, checkpoints]);

  const scrollToStage = (stageId) => {
    const el = stageRefs.current[stageId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (groupedStages.length === 0) {
    return (
      <div className="rm-pro-empty">
        <b>Không có chuyên đề phù hợp bộ lọc hiện tại</b>
        <p>Thử chuyển bộ lọc sang “Tất cả” hoặc xóa từ khóa tìm kiếm để xem đủ lộ trình {subMeta.name}.</p>
      </div>
    );
  }

  return (
    <div className="rm-pro-trail">
      {/* Thanh nhảy nhanh 5 Chặng gọn gàng */}
      <nav className="rm-pro-stage-pills" aria-label="Nhảy nhanh tới chặng">
        {groupedStages.map(({ stage, masteredCount, items, checkpoint }) => (
          <button
            key={stage.id}
            type="button"
            className={`rm-pro-stage-pill tone-${stage.tone} ${checkpoint?.passed ? 'is-verified' : ''}`}
            onClick={() => scrollToStage(stage.id)}
          >
            <span className="sp-code">{stage.code}</span>
            <span className="sp-band">{stage.targetBand}</span>
            <span className="sp-stat">
              {checkpoint?.passed ? <IcoCheck size={11} /> : `${masteredCount}/${items.length}`}
            </span>
          </button>
        ))}
      </nav>

      {/* Các Chặng sư phạm nối tiếp */}
      <div className="rm-pro-stages-stack">
        {groupedStages.map(({ stage, items, masteredCount, pct, checkpoint }, stageIdx) => {
          const stageChapterIds = items.map((x) => x.chapter.id);
          const stageMascots = [
            '/img/elec/elec-hello.png',
            '/img/elec/elec-think.png',
            '/img/elec/elec-wink.png',
            '/img/elec/elec-fighting.png',
            '/img/elec/elec-super-saiyan.png',
          ];
          const stageMascot = checkpoint?.passed
            ? '/img/elec/elec-celebrate.png'
            : stageMascots[stageIdx % stageMascots.length];
          return (
            <section
              key={stage.id}
              ref={(el) => { stageRefs.current[stage.id] = el; }}
              className={`rm-pro-stage tone-${stage.tone}`}
              aria-label={stage.title}
            >
              {/* Banner Chặng hợp nhất + Linh vật Chặng + Nút Checkpoint nhảy cóc */}
              <header className="rm-pro-stage-head">
                <div className="rm-pro-stage-lead">
                  <div className="rm-pro-stage-mascot" aria-hidden="true">
                    <img src={stageMascot} alt="" draggable={false} />
                  </div>
                  <div className="rm-pro-stage-meta">
                    <div className="rm-pro-stage-top">
                      <span className="rm-pro-stage-code">{stage.code}</span>
                      <span className="rm-pro-stage-label">{stage.stageLabel}</span>
                      <span className="rm-pro-stage-band">{stage.targetBand}</span>
                    </div>
                    <h3 className="rm-pro-stage-title">{stage.title}</h3>
                    <p className="rm-pro-stage-focus">{stage.examFocus}</p>
                  </div>
                </div>

                <div className="rm-pro-stage-right">
                  <div className="rm-pro-stage-prog">
                    <span>{masteredCount}/{items.length} vững</span>
                    <div className="rm-pro-stage-bar"><i style={{ width: `${pct}%` }} /></div>
                  </div>

                  {checkpoint?.passed ? (
                    <span className="rm-pro-cp-verified" title={`Đạt ${checkpoint.scorePct}% bài Checkpoint`}>
                      <IcoShield size={13} />
                      <span>Vượt Checkpoint ({checkpoint.scorePct}%)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="rm-pro-cp-btn"
                      onClick={() => onStartCheckpoint?.({
                        id: stage.id,
                        code: stage.code,
                        title: stage.title,
                        subjectKey,
                        chapterIds: stageChapterIds,
                      })}
                      title="Làm bài kiểm tra nhanh 8 câu (≥85%) để xác nhận vững chặng này"
                    >
                      <IcoFlag size={12} />
                      <span>Checkpoint nhảy cóc</span>
                    </button>
                  )}
                </div>
              </header>

              {/* Dây các nút chuyên đề theo đường zíc-zắc mượt */}
              <ol className="rm-pro-node-list">
                {items.map((c, idx) => {
                  const id = c.chapter.id;
                  const meta = getChapterMeta(id);
                  const st = getNodeState(c);
                  const answers = c.answers ?? c.summary?.answers ?? 0;
                  const mastery = c.masteryPct ?? c.mastery?.score ?? 0;
                  const isSelected = selectedId === id;
                  const hasDetour = Boolean(c.adaptiveDetour);
                  const ringRadius = 21;
                  const ringCirc = 2 * Math.PI * ringRadius;
                  const ringOffset = ringCirc * (1 - (answers > 0 ? Math.min(100, mastery) / 100 : 0));

                  return (
                    <li
                      key={id}
                      className={`rm-pro-node-row ${idx % 2 === 1 ? 'is-alt' : ''}`}
                    >
                      <div className="rm-pro-rail" aria-hidden="true">
                        <span className={`rm-pro-rail-line ${idx === 0 ? 'is-first' : ''} ${idx === items.length - 1 ? 'is-last' : ''}`} />
                        <div className={`rm-pro-node-orb st-${st.kind} ${isSelected ? 'is-selected' : ''}`}>
                          <svg className="rm-pro-orb-ring" viewBox="0 0 50 50" aria-hidden="true">
                            <circle cx="25" cy="25" r={ringRadius} className="ring-track" />
                            <circle
                              cx="25"
                              cy="25"
                              r={ringRadius}
                              className="ring-fill"
                              strokeDasharray={ringCirc}
                              strokeDashoffset={ringOffset}
                            />
                          </svg>
                          <span className="rm-pro-orb-core">
                            {st.kind === 'mastered' ? <IcoCheck size={15} /> : (meta?.code || `${idx + 1}`)}
                          </span>
                        </div>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        className={`rm-pro-node-card st-${st.kind} ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => onSelectChapter?.(id)}
                        onDoubleClick={() => onOpenChapter?.(id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectChapter?.(id);
                          }
                        }}
                      >
                        <div className="rm-pro-nc-top">
                          <div className="rm-pro-nc-tags">
                            <span className="nc-grade">Lớp {meta?.grade || c.chapter.grade}</span>
                            <span className="nc-weight">{meta?.questionsInExam || c.questionsInExam}</span>
                            {meta?.useCasio && (
                              <span className="nc-casio" title="Chuyên đề hỗ trợ bấm máy Casio fx-580VN X">
                                <IcoCalc size={11} />
                                <span>Casio</span>
                              </span>
                            )}
                          </div>

                          <div className="rm-pro-nc-stars" aria-label={`${st.stars} trên 3 sao`}>
                            {[1, 2, 3].map((n) => (
                              <span key={n} className={n <= st.stars ? 'is-lit' : ''}>
                                <IcoStar size={12} filled={n <= st.stars} />
                              </span>
                            ))}
                          </div>
                        </div>

                        <h4 className="rm-pro-nc-title">
                          {formatMathAndChemSymbols(c.chapter.name)}
                        </h4>

                        <p className="rm-pro-nc-bridge">
                          {formatMathAndChemSymbols(meta?.bridge || c.chapter.desc)}
                        </p>

                        <div className="rm-pro-nc-foot">
                          <div className="rm-pro-nc-status">
                            {st.kind === 'decay' ? (
                              <span className="st-pill is-decay">
                                <IcoClock size={11} />
                                <span>
                                  {c.review?.overdueDays > 0
                                    ? `Quá hạn ôn ${c.review.overdueDays} ngày`
                                    : 'Đến hạn ôn giữ trí nhớ'}
                                </span>
                              </span>
                            ) : hasDetour && st.kind !== 'mastered' ? (
                              <span className="st-pill is-detour">
                                Gốc gợi ý: {formatMathAndChemSymbols(c.adaptiveDetour.rootName)}
                              </span>
                            ) : (
                              <span className={`st-pill is-${st.kind}`}>
                                {answers > 0 ? `Thành thạo ${mastery}% (${answers} câu)` : (meta?.weightLabel || 'Sẵn sàng học')}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="rm-pro-nc-open"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenChapter?.(id);
                            }}
                          >
                            <span>{answers > 0 ? 'Tiếp tục' : 'Vào học'}</span>
                            <IcoArrow size={12} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
