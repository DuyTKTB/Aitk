import { useState, useEffect } from 'react';
import { fetchPlan } from '../services/api.js';
import { useAuth } from './useAuth.jsx';
import { useTeacherPro } from './useTeacherPro.js';
import { resolveEntitlements } from '../lib/entitlements.js';

export default function useVip() {
  const { user, tier } = useAuth();
  const pro = useTeacherPro();
  const [planState, setPlanState] = useState({ vip: false, loading: true });

  useEffect(() => {
    let off = false;
    fetchPlan()
      .then((p) => !off && setPlanState({ vip: Boolean(p?.vip), loading: false }))
      .catch(() => !off && setPlanState({ vip: false, loading: false }));
    return () => { off = true; };
  }, [user?.uid]);

  const ent = resolveEntitlements({ user, pro, tier });
  const vip = Boolean(planState.vip || ent.hasVipAccess);
  return { vip, loading: Boolean(planState.loading && pro.loading) };
}
