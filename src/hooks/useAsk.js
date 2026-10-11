/* ============================================================
   useAsk.js — Hook gọi AI cho AiPanel / AiQuiz
   ------------------------------------------------------------
   Dùng chung lib/ai.js (askAI) — hỗ trợ 3 provider:
   Agnes → Gemini → Groq, có fallback tự động.
   ============================================================ */
import { useState, useCallback, useRef, useEffect } from 'react';
import { askAI } from '../lib/ai.js';

export default function useAsk() {
  const [text, setText] = useState('');
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
   *   opts:    { systemPrompt?: string, onChunk?: (chunk) => void }
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

    try {
      const promise = askAI(
        h,
        (chunk) => {
          if (!mountedRef.current) return;
          setText(chunk);
          opts.onChunk?.(chunk);
        },
        null,
        opts.systemPrompt || null
      );
      promiseRef.current = promise;

      const result = await promise;
      if (mountedRef.current) {
        setText(result.text || '');
      }
      return result.text || '';
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
  }, []);

  const stop = useCallback(() => {
    try { promiseRef.current?.abort?.(); } catch { /* */ }
  }, []);

  const reset = useCallback(() => {
    setText('');
    setError(null);
    setVipNeeded(false);
  }, []);

  return { text, loading, error, vipNeeded, ask, stop, reset };
}