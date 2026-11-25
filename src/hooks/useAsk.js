/* ============================================================
   useAsk.js — Hook gọi AI cho AiPanel / AiQuiz
   ------------------------------------------------------------
   Dùng chung lib/ai.js (askAI) — hỗ trợ đa AI song song:
   Gemini · Groq · Agnes, có round-robin & fallback tự động.
   ============================================================ */
import { useState, useCallback, useRef, useEffect } from 'react';
import { askAI } from '../lib/ai.js';
import { runWithCredit, CREDIT_TARIFF } from '../lib/creditService.js';
import { useAuth } from './useAuth.jsx';

export default function useAsk() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vipNeeded, setVipNeeded] = useState(false);

  const promiseRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Huỷ request đang chạy khi unmount
      try { promiseRef.current?.abort?.(); } catch { /* */ }
    };
  }, []);

  /**
   * ask(history, opts?)
   *   history: mảng message [{ role: 'user'|'model', parts: [...] }]
   *            hoặc string (sẽ tự bọc thành history 1 message)
   *   opts:    {
   *              systemPrompt?: string,
   *              preferredProvider?: 'auto'|'gemini'|'groq'|'agnes',
   *              hedgeMs?: number,
   *              returnMeta?: boolean,
   *              onChunk?: (chunk) => void,
   *              validate?: (text) => void,
   *            }
   */
  const ask = useCallback(async (history, opts = {}) => {
    // Chuẩn hoá input
    let h = history;
    if (typeof history === 'string') {
      h = [{ role: 'user', parts: [{ text: history }] }];
    }
    if (!Array.isArray(h) || h.length === 0) {
      setError('Không có nội dung câu hỏi.');
      return null;
    }

    setLoading(true);
    setError(null);
    setVipNeeded(false);
    setText('');
    setModel('');

    try {
      const result = await runWithCredit(
        { userId: user?.uid, cost: CREDIT_TARIFF.TUTOR_CONTEXT, actionType: 'ai_tutor', reason: 'AI Phân tích nguyên tố / Quiz' },
        async () => {
          const aiOptions = {
            ...(opts.systemPrompt ? { systemPrompt: opts.systemPrompt } : {}),
            preferredProvider: opts.preferredProvider || 'auto',
            hedgeMs: typeof opts.hedgeMs === 'number' ? opts.hedgeMs : 2800,
          };
          const promise = askAI(
            h,
            (chunk) => {
              if (!mountedRef.current) return;
              setText(chunk);
              opts.onChunk?.(chunk);
            },
            null,
            aiOptions
          );
          promiseRef.current = promise;
          const res = await promise;
          const replyText = typeof res === 'string' ? res : (res?.text || '');
          if (!String(replyText).trim()) {
            throw new Error('AI không trả về nội dung (ELEC Credit đã được hoàn trả).');
          }
          if (typeof opts.validate === 'function') {
            opts.validate(replyText);
          }
          return typeof res === 'object' && res !== null ? res : { text: replyText };
        }
      );
      if (mountedRef.current) {
        setText(result.text || '');
        setModel(result.model || '');
      }
      return opts.returnMeta ? result : (result.text || '');
    } catch (err) {
      if (err?.isAbort) {
        // Người dùng dừng — không hiện lỗi
        return null;
      }

      if (mountedRef.current) {
        if (err?.isQuota) {
          setVipNeeded(true);
        }
        setError(err?.message || 'Có lỗi xảy ra khi gọi AI.');
      }
      return null;
    } finally {
      promiseRef.current = null;
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.uid]);

  const stop = useCallback(() => {
    try { promiseRef.current?.abort?.(); } catch { /* */ }
  }, []);

  const reset = useCallback(() => {
    setText('');
    setModel('');
    setError(null);
    setVipNeeded(false);
  }, []);

  return { text, model, loading, error, vipNeeded, ask, stop, reset };
}
