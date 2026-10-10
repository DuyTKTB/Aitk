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
import { getTier } from '../lib/tier.js';   // ← SỬA: getTier thay vì getUserTier

const AuthContext = createContext(null);

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mountedRef.current) return;
      if (u) {
        setUser(u);
        setIsLoggedIn(true);
        try {
          const t = await getTier(u.uid);   // ← SỬA: truyền u.uid
          if (mountedRef.current) setTier(t);
        } catch {
          if (mountedRef.current) setTier({ key: 'free', name: 'Free', desc: 'Miễn phí' });
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

  const register = useCallback(async (email, password, displayName, opts = {}) => {
    const { role = 'student' } = opts;
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
      }, { merge: true });
    } catch (e) {
      console.warn('Không lưu user metadata:', e);
    }

    try {
      const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
      meta[cred.user.uid] = { role, email };
      localStorage.setItem('cs-user-meta', JSON.stringify(meta));
    } catch {}

    try {
      await cred.user.reload();
      if (mountedRef.current) setUser({ ...auth.currentUser });
    } catch {}

    return cred.user;
  }, []);

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
    } catch {}
    return cred.user;
  }, []);

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
    } catch {}

    return cred.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateDisplayName = useCallback(async (name) => {
    if (!auth.currentUser) throw new Error('Chưa đăng nhập');
    await updateProfile(auth.currentUser, { displayName: name });
    await auth.currentUser.reload();
    if (mountedRef.current) setUser({ ...auth.currentUser });
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    const u = auth.currentUser;
    if (!u || !u.email) throw new Error('Chưa đăng nhập');
    const cred = EmailAuthProvider.credential(u.email, oldPassword);
    await reauthenticateWithCredential(u, cred);
    await updatePassword(u, newPassword);
  }, []);

  const sendVerifyEmail = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) throw new Error('Chưa đăng nhập');
    await sendEmailVerification(u);
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return null;
    await u.reload();
    if (mountedRef.current) setUser({ ...auth.currentUser });
    return auth.currentUser;
  }, []);

  const refreshTier = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return null;
    const t = await getTier(u.uid);   // ← SỬA
    if (mountedRef.current) setTier(t);
    return t;
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    return fbUploadAvatar(file);
  }, []);

  const value = {
    user,
    tier,
    ready,
    isLoggedIn,
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