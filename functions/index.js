const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/* ============================================================
   CẤU HÌNH
   ============================================================ */
const CONFIG = {
  WEBHOOK_SECRET: process.env.ELECAI_WEBHOOK_SECRET || 'CHANGE_ME_SECRET',
  PRICE_MAP: {
    50000: 1,
    250000: 6,
    450000: 12,
  },
  CONTENT_REGEX: /ELECAI\s+VIP\s+([A-Z0-9-]+)/i,
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
      const description = tx.description || tx.content || '';
      const amount = Number(tx.amount || tx.transferAmount || 0);

      console.log('[Webhook] Giao dịch:', { description, amount });

      const match = description.match(CONFIG.CONTENT_REGEX);
      if (!match) {
        results.push({ status: 'skipped', reason: 'invalid_content', description });
        continue;
      }

      const identCode = match[1].toUpperCase();
      const months = CONFIG.PRICE_MAP[amount];
      if (!months) {
        results.push({ status: 'skipped', reason: 'invalid_amount', amount });
        continue;
      }

      const snapshot = await db.collection('users')
        .where('identCode', '==', identCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn('[Webhook] Không tìm thấy user:', identCode);
        results.push({ status: 'failed', reason: 'user_not_found', identCode });
        continue;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const now = admin.firestore.Timestamp.now();
      const currentExpiry = userData.vipExpiresAt?.toDate?.() || new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);

      await userDoc.ref.update({
        tier: 'vip',
        vipExpiresAt: admin.firestore.Timestamp.fromDate(newExpiry),
        vipUpgradedAt: now,
        lastPayment: {
          amount,
          months,
          description,
          paidAt: now,
        },
      });

      console.log(`[Webhook] ✅ VIP cho ${userDoc.id} (${identCode}) — ${months} tháng`);
      results.push({ status: 'success', uid: userDoc.id, identCode, months });
    }

    return res.status(200).json({ ok: true, results });
  } catch (error) {
    console.error('[Webhook] Lỗi:', error);
    return res.status(500).json({ ok: false, error: error.message });
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
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { uid, identCode } = req.body || {};
    if (!uid || !identCode) {
      return res.status(400).json({ ok: false, error: 'Missing uid or identCode' });
    }

    await db.collection('users').doc(uid).set(
      { identCode },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});