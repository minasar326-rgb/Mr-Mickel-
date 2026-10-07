import React from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { BookOpen, Users, Key, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';

export default function StageSection({ onNavigate, onOpenCodeModal }) {
  const { stages, lectures, getSubscriptionStatus } = useTeacher();

  return (
    <section style={{ padding: '4.5rem 0', background: 'var(--bg-surface)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={15} color="var(--primary-600)" />
            <span>المراحل الدراسية والكورسات المتاحة</span>
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.75rem' }}>
            اختر مرحلتك الدراسية وابدأ التميز
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
            محتوى منظم ومحدث بالكامل وفقاً لأحدث تعديلات ونماذج امتحانات وزارة التربية والتعليم
          </p>
        </div>

        {/* Stages Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.75rem'
        }}>
          {(Array.isArray(stages) ? stages : []).map((stage, idx) => {
            const stageLectures = (Array.isArray(lectures) ? lectures : []).filter(l => l && l.stageId === stage.id);
            const sub = getSubscriptionStatus ? getSubscriptionStatus(stage.id) : { isSubscribed: false };
            const isSubscribed = sub.isSubscribed;
            const isFeatured = idx === 0 || stage.id === 'sec-3';

            return (
              <div
                key={stage.id}
                className="card"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  position: 'relative',
                  border: isSubscribed 
                    ? '2px solid #10B981' 
                    : isFeatured ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                  boxShadow: isSubscribed 
                    ? '0 10px 30px rgba(16, 185, 129, 0.25)' 
                    : isFeatured ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
                  background: 'var(--bg-surface)',
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Top Badge for Subscribed or Featured */}
                {isSubscribed ? (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    padding: '5px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.45)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>🟢 اشتراكك نشط ومفعّل</span>
                    <span>(متبقي {sub.daysRemaining} يوم)</span>
                  </div>
                ) : isFeatured ? (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    padding: '4px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
                    whiteSpace: 'nowrap'
                  }}>
                    ⭐ المسار الأكثر تسجيلاً والأقوى
                  </div>
                ) : null}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className="badge badge-primary">{stage.badge || 'دفعة 2026'}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      📖 {stageLectures.length} محاضرة متاحة
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 8px' }}>
                    {stage.name}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                    {stage.description}
                  </p>

                  {/* Price Tag or Active Subscription Box */}
                  {isSubscribed ? (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={18} color="#10B981" />
                        <span style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: 700 }}>
                          اشتراك مدفوع ونشط
                        </span>
                      </div>
                      <strong style={{ fontSize: '0.85rem', color: '#059669' }}>
                        ساري حتى {sub.expiresAtFormatted}
                      </strong>
                    </div>
                  ) : (
                    <div style={{
                      background: 'var(--bg-subtle)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>قيمة اشتراك الشهر:</span>
                      <strong style={{ fontSize: '1.3rem', color: 'var(--primary-600)' }}>{stage.pricePerMonth || '250 ج.م'}</strong>
                    </div>
                  )}

                  {/* Features List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    {(stage.features || ['شرح المنهج كامل', 'مذكرات واختبارات أسبوعية', 'تقارير واتساب لولي الأمر']).map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                  <button
                    onClick={() => onNavigate('stage-lectures', { stageId: stage.id })}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      gap: '8px',
                      background: isSubscribed ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : undefined,
                      boxShadow: isSubscribed ? '0 4px 15px rgba(16, 185, 129, 0.35)' : undefined,
                      fontWeight: 800
                    }}
                  >
                    <span>{isSubscribed ? `دخول محاضراتك الآن 🚀` : `دخول محاضرات ${stage.name.split(' ')[0]}`}</span>
                    <ArrowLeft size={16} />
                  </button>

                  <button
                    onClick={onOpenCodeModal}
                    className="btn btn-ghost btn-sm"
                    style={{ gap: '6px', color: isSubscribed ? '#059669' : 'var(--primary-600)', fontWeight: 700 }}
                  >
                    <Key size={15} />
                    <span>{isSubscribed ? 'تجديد أو شحن كود آخر 🔑' : 'شحن كود هذه المرحلة 🔑'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
