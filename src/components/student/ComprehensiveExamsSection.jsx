import React from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Clock, Award, Lock, FileText, ArrowLeft, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ComprehensiveExamsSection({ onNavigate, onOpenCodeModal }) {
  const { generalExams, examSubmissions } = useTeacher();
  const { currentUser } = useAuth();
  const currentUid = currentUser?.uid || currentUser?.id;

  // Filter only published or suspended comprehensive exams for students
  const studentExams = (Array.isArray(generalExams) ? generalExams : []).filter(e => e.status !== 'draft');

  return (
    <section 
      id="comprehensive-exams-section"
      style={{ 
        padding: '5rem 0', 
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
            color: '#D97706',
            fontSize: '0.88rem',
            fontWeight: 800,
            marginBottom: '1rem',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <Trophy size={16} color="#D97706" />
            <span>قسم مستقل تماماً • غير تابع لأي مرحلة أو محاضرة</span>
          </div>

          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
            الامتحانات الشاملة (Comprehensive Assessments) 📝
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7', margin: 0 }}>
            امتحانات قياس مستوى شاملة مصممة بنظام دقيق لتقييم جميع مهارات وقواعد اللغة الإنجليزية. الدخول بكود مخصص لكل طالب، ومسموح بمحاولة واحدة فقط لكل امتحان.
          </p>
        </div>

        {/* Exams Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {studentExams.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '2px dashed var(--border-subtle)'
            }}>
              <Trophy size={48} style={{ color: '#F59E0B', opacity: 0.5, margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px' }}>قريباً: سيتم إطلاق الامتحانات الشاملة</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                تابع إعلانات المستر لمعرفة موعد بدء الامتحان الشامل القادم واستلام الكود المخصص لك.
              </p>
            </div>
          ) : (
            studentExams.map(exam => {
              const qCount = (exam.questions || []).length;
              const essayCount = (exam.questions || []).filter(q => q.type === 'essay' || q.type === 'short_answer').length;
              const examKey = `general-${exam.id}`;
              const userSub = currentUid && examSubmissions[examKey] ? examSubmissions[examKey][currentUid] : null;
              const hasTaken = Boolean(userSub && userSub.status);
              const isSuspended = exam.status === 'suspended';

              return (
                <div
                  key={exam.id}
                  className="card"
                  style={{
                    padding: '2rem',
                    background: 'var(--bg-surface)',
                    border: '2px solid rgba(166, 124, 82, 0.45)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Status & Attempt Badges */}
                    <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '6px' }}>
                      <span className="badge badge-gold" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                        🌟 امتحان شامل مستقل
                      </span>

                      {hasTaken ? (
                        <span className="badge badge-success" style={{ fontSize: '0.78rem', gap: '4px' }}>
                          <CheckCircle2 size={13} />
                          <span>تم التسليم بنجاح ✓</span>
                        </span>
                      ) : isSuspended ? (
                        <span className="badge" style={{ background: '#EF4444', color: '#fff', fontSize: '0.78rem' }}>
                          🚫 مغلق مؤقتاً
                        </span>
                      ) : (
                        <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                          ✓ متاح للدخول الآن
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.6rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                      {exam.title}
                    </h3>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem', lineHeight: '1.6' }}>
                      {exam.description || 'امتحان شامل لتقييم جميع جوانب اللغة الإنجليزية بدقة عالية، وتصحيح تلقائي مع مراجعة يدوية للمقالي.'}
                    </p>

                    {/* Quick Metrics Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      <span className="badge" style={{ background: 'var(--bg-subtle)', gap: '4px' }}>
                        <Clock size={13} color="#D97706" />
                        <span>{exam.timeMinutes || 45} دقيقة</span>
                      </span>

                      <span className="badge" style={{ background: 'var(--bg-subtle)', gap: '4px' }}>
                        <FileText size={13} color="#2563EB" />
                        <span>{qCount} سؤال</span>
                      </span>

                      <span className="badge" style={{ background: 'var(--bg-subtle)', gap: '4px' }}>
                        <Award size={13} color="#10B981" />
                        <span>الدرجة: {exam.totalMarks || 30}</span>
                      </span>

                      <span className="badge" style={{ background: 'var(--bg-subtle)', gap: '4px' }}>
                        <Lock size={13} color="#EF4444" />
                        <span>محاولة واحدة فقط</span>
                      </span>

                      {essayCount > 0 && (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          ✍️ {essayCount} أسئلة مقالية
                        </span>
                      )}
                    </div>

                    {/* Result Card if Student Took the Exam */}
                    {hasTaken && (
                      <div style={{
                        padding: '0.85rem 1rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        color: '#065F46',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <span>درجتك المسجلة في هذا الامتحان:</span>
                        <strong style={{ fontSize: '1rem', color: '#047857' }}>
                          {userSub.totalScore} / {userSub.maxMarks}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                    <button
                      onClick={() => onNavigate('comprehensive-exams', { examId: exam.id })}
                      className="btn btn-primary btn-lg"
                      style={{
                        width: '100%',
                        fontWeight: 800,
                        gap: '8px',
                        fontSize: '0.95rem',
                        background: hasTaken ? 'var(--bg-subtle)' : 'var(--primary-gradient)',
                        color: hasTaken ? 'var(--text-primary)' : '#fff',
                        border: hasTaken ? '1px solid var(--border-subtle)' : 'none'
                      }}
                    >
                      <Trophy size={18} />
                      <span>{hasTaken ? 'عرض نتيجة وتفاصيل الامتحان 📊' : 'دخول الامتحان الشامل بالكود الشخصي 🔐'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Banner */}
        <div style={{
          marginTop: '3rem',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => onNavigate('comprehensive-exams')}
            className="btn btn-secondary btn-lg"
            style={{ gap: '8px', fontWeight: 800, padding: '0.85rem 2rem' }}
          >
            <span>الانتقال إلى صفحة الامتحانات الشاملة الكاملة</span>
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
