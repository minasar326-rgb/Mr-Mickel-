import React, { useState } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import CertificateModal from './CertificateModal';
import { 
  Play, BookOpen, Key, CheckCircle2, XCircle, Trophy, Clock, 
  HelpCircle, Upload, Flame, Award, ArrowLeft, Sparkles, LogOut, 
  MessageCircle, ShieldCheck, Mail, User, Calendar
} from 'lucide-react';

export default function StudentPortal({ onNavigate, onOpenCodeModal }) {
  const { 
    teacherProfile, 
    stages, 
    lectures, 
    unlockedLectureIds, 
    completedLectureIds, 
    homeworkSubmissions, 
    examResults,
    getSubscriptionStatus,
    isLectureUnlocked
  } = useTeacher();
  const { currentUser, logout, openAuthModal, deleteAccount } = useAuth();
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // If not logged in with Google, prompt to login
  if (!currentUser || !currentUser.uid) {
    return (
      <div className="page-container" style={{ background: 'var(--bg-main)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '540px' }}>
          <div className="card text-center" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              border: '1px solid #E2E8F0'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              حساب الطالب واشتراكاتي
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              أهلاً بك! يرجى تسجيل الدخول بحساب Google لعرض ملفك الشخصي واشتراكاتك في المراحل والمحاضرات المتاحة لك.
            </p>

            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                gap: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}
            >
              <span>تسجيل الدخول باستخدام Google 🚀</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cleanWhatsapp = (teacherProfile?.whatsappNumber || '01012345678').replace(/[^0-9]/g, '');
  const allStages = Array.isArray(stages) && stages.length > 0 ? stages : (teacherProfile?.stages || []);

  // Filter lectures to ONLY those the student has unlocked or subscribed to
  const myUnlockedLectures = (lectures || []).filter(l => isLectureUnlocked(l, l.stageId));

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container">
        {/* Student Profile Card (Google Account Details) */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: 'white',
          padding: '2rem 2.5rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 30px rgba(30, 27, 75, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <img
              src={currentUser.photoURL || currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={currentUser.name}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '3px solid #818CF8',
                objectFit: 'cover',
                background: 'white'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'white' }}>
                  {currentUser.name} 👋
                </h1>
                <span className="badge badge-gold">طالب معتمد</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: '#C7D2FE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} />
                  <span>{currentUser.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <ShieldCheck size={14} color="#34D399" />
                  <span>User UID: {currentUser.uid}</span>
                </div>
                {currentUser.createdAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#A5B4FC' }}>
                    <Calendar size={13} />
                    <span>تاريخ التسجيل: {new Date(currentUser.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setIsCertOpen(true)}
              className="btn btn-warning"
              style={{ gap: '8px', fontWeight: 800, padding: '0.75rem 1.25rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}
            >
              <Award size={18} />
              <span>شهادة التفوق 🏆</span>
            </button>

            <button
              onClick={logout}
              className="btn btn-ghost"
              style={{
                gap: '6px',
                color: '#F87171',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 700
              }}
            >
              <LogOut size={16} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* SECTION: اشتراكاتي بالمراحل الدراسية (My Subscriptions) */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 4px' }}>
                اشتراكاتي بالمراحل الدراسية 🎓
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                حالة اشتراكك في كل مرحلة دراسية، ومدة الصلاحية المتبقية
              </p>
            </div>

            <button
              onClick={onOpenCodeModal}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <Key size={18} />
              <span>شحن كود لتفعيل مرحلة 🔑</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {allStages.map((stage) => {
              const sub = getSubscriptionStatus ? getSubscriptionStatus(stage.id) : { isSubscribed: false };
              const isSubscribed = sub.isSubscribed;

              return (
                <div
                  key={stage.id}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-xl)',
                    border: isSubscribed ? '2px solid #10B981' : '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                    boxShadow: isSubscribed ? '0 8px 25px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-primary">{stage.badge || 'دفعة 2026'}</span>
                      {isSubscribed ? (
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#059669',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={16} />
                          <span>مشترك ✅</span>
                        </span>
                      ) : sub.isExpired ? (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#DC2626',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={16} />
                          <span>اشتراك منتهي ⚠️</span>
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#DC2626',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <XCircle size={16} />
                          <span>غير مشترك ❌</span>
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px' }}>
                      {stage.name}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: '1.5' }}>
                      {stage.description}
                    </p>

                    {isSubscribed ? (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        color: '#065F46',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        {sub.startDateFormatted && <div>📅 تاريخ البداية: <strong>{sub.startDateFormatted}</strong></div>}
                        <div>📅 تاريخ الانتهاء: <strong>{sub.expiresAtFormatted}</strong></div>
                        <div>⏳ متبقي في الاشتراك: <strong>{sub.daysRemaining} يوم</strong></div>
                      </div>
                    ) : sub.isExpired ? (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        color: '#B91C1C',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div>⚠️ <strong>انتهى اشتراكك في هذه المرحلة</strong></div>
                        <div>انتهت الصلاحية بتاريخ: <strong>{sub.expiresAtFormatted}</strong></div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>يرجى تجديد الاشتراك أو شحن كود جديد للمتابعة</div>
                      </div>
                    ) : (
                      <div style={{
                        background: 'var(--bg-subtle)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)'
                      }}>
                        قيمة اشتراك الشهر: <strong style={{ color: 'var(--primary-600)' }}>{stage.pricePerMonth || '250 ج.م'}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {isSubscribed ? (
                      <button
                        onClick={() => onNavigate('stage-lectures', { stageId: stage.id })}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          fontWeight: 800
                        }}
                      >
                        <span>دخول محاضرات المرحلة 🚀</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={onOpenCodeModal}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, gap: '6px', fontWeight: 700 }}
                        >
                          <Key size={14} />
                          <span>{sub.isExpired ? 'تجديد الاشتراك 🔑' : 'شحن كود 🔑'}</span>
                        </button>
                        <a
                          href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`مرحباً يا مستر مايكل، أريد ${sub.isExpired ? 'تجديد اشتراكي في' : 'الاشتراك في'} مرحلة: ${stage.name}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, gap: '6px', fontWeight: 700, textDecoration: 'none', color: '#059669' }}
                        >
                          <MessageCircle size={14} />
                          <span>واتساب المستر 💬</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION: المحاضرات المتاحة ضمن اشتراكي */}
        <div>
          <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 4px' }}>
                المحاضرات المتاحة للمشاهدة فوراً 📖
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                يظهر لك فقط المحتوى الذي تمتلك اشتراكاً نشطاً فيه ({myUnlockedLectures.length} محاضرة متاحة)
              </span>
            </div>
          </div>

          {myUnlockedLectures.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Key size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px' }}>
                لا توجد لديك محاضرات مفعلة بعد
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 1.5rem', maxWidth: '480px', marginInline: 'auto' }}>
                اشحن كود التفعيل المستلم من السنتر أو تواصل مع المستر عبر واتساب لتفعيل اشتراكك في مرحلتك الدراسية فوراً.
              </p>
              <button
                onClick={onOpenCodeModal}
                className="btn btn-primary"
                style={{ gap: '8px', marginInline: 'auto' }}
              >
                <Key size={18} />
                <span>شحن وتفعيل كود الآن</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {myUnlockedLectures.map(lec => {
                const isCompleted = completedLectureIds.includes(lec.id);
                const hw = homeworkSubmissions[lec.id];
                const exam = examResults[lec.id];

                return (
                  <div key={lec.id} className="card" style={{
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg-surface)',
                    border: '2px solid #10B981',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.15)'
                  }}>
                    <div style={{ position: 'relative', height: '170px' }}>
                      <img src={lec.thumbnail} alt={lec.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span className="badge badge-primary" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        {lec.unitNumber}
                      </span>
                      <span style={{ 
                        position: 'absolute', top: '10px', left: '10px', 
                        background: '#10B981', color: 'white', padding: '3px 8px', 
                        borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800 
                      }}>
                        ✓ متاح باشتراكك 🟢
                      </span>
                    </div>

                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px', lineHeight: '1.4' }}>
                          {lec.title}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                          ⏱️ {lec.duration}
                        </p>
                      </div>

                      {/* Status Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem' }}>
                        {isCompleted ? <span className="badge badge-success">✓ تمت المشاهدة</span> : <span className="badge badge-subtle">قيد المتابعة</span>}
                        {hw?.status === 'submitted' && <span className="badge badge-primary">📝 الواجب تم</span>}
                        {exam && <span className="badge badge-gold">🏆 {exam.score}/{exam.total}</span>}
                      </div>

                      <button
                        onClick={() => onNavigate('lecture-room', { lectureId: lec.id })}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          fontWeight: 800
                        }}
                      >
                        <Play size={16} fill="currentColor" />
                        <span>مشاهدة المحاضرة الآن ▶️</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Privacy & Deletion (Google Play Policy Compliance) */}
        <div className="card" style={{ marginTop: '2.5rem', padding: '1.5rem 2rem', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-lg)', background: 'rgba(239, 68, 68, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.3rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} />
                <span>الخصوصية وحذف الحساب (Google Play Compliance)</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                يحق لك حذف حسابك وبياناتك المخزنة نهائياً في أي وقت وفقاً لسياسة الخصوصية.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a 
                href="/privacy-policy.html" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: '50px' }}
              >
                سياسة الخصوصية
              </a>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="btn"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '0.85rem',
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontWeight: 700
                }}
              >
                حذف حسابي وبياناتي
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card, #1E293B)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              تأكيد حذف الحساب نهائياً
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم مسح كافة بياناتك المسجلة، سجل اشتراكاتك في المحاضرات، ونقاطك فوراً ولا يمكن استرجاعها.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="btn btn-secondary"
                style={{ borderRadius: '50px', padding: '10px 24px' }}
              >
                إلغاء التراجع
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true);
                  await deleteAccount();
                  setIsDeleting(false);
                  setIsDeleteModalOpen(false);
                  if (onNavigate) onNavigate('home');
                }}
                disabled={isDeleting}
                style={{
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '10px 24px',
                  fontWeight: 800,
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف حسابي الآن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      <CertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        studentData={{
          name: currentUser.name || 'طالب متميز',
          code: currentUser.uid?.slice(0, 10) || 'MS-2026',
          stageName: 'منصة مستر مايكل شحاته (The Master)'
        }}
        examScore="50 / 50 (الدرجة النهائية)"
      />
    </div>
  );
}
