/* ============================================================
   RoadmapCard.jsx — "Lộ trình kiến thức" (bản nâng cấp)
   ------------------------------------------------------------
   Thay cho RoadmapBento cũ (menu tĩnh gọi AI). Card này:
   1. Đọc lộ trình từ data/roadmap.js (có topic_id chuẩn).
   2. Hiện tiến độ THẬT theo chương (exam_answers → topic_id),
      chưa luyện thì để trống chứ không bịa 0%.
   3. Ghim "Học tiếp" — chương đầu tiên chưa đạt 70%.
   4. Bấm chương → 3 hành động: Học nhanh · Luyện 5 câu · Sổ lỗi sai.
   5. Deep link #home?topic=c11-alcohol mở đúng chương.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { askAI } from './HomePlus.jsx';
import { IcoBook } from './Icons.jsx';
import {
  LEVEL_KEYS, DEFAULT_LEVEL, getLevel, findChapter, pctOf,
  nextChapter, levelStats, MASTERED_PCT,
} from '../data/roadmap.js';
import { useTopicProgress } from '../lib/topicProgress.js';

const GRADE_KEY = 'cs-home-grade';

function readGrade() {
  try {
    const g = localStorage.getItem(GRADE_KEY);
    return LEVEL_KEYS.indexOf(g) >= 0 ? g : DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL;
  }
}

function readTopicParam() {
  try {
    const q = window.location.hash.split('?')[1] || '';
    return new URLSearchParams(q).get('topic');
  } catch {
    return null;
  }
}

function Ring({ pct }) {
  const R = 11;
  const C = 2 * Math.PI * R;
  const has = pct !== null;
  return (
    <svg className={'road-ring' + (has ? '' : ' is-empty')} width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r={R} className="road-ring-bg" />
      {has && (
        <circle
          cx="15" cy="15" r={R}
          className="road-ring-fg"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          transform="rotate(-90 15 15)"
        />
      )}
      {has && <text x="15" y="19" textAnchor="middle" className="road-ring-t">{pct}</text>}
    </svg>
  );
}

export default function RoadmapCard() {
  const { user } = useAuth();
  const { map: progress, loading } = useTopicProgress(user && user.uid);
  const [grade, setGrade] = useState(readGrade);
  const [sheet, setSheet] = useState(null);
  const sheetRef = useRef(null);

  const level = useMemo(() => getLevel(grade), [grade]);
  const stats = useMemo(() => levelStats(level, progress), [level, progress]);
  const next = useMemo(() => nextChapter(level, progress), [level, progress]);

  const open = useCallback((chapter, index, lv) => {
    setSheet({ chapter, index, levelKey: lv });
  }, []);

  const close = useCallback(() => setSheet(null), []);

  /* Đổi lớp + nhớ lựa chọn */
  const pick = (key) => {
    if (LEVEL_KEYS.indexOf(key) < 0) return;
    setGrade(key);
    try { localStorage.setItem(GRADE_KEY, key); } catch { /* */ }
  };

  /* Deep link #home?topic=<id>
     Phải nghe cả hashchange: đổi hash không remount trang chủ,
     nên chỉ chạy 1 lần lúc mount sẽ bỏ sót link dán vào thanh địa chỉ. */
  useEffect(() => {
    const apply = () => {
      const id = readTopicParam();
      if (!id) return;
      const hit = findChapter(id);
      if (!hit) return;
      pick(hit.level.key);
      open(hit.chapter, hit.index, hit.level.key);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Esc đóng sheet + giữ focus trong sheet */
  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    if (sheetRef.current && sheetRef.current.focus) sheetRef.current.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, close]);

  const goSummary = (chapter, levelKey) => {
    askAI(
      `Tóm tắt kiến thức trọng tâm chương "${chapter.name}" Hóa học ${levelKey} kèm 3 câu hỏi trắc nghiệm ôn tập`,
      levelKey,
    );
  };

  const goPractice = (chapter, levelKey) => {
    askAI(
      `Tạo 5 câu trắc nghiệm chương "${chapter.name}" Hóa học ${levelKey}, mỗi câu 4 lựa chọn, có đáp án đúng và giải thích ngắn.`,
      levelKey,
    );
  };

  const goNotebook = (chapter) => {
    if (!chapter.id) return;
    window.location.hash = 'notebook?topic=' + encodeURIComponent(chapter.id);
  };

  const sheetPct = sheet ? pctOf(progress[sheet.chapter.id]) : null;

  return (
    <article className="bento-card bento-roadmap tone-purple">
      <div className="bento-widget-title">
        <span className="bento-wt">
          <i className="bento-wt-ico"><IcoBook size={16} /></i>
          Lộ trình kiến thức
        </span>
      </div>

      <div className="bento-segmented-control" role="tablist">
        {LEVEL_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === grade}
            className={'bento-segmented-btn' + (k === grade ? ' active' : '')}
            onClick={() => pick(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <p className="bento-road-goal">{level.goal}</p>

      {stats.total > 0 && (
        <div className="road-progress">
          <div className="road-progress-top">
            <span>Đã nắm <b>{stats.done}</b>/{stats.total} chương</span>
            <span className="road-progress-note">
              {loading ? 'đang tải…' : stats.practiced === 0 ? 'luyện đề để có số liệu' : `đã luyện ${stats.practiced}`}
            </span>
          </div>
          <div className="road-bar" role="progressbar" aria-valuemin={0} aria-valuemax={stats.total} aria-valuenow={stats.done}>
            <i style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {next && (
        <button
          type="button"
          className="road-next"
          onClick={() => open(next.chapter, next.index, grade)}
        >
          <span className="road-next-tag">Học tiếp</span>
          <span className="road-next-name">{next.chapter.name}</span>
          <span className="road-next-meta">{next.pct === null ? 'chưa luyện' : `${next.pct}% · mục tiêu ${MASTERED_PCT}%`}</span>
          <span className="road-next-go" aria-hidden="true">›</span>
        </button>
      )}

      <div className="road-list">
        {level.chapters.map((c, i) => {
          const pct = pctOf(progress[c.id]);
          const done = pct !== null && pct >= MASTERED_PCT;
          return (
            <button
              key={(c.id || 'uni') + i}
              type="button"
              className={'road-row' + (done ? ' is-done' : '')}
              onClick={() => open(c, i, grade)}
              aria-label={`${c.name}${pct === null ? ' — chưa luyện' : ` — ${pct}% chính xác`}`}
            >
              <span className="road-row-num">{i + 1}</span>
              <span className="road-row-name">{c.name}</span>
              {c.bank === false ? (
                <span className="road-row-badge">AI</span>
              ) : (
                <Ring pct={pct} />
              )}
              <span className="road-row-chev" aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>

      {sheet && createPortal((
        <div className="road-sheet-backdrop" onClick={close} role="presentation">
          <div
            className="road-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={sheet.chapter.name}
            tabIndex={-1}
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="road-sheet-grip" aria-hidden="true" />

            <div className="road-sheet-head">
              <span className="road-row-num">{sheet.index + 1}</span>
              <div className="road-sheet-titles">
                <b>{sheet.chapter.name}</b>
                <small>
                  {sheet.levelKey}
                  {sheetPct === null ? ' · chưa luyện' : ` · ${sheetPct}% chính xác`}
                </small>
              </div>
              <button type="button" className="road-sheet-x" onClick={close} aria-label="Đóng">✕</button>
            </div>

            <div className="road-sheet-actions">
              <button type="button" className="road-act" onClick={() => goSummary(sheet.chapter, sheet.levelKey)}>
                <b>Học nhanh</b>
                <span>Tóm tắt trọng tâm + 3 câu ôn tập</span>
              </button>

              <button type="button" className="road-act" onClick={() => goPractice(sheet.chapter, sheet.levelKey)}>
                <b>Luyện 5 câu</b>
                <span>Trắc nghiệm có đáp án, chấm ngay</span>
              </button>

              <button
                type="button"
                className="road-act"
                onClick={() => goNotebook(sheet.chapter)}
                disabled={!sheet.chapter.id}
              >
                <b>Sổ lỗi sai</b>
                <span>{sheet.chapter.id ? 'Chỉ xem câu sai của chương này' : 'Chương này chưa có ngân hàng câu hỏi'}</span>
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </article>
  );
}
