import { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { isAdmin } from '../../lib/isAdmin.js';
import { CAMERA_GAMES } from '../../lib/cameraGames.js';
import { CAMERA_ICONS } from '../../lib/cameraIcons.jsx';
import GameStudioSettingsModal from './GameStudioSettingsModal.jsx';

const GAMES = [
  /* 5 GAME MỚI PHONG CÁCH GIAOVIENDOIMOI.COM & APPLE HIG */
  {
    id: 'tugofwar',
    num: '01',
    category: 'team',
    badge: 'MỚI · ĐỐI KHÁNG',
    title: 'Kéo co',
    titleEm: 'tri thức',
    desc: 'Hai đội Red & Blue tranh tài trên màn hình máy chiếu. Trả lời đúng kéo dây thừng về phía đội mình. Kéo đổ đối thủ để giành cúp vô địch!',
    route: '#games/tugofwar',
    tag: 'Đồng đội · 10–15 phút',
    color: '#ef4444',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16M12 9v6M7 7l-3 5 3 5M17 7l3 5-3 5" />
      </svg>
    ),
    steps: [
      'Chia lớp thành 2 đội: Đội Đỏ và Đội Xanh.',
      'Mỗi lượt một đội bốc câu hỏi từ ngân hàng.',
      'Trả lời đúng trong thời gian quy định = kéo dây 1 nấc về phía mình.',
      'Trả lời sai = không được kéo, mất quyền ưu tiên.',
      'Kéo lệch 4 nấc về phía đội nào = đội đó vô địch!',
    ],
    hotkeys: [['1', '2', '3', '4'], 'Chọn đáp án A - B - C - D nhanh bằng phím số'],
  },
  {
    id: 'wheel',
    num: '02',
    category: 'gameshow',
    badge: 'MỚI · SÔI ĐỘNG',
    title: 'Vòng quay',
    titleEm: 'may mắn',
    desc: 'Vòng quay kim loại đa sắc phong cách visionOS. Quay số ngẫu nhiên gọi học sinh lên bảng hoặc quay bốc điểm thưởng, quà tặng & câu hỏi thử thách.',
    route: '#games/wheel',
    tag: 'May mắn · 5–10 phút',
    color: '#38bdf8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
    steps: [
      'Chọn chế độ "Thử thách & Quà tặng" hoặc "Gọi tên học sinh".',
      'Bấm "QUAY NGAY" để khởi động vòng xoay cơ học với âm thanh tích tắc sinh động.',
      'Kim chỉ dừng ở ô nào thì áp dụng hiệu ứng ô đó (+Điểm, Hộp quà, Câu hỏi, Mất lượt).',
      'Giáo viên có thể sửa danh sách học sinh theo lớp tùy ý.',
    ],
  },
  {
    id: 'flip',
    num: '03',
    category: 'gameshow',
    badge: 'MỚI · KHỞI ĐỘNG',
    title: 'Lật mảnh ghép',
    titleEm: 'bí mật',
    desc: 'Lưới 9 mảnh ghép 3D che giấu bức tranh bí mật (Mendeleev, phản ứng nổ Na, benzen...). Trả lời đúng mở từng mảnh hoặc bấm "Đoán từ khóa" để thắng lớn!',
    route: '#games/flip',
    tag: 'Khám phá · 10–15 phút',
    color: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    steps: [
      'Click vào bất kỳ mảnh ghép nào (1 đến 9) để nhận câu hỏi.',
      'Trả lời đúng câu hỏi = mảnh ghép lật 3D để lộ một góc bức tranh bí mật bên dưới.',
      'Bất kỳ lúc nào, học sinh có thể bấm "ĐOÁN TỪ KHÓA BÍ MẬT".',
      'Đoán đúng từ khóa sớm = nhận điểm thưởng khổng lồ!',
    ],
  },
  {
    id: 'millionaire',
    num: '04',
    category: 'gameshow',
    badge: 'MỚI · GAMESHOW',
    title: 'Ai là',
    titleEm: 'triệu phú',
    desc: 'Gameshow truyền hình kinh điển với 15 mốc câu hỏi hóa học cân não. Thang tiền thưởng 150 triệu, 3 quyền trợ giúp: 50:50, Hỏi ELEC AI và Ý kiến cả lớp!',
    route: '#games/millionaire',
    tag: 'Gameshow · 15–20 phút',
    color: '#eab308',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" />
      </svg>
    ),
    steps: [
      'Trả lời lần lượt 15 câu hỏi trắc nghiệm từ dễ đến khó.',
      'Có 3 mốc quan trọng an toàn: Câu 5, Câu 10 và Câu 15.',
      'Sử dụng 3 quyền trợ giúp thông minh: 50:50, Trợ lý ELEC AI, Khán giả trường quay.',
      'Bấm "Chốt đáp án" để xác nhận lựa chọn của bạn.',
    ],
  },
  {
    id: 'racing',
    num: '05',
    category: 'team',
    badge: 'MỚI · TỐC ĐỘ',
    title: 'Đua xe',
    titleEm: 'tri thức',
    desc: 'Grand Prix 2 đến 4 làn đua tốc độ. Mỗi câu trả lời đúng sẽ kích hoạt Turbo Nitro phóng vút 25% đường đua. Đội nào cán đích 100% trước sẽ vô địch!',
    route: '#games/racing',
    tag: 'Tốc độ · 10–15 phút',
    color: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
        <path d="M5 17h-2v-4l3-5h7l4 5h4v4h-2" />
      </svg>
    ),
    steps: [
      'Chọn số đội đua (2, 3 hoặc 4 đội).',
      'Mỗi đội nhận câu hỏi theo lượt.',
      'Trả lời đúng = Kích hoạt Nitro xe tăng tốc +25% tiến về đích.',
      'Trả lời sai = Xe đứng yên, chuyển lượt cho đội đối thủ.',
      'Đội đầu tiên cán đích 100% giành cúp vô địch cuộc đua!',
    ],
  },

  /* 6 GAME HIỆN CÓ ĐƯỢC CHUẨN HÓA VÀ NÂNG CẤP */
  {
    id: 'chicken',
    num: '06',
    category: 'practice',
    badge: 'PHẢN XẠ',
    title: 'Bắt',
    titleEm: 'gà',
    desc: 'Những chú gà chạy quanh sân cỏ cầm biển đáp án. Bắt đúng gà mang đáp án chuẩn — combo càng cao, điểm càng bùng nổ.',
    route: '#games/chicken',
    tag: 'Phản xạ · 5–10 phút',
    color: 'var(--post)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 18c0-3 2-5 5-5h4c3 0 5 2 5 5v2H5v-2z" />
        <circle cx="12" cy="7" r="4" />
        <path d="M15 5l3 1-3 1M9 7h.01M15 7h.01" />
      </svg>
    ),
    steps: [
      'Câu hỏi hiện trên đầu sân đấu.',
      'Mỗi chú gà cầm 1 tấm biển đáp án.',
      'Click con gà có đáp án đúng.',
      'Đúng = +điểm +combo, sai = mất 1 mạng.',
      'Hết 3 mạng là thua.',
    ],
    hotkeys: [['1', '2', '3', '4', '5'], 'Chọn gà theo thứ tự từ trái sang phải'],
  },
  {
    id: 'slingshot',
    num: '07',
    category: 'practice',
    badge: 'VẬT LÝ',
    title: 'Bắn',
    titleEm: 'súng',
    desc: 'Nạp lực, ngắm bia đáp án, bắn đạn parabol. Trúng bia đúng = nổ hoa lửa, +điểm. Càng xa càng nhiều điểm.',
    route: '#games/slingshot',
    tag: 'Vật lý · 10–15 phút',
    color: 'var(--nonmetal)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
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
    num: '08',
    category: 'team',
    badge: 'ĐỒNG ĐỘI',
    title: 'Chọn ô',
    titleEm: 'may mắn',
    desc: 'Lưới ô điểm 100–500 chia theo chủ đề hóa học. Chia đội thi đấu đối kháng, có ô nhân đôi, ô mất lượt, ô cướp điểm.',
    route: '#games/jeopardy',
    tag: 'Đội nhóm · 15–25 phút',
    color: 'var(--alkaline)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    steps: [
      'Chọn 1 ô trên lưới để mở câu hỏi.',
      'Đội trả lời đúng = +điểm ô đó.',
      'Ô "×2" = nhân đôi điểm thưởng.',
      'Ô "Mất lượt" = chuyển lượt ngay cho đội bạn.',
      'Hết ô = tổng kết, đội nào nhiều điểm thắng.',
    ],
  },
  {
    id: 'lab',
    num: '09',
    category: 'practice',
    badge: 'THÍ NGHIỆM',
    title: 'Phòng thí nghiệm',
    titleEm: 'ảo',
    desc: 'Kéo hóa chất vào bàn thí nghiệm, bấm "Trộn" để quan sát phản ứng trực quan. Khám phá 12+ phản ứng thú vị.',
    route: '#games/lab',
    tag: 'Thí nghiệm · 10–15 phút',
    color: 'var(--metalloid)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
        <circle cx="12" cy="15" r="1" fill="currentColor" />
        <circle cx="10" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
    steps: [
      'Chọn nhiệm vụ hoặc thí nghiệm tự do.',
      'Click hóa chất trong kho để thêm vào bàn.',
      'Bấm "TRỘN" để xem phản ứng hóa học diễn ra.',
      'Phản ứng đúng = +điểm +khám phá sổ tay.',
      'Hoàn thành 8 nhiệm vụ để đạt điểm tối đa.',
    ],
  },
  {
    id: 'battle',
    num: '10',
    category: 'practice',
    badge: 'CHIẾN THUẬT',
    title: 'Đấu trường',
    titleEm: 'nguyên tố',
    desc: 'Chọn nguyên tố đại diện, trả lời câu hỏi hóa học để tung chiêu tấn công. Tương khắc nguyên tố nhân hệ số sát thương.',
    route: '#games/battle',
    tag: 'Chiến thuật · 10–15 phút',
    color: 'var(--alkali)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 3.5l6 6-11 11-6-6z" />
        <path d="M3 21l3-3M14 7l3 3" />
      </svg>
    ),
    steps: [
      'Chọn nguyên tố đại diện (P1).',
      'AI hoặc P2 chọn nguyên tố đối thủ.',
      'Mỗi lượt chọn đòn tấn công nguyên tố.',
      'Trả lời câu hỏi đúng để đòn đánh có hiệu lực.',
      'Tương khắc thuộc tính: 1.5x rất mạnh, 0.5x yếu.',
      'HP đối thủ về 0 = chiến thắng.',
    ],
  },
  {
    id: 'sudoku',
    num: '11',
    category: 'practice',
    badge: 'LOGIC',
    title: 'Sudoku',
    titleEm: 'hóa học',
    desc: 'Điền 9 ký hiệu nguyên tố vào ma trận 9×9. Không trùng hàng, cột, khối 3×3. Rèn luyện tư duy logic đỉnh cao.',
    route: '#games/sudoku',
    tag: 'Logic · 5–20 phút',
    color: 'var(--transition)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
      </svg>
    ),
    steps: [
      'Mỗi hàng ngang có đủ 9 nguyên tố khác nhau.',
      'Mỗi cột dọc có đủ 9 nguyên tố khác nhau.',
      'Mỗi ô 3×3 có đủ 9 nguyên tố khác nhau.',
      'Dùng phím 1-9 hoặc click pad để điền.',
      'Bật "Ghi chú" để đánh dấu khả năng.',
    ],
  },

  /* ❗ MỚI: 9 TRÒ CHƠI CAMERA — chạy trên engine chung (CameraGame.jsx),
     AI nhận diện mặt/tay để điều khiển lối chơi. */
  /* ❗ Thêm: DÒ MÌN KIẾN THỨC — thể loại dò mìn kinh điển */
  {
    id: 'mines',
    num: '21',
    category: 'practice',
    badge: 'MỚI · DÒ MÌN',
    title: 'Dò mìn',
    titleEm: 'kiến thức',
    desc: 'Lưới 4×4 có mìn ẩn. Ô an toàn → câu thường; dính ô mìn → phải gỡ bằng câu hỏi độ khó cao! Dọn sạch bảng để qua ván mới, mìn nhiều hơn.',
    route: '#games/mines',
    tag: 'Thử thách · 5–15 phút',
    color: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 7a5 5 0 0 1 5 5c0 2-1 3-1 4H8c0-1-1-2-1-4a5 5 0 0 1 5-5z" />
        <path d="M12 3v2M5 12H3M21 12h-2M12 20v2" />
      </svg>
    ),
    steps: [
      'Bấm 1 ô chưa dò trên lưới 4×4.',
      'Ô an toàn → trả lời câu hỏi thường (+100).',
      'Dính ô mìn → trả lời câu KHÓ để gỡ (+150) — sai là nổ!',
      'Dọn sạch ô an toàn → +300 và qua ván mới, mìn nhiều hơn.',
    ],
  },
  ...CAMERA_GAMES.map((g) => ({
    id: g.id,
    num: g.num,
    category: 'camera',
    badge: g.badge,
    title: g.name,
    titleEm: g.titleEm,
    desc: g.desc,
    route: `#games/${g.id}`,
    tag: g.tag,
    color: g.color,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {CAMERA_ICONS[g.iconKey]}
      </svg>
    ),
    steps: [
      'Cho phép quyền camera khi trình duyệt hỏi.',
      'Đọc câu hỏi và thực hiện hành động theo chế độ chơi (giơ tay / nhìn / nghiêng / cười…).',
      'Giữ tư thế đủ lâu để chốt đáp án — trả lời sai mất 1 mạng.',
      'Hết 3 mạng là kết thúc — điểm cao nhất của phiên được lưu.',
    ],
  })),
];

export default function GameHub() {
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user);
  const [filter, setFilter] = useState('all');
  const [guideOpen, setGuideOpen] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [updateTick, setUpdateTick] = useState(0);

  const toggleGuide = (id) => {
    setGuideOpen((g) => (g === id ? null : id));
  };

  const { visibility, isLocked } = useMemo(() => {
    let vis = {};
    let locked = false;
    try {
      const savedVis = localStorage.getItem('cs-game-visibility');
      if (savedVis) vis = JSON.parse(savedVis);
      locked = localStorage.getItem('cs-game-locked') === 'true';
    } catch {}
    return { visibility: vis, isLocked: locked };
  }, [updateTick]);

  // Lọc game: Admin thấy tất cả, người dùng thường chỉ thấy game không bị ẩn
  const availableGames = useMemo(() => {
    return GAMES.filter((g) => {
      if (userIsAdmin) return true;
      return visibility[g.id] !== false;
    });
  }, [userIsAdmin, visibility]);

  const filteredGames = filter === 'all'
    ? availableGames
    : availableGames.filter((g) => g.category === filter);

  return (
    <section className="wrap games-hub">
      {/* Vision Pro Studio Header */}
      <header className="games-hub-head">
        <div className="cg-badge" style={{ margin: '0 auto .75rem' }}>
          TRÒ CHƠI TƯƠNG TÁC LỚP HỌC · ELEC GAME STUDIO
        </div>
        <h1 className="games-hub-title">
          Kho Trò Chơi <em>Hóa Học</em> Tương Tác
        </h1>
        <p className="lead games-hub-lead">
          Thiết kế chuẩn máy chiếu lớp học & phòng lab. Giáo viên dễ dàng tùy biến ngân hàng câu hỏi theo từng bài giảng. Không cần tạo tài khoản hay cài đặt rườm rà.
        </p>

        {/* Nút Cài đặt trung tâm */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="cg-action-btn"
            style={{
              padding: '0.55rem 1.35rem',
              borderColor: userIsAdmin ? '#ef4444' : 'var(--line, rgba(0,0,0,0.1))',
              background: userIsAdmin ? 'rgba(239, 68, 68, 0.08)' : 'var(--panel, #ffffff)',
              fontWeight: 700,
            }}
            onClick={() => setSettingsOpen(true)}
          >
            <span>⚙️ Cài đặt & Quản lý trò chơi</span>
            {userIsAdmin && (
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#ef4444', color: '#fff', marginLeft: '0.35rem' }}>
                Admin
              </span>
            )}
          </button>
        </div>

        {/* Category Tabs Filter */}
        <div className="cg-tab-row" style={{ marginTop: '1.25rem', justifyContent: 'center' }}>
          <button
            type="button"
            className={`cg-tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({availableGames.length})
          </button>
          <button
            type="button"
            className={`cg-tab-btn ${filter === 'camera' ? 'active' : ''}`}
            onClick={() => setFilter('camera')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }}><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
            Camera ({CAMERA_GAMES.length})
          </button>
          <button
            type="button"
            className={`cg-tab-btn ${filter === 'team' ? 'active' : ''}`}
            onClick={() => setFilter('team')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }}><path d="M4 12h16M12 9v6M7 7l-3 5 3 5M17 7l3 5-3 5" /></svg>
            Đối kháng & Đua tốc độ
          </button>
          <button
            type="button"
            className={`cg-tab-btn ${filter === 'gameshow' ? 'active' : ''}`}
            onClick={() => setFilter('gameshow')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            Gameshow & May mắn
          </button>
          <button
            type="button"
            className={`cg-tab-btn ${filter === 'practice' ? 'active' : ''}`}
            onClick={() => setFilter('practice')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }}><path d="M9 3h6M10 3v5L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8V3" /></svg>
            Rèn luyện & Thí nghiệm
          </button>
        </div>
      </header>

      {/* Banner Khóa giờ thi (cho học sinh) */}
      {isLocked && !userIsAdmin ? (
        <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--panel, #fff)', borderRadius: 24, border: '1.5px dashed var(--line, #ccc)', margin: '2rem 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#ef4444' }}>
            Chế độ Giờ thi đang được kích hoạt
          </h3>
          <p style={{ margin: 0, color: 'var(--mut, #64748b)', maxWidth: 520, marginInline: 'auto', fontSize: '0.92rem' }}>
            Quản trị viên đã tạm khóa toàn bộ trò chơi để học sinh tập trung làm bài thi. Các trò chơi sẽ tự động mở lại sau khi kết thúc buổi kiểm tra.
          </p>
        </div>
      ) : (
        <div className="games-grid">
        {filteredGames.map((g) => {
          let qCount = 0;
          try {
            const raw = localStorage.getItem(`cs-game:${g.id}:questions`);
            if (raw) qCount = JSON.parse(raw).length;
          } catch {}

          return (
            <article
              key={g.id}
              className="game-card-v2"
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
                {userIsAdmin && visibility[g.id] === false && (
                  <span
                    className="gc-badge"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    🔒 ĐÃ ẨN BỞI ADMIN
                  </span>
                )}
                {g.badge && (
                  <span
                    className="gc-badge"
                    style={{
                      background: g.color + '22',
                      color: g.color,
                      borderColor: g.color + '44',
                    }}
                  >
                    {g.badge}
                  </span>
                )}
                {qCount > 0 && (
                  <span className="gc-badge">{qCount} câu hỏi</span>
                )}
              </div>

              <div className="gc-actions">
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
              </div>

              {guideOpen === g.id && (
                <div className="gc-guide animate-fade-in">
                  <h4 className="gc-guide-title">Cách chơi chi tiết</h4>
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
                    Bắt đầu chơi ngay →
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
      )}

      {/* Modal Cài đặt & Quản lý Game Studio */}
      {settingsOpen && (
        <GameStudioSettingsModal
          user={user}
          onClose={() => setSettingsOpen(false)}
          onUpdated={() => setUpdateTick((t) => t + 1)}
        />
      )}

      {/* Hướng dẫn dành cho giáo viên */}
      <section className="games-teacher-guide" style={{ marginTop: '4rem' }}>
        <h2 className="section-title">Quy trình tổ chức cho <em>giáo viên</em></h2>
        <div className="teacher-steps">
          <div className="teacher-step">
            <span className="teacher-step-num">01</span>
            <h4>Chọn trò chơi</h4>
            <p>Chọn game phù hợp với pha học (Khởi động, Đấu đội, Tổng kết bài).</p>
          </div>
          <div className="teacher-step">
            <span className="teacher-step-num">02</span>
            <h4>Tải câu hỏi bài học</h4>
            <p>Bấm nút "Ngân hàng câu hỏi" để chọn chuyên đề hoặc tự paste đề bài.</p>
          </div>
          <div className="teacher-step">
            <span className="teacher-step-num">03</span>
            <h4>Bật toàn màn hình</h4>
            <p>Nhấn phím F hoặc biểu tượng Toàn màn hình trên thanh GameBar góc trên.</p>
          </div>
          <div className="teacher-step">
            <span className="teacher-step-num">04</span>
            <h4>Khuấy động lớp học</h4>
            <p>Âm thanh Web Audio sống động tạo không khí bùng nổ cho tiết học!</p>
          </div>
        </div>
      </section>
    </section>
  );
}