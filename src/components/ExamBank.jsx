import { useEffect, useState, useCallback } from 'react';
import { fetchExams, fetchGrades, fetchSubjects } from '../lib/examApi.js';
import './exam-bank.css';

const PAGE_SIZE = 12;

const EXAM_TYPES = [
  { id: 'giua_ky', name: 'Giữa kỳ' },
  { id: 'cuoi_ky', name: 'Cuối kỳ' },
  { id: 'thpt', name: 'THPT Quốc gia' },
  { id: 'chuyen_de', name: 'Chuyên đề' },
  { id: 'khao_sat', name: 'Khảo sát' },
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Dễ', tone: 'easy' },
  { id: 'medium', name: 'Trung bình', tone: 'medium' },
  { id: 'hard', name: 'Khó', tone: 'hard' },
  { id: 'extreme', name: 'Rất khó', tone: 'extreme' },
];

export default function ExamBank({ query = '', grade: gProp }) {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    gradeId: null, subjectId: null, examType: null,
    difficulty: null, search: '', sort: 'newest',
  });
  useEffect(() => {
    Promise.all([fetchGrades(), fetchSubjects()])
      .then(([g, s]) => { setGrades(g); setSubjects(s); })
      .catch((e) => { console.error(e); setError('Không tải được danh mục'); });
  }, []);
  useEffect(() => {
    if (gProp && grades.length) {
      const g = grades.find((x) => x.name === `Lớp ${gProp}`);
      if (g) setFilters((f) => ({ ...f, gradeId: g.id }));
    } else if (gProp === 'all') {
      setFilters((f) => ({ ...f, gradeId: null }));
    }
  }, [gProp, grades]);
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: query }));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);
  const loadExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchExams({ ...filters, page, pageSize: PAGE_SIZE });
      setExams(res.data);
      setTotal(res.count);
    } catch (e) {
      console.error(e);
      setError('Không tải được đề thi. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { loadExams(); }, [loadExams]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      gradeId: null, subjectId: null, examType: null,
      difficulty: null, search: '', sort: 'newest',
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="eb">
      <FilterRow
        label="Lớp"
        value={filters.gradeId}
        onChange={(v) => updateFilter('gradeId', v)}
        options={[{ id: null, name: 'Tất cả' }, ...grades.map((g) => ({ id: g.id, name: g.name }))]}
      />

      <FilterRow
        label="Môn"
        value={filters.subjectId}
        onChange={(v) => updateFilter('subjectId', v)}
        options={[{ id: null, name: 'Tất cả' }, ...subjects.map((s) => ({ id: s.id, name: s.name }))]}
      />

      <FilterRow
        label="Loại đề"
        value={filters.examType}
        onChange={(v) => updateFilter('examType', v)}
        options={[{ id: null, name: 'Tất cả' }, ...EXAM_TYPES]}
      />

      <FilterRow
        label="Độ khó"
        value={filters.difficulty}
        onChange={(v) => updateFilter('difficulty', v)}
        options={[{ id: null, name: 'Tất cả' }, ...DIFFICULTIES]}
      />

      <div className="eb-toolbar">
        <p className="eb-count">
          Hiển thị <b>{exams.length}</b> / <b>{total}</b> đề thi
        </p>
        <div className="eb-toolbar-actions">
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="eb-select"
          >
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="eb-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="eb-card eb-skeleton">
              <div className="eb-skeleton-line" />
              <div className="eb-skeleton-line short" />
              <div className="eb-skeleton-line" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="eb-empty">
          <p>{error}</p>
          <button onClick={loadExams}>Thử lại</button>
        </div>
      )}

      {!loading && !error && exams.length === 0 && (
        <div className="eb-empty">
          <p>Không tìm thấy đề thi nào phù hợp.</p>
          <button onClick={clearFilters}>Xóa bộ lọc</button>
        </div>
      )}

      {!loading && !error && exams.length > 0 && (
        <div className="eb-grid">
          {exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="eb-pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ‹ Trước
          </button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Sau ›
          </button>
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, value, onChange, options }) {
  return (
    <div className="eb-filter-row">
      <span className="eb-filter-label">{label}</span>
      <div className="eb-chips">
        {options.map((o) => (
          <button
            key={String(o.id)}
            className={'eb-chip' + (value === o.id ? ' on' : '')}
            onClick={() => onChange(o.id)}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExamCard({ exam }) {
  const type = EXAM_TYPES.find((t) => t.id === exam.exam_type);
  const diff = DIFFICULTIES.find((d) => d.id === exam.difficulty);

  return (
    <article className="eb-card">
      <div className="eb-card-head">
        <div className="eb-card-badges">
          {type && <span className="eb-badge type">{type.name}</span>}
          {diff && <span className={'eb-badge diff tone-' + diff.tone}>{diff.name}</span>}
        </div>
      </div>

      <h3 className="eb-card-title">{exam.title}</h3>

      <div className="eb-card-meta">
        {exam.subject && <span>{exam.subject.name}</span>}
        {exam.grade && <span>{exam.grade.name}</span>}
        <span>{exam.duration} phút</span>
        {exam.source && <span>{exam.source}</span>}
      </div>

      <div className="eb-card-stats">
        <div>
          <b>{(exam.attempt_count || 0).toLocaleString('vi-VN')}</b>
          <small>lượt làm</small>
        </div>
      </div>

      <div className="eb-card-actions">
        <a className="eb-btn primary" href={`#exam/${exam.id}`}>
          Vào làm bài
        </a>
      </div>
    </article>
  );
}