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

  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : BASE_TITLE);
  useEffect(() => {
    const newName = settings.siteName || BASE_TITLE;
    const currentTitle = document.title || '';
    if (currentTitle.includes(BASE_TITLE)) {
      document.title = currentTitle.replace(BASE_TITLE, newName);
    } else if (currentTitle.includes(settings.siteName) && settings.siteName !== newName) {
      document.title = currentTitle.replace(settings.siteName, newName);
    } else if (originalTitle.current.includes(BASE_TITLE)) {
      document.title = originalTitle.current.replace(BASE_TITLE, newName);
    }
    // Chỉ ghi đè meta description nếu admin thực sự tùy chỉnh khác mặc định (tránh ghi đè mô tả SEO chi tiết của từng trang)
    if (settings.siteDesc && settings.siteDesc !== DEFAULT.siteDesc) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = settings.siteDesc;
    }
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

  const updateSettings = (patch) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (db) {
        setDoc(doc(db, 'siteConfig', 'global'), { ...next, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      }
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT);
    if (db) {
      setDoc(doc(db, 'siteConfig', 'global'), { ...DEFAULT, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
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
