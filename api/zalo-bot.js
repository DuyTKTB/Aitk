/**
 * api/zalo-bot.js — Vercel Serverless Webhook cho Bot Zalo Độc Lập (Zalo Bot Platform)
 * -----------------------------------------------------------------------------------
 * Cho phép Bot Zalo độc lập (tạo từ https://bot.zaloplatforms.com) chạy tự động 24/7
 * kể cả khi tắt máy tính cá nhân.
 *
 * Biến môi trường trên Vercel:
 *  - ZALO_BOT_TOKEN      : Token Bot từ Zalo Bot Creator (dạng 123456789:secret)
 *  - ZALO_WEBHOOK_SECRET : (Tùy chọn) Chuỗi bí mật khớp với secret_token khi gọi setWebhook
 */

import {
  DEFAULT_FAQ_RULES,
  TARGET_ZALO_GROUP_URL,
  decideBotReply,
  extractZaloBotUpdate,
  getAiKeyStats,
  getZaloBotEnvConfig,
  sendZaloBotMessage,
} from '../scripts/zalo-bot/knowledge.mjs';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  const { botToken, webhookSecret } = getZaloBotEnvConfig();

  if (req.method === 'GET') {
    res.status(200).json({
      ok: true,
      service: 'ELEC AI Zalo Bot Webhook',
      hasBotToken: Boolean(botToken),
      hasWebhookSecret: Boolean(webhookSecret),
      targetGroupUrl: TARGET_ZALO_GROUP_URL,
      aiKeys: getAiKeyStats(),
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
  }

  if (body?.action === 'simulate') {
    const text = String(body.text || '').trim();
    const senderName = String(body.senderName || 'Thầy/Cô Demo').trim();
    try {
      const decision = await decideBotReply({
        text,
        senderName,
        isMentioned: Boolean(body.isMentioned),
        botDisplayName: 'Bot Elec AI',
        config: {
          replyModes: {
            commands: true,
            mentionOrCall: true,
            keywordSmart: true,
            aiFallbackOnQuestion: true,
          },
          faqRules: DEFAULT_FAQ_RULES,
        },
      });
      res.status(200).json({ ok: true, decision });
    } catch (err) {
      res.status(500).json({ ok: false, error: err?.message || 'Lỗi giả lập phản hồi' });
    }
    return;
  }

  if (webhookSecret) {
    const incomingSecret = String(
      req.headers?.['x-bot-api-secret-token'] || req.headers?.['X-Bot-Api-Secret-Token'] || '',
    ).trim();
    if (incomingSecret !== webhookSecret) {
      res.status(403).json({ ok: false, error: 'Invalid webhook secret token' });
      return;
    }
  }

  const update = extractZaloBotUpdate(body);
  if (!update || !update.chatId || !update.text || update.isBotSender) {
    res.status(200).json({ ok: true, ignored: true, reason: 'non-text-or-empty-update' });
    return;
  }

  if (update.eventName && !/message/i.test(update.eventName)) {
    res.status(200).json({ ok: true, ignored: true, reason: `event:${update.eventName}` });
    return;
  }

  if (!botToken) {
    res.status(503).json({
      ok: false,
      error: 'Chưa cấu hình ZALO_BOT_TOKEN trong biến môi trường máy chủ',
    });
    return;
  }

  try {
    const decision = await decideBotReply({
      text: update.text,
      senderName: update.senderName,
      // Trên Zalo Bot Platform, trong nhóm Bot chỉ nhận tin khi được @tag hoặc Reply nên isMentioned = true
      isMentioned: true,
      botDisplayName: 'Bot Elec AI',
      config: {
        replyModes: {
          commands: true,
          mentionOrCall: true,
          keywordSmart: true,
          aiFallbackOnQuestion: true,
        },
        faqRules: DEFAULT_FAQ_RULES,
      },
    });

    if (decision.shouldReply && decision.reply) {
      await sendZaloBotMessage(botToken, update.chatId, decision.reply);
    }

    res.status(200).json({
      ok: true,
      replied: Boolean(decision.shouldReply && decision.reply),
      mode: decision.mode,
      reason: decision.reason,
      notifyAdmin: Boolean(decision.notifyAdmin),
      chatId: update.chatId,
      chatType: update.chatType,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err?.message || 'Lỗi xử lý webhook Zalo Bot',
    });
  }
}
