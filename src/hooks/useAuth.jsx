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
  signInWithRedirect,
  getRedirectResult,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, uploadAvatar as fbUploadAvatar } from '../lib/firebase.js';
import { supabase } from '../lib/supabase.js';
import { getTier } from '../lib/tier.js';
import { saveUserProfile, syncUserProfileFromCloud } from '../lib/userProfileService.js';
import { canonicalizeEmail } from '../lib/authValidation.js';
import { requestBrandedPasswordReset } from '../lib/emailOtp.js';

const AuthContext = createContext(null);
const GOOGLE_REDIRECT_OPTS_KEY = 'elec-google-redirect-opts';
const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/**
 * Khởi tạo hoặc cập nhật hồ sơ Firestore + LocalStorage cho tài khoản Google.
 */
async function syncGoogleUserDocument(firebaseUser, opts = {}) {
  const requestedRole = opts?.role === 'teacher' ? 'teacher' : 'student';
  const cleanSchool = opts?.school ? String(opts.school).trim().slice(0, 80) : '';
  const termsAcceptedAt = Number(opts?.termsAcceptedAt) || 0;
  const nowIso = new Date().toISOString();

  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        role: requestedRole,
        email: firebaseUser.email || '',
        canonicalEmail: canonicalizeEmail(firebaseUser.email || ''),
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        authProvider: 'google',
        createdAt: nowIso,
        lastLoginAt: nowIso,
        ...(cleanSchool ? { school: cleanSchool } : {}),
        ...(termsAcceptedAt ? { termsAcceptedAt, termsVersion: 'v1' } : {}),
      });
      saveUserProfile(firebaseUser.uid, {
        fullName: firebaseUser.displayName || '',
        ...(cleanSchool ? { highSchool: cleanSchool } : {}),
        ...(requestedRole === 'teacher'
          ? { grade: 'Sinh viên / Giáo viên', survey: { role: 'teacher' } }
          : { survey: { role: 'student' } }),
      });
    } else {
      // Cập nhật thông tin xác thực mới nhất từ Google nhưng không ghi đè hồ sơ đã chỉnh tay hay role
      setDoc(userRef, {
        lastLoginAt: nowIso,
        ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
      }, { merge: true }).catch(() => {});
    }
    const role = snap.exists() ? (snap.data()?.role || 'student') : requestedRole;
    const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
    meta[firebaseUser.uid] = { role, email: firebaseUser.email };
    localStorage.setItem('cs-user-meta', JSON.stringify(meta));
  } catch { /* ignore */ }
}

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
  const [profileReady, setProfileReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRedirectError, setAuthRedirectError] = useState('');
  const mountedRef = useRef(true);

  const clearAuthRedirectError = useCallback(() => setAuthRedirectError(''), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /* ============ AUTH STATE ============ */
  useEffect(() => {
    // Hoàn tất phiên đăng nhập Google nếu vừa quay lại từ signInWithRedirect (khi popup bị chặn)
    const redirectPromise = getRedirectResult(auth)
      .then(async (cred) => {
        let savedOpts = {};
        try {
          savedOpts = JSON.parse(sessionStorage.getItem(GOOGLE_REDIRECT_OPTS_KEY) || '{}') || {};
          sessionStorage.removeItem(GOOGLE_REDIRECT_OPTS_KEY);
        } catch { /* ignore */ }
        if (cred?.user) {
          await syncGoogleUserDocument(cred.user, savedOpts);
        }
      })
      .catch((err) => {
        try { sessionStorage.removeItem(GOOGLE_REDIRECT_OPTS_KEY); } catch { /* ignore */ }
        const code = String(err?.code || '');
        if (code && mountedRef.current) setAuthRedirectError(code);
        console.error('[useAuth] Google redirect error:', code, err?.message);
      });

    const unsub = onAuthStateChanged(auth, async (u) => {
      await redirectPromise;
      if (!mountedRef.current) return;

      if (u) {
        // Điền email & tên hiển thị vào Supabase profiles (RLS: tự ghi dòng của mình) — fire-and-forget
        if (u.email) {
          const profPayload = {
            id: u.uid,
            email: u.email,
            ...(u.displayName ? { display_name: u.displayName } : {}),
            ...(u.photoURL ? { avatar_url: u.photoURL } : {}),
          };
          supabase
            .from('profiles')
            .upsert(profPayload, { onConflict: 'id' })
            .then(({ error }) => {
              if (error) console.warn('[profiles] Điền email lỗi:', error.message);
            });
        }
        const enriched = await enrichUser(u);
        if (!mountedRef.current) return;
        setUser(enriched ? { ...enriched } : u);
        setIsLoggedIn(true);

        // Đồng bộ hồ sơ & khảo sát từ Firestore về LocalStorage cho đúng user hiện tại
        syncUserProfileFromCloud(u.uid, u)
          .catch(() => {})
          .finally(() => {
            if (mountedRef.current) setProfileReady(true);
          });

        try {
          const t = await getTier(u.uid);
          if (mountedRef.current) setTier(t);
        } catch {
          if (mountedRef.current) {
            setTier({ key: 'free', name: 'Free', desc: 'Miễn phí' });
          }
        }
      } else {
        const devMock = typeof window !== 'undefined' ? localStorage.getItem('cs-dev-mock-user') : null;
        if (devMock) {
          try {
            const parsed = JSON.parse(devMock);
            setUser(parsed);
            setIsLoggedIn(true);
            setProfileReady(true);
            setTier({ key: 'vip', name: 'VIP', desc: 'Đặc quyền VIP' });
            if (mountedRef.current) setReady(true);
            return;
          } catch {}
        }
        setUser(null);
        setIsLoggedIn(false);
        setProfileReady(false);
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
    const {
      role = 'student',
      lastName = '',
      firstName = '',
      school = '',
      province = '',
      ward = '',
      addressDetail = '',
      grade = '',
      birthDate = '',
      phone = '',
      termsAcceptedAt = 0,
    } = opts;
    const cleanSchool = school ? String(school).trim().slice(0, 80) : '';
    const cleanProvince = province ? String(province).trim() : '';
    const cleanWard = ward ? String(ward).trim().slice(0, 60) : '';
    const cleanAddress = addressDetail ? String(addressDetail).trim().slice(0, 120) : '';
    const cleanGrade = grade ? String(grade).trim() : (role === 'teacher' ? 'Sinh viên / Giáo viên' : '');

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    const nowIso = new Date().toISOString();
    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        role,
        email,
        canonicalEmail: canonicalizeEmail(email),
        displayName: displayName || '',
        authProvider: 'password',
        createdAt: nowIso,
        lastLoginAt: nowIso,
        ...(cleanSchool ? { school: cleanSchool } : {}),
        ...(termsAcceptedAt ? { termsAcceptedAt, termsVersion: 'v1' } : {}),
      }, { merge: true });
    } catch (e) {
      console.warn('Không lưu user metadata:', e);
    }

    // Khởi tạo đầy đủ hồ sơ thật từ form đăng ký (Họ, Tên, Trường, Xã/Phường, Tỉnh...)
    saveUserProfile(cred.user.uid, {
      ...(lastName ? { lastName } : {}),
      ...(firstName ? { firstName } : {}),
      fullName: displayName || '',
      ...(birthDate ? { birthDate } : {}),
      ...(phone ? { phone } : {}),
      ...(cleanProvince ? { province: cleanProvince } : {}),
      ...(cleanWard ? { ward: cleanWard } : {}),
      ...(cleanAddress ? { addressDetail: cleanAddress } : {}),
      ...(cleanGrade ? { grade: cleanGrade } : {}),
      ...(cleanSchool ? { highSchool: cleanSchool } : {}),
      survey: { role: role === 'teacher' ? 'teacher' : 'student' },
    });

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
      const userRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const role = snap.data()?.role || 'student';
        const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
        meta[cred.user.uid] = { role, email: cred.user.email || email };
        localStorage.setItem('cs-user-meta', JSON.stringify(meta));
        setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    } catch { /* ignore */ }

    await syncUserProfileFromCloud(cred.user.uid, cred.user).catch(() => {});
    if (mountedRef.current) setProfileReady(true);

    // Force refresh token để lấy claim mới (quan trọng sau khi setAdminClaim)
    const enriched = await enrichUser(cred.user, true);
    if (mountedRef.current && enriched) setUser({ ...enriched });

    return cred.user;
  }, []);

  /* ============ LOGIN GOOGLE ============ */
  const loginWithGoogle = useCallback(async (opts = {}) => {
    setAuthRedirectError('');
    const provider = createGoogleProvider();
    let cred;
    try {
      cred = await signInWithPopup(auth, provider);
    } catch (err) {
      const code = String(err?.code || '');
      if (POPUP_FALLBACK_CODES.has(code)) {
        try {
          sessionStorage.setItem(GOOGLE_REDIRECT_OPTS_KEY, JSON.stringify({
            role: opts?.role === 'teacher' ? 'teacher' : 'student',
            school: opts?.school ? String(opts.school).trim().slice(0, 80) : '',
            termsAcceptedAt: Number(opts?.termsAcceptedAt) || 0,
          }));
        } catch { /* ignore */ }
        await signInWithRedirect(auth, provider);
        return null;
      }
      console.error('[useAuth] Google login error:', code, err?.message);
      throw err;
    }

    await syncGoogleUserDocument(cred.user, opts);
    await syncUserProfileFromCloud(cred.user.uid, cred.user).catch(() => {});
    if (mountedRef.current) setProfileReady(true);

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
    setDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name }, { merge: true }).catch(() => {});
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
    try {
      await requestBrandedPasswordReset(email);
    } catch (e) {
      const code = String(e?.code || '');
      if (code === 'OTP_COOLDOWN' || code === 'HTTP_400') {
        throw e;
      }
      await sendPasswordResetEmail(auth, email);
    }
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
    profileReady,
    isLoggedIn,
    // Tiện: dùng trực tiếp không cần gọi isAdmin(user)
    isAdmin: user?.isAdmin === true,
    register,
    login,
    loginWithGoogle,
    authRedirectError,
    clearAuthRedirectError,
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