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
import { getTier, clearTierCache } from '../lib/tier.js';
import { invalidateVipCache } from '../lib/vipService.js';
import { saveUserProfile, syncUserProfileFromCloud } from '../lib/userProfileService.js';
import { canonicalizeEmail } from '../lib/authValidation.js';
import { requestBrandedPasswordReset } from '../lib/emailOtp.js';
import {
  setUserRole,
  setPostAuthRedirect,
  clearPostAuthRedirect,
} from '../lib/userRole.js';

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
  const forceTeacherRole = opts?.forceRole === 'teacher';
  const cleanSchool = opts?.school ? String(opts.school).trim().slice(0, 80) : '';
  const termsAcceptedAt = Number(opts?.termsAcceptedAt) || 0;
  const nowIso = new Date().toISOString();

  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    const existingData = snap.exists() ? (snap.data() || {}) : null;
    const existingRole = existingData?.role;
    const shouldWriteTeacherProfile = !snap.exists()
      ? requestedRole === 'teacher'
      : (forceTeacherRole && existingRole !== 'admin' && existingRole !== 'teacher');

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
          ? { grade: 'Sinh viên / Giáo viên', survey: { role: 'teacher', goal: 'giang_day' } }
          : { survey: { role: 'student' } }),
      });
    } else if (shouldWriteTeacherProfile) {
      await setDoc(userRef, {
        role: 'teacher',
        lastLoginAt: nowIso,
        ...(cleanSchool ? { school: cleanSchool } : {}),
        ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
      }, { merge: true });
      saveUserProfile(firebaseUser.uid, {
        fullName: firebaseUser.displayName || '',
        ...(cleanSchool ? { highSchool: cleanSchool } : {}),
        grade: 'Sinh viên / Giáo viên',
        survey: { role: 'teacher', goal: 'giang_day' },
      });
    } else {
      // Cập nhật thông tin xác thực mới nhất từ Google nhưng không ghi đè hồ sơ đã chỉnh tay hay role
      setDoc(userRef, {
        lastLoginAt: nowIso,
        ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
      }, { merge: true }).catch(() => {});
    }

    const role = !snap.exists()
      ? requestedRole
      : shouldWriteTeacherProfile
        ? 'teacher'
        : (existingRole || 'student');

    if (role === 'teacher' && firebaseUser.email) {
      supabase
        .from('profiles')
        .upsert({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          ...(firebaseUser.displayName ? { display_name: firebaseUser.displayName } : {}),
          ...(firebaseUser.photoURL ? { avatar_url: firebaseUser.photoURL } : {}),
          role: 'teacher',
        }, { onConflict: 'id' })
        .then(() => {}, () => {});
    }

    const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
    meta[firebaseUser.uid] = { role, email: firebaseUser.email };
    localStorage.setItem('cs-user-meta', JSON.stringify(meta));
    window.dispatchEvent(new CustomEvent('user-profile-change'));
    return { role, isNewUser: !snap.exists() };
  } catch {
    const fallbackRole = forceTeacherRole ? 'teacher' : requestedRole;
    try {
      const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
      meta[firebaseUser.uid] = { role: fallbackRole, email: firebaseUser.email };
      localStorage.setItem('cs-user-meta', JSON.stringify(meta));
      window.dispatchEvent(new CustomEvent('user-profile-change'));
    } catch { /* ignore */ }
    return { role: fallbackRole, isNewUser: false };
  }
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
  const pendingSyncRef = useRef(null);

  const clearAuthRedirectError = useCallback(() => setAuthRedirectError(''), []);

  const runWithAuthSyncLock = useCallback(async (fn) => {
    let resolveSync;
    const prevSync = pendingSyncRef.current;
    const syncPromise = new Promise((resolve) => {
      resolveSync = resolve;
    });
    pendingSyncRef.current = syncPromise;
    try {
      if (prevSync) await prevSync;
      return await fn();
    } finally {
      if (pendingSyncRef.current === syncPromise) {
        pendingSyncRef.current = null;
      }
      resolveSync();
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /* ============ AUTH STATE ============ */
  useEffect(() => {
    // Chỉ gọi getRedirectResult khi thực sự có dấu hiệu vừa quay lại từ Google redirect (tránh 1 round-trip mạng thừa ở mọi lần tải trang)
    let hasPendingGoogleRedirect = false;
    try {
      hasPendingGoogleRedirect = Boolean(sessionStorage.getItem(GOOGLE_REDIRECT_OPTS_KEY));
    } catch { /* ignore */ }

    const redirectPromise = hasPendingGoogleRedirect
      ? getRedirectResult(auth)
          .then(async (cred) => {
            let savedOpts = {};
            try {
              savedOpts = JSON.parse(sessionStorage.getItem(GOOGLE_REDIRECT_OPTS_KEY) || '{}') || {};
              sessionStorage.removeItem(GOOGLE_REDIRECT_OPTS_KEY);
            } catch { /* ignore */ }
            if (cred?.user) {
              const syncRes = await syncGoogleUserDocument(cred.user, savedOpts);
              if (savedOpts?.redirectTarget === 'classroom' && syncRes?.role === 'teacher') {
                setPostAuthRedirect('classroom');
              } else if (savedOpts?.redirectTarget) {
                clearPostAuthRedirect();
              }
            }
          })
          .catch((err) => {
            try { sessionStorage.removeItem(GOOGLE_REDIRECT_OPTS_KEY); } catch { /* ignore */ }
            clearPostAuthRedirect();
            const code = String(err?.code || '');
            if (code && mountedRef.current) setAuthRedirectError(code);
            console.error('[useAuth] Google redirect error:', code, err?.message);
          })
      : Promise.resolve();

    const unsub = onAuthStateChanged(auth, async (u) => {
      await redirectPromise;
      if (pendingSyncRef.current) {
        await pendingSyncRef.current;
      }
      if (!mountedRef.current) return;

      if (u) {
        try { localStorage.setItem('elec-has-session', '1'); } catch {}
        // Dọn dẹp cache VIP/PRO nếu thuộc tài khoản khác để acc Free không bao giờ kế thừa quyền VIP
        try {
          const rawVip = JSON.parse(localStorage.getItem('cs-vip-status') || 'null');
          if (rawVip && (!rawVip.uid || rawVip.uid !== u.uid)) {
            localStorage.removeItem('cs-vip-status');
            localStorage.removeItem('cs-vip');
            localStorage.removeItem('cs-user-tier');
            invalidateVipCache();
          }
          clearTierCache(u.uid);
        } catch {}
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

        // Kích hoạt đồng bộ toàn bộ dữ liệu học tập (lazy-load để không kéo 85KB vào trang chủ Landing)
        import('../lib/cloudStudySync.js')
          .then(({ initCloudStudySyncForUser }) => initCloudStudySyncForUser(u.uid))
          .catch(() => {});

        try {
          const t = await getTier(u.uid);
          if (mountedRef.current) setTier(t);
        } catch {
          if (mountedRef.current) {
            setTier({ key: 'free', name: 'Free', desc: 'Miễn phí' });
          }
        }
      } else {
        const devMock = import.meta.env.DEV && typeof window !== 'undefined'
          ? localStorage.getItem('cs-dev-mock-user')
          : null;
        if (devMock) {
          try {
            const parsed = JSON.parse(devMock);
            setUser(parsed);
            setIsLoggedIn(true);
            setProfileReady(true);
            const mockTierKey = parsed?.tier === 'vip' ? 'vip' : parsed?.tier === 'pro' ? 'pro' : 'free';
            setTier({ key: mockTierKey, name: mockTierKey.toUpperCase(), desc: mockTierKey === 'free' ? 'Miễn phí' : 'Mock VIP' });
            if (mountedRef.current) setReady(true);
            return;
          } catch {}
        }
        try {
          localStorage.removeItem('elec-has-session');
          localStorage.removeItem('cs-vip-status');
          localStorage.removeItem('cs-vip');
          localStorage.removeItem('cs-user-tier');
          clearTierCache();
          invalidateVipCache();
        } catch {}
        import('../lib/cloudStudySync.js')
          .then(({ stopCloudStudySync }) => stopCloudStudySync())
          .catch(() => {});
        setUser(null);
        setIsLoggedIn(false);
        setProfileReady(false);
        setTier(null);
      }
      if (mountedRef.current) setReady(true);
    });
    return () => unsub();
  }, []);

  /* ============ REFRESH CLAIMS & TIER KHI QUAY LẠI TAB HOẶC CÓ CẬP NHẬT GÓI ============ */
  /* Tránh trường hợp admin vừa cấp PRO/VIP ở tab/thiết bị khác mà phiên hiện tại vẫn kẹt Free */
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const syncTierLive = async () => {
      const u = auth.currentUser;
      if (!u?.uid) return;
      try {
        clearTierCache(u.uid);
        const t = await getTier(u.uid);
        if (mountedRef.current) setTier(t);
      } catch { /* ignore */ }
    };
    const onVisible = async () => {
      if (document.hidden) return;
      const u = auth.currentUser;
      if (!u) return;
      const enriched = await enrichUser(u, true);
      if (mountedRef.current && enriched) setUser({ ...enriched });
      syncTierLive();
    };
    window.addEventListener('cs-tier-update', syncTierLive);
    window.addEventListener('cs-vip-update', syncTierLive);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('cs-tier-update', syncTierLive);
      window.removeEventListener('cs-vip-update', syncTierLive);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
    const normalizedRole = role === 'teacher' ? 'teacher' : 'student';
    const cleanSchool = school ? String(school).trim().slice(0, 80) : '';
    const cleanProvince = province ? String(province).trim() : '';
    const cleanWard = ward ? String(ward).trim().slice(0, 60) : '';
    const cleanAddress = addressDetail ? String(addressDetail).trim().slice(0, 120) : '';
    const cleanGrade = grade ? String(grade).trim() : (normalizedRole === 'teacher' ? 'Sinh viên / Giáo viên' : '');

    return runWithAuthSyncLock(async () => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      try {
        setUserRole(cred.user.uid, normalizedRole);
        const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
        meta[cred.user.uid] = { role: normalizedRole, email };
        localStorage.setItem('cs-user-meta', JSON.stringify(meta));
      } catch { /* ignore */ }

      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      const nowIso = new Date().toISOString();
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          role: normalizedRole,
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
        survey: normalizedRole === 'teacher'
          ? { role: 'teacher', goal: 'giang_day' }
          : { role: 'student' },
      });

      if (normalizedRole === 'teacher' && email) {
        supabase
          .from('profiles')
          .upsert({
            id: cred.user.uid,
            email,
            ...(displayName ? { display_name: displayName } : {}),
            role: 'teacher',
          }, { onConflict: 'id' })
          .then(() => {}, () => {});
      }

      window.dispatchEvent(new CustomEvent('user-profile-change'));

      try {
        await cred.user.reload();
        const enriched = await enrichUser(auth.currentUser);
        if (mountedRef.current && enriched) setUser({ ...enriched });
      } catch { /* ignore */ }

      return cred.user;
    });
  }, [runWithAuthSyncLock]);

  /* ============ LOGIN ============ */
  const login = useCallback(async (email, password) => {
    return runWithAuthSyncLock(async () => {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      try {
        const userRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const role = snap.data()?.role || 'student';
          const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
          meta[cred.user.uid] = { role, email: cred.user.email || email };
          localStorage.setItem('cs-user-meta', JSON.stringify(meta));
          window.dispatchEvent(new CustomEvent('user-profile-change'));
          setDoc(userRef, { lastLoginAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        }
      } catch { /* ignore */ }

      await syncUserProfileFromCloud(cred.user.uid, cred.user).catch(() => {});
      if (mountedRef.current) setProfileReady(true);

      // Force refresh token để lấy claim mới (quan trọng sau khi setAdminClaim)
      const enriched = await enrichUser(cred.user, true);
      if (mountedRef.current && enriched) setUser({ ...enriched });

      return cred.user;
    });
  }, [runWithAuthSyncLock]);

  /* ============ LOGIN GOOGLE ============ */
  const loginWithGoogle = useCallback(async (opts = {}) => {
    setAuthRedirectError('');
    const provider = createGoogleProvider();
    return runWithAuthSyncLock(async () => {
      let cred;
      try {
        cred = await signInWithPopup(auth, provider);
      } catch (err) {
        const code = String(err?.code || '');
        if (POPUP_FALLBACK_CODES.has(code)) {
          try {
            sessionStorage.setItem(GOOGLE_REDIRECT_OPTS_KEY, JSON.stringify({
              role: opts?.role === 'teacher' ? 'teacher' : 'student',
              forceRole: opts?.forceRole === 'teacher' ? 'teacher' : undefined,
              school: opts?.school ? String(opts.school).trim().slice(0, 80) : '',
              termsAcceptedAt: Number(opts?.termsAcceptedAt) || 0,
              redirectTarget: opts?.redirectTarget ? String(opts.redirectTarget) : '',
            }));
          } catch { /* ignore */ }
          await signInWithRedirect(auth, provider);
          return null;
        }
        console.error('[useAuth] Google login error:', code, err?.message);
        throw err;
      }

      const syncRes = await syncGoogleUserDocument(cred.user, opts);
      if (opts?.redirectTarget === 'classroom') {
        if (syncRes?.role === 'teacher') {
          setPostAuthRedirect('classroom');
        } else {
          clearPostAuthRedirect();
        }
      }

      await syncUserProfileFromCloud(cred.user.uid, cred.user).catch(() => {});
      if (mountedRef.current) setProfileReady(true);

      const enriched = await enrichUser(cred.user, true);
      if (mountedRef.current && enriched) setUser({ ...enriched });

      return cred.user;
    });
  }, [runWithAuthSyncLock]);

  /* ============ LOGOUT ============ */
  const logout = useCallback(async () => {
    const curUid = auth.currentUser?.uid || '';
    const [cloudSync, aiChat] = await Promise.all([
      import('../lib/cloudStudySync.js').catch(() => null),
      import('../lib/aiChatApi.js').catch(() => null),
    ]);
    if (curUid) {
      try {
        aiChat?.flushPendingSyncs?.();
        await Promise.race([
          cloudSync?.flushCloudStudyState?.(curUid)?.catch(() => {}) || Promise.resolve(),
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ]);
      } catch { /* ignore */ }
    }
    clearPostAuthRedirect();
    cloudSync?.stopCloudStudySync?.();
    aiChat?.cancelAllSyncs?.();
    cloudSync?.clearLocalStudyStateOnLogout?.();
    try {
      localStorage.removeItem('cs-vip-status');
      localStorage.removeItem('cs-vip');
      localStorage.removeItem('cs-user-tier');
      clearTierCache();
      invalidateVipCache();
      window.dispatchEvent(new CustomEvent('cs-vip-update'));
      window.dispatchEvent(new CustomEvent('cs-tier-update'));
    } catch {}
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