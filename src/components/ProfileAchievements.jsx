import { useMemo } from 'react';
import { useLocalStorage } from '../hooks.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { IcoStar, IcoFire, IcoFlask, IcoCrown } from './ProfileIcons.jsx';

/* Định nghĩa thành tích */
const ACHIEVEMENTS_DEF = [
  {
    id: 'newbie',
    title: 'Người mới',
    desc: 'Đăng ký tài khoản thành công',
    Ico: IcoStar,
    color: 'var(--nonmetal)',
    check: ({ user }) => !!user,
  },
  {
    id: 'diligent',
    title: 'Học sinh chăm chỉ',
    desc: 'Đạt 7 ngày streak liên tiếp',
    Ico: IcoFire,
    color: 'var(--alkaline)',
    check: ({ streak }) => (streak?.n || 0) >= 7,
  },
  {
    id: 'chemist',
    title: 'Nhà Hóa học',
    desc: 'Hoàn thành 100 câu quiz',
    Ico: IcoFlask,
    color: 'var(--post)',
    check: ({ quizStats }) => ((quizStats?.totalCorrect || 0) + (quizStats?.totalWrong || 0)) >= 100,
  },
  {
    id: 'vip',
    title: 'VIP',
    desc: 'Nâng cấp lên gói CUAI VIP',
    Ico: IcoCrown,
    color: 'var(--transition)',
    check: ({ tier }) => tier?.key === 'vip',
  },
];

export default function ProfileAchievements() {
  const { user, tier } = useAuth();
  const [streak] = useLocalStorage('cs-streak-v2', { n: 0, total: 0, last: '' });
  const [quizStats] = useLocalStorage('cs-quiz-stats', { totalCorrect: 0, totalWrong: 0 });
  const [unlocked] = useLocalStorage('cs-achievements', []);

  const ctx = { user, tier, streak, quizStats };

  const list = useMemo(() => {
    return ACHIEVEMENTS_DEF.map((a) => {
      // Thành tích mở nếu: có trong list unlocked HOẶC check() trả về true
      const isUnlocked = unlocked.includes(a.id) || a.check(ctx);
      return { ...a, isUnlocked };
    });
  }, [user, tier, streak, quizStats, unlocked]);

  const unlockedCount = list.filter((a) => a.isUnlocked).length;

  return (
    <div className="pf-ach-section">
      <div className="pf-ach-head">
        <h3 className="pf-ach-title">Huy hiệu thành tích</h3>
        <span className="pf-ach-count">
          {unlockedCount}/{list.length}
        </span>
      </div>
      <div className="pf-ach-grid">
        {list.map(({ id, title, desc, Ico, color, isUnlocked }) => (
          <div
            key={id}
            className={'pf-ach-card' + (isUnlocked ? ' unlocked' : '')}
            title={desc}
          >
            <div
              className="pf-ach-icon"
              style={{
                background: isUnlocked ? color : 'var(--soft)',
                color: isUnlocked ? '#111' : 'var(--mut)',
              }}
            >
              <Ico size={24} />
            </div>
            <div className="pf-ach-info">
              <b>{title}</b>
              <small>{desc}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}