import { useState, useRef, useCallback, useEffect } from 'react';
import { askAI, VipRequiredError } from '../services/api.js';

export default function useAsk() {
  const [s, setS] = useState({ text: '', loading: false, error: '', vipNeeded: false });
  const job = useRef(null);
  useEffect(() => () => job.current?.abort?.(), []);

  const ask = useCallback(async (prompt) => {
    job.current?.abort?.();
    setS({ text: '', loading: true, error: '', vipNeeded: false });
    const p = askAI(prompt, { onChunk: (t) => { if (job.current === p) setS((x) => ({ ...x, text: t })); } });
    job.current = p;
    try {
      const r = await p;
      setS({ text: r.text, loading: false, error: '', vipNeeded: false });
      return r.text;
    } catch (err) {
      if (err?.name === 'AbortError' || job.current !== p) return;
      const vipNeeded = err instanceof VipRequiredError;
      setS({ text: '', loading: false, error: vipNeeded ? '' : err.message, vipNeeded });
    }
  }, []);

  return { ...s, ask };
}