import { memo, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const _userPhotoCache = new Map();
const _userPhotoInFlight = new Map();

function isValidPhotoUrl(url) {
  return (
    typeof url === 'string' &&
    url.trim().length > 6 &&
    !url.includes('placeholder') &&
    url !== 'null' &&
    url !== 'undefined'
  );
}

function fetchFirestorePhoto(uid) {
  if (!uid || uid === 'anonymous' || uid === 'guest') return Promise.resolve(null);
  if (_userPhotoCache.has(uid)) return Promise.resolve(_userPhotoCache.get(uid));
  if (_userPhotoInFlight.has(uid)) return _userPhotoInFlight.get(uid);

  const p = getDoc(doc(db, 'users', uid))
    .then((snap) => {
      const raw = snap.exists() ? snap.data()?.photoURL : null;
      const clean = isValidPhotoUrl(raw) ? raw.trim() : null;
      if (clean) _userPhotoCache.set(uid, clean);
      _userPhotoInFlight.delete(uid);
      return clean;
    })
    .catch(() => {
      _userPhotoInFlight.delete(uid);
      return null;
    });

  _userPhotoInFlight.set(uid, p);
  return p;
}

function getInitials(rawName = '') {
  const clean = String(rawName || '').trim();
  if (!clean) return 'E';
  const base = clean.includes('@') ? clean.split('@')[0] : clean;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function UserAvatar({
  user = null,
  photoURL = null,
  size = 32,
  variant = 'blue',
  className = '',
  title = '',
  style = {},
  onClick = undefined,
}) {
  const uid = user?.uid || user?.id || '';
  const directPhoto = isValidPhotoUrl(photoURL)
    ? photoURL.trim()
    : isValidPhotoUrl(user?.photoURL)
      ? user.photoURL.trim()
      : null;

  const [resolvedUrl, setResolvedUrl] = useState(
    () => directPhoto || (uid && _userPhotoCache.has(uid) ? _userPhotoCache.get(uid) : null)
  );
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    if (directPhoto) {
      setResolvedUrl(directPhoto);
      if (uid) _userPhotoCache.set(uid, directPhoto);
      return undefined;
    }
    if (!uid) {
      setResolvedUrl(null);
      return undefined;
    }
    if (_userPhotoCache.has(uid)) {
      setResolvedUrl(_userPhotoCache.get(uid));
      return undefined;
    }
    let alive = true;
    fetchFirestorePhoto(uid).then((url) => {
      if (alive && url) setResolvedUrl(url);
    });
    return () => { alive = false; };
  }, [uid, directPhoto]);

  const customPhoto = !imgFailed && isValidPhotoUrl(resolvedUrl) ? resolvedUrl : null;
  const label = title || user?.displayName || user?.email || 'Thành viên ELEC AI';
  const initials = getInitials(title || user?.displayName || user?.email);

  const isDark = variant === 'dark';
  const isGold = variant === 'gold';
  const bg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    : isGold
      ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
      : 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)';
  const border = isDark ? '1.5px solid #fbbf24' : 'none';
  const fontSize = Math.max(11, Math.round(Number(size) * 0.38));

  return (
    <div
      className={`ns9-user-logo-avatar ${variant} ${className}`}
      title={label}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        background: customPhoto ? '#f1f5f9' : bg,
        border,
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(37,99,235,0.22)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        userSelect: 'none',
        color: '#ffffff',
        fontWeight: 800,
        fontSize,
        letterSpacing: '0.02em',
        lineHeight: 1,
        ...style,
      }}
      onClick={onClick}
      aria-label={label}
    >
      {customPhoto ? (
        <img
          src={customPhoto}
          alt={label}
          referrerPolicy="no-referrer"
          className="ns9-user-avatar-img"
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '50%',
          }}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}

export default memo(UserAvatar);
