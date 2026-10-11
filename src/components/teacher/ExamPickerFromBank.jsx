/* ============================================================
   ExamPickerFromBank.jsx — Chọn câu từ ngân hàng để thêm vào đề (v2)
   ------------------------------------------------------------
   Thay cho cả ExamPickerFromBank cũ và QuestionBankPicker (2 file trùng
   nhau 95%; QuestionBankPicker nay chỉ re-export file này).

   Sửa lỗi:
     • Bộ lọc mặc định (môn/lớp) có thể khiến danh sách trống mà không có
       nút nào để gỡ (nhóm lọc bị ẩn khi chỉ có 1 giá trị). Nay: bộ lọc
       mặc định chỉ áp dụng nếu thật sự có câu khớp, nhóm lọc đang bật luôn
       hiện, và có nút "Xóa bộ lọc".
     • Tìm kiếm không phân biệt dấu.
     • Đóng bằng phím Esc.
   Nâng cấp:
     • Chọn ngẫu nhiên N câu trong kết quả lọc (ra đề nhanh).
     • excludeIds: câu đã có trong đề hiển thị "Đã có trong đề", không chọn lại được.
   ============================================================ */
import { useState, useMemo, useEffect } from 'react';
import MathText from '../MathText.jsx';
import { getQuestions, norm } from '../../lib/questionBank.js';
import { CHEM_TOPICS } from '../../data/chemTopics.js';
import { IcoClose, IcoSearch, IcoLibrary } from '../../lib/sessionIcons.jsx';
import '../../styles/question-bank.css';

const IcoCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LEVELS = ['', 'nhận biết', 'thông hiểu', 'vận dụng', 'vận dụng cao'];

function sample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function ExamPickerFromBank({
  teacherId,
  defaultSubject = '',
  defaultGrade = 0,
  excludeIds = [],
  onPick,
  onClose,
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState(0);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [picked, setPicked] = useState(() => new Set());
  const [randomN, setRandomN] = useState(10);

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return undefined; }
    let alive = true;
    setLoading(true);
    getQuestions({ teacherId, sortBy: 'usage' })
      .then((rows) => {
        if (!alive) return;
        setList(rows);
        // Chỉ áp dụng bộ lọc mặc định nếu ngân hàng có câu khớp
        if (defaultSubject && rows.some((q) => q.subject === defaultSubject)) setFilterSubject(defaultSubject);
        if (defaultGrade && rows.some((q) => q.grade === defaultGrade)) setFilterGrade(defaultGrade);
      })
      .catch((e) => console.warn('[ExamPickerFromBank] lỗi:', e))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const availableSubjects = useMemo(
    () => [...new Set(list.map((q) => q.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [list]
  );
  const availableGrades = useMemo(
    () => [...new Set(list.map((q) => q.grade).filter((g) => g > 0))].sort((a, b) => a - b),
    [list]
  );
  const availableTopics = useMemo(() => {
    const ids = new Set(list.map((q) => q.topicId).filter(Boolean));
    return CHEM_TOPICS.filter((t) => ids.has(t.id));
  }, [list]);

  const filtered = useMemo(() => {
    let arr = list;
    if (filterSubject) arr = arr.filter((q) => q.subject === filterSubject);
    if (filterGrade) arr = arr.filter((q) => q.grade === filterGrade);
    if (filterTopic) arr = arr.filter((q) => q.topicId === filterTopic);
    if (filterLevel) arr = arr.filter((q) => q.level === filterLevel);
    if (search.trim()) {
      const needle = norm(search);
      arr = arr.filter((q) => norm(q.q).includes(needle) || norm(q.explain).includes(needle));
    }
    return arr;
  }, [list, filterSubject, filterGrade, filterTopic, filterLevel, search]);

  const selectable = useMemo(() => filtered.filter((q) => !excluded.has(q.id)), [filtered, excluded]);
  const hasFilter = !!(filterSubject || filterGrade || filterTopic || filterLevel || search.trim());

  const clearFilters = () => {
    setFilterSubject(''); setFilterGrade(0); setFilterTopic(''); setFilterLevel(''); setSearch('');
  };

  const toggle = (id) => {
    if (excluded.has(id)) return;
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pickAll = () => setPicked((s) => {
    const next = new Set(s);
    selectable.forEach((q) => next.add(q.id));
    return next;
  });

  const pickRandom = () => {
    const n = Math.max(1, Math.min(Number(randomN) || 1, selectable.length));
    setPicked(new Set(sample(selectable, n).map((q) => q.id)));
  };

  const handleConfirm = () => onPick?.(list.filter((q) => picked.has(q.id)));

  const chip = (on, label, onClick, key) => (
    <button key={key ?? label} type="button" className={'qb-chip' + (on ? ' on' : '')} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <div className="vt-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="qb-picker" role="dialog" aria-modal="true" aria-label="Chọn câu từ ngân hàng">
        <header className="qb-form-head">
          <h2>Chọn câu từ ngân hàng</h2>
          <button type="button" className="qb-icon-btn" onClick={onClose} aria-label="Đóng">
            <IcoClose size={16} />
          </button>
        </header>

        {/* Toolbar */}
        <div style={{ padding: '.8rem 1.3rem', borderBottom: '1px solid var(--soft)', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          <div className="qb-search-row">
            <label className="qb-search">
              <IcoSearch size={15} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm trong câu hỏi và lời giải (gõ không dấu cũng được)..."
              />
            </label>
          </div>

          {(availableSubjects.length > 1 || filterSubject) && (
            <div className="qb-filters">
              <span className="qb-filter-label">Môn</span>
              {chip(!filterSubject, 'Tất cả', () => setFilterSubject(''), 'sub-all')}
              {availableSubjects.map((s) => chip(filterSubject === s, s, () => setFilterSubject(s)))}
            </div>
          )}

          {(availableGrades.length > 1 || filterGrade > 0) && (
            <div className="qb-filters">
              <span className="qb-filter-label">Lớp</span>
              {chip(!filterGrade, 'Tất cả', () => setFilterGrade(0), 'gr-all')}
              {availableGrades.map((g) => chip(filterGrade === g, `Lớp ${g}`, () => setFilterGrade(g), 'g' + g))}
            </div>
          )}

          <div className="qb-filters">
            <span className="qb-filter-label">Độ khó</span>
            {LEVELS.map((l) => chip(filterLevel === l, l || 'Tất cả', () => setFilterLevel(l), l || 'lv-all'))}
          </div>

          {availableTopics.length > 0 && (
            <div className="qb-filters">
              <span className="qb-filter-label">Chuyên đề</span>
              {chip(!filterTopic, 'Tất cả', () => setFilterTopic(''), 'tp-all')}
              {availableTopics.map((t) => chip(filterTopic === t.id, t.name, () => setFilterTopic(t.id), t.id))}
            </div>
          )}

          {hasFilter && (
            <div>
              <button type="button" className="qb-chip" onClick={clearFilters}>
                <IcoClose size={11} /> Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="qb-picker-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="page-loader-spinner" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--mut)' }}>Đang tải ngân hàng...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="qb-empty">
              <IcoLibrary size={36} strokeWidth={1.4} />
              <h3>{list.length === 0 ? 'Ngân hàng trống' : 'Không có câu nào khớp'}</h3>
              <p>
                {list.length === 0
                  ? 'Vào tab "Ngân hàng" để thêm câu hỏi trước, rồi quay lại đây chọn.'
                  : 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.'}
              </p>
              {hasFilter && list.length > 0 && (
                <button type="button" className="vt-btn" onClick={clearFilters}>Xóa bộ lọc</button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem', fontSize: '.82rem' }}>
                <button type="button" className="qb-chip" onClick={pickAll} disabled={selectable.length === 0}>
                  <IcoCheck size={12} /> Chọn tất cả ({selectable.length})
                </button>
                {picked.size > 0 && (
                  <button type="button" className="qb-chip" onClick={() => setPicked(new Set())}>
                    Bỏ chọn tất cả
                  </button>
                )}
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                  <label htmlFor="qb-random-n" style={{ color: 'var(--mut)', fontWeight: 600 }}>Chọn ngẫu nhiên</label>
                  <input
                    id="qb-random-n"
                    type="number"
                    min={1}
                    max={Math.max(1, selectable.length)}
                    value={randomN}
                    onChange={(e) => setRandomN(e.target.value)}
                    style={{ width: 64, padding: '.25rem .4rem', borderRadius: 8, border: '1.5px solid var(--soft)', background: 'var(--panel)', color: 'var(--ink)' }}
                  />
                  <button type="button" className="qb-chip" onClick={pickRandom} disabled={selectable.length === 0}>
                    câu
                  </button>
                </span>
              </div>

              {filtered.map((q) => {
                const used = excluded.has(q.id);
                const on = picked.has(q.id);
                const topic = CHEM_TOPICS.find((t) => t.id === q.topicId);
                return (
                  <div
                    key={q.id}
                    className={'qb-item' + (on ? ' selected' : '')}
                    onClick={() => toggle(q.id)}
                    role="button"
                    tabIndex={used ? -1 : 0}
                    aria-disabled={used}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(q.id);
                      }
                    }}
                    style={{ cursor: used ? 'not-allowed' : 'pointer', opacity: used ? 0.55 : 1 }}
                  >
                    <span className={'qb-item-check' + (on ? ' on' : '')}>
                      {on && <IcoCheck size={14} />}
                    </span>
                    <div className="qb-item-body">
                      <MathText as="p" className="qb-item-q">{q.q}</MathText>
                      <div className="qb-item-opts">
                        {q.options.map((opt, i) => (
                          <span key={i} className={'qb-item-opt' + (i === q.correct ? ' correct' : '')}>
                            <b>{String.fromCharCode(65 + i)}.</b>
                            <MathText>{opt}</MathText>
                          </span>
                        ))}
                      </div>
                      <div className="qb-item-meta">
                        {used && <span className="qb-meta-pill acc">Đã có trong đề</span>}
                        {topic && <span className="qb-meta-pill acc">{topic.name}</span>}
                        {q.level && <span className="qb-meta-pill">{q.level}</span>}
                        {q.usageCount > 0 && <span className="qb-meta-pill">Đã dùng {q.usageCount} lần</span>}
                        {q.tags?.slice(0, 3).map((t) => (
                          <span key={t} className="qb-meta-pill">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="qb-form-foot" style={{ justifyContent: 'space-between' }}>
          <span style={{ font: '600 .82rem var(--sans)', color: 'var(--mut)' }}>
            Đã chọn <b style={{ color: 'var(--acc)' }}>{picked.size}</b> câu
          </span>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button type="button" className="vt-btn" onClick={onClose}>Hủy</button>
            <button
              type="button"
              className="vt-btn primary"
              onClick={handleConfirm}
              disabled={picked.size === 0}
            >
              <IcoCheck size={14} /> Thêm {picked.size > 0 ? `${picked.size} câu` : ''}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
