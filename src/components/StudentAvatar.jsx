import { memo, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const _photoCache = new Map();
const _inFlight = new Map();

function isValidUrl(url) {
  return (
    typeof url === 'string' &&
    url.trim().length > 6 &&
    !url.includes('placeholder') &&
    url !== 'null' &&
    url !== 'undefined'
  );
}

function fetchUserPhotoOnce(uid) {
  if (!uid || uid === 'anonymous' || uid === 'guest') return Promise.resolve(null);
  if (_photoCache.has(uid)) return Promise.resolve(_photoCache.get(uid));
  if (_inFlight.has(uid)) return _inFlight.get(uid);

  const p = getDoc(doc(db, 'users', uid))
    .then((snap) => {
      const url = snap.exists() ? (snap.data()?.photoURL || null) : null;
      const clean = isValidUrl(url) ? url.trim() : null;
      if (clean) _photoCache.set(uid, clean);
      _inFlight.delete(uid);
      return clean;
    })
    .catch(() => {
      _inFlight.delete(uid);
      return null;
    });

  _inFlight.set(uid, p);
  return p;
}

function hashStr(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getInitials(name = '') {
  const clean = String(name || '').trim();
  if (!clean) return 'E';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

const MONOGRAM_GRADIENTS = [
  'linear-gradient(135deg, #0058cc 0%, #0071e3 55%, #38bdf8 100%)',
  'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #0369a1 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
  'linear-gradient(135deg, #047857 0%, #10b981 100%)',
  'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
];

function StudentAvatar({
  name = '',
  uid = '',
  photoURL = null,
  size = 32,
  className = '',
  style = {},
  onClick = undefined,
  title = '',
}) {
  const propValid = isValidUrl(photoURL) ? photoURL.trim() : null;
  const [resolvedUrl, setResolvedUrl] = useState(
    () => propValid || (uid && _photoCache.has(uid) ? _photoCache.get(uid) : null)
  );
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    if (propValid) {
      setResolvedUrl(propValid);
      if (uid) _photoCache.set(uid, propValid);
      return undefined;
    }
    if (!uid || uid === 'anonymous' || uid === 'guest') {
      setResolvedUrl(null);
      return undefined;
    }
    if (_photoCache.has(uid)) {
      setResolvedUrl(_photoCache.get(uid));
      return undefined;
    }
    let alive = true;
    fetchUserPhotoOnce(uid).then((url) => {
      if (alive && url) setResolvedUrl(url);
    });
    return () => { alive = false; };
  }, [uid, propValid]);

  const normName = String(name || '').trim();
  const displayUrl = !imgFailed && isValidUrl(resolvedUrl) ? resolvedUrl : null;
  const seed = String(uid || normName || 'elec');
  const bg = MONOGRAM_GRADIENTS[hashStr(seed) % MONOGRAM_GRADIENTS.length];
  const fontSize = Math.max(10, Math.round(Number(size) * 0.37));

  return (
    <div
      className={`ns9-student-svg-avatar ${className}`}
      title={title || normName || 'Thành viên ELEC'}
      onClick={onClick}
      aria-label={title || normName || 'Avatar'}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        borderRadius: '50%',
        background: displayUrl ? '#f1f5f9' : bg,
        color: '#ffffff',
        fontWeight: 800,
        fontSize,
        letterSpacing: '-0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.14)',
        ...style,
      }}
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={title || normName || 'Avatar'}
          referrerPolicy="no-referrer"
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
        <span aria-hidden="true">{getInitials(normName)}</span>
      )}
    </div>
  );
}

export default memo(StudentAvatar);
