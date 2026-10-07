import React, { useState } from 'react';
import { useCourses } from '../../context/CourseContext';
import { X, Trash2, ShoppingBag, ArrowLeft, Tag, Check, Sparkles } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, onCheckout }) {
  const { cart, removeFromCart, appliedCoupon, applyCoupon, removeCoupon } = useCourses();
  const [couponCode, setCouponCode] = useState('');

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discountRate) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const success = applyCoupon(couponCode);
    if (success) setCouponCode('');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-start',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--primary-500)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>سلة المشتريات ({cart.length})</h3>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-icon-only"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>سلتك فارغة حالياً</p>
              <p style={{ fontSize: '0.85rem' }}>استكشف مكتبة دوراتنا وابدأ رحلتك التعليمية اليوم!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div 
                  key={item.courseId}
                  className="card"
                  style={{
                    padding: '0.75rem',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    background: 'var(--bg-subtle)'
                  }}
                >
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    style={{ width: '70px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      margin: '0 0 4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                        {item.price} ر.س
                      </span>
                      {item.originalPrice && (
                        <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                          {item.originalPrice} ر.س
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.courseId)}
                    className="btn btn-ghost btn-icon-only"
                    style={{ color: 'var(--error)', padding: '6px' }}
                    title="حذف من السلة"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)'
          }}>
            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Tag size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="كود الخصم (جرب MADAREK50)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="input-control"
                  style={{ paddingRight: '32px', fontSize: '0.85rem' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm">
                تطبيق
              </button>
            </form>

            {appliedCoupon && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} />
                  <span>تم تطبيق {appliedCoupon.name}</span>
                </div>
                <button 
                  onClick={removeCoupon}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  إلغاء
                </button>
              </div>
            )}

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-secondary)' }}>المجموع الفرعي:</span>
                <span>{subtotal} ر.س</span>
              </div>
              {appliedCoupon && (
                <div className="flex-between" style={{ color: 'var(--success)' }}>
                  <span>الخصم المطبق ({appliedCoupon.discountRate * 100}%):</span>
                  <span>-{discountAmount} ر.س</span>
                </div>
              )}
              <div className="flex-between" style={{ fontSize: '1.1rem', fontWeight: 800, borderTop: '1px dashed var(--border-subtle)', paddingTop: '8px' }}>
                <span>الإجمالي النهائي:</span>
                <span style={{ color: 'var(--primary-600)' }}>{total} ر.س</span>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => {
                onClose();
                onCheckout({ items: cart, total, discountAmount, appliedCoupon });
              }}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', gap: '8px' }}
            >
              <span>متابعة الدفع الآمن</span>
              <ArrowLeft size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
