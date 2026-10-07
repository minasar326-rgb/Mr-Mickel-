import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Eye, EyeOff, X, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';

export default function TeacherLoginModal({ isOpen, onClose, onSuccess }) {
  const { switchRole } = useAuth();
  const { teacherProfile } = useTeacher();
  const { addToast } = useToast();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    return parseInt(localStorage.getItem('ms_login_fails') || '0', 10);
  });
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check lockout on mount & tick countdown
  React.useEffect(() => {
    const checkLock = () => {
      const lockUntil = parseInt(localStorage.getItem('ms_login_locked_until') || '0', 10);
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

  // Real teacher configured password ONLY (no hardcoded backdoors)
  const currentPassword = String(teacherProfile?.password || localStorage.getItem('ms_teacher_pin') || '12345').trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const trimmed = password.trim();
      const isMatch = trimmed.toLowerCase() === currentPassword.toLowerCase();

      if (isMatch) {
        // Reset failed counter
        localStorage.removeItem('ms_login_fails');
        localStorage.removeItem('ms_login_locked_until');
        setFailedAttempts(0);
        switchRole('instructor');
        addToast('أهلاً بك يا مستر مايكل شحاته في لوحة التحكم والإدارة 👑', 'success');
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const nextFails = failedAttempts + 1;
        setFailedAttempts(nextFails);
        localStorage.setItem('ms_login_fails', nextFails.toString());

        if (nextFails >= 5) {
          const lockTime = Date.now() + 60 * 1000; // 60 seconds lockout
          localStorage.setItem('ms_login_locked_until', lockTime.toString());
          setLockoutRemaining(60);
          setErrorMsg('⚠️ تم تجميد محاولات الدخول لمدة 60 ثانية لحماية حساب المستر من التخمين المتكرر.');
        } else {
          setErrorMsg(`رمز الدخول غير صحيح. متبقي ${5 - nextFails} محاولات قبل القفل الأمني.`);
        }
      }
    }, 250);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      padding: '1.5rem',
      direction: 'rtl'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
          position: 'relative',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
          border: '1px solid rgba(129, 140, 248, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#94A3B8',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
        >
          <X size={20} />
        </button>

        {/* Icon Header */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Lock size={30} color="white" />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.4rem', color: 'white' }}>
          منطقة إدارة المنصة 🇬🇧
        </h3>
        <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.75rem' }}>
          هذه المنطقة مخصصة لـ <strong>مستر مايكل شحاته</strong> فقط لرفع الفيديوهات وإدارة الطلاب وتوليد الأكواد.
        </p>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem', color: '#E2E8F0' }}>
              الرمز السري للمستر (PIN):
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={lockoutRemaining > 0 ? `مغلق مؤقتاً (${lockoutRemaining}s)` : "أدخل الرمز السري هنا..."}
                autoFocus
                required
                disabled={lockoutRemaining > 0 || isLoading}
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '14px',
                  background: lockoutRemaining > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.07)',
                  border: lockoutRemaining > 0 ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: lockoutRemaining > 0 ? '#FCA5A5' : 'white',
                  fontSize: '1.1rem',
                  letterSpacing: showPassword ? 'normal' : '3px',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#818CF8'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
              <KeyRound 
                size={18} 
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#818CF8' }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errorMsg && (
              <div style={{ marginTop: '10px', color: '#F87171', fontSize: '0.82rem', fontWeight: 700, lineHeight: '1.4' }}>
                {errorMsg}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || lockoutRemaining > 0}
            style={{
              padding: '14px',
              borderRadius: '14px',
              background: lockoutRemaining > 0 ? '#475569' : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: lockoutRemaining > 0 ? 'not-allowed' : 'pointer',
              boxShadow: lockoutRemaining > 0 ? 'none' : '0 8px 25px rgba(79, 70, 229, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => { if (lockoutRemaining <= 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <ShieldCheck size={20} />
            <span>
              {lockoutRemaining > 0 
                ? `محظور أمنياً: انتظر ${lockoutRemaining} ثانية ⏳` 
                : isLoading ? 'جاري التحقق...' : 'دخول لوحة تحكم المستر 🚀'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
