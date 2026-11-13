/* ============================================================
   /api/email-otp.js — Vercel Serverless Function
   Gửi mã OTP 6 số (Xác thực Gmail & Quên mật khẩu) từ elecai@elecai.id.vn
   Hỗ trợ: SMTP trực tiếp (Lark Mail/Zoho/Google) · Brevo · Resend
   ============================================================ */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import * as templates from '../src/lib/emailTemplates.js';

const {
  BRAND_EMAIL = 'elecai@elecai.id.vn',
  BRAND_SITE = 'https://www.elecai.id.vn',
  OTP_EXPIRY_MS = 10 * 60 * 1000,
  OTP_MAX_ATTEMPTS = 5,
  OTP_RESEND_COOLDOWN_MS = 60 * 1000,
  buildOtpEmailHtml,
  buildPasswordResetEmailHtml,
  buildPasswordResetOtpEmailHtml,
} = templates;

const isValidOtpFormat = templates.isValidOtpFormat || ((code) => /^\d{6}$/.test(String(code ?? '').trim()));

const buildOtpEmailText = templates.buildOtpEmailText || (({ code, email, name, appName = 'ELEC AI' }) =>
  `Xin chào ${name || 'bạn'},\n\nMã xác thực kích hoạt tài khoản ${appName} của bạn là: ${code}\n(Hiệu lực trong 10 phút, tối đa 5 lần nhập).\n\nTài khoản: ${email}\n\nTrân trọng,\nĐội ngũ ${appName}\n${BRAND_SITE}`
);

const buildPasswordResetOtpEmailText = templates.buildPasswordResetOtpEmailText || (({ code, email, name, appName = 'ELEC AI' }) =>
  `Xin chào ${name || 'bạn'},\n\nMã OTP đặt lại mật khẩu ${appName} của bạn là: ${code}\n(Hiệu lực trong 10 phút, tối đa 5 lần nhập).\n\nTài khoản: ${email}\n\nTrân trọng,\nĐội ngũ ${appName}\n${BRAND_SITE}`
);

const buildPasswordResetEmailText = templates.buildPasswordResetEmailText || (({ resetLink, email, name, appName = 'ELEC AI' }) =>
  `Xin chào ${name || 'bạn'},\n\nLiên kết đặt lại mật khẩu ${appName} của bạn là:\n${resetLink}\n\nTrân trọng,\nĐội ngũ ${appName}\n${BRAND_SITE}`
);

async function getTemplates() {
  if (!process.env.VERCEL) {
    try {
      const p = `${pathToFileURL(path.resolve(process.cwd(), 'src/lib/emailTemplates.js')).href}?t=${Date.now()}`;
      return await import(p);
    } catch {
      return templates;
    }
  }
  return templates;
}

function getResendApiKey() {
  return process.env.RESEND_API_KEY || '';
}

function getServiceAccountFromEnv() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const decoded = rawJson.trim().startsWith('{')
        ? rawJson
        : Buffer.from(rawJson, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  if (!process.env.VERCEL) {
    const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
      try {
        return JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function ensureAdmin() {
  if (getApps().length > 0) return getApp();
  const sa = getServiceAccountFromEnv();
  if (!sa) return null;
  return initializeApp({
    credential: cert(sa),
  });
}

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtpCode(scopeKey, code, secret = '') {
  const key = String(secret || process.env.OTP_SECRET || process.env.FIREBASE_PRIVATE_KEY || 'elec-ai-otp-salt');
  return crypto.createHmac('sha256', key).update(`${scopeKey}:${String(code).trim()}`).digest('hex');
}

export function verifyOtpHash(scopeKey, inputCode, expectedHash, secret = '') {
  if (!expectedHash || !isValidOtpFormat(inputCode)) return false;
  const actualHash = hashOtpCode(scopeKey, inputCode, secret);
  const a = Buffer.from(actualHash, 'hex');
  const b = Buffer.from(String(expectedHash), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Trích oobCode từ link mặc định của Firebase để trỏ sang trang đẹp của ELEC AI (#auth-action)
 */
export function buildCustomActionLink(firebaseLink, siteOrigin = BRAND_SITE) {
  try {
    const u = new URL(firebaseLink);
    const mode = u.searchParams.get('mode') || 'resetPassword';
    const oobCode = u.searchParams.get('oobCode');
    if (!oobCode) return firebaseLink;
    const base = String(siteOrigin || BRAND_SITE).replace(/\/+$/, '');
    return `${base}/#auth-action?mode=${encodeURIComponent(mode)}&oobCode=${encodeURIComponent(oobCode)}`;
  } catch {
    return firebaseLink;
  }
}

function getSmtpHost() {
  return process.env.SMTP_HOST || (process.env.SMTP_PASS ? 'smtp.larksuite.com' : '');
}

function hasSmtpConfig() {
  return Boolean(getSmtpHost() && (process.env.SMTP_USER || process.env.OTP_FROM_EMAIL || BRAND_EMAIL) && process.env.SMTP_PASS);
}

function hasEmailProviderConfig() {
  return Boolean(getResendApiKey()) || hasSmtpConfig() || Boolean(process.env.BREVO_API_KEY);
}

async function sendBrandedEmail({ toEmail, subject, text = '', html, replyTo = BRAND_EMAIL }) {
  const fromEmail = process.env.OTP_FROM_EMAIL || process.env.SMTP_USER || BRAND_EMAIL;
  const fromName = process.env.OTP_FROM_NAME || 'ELEC AI';
  const resendKey = getResendApiKey();
  const errors = [];

  // 1. Kênh Ưu tiên: Resend API (Giao vận tin cậy, tên miền elecai.id.vn đã verify chuẩn)
  if (resendKey) {
    try {
      const resendSender = process.env.RESEND_FROM || `${fromName} <${fromEmail}>`;
      let resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: resendSender,
          reply_to: replyTo,
          to: [toEmail],
          subject,
          text: text || undefined,
          html,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        // Nếu tên miền elecai.id.vn chưa verify trên Resend, sandbox của Resend cho phép gửi bằng onboarding@resend.dev tới email chủ sở hữu
        if (errText.includes('is not verified') && !resendSender.includes('resend.dev')) {
          console.warn('[Resend] elecai.id.vn chưa verify trên Resend, thử sandbox onboarding@resend.dev...');
          const retryResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: `${fromName} <onboarding@resend.dev>`,
              reply_to: replyTo,
              to: [toEmail],
              subject,
              text: text || undefined,
              html,
            }),
          });
          if (retryResp.ok) {
            return 'resend';
          }
          const retryErr = await retryResp.text().catch(() => '');
          errors.push(`Resend: ${retryErr.slice(0, 140)}`);
        } else {
          errors.push(`Resend: ${errText.slice(0, 140)}`);
        }
      } else {
        return 'resend';
      }
    } catch (err) {
      errors.push(`Resend: ${err.message}`);
    }
  }

  // 2. Kênh Dự phòng 1: SMTP trực tiếp (Lark Mail / Corporate Mail)
  if (hasSmtpConfig()) {
    try {
      const port = Number(process.env.SMTP_PORT) || 465;
      const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
      const transporter = nodemailer.createTransport({
        host: getSmtpHost(),
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER || fromEmail,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        replyTo,
        subject,
        text: text || undefined,
        html,
        headers: {
          'X-Entity-Ref-ID': crypto.randomUUID(),
          'Auto-Submitted': 'auto-generated',
        },
      });
      return 'smtp';
    } catch (err) {
      errors.push(`SMTP: ${err.message}`);
    }
  }

  // 3. Kênh Dự phòng 2: Brevo API
  if (process.env.BREVO_API_KEY) {
    try {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          replyTo: { email: replyTo, name: fromName },
          to: [{ email: toEmail }],
          subject,
          textContent: text || undefined,
          htmlContent: html,
        }),
      });
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        errors.push(`Brevo: ${errBody.slice(0, 140)}`);
      } else {
        return 'brevo';
      }
    } catch (err) {
      errors.push(`Brevo: ${err.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Tất cả kênh gửi email đều thất bại: ${errors.join(' | ')}`);
  }

  throw new Error('OTP_PROVIDER_NOT_CONFIGURED');
}

// ------------------------------------------------------------
// Rate Limiting & Anti-DDoS Tầng Ứng Dụng (In-Memory Sliding Window)
// ------------------------------------------------------------
const IP_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 phút
const IP_MAX_SEND_REQUESTS = 5; // Tối đa 5 lần gửi OTP / IP / 10 phút
const IP_MAX_VERIFY_REQUESTS = 15; // Tối đa 15 lần xác thực / IP / 10 phút
const ipRateStore = new Map();

function cleanOldIpRecords(now) {
  if (ipRateStore.size > 2000) {
    for (const [k, v] of ipRateStore.entries()) {
      if (now - v.resetAt > 0) {
        ipRateStore.delete(k);
      }
    }
  }
}

export function getClientIp(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return String(xForwardedFor).split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

function checkIpRateLimit(ip, type = 'send', now = Date.now()) {
  cleanOldIpRecords(now);
  const key = `${type}_${ip}`;
  const record = ipRateStore.get(key) || { count: 0, resetAt: now + IP_RATE_WINDOW_MS };

  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + IP_RATE_WINDOW_MS;
    ipRateStore.set(key, record);
    return { allowed: true, remaining: (type === 'send' ? IP_MAX_SEND_REQUESTS : IP_MAX_VERIFY_REQUESTS) - 1 };
  }

  const limit = type === 'send' ? IP_MAX_SEND_REQUESTS : IP_MAX_VERIFY_REQUESTS;
  if (record.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  record.count += 1;
  ipRateStore.set(key, record);
  return { allowed: true, remaining: limit - record.count };
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    return (
      host === 'elecai.id.vn' ||
      host === 'www.elecai.id.vn' ||
      host.endsWith('.elecai.id.vn') ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

async function verifyTurnstileToken(token, clientIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return true;
  try {
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    if (clientIp) form.append('remoteip', clientIp);

    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const outcome = await r.json();
    return Boolean(outcome.success);
  } catch (e) {
    console.warn('[Turnstile] Lỗi kiểm tra:', e?.message || e);
    return true; // Fail-open khi mạng lỗi để không ảnh hưởng người dùng thật
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  // 1. Chống Buffer Flood (Kích thước payload tối đa 32KB)
  const rawLen = Number(req.headers['content-length'] || 0);
  if (rawLen > 32768) {
    return res.status(413).json({ ok: false, message: 'Payload quá lớn.' });
  }

  // 2. Chống CSRF & Cross-Domain API Abuse (Kiểm tra Origin / Referer)
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ ok: false, message: 'Yêu cầu từ nguồn không được cấp phép.' });
  }

  if (!hasEmailProviderConfig()) {
    return res.status(503).json({
      ok: false,
      code: 'OTP_PROVIDER_NOT_CONFIGURED',
      message: 'Chưa cấu hình dịch vụ gửi email trên server.',
    });
  }

  const app = ensureAdmin();
  if (!app) {
    return res.status(503).json({
      ok: false,
      code: 'OTP_PROVIDER_NOT_CONFIGURED',
      message: 'Chưa cấu hình FIREBASE_SERVICE_ACCOUNT_JSON trên server.',
    });
  }

  const db = getFirestore(app);
  const authAdmin = getAuth(app);
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = body.action;
  const now = Date.now();
  const appName = process.env.OTP_APP_NAME || 'ELEC AI';
  const clientIp = getClientIp(req);

  // 3. Bẫy Bot Honeypot (Bot tự động điền trường ẩn sẽ bị bỏ qua và trả về OK giả)
  if (body.hp_website || body.bot_trap || body.address_extra) {
    return res.status(200).json({ ok: true, sentTo: body.email || 'ok' });
  }

  // 4. Rate Limiting theo địa chỉ IP (Chống Spam / DoS API)
  const isSendAction = action === 'send_reset_otp' || action === 'forgot_password' || action === 'send';
  const ipCheck = checkIpRateLimit(clientIp, isSendAction ? 'send' : 'verify', now);
  if (!ipCheck.allowed) {
    return res.status(429).json({
      ok: false,
      code: 'IP_RATE_LIMITED',
      retryAfterSec: ipCheck.retryAfterSec,
      message: `Địa chỉ IP của bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${ipCheck.retryAfterSec} giây.`,
    });
  }

  // 5. Xác thực Cloudflare Turnstile (nếu có cung cấp token)
  const turnstileToken = body.turnstileToken || req.headers['cf-turnstile-response'];
  if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
    const isTokenValid = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!isTokenValid) {
      return res.status(403).json({ ok: false, code: 'CAPTCHA_FAILED', message: 'Xác thực bảo vệ bot thất bại.' });
    }
  }

  /* ============================================================
     1. QUÊN MẬT KHẨU BẰNG MÃ OTP 6 SỐ (Gửi mã)
     ============================================================ */
  if (action === 'send_reset_otp') {
    const targetEmail = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(targetEmail)) {
      return res.status(400).json({ ok: false, message: 'Email không hợp lệ.' });
    }

    const docKey = `reset_otp_${crypto.createHash('sha256').update(targetEmail).digest('hex')}`;
    const otpRef = db.collection('email_otp_codes').doc(docKey);
    const snap = await otpRef.get();
    if (snap.exists) {
      const elapsed = now - (Number(snap.data()?.lastSentAt) || 0);
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          ok: false,
          code: 'OTP_COOLDOWN',
          retryAfterSec,
          message: `Vui lòng đợi ${retryAfterSec} giây trước khi gửi lại mã.`,
        });
      }
    }

    try {
      const tpl = await getTemplates();
      const userRecord = await authAdmin.getUserByEmail(targetEmail);
      const code = generateOtpCode();
      const hash = hashOtpCode(docKey, code);
      const name = userRecord.displayName || '';
      const avatarUrl = userRecord.photoURL || '';
      const fnHtml = tpl.buildPasswordResetOtpEmailHtml || buildPasswordResetOtpEmailHtml;
      const fnText = tpl.buildPasswordResetOtpEmailText || buildPasswordResetOtpEmailText;
      const html = fnHtml({
        code,
        email: targetEmail,
        name,
        avatarUrl,
        appName,
      });
      const text = fnText({
        code,
        email: targetEmail,
        name,
        appName,
      });

      await sendBrandedEmail({
        toEmail: targetEmail,
        subject: `Mã xác thực đặt lại mật khẩu - ${appName}`,
        text,
        html,
      });

      await otpRef.set({
        uid: userRecord.uid,
        email: targetEmail,
        hash,
        attempts: 0,
        lastSentAt: now,
        expiresAt: now + OTP_EXPIRY_MS,
      });
    } catch (err) {
      if (err?.code !== 'auth/user-not-found') {
        console.warn('[send_reset_otp] lỗi:', err?.message || err);
        return res.status(500).json({ ok: false, message: 'Không gửi được email lúc này. Thử lại sau.' });
      }
      // Chống dò email tồn tại: vẫn ghi cooldown nhẹ và trả ok
      await otpRef.set({ lastSentAt: now, expiresAt: now + OTP_EXPIRY_MS, dummy: true }).catch(() => {});
    }

    return res.status(200).json({ ok: true, sentTo: targetEmail });
  }

  /* ============================================================
     2. QUÊN MẬT KHẨU BẰNG MÃ OTP 6 SỐ (Xác nhận OTP & Đổi mật khẩu)
     ============================================================ */
  if (action === 'verify_reset_otp') {
    const targetEmail = String(body.email || '').trim().toLowerCase();
    const inputCode = String(body.code || '').trim();
    const newPassword = String(body.newPassword || '');

    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(targetEmail)) {
      return res.status(400).json({ ok: false, message: 'Email không hợp lệ.' });
    }
    if (!isValidOtpFormat(inputCode)) {
      return res.status(400).json({ ok: false, message: 'Mã OTP phải gồm đúng 6 chữ số.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ ok: false, message: 'Mật khẩu mới cần ít nhất 8 ký tự.' });
    }

    const docKey = `reset_otp_${crypto.createHash('sha256').update(targetEmail).digest('hex')}`;
    const otpRef = db.collection('email_otp_codes').doc(docKey);
    const snap = await otpRef.get();
    if (!snap.exists || snap.data()?.dummy) {
      return res.status(400).json({ ok: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn.' });
    }

    const rec = snap.data() || {};
    if (now > (Number(rec.expiresAt) || 0)) {
      await otpRef.delete().catch(() => {});
      return res.status(400).json({ ok: false, message: 'Mã OTP đã hết hạn (quá 10 phút). Hãy yêu cầu mã mới.' });
    }
    if ((Number(rec.attempts) || 0) >= OTP_MAX_ATTEMPTS) {
      await otpRef.delete().catch(() => {});
      return res.status(429).json({ ok: false, message: 'Bạn nhập sai quá 5 lần. Hãy yêu cầu mã OTP mới.' });
    }
    if (!verifyOtpHash(docKey, inputCode, rec.hash)) {
      const nextAttempts = (Number(rec.attempts) || 0) + 1;
      await otpRef.update({ attempts: nextAttempts });
      const left = Math.max(0, OTP_MAX_ATTEMPTS - nextAttempts);
      return res.status(400).json({
        ok: false,
        message: left > 0 ? `Mã OTP không đúng (còn ${left} lần thử).` : 'Nhập sai quá 5 lần. Hãy yêu cầu mã mới.',
      });
    }

    await authAdmin.updateUser(rec.uid, {
      password: newPassword,
      emailVerified: true,
    });
    await otpRef.delete().catch(() => {});
    return res.status(200).json({ ok: true, reset: true });
  }

  /* ============================================================
     3. QUÊN MẬT KHẨU BẰNG LINK TRÊN TRANG RIÊNG CỦA ELEC AI
     ============================================================ */
  if (action === 'forgot_password') {
    const targetEmail = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(targetEmail)) {
      return res.status(400).json({ ok: false, message: 'Email không hợp lệ.' });
    }

    const rateKey = crypto.createHash('sha256').update(targetEmail).digest('hex');
    const rateRef = db.collection('email_otp_codes').doc(`reset_${rateKey}`);
    const rateSnap = await rateRef.get();
    if (rateSnap.exists) {
      const elapsed = now - (Number(rateSnap.data()?.lastSentAt) || 0);
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          ok: false,
          code: 'OTP_COOLDOWN',
          retryAfterSec,
          message: `Vui lòng đợi ${retryAfterSec} giây trước khi gửi lại.`,
        });
      }
    }

    try {
      const tpl = await getTemplates();
      const userRecord = await authAdmin.getUserByEmail(targetEmail);
      const rawFirebaseLink = await authAdmin.generatePasswordResetLink(targetEmail);
      const resetLink = buildCustomActionLink(rawFirebaseLink, body.origin || BRAND_SITE);
      const name = userRecord.displayName || '';
      const avatarUrl = userRecord.photoURL || '';
      const fnHtml = tpl.buildPasswordResetEmailHtml || buildPasswordResetEmailHtml;
      const fnText = tpl.buildPasswordResetEmailText || buildPasswordResetEmailText;
      const html = fnHtml({
        resetLink,
        email: targetEmail,
        name,
        avatarUrl,
        appName,
      });
      const text = fnText({
        resetLink,
        email: targetEmail,
        name,
        appName,
      });
      await sendBrandedEmail({
        toEmail: targetEmail,
        subject: `Liên kết đặt lại mật khẩu - ${appName}`,
        text,
        html,
      });
      await rateRef.set({ lastSentAt: now });
    } catch (err) {
      if (err?.code !== 'auth/user-not-found') {
        console.warn('[forgot_password] lỗi:', err?.message || err);
      }
    }

    return res.status(200).json({ ok: true });
  }

  /* ============================================================
     4. XÁC THỰC EMAIL ĐĂNG KÝ BẰNG MÃ OTP 6 SỐ (Cần ID Token)
     ============================================================ */
  const authHeader = String(req.headers.authorization || '');
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) {
    return res.status(401).json({ ok: false, message: 'Thiếu token xác thực.' });
  }

  let decoded;
  try {
    decoded = await authAdmin.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ ok: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }

  const uid = decoded.uid;
  const email = decoded.email;
  if (!uid || !email) {
    return res.status(400).json({ ok: false, message: 'Tài khoản không có email.' });
  }

  if (decoded.email_verified === true) {
    return res.status(200).json({ ok: true, alreadyVerified: true });
  }

  const otpRef = db.collection('email_otp_codes').doc(uid);

  if (action === 'send') {
    const snap = await otpRef.get();
    if (snap.exists) {
      const existing = snap.data() || {};
      const elapsed = now - (Number(existing.lastSentAt) || 0);
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfterSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          ok: false,
          code: 'OTP_COOLDOWN',
          retryAfterSec,
          message: `Vui lòng đợi ${retryAfterSec} giây trước khi gửi lại mã.`,
        });
      }
    }

    const tpl = await getTemplates();
    const code = generateOtpCode();
    const hash = hashOtpCode(uid, code);
    const name = decoded.name || '';
    const avatarUrl = decoded.picture || '';
    const fnHtml = tpl.buildOtpEmailHtml || buildOtpEmailHtml;
    const fnText = tpl.buildOtpEmailText || buildOtpEmailText;
    const html = fnHtml({
      code,
      email,
      name,
      avatarUrl,
      appName,
    });
    const text = fnText({
      code,
      email,
      name,
      appName,
    });

    await sendBrandedEmail({
      toEmail: email,
      subject: `Mã xác thực kích hoạt tài khoản - ${appName}`,
      text,
      html,
    });

    await otpRef.set({
      hash,
      email,
      attempts: 0,
      lastSentAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
    });

    return res.status(200).json({
      ok: true,
      sentTo: email,
      expiresInSec: Math.round(OTP_EXPIRY_MS / 1000),
    });
  }

  if (action === 'verify') {
    const inputCode = String(body.code || '').trim();
    if (!isValidOtpFormat(inputCode)) {
      return res.status(400).json({ ok: false, message: 'Mã xác thực phải gồm đúng 6 chữ số.' });
    }

    const snap = await otpRef.get();
    if (!snap.exists) {
      return res.status(400).json({
        ok: false,
        code: 'OTP_NOT_FOUND',
        message: 'Chưa có mã OTP hoặc mã đã được sử dụng. Hãy bấm gửi mã mới.',
      });
    }

    const rec = snap.data() || {};
    if (rec.email !== email) {
      return res.status(400).json({ ok: false, message: 'Email không khớp. Hãy gửi mã mới.' });
    }
    if (now > (Number(rec.expiresAt) || 0)) {
      await otpRef.delete().catch(() => {});
      return res.status(400).json({
        ok: false,
        code: 'OTP_EXPIRED',
        message: 'Mã OTP đã hết hạn (quá 10 phút). Hãy bấm gửi mã mới.',
      });
    }
    if ((Number(rec.attempts) || 0) >= OTP_MAX_ATTEMPTS) {
      await otpRef.delete().catch(() => {});
      return res.status(429).json({
        ok: false,
        code: 'OTP_TOO_MANY_ATTEMPTS',
        message: 'Bạn nhập sai quá 5 lần. Hãy bấm gửi lại mã OTP mới.',
      });
    }

    if (!verifyOtpHash(uid, inputCode, rec.hash)) {
      const nextAttempts = (Number(rec.attempts) || 0) + 1;
      await otpRef.update({ attempts: nextAttempts });
      const left = Math.max(0, OTP_MAX_ATTEMPTS - nextAttempts);
      return res.status(400).json({
        ok: false,
        code: 'OTP_INVALID',
        message: left > 0
          ? `Mã xác thực không đúng (còn ${left} lần thử).`
          : 'Bạn đã nhập sai quá số lần quy định. Hãy yêu cầu mã mới.',
      });
    }

    await authAdmin.updateUser(uid, { emailVerified: true });
    await otpRef.delete().catch(() => {});

    return res.status(200).json({ ok: true, verified: true });
  }

  return res.status(400).json({ ok: false, message: 'Action không hợp lệ.' });
}
