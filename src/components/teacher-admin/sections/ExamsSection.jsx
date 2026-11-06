import React, { useState } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  HelpCircle, BookOpen, FileText, Trophy, Plus, Edit, 
  Trash2, CheckCircle2, Eye, Award, Check, Clock
} from 'lucide-react';

export default function ExamsSection({ onNavigate }) {
  const { 
    lectures = [], 
    stages = [], 
    examsData = {}, 
    pendingGradingSubmissions = [], 
    generalExams = [], 
    saveGeneralExam, 
    deleteGeneralExam,
    gradeStudentSubmission,
    addToast 
  } = useTeacher();

  const { activeStageId } = useAdminUI();
  const [subTab, setSubTab] = useState('list'); // 'list' | 'grading' | 'general'
  const [activeGradingSub, setActiveGradingSub] = useState(null);
  const [essayScores, setEssayScores] = useState({});
  const [teacherFeedback, setTeacherFeedback] = useState('أحسنت! إجابة متميزة.');

  // Filter lectures for current stage
  const filteredLectures = lectures.filter(l => {
    if (l.isDeleted) return false;
    if (activeStageId !== 'all' && l.stageId !== activeStageId) return false;
    return true;
  });

  const lecturesWithExams = filteredLectures.filter(l => l.exam || examsData[l.id]);

  const handleOpenGrading = (sub) => {
    setActiveGradingSub(sub);
    const initialScores = {};
    if (Array.isArray(sub.essayAnswers)) {
      sub.essayAnswers.forEach(ans => {
        initialScores[ans.questionId] = ans.awardedMarks || 0;
      });
    }
    setEssayScores(initialScores);
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!activeGradingSub) return;

    try {
      if (gradeStudentSubmission) {
        await gradeStudentSubmission({
          submissionId: activeGradingSub.id,
          lectureId: activeGradingSub.lectureId,
          studentUid: activeGradingSub.studentUid,
          essayScores,
          feedback: teacherFeedback
        });
      }
      addToast(`تم اعتماد نتيجة الطالب "${activeGradingSub.studentName}" وفتح المحاضرة التالية بنجاح! 🎯`, 'success');
      setActiveGradingSub(null);
    } catch (err) {
      addToast(`❌ تعذر اعتماد الدرجة: ${err.message}`, 'error');
    }
  };

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Exams Center Header & Sub-tabs */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                استوديو الامتحانات والتصحيح اليدوي (Manual Exam Center) 📝
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                إدارة امتحانات المحاضرات، رصد درجات الأسئلة المقالية يدوياً، والامتحانات الشاملة
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSubTab('list')}
              className={`admin-btn admin-btn-sm ${subTab === 'list' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              <BookOpen size={16} />
              <span>امتحانات المحاضرات ({lecturesWithExams.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('grading')}
              className={`admin-btn admin-btn-sm ${subTab === 'grading' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              <FileText size={16} />
              <span>طابور التصحيح اليدوي</span>
              {pendingGradingSubmissions.length > 0 && (
                <span className="admin-badge admin-badge-warning" style={{ background: '#EF4444', color: 'white' }}>
                  {pendingGradingSubmissions.length} 🔔
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubTab('general')}
              className={`admin-btn admin-btn-sm ${subTab === 'general' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            >
              <Trophy size={16} />
              <span>الامتحانات الشاملة ({generalExams.length})</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 1: LECTURE EXAMS DIRECTORY */}
        {/* ------------------------------------------------------------- */}
        {subTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text)' }}>
                امتحانات المحاضرات المفعلة:
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                (يتم ربط الامتحان وتعديل أسئلته مباشرة داخل قسم المحاضرات)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lecturesWithExams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
                  <HelpCircle size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>لا توجد امتحانات مفعلة للمحاضرات الحالية في هذه المرحلة</p>
                </div>
              ) : (
                lecturesWithExams.map(lec => {
                  const ex = lec.exam || examsData[lec.id];
                  const qCount = ex?.questions?.length || 0;
                  const totalMarks = ex?.totalMarks || 20;

                  return (
                    <div
                      key={lec.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: 'var(--admin-bg-subtle)',
                        borderRadius: 'var(--admin-radius-md)',
                        border: '1px solid var(--admin-border)',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)' }}>
                            {ex?.title || `امتحان محاضرة: ${lec.title}`}
                          </strong>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                            <span>المحاضرة: {lec.title}</span>
                            <span>•</span>
                            <span>{qCount} أسئلة</span>
                            <span>•</span>
                            <span>الدرجة الكلية: {totalMarks}</span>
                            <span>•</span>
                            <span>⏱️ {ex?.timeMinutes || 25} دقيقة</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="admin-badge admin-badge-success">نشط للطلاب ✅</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 2: MANUAL GRADING QUEUE */}
        {/* ------------------------------------------------------------- */}
        {subTab === 'grading' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--admin-text)' }}>
                إجابات الطلاب المقالية المعلقة ({pendingGradingSubmissions.length})
              </span>
            </div>

            {pendingGradingSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-lg)' }}>
                <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--admin-text)' }}>
                  رائع! لا توجد امتحانات معلقة بانتظار التصحيح اليدوي 🎉
                </h4>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  جميع إجابات الطلاب المقالية تم تصحيحها واعتماد درجاتها بنجاح.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {pendingGradingSubmissions.map((sub, sIdx) => (
                  <div
                    key={`${sub.lectureId}-${sub.studentUid}-${sIdx}`}
                    style={{
                      padding: '1.25rem',
                      background: 'var(--admin-bg-subtle)',
                      border: '1.5px solid #F59E0B',
                      borderRadius: 'var(--admin-radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="admin-badge admin-badge-warning">بانتظار تصحيح المستر ⏳</span>
                      </div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--admin-text)', display: 'block' }}>
                        الطالب: {sub.studentName}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                        امتحان: {sub.lectureTitle}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenGrading(sub)}
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Edit size={14} /> <span>مراجعة الإجابات ورصد الدرجة ✍️</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 3: GENERAL COMPREHENSIVE EXAMS */}
        {/* ------------------------------------------------------------- */}
        {subTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                  🌟 الامتحانات العامة الشاملة المستقلة ({generalExams.length})
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                  امتحانات مستقلة تظهر للطلاب في صفحة الامتحانات العامة برقم كود مخصص لكل طالب
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {generalExams.map(ex => (
                <div
                  key={ex.id}
                  style={{
                    padding: '1.25rem',
                    background: 'var(--admin-bg-subtle)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <span className="admin-badge admin-badge-gold" style={{ marginBottom: '8px' }}>
                      🌟 امتحان شامل
                    </span>
                    <strong style={{ fontSize: '1rem', color: 'var(--admin-text)', display: 'block' }}>
                      {ex.title}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                      الأسئلة: {ex.questions?.length || 0} • الدرجة: {ex.totalMarks || 50}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف الامتحان العام "${ex.title}"؟`)) {
                          deleteGeneralExam(ex.id);
                          addToast('تم حذف الامتحان العام 🗑️', 'info');
                        }
                      }}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Grading Modal */}
      {activeGradingSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: 'var(--admin-bg-surface)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--admin-text)' }}>
              تصحيح إجابات الطالب: {activeGradingSub.studentName}
            </h3>

            <form onSubmit={handleSubmitGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text)' }}>الملاحظات والتعليق للطالب:</label>
                <textarea
                  value={teacherFeedback}
                  onChange={e => setTeacherFeedback(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', minHeight: '80px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveGradingSub(null)}
                  className="admin-btn admin-btn-ghost"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                >
                  اعتماد الدرجة وفك القفل 🎯
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
