import { useState, useEffect } from 'react';
import { isAdmin } from '../../lib/isAdmin.js';
import sound from '../../lib/gameSound.js';
import { normalizeBankQuestionList, normalizeChoiceQuestionList } from '../../lib/gameQuestionBank.js';

const BANK_FORMAT_TABS = new Set(['chicken', 'slingshot']);
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
import './game-studio-settings.css';

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
      if (saved) return normalizeChoiceQuestionList(JSON.parse(saved), []);
    } catch {}
    return [];
  });

  // Lắng nghe phím Escape để đóng modal chuẩn UX
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Khi chuyển game tab
  useEffect(() => {
    if (activeTab === 'admin') return;

    try {
      const savedCfg = localStorage.getItem(`cs-game:${activeTab}:config`);
      setGameConfig(savedCfg ? JSON.parse(savedCfg) : (DEFAULT_CONFIGS[activeTab] || { timer: 25 }));

      const savedQ = localStorage.getItem(`cs-game:${activeTab}:questions`);
      setQuestions(savedQ ? normalizeChoiceQuestionList(JSON.parse(savedQ), []) : []);
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
      const normalizedOut = BANK_FORMAT_TABS.has(activeTab)
        ? normalizeBankQuestionList(questions, [])
        : normalizeChoiceQuestionList(questions, []);
      localStorage.setItem(`cs-game:${activeTab}:config`, JSON.stringify(gameConfig));
      localStorage.setItem(`cs-game:${activeTab}:questions`, JSON.stringify(normalizedOut));
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
      const existing = Array.isArray(next[qIdx]?.options)
        ? next[qIdx].options
        : ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'];
      const len = Math.max(4, optIdx + 1, existing.length);
      const opts = Array.from({ length: len }, (_, i) =>
        existing[i] != null ? existing[i] : `Lựa chọn ${String.fromCharCode(65 + i)}`
      );
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

  const activeGame = ALL_GAMES_METADATA.find((g) => g.id === activeTab);
  const ActiveIcon = activeGame?.icon || SvgFlag;

  return (
    <div
      className="gss-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="gss-sheet" role="dialog" aria-modal="true" aria-label="Cài đặt Game Studio">
        {/* ============ LEFT MACOS SIDEBAR ============ */}
        <aside className="gss-sidebar">
          <div className="gss-side-head">
            <div className="gss-side-brand">
              <strong>Game Studio</strong>
              <small>Trung tâm tùy chỉnh</small>
            </div>
            {userIsAdmin && <span className="gss-admin-badge">Admin</span>}
          </div>

          <div className="gss-side-scroll">
            <div className="gss-side-label">Nội dung trò chơi</div>

            {ALL_GAMES_METADATA.map((g) => {
              const isSelected = activeTab === g.id;
              const isHidden = visibility[g.id] === false;
              const GameIcon = g.icon;

              return (
                <button
                  key={g.id}
                  type="button"
                  className={`gss-nav-item ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(g.id)}
                >
                  <span className="gss-nav-item-l">
                    <span className="gss-nav-ico" style={{ '--item-color': g.color }}>
                      <GameIcon />
                    </span>
                    <span>{g.name}</span>
                  </span>
                  {isHidden && <span className="gss-hidden-tag">Ẩn</span>}
                </button>
              );
            })}
          </div>

          <div className="gss-side-foot">
            <button
              type="button"
              className={`gss-nav-item is-admin ${activeTab === 'admin' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <span className="gss-nav-item-l">
                <span className="gss-nav-ico" style={{ '--item-color': '#ff3b30' }}>
                  <IconShield size={13} />
                </span>
                <span>Quản trị hệ thống</span>
              </span>
            </button>
          </div>
        </aside>

        {/* ============ RIGHT CONTENT PANE ============ */}
        <section className="gss-main">
          {/* Sticky Header */}
          <header className="gss-head">
            <div className="gss-head-l">
              <span
                className="gss-head-ico"
                style={{ background: activeTab === 'admin' ? '#ff3b30' : (activeGame?.color || '#0071e3') }}
              >
                {activeTab === 'admin' ? <IconShield size={17} /> : <ActiveIcon />}
              </span>
              <div className="gss-head-copy">
                <h2>{activeTab === 'admin' ? 'Quản trị hệ thống' : activeGame?.name}</h2>
                <p>
                  {activeTab === 'admin'
                    ? 'Kiểm soát hiển thị từng trò chơi, khóa giờ thi và khôi phục mặc định.'
                    : 'Tùy chỉnh thời gian, thông số vòng chơi và ngân hàng câu hỏi riêng cho lớp.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="gss-close-btn"
              onClick={onClose}
              aria-label="Đóng cài đặt"
              title="Đóng (Esc)"
            >
              <IconClose size={14} />
            </button>
          </header>

          {/* Scrollable Body */}
          <div className="gss-body">
            {activeTab === 'admin' ? (
              !userIsAdmin ? (
                <div className="gss-admin-locked">
                  <div style={{ color: 'var(--gss-mut)' }}><IconLock size={34} /></div>
                  <h4>Chức năng dành riêng cho Quản trị viên</h4>
                  <p>
                    Chỉ tài khoản Admin mới có quyền ẩn/hiện trò chơi hoặc khóa toàn bộ trong giờ kiểm tra.
                    Bạn vẫn có thể tự do chỉnh sửa câu hỏi và thông số ở các mục trò chơi bên trái.
                  </p>
                </div>
              ) : (
                <>
                  {/* Khóa giờ thi */}
                  <div className={`gss-lock-banner ${lockAllGames ? 'is-locked' : ''}`}>
                    <div>
                      <strong>Chế độ Giờ thi (Khóa toàn bộ trò chơi)</strong>
                      <span>
                        Khi bật, toàn bộ trò chơi trên GameHub sẽ tạm ẩn khỏi học sinh để tập trung làm bài kiểm tra.
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={lockAllGames}
                      className={`gss-switch is-danger ${lockAllGames ? 'is-on' : ''}`}
                      onClick={handleToggleLockAll}
                      title={lockAllGames ? 'Đang khóa toàn bộ game' : 'Đang mở tự do'}
                    >
                      <span className="gss-switch-knob" />
                    </button>
                  </div>

                  {/* Trạng thái hiển thị từng trò chơi */}
                  <div className="gss-group">
                    <h4 className="gss-group-title">Trạng thái hiển thị trên GameHub ({ALL_GAMES_METADATA.length} trò chơi)</h4>
                    <div className="gss-vis-grid">
                      {ALL_GAMES_METADATA.map((g) => {
                        const isShown = visibility[g.id] !== false;
                        const GameIcon = g.icon;

                        return (
                          <div key={g.id} className="gss-vis-row">
                            <div className="gss-vis-row-l">
                              <span className="gss-nav-ico" style={{ '--item-color': g.color }}>
                                <GameIcon />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <strong>{g.name}</strong>
                                <small>{isShown ? 'Đang hiển thị' : 'Đang ẩn'}</small>
                              </div>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isShown}
                              className={`gss-switch ${isShown ? 'is-on' : ''}`}
                              onClick={() => handleToggleVisibility(g.id)}
                              aria-label={`Bật hoặc tắt hiển thị ${g.name}`}
                            >
                              <span className="gss-switch-knob" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Khôi phục mặc định */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button
                      type="button"
                      className="gss-pill-btn is-danger"
                      onClick={handleResetSystemDefaults}
                    >
                      Khôi phục toàn bộ về mặc định hệ thống
                    </button>
                  </div>
                </>
              )
            ) : (
              <>
                {/* Phần 1: Thời gian & Thông số vòng chơi */}
                <div className="gss-group">
                  <h4 className="gss-group-title">Thời gian &amp; thông số vòng chơi</h4>

                  <div className="gss-fields-grid">
                    <div className="gss-field">
                      <label htmlFor="gss-timer-select">Thời gian suy nghĩ mỗi câu</label>
                      <select
                        id="gss-timer-select"
                        className="gss-select"
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

                    {activeTab === 'tugofwar' && (
                      <div className="gss-field">
                        <label htmlFor="gss-threshold-select">Ngưỡng kéo để thắng cuộc</label>
                        <select
                          id="gss-threshold-select"
                          className="gss-select"
                          value={gameConfig.winThreshold ?? 4}
                          onChange={(e) => setGameConfig({ ...gameConfig, winThreshold: Number(e.target.value) })}
                        >
                          <option value={3}>3 nấc (Trận đấu nhanh)</option>
                          <option value={4}>4 nấc (Tiêu chuẩn)</option>
                          <option value={5}>5 nấc (Kịch tính)</option>
                        </select>
                      </div>
                    )}

                    {activeTab === 'tugofwar' && (
                      <>
                        <div className="gss-field">
                          <label htmlFor="gss-team-red">
                            <span className="gss-team-dot" style={{ background: '#ff3b30' }} />
                            <span>Tên Đội 1</span>
                          </label>
                          <input
                            id="gss-team-red"
                            type="text"
                            className="gss-input"
                            value={gameConfig.teamRed ?? 'Đội Đỏ'}
                            onChange={(e) => setGameConfig({ ...gameConfig, teamRed: e.target.value })}
                          />
                        </div>
                        <div className="gss-field">
                          <label htmlFor="gss-team-blue">
                            <span className="gss-team-dot" style={{ background: '#0071e3' }} />
                            <span>Tên Đội 2</span>
                          </label>
                          <input
                            id="gss-team-blue"
                            type="text"
                            className="gss-input"
                            value={gameConfig.teamBlue ?? 'Đội Xanh'}
                            onChange={(e) => setGameConfig({ ...gameConfig, teamBlue: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Phần 2: Ngân hàng câu hỏi */}
                <div className="gss-q-section">
                  <div className="gss-q-header">
                    <div className="gss-q-header-l">
                      <h3>Ngân hàng câu hỏi</h3>
                      <span className="gss-count-pill">{questions.length} câu</span>
                    </div>

                    <div className="gss-q-tools">
                      <label className="gss-pill-btn">
                        <IconUpload size={13} />
                        <span>Nhập JSON</span>
                        <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
                      </label>
                      <button type="button" className="gss-pill-btn" onClick={handleExportJSON}>
                        <IconDownload size={13} />
                        <span>Xuất JSON</span>
                      </button>
                      <button type="button" className="gss-pill-btn is-primary" onClick={handleAddQuestion}>
                        + Thêm câu hỏi
                      </button>
                    </div>
                  </div>

                  {questions.length === 0 ? (
                    <div className="gss-empty">
                      <strong>Đang dùng bộ câu hỏi mặc định của hệ thống</strong>
                      Bấm “+ Thêm câu hỏi” hoặc “Nhập JSON” để tạo ngân hàng câu hỏi riêng cho lớp học.
                    </div>
                  ) : (
                    <div className="gss-q-list">
                      {questions.map((q, idx) => (
                        <div key={idx} className="gss-q-card">
                          <div className="gss-q-top">
                            <span className="gss-q-num">Câu hỏi #{idx + 1}</span>
                            <button
                              type="button"
                              className="gss-q-del"
                              onClick={() => handleDeleteQuestion(idx)}
                            >
                              Xóa câu
                            </button>
                          </div>

                          <input
                            type="text"
                            className="gss-q-stem"
                            value={q.q || q.question || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'q', e.target.value)}
                            placeholder="Nhập nội dung câu hỏi..."
                          />

                          {/* 4 Lựa chọn A, B, C, D — Click chữ cái để chọn đáp án đúng */}
                          <div className="gss-opt-grid">
                            {(q.options || ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D']).map((opt, optIdx) => {
                              const isCorrect = q.correct === optIdx;
                              const letter = String.fromCharCode(65 + optIdx);

                              return (
                                <div key={optIdx} className={`gss-opt-row ${isCorrect ? 'is-correct' : ''}`}>
                                  <button
                                    type="button"
                                    className="gss-opt-pick"
                                    onClick={() => handleUpdateQuestion(idx, 'correct', optIdx)}
                                    title={`Đặt đáp án ${letter} là đáp án đúng`}
                                    aria-pressed={isCorrect}
                                  >
                                    {letter}
                                  </button>
                                  <input
                                    type="text"
                                    className="gss-opt-input"
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                                    placeholder={`Nhập đáp án ${letter}...`}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          <input
                            type="text"
                            className="gss-explain-input"
                            value={q.explain || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'explain', e.target.value)}
                            placeholder="Lời giải thích nhanh (tùy chọn)..."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sticky Footer */}
          <footer className="gss-foot">
            <span className={`gss-foot-status ${saveSuccess ? 'is-ok' : ''}`}>
              {saveSuccess
                ? `✓ ${saveSuccess}`
                : activeTab === 'admin'
                  ? 'Các thay đổi quản trị được áp dụng ngay lập tức'
                  : 'Bấm vào chữ cái A/B/C/D để chọn đáp án đúng'}
            </span>

            <div className="gss-foot-actions">
              <button type="button" className="gss-btn-cancel" onClick={onClose}>
                Đóng
              </button>
              {activeTab !== 'admin' && (
                <button type="button" className="gss-btn-save" onClick={handleSaveGameConfig}>
                  Lưu thay đổi
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
