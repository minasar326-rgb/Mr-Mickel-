import React, { useState } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import EnglishExamModal from './EnglishExamModal';
import { 
  Trophy, Key, Lock, CheckCircle2, AlertCircle, Clock, BookOpen, 
  ArrowRight, ShieldCheck, Award, Sparkles, AlertTriangle, FileText
} from 'lucide-react';

export default function GeneralExamPage({ onNavigate, onOpenCodeModal }) {
  const { 
    generalExams, 
    generalExamCodes, 
    verifyAndRedeemGeneralExamCode,
    examSubmissions
  } = useTeacher();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [selectedExamId, setSelectedExamId] = useState(generalExams[0]?.id || 'gen-exam-01');
  const [activeExamModal, setActiveExamModal] = useState(null); // { exam, code }
  const [validatedCodeObj, setValidatedCodeObj] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const currentUid = currentUser?.uid || currentUser?.id;
  const currentStudentName = currentUser?.name || '';

  // Get active general exam
  const currentExam = generalExams.find(e => e.id === selectedExamId) || generalExams[0];

  // Check if student has already submitted this general exam
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

    setValidatedCodeObj(verification.codeObj);
    setActiveExamModal({
      exam: verification.exam || currentExam,
      code: codeToTest
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.25rem', minHeight: '85vh' }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={() => onNavigate('home')}
          className="btn btn-ghost btn-sm"
          style={{ gap: '6px', fontWeight: 700 }}
        >
          <ArrowRight size={16} />
          <span>العودة للرئيسية</span>
        </button>

        <span className="badge badge-gold" style={{ fontSize: '0.82rem', padding: '6px 14px', fontWeight: 800 }}>
          🌟 الامتحان العام الشامل (The Master Assessment)
        </span>
      </div>

      {/* Hero Header Box */}
      <div className="card" style={{
        padding: '2.5rem',
        background: 'linear-gradient(135deg, rgba(31, 77, 58, 0.95) 0%, rgba(21, 56, 42, 0.98) 100%)',
        color: '#F4E8D3',
        borderRadius: 'var(--radius-xl)',
        border: '2px solid rgba(166, 124, 82, 0.5)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(166, 124, 82, 0.25)', padding: '6px 14px', borderRadius: '30px', border: '1px solid #A67C52', marginBottom: '1rem' }}>
            <Trophy size={16} color="#F59E0B" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FCD34D' }}>
              اختبار قياس المستوى الشامل • مستقل عن المحاضرات
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.75rem', color: '#FFFFFF', lineHeight: '1.3' }}>
            {currentExam?.title || 'الامتحان العام الشامل — مستر مايكل شحاتة'}
          </h1>

          <p style={{ margin: 0, fontSize: '0.98rem', color: '#E2E8F0', lineHeight: '1.7' }}>
            {currentExam?.description || 'امتحان شامل لتقييم جميع جوانب اللغة الإنجليزية (قواعد، مفردات، مقالي، وتصحيح يدوي). الدخول لمرة واحدة فقط باستخدام الكود الشخصي المخصص لك.'}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#FCD34D" />
              <span>المدة: <strong>{currentExam?.timeMinutes || 45} دقيقة</strong></span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="#FCD34D" />
              <span>الدرجة الكلية: <strong>{currentExam?.totalMarks || 30} درجة</strong></span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={16} color="#F87171" />
              <span>المحاولات: <strong>محاولة واحدة فقط (Single Attempt)</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
        {/* Card 1: Gating & Code Verification */}
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                تفعيل كود الدخول للامتحان 🔐
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                كود شخصي خاص بك مربوط باسمك ومرحلتك
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
                    تم العثور على الكود المخصص لحسابك تلقائياً:
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
                  أدخل كود الامتحان العام الخاص بك:
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
                <span>التحقق وبدء الامتحان العام الآن 🚀</span>
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
                تعليمات وضوابط الامتحان 📋
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
              <span><strong>ترتيب الأسئلة:</strong> تبدأ بأسئلة الاختيار من متعدد والصح/خطأ، تليها الأسئلة المقالية.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>التصحيح اليدوي:</strong> الأسئلة المقالية تُحال مباشرة لمستر مايكل للمراجعة واعتماد الدرجة.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>مكافحة الغش:</strong> مغادرة نافذة الامتحان أو فتح تبويبات خارجية تؤدي لخصم وإلغاء الامتحان تلقائياً.</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '4px' }} />
              <span><strong>علامة مائية:</strong> تظهر بيانات الطالب كعلامة مائية متحركة لمنع التصوير الخارجي.</span>
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
            addToast('تم الانتهاء من الامتحان العام بنجاح! 🏆', 'success');
          }}
        />
      )}
    </div>
  );
}
