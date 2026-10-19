import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Eye, EyeOff, X, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';
import { 
  verifyPassword, 
  getStoredMasterAuth, 
  createAdminSession, 
  getLoginLockoutStatus, 
  recordFailedLoginAttempt, 
  clearFailedLoginAttempts 
} from '../../services/authSecurity';

export default function TeacherLoginModal({ isOpen, onClose, onSuccess }) {
  const { switchRole } = useAuth();
  const { teacherProfile } = useTeacher();
  const { addToast } = useToast();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check lockout on mount & tick countdown
  React.useEffect(() => {
    const checkLock = () => {
      const status = getLoginLockoutStatus();
      setLockoutRemaining(status.remainingSeconds);
    };
    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) {
      setErrorMsg('يرجى إدخال كلمة المرور.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      // 1. Retrieve stored PBKDF2 hash & salt
      const masterAuth = await getStoredMasterAuth();
      // 2. Perform constant-time cryptographic hash verification
      const isMatch = await verifyPassword(trimmed, masterAuth.hash, masterAuth.salt);

      setIsLoading(false);

      if (isMatch) {
        // Reset failed counters and lockout immediately
        clearFailedLoginAttempts();
        setLockoutRemaining(0);
        // Create secure signed session token with 24h validity (content uploader role)
        createAdminSession({ role: 'teacher_editor', authMethod: 'master_pin' });
        
        switchRole('instructor');
        addToast('أهلاً بك يا مستر مايكل شحاته في لوحة التحكم والإدارة 👑', 'success');
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const result = recordFailedLoginAttempt();
        if (result.isLocked) {
          setLockoutRemaining(result.remainingSeconds);
          setErrorMsg(`⚠️ رمز الدخول غير صحيح. تم تجميد المحاولات لمدة ${result.remainingSeconds} ثانية.`);
        } else {
          setErrorMsg(`رمز الدخول غير صحيح. متبقي ${5 - (result.failedAttempts % 5)} محاولات قبل القفل الأمني.`);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('حدث خطأ أثناء التحقق الأمني. يرجى المحاولة لاحقاً.');
    }
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
      padding: '1rem',
      direction: 'rtl'
    }}>
      <div 
        className="card animate-fade-in card-modal-responsive"
        style={{
          maxWidth: '440px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem 1.5rem',
          position: 'relative',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #18181D 0%, #0C0C0F 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
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
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.45)',
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
                placeholder={lockoutRemaining > 0 ? `محظور (${lockoutRemaining}s) - أو أدخل رمز المستر للإلغاء` : "أدخل الرمز السري هنا..."}
                autoFocus
                required
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '14px',
                  background: lockoutRemaining > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.07)',
                  border: lockoutRemaining > 0 ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
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
            disabled={isLoading}
            style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.45)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <ShieldCheck size={20} />
            <span>
              {isLoading ? 'جاري التحقق...' : 'دخول لوحة تحكم المستر 🚀'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
