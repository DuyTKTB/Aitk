import { useEffect, useState } from 'react';
import { UPGRADE_URL } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';

export default function VipGate({ text = 'Nâng cấp VIP để dùng trợ lý AI Hóa học.' }) {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, show: false });

  useEffect(() => {
    // Check localStorage trước (sync, nhanh)
    let isVipLocal = false;
    try {
      isVipLocal = localStorage.getItem('cs-vip') === 'true';
    } catch { /* */ }

    if (isVipLocal) {
      setState({ loading: false, show: false });
      return;
    }

    if (!user) {
      setState({ loading: false, show: true });
      return;
    }

    const uid = user.uid || user.id;
    if (!uid) {
      setState({ loading: false, show: true });
      return;
    }

    supabase
      .from('profiles')
      .select('role')
      .eq('id', String(uid))
      .maybeSingle()
      .then(({ data }) => {
        const isAdmin = data?.role === 'admin';
        setState({ loading: false, show: !isAdmin });
      })
      .catch(() => setState({ loading: false, show: true }));
  }, [user]);

  if (state.loading) return null;  // chống nháy
  if (!state.show) return null;    // không cần VIP

  return (
    <div className="vip-gate">
      <span className="vip-badge">VIP</span>
      <p>{text}</p>
      <a className="btn primary" href={UPGRADE_URL}>Nâng cấp VIP</a>
    </div>
  );
}