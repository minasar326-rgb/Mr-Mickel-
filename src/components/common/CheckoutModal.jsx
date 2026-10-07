import React, { useState } from 'react';
import { useCourses } from '../../context/CourseContext';
import { useToast } from '../../context/ToastContext';
import { X, ShieldCheck, CreditCard, Smartphone, CheckCircle, Lock, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutModal({ isOpen, onClose, checkoutData, onCompleteSuccess }) {
  const { enrollInCourse, clearCart } = useCourses();
  const { addToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('mada'); // 'mada' | 'card' | 'apple' | 'stc'
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardHolder, setCardHolder] = useState('سعد القحطاني');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !checkoutData) return null;

  const total = checkoutData.total || 0;
  const items = checkoutData.items || [];

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Enroll in all purchased courses
      items.forEach(item => {
        enrollInCourse(item.courseId);
      });
      clearCart();

      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {}

      addToast('تمت عملية الدفع بنجاح وتسجيلك في جميع الدورات! 🚀', 'success');
    }, 1600);
  };

  const handleFinish = () => {
    setIsSuccess(false);
    onClose();
    if (items.length > 0) {
      onCompleteSuccess(items[0].courseId);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      padding: '1rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              تم الدفع والتسجيل بنجاح!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              تم إضافة الدورات إلى حسابك التعليمي مباشرة، وتم إرسال الفاتورة وتفاصيل الوصول إلى بريدك الإلكتروني.
            </p>

            <div className="card" style={{ padding: '1rem', background: 'var(--bg-subtle)', marginBottom: '1.5rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>الدورات المسجلة:</div>
              {items.map(item => (
                <div key={item.courseId} style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                  • {item.title}
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              ابدأ التعلم الآن في قاعة الدراسة
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>بوابة الدفع الإلكتروني الآمن</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تشفير عالي الأمان بمعايير 256-bit SSL</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1.5rem' }}>
              {[
                { id: 'mada', label: 'مدى mada', icon: '💳' },
                { id: 'card', label: 'بطاقة ائتمان', icon: '💳' },
                { id: 'apple', label: 'Apple Pay', icon: '' },
                { id: 'stc', label: 'STC Pay', icon: '📱' }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === method.id ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === method.id ? 'var(--primary-50)' : 'var(--bg-subtle)',
                    color: paymentMethod === method.id ? 'var(--primary-700)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{method.icon}</span>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePay}>
              {paymentMethod === 'apple' ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>جاهز للدفع الفوري عبر محفظة Apple Pay</p>
                  <button type="submit" className="btn btn-primary" style={{ background: '#000', color: '#fff', width: '100%', padding: '0.85rem' }}>
                     Pay ({total} ر.س)
                  </button>
                </div>
              ) : paymentMethod === 'stc' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>رقم جوال STC Pay:</label>
                  <input
                    type="tel"
                    defaultValue="0551234567"
                    className="input-control"
                    required
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>سيصلك إشعار لتأكيد عملية الخصم من تطبيق STC Pay.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>الاسم على البطاقة:</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={e => setCardHolder(e.target.value)}
                      className="input-control"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>رقم البطاقة:</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="input-control"
                      placeholder="XXXX XXXX XXXX XXXX"
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>تاريخ الانتهاء:</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={e => setExpiry(e.target.value)}
                        className="input-control"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>رمز الأمان (CVV):</label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={e => setCvv(e.target.value)}
                        className="input-control"
                        maxLength={4}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary Line */}
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem'
              }}>
                <div className="flex-between" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>عدد الدورات:</span>
                  <span style={{ fontWeight: 600 }}>{items.length}</span>
                </div>
                <div className="flex-between" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  <span>المبلغ الإجمالي للدفع:</span>
                  <span style={{ color: 'var(--primary-600)' }}>{total} ر.س</span>
                </div>
              </div>

              {/* Submit Button */}
              {paymentMethod !== 'apple' && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', gap: '8px' }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>جاري معالجة الدفع الآمن...</span>
                    </>
                  ) : (
                    <>
                      <span>تأكيد الدفع ({total} ر.س)</span>
                      <ArrowLeft size={18} />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
