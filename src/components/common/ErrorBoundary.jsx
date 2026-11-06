import React from 'react';
import { RefreshCw, AlertTriangle, ShieldAlert, RotateCcw, ChevronDown } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showAdvanced: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Auto-recover from chunk load / version mismatch errors after deployment without alarming user
    const msg = error?.message || '';
    const isChunkError = 
      msg.includes('dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError && !sessionStorage.getItem('ms_chunk_reloaded')) {
      sessionStorage.setItem('ms_chunk_reloaded', '1');
      if ('caches' in window) {
        caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).finally(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    if ('caches' in window) {
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  handleHardReset = () => {
    const confirmed = window.confirm('⚠️ تحذير مهم:\nإعادة الضبط الشامل ستقوم بمسح الجلسة المحلية وبيانات الدخول المخزنة أوفلاين.\n\nهل أنت متأكد من المتابعة؟');
    if (!confirmed) return;

    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).catch(() => {});
      }
      if (window.indexedDB) {
        indexedDB.deleteDatabase('MsMichaelMasterPlatform_Storage');
        indexedDB.deleteDatabase('MsMichaelShehata_V3_DB');
      }
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error ? (this.state.error.message || String(this.state.error)) : 'حدث خطأ غير متوقع';

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
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl'
        }}>
          <div style={{
            maxWidth: '560px',
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
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '2px solid rgba(59, 130, 246, 0.3)'
            }}>
              <RefreshCw size={30} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              منصة مستر مايكل شحاته 🇬🇧
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              تم استلام تحديث جديد في المنصة أو حدث انقطاع مؤقت في الاتصال. اضغط أدناه لإعادة التحميل والمتابعة بأحدث نسخة.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Primary action: Safe reload preserving user tokens & offline codes */}
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(37, 99, 235, 0.45)'
                }}
              >
                <RefreshCw size={18} />
                <span>إعادة تحميل المنصة (مستحسن) 🔄</span>
              </button>

              {/* Advanced diagnostic toggle */}
              <button
                onClick={() => this.setState(prev => ({ showAdvanced: !prev.showAdvanced }))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '0.5rem'
                }}
              >
                <span>خيارات متقدمة وتفاصيل الخطأ</span>
                <ChevronDown size={14} style={{ transform: this.state.showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {this.state.showAdvanced && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'right',
                  fontSize: '0.8rem',
                  color: '#CBD5E1',
                  marginTop: '6px'
                }}>
                  <p style={{ color: '#EF4444', marginBottom: '8px', wordBreak: 'break-all', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace' }}>
                    {errorMsg}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '10px' }}>
                    ⚠️ الزر أدناه يعيد ضبط المصنع ويمسح بيانات تسجيل الدخول المحلية والأكواد المفعلة أوفلاين. استخدمه فقط إذا لم ينجح التحديث المعتاد.
                  </p>
                  <button
                    onClick={this.handleHardReset}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#F87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    استرجاع ضبط المصنع ومسح الذاكرة المؤقتة بالكامل
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
