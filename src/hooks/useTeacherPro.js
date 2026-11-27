import { useState, useEffect, useCallback } from 'react';
import { getProStatus, activateProKey, adminRevokeProUser } from '../lib/proKeyApi.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './useAuth.jsx';

function readCachedProStatus(uid) {
  if (!uid || typeof localStorage === 'undefined') return { isPro: false };
  try {
    const rawVip = JSON.parse(localStorage.getItem('cs-vip-status') || 'null');
    if (rawVip && rawVip.uid === uid && (rawVip.isPro || rawVip.vip)) {
      const expMs = rawVip.expiry ? new Date(rawVip.expiry).getTime() : 0;
      if (expMs > Date.now()) {
        const isTeacherPro = rawVip.isTeacherPro !== undefined
          ? Boolean(rawVip.isTeacherPro)
          : (rawVip.plan === 'PRO' || rawVip.tier === 'pro');
        return {
          isPro: true,
          isTeacherPro,
          isStudentVip: !isTeacherPro,
          plan: isTeacherPro ? 'PRO' : 'VIP',
          pro: { key: rawVip.key || 'ELEC-PRO', expiry: rawVip.expiry },
          expiry: rawVip.expiry,
          daysLeft: Math.max(1, Math.ceil((expMs - Date.now()) / 86400000)),
          expired: false,
          source: rawVip.source || 'cache',
        };
      }
    }
    const rawSub = JSON.parse(localStorage.getItem(`cs-user-subscription:${uid}`) || 'null');
    if (rawSub && (rawSub.planName === 'PRO' || rawSub.planName === 'VIP')) {
      const expMs = rawSub.expiry ? new Date(rawSub.expiry).getTime() : 0;
      if (expMs > Date.now()) {
        const isTeacherPro = rawSub.planName === 'PRO';
        return {
          isPro: true,
          isTeacherPro,
          isStudentVip: !isTeacherPro,
          plan: rawSub.planName,
          pro: { key: 'ELEC-PRO', expiry: rawSub.expiry },
          expiry: rawSub.expiry,
          daysLeft: Math.max(1, Math.ceil((expMs - Date.now()) / 86400000)),
          expired: false,
          source: 'subscription',
        };
      }
    }
  } catch { /* ignore */ }
  return { isPro: false };
}

export function useTeacherPro() {
  const { user } = useAuth();
  const [status, setStatus] = useState(() => readCachedProStatus(user?.uid));
  const [checking, setChecking] = useState(() => Boolean(user?.uid));
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setStatus({ isPro: false });
      setChecking(false);
      return;
    }
    try {
      const s = await getProStatus(user.uid, user.email);
      setStatus(s);
    } finally {
      setChecking(false);
    }
  }, [user?.uid, user?.email]);

  useEffect(() => {
    if (user?.uid) {
      setStatus(readCachedProStatus(user.uid));
      setChecking(true);
    } else {
      setStatus({ isPro: false });
      setChecking(false);
    }
    refresh();
    const t = setInterval(refresh, 30000);
    const onTierChange = (e) => {
      if (e?.detail?.source === 'getProStatus') return;
      refresh();
    };
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener('cs-vip-update', onTierChange);
    window.addEventListener('cs-tier-update', onTierChange);
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);

    // Lắng nghe Realtime trên bảng pro_users để cập nhật tức thì khi Admin cấp PRO trực tiếp
    let channel = null;
    if (user?.uid) {
      try {
        channel = supabase
          .channel(`pro_user_${user.uid}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pro_users',
              filter: `user_id=eq.${user.uid}`,
            },
            () => {
              refresh();
            }
          )
          .subscribe();
      } catch {
        /* ignore realtime error */
      }
    }

    return () => {
      clearInterval(t);
      window.removeEventListener('cs-vip-update', onTierChange);
      window.removeEventListener('cs-tier-update', onTierChange);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* ignore */
        }
      }
    };
  }, [refresh, user?.uid]);

  const activate = async (keyCode) => {
    if (!user?.uid) return { ok: false, error: 'Chưa đăng nhập.' };
    setLoading(true);
    try {
      const res = await activateProKey(user.uid, keyCode);
      if (res.ok) await refresh();
      return res;
    } catch (e) {
      return { ok: false, error: e.message || 'Lỗi kết nối.' };
    } finally {
      setLoading(false);
    }
  };

  const revoke = async () => {
    if (!user?.uid) return;
    await adminRevokeProUser(user.uid);
    await refresh();
  };

  return {
    ...status,
    loading: loading || checking,
    checking,
    activate,
    revoke,
    refresh,
  };
}
