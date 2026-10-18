import React, { useState, useEffect, useRef } from 'react';
import { examsData as initialExams } from '../../data/examsData';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  X, Trophy, CheckCircle2, AlertCircle, HelpCircle, ArrowLeft, ArrowRight, 
  RotateCcw, Clock, BookOpen, Image as ImageIcon, Send, FileText, Check, AlertTriangle, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EnglishExamModal({ isOpen, onClose, lectureId, previewMode = false, previewExam = null }) {
  const { submitStudentExamDetailed, submitExam, lectures, examsData, examSubmissions } = useTeacher();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const currentLecture = (lectures || []).find(l => l.id === lectureId);
  const exam = previewExam || currentLecture?.exam || (examsData && examsData[lectureId]) || initialExams[lectureId] || initialExams['lec-s3-01'];

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [cheatStrikes, setCheatStrikes] = useState(0);
  const [previewImageZoom, setPreviewImageZoom] = useState(null);

  // Exam Duration Countdown Timer
  const examDurationMinutes = Number(exam?.timeMinutes) || 25;
  const [secondsRemaining, setSecondsRemaining] = useState(examDurationMinutes * 60);

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(examDurationMinutes * 60);
      setCurrentStep(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setSubmissionResult(null);
      setCheatStrikes(0);
    }
  }, [isOpen, examDurationMinutes, lectureId]);

  // Countdown Interval
  useEffect(() => {
    if (!isOpen || isSubmitted || previewMode) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          addToast('⏳ انتهى الوقت المحدد للامتحان! تم تسليم إجاباتك تلقائياً.', 'warning', 6000);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isSubmitted, previewMode]);

  // Anti-Cheating: Tab Switch & Window Blur Detection
  useEffect(() => {
    if (!isOpen || isSubmitted || previewMode) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatStrikes(prev => {
          const next = prev + 1;
          if (next === 1) {
            addToast('⚠️ تنبيه أمان (1/3): تم رصد مغادرة نافذة الامتحان! يُحظر فتح نوافذ أخرى أثناء الاختبار.', 'warning', 4000);
          } else if (next === 2) {
            addToast('⚠️ تحذير أخير (2/3): مغادرة شاشة الامتحان مرة أخرى ستؤدي لتسليم الامتحان تلقائياً!', 'error', 5000);
          } else if (next >= 3) {
            addToast('🚫 تم تسليم الامتحان تلقائياً بسبب تكرار مغادرة شاشة الاختبار.', 'error', 6000);
            handleFinishExam();
          }
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOpen, isSubmitted, previewMode]);

  if (!isOpen || !exam) return null;

  // Combine regular questions + reading passage questions
  const allExamQuestions = [
    ...(exam.questions || []),
    ...(exam.readingPassage?.questions || [])
  ];

  const currentQ = allExamQuestions[currentStep];

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Answer Selection Handlers for all 5 question types
  const handleSelectOption = (optIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: optIdx
    }));
  };

  const handleToggleMultiOption = (optIdx) => {
    if (isSubmitted) return;
    const currentList = Array.isArray(selectedAnswers[currentQ.id]) ? selectedAnswers[currentQ.id] : [];
    const nextList = currentList.includes(optIdx)
      ? currentList.filter(i => i !== optIdx)
      : [...currentList, optIdx];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: nextList
    }));
  };

  const handleTextAnswerChange = (val) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: val
    }));
  };

  const handleFinishExam = () => {
    if (previewMode) {
      addToast('وضع المعاينة: لن يتم تسجيل درجات تجريبية في قاعدة البيانات.', 'info');
      onClose();
      return;
    }

    let autoScore = 0;
    let hasManual = false;

    allExamQuestions.forEach(q => {
      const qType = q.type || 'mcq';
      const userAns = selectedAnswers[q.id];
      const qPoints = Number(q.points) || 1;

      if (qType === 'essay' || qType === 'short_answer') {
        hasManual = true;
      } else if (qType === 'mcq' || qType === 'tf' || qType === 'translation') {
        if (Number(userAns) === Number(q.correctAnswer)) {
          autoScore += qPoints;
        }
      } else if (qType === 'multi') {
        const correctArray = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
        const userArray = Array.isArray(userAns) ? userAns : [];
        if (
          correctArray.length === userArray.length &&
          correctArray.every(val => userArray.includes(val))
        ) {
          autoScore += qPoints;
        }
      }
    });

    const totalMarks = Number(exam.totalMarks) || allExamQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    const passingMarks = Number(exam.passingMarks) || Math.ceil(totalMarks * 0.5);
    const passed = !hasManual && autoScore >= passingMarks;

    const resultObj = {
      autoScore,
      totalMarks,
      passingMarks,
      hasManualQuestions: hasManual,
      passed,
      status: hasManual ? 'pending_grading' : 'graded',
      submittedAt: new Date().toISOString()
    };

    setSubmissionResult(resultObj);
    setIsSubmitted(true);

    if (submitStudentExamDetailed) {
      submitStudentExamDetailed(lectureId, {
        answers: selectedAnswers,
        autoScore,
        maxMarks: totalMarks,
        hasManualQuestions: hasManual,
        questions: allExamQuestions
      });
    } else if (submitExam) {
      submitExam(lectureId, autoScore, totalMarks, passed);
    }

    if (passed && !hasManual) {
      try {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      } catch (e) {}
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setSubmissionResult(null);
    setCurrentStep(0);
    setSecondsRemaining(examDurationMinutes * 60);
  };

  const isCurrentQuestionAnswered = () => {
    if (!currentQ) return false;
    const ans = selectedAnswers[currentQ.id];
    if (currentQ.type === 'multi') {
      return Array.isArray(ans) && ans.length > 0;
    }
    if (currentQ.type === 'essay' || currentQ.type === 'short_answer') {
      return typeof ans === 'string' && ans.trim().length > 0;
    }
    return ans !== undefined && ans !== null;
  };

  const answeredCount = allExamQuestions.filter(q => {
    const a = selectedAnswers[q.id];
    if (q.type === 'multi') return Array.isArray(a) && a.length > 0;
    if (q.type === 'essay' || q.type === 'short_answer') return typeof a === 'string' && a.trim().length > 0;
    return a !== undefined && a !== null;
  }).length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      padding: '1.25rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          maxWidth: '820px',
          width: '100%',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', pb: '1rem', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1F4D3A 0%, #15382A 100%)',
              color: '#F4E8D3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(166, 124, 82, 0.3)'
            }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {exam.title || 'امتحان المحاضرة الإلكتروني'}
                </h3>
                {previewMode && (
                  <span className="badge" style={{ background: '#F59E0B', color: '#1E293B', fontWeight: 800 }}>
                    معاينة المستر 👁️
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                درجة النجاح: {exam.passingMarks || Math.ceil((exam.totalMarks || 20) * 0.5)} من {exam.totalMarks || 20} • {allExamQuestions.length} سؤال
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Timer Badge */}
            {!isSubmitted && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: secondsRemaining < 300 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle)',
                color: secondsRemaining < 300 ? '#EF4444' : 'var(--text-primary)',
                border: `1px solid ${secondsRemaining < 300 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
                fontWeight: 800,
                fontSize: '0.92rem'
              }}>
                <Clock size={16} />
                <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUBMISSION / RESULTS SCREEN */}
        {/* ------------------------------------------------------------- */}
        {isSubmitted && submissionResult ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }} className="animate-fade-in">
            {submissionResult.hasManualQuestions ? (
              /* Case 1: Has Essay/Short Answer Questions -> Pending Manual Teacher Grading */
              <>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: '2px solid rgba(245, 158, 11, 0.4)'
                }}>
                  <FileText size={48} />
                </div>

                <h3 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  تم تسليم الامتحان بنجاح يا بطل! 📝✨
                </h3>

                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  maxWidth: '620px',
                  margin: '0 auto 2rem',
                  textAlign: 'right'
                }}>
                  <h4 style={{ color: '#D97706', margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} />
                    <span>إجاباتك قيد المراجعة والتصحيح اليدوي من المستر</span>
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', margin: '0 0 12px' }}>
                    يحتوي هذا الامتحان على أسئلة مقالية / إجابات نصية تم إرسالها مباشرة إلى لوحة تحكم <strong>مستر مايكل شحاته</strong> للتدقيق ورصد الدرجة يدويًا.
                  </p>
                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                    <span>الدرجة التلقائية للأسئلة الموضوعية حتى الآن: </span>
                    <strong style={{ color: '#1F4D3A' }}>{submissionResult.autoScore} درجات</strong>
                    <span style={{ color: 'var(--text-muted)' }}> (سيتم إضافة درجات الأسئلة المقالية واعتماد النتيجة النهائية قريباً)</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '12px 0 0' }}>
                    💡 <strong>ملاحظة هامة:</strong> سيتم فتح المحاضرة التالية في تسلسل المنهج تلقائياً فور قيام المستر باعتماد درجتك وتجاوز نسبة 50%.
                  </p>
                </div>
              </>
            ) : (
              /* Case 2: Only Objective Questions -> Instant Automatic Score */
              <>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: submissionResult.passed ? 'rgba(31, 77, 58, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: submissionResult.passed ? '#1F4D3A' : '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: `2px solid ${submissionResult.passed ? 'rgba(31, 77, 58, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  boxShadow: submissionResult.passed ? '0 0 35px rgba(31, 77, 58, 0.3)' : 'none'
                }}>
                  {submissionResult.passed ? <Trophy size={48} /> : <AlertCircle size={48} />}
                </div>

                <h3 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {submissionResult.passed ? 'مبارك يا بطل! تم اجتياز الامتحان بنجاح 🏆' : 'حاول مرة أخرى لتحقيق درجة النجاح المطلوبة'}
                </h3>

                <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  درجتك النهائية: <strong style={{ color: submissionResult.passed ? '#1F4D3A' : '#EF4444', fontSize: '1.6rem' }}>
                    {submissionResult.autoScore} / {submissionResult.totalMarks}
                  </strong>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginRight: '8px' }}>
                    ({Math.round((submissionResult.autoScore / submissionResult.totalMarks) * 100)}%)
                  </span>
                </p>
              </>
            )}

            {/* Questions Review (if showCorrectAnswers is enabled or default true) */}
            {exam.showCorrectAnswers !== false && (
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  مراجعة إجاباتك ونموذج الإجابة الرسمي:
                </h4>

                {allExamQuestions.map((q, idx) => {
                  const userAns = selectedAnswers[q.id];
                  const qType = q.type || 'mcq';
                  const isEssay = qType === 'essay' || qType === 'short_answer';

                  let isCorrect = false;
                  if (qType === 'mcq' || qType === 'tf' || qType === 'translation') {
                    isCorrect = Number(userAns) === Number(q.correctAnswer);
                  } else if (qType === 'multi') {
                    const cArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
                    const uArr = Array.isArray(userAns) ? userAns : [];
                    isCorrect = cArr.length === uArr.length && cArr.every(x => uArr.includes(x));
                  }

                  return (
                    <div
                      key={q.id || idx}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        background: isEssay ? 'rgba(245, 158, 11, 0.05)' : (isCorrect ? 'rgba(31, 77, 58, 0.05)' : 'rgba(239, 68, 68, 0.05)'),
                        border: `1px solid ${isEssay ? 'rgba(245, 158, 11, 0.3)' : (isCorrect ? 'rgba(31, 77, 58, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        {isEssay ? (
                          <Clock size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                        ) : isCorrect ? (
                          <CheckCircle2 size={18} color="#1F4D3A" style={{ flexShrink: 0, marginTop: '2px' }} />
                        ) : (
                          <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                          {idx + 1}. {q.question}
                        </span>
                      </div>

                      {/* Question image if attached */}
                      {q.questionImage && (
                        <div style={{ marginBottom: '10px', marginRight: '26px' }}>
                          <img 
                            src={q.questionImage} 
                            alt="Question illustration" 
                            style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                          />
                        </div>
                      )}

                      <div style={{ fontSize: '0.88rem', paddingRight: '26px' }}>
                        {isEssay ? (
                          <>
                            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
                              <strong>إجابتك المسجلة:</strong> {userAns || '(لم تكتب إجابة)'}
                            </p>
                            {q.modelAnswer && (
                              <p style={{ margin: '4px 0', color: '#1F4D3A', fontWeight: 700 }}>
                                💡 نموذج الإجابة الاسترشادي للمستر: {q.modelAnswer}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p style={{ margin: '4px 0', color: isCorrect ? '#1F4D3A' : '#EF4444' }}>
                              <strong>إجابتك: </strong> 
                              {qType === 'multi' 
                                ? (Array.isArray(userAns) && userAns.length > 0 ? userAns.map(i => q.options[i]).join(' • ') : 'لم تجب')
                                : (q.options ? q.options[userAns] : userAns || 'لم تجب')}
                            </p>
                            {!isCorrect && q.options && (
                              <p style={{ margin: '4px 0', color: '#1F4D3A', fontWeight: 700 }}>
                                <strong>الإجابة الصحيحة: </strong> 
                                {qType === 'multi'
                                  ? (Array.isArray(q.correctAnswer) ? q.correctAnswer.map(i => q.options[i]).join(' • ') : q.options[q.correctAnswer])
                                  : q.options[q.correctAnswer]}
                              </p>
                            )}
                          </>
                        )}

                        {q.explanation && (
                          <div style={{
                            margin: '8px 0 0',
                            color: 'var(--text-secondary)',
                            fontSize: '0.84rem',
                            background: 'var(--bg-subtle)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            💡 <strong>توضيح مستر مايكل شحاته:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={handleRestart} className="btn btn-secondary" style={{ gap: '6px' }}>
                <RotateCcw size={16} />
                <span>إعادة المحاولة</span>
              </button>
              <button onClick={onClose} className="btn btn-primary" style={{ minWidth: '160px', fontWeight: 800 }}>
                العودة إلى المحاضرة
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* ACTIVE EXAM RUNNER */
          /* ------------------------------------------------------------- */
          <div>
            {/* Progress Bar & Indicators */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-primary" style={{ fontWeight: 800 }}>
                  السؤال {currentStep + 1} من {allExamQuestions.length}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  تمت الإجابة على: <strong>{answeredCount}</strong> / {allExamQuestions.length}
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((currentStep + 1) / allExamQuestions.length) * 100}%`,
                  background: 'linear-gradient(90deg, #1F4D3A 0%, #A67C52 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Reading Passage if attached */}
            {exam.readingPassage && (
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1F4D3A', fontWeight: 800, fontSize: '0.92rem' }}>
                  <BookOpen size={18} />
                  <span>{exam.readingPassage.title}</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.7', margin: 0, direction: 'ltr', textAlign: 'left' }}>
                  "{exam.readingPassage.text}"
                </p>
              </div>
            )}

            {/* Current Question Body */}
            {currentQ && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{
                    fontSize: '1.18rem',
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line',
                    color: 'var(--text-primary)'
                  }}>
                    {currentStep + 1}. {currentQ.question}
                  </h4>
                  <span className="badge" style={{ background: 'rgba(166, 124, 82, 0.15)', color: '#A67C52', fontWeight: 800, flexShrink: 0 }}>
                    {currentQ.points || 1} {Number(currentQ.points) === 1 ? 'درجة' : 'درجات'}
                  </span>
                </div>

                {/* Optional Question Image */}
                {currentQ.questionImage && (
                  <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <img 
                      src={currentQ.questionImage} 
                      alt="Question illustration"
                      onClick={() => setPreviewImageZoom(currentQ.questionImage)}
                      style={{
                        maxHeight: '260px',
                        maxWidth: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      title="اضغط للتكبير"
                    />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      (اضغط على الصورة للتكبير)
                    </div>
                  </div>
                )}

                {/* 1. MCQ Single Choice & Translation */}
                {(currentQ.type === 'mcq' || currentQ.type === 'translation' || !currentQ.type) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(currentQ.options || []).map((option, optIdx) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIdx;
                      const optImg = currentQ.optionImages?.[optIdx];

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: 'var(--radius-lg)',
                            border: isSelected ? '2px solid #1F4D3A' : '1px solid var(--border-subtle)',
                            background: isSelected ? 'rgba(31, 77, 58, 0.08)' : 'var(--bg-surface)',
                            color: isSelected ? '#1F4D3A' : 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              border: isSelected ? '6px solid #1F4D3A' : '2px solid var(--border-strong)',
                              background: '#FFFFFF',
                              flexShrink: 0
                            }} />
                            <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? 800 : 500, direction: 'ltr', textAlign: 'left' }}>
                              {option}
                            </span>
                          </div>

                          {optImg && (
                            <img 
                              src={optImg} 
                              alt="Option" 
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. MCQ Multi-Select (Checkboxes) */}
                {currentQ.type === 'multi' && (
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#A67C52', fontWeight: 700, marginBottom: '10px' }}>
                      ☑️ اختر جميع الإجابات الصحيحة (يمكن اختيار أكثر من إجابة):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(currentQ.options || []).map((option, optIdx) => {
                        const currentList = Array.isArray(selectedAnswers[currentQ.id]) ? selectedAnswers[currentQ.id] : [];
                        const isSelected = currentList.includes(optIdx);
                        const optImg = currentQ.optionImages?.[optIdx];

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleToggleMultiOption(optIdx)}
                            style={{
                              padding: '1rem 1.25rem',
                              borderRadius: 'var(--radius-lg)',
                              border: isSelected ? '2px solid #1F4D3A' : '1px solid var(--border-subtle)',
                              background: isSelected ? 'rgba(31, 77, 58, 0.08)' : 'var(--bg-surface)',
                              color: isSelected ? '#1F4D3A' : 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                border: isSelected ? 'none' : '2px solid var(--border-strong)',
                                background: isSelected ? '#1F4D3A' : '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                flexShrink: 0
                              }}>
                                {isSelected && <Check size={16} strokeWidth={3} />}
                              </div>
                              <span style={{ fontSize: '0.95rem', fontWeight: isSelected ? 800 : 500, direction: 'ltr', textAlign: 'left' }}>
                                {option}
                              </span>
                            </div>

                            {optImg && (
                              <img 
                                src={optImg} 
                                alt="Option" 
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. True / False */}
                {currentQ.type === 'tf' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[
                      { label: 'صحيح (True) ✓', value: 0 },
                      { label: 'خطأ (False) ✗', value: 1 }
                    ].map(btn => {
                      const isSelected = selectedAnswers[currentQ.id] === btn.value;
                      return (
                        <button
                          key={btn.value}
                          type="button"
                          onClick={() => handleSelectOption(btn.value)}
                          style={{
                            padding: '1.25rem',
                            borderRadius: 'var(--radius-lg)',
                            border: isSelected ? '2px solid #1F4D3A' : '1px solid var(--border-subtle)',
                            background: isSelected ? 'rgba(31, 77, 58, 0.12)' : 'var(--bg-surface)',
                            color: isSelected ? '#1F4D3A' : 'var(--text-primary)',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 4. Essay Question */}
                {currentQ.type === 'essay' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      ✍️ اكتب إجابتك الكاملة والمفصلة هنا (سيتم مراجعتها وتصحيحها بواسطة المستر):
                    </label>
                    <textarea
                      rows={6}
                      value={selectedAnswers[currentQ.id] || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      placeholder="Type your complete answer or essay paragraph here..."
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1.5px solid var(--border-strong)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '0.98rem',
                        lineHeight: '1.6',
                        direction: 'ltr',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                {/* 5. Short Answer Question */}
                {currentQ.type === 'short_answer' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      ✏️ اكتب الإجابة القصيرة أو الكلمة المفقودة:
                    </label>
                    <input
                      type="text"
                      value={selectedAnswers[currentQ.id] || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      placeholder="Type your concise answer..."
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1.5px solid var(--border-strong)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        direction: 'ltr',
                        textAlign: 'left'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex-between" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="btn btn-secondary"
                style={{ opacity: currentStep === 0 ? 0.4 : 1, gap: '6px' }}
              >
                <ArrowRight size={16} />
                <span>السابق</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {currentStep < allExamQuestions.length - 1 ? (
                  <button
                    disabled={!isCurrentQuestionAnswered()}
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="btn btn-primary"
                    style={{ gap: '6px', fontWeight: 800, minWidth: '120px' }}
                  >
                    <span>التالي</span>
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <button
                    disabled={answeredCount === 0}
                    onClick={handleFinishExam}
                    className="btn btn-success btn-lg"
                    style={{
                      gap: '8px',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #1F4D3A 0%, #15382A 100%)',
                      borderColor: '#A67C52',
                      color: '#F4E8D3',
                      boxShadow: '0 4px 15px rgba(31, 77, 58, 0.4)'
                    }}
                  >
                    <span>تسليم الامتحان واحتساب النتيجة 🏆</span>
                    <Send size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {previewImageZoom && (
          <div 
            onClick={() => setPreviewImageZoom(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1600,
              background: 'rgba(0,0,0,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              cursor: 'zoom-out'
            }}
          >
            <img 
              src={previewImageZoom} 
              alt="Zoomed" 
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
