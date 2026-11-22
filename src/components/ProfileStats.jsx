import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage, useLiveStreak } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { IcoChat, IcoQuiz, IcoFire, IcoNote } from './ProfileIcons.jsx';

/* Đọc số liệu đã đồng bộ theo tài khoản:
   - cs-ai-chats:{uid} / cs-ai-chats: số cuộc trò chuyện AI
   - cs-quiz-stats: { totalCorrect, totalWrong }
   - cs-streak-v2: { n, total, last } (đồng bộ qua useLiveStreak)
   - cs-notes-v1 / cs-notes-local-v2: ghi chú đã tạo
*/
export default function ProfileStats() {
  const { user } = useAuth();
  const uid = user?.uid || '';
  const [chats] = useLocalStorage('cs-ai-chats', []);
  const [quizStats] = useLocalStorage('cs-quiz-stats', { totalCorrect: 0, totalWrong: 0 });
  const { count: streakDays } = useLiveStreak();
  const [notes] = useLocalStorage('cs-notes-v1', []);
  const [notesLocal] = useLocalStorage('cs-notes-local-v2', []);
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const onSync = () => setSyncTick((t) => t + 1);
    window.addEventListener('cs-cloud-sync-update', onSync);
    window.addEventListener('cs-ls', onSync);
    return () => {
      window.removeEventListener('cs-cloud-sync-update', onSync);
      window.removeEventListener('cs-ls', onSync);
    };
  }, []);

  const stats = useMemo(() => {
    let scopedChats = [];
    if (uid && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`cs-ai-chats:${uid}`);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) scopedChats = parsed;
      } catch { /* ignore */ }
    }
    const aiCount = scopedChats.length || (Array.isArray(chats) ? chats.length : 0);
    const quizCount = (quizStats?.totalCorrect || 0) + (quizStats?.totalWrong || 0);
    const noteCount = (Array.isArray(notes) ? notes.length : 0) + (Array.isArray(notesLocal) ? notesLocal.length : 0);
    return [
      { key: 'ai', label: 'Câu hỏi AI', value: aiCount, Ico: IcoChat, color: 'var(--nonmetal)' },
      { key: 'quiz', label: 'Câu Quiz', value: quizCount, Ico: IcoQuiz, color: 'var(--post)' },
      { key: 'streak', label: 'Ngày Streak', value: streakDays, Ico: IcoFire, color: 'var(--alkaline)' },
      { key: 'notes', label: 'Ghi chú', value: noteCount, Ico: IcoNote, color: 'var(--transition)' },
    ];
  }, [uid, chats, quizStats, streakDays, notes, notesLocal, syncTick]);

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
