import { createContext, useContext, useCallback } from 'react';
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
  // Không chặn màn hình bằng splash overlay 1,85s lúc tải trang (tối ưu FCP/LCP/Speed Index)
  const skip = useCallback(() => {}, []);

  return (
    <IntroContext.Provider value={{ playing: false, done: true, skip }}>
      {children}
    </IntroContext.Provider>
  );
}

export default function ElecIntroLoader() {
  return null;
}

/* ============================================================
   PAGE LOADER NÂNG CẤP DÀNH CHO SUSPENSE / CHUYỂN TRANG
   ============================================================ */
export function PageLoader() {
  return (
    <div className="elec-page-loader" role="status" aria-live="polite">
      <div className="elec-page-loader-core">
        <img src="/img/logo-96.webp" width="52" height="52" alt="ELEC AI" className="elec-page-loader-logo" decoding="async" />
        <div className="elec-page-loader-ring" />
      </div>
      <div className="elec-page-loader-shimmer">
        <span className="elec-page-loader-dot" />
        <span>Đang kết nối ELEC AI…</span>
      </div>
    </div>
  );
}
