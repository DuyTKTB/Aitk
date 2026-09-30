import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuth,
  register,
  login,
  logout,
  loginWithGoogle,
  updateDisplayName,
  changePassword,
  sendVerifyEmail,
  reloadUser,
} from '../lib/firebase.js';
import { getTier, syncUserInfo, clearTierCache, TIERS } from '../lib/tier.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [tier, setTier] = useState(TIERS.free);
  const [isAdmin, setIsAdmin] = useState(false);

  // Kiểm tra admin
  const checkAdmin = async (uid) => {
    if (!uid) return false;
    try {
      const DB = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '');
      if (!/^https?:\/\//.test(DB)) return false;
      const res = await fetch(`${DB}/admins/${uid}.json`);
      if (!res.ok) return false;
      const v = await res.json();
      return v === true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      setUser(u);
      setReady(true);

      if (u) {
        // Sync thông tin user lên DB (lần đầu tạo)
        await syncUserInfo(u);

        // Lấy tier và check admin song song
        const [t, admin] = await Promise.all([
          getTier(u.uid),
          checkAdmin(u.uid),
        ]);
        setTier(t);
        setIsAdmin(admin);
      } else {
        setTier(TIERS.free);
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // Refresh tier (khi admin vừa nâng cấp user)
  const refreshTier = async () => {
    if (!user?.uid) return TIERS.free;
    clearTierCache(user.uid);
    const t = await getTier(user.uid);
    setTier(t);
    return t;
  };

  // Refresh user (sau khi đổi tên / verify email)
  const refreshUser = async () => {
    const u = await reloadUser();
    if (u) setUser({ ...u });
    return u;
  };

  // Refresh admin status
  const refreshAdmin = async () => {
    if (!user?.uid) return false;
    const a = await checkAdmin(user.uid);
    setIsAdmin(a);
    return a;
  };

  const value = {
    user,
    tier,
    ready,
    isAdmin,
    register,
    login,
    logout,
    loginWithGoogle,
    updateDisplayName,
    changePassword,
    sendVerifyEmail,
    refreshUser,
    refreshTier,
    refreshAdmin,
    isLoggedIn: Boolean(user),
    isVip: tier?.key === 'vip',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
}