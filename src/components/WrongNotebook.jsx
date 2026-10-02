import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { markMastered, unsaveQuestion, saveQuestion } from '../lib/examApi.js';

export default function WrongNotebook() {
  const { user } = useAuth();
  const [wrongQs, setWrongQs] = useState([]);
  const [savedQs, setSavedQs] = useState([]);
  const [tab, setTab] = useState('wrong'); // 'wrong' | 'saved'
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const uid = user?.uid || user?.id;

  const load = async () => {
    if (!uid) return;
    try {
      setLoading(true);

      const [wrongRes, savedRes] = await Promise.all([
        supabase
          .from('wrong_questions')
          .select(`
            id, wrong_count, mastered, last_wrong_at,
            question:questions(
              id, question_number, content, explanation, difficulty,
              answers:answers(id, label, content, is_correct)
            )
          `)
          .eq('user_id', uid)
          .eq('mastered', false)
          .order('last_wrong_at', { ascending: false }),

        supabase
          .from('saved_questions')
          .select(`
            id, note, saved_at,
            question:questions(
              id, question_number, content, explanation, difficulty,
              answers:answers(id, label, content, is_correct)
            )
          `)
          .eq('user_id', uid)
          .order('saved_at', { ascending: false }),
      ]);

      setWrongQs(wrongRes.data || []);
      setSavedQs(savedRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [uid]);

  const handleMastered = async (questionId) => {
    try {
      await markMastered(uid, questionId);
      setWrongQs((qs) => qs.filter((q) => q.question.id !== questionId));
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleUnsave = async (questionId) => {
    try {
      await unsaveQuestion(uid, questionId);
      setSavedQs((qs) => qs.filter((q) => q.question.id !== questionId));
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  const handleSave = async (questionId) => {
    try {
      await saveQuestion(uid, questionId);
      alert('✅ Đã lưu vào sổ tay');
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  };

  if (loading) return <div className="wn-loading">Đang tải sổ tay…</div>;

  const list = tab === 'wrong' ? wrongQs : savedQs;

  return (
    <div className="wn">
      <header className="wn-head">
        <h1>Sổ tay của tôi</h1>
        <p className="wn-sub">Ôn lại câu sai và câu đã lưu để nhớ lâu hơn</p>
      </header>

      <nav className="wn-tabs">
        <button
          className={'wn-tab' + (tab === 'wrong' ? ' on' : '')}
          onClick={() => setTab('wrong')}
        >
          📕 Câu sai ({wrongQs.length})
        </button>
        <button
          className={'wn-tab' + (tab === 'saved' ? ' on' : '')}
          onClick={() => setTab('saved')}
        >
          ⭐ Đã lưu ({savedQs.length})
        </button>
      </nav>

      {list.length === 0 ? (
        <div className="wn-empty">
          <p>
            {tab === 'wrong'
              ? 'Chưa có câu sai nào. Làm bài để ghi lại câu sai!'
              : 'Chưa có câu nào được lưu. Bấm ☆ trên câu hỏi để lưu.'}
          </p>
        </div>
      ) : (
        <ul className="wn-list">
          {list.map((item) => {
            const q = item.question;
            const isOpen = expanded === item.id;
            const correctAnswer = q.answers?.find((a) => a.is_correct);

            return (
              <li key={item.id} className={'wn-card' + (isOpen ? ' open' : '')}>
                <button
                  className="wn-card-head"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                >
                  <div className="wn-card-meta">
                    {tab === 'wrong' && (
                      <span className="wn-badge wrong">
                        ❌ Sai {item.wrong_count} lần
                      </span>
                    )}
                    {tab === 'saved' && (
                      <span className="wn-badge saved">⭐ Đã lưu</span>
                    )}
                    {q.difficulty && (
                      <span className={'wn-badge diff-' + q.difficulty}>
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                  <p className="wn-card-content">{q.content}</p>
                  <span className="wn-arrow">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="wn-card-body">
                    <div className="wn-answers">
                      {q.answers?.map((a) => (
                        <div
                          key={a.id}
                          className={'wn-answer' + (a.is_correct ? ' correct' : '')}
                        >
                          <b>{a.label}.</b> {a.content}
                          {a.is_correct && <span className="wn-check">✓</span>}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="wn-explain">
                        <b>💡 Lời giải:</b>
                        <p>{q.explanation}</p>
                      </div>
                    )}

                    <div className="wn-actions">
                      {tab === 'wrong' && (
                        <button
                          className="wn-btn primary"
                          onClick={() => handleMastered(q.id)}
                        >
                          ✓ Đã hiểu
                        </button>
                      )}
                      {tab === 'saved' && (
                        <button
                          className="wn-btn"
                          onClick={() => handleUnsave(q.id)}
                        >
                          🗑 Bỏ lưu
                        </button>
                      )}
                      {tab === 'wrong' && (
                        <button
                          className="wn-btn"
                          onClick={() => handleSave(q.id)}
                        >
                          ⭐ Lưu vào sổ
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}