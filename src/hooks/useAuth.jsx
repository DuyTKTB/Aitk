import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, uploadAvatar as fbUploadAvatar } from '../lib/firebase.js';
import { supabase } from '../lib/supabase.js';
import { getTier } from '../lib/tier.js';

const AuthContext = createContext(null);

/* ============================================================
   Gán custom claims vào user object
   ------------------------------------------------------------
   Firebase User là instance của class — không spread được.
   Phải gán trực tiếp thuộc tính để giữ nguyên method.
   ============================================================ */
async function enrichUser(u, forceRefresh = false) {
  if (!u) return null;
  try {
    const tokenResult = await u.getIdTokenResult(forceRefresh);
    const claims = tokenResult?.claims || {};
    u.claims = claims;
    u.isAdmin = claims.admin === true;
  } catch (e) {
    // Không lấy được token — vẫn trả user, chỉ thiếu claims
    u.claims = u.claims || {};
    u.isAdmin = u.claims.admin === true;
    console.warn('[useAuth] Không lấy được ID token result:', e?.message);
  }
  return u;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState(null);
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /* ============ AUTH STATE ============ */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mountedRef.current) return;

      if (u) {
        // Điền email vào Supabase profiles (RLS: tự ghi dòng của mình) — fire-and-forget
        if (u.email) {
          supabase
            .from('profiles')
            .upsert({ id: u.uid, email: u.email }, { onConflict: 'id' })
            .then(({ error }) => {
              if (error) console.warn('[profiles] Điền email lỗi:', error.message);
            });
        }
        const enriched = await enrichUser(u);
        if (!mountedRef.current) return;
        setUser(enriched ? { ...enriched } : u);
        setIsLoggedIn(true);

        try {
          const t = await getTier(u.uid);
          if (mountedRef.current) setTier(t);
        } catch {
          if (mountedRef.current) {
            setTier({ key: 'free', name: 'Free', desc: 'Miễn phí' });
          }
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setTier(null);
      }
      if (mountedRef.current) setReady(true);
    });
    return () => unsub();
  }, []);

  /* ============ REFRESH CLAIMS KHI QUAY LẠI TAB ============ */
  /* Tránh trường hợp admin vừa được cấp claim ở tab khác mà không thấy cập nhật */
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const onVisible = async () => {
      if (document.hidden) return;
      const u = auth.currentUser;
      if (!u) return;
      const enriched = await enrichUser(u, true);
      if (mountedRef.current && enriched) setUser({ ...enriched });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isLoggedIn]);

  /* ============ REGISTER ============ */
  const register = useCallback(async (email, password, displayName, opts = {}) => {
    /* role chỉ nhận student/teacher — rules cũng chặn nếu cố gửi giá trị khác */
    const { role = 'student', school = '', termsAcceptedAt = 0 } = opts;
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        role,
        email,
        displayName: displayName || '',
        createdAt: new Date().toISOString(),
        ...(school ? { school: String(school).trim().slice(0, 80) } : {}),
        ...(termsAcceptedAt ? { termsAcceptedAt, termsVersion: 'v1' } : {}),
      }, { merge: true });
    } catch (e) {
      console.warn('Không lưu user metadata:', e);
    }

    try {
      const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
      meta[cred.user.uid] = { role, email };
      localStorage.setItem('cs-user-meta', JSON.stringify(meta));
    } catch { /* ignore */ }

    try {
      await cred.user.reload();
      const enriched = await enrichUser(auth.currentUser);
      if (mountedRef.current && enriched) setUser({ ...enriched });
    } catch { /* ignore */ }

    return cred.user;
  }, []);

  /* ============ LOGIN ============ */
  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        const role = snap.data()?.role || 'student';
        const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
        meta[cred.user.uid] = { role, email };
        localStorage.setItem('cs-user-meta', JSON.stringify(meta));
      }
    } catch { /* ignore */ }

    // Force refresh token để lấy claim mới (quan trọng sau khi setAdminClaim)
    const enriched = await enrichUser(cred.user, true);
    if (mountedRef.current && enriched) setUser({ ...enriched });

    return cred.user;
  }, []);

  /* ============ LOGIN GOOGLE ============ */
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);

    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, 'users', cred.user.uid), {
          role: 'student',
          email: cred.user.email,
          displayName: cred.user.displayName || '',
          createdAt: new Date().toISOString(),
        });
      }
      const role = snap.exists() ? snap.data()?.role : 'student';
      const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
      meta[cred.user.uid] = { role, email: cred.user.email };
      localStorage.setItem('cs-user-meta', JSON.stringify(meta));
    } catch { /* ignore */ }

    const enriched = await enrichUser(cred.user, true);
    if (mountedRef.current && enriched) setUser({ ...enriched });

    return cred.user;
  }, []);

  /* ============ LOGOUT ============ */
  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  /* ============ UPDATE DISPLAY NAME ============ */
  const updateDisplayName = useCallback(async (name) => {
    if (!auth.currentUser) throw new Error('Chưa đăng nhập');
    await updateProfile(auth.currentUser, { displayName: name });
    await auth.currentUser.reload();
    const enriched = await enrichUser(auth.currentUser);
    if (mountedRef.current && enriched) setUser({ ...enriched });
  }, []);

  /* ============ CHANGE PASSWORD ============ */
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    const u = auth.currentUser;
    if (!u || !u.email) throw new Error('Chưa đăng nhập');
    const cred = EmailAuthProvider.credential(u.email, oldPassword);
    await reauthenticateWithCredential(u, cred);
    await updatePassword(u, newPassword);
  }, []);

  /* ============ SEND VERIFY EMAIL ============ */
  const sendVerifyEmail = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) throw new Error('Chưa đăng nhập');
    await sendEmailVerification(u);
  }, []);

  /* ============ RESET PASSWORD ============ */
  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  /* ============ REFRESH USER ============ */
  const refreshUser = useCallback(async (forceRefresh = true) => {
    const u = auth.currentUser;
    if (!u) return null;
    await u.reload();
    const enriched = await enrichUser(u, forceRefresh);
    if (mountedRef.current && enriched) setUser({ ...enriched });
    return enriched;
  }, []);

  /* ============ REFRESH TIER ============ */
  const refreshTier = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return null;
    const t = await getTier(u.uid);
    if (mountedRef.current) setTier(t);
    return t;
  }, []);

  /* ============ UPLOAD AVATAR ============ */
  const uploadAvatar = useCallback(async (file) => {
    return fbUploadAvatar(file);
  }, []);

  /* ============ CONTEXT VALUE ============ */
  const value = {
    user,
    tier,
    ready,
    isLoggedIn,
    // Tiện: dùng trực tiếp không cần gọi isAdmin(user)
    isAdmin: user?.isAdmin === true,
    register,
    login,
    loginWithGoogle,
    logout,
    updateDisplayName,
    changePassword,
    sendVerifyEmail,
    resetPassword,
    refreshUser,
    refreshTier,
    uploadAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
}