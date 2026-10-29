import { useState, useEffect } from 'react';
import { isAdmin } from '../../lib/isAdmin.js';
import sound from '../../lib/gameSound.js';
import {
  SvgTrophy,
  SvgTimer,
  SvgFlag,
  SvgRaceCar,
  SvgPuzzlePiece,
  SvgWheelPin,
  SvgRobot,
  SvgLightbulb,
} from './ClassroomGameIcons.jsx';
import { IconClose, IconShield, IconLock, IconDownload, IconUpload } from '../Icons.jsx';
import '../../styles/classroom-games.css';

/* Danh sách 11 trò chơi */
export const ALL_GAMES_METADATA = [
  { id: 'tugofwar', name: 'Kéo co tri thức', category: 'team', icon: SvgFlag, color: '#ef4444' },
  { id: 'wheel', name: 'Vòng quay may mắn', category: 'gameshow', icon: SvgWheelPin, color: '#0284c7' },
  { id: 'flip', name: 'Lật mảnh ghép bí mật', category: 'gameshow', icon: SvgPuzzlePiece, color: '#8b5cf6' },
  { id: 'millionaire', name: 'Ai là triệu phú', category: 'gameshow', icon: SvgRobot, color: '#eab308' },
  { id: 'racing', name: 'Đua xe tri thức', category: 'team', icon: SvgRaceCar, color: '#10b981' },
  { id: 'chicken', name: 'Bắt gà hóa học', category: 'practice', icon: SvgLightbulb, color: '#f97316' },
  { id: 'slingshot', name: 'Bắn súng parabol', category: 'practice', icon: SvgTrophy, color: '#06b6d4' },
  { id: 'jeopardy', name: 'Chọn ô may mắn', category: 'team', icon: SvgFlag, color: '#ec4899' },
  { id: 'lab', name: 'Phòng thí nghiệm ảo', category: 'practice', icon: SvgLightbulb, color: '#14b8a6' },
  { id: 'battle', name: 'Đấu trường nguyên tố', category: 'practice', icon: SvgTrophy, color: '#f43f5e' },
  { id: 'sudoku', name: 'Sudoku hóa học', category: 'practice', icon: SvgPuzzlePiece, color: '#6366f1' },
];

/* Cấu hình mặc định của từng game */
const DEFAULT_CONFIGS = {
  tugofwar: { timer: 25, winThreshold: 4, teamRed: 'Đội Đỏ', teamBlue: 'Đội Xanh' },
  wheel: { spinDuration: 4.5, defaultMode: 'challenge' },
  flip: { guessBonus: 500, tileScore: 100 },
  millionaire: { timer: 0, enableLifelines: true },
  racing: { stepProgress: 25, defaultLanes: 2 },
  chicken: { speed: 'normal', lives: 3 },
  slingshot: { gravity: 9.8, lives: 3 },
  jeopardy: { dailyDoubleCount: 2 },
};

export default function GameStudioSettingsModal({ user, onClose, onUpdated }) {
  const userIsAdmin = isAdmin(user);
  const [activeTab, setActiveTab] = useState('tugofwar'); // game id or 'admin'
  const [saveSuccess, setSaveSuccess] = useState('');

  // 1. Quản lý trạng thái Ẩn / Hiện trò chơi (Dành cho Admin)
  const [visibility, setVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('cs-game-visibility');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Mặc định tất cả đều hiện
    const init = {};
    ALL_GAMES_METADATA.forEach((g) => { init[g.id] = true; });
    return init;
  });

  // Chế độ khóa toàn bộ game (Khóa trong giờ thi)
  const [lockAllGames, setLockAllGames] = useState(() => {
    return localStorage.getItem('cs-game-locked') === 'true';
  });

  // 2. Quản lý Cấu hình game đang chọn (Công khai)
  const [gameConfig, setGameConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(`cs-game:${activeTab}:config`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CONFIGS[activeTab] || { timer: 25 };
  });

  // 3. Quản lý danh sách câu hỏi của game đang chọn (Công khai)
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem(`cs-game:${activeTab}:questions`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Khi chuyển game tab
  useEffect(() => {
    if (activeTab === 'admin') return;

    try {
      const savedCfg = localStorage.getItem(`cs-game:${activeTab}:config`);
      setGameConfig(savedCfg ? JSON.parse(savedCfg) : (DEFAULT_CONFIGS[activeTab] || { timer: 25 }));

      const savedQ = localStorage.getItem(`cs-game:${activeTab}:questions`);
      setQuestions(savedQ ? JSON.parse(savedQ) : []);
    } catch {}
    setSaveSuccess('');
  }, [activeTab]);

  // Lưu cấu hình Admin
  const handleToggleVisibility = (gameId) => {
    if (!userIsAdmin) return;
    const next = { ...visibility, [gameId]: !visibility[gameId] };
    setVisibility(next);
    try {
      localStorage.setItem('cs-game-visibility', JSON.stringify(next));
    } catch (e) {
      console.warn('GameStudioSettingsModal save visibility error:', e);
    }
    sound.ding();
    onUpdated?.();
  };

  const handleToggleLockAll = () => {
    if (!userIsAdmin) return;
    const next = !lockAllGames;
    setLockAllGames(next);
    try {
      localStorage.setItem('cs-game-locked', String(next));
    } catch (e) {
      console.warn('GameStudioSettingsModal save lock error:', e);
    }
    sound.ding();
    onUpdated?.();
  };

  const handleResetSystemDefaults = () => {
    if (!userIsAdmin) return;
    if (!confirm('Khôi phục toàn bộ cài đặt, hiển thị lại tất cả game về mặc định gốc?')) return;

    const resetVis = {};
    ALL_GAMES_METADATA.forEach((g) => { resetVis[g.id] = true; });
    setVisibility(resetVis);
    try {
      localStorage.setItem('cs-game-visibility', JSON.stringify(resetVis));
      setLockAllGames(false);
      localStorage.removeItem('cs-game-locked');
    } catch (e) {
      console.warn('GameStudioSettingsModal reset defaults error:', e);
    }

    sound.cheer();
    setSaveSuccess('Đã khôi phục cài đặt hệ thống thành công!');
    setTimeout(() => setSaveSuccess(''), 3000);
    onUpdated?.();
  };

  // Lưu cấu hình game (Công khai)
  const handleSaveGameConfig = () => {
    try {
      localStorage.setItem(`cs-game:${activeTab}:config`, JSON.stringify(gameConfig));
      localStorage.setItem(`cs-game:${activeTab}:questions`, JSON.stringify(questions));
      sound.ding();
      setSaveSuccess(`Đã lưu cài đặt cho ${ALL_GAMES_METADATA.find((g) => g.id === activeTab)?.name}!`);
      setTimeout(() => setSaveSuccess(''), 3000);
      onUpdated?.();
    } catch (e) {
      alert('Lỗi lưu cài đặt: ' + e.message);
    }
  };

  // Sửa câu hỏi
  const handleUpdateQuestion = (idx, field, value) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleUpdateOption = (qIdx, optIdx, val) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...(next[qIdx].options || [])];
      opts[optIdx] = val;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        q: 'Nhập nội dung câu hỏi mới...',
        options: ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
        correct: 0,
        explain: 'Giải thích chi tiết...',
      },
    ]);
  };

  const handleDeleteQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Export / Import JSON
  const handleExportJSON = () => {
    const data = {
      gameId: activeTab,
      config: gameConfig,
      questions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chem-game-${activeTab}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (Array.isArray(parsed.questions)) {
          setQuestions(parsed.questions);
        } else if (Array.isArray(parsed)) {
          setQuestions(parsed);
        }
        if (parsed.config) {
          setGameConfig((prev) => ({ ...prev, ...parsed.config }));
        }
        sound.ding();
        alert('Đã nhập thành công bộ câu hỏi & cấu hình!');
      } catch (err) {
        alert('File JSON không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="cg-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="cg-question-box animate-pop"
        style={{
          maxWidth: 960,
          width: '95vw',
          maxHeight: '90vh',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--line, rgba(0,0,0,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--panel, #ffffff)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="cg-badge">TRUNG TÂM CÀI ĐẶT TRÒ CHƠI</span>
              {userIsAdmin && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: '#ef4444',
                    color: '#ffffff',
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <h2 style={{ margin: '0.25rem 0 0', fontSize: '1.35rem', fontWeight: 800 }}>
              Cài đặt & Quản trị Game Studio
            </h2>
          </div>

          <button
            type="button"
            className="cg-action-btn"
            style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            onClick={onClose}
          >
            Đóng <IconClose size={14} />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar Tabs */}
          <aside
            style={{
              width: 250,
              borderRight: '1px solid var(--line, rgba(0,0,0,0.08))',
              background: 'var(--surface-2, #f8fafc)',
              overflowY: 'auto',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--mut, #64748b)', padding: '0.4rem 0.6rem', textTransform: 'uppercase' }}>
              Cài đặt nội dung (Công khai)
            </div>

            {ALL_GAMES_METADATA.map((g) => {
              const isSelected = activeTab === g.id;
              const isHidden = visibility[g.id] === false;

              return (
                <button
                  key={g.id}
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: isSelected ? 'var(--panel, #ffffff)' : 'transparent',
                    color: isSelected ? 'var(--ink, #0f172a)' : 'var(--mut, #64748b)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setActiveTab(g.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                    <span>{g.name}</span>
                  </div>
                  {isHidden && (
                    <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                      Đã ẩn
                    </span>
                  )}
                </button>
              );
            })}

            <div style={{ margin: '0.75rem 0 0.25rem', height: 1, background: 'var(--line, rgba(0,0,0,0.08))' }} />

            {/* Tab Admin */}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.7rem 0.75rem',
                borderRadius: '12px',
                border: activeTab === 'admin' ? '1.5px solid #ef4444' : '1px solid transparent',
                background: activeTab === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                color: activeTab === 'admin' ? '#ef4444' : 'var(--mut, #64748b)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('admin')}
            >
              <IconShield size={16} />
              <span>Quản trị Hệ thống (Admin)</span>
            </button>
          </aside>

          {/* Right Main Content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--panel, #ffffff)' }}>
            {saveSuccess && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700, marginBottom: '1.25rem' }}>
                ✓ {saveSuccess}
              </div>
            )}

            {/* TAB QUẢN TRỊ ADMIN */}
            {activeTab === 'admin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 800 }}>
                    Quyền Quản Trị Viên Tối Cao (Admin Only)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--mut, #64748b)' }}>
                    Admin có thể kiểm soát trạng thái hiển thị của từng trò chơi trên GameHub, khóa học sinh tự do chơi trong giờ kiểm tra và reset hệ thống.
                  </p>
                </div>

                {!userIsAdmin ? (
                  <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-2, #f8fafc)', borderRadius: '18px', border: '1px dashed var(--line, #ccc)' }}>
                    <div style={{ marginBottom: '0.5rem', color: 'var(--mut, #64748b)' }}><IconLock size={40} /></div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
                      Bạn chưa có quyền Admin
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--mut, #64748b)', maxWidth: 450, marginInline: 'auto' }}>
                      Chỉ tài khoản Quản trị viên (Admin) mới có quyền ẩn/hiện trò chơi hoặc can thiệp sâu vào hệ sinh thái. Người dùng thông thường có thể thoải mái chỉnh sửa câu hỏi và thời gian ở các tab trò chơi bên trái.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Bật/Tắt khóa toàn bộ trong giờ thi */}
                    <div
                      style={{
                        padding: '1.25rem',
                        borderRadius: '16px',
                        background: lockAllGames ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-2, #f8fafc)',
                        border: lockAllGames ? '1.5px solid #ef4444' : '1px solid var(--line, rgba(0,0,0,0.08))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '1rem', color: lockAllGames ? '#ef4444' : 'inherit' }}>
                          Chế độ Giờ thi / Khóa toàn bộ trò chơi
                        </strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--mut, #64748b)' }}>
                          Khi kích hoạt, toàn bộ trò chơi sẽ tạm thời bị ẩn khỏi học sinh để tập trung làm bài kiểm tra.
                        </span>
                      </div>
                      <button
                        type="button"
                        className={lockAllGames ? 'cg-btn-primary' : 'cg-btn-secondary'}
                        style={{ background: lockAllGames ? '#ef4444' : undefined, whiteSpace: 'nowrap' }}
                        onClick={handleToggleLockAll}
                      >
                        {lockAllGames ? 'Đang KHÓA' : 'MỞ TỰ DO'}
                      </button>
                    </div>

                    {/* Danh sách Ẩn / Hiện từng Game */}
                    <div>
                      <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700 }}>
                        Trạng thái hiển thị từng trò chơi trên GameHub:
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {ALL_GAMES_METADATA.map((g) => {
                          const isShown = visibility[g.id] !== false;

                          return (
                            <div
                              key={g.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.85rem 1.15rem',
                                borderRadius: '14px',
                                background: 'var(--surface-2, #f8fafc)',
                                border: '1px solid var(--line, rgba(0,0,0,0.08))',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color }} />
                                <div>
                                  <strong style={{ fontSize: '0.95rem' }}>{g.name}</strong>
                                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--mut, #64748b)' }}>
                                    Route: #{g.id}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                style={{
                                  padding: '0.4rem 0.85rem',
                                  borderRadius: '999px',
                                  border: 'none',
                                  background: isShown ? '#10b981' : '#ef4444',
                                  color: '#ffffff',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                                onClick={() => handleToggleVisibility(g.id)}
                              >
                                {isShown ? 'Đang HIỆN' : 'Đã ẨN'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nút reset hệ thống */}
                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--line, rgba(0,0,0,0.08))' }}>
                      <button
                        type="button"
                        style={{
                          padding: '0.65rem 1.25rem',
                          borderRadius: '12px',
                          border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                        }}
                        onClick={handleResetSystemDefaults}
                      >
                        Khôi phục toàn bộ trò chơi về mặc định hệ thống
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* TAB CÀI ĐẶT CÔNG KHAI CỦA TỪNG GAME */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', fontWeight: 800 }}>
                      Cài đặt: {ALL_GAMES_METADATA.find((g) => g.id === activeTab)?.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--mut, #64748b)' }}>
                      Giáo viên / Học sinh có thể tùy chỉnh thời gian suy nghĩ, luật chơi và nội dung câu hỏi.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="cg-btn-primary"
                    style={{ padding: '0.6rem 1.4rem' }}
                    onClick={handleSaveGameConfig}
                  >
                    Lưu tất cả thay đổi
                  </button>
                </div>

                {/* Phần 1: Tùy chỉnh thông số & thời gian (Công khai) */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    background: 'var(--surface-2, #f8fafc)',
                    border: '1px solid var(--line, rgba(0,0,0,0.08))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0284c7' }}>
                    ⏱️ THỜI GIAN & THÔNG SỐ VÒNG CHƠI
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Chỉnh thời gian đếm ngược */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--mut, #64748b)', marginBottom: '0.35rem' }}>
                        Thời gian suy nghĩ mỗi câu:
                      </label>
                      <select
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid var(--line, #ccc)',
                          background: 'var(--panel, #fff)',
                          color: 'var(--ink, #000)',
                          fontWeight: 600,
                        }}
                        value={gameConfig.timer ?? 25}
                        onChange={(e) => setGameConfig({ ...gameConfig, timer: Number(e.target.value) })}
                      >
                        <option value={10}>10 giây (Rất nhanh)</option>
                        <option value={15}>15 giây (Nhanh)</option>
                        <option value={20}>20 giây</option>
                        <option value={25}>25 giây (Mặc định)</option>
                        <option value={30}>30 giây (Thoải mái)</option>
                        <option value={45}>45 giây</option>
                        <option value={60}>60 giây (Nâng cao)</option>
                      </select>
                    </div>

                    {/* Ngưỡng chiến thắng (Kéo co hoặc Đua xe) */}
                    {activeTab === 'tugofwar' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--mut, #64748b)', marginBottom: '0.35rem' }}>
                          Ngưỡng kéo để thắng cuộc:
                        </label>
                        <select
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.85rem',
                            borderRadius: '10px',
                            border: '1px solid var(--line, #ccc)',
                            background: 'var(--panel, #fff)',
                            color: 'var(--ink, #000)',
                            fontWeight: 600,
                          }}
                          value={gameConfig.winThreshold ?? 4}
                          onChange={(e) => setGameConfig({ ...gameConfig, winThreshold: Number(e.target.value) })}
                        >
                          <option value={3}>3 nấc (Trận đấu nhanh)</option>
                          <option value={4}>4 nấc (Tiêu chuẩn)</option>
                          <option value={5}>5 nấc (Kịch tính)</option>
                        </select>
                      </div>
                    )}

                    {/* Tên đội Đỏ / Xanh */}
                    {activeTab === 'tugofwar' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem' }}>
                            Tên Đội 1:
                          </label>
                          <input
                            type="text"
                            style={{
                              width: '100%',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '10px',
                              border: '1px solid var(--line, #ccc)',
                              background: 'var(--panel, #fff)',
                              color: 'var(--ink, #000)',
                              boxSizing: 'border-box',
                            }}
                            value={gameConfig.teamRed ?? 'Đội Đỏ'}
                            onChange={(e) => setGameConfig({ ...gameConfig, teamRed: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.35rem' }}>
                            Tên Đội 2:
                          </label>
                          <input
                            type="text"
                            style={{
                              width: '100%',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '10px',
                              border: '1px solid var(--line, #ccc)',
                              background: 'var(--panel, #fff)',
                              color: 'var(--ink, #000)',
                              boxSizing: 'border-box',
                            }}
                            value={gameConfig.teamBlue ?? 'Đội Xanh'}
                            onChange={(e) => setGameConfig({ ...gameConfig, teamBlue: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Phần 2: Quản lý ngân hàng câu hỏi của game */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                      Danh sách câu hỏi ({questions.length} câu)
                    </h4>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label className="cg-action-btn" style={{ cursor: 'pointer', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <IconUpload size={14} /> Nhập JSON
                        <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        className="cg-action-btn"
                        style={{ padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        onClick={handleExportJSON}
                      >
                        <IconDownload size={14} /> Xuất JSON
                      </button>
                      <button
                        type="button"
                        className="cg-btn-primary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                        onClick={handleAddQuestion}
                      >
                        + Thêm câu hỏi
                      </button>
                    </div>
                  </div>

                  {/* List câu hỏi có thể chỉnh sửa trực tiếp */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {questions.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-2, #f8fafc)', borderRadius: '16px', color: 'var(--mut, #64748b)' }}>
                        Chưa có câu hỏi tùy biến nào (Game đang dùng bộ câu hỏi mặc định của hệ thống). Bấm "+ Thêm câu hỏi" để tạo đề thi riêng của lớp!
                      </div>
                    ) : (
                      questions.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '1.25rem',
                            borderRadius: '16px',
                            background: 'var(--surface-2, #f8fafc)',
                            border: '1px solid var(--line, rgba(0,0,0,0.08))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7' }}>
                              CÂU HỎI #{idx + 1}
                            </span>
                            <button
                              type="button"
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                              onClick={() => handleDeleteQuestion(idx)}
                            >
                              Xóa câu này
                            </button>
                          </div>

                          <input
                            type="text"
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '10px',
                              border: '1px solid var(--line, #ccc)',
                              background: 'var(--panel, #fff)',
                              color: 'var(--ink, #000)',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              boxSizing: 'border-box',
                            }}
                            value={q.q || q.question || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'q', e.target.value)}
                            placeholder="Nhập nội dung câu hỏi..."
                          />

                          {/* 4 Lựa chọn A, B, C, D */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {(q.options || ['A', 'B', 'C', 'D']).map((opt, optIdx) => {
                              const isCorrect = q.correct === optIdx;

                              return (
                                <div
                                  key={optIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: '10px',
                                    background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--panel, #fff)',
                                    border: isCorrect ? '1.5px solid #10b981' : '1px solid var(--line, #ccc)',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={isCorrect}
                                    onChange={() => handleUpdateQuestion(idx, 'correct', optIdx)}
                                    title="Đánh dấu đáp án đúng"
                                  />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                                    {String.fromCharCode(65 + optIdx)}:
                                  </span>
                                  <input
                                    type="text"
                                    style={{
                                      flex: 1,
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--ink, #000)',
                                      fontSize: '0.88rem',
                                      fontWeight: 600,
                                      outline: 'none',
                                    }}
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Giải thích */}
                          <input
                            type="text"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid var(--line, #ccc)',
                              background: 'var(--panel, #fff)',
                              color: 'var(--ink, #000)',
                              fontSize: '0.82rem',
                              boxSizing: 'border-box',
                            }}
                            value={q.explain || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'explain', e.target.value)}
                            placeholder="Lời giải thích chi tiết cho câu hỏi này..."
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
