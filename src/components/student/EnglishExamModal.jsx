import React, { useState } from 'react';
import { examsData } from '../../data/examsData';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { X, Trophy, CheckCircle2, AlertCircle, HelpCircle, ArrowLeft, ArrowRight, RotateCcw, Clock, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EnglishExamModal({ isOpen, onClose, lectureId }) {
  const { submitExam } = useTeacher();
  const { addToast } = useToast();

  const exam = examsData[lectureId] || examsData['lec-s3-01'];

  const [currentStep, setCurrentStep] = useState(0); // index across all questions
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(null);
  const [cheatStrikes, setCheatStrikes] = useState(0);

  // Anti-Cheating: Tab Switch & Window Blur Detection
  React.useEffect(() => {
    if (!isOpen || isSubmitted) return;

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
  }, [isOpen, isSubmitted]);

  if (!isOpen || !exam) return null;

  // Combine regular questions + reading passage questions
  const allExamQuestions = [
    ...(exam.questions || []),
    ...(exam.readingPassage?.questions || [])
  ];

  const currentQ = allExamQuestions[currentStep];

  const handleSelectOption = (optIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: optIdx
    }));
  };

  const handleFinishExam = () => {
    let score = 0;
    allExamQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const scaledScore = Math.round((score / allExamQuestions.length) * (exam.totalMarks || 20));
    const passed = scaledScore >= (exam.passingMarks || 14);

    const resultObj = {
      score: scaledScore,
      total: exam.totalMarks || 20,
      passed,
      correctCount: score,
      totalCount: allExamQuestions.length
    };

    setExamScore(resultObj);
    setIsSubmitted(true);
    submitExam(lectureId, scaledScore, exam.totalMarks || 20, passed);

    if (passed) {
      try {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      } catch (e) {}
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setExamScore(null);
    setCurrentStep(0);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      padding: '1.5rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          maxWidth: '740px',
          width: '100%',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {isSubmitted && examScore ? (
          /* Results View */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: examScore.passed ? 'var(--success-bg)' : 'var(--error-bg)',
              color: examScore.passed ? 'var(--success)' : 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: examScore.passed ? '0 0 35px rgba(16, 185, 129, 0.4)' : 'none'
            }}>
              {examScore.passed ? <Trophy size={46} /> : <AlertCircle size={46} />}
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              {examScore.passed ? 'مبارك يا بطل! تم اجتياز امتحان المستر بنجاح 🏆' : 'حاول مرة أخرى لتحقيق درجة النجاح المطلوبة'}
            </h3>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              الدرجة النهائية: <strong style={{ color: examScore.passed ? 'var(--success)' : 'var(--error)', fontSize: '1.5rem' }}>{examScore.score} / {examScore.total}</strong>
            </p>

            {/* Questions Breakdown Review */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                مراجعة الإجابات ونموذج الإجابة الرسمي:
              </h4>

              {allExamQuestions.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className="card"
                    style={{
                      padding: '1rem',
                      background: isCorrect ? 'var(--success-bg)' : 'var(--error-bg)',
                      border: `1px solid ${isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      {isCorrect ? <CheckCircle2 size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--error)" />}
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{idx + 1}. {q.question}</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', paddingRight: '26px' }}>
                      <p style={{ margin: '2px 0', color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                        إجابتك: {q.options[userAns] || 'لم تجب'}
                      </p>
                      {!isCorrect && (
                        <p style={{ margin: '2px 0', color: 'var(--success)', fontWeight: 700 }}>
                          الإجابة الصحيحة: {q.options[q.correctAnswer]}
                        </p>
                      )}
                      <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem', background: 'rgba(255, 255, 255, 0.6)', padding: '6px 10px', borderRadius: '6px' }}>
                        💡 <strong>توضيح مستر أحمد حسام:</strong> {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={handleRestart} className="btn btn-secondary" style={{ gap: '6px' }}>
                <RotateCcw size={16} />
                <span>إعادة المحاولة</span>
              </button>
              <button onClick={onClose} className="btn btn-primary">
                العودة إلى المحاضرة
              </button>
            </div>
          </div>
        ) : (
          /* Active Question View */
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--primary-gradient)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{exam.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مدة الامتحان: {exam.timeMinutes} دقيقة • درجة النجاح: {exam.passingMarks}/{exam.totalMarks}</span>
                </div>
              </div>

              <span className="badge badge-primary">
                السؤال {currentStep + 1} من {allExamQuestions.length}
              </span>
            </div>

            {/* Reading Comprehension Passage if available */}
            {exam.readingPassage && (
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.85rem' }}>
                  <BookOpen size={16} />
                  <span>{exam.readingPassage.title}</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0, direction: 'ltr', textAlign: 'left' }}>
                  "{exam.readingPassage.text}"
                </p>
              </div>
            )}

            {/* Current Question */}
            {currentQ && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line'
                }}>
                  {currentStep + 1}. {currentQ.question}
                </h4>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentQ.options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentQ.id] === optIdx;

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        style={{
                          padding: '1rem 1.25rem',
                          borderRadius: 'var(--radius-lg)',
                          border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--primary-900)' : 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                          fontWeight: isSelected ? 700 : 500,
                          direction: 'ltr',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid var(--primary-600)' : '2px solid var(--border-strong)',
                          background: '#FFFFFF',
                          flexShrink: 0
                        }} />
                        <span style={{ fontSize: '0.92rem' }}>{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex-between">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="btn btn-secondary"
                style={{ opacity: currentStep === 0 ? 0.5 : 1, gap: '6px' }}
              >
                <ArrowRight size={16} />
                <span>السابق</span>
              </button>

              {currentStep < allExamQuestions.length - 1 ? (
                <button
                  disabled={selectedAnswers[currentQ?.id] === undefined}
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  <span>التالي</span>
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <button
                  disabled={Object.keys(selectedAnswers).length < allExamQuestions.length}
                  onClick={handleFinishExam}
                  className="btn btn-success btn-lg"
                  style={{ gap: '6px' }}
                >
                  <span>تسليم الامتحان واحتساب الدرجة 🏆</span>
                  <CheckCircle2 size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
