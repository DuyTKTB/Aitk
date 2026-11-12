import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  loadChalkboardWasm,
  ChalkboardSession,
  renderChalkboard,
} from '../lib/chalkboardEngine.js';

/**
 * Component ChatChalkboardBlock — Render Bảng phấn 3D tương tác ngay trong bong bóng chat AI
 * Được memoized và debounce để không gây giật lag khi AI đang stream tin nhắn
 */
function ChatChalkboardBlockComponent({ code = '', title = 'Mô phỏng Bảng phấn 3D' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [viewAngles, setViewAngles] = useState([-1.22, 0.36, 1.0]);

  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const wasmEngineRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0 });

  // Khởi tạo WASM
  useEffect(() => {
    let isMounted = true;
    loadChalkboardWasm()
      .then((engine) => {
        if (!isMounted) return;
        wasmEngineRef.current = engine;
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Lỗi nạp ve.wasm');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (sessionRef.current) {
        sessionRef.current.huy();
        sessionRef.current = null;
      }
    };
  }, []);

  // Vẽ Canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const session = sessionRef.current;
    if (!canvas || !session) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 280;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    try {
      const [yaw, pitch, zoom] = viewAngles;
      const res = session.ve(w, h, yaw, pitch, zoom, 1e6);
      if (res && res.m) {
        renderChalkboard(ctx, res.m, { chalkStyle: true });
      }
    } catch (e) {
      console.warn('[ChatChalkboard Render Error]:', e);
    }
  }, [viewAngles]);

  // Nạp code vào session (có debounce 150ms để chống khởi tạo/hủy WASM liên tục khi stream)
  useEffect(() => {
    const engine = wasmEngineRef.current;
    if (!engine || !code) return;

    const timer = setTimeout(() => {
      if (sessionRef.current) {
        sessionRef.current.huy();
        sessionRef.current = null;
      }

      try {
        // Phán đoán 3D hay 2D qua nội dung code
        const is3D = !code.includes('f(x)') && !code.includes('domain=');
        const session = new ChalkboardSession(engine, is3D, !is3D);
        sessionRef.current = session;

        const lines = code.split('\n').filter(Boolean);
        session.dat(lines);
        redraw();
      } catch (e) {
        setError(e.message);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [code, loading, redraw]);

  // Xử lý kéo thả xoay 3D
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;

    setViewAngles(([yaw, pitch, zoom]) => [
      yaw - dx * 0.008,
      Math.max(-1.45, Math.min(1.45, pitch + dy * 0.008)),
      zoom,
    ]);
  };

  const handlePointerUp = (e) => {
    dragRef.current.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.95 : 1.05;
    setViewAngles(([yaw, pitch, zoom]) => [
      yaw,
      pitch,
      Math.max(0.4, Math.min(3.5, zoom * factor)),
    ]);
  };

  return (
    <div
      style={{
        margin: '1rem 0',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#111e17',
        border: '3px solid #5a3825',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.85rem',
          background: 'rgba(14, 28, 20, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.8rem',
          color: '#f2f3ea',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <span style={{ color: '#34d399' }}>●</span>
          <span>{title}</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>(Kéo để xoay 3D)</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setViewAngles([-1.22, 0.36, 1.0])}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1',
              borderRadius: '4px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Đặt lại góc nhìn ban đầu"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Đặt lại</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            {showCode ? 'Ẩn mã' : 'Xem mã MV'}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        style={{
          position: 'relative',
          height: '300px',
          background: 'radial-gradient(circle at 45% 40%, #1e4130 0%, #173426 65%, #0f241a 100%)',
          cursor: 'grab',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: '0.85rem',
            }}
          >
            Đang khởi động bảng phấn 3D...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '1rem',
              color: '#f87171',
              fontSize: '0.85rem',
            }}
          >
            Lỗi dựng hình: {error}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        )}
      </div>

      {/* Code Drawer */}
      {showCode && (
        <pre
          style={{
            margin: 0,
            padding: '0.75rem 1rem',
            background: '#0a0f1d',
            color: '#38bdf8',
            fontSize: '0.78rem',
            fontFamily: 'monospace',
            maxHeight: '120px',
            overflowY: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

const ChatChalkboardBlock = memo(ChatChalkboardBlockComponent);
export default ChatChalkboardBlock;
