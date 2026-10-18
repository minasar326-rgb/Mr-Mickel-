import React, { useState, useEffect } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import EnglishExamModal from './EnglishExamModal';
import { 
  Trophy, Key, Lock, CheckCircle2, AlertCircle, Clock, BookOpen, 
  ArrowRight, ShieldCheck, Award, Sparkles, AlertTriangle, FileText, Check
} from 'lucide-react';

export default function ComprehensiveExamsPage({ onNavigate, initialExamId, onOpenCodeModal }) {
  const { 
    generalExams, 
    generalExamCodes, 
    verifyAndRedeemGeneralExamCode,
    examSubmissions
  } = useTeacher();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [selectedExamId, setSelectedExamId] = useState(initialExamId || generalExams[0]?.id || 'gen-exam-01');
  const [activeExamModal, setActiveExamModal] = useState(null); // { exam, code }
  const [errorMessage, setErrorMessage] = useState('');

  // Update selectedExamId if initialExamId changes
  useEffect(() => {
    if (initialExamId) {
      setSelectedExamId(initialExamId);
    }
  }, [initialExamId]);

  const currentUid = currentUser?.uid || currentUser?.id;
  const currentStudentName = currentUser?.name || '';

  // Get active selected comprehensive exam
  const currentExam = generalExams.find(e => e.id === selectedExamId) || generalExams[0];

  // Check if student has already submitted this comprehensive exam
  const examKey = `general-${currentExam?.id || 'gen-exam-01'}`;
  const existingSubmission = currentUid && examSubmissions[examKey] ? examSubmissions[examKey][currentUid] : null;
  const isAlreadySubmitted = Boolean(existingSubmission && existingSubmission.status);

  // Check if student has an allocated code for this exam
  const myAllocatedCode = generalExamCodes.find(c => 
    c.examId === currentExam?.id && 
    ((currentUid && c.studentId === currentUid) || (currentStudentName && c.studentName === currentStudentName))
  );

  const handleVerifyCodeAndStart = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (currentExam?.status === 'suspended') {
      setErrorMessage('عذراً، هذا الامتحان مغلق مؤقتاً بواسطة المستر وغير متاح للدخول حالياً!');
      return;
    }

    if (isAlreadySubmitted && (!myAllocatedCode || !myAllocatedCode.allowRetake)) {
      setErrorMessage('عذراً، لقد أتممت هذا الامتحان مسبقاً (تم التسليم). الامتحان متاح لمرة واحدة فقط!');
      return;
    }

    const codeToTest = inputCode.trim() || myAllocatedCode?.code;
    if (!codeToTest) {
      setErrorMessage('يرجى إدخال كود الامتحان المخصص لك');
      return;
    }

    const verification = verifyAndRedeemGeneralExamCode(codeToTest, currentUid, currentStudentName);
    if (!verification.success) {
      setErrorMessage(verification.error);
      return;
    }

    setActiveExamModal({
      exam: verification.exam || currentExam,
      code: codeToTest
    });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.25rem', minHeight: '85vh' }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => onNavigate('home')}
          className="btn btn-ghost btn-sm"
          style={{ gap: '6px', fontWeight: 700 }}
        >
          <ArrowRight size={16} />
          <span>العودة للرئيسية</span>
        </button>

        <span className="badge badge-gold" style={{ fontSize: '0.85rem', padding: '6px 16px', fontWeight: 800 }}>
          🌟 قسم الامتحانات الشاملة المستقل (Comprehensive Assessments Hub)
        </span>
      </div>

      {/* Hero Header Box */}
      <div className="card" style={{
        padding: '2.5rem',
        background: 'linear-gradient(135deg, rgba(31, 77, 58, 0.96) 0%, rgba(21, 56, 42, 0.98) 100%)',
        color: '#F4E8D3',
        borderRadius: 'var(--radius-xl)',
        border: '2px solid rgba(166, 124, 82, 0.55)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '750px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(166, 124, 82, 0.25)', padding: '6px 14px', borderRadius: '30px', border: '1px solid #A67C52', marginBottom: '1rem' }}>
            <Trophy size={16} color="#F59E0B" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FCD34D' }}>
              قسم مستقل بالكامل • خارج المراحل والشهور والكورسات
            </span>
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, margin: '0 0 0.75rem', color: '#FFFFFF', lineHeight: '1.3' }}>
            الامتحانات الشاملة — مستر مايكل شحاتة
          </h1>

          <p style={{ margin: 0, fontSize: '1rem', color: '#E2E8F0', lineHeight: '1.7' }}>
            امتحانات عامة لقياس مستوى الطالب في مهارات وقواعد ومفردات اللغة الإنجليزية، تشمل تصحيحاً تلقائياً للأسئلة الموضوعية وتصحيحاً يدوياً للمقالي. الدخول يتم عبر كود شخصي لكل طالب ومسموح بمحاولة واحدة فقط.
          </p>
        </div>
      </div>

      {/* Part 1: All Comprehensive Exams Cards (Independent Selection) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
            اختر الامتحان الشامل لبدء الاختبار 🎯
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            إجمالي: {generalExams.length} امتحان شامل
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {generalExams.map(exam => {
            const isSelected = exam.id === currentExam?.id;
            const qCount = (exam.questions || []).length;
            const essayCount = (exam.questions || []).filter(q => q.type === 'essay' || q.type === 'short_answer').length;
            const exKey = `general-${exam.id}`;
            const stdSub = currentUid && examSubmissions[exKey] ? examSubmissions[exKey][currentUid] : null;
            const hasFinished = Boolean(stdSub && stdSub.status);
            const isSusp = exam.status === 'suspended';

            return (
              <div
                key={exam.id}
                onClick={() => { setSelectedExamId(exam.id); setErrorMessage(''); }}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-surface)',
                  border: isSelected ? '2.5px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 6px 20px rgba(31, 77, 58, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '16px',
                    background: 'var(--primary-600)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '2px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Check size={12} />
                    <span>الامتحان المحدد</span>
                  </div>
                )}

                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>امتحان شامل</span>
                  {hasFinished ? (
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                      تم التسليم ({stdSub.totalScore} / {stdSub.maxMarks})
                    </span>
                  ) : isSusp ? (
                    <span className="badge" style={{ background: '#EF4444', color: '#fff', fontSize: '0.72rem' }}>مغلق مؤقتاً</span>
                  ) : (
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>متاح للدخول ✓</span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                  {exam.title}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: '1.5' }}>
                  {exam.description || 'امتحان شامل لتقييم جميع جوانب اللغة الإنجليزية بدقة عالية.'}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'var(--bg-subtle)', fontSize: '0.75rem' }}>
                    <Clock size={12} /> {exam.timeMinutes || 45} دقيقة
                  </span>
                  <span className="badge" style={{ background: 'var(--bg-subtle)', fontSize: '0.75rem' }}>
                    <FileText size={12} /> {qCount} أسئلة
                  </span>
                  <span className="badge" style={{ background: 'var(--bg-subtle)', fontSize: '0.75rem' }}>
                    <Award size={12} /> {exam.totalMarks || 30} درجة
                  </span>
                  {essayCount > 0 && (
                    <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                      ✍️ {essayCount} مقالي
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Part 2: Code Verification & Instructions for Selected Exam */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Card 1: Code Verification & Entry */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                تفعيل كود الدخول لـ: {currentExam?.title} 🔐
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                كود شخصي خاص بك مربوط باسمك والامتحان المحدد
              </span>
            </div>
          </div>

          {/* Condition A: Already submitted */}
          {isAlreadySubmitted && (!myAllocatedCode || !myAllocatedCode.allowRetake) ? (
            <div style={{
              background: '#FEF2F2',
              border: '2px solid #FCA5A5',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle2 size={44} color="#EF4444" />
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#991B1B', display: 'block', marginBottom: '4px' }}>
                  لقد أتممت هذا الامتحان مسبقاً (تم التسليم) ✓
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#7F1D1D', lineHeight: '1.6' }}>
                  درجتك المسجلة: <strong>{existingSubmission.totalScore} / {existingSubmission.maxMarks}</strong>
                  {existingSubmission.status === 'pending_grading' && ' (بانتظار اعتماد درجات الأسئلة المقالية من المستر ⏳)'}
                </p>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#991B1B', marginTop: '6px' }}>
                  🔒 مسموح بمحاولة واحدة فقط. لا يمكن الدخول مرة أخرى إلا بموافقة المستر وإعادة فتح المحاولة من لوحة التحكم.
                </span>
              </div>
            </div>
          ) : (
            /* Condition B: Code input form */
            <form onSubmit={handleVerifyCodeAndStart} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {myAllocatedCode && (
                <div style={{
                  background: 'rgba(31, 77, 58, 0.08)',
                  border: '1.5px solid rgba(31, 77, 58, 0.3)',
                  padding: '1rem',
                  borderRadius: '10px'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    تم العثور على الكود المخصص لحسابك لهذا الامتحان:
                  </span>
                  <div className="flex-between">
                    <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#1F4D3A' }}>
                      {myAllocatedCode.code}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setInputCode(myAllocatedCode.code)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      استخدام الكود
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px' }}>
                  أدخل كود الامتحان الشامل الخاص بك:
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={e => { setInputCode(e.target.value); setErrorMessage(''); }}
                  placeholder="مثال: GEN-SEC3-STD101-7891"
                  className="input-control"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.05rem',
                    letterSpacing: '1px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    textAlign: 'center'
                  }}
                  required
                />
              </div>

              {errorMessage && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#DC2626" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ gap: '8px', fontWeight: 800, width: '100%', fontSize: '1rem' }}
              >
                <Trophy size={18} />
                <span>التحقق وبدء الامتحان الشامل الآن 🚀</span>
              </button>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
                ⚠️ تنبيه: بمجرد فتح الامتحان وبدء المؤقت، لا تقم بغلق الصفحة حتى تنتهي من تسليم جميع الإجابات.
              </span>
            </form>
          )}
        </div>

        {/* Card 2: Exam Instructions & Anti-Cheating Rules */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                تعليمات وضوابط الامتحان الشامل 📋
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                يرجى القراءة بعناية قبل الضغط على بدء
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>محاولة واحدة فقط:</strong> الكود يُقفل نهائياً بعد التسليم ولا يمكن استخدامه مرتين.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>الترتيب الإلزامي:</strong> تبدأ بأسئلة الاختيار من متعدد والصح/خطأ، تليها الأسئلة المقالية.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>التصحيح المزدوج:</strong> تصحيح فوري للاختياري، بينما تُحال الأسئلة المقالية لمستر مايكل للمراجعة ورصد الدرجة.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>مكافحة الغش:</strong> مغادرة نافذة الامتحان أو فتح تبويبات خارجية تؤدي لخصم وإلغاء الامتحان تلقائياً.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>علامة مائية أمنية:</strong> تظهر بياناتك كعلامة مائية متحركة لمنع التصوير الخارجي.</span>
            </div>
          </div>
        </div>
      </div>

      {/* English Exam Modal Active Session */}
      {activeExamModal && (
        <EnglishExamModal
          isOpen={!!activeExamModal}
          onClose={() => setActiveExamModal(null)}
          lectureId={`general-${activeExamModal.exam.id}`}
          isGeneralExam={true}
          generalExamId={activeExamModal.exam.id}
          generalExamCode={activeExamModal.code}
          previewExam={activeExamModal.exam}
          onExamComplete={() => {
            setActiveExamModal(null);
            addToast('تم الانتهاء من الامتحان الشامل وتسليم الإجابات بنجاح! 🏆', 'success');
          }}
        />
      )}
    </div>
  );
}
