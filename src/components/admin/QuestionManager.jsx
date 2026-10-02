import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { IconSearch, IconQuestion } from './AdminIcons.jsx';

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('questions')
          .select(`
            id, content, question_type, difficulty, created_at,
            exam:exams(id, title, subject:subjects(name), grade:grades(name)),
            answers:answers(id, label, content, is_correct)
          `)
          .order('created_at', { ascending: false })
          .limit(200);

        setQuestions(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search.trim()
    ? questions.filter((q) => {
        const hay = `${q.content} ${q.exam?.title || ''}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      })
    : questions;

  if (loading) return <div className="adl-loading">Đang tải câu hỏi…</div>;

  return (
    <div className="adl-panel">
      <header className="adl-panel-head">
        <h3>
          <IconQuestion size={16} />
          <span>Ngân hàng câu hỏi ({filtered.length})</span>
        </h3>
        <label className="adl-search">
          <IconSearch size={14} />
          <input
            type="search"
            placeholder="Tìm câu hỏi…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </header>

      {filtered.length === 0 ? (
        <p className="adl-empty">Chưa có câu hỏi nào</p>
      ) : (
        <ul className="adl-qlist">
          {filtered.map((q) => (
            <li key={q.id} className="adl-qitem">
              <div className="adl-qitem-head">
                <span className={'adl-qdiff d-' + (q.difficulty || 'medium')}>
                  {q.difficulty || 'medium'}
                </span>
                <small>{q.exam?.title || 'Không rõ đề'}</small>
              </div>
              <p className="adl-qtext">{q.content}</p>
              {q.answers?.length > 0 && (
                <ul className="adl-qanswers">
                  {q.answers
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((a) => (
                      <li key={a.id} className={a.is_correct ? 'ok' : ''}>
                        <b>{a.label}.</b> {a.content}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}