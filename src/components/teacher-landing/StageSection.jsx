import React from 'react';
import { useTeacher, normalizeStageId } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Key, ArrowLeft, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

export default function StageSection({ onNavigate, onOpenCodeModal }) {
  const { stages, lectures, getSubscriptionStatus } = useTeacher();
  const { currentUser } = useAuth();

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.75rem'
        }}>
          {(Array.isArray(stages) ? stages : []).map((stage, idx) => {
            const stageLectures = (Array.isArray(lectures) ? lectures : []).filter(l => l && !l.isDeleted && (l.stageId === stage.id || normalizeStageId(l.stageId) === normalizeStageId(stage.id)));
            const directSub = getSubscriptionStatus ? getSubscriptionStatus(stage.id) : { isSubscribed: false };
            const allAccessSub = getSubscriptionStatus ? getSubscriptionStatus('all-access') : { isSubscribed: false };
            const userSubs = currentUser?.subscriptions || {};
            const hasMonthSub = Object.values(userSubs).some(s => s && (
              s.stageId === stage.id || 
              normalizeStageId(s.stageId) === normalizeStageId(stage.id) || 
              (s.codeType === 'month' && stageLectures.some(l => l.sectionId === s.targetId))
            ));
            const isSubscribed = Boolean((directSub.isSubscribed && !directSub.isExpired) || 
                                 (allAccessSub.isSubscribed && !allAccessSub.isExpired) || 
                                 hasMonthSub);
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
                    <span>🟢 أنت مشترك في هذا المسار</span>
                    <span>•</span>
                    <span>دائم مدى الحياة ♾️</span>
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
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.45)',
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
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)',
                      border: '1.5px solid #10B981',
                      padding: '0.9rem 1.1rem',
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={18} color="#10B981" />
                          <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 800 }}>
                            أنت حالياً مشترك رسمي في هذا المسار
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#10B981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                          مفعّل ومفتوح ✅
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>
                        ♾️ الصلاحية: دائم مدى الحياة (يشمل كافة المحاضرات الحالية والجديدة)
                      </div>
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
                    <span>{isSubscribed ? `متابعة دراستك في ${stage.name.split(' ')[0]} 🚀` : `دخول محاضرات ${stage.name.split(' ')[0]}`}</span>
                    <ArrowLeft size={16} />
                  </button>

                  {!isSubscribed && (
                    <button
                      onClick={onOpenCodeModal}
                      className="btn btn-ghost btn-sm"
                      style={{ gap: '6px', color: 'var(--primary-600)', fontWeight: 700 }}
                    >
                      <Key size={15} />
                      <span>شحن كود هذه المرحلة 🔑</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
