import fs from 'fs';

const path = 'src/hooks/useAuth.jsx';
let code = fs.readFileSync(path, 'utf8');

const target = `      } else {
        setUser(null);
        setIsLoggedIn(false);
        setTier(null);
      }`;

const replacement = `      } else {
        const devMock = typeof window !== 'undefined' ? localStorage.getItem('cs-dev-mock-user') : null;
        if (devMock) {
          try {
            const parsed = JSON.parse(devMock);
            setUser(parsed);
            setIsLoggedIn(true);
            setTier({ key: 'vip', name: 'VIP', desc: 'Đặc quyền VIP' });
            if (mountedRef.current) setReady(true);
            return;
          } catch {}
        }
        setUser(null);
        setIsLoggedIn(false);
        setTier(null);
      }`;

if (code.includes('setUser(null);')) {
  // Normalize line endings for replacement
  const isCRLF = code.includes('\r\n');
  const normTarget = isCRLF ? target.replace(/\n/g, '\r\n') : target;
  const normReplacement = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement;
  code = code.replace(normTarget, normReplacement);
  fs.writeFileSync(path, code, 'utf8');
  console.log('Successfully patched useAuth.jsx');
} else {
  console.log('Target not found in useAuth.jsx');
}
