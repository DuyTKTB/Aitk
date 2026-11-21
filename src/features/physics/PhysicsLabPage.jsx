import { lazy, Suspense, useEffect, useState } from 'react';
import { askAI } from '../../components/HomePlus.jsx';
import ProjectileSim from './sims/ProjectileSim.jsx';
import CircuitSim from './sims/CircuitSim.jsx';
import RayOpticsSim from './sims/RayOpticsSim.jsx';
import WaveInterferenceSim from './sims/WaveInterferenceSim.jsx';
import Mechanics2DSim from './sims/Mechanics2DSim.jsx';
import DoublePendulumSim from './sims/DoublePendulumSim.jsx';
import OlympiadLabSim from './sims/OlympiadLabSim.jsx';
import PhysicsInquiryWorkbench from './PhysicsInquiryWorkbench.jsx';
import './physics-lab.css';

const Casio580Widget = lazy(() => import('../../components/Casio580Widget.jsx'));

/* ── Bộ Icon SVG thuần (Zero Emoji) ── */
const IcoArc = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 19c3.5-11 11.5-11 16 0" />
    <circle cx="19" cy="19" r="2" fill="currentColor" />
    <path d="M3 19h18" opacity="0.45" />
  </svg>
);

const IcoCircuit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="8" width="6" height="8" rx="1.5" />
    <path d="M8 12h3l1.5-3 2 6 1.5-3H22" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const IcoOptics = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3c3 4 3 14 0 18-3-4-3-14 0-18Z" />
    <path d="M2 8h10l9 8" />
    <path d="M2 16h10l9-8" opacity="0.55" />
  </svg>
);

const IcoWave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 5 0" />
    <path d="M2 17c2.5-5 5-5 7.5 0s5 5 7.5 0 5-5 5 0" opacity="0.48" />
  </svg>
);

const IcoCollide = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7.5" cy="12" r="4.5" />
    <circle cx="16.5" cy="12" r="4.5" />
    <path d="M12 4v3M12 17v3" />
  </svg>
);

const IcoPendulum = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 4h12" />
    <path d="M12 4l4 7-5 7" />
    <circle cx="16" cy="11" r="2.2" fill="currentColor" />
    <circle cx="11" cy="18" r="2.5" fill="currentColor" />
  </svg>
);

const IcoLab = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 20h18" />
    <path d="M5 16l4-5 4 3 6-8" />
    <circle cx="9" cy="11" r="1.5" fill="currentColor" />
    <circle cx="13" cy="14" r="1.5" fill="currentColor" />
    <circle cx="19" cy="6" r="1.5" fill="currentColor" />
  </svg>
);

const IcoCalc = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2.5" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <circle cx="8.5" cy="11" r="1" fill="currentColor" />
    <circle cx="12" cy="11" r="1" fill="currentColor" />
    <circle cx="15.5" cy="11" r="1" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    <circle cx="12" cy="15.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
  </svg>
);

const IcoFormula = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const MODULES = [
  {
    id: 'projectile',
    num: '01',
    label: 'Chuyển động Ném xiên',
    grade: 'Lớp 10',
    tag: 'Cơ học',
    Icon: IcoArc,
    mascot: '/img/elec/elec-fighting.png',
    tip: 'Khi h₀ = 0 và bỏ qua cản không khí, góc ném α = 45° luôn cho tầm xa L cực đại, còn hai góc phụ nhau (30° và 60°) có cùng tầm xa!',
  },
  {
    id: 'circuit',
    num: '02',
    label: 'Lắp ráp Mạch điện DC',
    grade: 'Lớp 9 · 11',
    tag: 'Điện học',
    Icon: IcoCircuit,
    mascot: '/img/elec/elec-cool.png',
    tip: 'Bấm trực tiếp vào khóa K trên sơ đồ để đóng/ngắt mạch. Chú ý khi điện trở trong r > 0 thì U_N = E − I·r luôn nhỏ hơn suất điện động E.',
  },
  {
    id: 'optics',
    num: '03',
    label: 'Quang hình & Thấu kính',
    grade: 'Lớp 9 · 11',
    tag: 'Quang học',
    Icon: IcoOptics,
    mascot: '/img/elec/elec-think.png',
    tip: 'Với thấu kính hội tụ (f > 0): khi đặt vật trong khoảng tiêu cự (d < f), chùm tia ló phân kì và kéo dài cắt nhau tạo ảnh ảo cùng chiều, lớn hơn vật.',
  },
  {
    id: 'wave',
    num: '04',
    label: 'Sóng 2D & Giao thoa',
    grade: 'Lớp 11',
    tag: 'Sóng cơ',
    Icon: IcoWave,
    mascot: '/img/elec/elec-heart-eyes.png',
    tip: 'Khi đổi hai nguồn từ cùng pha sang ngược pha, đường trung trực của S₁S₂ lập tức chuyển từ vân cực đại giao thoa thành vân cực tiểu đứng yên!',
  },
  {
    id: 'mechanics',
    num: '05',
    label: 'Cơ học 2D & Va chạm',
    grade: 'Lớp 10',
    tag: 'Động lượng',
    Icon: IcoCollide,
    mascot: '/img/elec/elec-celebrate.png',
    tip: 'Giữ và kéo chuột trực tiếp trên sân khấu để bắn thêm quả cầu mới. Với hệ số đàn hồi e = 1, cả tổng động lượng và tổng động năng đều bảo toàn.',
  },
  {
    id: 'pendulum',
    num: '06',
    label: 'Con lắc kép (Chaos RK4)',
    grade: 'Nâng cao',
    tag: 'Hỗn loạn',
    Icon: IcoPendulum,
    mascot: '/img/elec/elec-shocked.png',
    tip: 'Bật “Hiệu ứng Cánh bướm” để thấy 2 con lắc chỉ lệch nhau 0,1° lúc đầu nhưng sau vài giây đã phân kì thành hai quỹ đạo hoàn toàn khác nhau!',
  },
  {
    id: 'olympiad',
    num: '07',
    label: 'Thí nghiệm 8–12 & Olympiad',
    grade: 'Lớp 8–12',
    tag: 'Số liệu OLS',
    Icon: IcoLab,
    mascot: '/img/elec/elec-happy.png',
    tip: 'Trong bài thí nghiệm đo g, người ta vẽ đồ thị T² theo l (thay vì T theo l) để tuyến tính hóa phương trình về dạng y = a·x giúp tính hệ số góc chính xác nhất.',
  },
];

const VALID_SIM_IDS = new Set(MODULES.map((m) => m.id));

function readSimFromHash() {
  if (typeof window === 'undefined') return 'projectile';
  const queryPart = (window.location.hash || '').split('?')[1] || '';
  const sim = new URLSearchParams(queryPart).get('sim');
  return sim && VALID_SIM_IDS.has(sim) ? sim : 'projectile';
}

export default function PhysicsLabPage({ onNavigate }) {
  const [activeId, setActiveId] = useState(readSimFromHash);
  const [casioOpen, setCasioOpen] = useState(false);

  useEffect(() => {
    const syncFromHash = () => {
      const next = readSimFromHash();
      setActiveId(next);
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const selectSim = (id) => {
    setActiveId(id);
    if (typeof window !== 'undefined' && window.location.hash !== `#physics-lab?sim=${id}`) {
      window.history.replaceState(null, '', `#physics-lab?sim=${id}`);
    }
  };

  const handleAskAI = (prompt) => {
    askAI(prompt);
  };

  const activeMod = MODULES.find((m) => m.id === activeId) || MODULES[0];

  return (
    <section className="wrap pl-page">
      {/* HEADER KÍNH MỜ SANG TRỌNG — 1 DẢI GỌN SẠCH, KHÔNG NÚT RƯỜM RÀ */}
      <header className="pl-topbar">
        <div className="pl-brand">
          <div className="pl-mascot-wrap">
            <img
              src={activeMod.mascot}
              alt="ELEC Vật lí Studio"
              className="pl-mascot"
              width="52"
              height="52"
            />
            <span className="pl-live-dot" aria-hidden="true" />
          </div>
          <div>
            <div className="pl-title-row">
              <h1>Phòng Thí Nghiệm Vật Lí Ảo</h1>
              <span className="pl-pill-badge">GDPT 2018 · Studio Pro</span>
              <span className="pl-pill-active">{activeMod.tag} · {activeMod.grade}</span>
            </div>
            <p>Mô phỏng tương tác 60fps thời gian thực · Đo đạc số liệu &amp; kiểm chứng định luật Vật lí cùng ELEC AI</p>
          </div>
        </div>

        <div className="pl-top-actions">
          <button
            type="button"
            className={`pl-top-btn${casioOpen ? ' is-on' : ''}`}
            onClick={() => setCasioOpen((v) => !v)}
          >
            <IcoCalc />
            <span>Casio fx-580</span>
          </button>
          {onNavigate && (
            <>
              <button type="button" className="pl-top-btn" onClick={() => onNavigate('sim-lab')}>
                <IcoWave />
                <span>Mạch RLC &amp; Y-âng</span>
              </button>
              <button type="button" className="pl-top-btn" onClick={() => onNavigate('formulas')}>
                <IcoFormula />
                <span>Sổ công thức Lý</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* BỐ CỤC WORKBENCH 2 CỘT: SIDEBAR CHỌN THÍ NGHIỆM + SÂN KHẤU TƯƠNG TÁC */}
      <div className="pl-workbench">
        <aside className="pl-sidebar" aria-label="Danh mục thí nghiệm Vật lí">
          <div className="pl-sb-head">
            <span className="pl-sb-kicker">CHUYÊN ĐỀ THÍ NGHIỆM</span>
            <span className="pl-sb-count">7 MÔ PHỎNG</span>
          </div>

          <div className="pl-sb-list">
            {MODULES.map((m) => {
              const Icon = m.Icon;
              const isActive = activeId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`pl-sb-item${isActive ? ' is-active' : ''}`}
                  onClick={() => selectSim(m.id)}
                >
                  <span className="pl-sb-ico"><Icon /></span>
                  <span className="pl-sb-text">
                    <b>{m.label}</b>
                    <small>{m.tag} · {m.grade}</small>
                  </span>
                  <span className="pl-sb-num">{m.num}</span>
                </button>
              );
            })}
          </div>

          {/* Thẻ Mẹo Thực Hành Bé Elec tự động đổi theo bài thí nghiệm */}
          <div className="pl-sb-tip">
            <div className="pl-sb-tip-head">
              <img src={activeMod.mascot} alt="Bé Elec" width="32" height="32" />
              <div>
                <b>Góc nhìn Vật lí</b>
                <span>{activeMod.label}</span>
              </div>
            </div>
            <p>{activeMod.tip}</p>
          </div>
        </aside>

        {/* Thanh chọn ngang gọn cho Mobile/Tablet */}
        <div className="pl-mobile-tabs">
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`pl-m-tab${activeId === m.id ? ' is-active' : ''}`}
              onClick={() => selectSim(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <main className="pl-main">
          {activeId === 'projectile' && <ProjectileSim onAskAI={handleAskAI} />}
          {activeId === 'circuit' && <CircuitSim onAskAI={handleAskAI} />}
          {activeId === 'optics' && <RayOpticsSim onAskAI={handleAskAI} />}
          {activeId === 'wave' && <WaveInterferenceSim onAskAI={handleAskAI} />}
          {activeId === 'mechanics' && <Mechanics2DSim onAskAI={handleAskAI} />}
          {activeId === 'pendulum' && <DoublePendulumSim onAskAI={handleAskAI} />}
          {activeId === 'olympiad' && <OlympiadLabSim onAskAI={handleAskAI} />}
          <PhysicsInquiryWorkbench simId={activeId} onAskAI={handleAskAI} />
        </main>
      </div>

      {/* CỬA SỔ NỔI CASIO fx-580VN X NGAY TRONG PHÒNG THÍ NGHIỆM VẬT LÍ */}
      {casioOpen && (
        <div className="pl-casio-dock" role="dialog" aria-label="Máy tính Casio fx-580VN X">
          <div className="pl-casio-head">
            <div className="pl-casio-title">
              <IcoCalc />
              <span>Casio fx-580VN X</span>
              <small>PHYSICS LAB</small>
            </div>
            <button type="button" className="pl-casio-close" onClick={() => setCasioOpen(false)} aria-label="Đóng máy tính">✕</button>
          </div>
          <div className="pl-casio-body">
            <Suspense fallback={<div className="pl-casio-loading">Đang khởi động Casio fx-580VN X…</div>}>
              <Casio580Widget compact captureKeyboard={false} />
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
}
