/* ============================================================
   isAdmin.js — NGUỒN DUY NHẤT kiểm tra quyền admin ở giao diện
   ------------------------------------------------------------
   • Dựa vào custom claim `admin: true` trên ID token (do Cloud Function
     setAdminClaim cấp) — useAuth nên gán user.isAdmin = token.claims.admin.
   • KHÔNG đọc role từ localStorage, KHÔNG dùng VITE_ADMIN_EMAILS (nằm trong bundle).
   • Đây chỉ để ẩn/hiện giao diện. Quyền thật phải do Firestore rules + Cloud Functions chặn
     (rules dùng request.auth.token.admin == true).
   • Dùng chung cho App.jsx và TeacherDashboard.jsx.
   ============================================================ */
export const isAdmin = (user) => !!user && (user.isAdmin === true || user.claims?.admin === true);
export default isAdmin;
