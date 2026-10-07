import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CourseContext';
import CertificateModal from '../common/CertificateModal';
import { 
  Flame, Award, BookOpen, Clock, Sparkles, Heart, 
  FileText, ArrowLeft, Trash2, CheckCircle2, Play, 
  Share2, ShieldCheck, Trophy, Layers, Calendar
} from 'lucide-react';

export default function StudentDashboard({ initialTab, onNavigate }) {
  const { currentUser } = useAuth();
  const { courses, enrolledCourses, wishlist, savedNotes, certificates, deleteNote, toggleWishlist } = useCourses();

  const [activeTab, setActiveTab] = useState(initialTab || 'courses'); // 'courses' | 'certificates' | 'achievements' | 'notes' | 'wishlist'
  const [selectedCert, setSelectedCert] = useState(null);

  // Enrolled courses populated with full details
  const myCourses = enrolledCourses.map(enrolled => {
    const courseData = courses.find(c => c.id === enrolled.courseId);
    return { ...courseData, ...enrolled };
  }).filter(c => c.title);

  // Wishlisted courses
  const wishlistCourses = courses.filter(c => wishlist.includes(c.id));

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)' }}>
      <div className="container">
        {/* Welcome Header Banner with Gamification Pill */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            position: 'relative',
            zIndex: 2
          }}>
            {/* User Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser?.name}
                style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid #818CF8', objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>
                    مرحباً، {currentUser?.name || 'سعد القحطاني'} 👋
                  </h1>
                  <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                    {currentUser?.level || 'طالب متميز'}
                  </span>
                </div>
                <p style={{ color: '#C7D2FE', fontSize: '0.9rem', margin: '4px 0 0' }}>
                  تابع شغفك التعليمي اليوم وحقق أهدافك المهنية خطوة بخطوة.
                </p>
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* Streak */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Flame size={22} color="#F97316" fill="#F97316" />
                <div>
                  <strong style={{ fontSize: '1.1rem', display: 'block', lineHeight: 1 }}>{currentUser?.currentStreak || 12} يوم</strong>
                  <span style={{ fontSize: '0.7rem', color: '#E0E7FF' }}>أيام التوالي</span>
                </div>
              </div>

              {/* XP */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Sparkles size={22} color="#FBBF24" />
                <div>
                  <strong style={{ fontSize: '1.1rem', display: 'block', lineHeight: 1 }}>{currentUser?.xpPoints?.toLocaleString() || '3,450'} XP</strong>
                  <span style={{ fontSize: '0.7rem', color: '#E0E7FF' }}>نقاط الخبرة</span>
                </div>
              </div>

              {/* Certificates */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Award size={22} color="#34D399" />
                <div>
                  <strong style={{ fontSize: '1.1rem', display: 'block', lineHeight: 1 }}>{certificates.length}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#E0E7FF' }}>شهادة معتمدة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-subtle)',
          gap: '1.5rem',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {[
            { id: 'courses', label: `دوراتي الحالية (${myCourses.length})`, icon: BookOpen },
            { id: 'certificates', label: `شهاداتي المعتمدة (${certificates.length})`, icon: Award },
            { id: 'achievements', label: 'الأوسمة ولوحة الشرف', icon: Trophy },
            { id: 'notes', label: `ملاحظاتي (${savedNotes.length})`, icon: FileText },
            { id: 'wishlist', label: `قائمة الرغبات (${wishlist.length})`, icon: Heart }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.75rem 0.5rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--primary-600)' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: My Courses */}
        {activeTab === 'courses' && (
          <div className="animate-fade-in">
            {myCourses.length === 0 ? (
              <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <BookOpen size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>لست مسجلاً في أي دورة حالياً</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  استكشف مكتبة دوراتنا وابدأ مسارك المهني الأول اليوم!
                </p>
                <button onClick={() => onNavigate('courses')} className="btn btn-primary">
                  تصفح الدورات التدريبية
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {myCourses.map(course => (
                  <div key={course.id} className="card card-interactive" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: '170px' }}>
                      <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span className="badge badge-primary" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        {course.category}
                      </span>
                    </div>

                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px', lineHeight: '1.4' }}>
                          {course.title}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          بإشراف: {course.instructor?.name}
                        </span>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex-between" style={{ fontSize: '0.82rem', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600 }}>نسبة الإنجاز:</span>
                          <span style={{ fontWeight: 800, color: 'var(--primary-600)' }}>{course.progressPercentage || 0}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                          <div style={{ width: `${course.progressPercentage || 0}%`, height: '100%', background: 'var(--primary-gradient)' }} />
                        </div>

                        <button
                          onClick={() => onNavigate('classroom', { courseId: course.id })}
                          className="btn btn-primary"
                          style={{ width: '100%', gap: '6px' }}
                        >
                          <Play size={16} fill="currentColor" />
                          <span>{course.progressPercentage >= 100 ? 'مراجعة الدورة وقاعة الدراسة' : 'متابعة التعلم الآن'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Certificates */}
        {activeTab === 'certificates' && (
          <div className="animate-fade-in">
            {certificates.length === 0 ? (
              <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <Award size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>لم تحصل على شهادات بعد</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  أكمل أي دورة بنسبة 100% واجتز اختباراتها لاستلام شهادتك المعتمدة مباشرة!
                </p>
                <button onClick={() => setActiveTab('courses')} className="btn btn-primary">
                  متابعة دوراتي قيد التعلم
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {certificates.map(cert => (
                  <div key={cert.id} className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#FEF3C7',
                        color: '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Award size={24} />
                      </div>
                      <div>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>شهادة موثقة ومعتمدة</span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          الرقم: {cert.id}
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px', lineHeight: '1.4' }}>
                      {cert.courseTitle}
                    </h3>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>المتدرب: <strong>{cert.studentName}</strong></div>
                      <div>تاريخ الإصدار: <span>{cert.issueDate}</span></div>
                      <div>التقدير: <strong style={{ color: 'var(--success)' }}>{cert.grade}</strong></div>
                    </div>

                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="btn btn-primary"
                      style={{ width: '100%', gap: '6px' }}
                    >
                      <span>عرض وطباعة الشهادة الرسمية</span>
                      <Award size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Achievements & Leaderboard */}
        {activeTab === 'achievements' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
            {/* Badges List */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>الأوسمة والإنجازات الشخصية</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentUser?.achievements?.map(ach => (
                  <div key={ach.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0.85rem 1rem',
                    background: ach.unlocked ? 'var(--bg-subtle)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    opacity: ach.unlocked ? 1 : 0.5
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: ach.unlocked ? 'var(--primary-50)' : 'var(--bg-subtle)',
                      color: ach.unlocked ? 'var(--primary-600)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Trophy size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.95rem' }}>{ach.title}</strong>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ach.description}</p>
                    </div>
                    {ach.unlocked ? (
                      <span className="badge badge-success">تم الفتح ✓</span>
                    ) : (
                      <span className="badge badge-subtle">قيد التقدم</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Honor Roll */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>🏆 لوحة الشرف الأسبوعية</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { rank: 1, name: 'سارة الزهراني', xp: '5,820 XP', badge: '🥇 المركز الأول' },
                  { rank: 2, name: currentUser?.name || 'سعد القحطاني', xp: '3,450 XP', badge: '🥈 المركز الثاني (أنت)' },
                  { rank: 3, name: 'فيصل الشريف', xp: '3,100 XP', badge: '🥉 المركز الثالث' },
                  { rank: 4, name: 'عبدالله الشمري', xp: '2,890 XP', badge: 'المستوى 4' },
                  { rank: 5, name: 'نوف القحطاني', xp: '2,650 XP', badge: 'المستوى 5' }
                ].map(user => (
                  <div key={user.rank} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: user.rank === 2 ? 'var(--primary-50)' : 'var(--bg-subtle)',
                    border: user.rank === 2 ? '1px solid var(--primary-300)' : '1px solid transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ width: '20px', color: 'var(--primary-600)' }}>#{user.rank}</strong>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#F59E0B' }}>{user.xp}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Saved Notes */}
        {activeTab === 'notes' && (
          <div className="animate-fade-in">
            {savedNotes.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                لا توجد ملاحظات محفوظة لديك بعد. يمكنك تدوين الملاحظات أثناء مشاهدة أي درس في قاعة الدراسة.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {savedNotes.map(note => (
                  <div key={note.id} className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ gap: '4px' }}>
                        <Clock size={12} />
                        <span>{note.timestamp}</span>
                      </span>
                      <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px' }}>{note.lessonTitle}</h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="animate-fade-in">
            {wishlistCourses.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                قائمة الرغبات فارغة حالياً. أضف أي دورة تنال إعجابك بالنقر على أيقونة القلب ❤️.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {wishlistCourses.map(course => (
                  <div key={course.id} className="card" style={{ padding: '1rem', background: 'var(--bg-surface)', display: 'flex', gap: '12px' }}>
                    <img src={course.thumbnail} alt={course.title} style={{ width: '100px', height: '75px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {course.title}
                      </h4>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-600)' }}>{course.price} ر.س</span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button onClick={() => onNavigate('course-detail', { courseId: course.id })} className="btn btn-primary btn-sm">
                          التفاصيل
                        </button>
                        <button onClick={() => toggleWishlist(course.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                          إزالة
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
          certificate={selectedCert}
        />
      )}
    </div>
  );
}
