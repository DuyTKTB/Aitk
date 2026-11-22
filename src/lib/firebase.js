import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, setDoc, getDoc,
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, limit, onSnapshot,
  serverTimestamp, increment, arrayUnion, arrayRemove, writeBatch, Timestamp,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* ============================================================
   BẢO VỆ LOCALSTORAGE CHỐNG TRÀN QUOTA (CHẶN LỖI FIRESTORE ID: b815)
   - Firebase persistentMultipleTabManager ghi state đồng bộ tab
     (firestore_targets_*, firestore_clients_*, firestore_mutations_*)
     vào localStorage ở mỗi truy vấn. Nếu localStorage đầy 5MB và
     ném QuotaExceededError, Firestore SDK sẽ sập với INTERNAL ASSERTION b815.
   - Cơ chế tự phục hồi 2 tầng:
     1) Dọn dẹp bộ nhớ đệm nặng (cs-local-exams:*, firestore_targets_*, ...) ngay khi khởi động
     2) Bọc Storage.prototype.setItem để tự động giải phóng dung lượng và thử lại,
        không bao giờ để QuotaExceededError làm sập Firestore SDK.
   ============================================================ */
const PROTECTED_LS_PREFIXES = [
  'firebase:authUser:',
  'firebase:host:',
  'cs-user-meta',
  'cs-vip',
  'cs-user-subscription:',
  'cs-study-owner',
  'cs-study-sync-meta',
  'cs-streak',
  'cs-xp',
  'cs-progress-v1',
  'cs-quiz-stats',
  'cs-wrong-',
  'cs-srs',
  'elec-aspirations-v2:',
  'cs-aspirations-v1:',
  'elec_exam_history_v1_',
  'elec_fav_exams_v1_',
  'elec_exam_draft_',
  'cs-ai-chats:',
  'cs-ai-chats-owner',
  'cs-ai-active:',
  'cs-ai-pinned:',
  'cs-ai-bookmarks',
  'cs-ai-deleted:',
  'cs-elec-companion-sessions:',
  'cs-aes:',
];

function isProtectedStorageKey(k) {
  return PROTECTED_LS_PREFIXES.some((p) => String(k || '').startsWith(p));
}

export function reclaimLocalStorageSpace(aggressive = false) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    const ls = window.localStorage;
    const keys = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k) keys.push(k);
    }

    let freedBytes = 0;
    const removeKey = (k) => {
      try {
        const val = ls.getItem(k) || '';
        freedBytes += (k.length + val.length) * 2;
        ls.removeItem(k);
      } catch { /* ignore */ }
    };

    // Bước 1: Xóa các khóa đồng bộ tab tạm thời của Firestore & bản sao đề thi cục bộ quá nặng
    for (const k of keys) {
      if (
        k.startsWith('firestore_targets_') ||
        k.startsWith('firestore_mutations_') ||
        k.startsWith('firestore_clients_') ||
        k.startsWith('firestore_online_state_') ||
        k.startsWith('firestore_sequence_number_') ||
        k.startsWith('cs-local-exams:') ||
        k.startsWith('cs-local-submissions:')
      ) {
        removeKey(k);
      }
    }

    // Bước 2: Cắt gọn lịch sử chat AI / tài liệu cache nếu quá nặng (> 250KB)
    for (const k of keys) {
      if (isProtectedStorageKey(k)) continue;
      const raw = ls.getItem(k);
      if (!raw) continue;
      if (k === 'cs-ai-chats' && raw.length > 180000) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 10) {
            ls.setItem(k, JSON.stringify(parsed.slice(0, 10)));
            freedBytes += raw.length;
          } else {
            removeKey(k);
          }
        } catch {
          removeKey(k);
        }
      } else if (raw.length > (aggressive ? 80000 : 220000)) {
        removeKey(k);
      }
    }

    // Bước 3: Nếu vẫn cần giải phóng mạnh (khi QuotaExceededError vừa xảy ra), xóa các khóa lớn nhất không thuộc nhóm bảo vệ
    if (aggressive) {
      const remaining = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (!k || isProtectedStorageKey(k)) continue;
        const v = ls.getItem(k) || '';
        remaining.push({ k, len: k.length + v.length });
      }
      remaining.sort((a, b) => b.len - a.len);
      for (const item of remaining.slice(0, 8)) {
        removeKey(item.k);
      }
    }

    return freedBytes;
  } catch {
    return 0;
  }
}

export function installSafeLocalStorageGuard() {
  try {
    if (typeof window === 'undefined' || !window.Storage || !window.localStorage) return;
    const proto = window.Storage.prototype;
    if (proto.__elecSafeStorageInstalled) return;
    const nativeSetItem = proto.setItem;
    if (typeof nativeSetItem !== 'function') return;

    // Ngay khi khởi động: LUÔN dọn sạch các khóa đồng bộ tab cũ của Firestore (firestore_targets_*, firestore_clients_*, ...)
    // và các bản sao đề thi cục bộ quá nặng để giải phóng ngay localStorage.
    let totalChars = 0;
    const ls = window.localStorage;
    const initialKeys = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k) initialKeys.push(k);
    }
    for (const k of initialKeys) {
      if (
        k.startsWith('firestore_targets_') ||
        k.startsWith('firestore_mutations_') ||
        k.startsWith('firestore_clients_') ||
        k.startsWith('firestore_online_state_') ||
        k.startsWith('firestore_sequence_number_')
      ) {
        try { ls.removeItem(k); } catch { /* ignore */ }
        continue;
      }
      const v = ls.getItem(k) || '';
      if (k.startsWith('cs-local-exams:') && v.length > 80000) {
        try { ls.removeItem(k); } catch { /* ignore */ }
        continue;
      }
      totalChars += k.length + v.length;
    }
    if (totalChars > 700000) {
      reclaimLocalStorageSpace(false);
    }

    proto.setItem = function safeSetItem(key, value) {
      try {
        return nativeSetItem.call(this, key, value);
      } catch (err) {
        const isQuota =
          err?.name === 'QuotaExceededError' ||
          err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err?.code === 22 ||
          err?.code === 1014 ||
          /quota/i.test(String(err?.message || ''));

        if (!isQuota) throw err;

        // Giải phóng bộ nhớ đệm rồi thử ghi lại
        reclaimLocalStorageSpace(true);
        try {
          return nativeSetItem.call(this, key, value);
        } catch {
          // Không bao giờ ném QuotaExceededError ra ngoài để tránh làm sập Firestore WebStorageSharedClientState (ID: b815)
          console.warn('[SafeStorage] Bỏ qua ghi localStorage vì vượt hạn mức:', String(key).slice(0, 60));
          return undefined;
        }
      }
    };
    Object.defineProperty(proto, '__elecSafeStorageInstalled', {
      value: true,
      configurable: true,
      enumerable: false,
    });
  } catch { /* ignore in restricted environments */ }
}

installSafeLocalStorageGuard();

/* Dùng getFirestore(app) chuẩn (in-memory cache) thay cho persistentMultipleTabManager()
   để TRIỆT TIÊU hoàn toàn WebStorageSharedClientState ghi firestore_targets_* vào localStorage
   gây lỗi FIRESTORE INTERNAL ASSERTION FAILED (ID: b815) khi mở nhiều tab hoặc đầy bộ nhớ. */
function makeDb() {
  return getFirestore(app);
}
export const db = makeDb();
export const storage = getStorage(app);

/* ============================================================
   ĐĂNG KÝ (nhận role)
   ============================================================ */
export async function register(email, password, displayName, opts = {}) {
  const { role = 'student' } = opts;
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }

  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      role,
      email,
      displayName: displayName || '',
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('Không lưu được user metadata:', e);
  }

  try {
    const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
    meta[cred.user.uid] = { role, email };
    localStorage.setItem('cs-user-meta', JSON.stringify(meta));
  } catch {}

  return cred.user;
}

/* ============================================================
   ĐĂNG NHẬP
   ============================================================ */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Cache role khi đăng nhập
  try {
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) {
      const role = snap.data()?.role || 'student';
      const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
      meta[cred.user.uid] = { role, email: cred.user.email };
      localStorage.setItem('cs-user-meta', JSON.stringify(meta));
    }
  } catch {}
  return cred.user;
}

/* ============================================================
   ĐĂNG NHẬP GOOGLE
   ============================================================ */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);

  // Nếu user mới → tạo profile student mặc định
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
}

/* ============================================================
   ĐĂNG NHẬP FACEBOOK
   ============================================================ */
export async function loginFacebook() {
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.setCustomParameters({ display: 'popup' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

/* ============================================================
   ĐĂNG XUẤT
   ============================================================ */
export async function logout() {
  await signOut(auth);
}

/* ============================================================
   LẮNG NGHE TRẠNG THÁI
   ============================================================ */
export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ============================================================
   ĐỔI TÊN HIỂN THỊ
   ============================================================ */
export async function updateDisplayName(newName) {
  if (!auth.currentUser) throw new Error('Chưa đăng nhập.');
  await updateProfile(auth.currentUser, { displayName: newName.trim() });
  return auth.currentUser;
}

/* ============================================================
   ĐỔI MẬT KHẨU
   ============================================================ */
export async function changePassword(oldPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('Chưa đăng nhập.');
  if (!user.email) throw new Error('Tài khoản không có email.');
  const cred = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
  return true;
}

/* ============================================================
   GỬI EMAIL XÁC THỰC
   ============================================================ */
export async function sendVerifyEmail() {
  if (!auth.currentUser) throw new Error('Chưa đăng nhập.');
  if (auth.currentUser.emailVerified) {
    throw new Error('Email đã được xác thực rồi.');
  }
  await sendEmailVerification(auth.currentUser);
  return true;
}

/* ============================================================
   QUÊN MẬT KHẨU
   ============================================================ */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
  return true;
}

/* ============================================================
   RELOAD USER
   ============================================================ */
export async function reloadUser() {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

/* ============================================================
   GHI NHỚ ĐĂNG NHẬP
   ============================================================ */
export async function setRememberMe(remember) {
  await setPersistence(
    auth,
    remember ? browserLocalPersistence : browserSessionPersistence
  );
}

/* ============================================================
   UPLOAD AVATAR
   ============================================================ */
export async function uploadAvatar(file) {
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
  return url;
}

/* ============================================================
   DỊCH LỖI
   ============================================================ */
export function translateAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'Email này đã được đăng ký.',
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
    'auth/wrong-password': 'Mật khẩu không đúng.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng đợi vài phút.',
    'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối Internet.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/popup-blocked': 'Trình duyệt chặn popup. Vui lòng cho phép popup.',
    'auth/cancelled-popup-request': 'Yêu cầu đăng nhập bị huỷ.',
    'auth/requires-recent-login': 'Vui lòng đăng nhập lại để thực hiện thao tác này.',
    'auth/email-already-verified': 'Email đã được xác thực rồi.',
    'auth/operation-not-allowed': 'Thao tác này chưa được bật. Liên hệ Admin.',
    'auth/unauthorized-domain': 'Tên miền chưa được cấp quyền.',
    'auth/account-exists-with-different-credential':
      'Email này đã đăng ký bằng phương thức khác (Email/Mật khẩu).',
    'auth/internal-error': 'Lỗi hệ thống, vui lòng thử lại sau.',
    'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa.',
    'auth/web-storage-unsupported': 'Trình duyệt đang chặn cookie hoặc bộ nhớ cục bộ nên không thể đăng nhập.',
    'auth/operation-not-supported-in-this-environment':
      'Trình duyệt hiện tại chưa hỗ trợ cửa sổ đăng nhập này.',
    'auth/timeout': 'Kết nối Google bị quá thời gian chờ, vui lòng thử lại.',
    'auth/invalid-api-key': 'Cấu hình Firebase API key chưa hợp lệ.',
    'auth/facebook-popup-blocked': 'Trình duyệt chặn popup Facebook.',
    'auth/invalid-oauth-provider': 'Facebook Login chưa được cấu hình.',
  };
  return map[code] || `Lỗi: ${code || 'không xác định'}`;
}

/* Re-export Firestore functions — để các module khác import từ firebase.js
   thay vì từ 'firebase/firestore' trực tiếp (giảm số import path) */
export {
  doc, setDoc, getDoc,
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, limit, onSnapshot,
  serverTimestamp, increment, arrayUnion, arrayRemove, writeBatch, Timestamp,
};