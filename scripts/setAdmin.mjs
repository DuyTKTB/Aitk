// scripts/setAdmin.mjs
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

console.log('🔌 Đang kết nối project:', serviceAccount.project_id);

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

// Không có argument → liệt kê user
if (!process.argv[2]) {
  console.log('\n📋 Danh sách tài khoản:\n');
  try {
    const list = await auth.listUsers(1000);
    if (list.users.length === 0) {
      console.log('⚠️  Project này KHÔNG CÓ user nào.');
      console.log('   → Có thể bạn đang kết nối nhầm project.');
      console.log('   → Kiểm tra project_id ở trên có khớp với Firebase Console không.');
      process.exit(0);
    }
    list.users.forEach((u, i) => {
      const isAdmin = u.customClaims?.admin === true;
      console.log(`${i + 1}. ${u.email || '(no email)'}`);
      console.log(`   UID: ${u.uid}`);
      console.log(`   Admin: ${isAdmin ? '✅' : '—'}\n`);
    });
    console.log(`Tổng: ${list.users.length} tài khoản`);
    console.log('\n💡 Set admin:');
    console.log('   node scripts/setAdmin.mjs <UID>\n');
  } catch (e) {
    console.error('❌ Không liệt kê được:', e.message);
  }
  process.exit(0);
}

// Có argument → set claim
const UID = process.argv[2];
console.log(`\n🎯 Đang tìm user: ${UID}`);

try {
  const user = await auth.getUser(UID);
  console.log(`✅ Tìm thấy: ${user.email || '(no email)'}`);

  await auth.setCustomUserClaims(UID, { admin: true });

  const updated = await auth.getUser(UID);
  console.log(`\n✨ Đã set claim admin`);
  console.log(`   Claims:`, updated.customClaims);
  console.log('\n🔄 Bây giờ:');
  console.log('   1. Mở web → đăng xuất');
  console.log('   2. Đăng nhập lại (bắt buộc)');
  console.log('   3. Vào #admin\n');
} catch (e) {
  if (e.code === 'auth/user-not-found') {
    console.error(`\n❌ UID không tồn tại trong project ${serviceAccount.project_id}`);
    console.error('   Chạy lại KHÔNG có argument để xem danh sách:');
    console.error('   node scripts/setAdmin.mjs\n');
  } else {
    console.error('\n❌ Lỗi:', e.message);
  }
}