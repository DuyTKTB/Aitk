import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth.jsx';
import '../styles/intro-loader.css';

/* Transition quán tính vật lý (Spring / EaseOut) chuẩn VisionOS / iOS */
export const LOGO_GLIDE_TRANSITION = {
  type: 'spring',
  stiffness: 130,
  damping: 20,
  mass: 0.8,
};

const IntroContext = createContext({
  playing: false,
  done: true,
  skip: () => {},
});

export const useElecIntro = () => useContext(IntroContext);

export function IntroProvider({ children }) {
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);

  // Lấy trạng thái auth (nếu có AuthProvider) để chỉ glide khi app đã mount và sẵn sàng
  let isAuthReady = true;
  try {
    const auth = useAuth();
    if (auth && typeof auth.ready === 'boolean') {
      isAuthReady = auth.ready;
    }
  } catch {
    isAuthReady = true;
  }

  const skip = useCallback(() => {
    setPlaying(false);
    setDone(true);
  }, []);

  useEffect(() => {
    // Xóa bỏ bất kỳ session flag nào còn sót lại để luôn hoạt động khi F5 / mở trang
    try {
      sessionStorage.removeItem('elec-intro-played');
    } catch {}

    // Khóa scroll trong lúc intro đang diễn ra
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    // Chỉ bắt đầu đếm giờ glide khi auth và app đã sẵn sàng
    if (!isAuthReady) {
      return () => {
        document.documentElement.style.overflow = prevOverflow;
      };
    }

    // 1100ms: Logo chuyển động ở trung tâm, sau đó glide dứt khoát vào Navbar
    const tGlide = setTimeout(() => {
      setPlaying(false);
    }, 1100);

    // 1850ms: Hoàn tất chuyển động hạ cánh vào Navbar, mở khóa trang web
    const tDone = setTimeout(() => {
      document.documentElement.style.overflow = prevOverflow;
      setDone(true);
    }, 1850);

    // Nhấp chuột hoặc bấm bất kỳ phím nào để skip ngay lập tức
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        document.documentElement.style.overflow = prevOverflow;
        skip();
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(tGlide);
      clearTimeout(tDone);
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isAuthReady, skip]);

  return (
    <IntroContext.Provider value={{ playing, done, skip }}>
      {children}
      <ElecIntroOverlay playing={playing} done={done} skip={skip} />
    </IntroContext.Provider>
  );
}

function ElecIntroOverlay({ playing, done, skip }) {
  if (done) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="elec-intro-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: playing ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onClick={skip}
          role="presentation"
          aria-label="ELEC AI Splash Intro"
        >
          {/* Duy nhất khối Logo chính chuyển động ở trung tâm - Không hiệu ứng nền rườm rà */}
          {playing && (
            <div className="elec-intro-brand-box">
              <motion.div
                layoutId="elec-brand-logo"
                transition={{ layout: LOGO_GLIDE_TRANSITION }}
                className="elec-intro-logo-motion-wrap"
              >
                <motion.img
                  src="/img/logo.png"
                  alt="ELEC AI"
                  className="elec-intro-logo-clean"
                  initial={{ scale: 0.82, opacity: 0 }}
                  animate={{ scale: [0.82, 1.05, 1], opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ElecIntroLoader() {
  // IntroProvider đã render overlay trực tiếp tại root
  return null;
}

/* ============================================================
   PAGE LOADER NÂNG CẤP DÀNH CHO SUSPENSE / CHUYỂN TRANG
   ============================================================ */
export function PageLoader() {
  return (
    <div className="elec-page-loader" role="status" aria-live="polite">
      <div className="elec-page-loader-core">
        <img src="/img/logo.png" alt="ELEC AI" className="elec-page-loader-logo" />
        <div className="elec-page-loader-ring" />
      </div>
      <div className="elec-page-loader-shimmer">
        <span className="elec-page-loader-dot" />
        <span>Đang kết nối ELEC AI…</span>
      </div>
    </div>
  );
}
