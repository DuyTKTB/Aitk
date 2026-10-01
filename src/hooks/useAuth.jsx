import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase.js';

const DEFAULT_TIER = {
  key: 'free',
  name: 'Miễn phí',
  color: '#3b82f6',
  quotaText: 20,
  quotaImage: 5,
};

const TIERS = {
  free: DEFAULT_TIER,
  vip: {
    key: 'vip',
    name: 'CUAI VIP',
    color: 'linear-gradient(135deg, #ffb020, #ff8800)',
    quotaText: Infinity,
    quotaImage: Infinity,
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => setReady(true), 2000);
    let unsub = () => {};

    try {
      unsub = onAuthStateChanged(auth, async (u) => {
        clearTimeout(fallbackTimer);

        if (!u) {
          setUser(null);
          setReady(true);
          return;
        }

        let cachedTier = DEFAULT_TIER;
        try {
          const cached = localStorage.getItem('cs-user-tier');
          if (cached) cachedTier = JSON.parse(cached);
        } catch { /* ignore */ }

        setUser({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          emailVerified: u.emailVerified,
          tier: cachedTier,
        });
        setReady(true);

        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            const tierKey = data.tier || 'free';
            const tier = TIERS[tierKey] || DEFAULT_TIER;

            setUser((prev) => prev && prev.uid === u.uid ? { ...prev, tier } : prev);
            try { localStorage.setItem('cs-user-tier', JSON.stringify(tier)); } catch { /* ignore */ }
          }
        } catch (err) {
          console.warn('[useAuth] Không lấy được tier:', err);
        }
      });
    } catch (err) {
      console.error('[useAuth] Lỗi khởi tạo auth:', err);
      setReady(true);
    }

    return () => {
      clearTimeout(fallbackTimer);
      unsub();
    };
  }, []);

  /* ============ ĐĂNG KÝ ============ */
  const register = useCallback(async (email, password, firstName, lastName, rememberMe = true) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = `${lastName} ${firstName}`.trim();
    await updateProfile(cred.user, { displayName });

    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        email, firstName, lastName, displayName,
        tier: 'free',
        createdAt: serverTimestamp(),
      });
    } catch (err) { console.warn('[useAuth] Không lưu được user:', err); }

    try { await sendEmailVerification(cred.user); } catch { /* ignore */ }
    return cred.user;
  }, []);

  /* ============ ĐĂNG NHẬP ============ */
  const login = useCallback(async (email, password, rememberMe = true) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }, []);

  /* ============ GOOGLE ============ */
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const cred = await signInWithPopup(auth, provider);

    try {
      const ref = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const fullName = cred.user.displayName || '';
        const parts = fullName.split(' ');
        const lastName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
        const firstName = parts.length > 0 ? parts.slice(-1)[0] : '';
        await setDoc(ref, {
          email: cred.user.email, firstName, lastName,
          displayName: fullName, photoURL: cred.user.photoURL || '',
          tier: 'free', createdAt: serverTimestamp(),
        });
      }
    } catch (err) { console.warn('[useAuth] Lỗi lưu user Google:', err); }
    return cred.user;
  }, []);

  /* ============ FACEBOOK ============ */
  const loginFacebook = useCallback(async () => {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.setCustomParameters({ display: 'popup' });
    const cred = await signInWithPopup(auth, provider);

    try {
      const ref = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const fullName = cred.user.displayName || '';
        const parts = fullName.split(' ');
        const lastName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
        const firstName = parts.length > 0 ? parts.slice(-1)[0] : '';
        await setDoc(ref, {
          email: cred.user.email, firstName, lastName,
          displayName: fullName, photoURL: cred.user.photoURL || '',
          tier: 'free', createdAt: serverTimestamp(),
        });
      }
    } catch (err) { console.warn('[useAuth] Lỗi lưu user Facebook:', err); }
    return cred.user;
  }, []);

  /* ============ UPLOAD AVATAR ============ */
  const uploadAvatar = useCallback(async (file) => {
    if (!auth.currentUser) throw new Error('Chưa đăng nhập');
    if (!file) throw new Error('Không có file');
    if (!file.type.startsWith('image/')) throw new Error('Chỉ chấp nhận file ảnh');
    if (file.size > 2 * 1024 * 1024) throw new Error('Ảnh phải nhỏ hơn 2MB');

    const uid = auth.currentUser.uid;
    const path = `avatars/${uid}/${Date.now()}_${file.name}`;
    const ref = storageRef(storage, path);

    await uploadBytes(ref, file);
    const url = await getDownloadURL(ref);

    await updateProfile(auth.currentUser, { photoURL: url });
    try {
      await updateDoc(doc(db, 'users', uid), { photoURL: url });
    } catch (err) { console.warn('[useAuth] Không lưu photoURL vào Firestore:', err); }

    setUser((prev) => prev ? { ...prev, photoURL: url } : prev);
    return url;
  }, []);

  /* ============ REFRESH USER ============ */
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return null;
    await auth.currentUser.reload();
    const u = auth.currentUser;
    setUser((prev) => prev ? {
      ...prev,
      displayName: u.displayName || '',
      photoURL: u.photoURL || '',
      emailVerified: u.emailVerified,
    } : prev);
    return u;
  }, []);

  /* ============ REFRESH TIER ============ */
  const refreshTier = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        const tierKey = data.tier || 'free';
        const tier = TIERS[tierKey] || DEFAULT_TIER;
        setUser((prev) => prev ? { ...prev, tier } : prev);
        try { localStorage.setItem('cs-user-tier', JSON.stringify(tier)); } catch { /* ignore */ }
      }
    } catch (err) { console.warn('[useAuth] Lỗi refresh tier:', err); }
  }, []);

  /* ============ ĐỔI TÊN ============ */
  const updateDisplayName = useCallback(async (name) => {
    if (!auth.currentUser) throw new Error('Chưa đăng nhập');
    await updateProfile(auth.currentUser, { displayName: name.trim() });
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name.trim() });
    } catch (err) { console.warn('[useAuth] Không lưu displayName:', err); }
    setUser((prev) => prev ? { ...prev, displayName: name.trim() } : prev);
    return auth.currentUser;
  }, []);

  /* ============ QUÊN MẬT KHẨU ============ */
  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  /* ============ GỬI LẠI VERIFY ============ */
  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Chưa đăng nhập');
    await sendEmailVerification(auth.currentUser);
  }, []);

  /* ============ ĐĂNG XUẤT ============ */
const logout = useCallback(async () => {
  try {
    await signOut(auth);
    // 👇 THÊM DÒNG NÀY — reset hash về home sau khi đăng xuất
    location.hash = 'home';
  } catch (e) {
    console.error('Logout error:', e);
  }
}, []);

  const value = {
    user,
    tier: user?.tier || DEFAULT_TIER,
    ready,
    isLoggedIn: !!user,
    register, login, loginWithGoogle, loginFacebook,
    resetPassword, resendVerification,
    uploadAvatar, refreshUser, refreshTier, updateDisplayName,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider');
  return ctx;
}