import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const KEY = 'app-settings-v1';
const BASE_TITLE = 'ELEC AI';

const DEFAULT = {
  siteName: BASE_TITLE,
  siteDesc: 'Học Khoa học Tự nhiên thông minh hơn',
  enableAI: true,
  enableChat: true,
  enablePet: true,
  enableGames: true,
  enableQuiz: true,
  maintenanceMode: false,
  announcementEnabled: false,
  announcementText: '',
  announcementLink: '',
  announcementBadge: '🔥 Nổi bật',
  announcementTheme: 'cobalt',
  announcementDisplay: 'banner',
  announcementAudience: 'all',
  announcementCtaText: 'Khám phá ngay',
  announcementStartAt: '',
  announcementEndAt: '',
  announcementShowCountdown: false,
  announcementDismissible: true,
  announcementVersion: 1,
  announcementImage: '',
  announcementImageFit: 'cover',
};

const SettingsContext = createContext({
  settings: DEFAULT,
  updateSettings: () => {},
  resetSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  // Đồng bộ cấu hình toàn cục từ Firestore (siteConfig/global)
  useEffect(() => {
    if (!db) return undefined;
    try {
      const ref = doc(db, 'siteConfig', 'global');
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const remote = snap.data() || {};
            setSettings((prev) => ({ ...DEFAULT, ...prev, ...remote }));
          }
        },
        () => {}
      );
      return () => unsub();
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    // Giữ nguyên <title> và <meta name="description"> chuẩn SEO thương hiệu "ELEC AI"
    // do useSeoHead.js & prerender-seo-routes.mjs quản lý — không ghi đè bằng siteName/siteDesc từ Firestore.
    document.body.classList.toggle('hide-ai', !settings.enableAI);
    document.body.classList.toggle('hide-chat', !settings.enableChat);
    document.body.classList.toggle('hide-pet', !settings.enablePet);
    document.body.classList.toggle('hide-games', !settings.enableGames);
    document.body.classList.toggle('hide-quiz', !settings.enableQuiz);
    document.body.classList.toggle('maintenance-mode', settings.maintenanceMode);
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch { /* noop */ }
  }, [settings]);

  const updateSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (db) {
      await setDoc(doc(db, 'siteConfig', 'global'), { ...next, updatedAt: Date.now() }, { merge: true });
    }
    return next;
  };

  const resetSettings = async () => {
    setSettings(DEFAULT);
    if (db) {
      await setDoc(doc(db, 'siteConfig', 'global'), { ...DEFAULT, updatedAt: Date.now() }, { merge: true });
    }
    return DEFAULT;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings phải dùng trong SettingsProvider');
  return ctx;
}
