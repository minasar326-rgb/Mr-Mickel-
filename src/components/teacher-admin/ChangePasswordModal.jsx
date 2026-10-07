import React, { useState } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { Lock, KeyRound, Eye, EyeOff, X, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { teacherProfile, changeTeacherPassword } = useTeacher();
  const { addToast } = useToast();

  const currentPin = teacherProfile?.password || localStorage.getItem('ms_teacher_pin') || '12345';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = newPassword.trim();
    if (!trimmed) {
      setErrorMsg('يرجى كتابة كلمة المرور الجديدة.');
      return;
    }
    if (trimmed.length < 3) {
      setErrorMsg('كلمة المرور يجب أن تتكون من 3 أحرف أو أرقام على الأقل.');
      return;
    }
    if (trimmed !== confirmPassword.trim()) {
      setErrorMsg('كلمتا المرور غير متطابقتين. يرجى التأكد من كتابتهما بنفس الشكل.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await changeTeacherPassword(trimmed);
      setIsLoading(false);
      if (res.success) {
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('حدث خطأ أثناء حفظ كلمة المرور. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleResetToDefault = async () => {
    setIsLoading(true);
    await changeTeacherPassword('12345');
    setIsLoading(false);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1300,
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
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem 2rem',
          position: 'relative',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
          border: '1px solid rgba(129, 140, 248, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          color: 'white'
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

        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <KeyRound size={32} color="white" />
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 6px', color: 'white' }}>
            تغيير كلمة مرور دخول المستر 🔑
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>
            قم بتعيين كلمة مرور جديدة لدخول لوحة تحكم وإدارة المنصة
          </p>
        </div>

        {/* Current Password Info Banner */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '14px',
          padding: '10px 14px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C7D2FE' }}>
            <Lock size={16} />
            <span>كلمة المرور الحالية:</span>
          </div>
          <code style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '3px 10px',
            borderRadius: '8px',
            color: '#A5B4FC',
            fontWeight: 800,
            fontSize: '0.95rem',
            letterSpacing: '1px'
          }}>
            {currentPin}
          </code>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#E2E8F0' }}>
              كلمة المرور الجديدة:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة..."
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
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
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#E2E8F0' }}>
              تأكيد كلمة المرور الجديدة:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور للتأكيد..."
                required
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: confirmPassword && confirmPassword === newPassword 
                    ? '1px solid #10B981' 
                    : confirmPassword && confirmPassword !== newPassword 
                    ? '1px solid #EF4444' 
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <ShieldCheck 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  right: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: confirmPassword && confirmPassword === newPassword ? '#10B981' : '#818CF8' 
                }} 
              />
            </div>
            {confirmPassword && confirmPassword === newPassword && (
              <span style={{ fontSize: '0.75rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                <CheckCircle2 size={14} /> كلمتا المرور متطابقتان تماماً ✓
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(79, 70, 229, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{isLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة 🔐'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              title="إعادة تعيين إلى كلمة المرور الافتراضية (12345)"
              style={{
                padding: '14px 18px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={16} />
              <span>استعادة 12345</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
