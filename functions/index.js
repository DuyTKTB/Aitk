const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// 🤖 Import AI Proxy functions
const aiProxy = require('./aiProxy');
exports.askAI = aiProxy.askAI;
exports.askAIBatch = aiProxy.askAIBatch;

/* ============================================================
   CẤU HÌNH
   ============================================================ */
const CONFIG = {
  WEBHOOK_SECRET: process.env.ELECAI_WEBHOOK_SECRET || 'CHANGE_ME_SECRET',
  // Hỗ trợ đầy đủ bảng giá Học Sinh (VIP) & Giáo Viên (PRO) + Legacy
  PRICE_MAP: {
    // Legacy rates
    50000:   { months: 1,  tier: 'vip', role: 'student' },
    250000:  { months: 6,  tier: 'vip', role: 'student' },
    450000:  { months: 12, tier: 'vip', role: 'student' },
    // Học sinh VIP (ALL_PACKAGES + SubscriptionTiers)
    79000:   { months: 1,  tier: 'vip', role: 'student' },
    199000:  { months: 3,  tier: 'vip', role: 'student' },
    299000:  { months: 3,  tier: 'vip', role: 'student' },
    349000:  { months: 6,  tier: 'vip', role: 'student' },
    399000:  { months: 3,  tier: 'vip', role: 'student' },
    499000:  { months: 12, tier: 'vip', role: 'student' },
    599000:  { months: 3,  tier: 'vip', role: 'student' },
    699000:  { months: 12, tier: 'vip', role: 'student' },
    899000:  { months: 12, tier: 'vip', role: 'student' },
    999000:  { months: 6,  tier: 'vip', role: 'student' },
    1399000: { months: 12, tier: 'vip', role: 'student' },
    // Giáo viên PRO
    149000:  { months: 1,  tier: 'pro', role: 'teacher' },
    590000:  { months: 6,  tier: 'pro', role: 'teacher' },
    990000:  { months: 12, tier: 'pro', role: 'teacher' },
  },
  CONTENT_REGEX: /ELECAI\s*(?:VIP|PRO)?\s+([A-Z0-9-]+)/i,
};

/* ============================================================
   WEBHOOK — Nhận thông báo chuyển khoản từ Casso / SePay
   ============================================================ */
exports.elecaiWebhook = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const secret = req.headers['x-webhook-secret'] || req.query.secret;
    if (secret !== CONFIG.WEBHOOK_SECRET) {
      console.warn('[Webhook] Unauthorized');
      return res.status(401).send('Unauthorized');
    }

    const body = req.body || {};
    const transactions = Array.isArray(body.data) ? body.data : [body];
    const results = [];

    for (const tx of transactions) {
      const txId = String(tx.id || tx.tid || tx.referenceCode || '').trim();
      const description = tx.description || tx.content || '';
      const amount = Number(tx.amount || tx.transferAmount || 0);

      console.log('[Webhook] Giao dịch:', { txId, description, amount });

      const match = description.match(CONFIG.CONTENT_REGEX);
      if (!match) {
        results.push({ status: 'skipped', reason: 'invalid_content', description });
        continue;
      }

      const identCode = match[1].toUpperCase();
      const identCandidates = identCode.startsWith('ELECAI-')
        ? [identCode, identCode.replace(/^ELECAI-/, '')]
        : [identCode, `ELECAI-${identCode}`];
      const planInfo = CONFIG.PRICE_MAP[amount];
      if (!planInfo) {
        results.push({ status: 'skipped', reason: 'invalid_amount', amount });
        continue;
      }
      const { months, tier: targetTier, role: targetRole } = planInfo;

      const snapshot = await db.collection('users')
        .where('identCode', 'in', identCandidates)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn('[Webhook] Không tìm thấy user:', identCode);
        results.push({ status: 'failed', reason: 'user_not_found', identCode });
        continue;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Chống xử lý trùng cùng 1 giao dịch webhook
      const processedIds = Array.isArray(userData.processedTxIds) ? userData.processedTxIds : [];
      if (txId && processedIds.includes(txId)) {
        results.push({ status: 'skipped', reason: 'duplicate_tx', txId, uid: userDoc.id });
        continue;
      }

      const now = admin.firestore.Timestamp.now();
      const currentExpiry = userData.vipExpiresAt?.toDate?.() || new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      const updatePayload = {
        tier: targetTier,
        vip: targetTier === 'vip',
        pro: targetTier === 'pro',
        vipExpiresAt: admin.firestore.Timestamp.fromDate(newExpiry),
        vipUntil: newExpiry.toISOString(),
        vipUpgradedAt: now,
        lastPayment: {
          txId: txId || null,
          amount,
          months,
          description,
          paidAt: now,
        },
        ...(txId ? { processedTxIds: [txId, ...processedIds].slice(0, 30) } : {}),
        ...(targetRole === 'teacher' && userData.role !== 'admin' ? { role: 'teacher' } : {}),
      };

      await userDoc.ref.update(updatePayload);

      console.log(`[Webhook] ✅ ${targetTier.toUpperCase()} cho ${userDoc.id} (${identCode}) — ${months} tháng`);
      results.push({ status: 'success', uid: userDoc.id, identCode, months, tier: targetTier });
    }

    return res.status(200).json({ ok: true, results });
  } catch (error) {
    console.error('[Webhook] Lỗi:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

/* ============================================================
   AUTH onCreate — Gán claim role:'authenticated' cho user mới.
   Bắt buộc cho Supabase Third-Party Auth + RLS: JWT Firebase mặc định
   không có claim role → Supabase coi là 'anon' → policy RLS chặn hết.
   (docs: supabase.com/docs/guides/auth/third-party/firebase-auth)
   Lưu ý: onCreate chạy bất đồng bộ — client phải force-refresh token
   ngay sau đăng ký (useAuth đã làm qua enrichUser + supabaseAuth).
   ============================================================ */
exports.processSignUp = functions.auth.user().onCreate(async (user) => {
  try {
    const existing = await admin.auth().getUser(user.uid);
    await admin.auth().setCustomUserClaims(user.uid, {
      ...existing.customClaims,
      role: 'authenticated',
    });
    console.log('[Auth] Đã gán role authenticated cho:', user.uid);
  } catch (error) {
    console.error('[Auth] Gán role thất bại:', user.uid, error);
  }
});

/* ============================================================
   SCHEDULED — Tự động hạ VIP khi hết hạn (chạy 00:00 mỗi ngày)
   ============================================================ */
exports.expireVip = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const expired = await db.collection('users')
      .where('tier', '==', 'vip')
      .where('vipExpiresAt', '<=', now)
      .get();

    if (expired.empty) {
      console.log('[ExpireVip] Không có VIP nào hết hạn.');
      return null;
    }

    const batch = db.batch();
    expired.docs.forEach((doc) => {
      batch.update(doc.ref, { tier: 'free' });
      console.log('[ExpireVip] Hạ VIP:', doc.id);
    });
    await batch.commit();

    console.log(`[ExpireVip] Đã hạ ${expired.size} tài khoản.`);
    return null;
  });

/* ============================================================
   API — Đồng bộ identCode cho user hiện tại
   ============================================================ */
exports.syncIdentCode = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: missing token' });
    }
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ ok: false, error: 'Unauthorized: invalid token' });
    }

    const { uid, identCode } = req.body || {};
    if (uid && uid !== decoded.uid) {
      return res.status(403).json({ ok: false, error: 'Forbidden: uid mismatch' });
    }
    const cleanCode = String(identCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,32}$/.test(cleanCode)) {
      return res.status(400).json({ ok: false, error: 'Invalid identCode' });
    }

    await db.collection('users').doc(decoded.uid).set(
      { identCode: cleanCode },
      { merge: true }
    );

    return res.status(200).json({ ok: true, uid: decoded.uid, identCode: cleanCode });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});