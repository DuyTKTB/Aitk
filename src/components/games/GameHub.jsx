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

  // ============ 3 GAME MỚI — PHẢI NẰM TRONG MẢNG NÀY ============
  {
    id: 'lab',
    num: '04',
    title: 'Phòng thí nghiệm',
    titleEm: 'ảo',
    desc: 'Kéo hóa chất vào bàn, bấm "Trộn" để xem phản ứng. Khám phá 12+ phản ứng, hoàn thành nhiệm vụ.',
    route: '#games/lab',
    tag: 'Thí nghiệm · 10–15 phút',
    color: 'var(--metalloid)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/>
        <circle cx="12" cy="15" r="1" fill="currentColor"/>
        <circle cx="10" cy="17" r="1" fill="currentColor"/>
      </svg>
    ),
    steps: [
      'Chọn nhiệm vụ hoặc thí nghiệm tự do.',
      'Click hóa chất trong kho để thêm vào bàn.',
      'Bấm "TRỘN" để xem phản ứng.',
      'Phản ứng đúng = +điểm +khám phá.',
      'Hoàn thành 8 nhiệm vụ để đạt điểm tối đa.',
    ],
  },
  {
    id: 'battle',
    num: '05',
    title: 'Đấu trường',
    titleEm: 'nguyên tố',
    desc: 'Chọn nguyên tố, trả lời câu hỏi hóa học để tấn công. Type advantage ảnh hưởng sát thương.',
    route: '#games/battle',
    tag: 'Chiến thuật · 10–15 phút',
    color: 'var(--alkali)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 3.5l6 6-11 11-6-6z"/>
        <path d="M3 21l3-3M14 7l3 3"/>
      </svg>
    ),
    steps: [
      'Chọn nguyên tố đại diện (P1).',
      'AI hoặc P2 chọn nguyên tố đối thủ.',
      'Mỗi lượt chọn đòn tấn công.',
      'Trả lời câu hỏi đúng để đòn đánh có hiệu lực.',
      'Type advantage: 1.5x rất mạnh, 0.5x yếu.',
      'HP về 0 = thua.',
    ],
  },
  {
    id: 'sudoku',
    num: '06',
    title: 'Sudoku',
    titleEm: 'hóa học',
    desc: 'Điền 9 nguyên tố vào lưới 9×9. Không trùng hàng, cột, ô 3×3. Có 3 độ khó và gợi ý.',
    route: '#games/sudoku',
    tag: 'Logic · 5–20 phút',
    color: 'var(--transition)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1"/>
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
      </svg>
    ),
    steps: [
      'Mỗi hàng ngang có đủ 9 nguyên tố.',
      'Mỗi cột dọc có đủ 9 nguyên tố.',
      'Mỗi ô 3×3 có đủ 9 nguyên tố.',
      'Dùng phím 1-9 hoặc click pad để điền.',
      'Bật "Ghi chú" để đánh dấu các số có thể.',
      'Dùng "Gợi ý" khi bí (bị trừ điểm).',
    ],
  },
  // ============ HẾT 3 GAME MỚI ============
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
          Sáu trò chơi <em>tương tác</em>
        </h1>
        <p className="lead games-hub-lead">
          Giáo viên tự nhập câu hỏi theo bài giảng. Không tài khoản, không cài đặt — chỉ cần máy chiếu.
        </p>
      </header>

      {/* Grid games */}
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
              <div className="gc-head">
                <span className="gc-num">{g.num}</span>
                <span className="gc-icon">{g.icon}</span>
              </div>

              <h3 className="gc-title">
                {g.title} <em>{g.titleEm}</em>
              </h3>

              <p className="gc-desc">{g.desc}</p>

              <div className="gc-meta">
                <span className="gc-tag">{g.tag}</span>
                {!isComing && qCount > 0 && (
                  <span className="gc-badge">{qCount} câu hỏi</span>
                )}
                {isComing && <span className="gc-badge gc-badge-soon">Sắp ra mắt</span>}
              </div>

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