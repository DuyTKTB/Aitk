import { useState, useEffect } from 'react';
import { fetchPlan } from '../services/api.js';

export default function useVip() {
  const [s, setS] = useState({ vip: false, loading: true });
  useEffect(() => {
    let off = false;
    fetchPlan()
      .then((p) => !off && setS({ vip: p.vip, loading: false }))
      .catch(() => !off && setS({ vip: false, loading: false }));
    return () => { off = true; };
  }, []);
  return s;
}
