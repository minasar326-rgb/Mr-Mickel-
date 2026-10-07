import React from 'react';
import { RefreshCw, AlertTriangle, ShieldAlert, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (window.indexedDB) {
        indexedDB.deleteDatabase('MsMichaelMasterPlatform_Storage');
        indexedDB.deleteDatabase('MsMichaelShehata_V3_DB');
      }
    } catch (e) {}
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error ? (this.state.error.message || String(this.state.error)) : 'حدث خطأ غير متوقع';
      const errorStack = this.state.error?.stack || '';

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
          color: 'white',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Cairo, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '2.5rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '2px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              منصة مستر مايكل شحاته 🇬🇧
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              نظام الاستعادة التلقائي: تم رصد مشكلة بسيطة في تحميل الواجهة. تفاصيل المشكلة:
            </p>

            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              textAlign: 'left',
              direction: 'ltr',
              fontSize: '0.8rem',
              color: '#FCA5A5',
              fontFamily: 'monospace',
              maxHeight: '140px',
              overflowY: 'auto',
              marginBottom: '1.75rem',
              wordBreak: 'break-all'
            }}>
              <strong>Error:</strong> {errorMsg}
              {errorStack && (
                <div style={{ marginTop: '6px', color: '#94A3B8', fontSize: '0.72rem' }}>
                  {errorStack.slice(0, 300)}...
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={this.handleHardReset}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)'
                }}
              >
                <RefreshCw size={18} />
                <span>إصلاح تلقائي واسترجاع البيانات الأصلية فوراً 🚀</span>
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                إعادة تحميل الصفحة فقط (Reload)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
