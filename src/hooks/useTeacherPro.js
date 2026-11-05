import { useState, useEffect, useCallback } from 'react';
import { getProStatus, activateProKey, adminRevokeProUser } from '../lib/proKeyApi.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './useAuth.jsx';

export function useTeacherPro() {
  const { user } = useAuth();
  const [status, setStatus] = useState({ isPro: false });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setStatus({ isPro: false });
      return;
    }
    const s = await getProStatus(user.uid, user.email);
    setStatus(s);
  }, [user?.uid, user?.email]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    const onTierChange = () => refresh();
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
    loading,
    activate,
    revoke,
    refresh,
  };
}
