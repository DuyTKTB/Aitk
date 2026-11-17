import { useEffect, useState } from 'react';
import { UPGRADE_URL } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { resolveEntitlements } from '../lib/entitlements.js';
import { supabase } from '../lib/supabase.js';

export default function VipGate({ text = 'Nâng cấp VIP để dùng trợ lý AI Khoa học Tự nhiên (Lý - Hóa - Sinh).' }) {
  const { user, tier } = useAuth();
  const pro = useTeacherPro();
  const [adminRole, setAdminRole] = useState(false);

  useEffect(() => {
    const uid = user?.uid || user?.id;
    if (!uid) {
      setAdminRole(false);
      return;
    }
    let cancel = false;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', String(uid))
      .maybeSingle()
      .then(({ data }) => {
        if (!cancel) setAdminRole(data?.role === 'admin');
      })
      .catch(() => {});
    return () => { cancel = true; };
  }, [user]);

  const ent = resolveEntitlements({ user, pro, tier });
  if (adminRole || ent.hasVipAccess) return null;

  return (
    <div className="vip-gate">
      <span className="vip-badge">VIP</span>
      <p>{text}</p>
      <a className="btn primary" href={UPGRADE_URL}>Nâng cấp VIP</a>
    </div>
  );
}