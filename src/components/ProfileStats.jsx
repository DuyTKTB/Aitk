import { useMemo } from 'react';
import { useLocalStorage } from '../hooks.js';
import { IcoChat, IcoQuiz, IcoFire, IcoNote } from './ProfileIcons.jsx';

/* Đọc số liệu từ localStorage:
   - cs-ai-chats: số cuộc trò chuyện AI
   - cs-quiz-stats: { totalCorrect, totalWrong }
   - cs-streak-v2: { n, total, last }
   - cs-notes-v1: mảng ghi chú
*/
export default function ProfileStats() {
  const [chats] = useLocalStorage('cs-ai-chats', []);
  const [quizStats] = useLocalStorage('cs-quiz-stats', { totalCorrect: 0, totalWrong: 0 });
  const [streak] = useLocalStorage('cs-streak-v2', { n: 0, total: 0, last: '' });
  const [notes] = useLocalStorage('cs-notes-v1', []);

  const stats = useMemo(() => {
    const aiCount = Array.isArray(chats) ? chats.length : 0;
    const quizCount = (quizStats?.totalCorrect || 0) + (quizStats?.totalWrong || 0);
    const streakDays = streak?.n || 0;
    const noteCount = Array.isArray(notes) ? notes.length : 0;
    return [
      { key: 'ai', label: 'Câu hỏi AI', value: aiCount, Ico: IcoChat, color: 'var(--nonmetal)' },
      { key: 'quiz', label: 'Câu Quiz', value: quizCount, Ico: IcoQuiz, color: 'var(--post)' },
      { key: 'streak', label: 'Ngày Streak', value: streakDays, Ico: IcoFire, color: 'var(--alkaline)' },
      { key: 'notes', label: 'Ghi chú', value: noteCount, Ico: IcoNote, color: 'var(--transition)' },
    ];
  }, [chats, quizStats, streak, notes]);

  return (
    <div className="pf-stats-grid">
      {stats.map(({ key, label, value, Ico, color }) => (
        <div key={key} className="pf-stat-card">
          <div className="pf-stat-icon" style={{ background: color }}>
            <Ico size={20} />
          </div>
          <div className="pf-stat-value">{value}</div>
          <div className="pf-stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}