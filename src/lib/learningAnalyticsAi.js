/* ============================================================
   learningAnalyticsAi.js — GỌI AI CHO TRUNG TÂM PHÂN TÍCH
   ------------------------------------------------------------
   Chỉ làm 3 việc:
     1. Gọi ĐÚNG lớp AI hiện có của dự án (examAiUtils.callModel →
        Cloud Function aiProxy nếu đã cấu hình, ngược lại dùng cấu hình
        AI sẵn có). KHÔNG thêm provider/API key mới.
     2. Đọc JSON "lỏng" + validate theo schema (learningAnalyticsReport).
     3. Nếu AI lỗi / hết điểm / trả JSON sai → trả báo cáo bằng LUẬT
        kèm lý do (engine='rule'), không giả danh là AI.

   Toàn bộ phần tính toán nằm ở learningAnalytics.js, phần hợp đồng
   dữ liệu nằm ở learningAnalyticsReport.js.
   ============================================================ */

import { callModel, parseJsonLoose } from './examAiUtils.js';
import { askAI as askBackend } from './aiClient.js';
import {
  buildAiContext, buildPrompt, numericCorpus, validateReport,
  applyNumberAudit, auditNumbers, buildRuleBasedReport, reportStaleness,
  REPORT_RESPONSE_SCHEMA, REPORT_SCHEMA_VERSION, ANALYTICS_SYSTEM_PROMPT,
} from './learningAnalyticsReport.js';

/* ============================================================
   KÊNH GỌI AI
   ------------------------------------------------------------
   Thứ tự ưu tiên (không thêm nhà cung cấp / key mới):
     1. VITE_FUNCTIONS_ENDPOINT → Cloud Function `askAI` (functions/aiProxy.js)
        → API key nằm ở server, client không giữ key.
     2. Lớp AI sẵn có của dự án: examAiUtils.callModel (dùng
        custom caller nếu đã installAiProxy, hoặc VITE_GEMINI_KEY như
        các tính năng tạo đề hiện tại).

   Nếu cả hai không cấu hình → báo rõ và dùng báo cáo bằng luật.
   ============================================================ */

const FUNCTIONS_ENDPOINT = (import.meta.env?.VITE_FUNCTIONS_ENDPOINT || '').trim();

const BACKEND_MODEL = (import.meta.env?.VITE_AI_MODEL_SMART || 'gemini-2.5-flash')
  .split(',')[0].trim();

export const aiChannel = () => (FUNCTIONS_ENDPOINT ? 'backend' : 'client-model');

async function callBackendModel({ prompt, signal }) {
  const res = await askBackend(
    'gemini',
    BACKEND_MODEL,
    [{ role: 'user', content: `${ANALYTICS_SYSTEM_PROMPT}\n\n${prompt}` }],
    { temperature: 0.3, maxTokens: 4096, signal },
  );
  const text = res?.response || res?.text || '';
  if (!text) throw new Error('Backend AI không trả về nội dung.');
  return text;
}

export {
  buildAiContext, buildPrompt, validateReport, auditNumbers, numericCorpus,
  buildRuleBasedReport, reportStaleness, applyNumberAudit,
  REPORT_RESPONSE_SCHEMA, REPORT_SCHEMA_VERSION, AiReportError,
} from './learningAnalyticsReport.js';

/**
 * generateLearningReport({ analytics, focusSubject, signal, maxRetry })
 * → { report, engine: 'ai'|'rule', error?, meta }
 *
 * Không ném lỗi nghiệp vụ ra ngoài (trừ khi bị huỷ giữa đường), để UI
 * luôn có nội dung hiển thị và biết chính xác vì sao không có phần AI.
 */
export async function generateLearningReport({
  analytics, focusSubject = '', signal, maxRetry = 1,
} = {}) {
  if (!analytics) throw new Error('Thiếu dữ liệu phân tích.');

  const ctx = buildAiContext(analytics);
  const corpus = numericCorpus(analytics);
  const prompt = buildPrompt({ ctx, focusSubject });

  let lastErr = null;

  for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
    try {
      let raw;
      if (FUNCTIONS_ENDPOINT) {
        raw = await callBackendModel({ prompt, signal });
      } else {
        raw = await callModel({
          system: ANALYTICS_SYSTEM_PROMPT,
          parts: [{ text: prompt }],
          temperature: attempt === 0 ? 0.3 : 0.15,
          signal,
          schema: REPORT_RESPONSE_SCHEMA,
        });
      }

      const parsed = parseJsonLoose(raw);
      const validated = validateReport(parsed);
      const audit = auditNumbers(validated, corpus);
      const report = applyNumberAudit(validated, audit);

      return {
        report,
        engine: 'ai',
        meta: {
          schemaVersion: REPORT_SCHEMA_VERSION,
          focusSubject: focusSubject || '',
          auditedPercents: audit.checked,
          unverifiedNumbers: audit.unverified.length,
          generatedAt: Date.now(),
        },
      };
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      lastErr = e;
    }
  }

  return {
    report: buildRuleBasedReport(analytics),
    engine: 'rule',
    error: lastErr?.message || 'Không gọi được AI.',
    meta: {
      schemaVersion: REPORT_SCHEMA_VERSION,
      focusSubject: focusSubject || '',
      generatedAt: Date.now(),
    },
  };
}
