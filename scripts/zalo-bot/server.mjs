import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import {
  TARGET_ZALO_GROUP_URL,
  OFFICIAL_YOUTUBE_CHANNEL_URL,
  DEFAULT_WELCOME_TEMPLATE,
  DEFAULT_FAQ_RULES,
  decideBotReply,
  getAiKeyStats,
  getZaloBotEnvConfig,
  loadDotEnv,
  callZaloBotApi,
  sendZaloBotMessage,
  extractZaloBotUpdate,
} from './knowledge.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
const DEFAULT_WEBHOOK_URL = 'https://www.elecai.id.vn/api/zalo-bot';

loadDotEnv();
fs.mkdirSync(DATA_DIR, { recursive: true });

/* ============================================================
   CẤU HÌNH BỀN VỮNG (config.json)
   ============================================================ */
function createDefaultConfig() {
  return {
    botEnabled: true,
    targetGroupUrl: TARGET_ZALO_GROUP_URL,
    allowedGroupIds: [],
    onlyTargetGroup: false,
    webhookUrl: DEFAULT_WEBHOOK_URL,
    replyModes: {
      commands: true,
      mentionOrCall: true,
      keywordSmart: true,
      aiFallbackOnQuestion: true,
      welcomeNewMember: true,
    },
    cooldownSeconds: 10,
    botAliases: ['bot', 'trợ lý', 'tro ly', 'elec ai', 'elec'],
    welcomeTemplate: DEFAULT_WELCOME_TEMPLATE,
    faqRules: DEFAULT_FAQ_RULES,
  };
}

function sanitizeConfig(raw = {}) {
  const base = createDefaultConfig();
  const next = {
    ...base,
    ...raw,
    replyModes: {
      ...base.replyModes,
      ...(raw.replyModes || {}),
    },
  };
  next.botEnabled = Boolean(next.botEnabled);
  next.allowedGroupIds = Array.isArray(next.allowedGroupIds)
    ? [...new Set(next.allowedGroupIds.map((id) => String(id).trim()).filter(Boolean))]
    : [];
  // Nếu chưa khóa nhóm nào thì không chặn nhầm tin nhắn đầu tiên từ Bot Platform
  next.onlyTargetGroup = Boolean(raw.onlyTargetGroup) && next.allowedGroupIds.length > 0;
  next.targetGroupUrl = String(next.targetGroupUrl || TARGET_ZALO_GROUP_URL).trim();
  next.webhookUrl = String(next.webhookUrl || DEFAULT_WEBHOOK_URL).trim();
  next.cooldownSeconds = Math.max(0, Math.min(300, Number(next.cooldownSeconds ?? 10) || 0));
  next.botAliases = Array.isArray(next.botAliases)
    ? next.botAliases.map((a) => String(a).trim()).filter(Boolean)
    : base.botAliases;
  next.welcomeTemplate = String(next.welcomeTemplate || DEFAULT_WELCOME_TEMPLATE);
  if (Array.isArray(raw.faqRules) && raw.faqRules.length > 0) {
    next.faqRules = raw.faqRules.map((r, idx) => ({
      id: String(r.id || `rule-${idx + 1}`).trim(),
      title: String(r.title || `Quy tắc ${idx + 1}`).trim(),
      enabled: r.enabled !== false,
      notifyAdmin: Boolean(r.notifyAdmin),
      keywords: Array.isArray(r.keywords)
        ? r.keywords.map((k) => String(k).trim()).filter(Boolean)
        : String(r.keywords || '')
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
      reply: String(r.reply || '').trim(),
    }));
  } else {
    next.faqRules = base.faqRules;
  }
  return next;
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      const sanitized = sanitizeConfig(parsed);
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(sanitized, null, 2), 'utf8');
      return sanitized;
    }
  } catch (err) {
    console.error('[Config] Lỗi đọc config.json, dùng mặc định:', err.message);
  }
  const initial = createDefaultConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(initial, null, 2), 'utf8');
  return initial;
}

function saveConfig(cfg) {
  const sanitized = sanitizeConfig(cfg);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(sanitized, null, 2), 'utf8');
  return sanitized;
}

let config = loadConfig();

/* ============================================================
   LƯU TRỮ TOKEN BOT ĐỘC LẬP (credentials.json)
   ============================================================ */
function loadBotCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
      if (parsed?.botToken) {
        return {
          botToken: String(parsed.botToken).trim(),
          mode: parsed.mode === 'webhook' ? 'webhook' : 'polling',
          webhookUrl: String(parsed.webhookUrl || config.webhookUrl || DEFAULT_WEBHOOK_URL).trim(),
          webhookSecret: String(parsed.webhookSecret || '').trim(),
          botInfo: parsed.botInfo || null,
        };
      }
    }
  } catch (err) {
    console.error('[Credentials] Lỗi đọc credentials.json:', err.message);
  }

  const envBot = getZaloBotEnvConfig();
  if (envBot.botToken) {
    return {
      botToken: envBot.botToken,
      mode: 'polling',
      webhookUrl: config.webhookUrl || DEFAULT_WEBHOOK_URL,
      webhookSecret: envBot.webhookSecret || '',
      botInfo: null,
    };
  }
  return null;
}

function saveBotCredentials(creds) {
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(
      {
        botToken: creds.botToken,
        mode: creds.mode === 'webhook' ? 'webhook' : 'polling',
        webhookUrl: creds.webhookUrl || config.webhookUrl || DEFAULT_WEBHOOK_URL,
        webhookSecret: creds.webhookSecret || '',
        botInfo: creds.botInfo || null,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function maskToken(token = '') {
  const s = String(token || '').trim();
  if (!s) return '';
  const colon = s.indexOf(':');
  if (colon > 0) {
    const prefix = s.slice(0, colon);
    const tail = s.slice(-4);
    return `${prefix}:••••${tail}`;
  }
  if (s.length <= 8) return '••••••••';
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

/* ============================================================
   TRẠNG THÁI RUNTIME, NHẬT KÝ & CẢNH BÁO ADMIN
   ============================================================ */
const state = {
  connectionStatus: 'disconnected', // disconnected | connecting | connected_polling | connected_webhook | error
  statusMessage: 'Chưa kết nối Zalo Bot Token. Tạo Bot miễn phí tại bot.zaloplatforms.com rồi dán Token vào đây.',
  mode: 'polling', // polling | webhook
  botInfo: null, // { id, account_name, display_name, account_type }
  webhookUrl: config.webhookUrl || DEFAULT_WEBHOOK_URL,
  detectedChats: new Map(), // chatId -> { chatId, title, chatType, isGroup, lastMessageAt, lastSender }
  logs: [],
  adminAlerts: [],
  stats: {
    receivedCount: 0,
    repliedCount: 0,
    welcomedCount: 0,
    aiRepliedCount: 0,
  },
};

let activeToken = '';
let activeSecret = '';
let pollingEpoch = 0;
const processedMessageIds = new Set();
const userCooldownMap = new Map();

function pushLog(level, title, detail = '') {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: new Date().toISOString(),
    level,
    title,
    detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
  };
  state.logs.unshift(entry);
  if (state.logs.length > 150) state.logs.length = 150;
  const tag = level === 'error' ? 'ERR' : level === 'warn' ? 'WRN' : level === 'bot' ? 'BOT' : 'INF';
  console.log(`[${new Date().toLocaleTimeString('vi-VN')}] [${tag}] ${title}${entry.detail ? ' — ' + entry.detail.slice(0, 140) : ''}`);
}

function pushAdminAlert({ chatId, groupName, senderId, senderName, message, reason }) {
  const alertItem = {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toISOString(),
    chatId: chatId || '',
    groupId: chatId || '',
    groupName: groupName || 'Nhóm Giáo viên ELEC AI',
    senderId: senderId || 'sim-user',
    senderName: senderName || 'Khách hàng',
    message: String(message || ''),
    reason: String(reason || ''),
    resolved: false,
  };
  state.adminAlerts.unshift(alertItem);
  if (state.adminAlerts.length > 100) state.adminAlerts.length = 100;
  return alertItem;
}

function upsertDetectedChat(chatId, info = {}) {
  const id = String(chatId || '').trim();
  if (!id) return;
  const prev = state.detectedChats.get(id) || {
    chatId: id,
    groupId: id,
    title: `Cuộc trò chuyện ${id}`,
    name: `Cuộc trò chuyện ${id}`,
    chatType: info.isGroup ? 'group' : '1_1',
    isGroup: Boolean(info.isGroup),
    lastMessageAt: null,
    lastSender: '',
  };
  const nextTitle = info.title || info.name || prev.title;
  state.detectedChats.set(id, {
    ...prev,
    ...info,
    chatId: id,
    groupId: id,
    title: nextTitle,
    name: nextTitle,
  });
}

function addAllowedGroupId(chatId) {
  const id = String(chatId || '').trim();
  if (!id) return false;
  if (!config.allowedGroupIds.includes(id)) {
    config = saveConfig({
      ...config,
      allowedGroupIds: [...config.allowedGroupIds, id],
    });
    return true;
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function markMessageProcessed(msgId) {
  if (!msgId) return true;
  if (processedMessageIds.has(msgId)) return false;
  processedMessageIds.add(msgId);
  if (processedMessageIds.size > 500) {
    const oldest = processedMessageIds.values().next().value;
    if (oldest) processedMessageIds.delete(oldest);
  }
  return true;
}

/* ============================================================
   XỬ LÝ TIN NHẮN TỪ ZALO BOT PLATFORM (getUpdates / Webhook)
   ============================================================ */
async function handleBotUpdate(rawEnvelope) {
  const update = extractZaloBotUpdate(rawEnvelope);
  if (!update || !update.chatId) return;
  if (!markMessageProcessed(update.messageId)) return;
  if (update.isBotSender) return;

  upsertDetectedChat(update.chatId, {
    title: update.chatTitle,
    chatType: update.chatType,
    isGroup: update.isGroup,
    lastMessageAt: new Date().toISOString(),
    lastSender: update.senderName,
  });

  if (update.eventName && !/message/i.test(update.eventName)) {
    pushLog('info', `Sự kiện Bot [${update.eventName}]`, `${update.chatTitle} (${update.chatId})`);
    return;
  }

  const trimmed = String(update.text || '').trim();
  if (!trimmed) return;

  const lowerCmd = trimmed.toLowerCase();
  if (lowerCmd === '!idnhom' || lowerCmd === '/idnhom') {
    await sendZaloBotMessage(
      activeToken,
      update.chatId,
      `🆔 Chat ID hiện tại: ${update.chatId}\n📌 Loại hội thoại: ${update.isGroup ? 'Nhóm chat' : 'Nhắn riêng 1-1'}\nTrạng thái Bot: ${
        !config.onlyTargetGroup || config.allowedGroupIds.includes(update.chatId)
          ? 'ĐANG BẬT ✅'
          : 'CHƯA KÍCH HOẠT ⏸️ (Gõ !kichhoatnhom để bật)'
      }`,
    );
    return;
  }

  if (lowerCmd === '!kichhoatnhom' || lowerCmd === '/kichhoatnhom') {
    addAllowedGroupId(update.chatId);
    pushLog('info', 'Đã đăng ký Chat ID vào danh sách cho phép', `${update.chatTitle} (${update.chatId})`);
    await sendZaloBotMessage(
      activeToken,
      update.chatId,
      `✅ Đã kích hoạt Trợ lý ELEC AI cho cuộc trò chuyện này (ID: ${update.chatId}). Thành viên có thể @tag tên Bot kèm câu hỏi hoặc gõ !menu để xem hướng dẫn nhanh!`,
    );
    return;
  }

  if (update.isGroup && config.onlyTargetGroup && config.allowedGroupIds.length > 0 && !config.allowedGroupIds.includes(update.chatId)) {
    return;
  }

  state.stats.receivedCount += 1;
  pushLog('info', `[${update.chatTitle}] ${update.senderName}`, trimmed);

  if (!config.botEnabled) return;

  const decision = await decideBotReply({
    text: trimmed,
    senderName: update.senderName,
    isMentioned: true,
    botDisplayName: state.botInfo?.display_name || '',
    config,
  });

  if (!decision.shouldReply || !decision.reply) return;

  const cooldownMs = Math.max(0, Number(config.cooldownSeconds || 0)) * 1000;
  const cdKey = `${update.chatId}:${update.senderId || update.senderName}`;
  const lastReplyAt = userCooldownMap.get(cdKey) || 0;
  const now = Date.now();
  if (cooldownMs > 0 && now - lastReplyAt < cooldownMs && !decision.notifyAdmin) {
    pushLog('warn', `Bỏ qua do cooldown (${config.cooldownSeconds}s)`, `${update.senderName}: ${trimmed}`);
    return;
  }
  userCooldownMap.set(cdKey, now);

  await sendZaloBotMessage(activeToken, update.chatId, decision.reply);
  state.stats.repliedCount += 1;
  if (decision.mode === 'ai') state.stats.aiRepliedCount += 1;

  pushLog('bot', `Bot đã trả lời ${update.senderName} [${decision.reason}]`, decision.reply.slice(0, 140));

  if (decision.notifyAdmin) {
    pushAdminAlert({
      chatId: update.chatId,
      groupName: update.chatTitle,
      senderId: update.senderId,
      senderName: update.senderName,
      message: trimmed,
      reason: decision.reason,
    });
    pushLog('warn', 'Cần Admin duyệt nâng cấp VIP!', `${update.senderName}: ${trimmed}`);
  }
}

/* ============================================================
   KẾT NỐI ZALO BOT TOKEN (LONG-POLLING HOẶC WEBHOOK)
   ============================================================ */
function stopPollingLoop() {
  pollingEpoch += 1;
}

async function startPollingLoop() {
  stopPollingLoop();
  const epoch = pollingEpoch;
  const token = activeToken;
  if (!token) return;

  state.mode = 'polling';
  state.connectionStatus = 'connected_polling';
  state.statusMessage = `Bot "${state.botInfo?.display_name || 'ELEC AI'}" đang chạy độc lập (Long-Polling).`;
  pushLog('info', 'Bắt đầu vòng lặp Long-Polling (getUpdates)', state.botInfo?.display_name || '');

  let consecutiveErrors = 0;

  while (epoch === pollingEpoch && activeToken === token && state.mode === 'polling') {
    try {
      const res = await callZaloBotApi(token, 'getUpdates', { timeout: 25 }, 35000);
      consecutiveErrors = 0;
      const result = res?.result;
      if (Array.isArray(result)) {
        for (const item of result) {
          await handleBotUpdate(item);
        }
      } else if (result && typeof result === 'object') {
        await handleBotUpdate(result);
      }
    } catch (err) {
      if (epoch !== pollingEpoch || state.mode !== 'polling') break;
      const msg = String(err?.message || '');
      const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError' || err?.code === 408 || /timeout|aborted/i.test(msg);
      if (isTimeout) {
        continue;
      }

      consecutiveErrors += 1;
      // Nếu lỗi xung đột webhook khi đang getUpdates -> thử xóa webhook 1 lần
      if (err?.code === 409 || /webhook/i.test(msg)) {
        pushLog('warn', 'Phát hiện xung đột Webhook, đang gọi deleteWebhook để chuyển về Long-Polling...');
        try {
          await callZaloBotApi(token, 'deleteWebhook', {});
          continue;
        } catch (delErr) {
          pushLog('error', 'Không xóa được Webhook', delErr?.message || String(delErr));
        }
      }

      if (err?.code === 401 || /unauthorized|invalid token/i.test(msg)) {
        state.connectionStatus = 'error';
        state.statusMessage = 'Zalo Bot Token không hợp lệ hoặc đã bị thu hồi.';
        pushLog('error', 'Token Bot không hợp lệ (401)', msg);
        break;
      }

      pushLog('warn', `Long-Polling gặp sự cố (lần ${consecutiveErrors})`, msg);
      await sleep(Math.min(15000, 2000 * consecutiveErrors));
    }
  }
}

async function connectWithBotToken(rawToken, { preferredMode = 'polling', webhookUrl = '', webhookSecret = '' } = {}) {
  const token = String(rawToken || '').trim();
  if (!token) throw new Error('Vui lòng nhập Zalo Bot Token.');

  stopPollingLoop();
  state.connectionStatus = 'connecting';
  state.statusMessage = 'Đang xác thực Bot Token với Zalo Bot Platform...';

  const meRes = await callZaloBotApi(token, 'getMe', undefined, 15000);
  const botInfo = meRes?.result || null;
  if (!botInfo || !botInfo.id) {
    throw new Error('Không lấy được thông tin Bot từ getMe. Kiểm tra lại Bot Token.');
  }

  activeToken = token;
  activeSecret = String(webhookSecret || '').trim();
  state.botInfo = botInfo;
  const targetWebhook = String(webhookUrl || config.webhookUrl || DEFAULT_WEBHOOK_URL).trim();
  state.webhookUrl = targetWebhook;

  if (preferredMode === 'webhook') {
    await callZaloBotApi(token, 'setWebhook', {
      url: targetWebhook,
      ...(activeSecret ? { secret_token: activeSecret } : {}),
    });
    state.mode = 'webhook';
    state.connectionStatus = 'connected_webhook';
    state.statusMessage = `Bot "${botInfo.display_name || botInfo.account_name}" đang chạy 24/7 qua Webhook (${targetWebhook}).`;
    saveBotCredentials({
      botToken: token,
      mode: 'webhook',
      webhookUrl: targetWebhook,
      webhookSecret: activeSecret,
      botInfo,
    });
    pushLog('info', 'Đã bật chế độ Webhook 24/7', `${botInfo.display_name || botInfo.id} -> ${targetWebhook}`);
    return { botInfo, mode: 'webhook' };
  }

  try {
    await callZaloBotApi(token, 'deleteWebhook', {});
  } catch (err) {
    pushLog('warn', 'Lưu ý deleteWebhook khi bật Polling', err?.message || String(err));
  }

  saveBotCredentials({
    botToken: token,
    mode: 'polling',
    webhookUrl: targetWebhook,
    webhookSecret: activeSecret,
    botInfo,
  });
  pushLog('info', 'Kết nối Bot Zalo độc lập thành công', `${botInfo.display_name || botInfo.account_name} (ID: ${botInfo.id})`);
  startPollingLoop();
  return { botInfo, mode: 'polling' };
}

async function tryAutoConnectOnBoot() {
  const creds = loadBotCredentials();
  if (!creds?.botToken) return;
  try {
    await connectWithBotToken(creds.botToken, {
      preferredMode: creds.mode || 'polling',
      webhookUrl: creds.webhookUrl || config.webhookUrl,
      webhookSecret: creds.webhookSecret || '',
    });
  } catch (err) {
    state.connectionStatus = 'error';
    state.statusMessage = `Không thể tự động kết nối Bot Token đã lưu: ${err?.message || err}`;
    pushLog('error', 'Tự động kết nối Bot Token thất bại', err?.message || String(err));
  }
}

/* ============================================================
   HTTP SERVER & REST API CHO GIAO DIỆN QUẢN LÝ
   ============================================================ */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Body quá lớn'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function getStatusSnapshot() {
  const chats = Array.from(state.detectedChats.values());
  return {
    ok: true,
    connectionStatus: state.connectionStatus,
    statusMessage: state.statusMessage,
    mode: state.mode,
    hasBotToken: Boolean(activeToken),
    maskedToken: maskToken(activeToken),
    botInfo: state.botInfo,
    webhookUrl: state.webhookUrl,
    detectedChats: chats,
    detectedGroups: chats,
    adminAlerts: state.adminAlerts,
    logs: state.logs,
    stats: state.stats,
    aiKeys: getAiKeyStats(),
    officialYoutubeUrl: OFFICIAL_YOUTUBE_CHANNEL_URL,
    config,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      const htmlPath = path.join(PUBLIC_DIR, 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/status') {
      sendJson(res, 200, getStatusSnapshot());
      return;
    }

    if (req.method === 'POST' && pathname === '/api/connect-token') {
      const body = await readJsonBody(req);
      const tokenToUse = String(body.botToken || activeToken || loadBotCredentials()?.botToken || '').trim();
      const result = await connectWithBotToken(tokenToUse, {
        preferredMode: 'polling',
        webhookUrl: body.webhookUrl || config.webhookUrl,
        webhookSecret: body.secretToken || activeSecret,
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/set-webhook') {
      const body = await readJsonBody(req);
      const tokenToUse = String(body.botToken || activeToken || loadBotCredentials()?.botToken || '').trim();
      const webhookUrl = String(body.webhookUrl || config.webhookUrl || DEFAULT_WEBHOOK_URL).trim();
      if (!/^https:\/\/.+/i.test(webhookUrl)) {
        sendJson(res, 400, { ok: false, error: 'Webhook URL bắt buộc phải dùng HTTPS (ví dụ: https://www.elecai.id.vn/api/zalo-bot).' });
        return;
      }
      config = saveConfig({ ...config, webhookUrl });
      const result = await connectWithBotToken(tokenToUse, {
        preferredMode: 'webhook',
        webhookUrl,
        webhookSecret: body.secretToken || '',
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/switch-polling') {
      const tokenToUse = String(activeToken || loadBotCredentials()?.botToken || '').trim();
      const result = await connectWithBotToken(tokenToUse, {
        preferredMode: 'polling',
        webhookUrl: config.webhookUrl,
        webhookSecret: activeSecret,
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/logout') {
      stopPollingLoop();
      activeToken = '';
      activeSecret = '';
      try {
        if (fs.existsSync(CREDENTIALS_FILE)) fs.unlinkSync(CREDENTIALS_FILE);
      } catch {
        /* ignore */
      }
      state.connectionStatus = 'disconnected';
      state.mode = 'polling';
      state.botInfo = null;
      state.statusMessage = 'Đã ngắt kết nối và xóa Zalo Bot Token đã lưu.';
      pushLog('info', 'Đã ngắt kết nối Bot Token');
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/config') {
      const body = await readJsonBody(req);
      config = saveConfig({ ...config, ...body });
      if (config.webhookUrl) state.webhookUrl = config.webhookUrl;
      pushLog('info', 'Đã cập nhật cấu hình Bot', `botEnabled=${config.botEnabled}, groups=${config.allowedGroupIds.length}`);
      sendJson(res, 200, { ok: true, config });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/send-group') {
      const body = await readJsonBody(req);
      const chatId = String(body.chatId || body.groupId || config.allowedGroupIds[0] || '').trim();
      const messageText = String(body.message || '').trim();
      if (!activeToken) {
        sendJson(res, 400, { ok: false, error: 'Chưa kết nối Zalo Bot Token.' });
        return;
      }
      if (!chatId) {
        sendJson(res, 400, { ok: false, error: 'Chưa có Chat ID nhóm. Hãy thêm Bot vào nhóm và @tag Bot 1 lần để Bot ghi nhận Chat ID.' });
        return;
      }
      if (!messageText) {
        sendJson(res, 400, { ok: false, error: 'Nội dung tin nhắn không được để trống.' });
        return;
      }
      await sendZaloBotMessage(activeToken, chatId, messageText);
      state.stats.repliedCount += 1;
      pushLog('bot', `Admin gửi thông báo qua Bot tới ${chatId}`, messageText.slice(0, 140));
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/simulate') {
      const body = await readJsonBody(req);
      const text = String(body.text || '').trim();
      const senderName = String(body.senderName || 'Thầy/Cô Demo').trim();
      const isMentioned = Boolean(body.isMentioned);
      const decision = await decideBotReply({
        text,
        senderName,
        isMentioned,
        botDisplayName: state.botInfo?.display_name || 'Trợ lý ELEC AI',
        config,
      });
      if (decision.shouldReply && decision.notifyAdmin) {
        pushAdminAlert({
          chatId: config.allowedGroupIds[0] || 'demo-group',
          groupName: 'Nhóm Giáo viên ELEC AI (Test)',
          senderId: 'simulator',
          senderName,
          message: text,
          reason: decision.reason,
        });
      }
      pushLog(
        decision.shouldReply ? 'bot' : 'info',
        `[Giả lập] ${senderName}: ${text}`,
        decision.shouldReply ? `Trả lời (${decision.reason})` : `Bỏ qua (${decision.reason})`,
      );
      sendJson(res, 200, { ok: true, decision, adminAlerts: state.adminAlerts });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/alerts/resolve') {
      const body = await readJsonBody(req);
      const alertId = String(body.id || '').trim();
      const item = state.adminAlerts.find((a) => a.id === alertId);
      if (item) item.resolved = true;
      sendJson(res, 200, { ok: true, adminAlerts: state.adminAlerts });
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Endpoint không tồn tại' });
  } catch (err) {
    pushLog('error', `API ${pathname} lỗi`, err?.message || String(err));
    sendJson(res, 500, { ok: false, error: err?.message || 'Lỗi máy chủ nội bộ' });
  }
});

function listenWithFallback(port, retriesLeft = 10) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err.code === 'EADDRINUSE' && retriesLeft > 0) {
        console.warn(`[Server] Cổng ${port} đang bận, thử cổng ${port + 1}...`);
        resolve(listenWithFallback(port + 1, retriesLeft - 1));
      } else {
        reject(err);
      }
    };
    server.once('error', onError);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', onError);
      resolve(port);
    });
  });
}

const requestedPort = Number(process.env.ZALO_BOT_PORT || process.env.PORT || 3888);
const actualPort = await listenWithFallback(requestedPort);
console.log('');
console.log('===================================================================');
console.log(' 🤖 ELEC AI — BOT ZALO ĐỘC LẬP (ZALO BOT PLATFORM · BOT TOKEN)');
console.log(` 🌐 Bảng điều khiển Web: http://localhost:${actualPort}`);
console.log(` 💬 Nhóm mục tiêu:       ${config.targetGroupUrl}`);
console.log(` 🧠 API Keys AI nạp:     Gemini=${getAiKeyStats().gemini} | Groq=${getAiKeyStats().groq} | Agnes=${getAiKeyStats().agnes}`);
console.log('===================================================================');
console.log('');

tryAutoConnectOnBoot();
