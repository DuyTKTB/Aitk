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
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Chỉ khởi tạo 1 lần
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* ============================================================
   ĐĂNG KÝ
   ============================================================ */
export async function register(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user;
}

/* ============================================================
   ĐĂNG NHẬP
   ============================================================ */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/* ============================================================
   ĐĂNG NHẬP GOOGLE
   ============================================================ */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
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
   ĐỔI MẬT KHẨU — cần xác thực lại bằng mật khẩu cũ
   ============================================================ */
export async function changePassword(oldPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('Chưa đăng nhập.');
  if (!user.email) throw new Error('Tài khoản không có email.');

  // Bước 1: Xác thực lại bằng mật khẩu cũ
  const cred = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, cred);

  // Bước 2: Đổi mật khẩu mới
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
   RELOAD USER (cập nhật emailVerified sau khi click email)
   ============================================================ */
export async function reloadUser() {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

/* ============================================================
   DỊCH LỖI FIREBASE SANG TIẾNG VIỆT
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
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập Google.',
    'auth/popup-blocked': 'Trình duyệt chặn popup. Vui lòng cho phép popup.',
    'auth/cancelled-popup-request': 'Yêu cầu đăng nhập bị huỷ.',
    'auth/requires-recent-login': 'Vui lòng đăng nhập lại để thực hiện thao tác này.',
    'auth/email-already-verified': 'Email đã được xác thực rồi.',
    'auth/operation-not-allowed': 'Thao tác này chưa được bật. Liên hệ Admin.',
    'auth/unauthorized-domain': 'Tên miền chưa được cấp quyền.',
    'auth/account-exists-with-different-credential':
      'Email này đã đăng ký bằng phương thức khác (Email/Mật khẩu).',
    'auth/internal-error': 'Lỗi hệ thống, vui lòng thử lại sau.',
  };
  return map[code] || `Lỗi: ${code || 'không xác định'}`;
}