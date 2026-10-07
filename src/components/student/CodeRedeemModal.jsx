import React, { useState } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { X, Key, CheckCircle2, Sparkles, Shield, ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function CodeRedeemModal({ isOpen, onClose, onNavigate }) {
  const { redeemCode, teacherProfile } = useTeacher();
  const { currentUser, openAuthModal } = useAuth();
  const [codeInput, setCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check brute-force lock on code attempts
  React.useEffect(() => {
    const checkLock = () => {
      const lockUntil = parseInt(sessionStorage.getItem('ms_code_lock_until') || '0', 10);
      const now = Date.now();
      if (lockUntil > now) {
        setLockoutRemaining(Math.ceil((lockUntil - now) / 1000));
      } else {
        setLockoutRemaining(0);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    setCodeInput('');
    setErrorMsg('');
    setSuccessResult(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    setErrorMsg('');

    // Sanitize code input: uppercase, remove dangerous symbols
    const cleanCode = codeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode || isSubmitting) return;

    const studentUid = currentUser?.uid || currentUser?.id;
    if (!currentUser || !studentUid || studentUid === 'guest') {
      if (openAuthModal) openAuthModal('login');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await redeemCode(cleanCode);
      if (res && res.success) {
        sessionStorage.removeItem('ms_code_fails');
        sessionStorage.removeItem('ms_code_lock_until');
        setSuccessResult(res);
        setCodeInput('');
      } else if (res && res.error) {
        const fails = parseInt(sessionStorage.getItem('ms_code_fails') || '0', 10) + 1;
        sessionStorage.setItem('ms_code_fails', fails.toString());

        if (fails >= 5) {
          const lockTime = Date.now() + 600 * 1000;
          sessionStorage.setItem('ms_code_lock_until', lockTime.toString());
          setLockoutRemaining(600);
          setErrorMsg('⚠️ تم تجميد إدخال الأكواد لمدة 10 دقائق بسبب محاولات متكررة خاطئة لحماية النظام من التخمين.');
        } else if (res.error === 'already_used') {
          setErrorMsg('هذا الكود تم استخدامه بالفعل من قِبل حساب آخر ولا يمكن استخدامه مرة أخرى.');
        } else if (res.error === 'invalid_code') {
          setErrorMsg(`كود التفعيل غير صحيح. متبقي ${5 - fails} محاولات قبل القفل المؤقت.`);
        } else if (res.error === 'not_logged_in') {
          setErrorMsg('يجب تسجيل الدخول بحساب Google أولاً لتفعيل وربط الكود بحسابك.');
        } else {
          setErrorMsg('تعذر تفعيل الكود، يرجى المحاولة لاحقاً أو التواصل مع الدعم.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLectures = () => {
    const stageId = successResult?.subscription?.stageId || successResult?.subscription?.targetId || 'sec-3';
    handleClose();
    if (onNavigate) {
      onNavigate('stage-lectures', { stageId });
    }
  };

  const studentUid = currentUser?.uid || currentUser?.id;
  const isGuest = !currentUser || !studentUid || studentUid === 'guest';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(6px)',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2rem',
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          margin: 'auto'
        }}
      >
        <button
          onClick={handleClose}
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

        {/* If successfully redeemed, show full success confirmation */}
        {successResult ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}>
              <CheckCircle2 size={38} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--text-main)' }}>
              ✅ تم الاشتراك بنجاح
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem' }}>
              تم تفعيل وربط الكود بحساب Google الخاص بك (<strong>{currentUser?.email}</strong>) بشكل دائم.
            </p>

            {/* Subscription details summary card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '2px solid #10B981',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              textAlign: 'right',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>المرحلة / المحتوى:</span>
                <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>{successResult.stageName || successResult.subscription?.targetTitle}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الحالة:</span>
                <span style={{ background: '#10B981', color: 'white', fontWeight: 800, fontSize: '0.78rem', padding: '3px 10px', borderRadius: '20px' }}>
                  مشترك (Active) 🟢
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>تاريخ البداية:</span>
                <strong style={{ fontSize: '0.88rem' }}>{successResult.startDate}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>تاريخ الانتهاء:</span>
                <strong style={{ fontSize: '0.88rem', color: '#059669' }}>{successResult.expirationDate || successResult.expiresAtFormatted}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>المدة:</span>
                <strong style={{ fontSize: '0.88rem' }}>{successResult.durationDays} يوم</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleGoToLectures}
                className="btn btn-primary btn-lg"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  fontWeight: 800,
                  gap: '8px'
                }}
              >
                <span>دخول محاضرات المرحلة الآن 🚀</span>
              </button>
              <button
                onClick={handleClose}
                className="btn btn-secondary btn-lg"
              >
                <span>تم</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--primary-gradient)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Key size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>شحن وتفعيل كود المرحلة</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  أدخل كود التفعيل المستلم لفتح المرحلة وربطها بحساب Google الخاص بك
                </p>
              </div>
            </div>

            {/* Check if user is logged in with Google */}
            {isGuest ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)',
                border: '1.5px solid var(--primary-300)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
                  تسجيل الدخول مطلوب أولاً 🔐
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 1.25rem' }}>
                  لحماية اشتراكك ومزامنته على كافة أجهزتك (الموبايل، التابلت، اللابتوب)، يجب تسجيل الدخول بحساب Google قبل إدخال الكود.
                </p>

                <button
                  onClick={() => openAuthModal && openAuthModal('login')}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    fontWeight: 800,
                    gap: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span>تسجيل الدخول باستخدام Google 🚀</span>
                </button>
              </div>
            ) : (
              /* Input Form for Logged-In Student */
              <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  background: 'var(--bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Shield size={14} color="#10B981" />
                  <span>سيتم ربط الاشتراك بالحساب: <strong>{currentUser?.email}</strong></span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رمز كود التفعيل (Activation Code):</label>
                  <input
                    type="text"
                    placeholder={lockoutRemaining > 0 ? `تم القفل المؤقت: انتظر ${lockoutRemaining} ثانية` : "مثال: ABC123 أو MS-SEC3-8812"}
                    value={codeInput}
                    disabled={lockoutRemaining > 0 || isSubmitting}
                    onChange={e => {
                      setCodeInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="input-control"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: lockoutRemaining > 0 ? 'rgba(239, 68, 68, 0.08)' : undefined,
                      borderColor: lockoutRemaining > 0 ? '#EF4444' : undefined
                    }}
                    required
                  />
                </div>

                {errorMsg && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    color: '#DC2626',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'right'
                  }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !codeInput.trim() || lockoutRemaining > 0}
                  className="btn btn-primary btn-lg"
                  style={{
                    width: '100%',
                    gap: '8px',
                    opacity: (isSubmitting || lockoutRemaining > 0) ? 0.7 : 1,
                    fontWeight: 800,
                    background: lockoutRemaining > 0 ? '#475569' : undefined,
                    cursor: lockoutRemaining > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {lockoutRemaining > 0
                      ? `محظور مؤقتاً: انتظر ${lockoutRemaining} ثانية ⏳`
                      : isSubmitting
                      ? 'جاري التحقق وربط الاشتراك بالحساب...'
                      : 'تفعيل الكود وفتح المحاضرات 🚀'}
                  </span>
                </button>
              </form>
            )}

            {/* WhatsApp Direct Help */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(18, 140, 126, 0.04))',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(37, 211, 102, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                لا تمتلك كود تفعيل حتى الآن؟
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                تواصل مباشرة مع المستر أو فريق الدعم عبر واتساب للحصول على كود التفعيل وتفعيل مرحلتك فوراً:
              </p>

              <a
                href={`https://wa.me/${(teacherProfile?.whatsappNumber || '01012345678').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('السلام عليكم يا مستر مايكل، أريد الحصول على كود تفعيل اشتراك لمرحلتي على المنصة.')}`}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  background: '#25D366',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                }}
              >
                <span>💬 تواصل عبر واتساب لشراء كود</span>
              </a>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <Shield size={12} />
                <span>الكود يُستخدم لمرة واحدة فقط لربط الاشتراك بحساب Google ويفتح المحتوى على كافة أجهزتك</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

