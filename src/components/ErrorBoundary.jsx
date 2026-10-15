/* ============================================================
   ErrorBoundary.jsx — Bọc các component có thể crash để tránh
   làm sập toàn bộ ứng dụng.
   ============================================================ */
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1.5rem',
            minHeight: 320,
            background: 'var(--t-surface-1, #fff)',
            borderRadius: 20,
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem' }} aria-hidden="true">⚠️</div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--t-ink, #111)' }}>
            Có lỗi xảy ra trong thành phần này
          </h2>
          <p style={{ margin: 0, color: 'var(--t-ink-muted, #666)', maxWidth: 480, fontSize: '0.9rem', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Lỗi không xác định. Vui lòng thử lại hoặc tải lại trang.'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 999,
                background: 'var(--t-accent, #2f6bff)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--t-ink, #111)',
                border: '1.5px solid var(--t-border, #ddd)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Tải lại trang
            </button>
          </div>
          {import.meta.env?.DEV && this.state.errorInfo && (
            <details style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#999', textAlign: 'left', maxWidth: 600, width: '100%' }}>
              <summary style={{ cursor: 'pointer' }}>Chi tiết lỗi (dev)</summary>
              <pre style={{ overflow: 'auto', padding: '0.5rem', background: '#f5f5f5', borderRadius: 8 }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}