import { useState } from 'react';

const GAMES = [
  {
    id: 'chicken',
    num: '01',
    title: 'Bắt',
    titleEm: 'gà',
    desc: 'Năm chú gà chạy quanh sân cỏ, mỗi con cầm một tấm biển đáp án. Click con gà có đáp án đúng — combo càng cao, điểm càng lớn.',
    route: '#games/chicken',
    tag: 'Phản xạ · 5–10 phút',
    color: 'var(--post)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 18c0-3 2-5 5-5h4c3 0 5 2 5 5v2H5v-2z"/>
        <circle cx="12" cy="7" r="4"/>
        <path d="M15 5l3 1-3 1M9 7h.01M15 7h.01"/>
      </svg>
    ),
    steps: [
      'Câu hỏi hiện trên đầu sân đấu.',
      'Mỗi chú gà cầm 1 tấm biển đáp án.',
      'Click con gà có đáp án đúng.',
      'Đúng = +điểm +combo, sai = mất 1 mạng.',
      'Hết 3 mạng là thua.',
    ],
    hotkeys: [
      ['1', '2', '3', '4', '5', '6'],
      'Chọn gà theo thứ tự từ trái sang phải',
    ],
  },
  {
    id: 'slingshot',
    num: '02',
    title: 'Bắn',
    titleEm: 'súng',
    desc: 'Nạp lực, ngắm bia đáp án, bắn đạn parabol. Trúng bia đúng = nổ, +điểm. Càng xa càng nhiều điểm.',
    route: '#games/slingshot',
    tag: 'Vật lý · 10–15 phút',
    color: 'var(--nonmetal)',
    comingSoon: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>
      </svg>
    ),
    steps: [
      'Giữ chuột để nạp lực.',
      'Kéo xuống để ngắm góc bắn.',
      'Thả chuột để bắn đạn parabol.',
      'Đạn trúng bia đúng = +điểm.',
      'Trúng bia sai = -1 mạng.',
    ],
  },
  {
    id: 'jeopardy',
    num: '03',
    title: 'Chọn ô',
    titleEm: 'may mắn',
    desc: 'Lưới ô điểm 100–500 chia theo chủ đề. Chia đội thi đấu. Có ô nhân đôi, ô mất lượt, ô cướp điểm.',
    route: '#games/jeopardy',
    tag: 'Đội nhóm · 15–25 phút',
    color: 'var(--alkaline)',
    comingSoon: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    steps: [
      'Chọn 1 ô trên lưới để mở câu hỏi.',
      'Đội trả lời đúng = +điểm ô đó.',
      'Ô "×2" = nhân đôi điểm.',
      'Ô "Mất lượt" = chuyển lượt ngay.',
      'Hết ô = tổng kết, đội nào nhiều điểm thắng.',
    ],
  },
];

export default function GameHub() {
  const [guideOpen, setGuideOpen] = useState(null);

  const toggleGuide = (id) => {
    setGuideOpen((g) => (g === id ? null : id));
  };

  return (
    <section className="wrap games-hub">
      <header className="games-hub-head">
        <p className="slogan">Trò chơi cho lớp học</p>
        <h1 className="games-hub-title">
          Ba trò chơi <em>tương tác</em>
        </h1>
        <p className="lead games-hub-lead">
          Giáo viên tự nhập câu hỏi theo bài giảng. Không tài khoản, không cài đặt — chỉ cần máy chiếu.
        </p>
      </header>

      {/* Grid 3 game */}
      <div className="games-grid">
        {GAMES.map((g) => {
          let qCount = 0;
          try {
            const raw = localStorage.getItem(`cs-game:${g.id}:questions`);
            if (raw) qCount = JSON.parse(raw).length;
          } catch {}

          const isComing = g.comingSoon;

          return (
            <article
              key={g.id}
              className={'game-card-v2' + (isComing ? ' coming' : '')}
              style={{ '--gc': g.color }}
            >
              {/* Header: số + icon */}
              <div className="gc-head">
                <span className="gc-num">{g.num}</span>
                <span className="gc-icon">{g.icon}</span>
              </div>

              {/* Title */}
              <h3 className="gc-title">
                {g.title} <em>{g.titleEm}</em>
              </h3>

              {/* Desc */}
              <p className="gc-desc">{g.desc}</p>

              {/* Meta */}
              <div className="gc-meta">
                <span className="gc-tag">{g.tag}</span>
                {!isComing && qCount > 0 && (
                  <span className="gc-badge">{qCount} câu hỏi</span>
                )}
                {isComing && <span className="gc-badge gc-badge-soon">Sắp ra mắt</span>}
              </div>

              {/* Actions */}
              <div className="gc-actions">
                {!isComing ? (
                  <>
                    <a className="btn primary gc-play" href={g.route}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '.4rem' }}>
                        <polygon points="6 4 20 12 6 20" />
                      </svg>
                      Chơi ngay
                    </a>
                    <button
                      className="btn gc-guide-btn"
                      onClick={() => toggleGuide(g.id)}
                      type="button"
                    >
                      {guideOpen === g.id ? 'Đóng' : 'Hướng dẫn'}
                    </button>
                  </>
                ) : (
                  <button className="btn gc-play disabled" disabled type="button">
                    Sắp có
                  </button>
                )}
              </div>

              {/* Hướng dẫn mở rộng */}
              {!isComing && guideOpen === g.id && (
                <div className="gc-guide">
                  <h4 className="gc-guide-title">Cách chơi</h4>
                  <ol className="gc-guide-list">
                    {g.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>

                  {g.hotkeys && (
                    <div className="gc-hotkeys">
                      <div className="gc-hotkeys-keys">
                        {g.hotkeys[0].map((k) => (
                          <kbd key={k}>{k}</kbd>
                        ))}
                      </div>
                      <span className="gc-hotkeys-label">{g.hotkeys[1]}</span>
                    </div>
                  )}

                  <a className="btn primary gc-play-inline" href={g.route}>
                    Bắt đầu chơi →
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Hướng dẫn cho giáo viên */}
      <section className="games-teacher-guide">
        <h2 className="section-title">Hướng dẫn cho <em>giáo viên</em></h2>
        <div className="teacher-steps">
          <div className="teacher-step">
            <span className="teacher-step-num">01</span>
            <h4>Chọn game</h4>
            <p>Bấm "Chơi ngay" trên card muốn dùng.</p>
          </div>
          <div className="teacher-step">
            <span className="teacher-step-num">02</span>
            <h4>Nhập câu hỏi</h4>
            <p>Tab "Cài đặt & Câu hỏi" → sửa trực tiếp hoặc "Tải mẫu".</p>
          </div>
          <div className="teacher-step">
            <span className="teacher-step-num">03</span>
            <h4>Chỉnh tốc độ</h4>
            <p>Chọn tốc độ, số gà, thời gian phù hợp với lớp.</p>
          </div>
          <div className="teacher-step">
            <span className="teacher-step-num">04</span>
            <h4>Chiếu & chơi</h4>
            <p>Bấm "Bắt đầu chơi" → chiếu lên máy chiếu cho cả lớp.</p>
          </div>
        </div>
      </section>
    </section>
  );
} 