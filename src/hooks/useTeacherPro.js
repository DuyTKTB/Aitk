import { useState, useEffect, useCallback } from 'react';
import { getProStatus, activateProKey, adminRevokeProUser } from '../lib/proKeyApi.js';
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
    const s = await getProStatus(user.uid);
    setStatus(s);
  }, [user?.uid]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh]);

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