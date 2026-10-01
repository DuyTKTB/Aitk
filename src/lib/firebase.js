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
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';   // ← THÊM DÒNG NÀY

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
export const db = getFirestore(app);
export const storage = getStorage(app);   // ← THÊM DÒNG NÀY

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
   UPLOAD AVATAR  ← THÊM HÀM NÀY
   ============================================================ */
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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
    'auth/facebook-popup-blocked': 'Trình duyệt chặn popup Facebook.',
    'auth/invalid-oauth-provider': 'Facebook Login chưa được cấu hình.',
  };
  return map[code] || `Lỗi: ${code || 'không xác định'}`;
}