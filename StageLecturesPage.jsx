import React from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, Play, Lock, CheckCircle2, Clock, 
  HelpCircle, Upload, ArrowRight, Key, Sparkles, Award, MessageCircle, Calendar, ShieldCheck
} from 'lucide-react';

export default function StageLecturesPage({ stageId, onNavigate, onOpenCodeModal }) {
  const { 
    teacherProfile, 
    stages, 
    lectures, 
    completedLectureIds, 
    homeworkSubmissions, 
    examResults,
    getSubscriptionStatus,
    isLectureUnlocked
  } = useTeacher();
  const { role } = useAuth();

  const currentStages = Array.isArray(stages) && stages.length > 0 ? stages : (teacherProfile?.stages || []);
  const stage = currentStages.find(s => s.id === stageId) || currentStages[0] || { id: stageId, name: 'المرحلة الدراسية', badge: 'دفعة 2026', description: 'منهج تدريبي متكامل لشرح المنهج وحل التدريبات.' };
  const stageLectures = (Array.isArray(lectures) ? lectures : []).filter(l => l.stageId === stage.id);

  // Check stage-level subscription status
  const stageSub = getSubscriptionStatus(stage.id);
  const isStageSubscribed = stageSub.isSubscribed;
  const cleanWhatsapp = (teacherProfile?.whatsappNumber || '01012345678').replace(/[^0-9]/g, '');

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container">
        {/* Stage Header Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: 'white',
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <button
                onClick={() => onNavigate('stages')}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(255, 255, 255, 0.15)', color: 'white', border: 'none', gap: '6px' }}
              >
                <ArrowRight size={16} />
                <span>كافة المراحل</span>
              </button>
              <span className="badge badge-gold">{stage.badge}</span>
              {isStageSubscribed && (
                <span className="badge badge-success" style={{ background: '#10B981', color: 'white', fontWeight: 800 }}>
                  ✓ اشتراك VIP نشط
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 8px', color: 'white' }}>
              محاضرات {stage.name} 🎓
            </h1>

            <p style={{ color: '#C7D2FE', fontSize: '1rem', maxWidth: '700px', lineHeight: '1.6', margin: 0 }}>
              {stage.description}
            </p>
          </div>
        </div>

        {/* Dynamic Subscription Status Banner */}
        {isStageSubscribed ? (
          <div className="card animate-fade-in" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(5, 150, 105, 0.22) 100%)',
            border: '2px solid #10B981',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.45)',
                flexShrink: 0
              }}>
                <ShieldCheck size={32} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ 
                    background: '#10B981', color: 'white', padding: '3px 10px', 
                    borderRadius: '20px', fontSize: '0.78rem', fontWeight: 900 
                  }}>
                    🟢 الحالة: مشترك (Active)
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 800 }}>
                    مفعل ومربوط بحساب Google ✅
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                  جميع محاضرات {stage.name} مفتوحة لك وجاهزة للمشاهدة فوراً
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  {stageSub.startDateFormatted && (
                    <span>📅 تاريخ البداية: <strong>{stageSub.startDateFormatted}</strong></span>
                  )}
                  {stageSub.startDateFormatted && <span>•</span>}
                  <span>📅 تاريخ الانتهاء: <strong>{stageSub.expiresAtFormatted}</strong></span>
                  <span>•</span>
                  <span>⏳ متبقي في الاشتراك: <strong style={{ color: '#059669' }}>{stageSub.daysRemaining} يوم</strong></span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#065F46',
              padding: '8px 14px',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={18} color="#10B981" />
              <span>مفتوح على كل أجهزتك</span>
            </div>
          </div>
        ) : stageSub.isExpired ? (
          <div className="card animate-fade-in" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.08) 100%)',
            border: '2px solid #EF4444',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1.5px solid rgba(239, 68, 68, 0.3)'
              }}>
                <Clock size={30} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ 
                    background: '#EF4444', color: 'white', padding: '3px 10px', 
                    borderRadius: '20px', fontSize: '0.78rem', fontWeight: 900 
                  }}>
                    ⚠️ الحالة: اشتراك منتهي (Expired)
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                  انتهى اشتراكك في هذه المرحلة ({stage.name})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  انتهت صلاحية الاشتراك بتاريخ <strong>{stageSub.expiresAtFormatted}</strong>. يرجى تجديد الاشتراك أو شحن كود جديد لمواصلة المشاهدة.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={onOpenCodeModal}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', fontWeight: 800 }}
              >
                <Key size={15} />
                <span>تجديد وشحن كود جديد 🔑</span>
              </button>
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`السلام عليكم يا مستر مايكل، انتهى اشتراكي في مرحلة: ${stage.name} وأريد تجديد الاشتراك.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontWeight: 700, textDecoration: 'none', color: '#059669' }}
              >
                <MessageCircle size={15} />
                <span>تجديد عبر واتساب</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.03) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Lock size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-main)' }}>
                  المرحلة مقفلة - تتطلب اشتراكاً أو كود تفعيل 🔒
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  اشحن كود التفعيل المستلم أو تواصل مع المستر عبر واتساب لتفعيل اشتراكك وفتح كافة المحاضرات فوراً
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`السلام عليكم يا مستر مايكل، أريد الاشتراك في محاضرات: ${stage.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  gap: '6px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <MessageCircle size={16} />
                <span>الاشتراك عبر واتساب</span>
              </a>

              <button
                onClick={onOpenCodeModal}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontWeight: 700 }}
              >
                <Key size={15} />
                <span>شحن كود التفعيل 🔑</span>
              </button>
            </div>
          </div>
        )}

        {/* Lectures List Header */}
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>المحاضرات والوحدات المتاحة</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              إجمالي المحاضرات: {stageLectures.length} محاضرة معتمدة
            </span>
          </div>

          {!isStageSubscribed && (
            <button
              onClick={onOpenCodeModal}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <Key size={18} />
              <span>شحن وتفعيل كود مرحلة</span>
            </button>
          )}
        </div>

        {/* Lectures Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {stageLectures.map((lec) => {
            const isUnlocked = isLectureUnlocked(lec, stage.id);
            const lecSub = getSubscriptionStatus(lec.id);
            const isCompleted = completedLectureIds.includes(lec.id);
            const hw = homeworkSubmissions[lec.id];
            const exam = examResults[lec.id];

            return (
              <div
                key={lec.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  background: 'var(--bg-surface)',
                  border: isUnlocked 
                    ? '2px solid #10B981' 
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: isUnlocked 
                    ? '0 8px 25px rgba(16, 185, 129, 0.18)' 
                    : 'var(--shadow-sm)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', height: '190px' }}>
                  <img
                    src={lec.thumbnail}
                    alt={lec.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span className="badge badge-primary" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    {lec.unitNumber}
                  </span>

                  {isUnlocked ? (
                    <span style={{ 
                      position: 'absolute', top: '12px', left: '12px', 
                      background: '#10B981', color: 'white', padding: '4px 10px', 
                      borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                    }}>
                      {lec.isFree ? '🟢 محاضرة مجانية' : '✓ متاح ضمن اشتراكك 🟢'}
                    </span>
                  ) : (
                    <span style={{ 
                      position: 'absolute', top: '12px', left: '12px', 
                      background: 'rgba(15, 23, 42, 0.85)', color: '#FCD34D', padding: '4px 10px', 
                      borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid rgba(252, 211, 77, 0.4)' 
                    }}>
                      🔒 باشتراك ({lec.price || '70 ج.م'})
                    </span>
                  )}

                  {!isUnlocked && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.68)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      gap: '8px',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <Lock size={32} color="#F87171" />
                      <span style={{ fontSize: '0.92rem', fontWeight: 800 }}>المحاضرة مقفلة (تتطلب اشتراك)</span>
                      <span style={{ fontSize: '0.78rem', color: '#CBD5E1' }}>اشحن كود التفعيل أو تواصل عبر واتساب</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 6px', lineHeight: '1.4' }}>
                      {lec.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      {lec.subtitle}
                    </p>
                  </div>

                  {/* Status Badges Row */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    fontSize: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.75rem'
                  }}>
                    <span className="badge badge-subtle">⏱️ {lec.duration}</span>
                    {isUnlocked && !lec.isFree && (
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        ⏳ ساري (متبقي {stageSub.daysRemaining || lecSub.daysRemaining || 30} يوم)
                      </span>
                    )}
                    {lec.isFree && <span className="badge badge-success">✓ مجانية للجميع</span>}
                    {isCompleted && <span className="badge badge-success">✓ تمت المشاهدة</span>}
                    {hw?.status === 'submitted' && <span className="badge badge-primary">📝 تم تسليم الواجب</span>}
                    {exam && <span className="badge badge-gold">🏆 الامتحان: {exam.score}/{exam.total}</span>}
                  </div>

                  {/* Action */}
                  <div>
                    {isUnlocked ? (
                      <button
                        onClick={() => onNavigate('lecture-room', { lectureId: lec.id })}
                        className="btn btn-primary"
                        style={{ 
                          width: '100%', 
                          gap: '8px',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                          fontWeight: 800
                        }}
                      >
                        <Play size={16} fill="currentColor" />
                        <span>مشاهدة المحاضرة والواجبات الآن ▶️</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <a
                          href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`مرحباً ${teacherProfile?.name || 'مستر مايكل شحاته'}، أريد الاشتراك في محاضرة: "${lec.title}" (${stage?.name || 'المرحلة الدراسية'}).`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            gap: '8px',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            fontWeight: 800,
                            textDecoration: 'none',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <MessageCircle size={18} />
                          <span>الاشتراك عبر واتساب المستر 💬</span>
                        </a>

                        <button
                          onClick={onOpenCodeModal}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', gap: '6px', color: 'var(--primary-600)', fontWeight: 700 }}
                        >
                          <Key size={15} />
                          <span>معي كود شحن بالفعل 🔑</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
