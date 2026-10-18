// scripts/setSupabaseRole.mjs
// Gán claim `role: 'authenticated'` cho TOÀN BỘ user Firebase hiện có.
// Bắt buộc cho Supabase Third-Party Auth + RLS (docs: supabase.com/docs/guides/auth/third-party/firebase-auth).
// Merge an toàn: giữ nguyên claim cũ (vd admin) — setCustomUserClaims ghi đè toàn bộ nếu không merge.
//
// Chạy:  node scripts/setSupabaseRole.mjs
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

console.log('🔌 Đang kết nối project:', serviceAccount.project_id);

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

let pageToken;
let updated = 0;
let failed = 0;

do {
  const list = await auth.listUsers(1000, pageToken);
  pageToken = list.pageToken;

  await Promise.all(
    list.users.map(async (u) => {
      if (u.customClaims?.role === 'authenticated') {
        updated++;
        return;
      }
      try {
        await auth.setCustomUserClaims(u.uid, {
          ...u.customClaims,
          role: 'authenticated',
        });
        updated++;
        console.log(`✅ ${u.email || u.uid}`);
      } catch (e) {
        failed++;
        console.error(`❌ ${u.email || u.uid}:`, e.message);
      }
    })
  );
} while (pageToken);

console.log(`\n🎉 Xong: ${updated} user có role 'authenticated'${failed ? `, ${failed} lỗi` : ''}.`);
console.log('→ Token mới chỉ có sau khi client force-refresh (web tự làm qua getIdToken(true)).');
process.exit(0);
