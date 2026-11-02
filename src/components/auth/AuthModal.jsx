import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, authLoading, authError } = useAuth();
  const { addToast } = useToast();
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');

  if (!isAuthModalOpen) return null;

  const userAgent = navigator.userAgent || '';
  const inAppBrowser = /FBAN|FBAV|Instagram|TikTok|WhatsApp|Messenger/i.test(userAgent);
  const copySiteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast('تم نسخ رابط المنصة. افتحه في Chrome.', 'success');
    } catch (_) {
      addToast('انسخ رابط الصفحة من شريط عنوان المتصفح.', 'info');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    const res = await loginWithGoogle();
    if (res?.success) {
      addToast(`أهلاً بك يا ${res.user?.name || 'بطل الثانوية العامة'}! تم تسجيل الدخول بحساب Google بنجاح 🎓`, 'success');
      closeAuthModal();
    } else if (res?.error) {
      setErrorMsg(res.error);
    }
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    const result = authMode === 'register'
      ? await registerWithEmail(email, password)
      : await loginWithEmail(email, password);
    if (result.success) {
      addToast(authMode === 'register' ? 'تم إنشاء الحساب بنجاح' : 'تم تسجيل الدخول بنجاح', 'success');
    } else {
      setErrorMsg(result.error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(6px)',
      padding: '1.5rem'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.25rem',
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          disabled={authLoading}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="إغلاق"
        >
          <X size={20} />
        </button>

        {/* Google G Logo Badge */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          border: '1px solid #E2E8F0'
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--text-main)' }}>
          تسجيل الدخول باستخدام Google
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
          سجل دخولك بنقرة واحدة للوصول إلى اشتراكاتك ومحاضراتك والاحتفاظ بها دائماً في حسابك.
        </p>

        {inAppBrowser && (
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
            <strong>افتح الرابط في Chrome</strong>
            <p style={{ fontSize: '0.82rem', margin: '0.5rem 0' }}>لا يسمح Google بتسجيل الدخول داخل متصفح التطبيق الداخلي.</p>
            <button type="button" className="btn" onClick={copySiteLink} style={{ width: '100%', marginBottom: '0.5rem' }}>نسخ الرابط</button>
            {/Android/i.test(userAgent) && (
              <a className="btn btn-secondary" style={{ width: '100%', display: 'block', textDecoration: 'none' }} href={`intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`}>
                فتح في Chrome
              </a>
            )}
          </div>
        )}

        {/* Security / No-Password Notice */}
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          textAlign: 'right',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700 }}>
            <CheckCircle2 size={16} />
            <span>تسجيل دخول سريع ومباشر بحساب Google</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--primary-600)" />
            <span>لا حاجة لإنشاء كلمة مرور خاصة بالموقع</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--primary-600)" />
            <span>يتم ربط وحفظ اشتراكاتك بالـ User ID الثابت لحسابك</span>
          </div>
        </div>

        {!inAppBrowser && (
          <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: '8px', marginBottom: '1rem', textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setAuthMode('login')} className={authMode === 'login' ? 'btn' : 'btn btn-secondary'} style={{ padding: '6px 10px' }}>دخول بالإيميل</button>
              <button type="button" onClick={() => setAuthMode('register')} className={authMode === 'register' ? 'btn' : 'btn btn-secondary'} style={{ padding: '6px 10px' }}>إنشاء حساب</button>
            </div>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" autoComplete="email" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }} />
            <input type="password" required minLength={authMode === 'register' ? 6 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }} />
            <button type="submit" className="btn" disabled={authLoading}>{authMode === 'register' ? 'إنشاء حساب' : 'تسجيل الدخول'}</button>
            {authMode === 'login' && (
              <button type="button" onClick={async () => {
                if (!email) { setErrorMsg('اكتب البريد الإلكتروني أولاً.'); return; }
                const result = await resetPassword(email);
                setErrorMsg(result.success ? 'تم إرسال رابط إعادة تعيين كلمة المرور.' : result.error);
              }} style={{ border: 0, background: 'transparent', color: 'var(--primary-600)', cursor: 'pointer' }}>نسيت كلمة المرور؟</button>
            )}
          </form>
        )}

        {/* Error message if any */}
        {(errorMsg || authError) && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#DC2626',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'right'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg || authError}</span>
          </div>
        )}

        {/* Google Sign-In Action Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={authLoading}
          className="btn"
          style={{
            width: '100%',
            background: '#FFFFFF',
            color: '#1F2937',
            border: '1.5px solid #D1D5DB',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: authLoading ? 'not-allowed' : 'pointer',
            opacity: authLoading ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{authLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول باستخدام Google'}</span>
        </button>



        <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          🔒 تسجيل دخول رسمي ومؤمن ومشفر بحساب Google المعتمد
        </p>
      </div>
    </div>
  );
}
