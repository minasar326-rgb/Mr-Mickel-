import React, { useState } from 'react';
import { useCourses } from '../../context/CourseContext';
import { X, CheckCircle2, AlertCircle, HelpCircle, Trophy, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuizRunner({ isOpen, onClose, courseId, lessonId, quizData }) {
  const { submitQuizScore } = useCourses();

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  if (!isOpen || !quizData) return null;

  const questions = quizData.questions || [];
  const currentQuestion = questions[currentQuestionIdx];

  const handleSelectOption = (optionIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIdx
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const passed = scorePct >= (quizData.passingScore || 70);

    const res = {
      scorePct,
      correctCount,
      totalCount: questions.length,
      passed
    };

    setScoreResult(res);
    setIsSubmitted(true);
    submitQuizScore(courseId, lessonId, scorePct, passed);

    if (passed) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScoreResult(null);
    setCurrentQuestionIdx(0);
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
          maxWidth: '680px',
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

        {isSubmitted && scoreResult ? (
          /* Results View */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: scoreResult.passed ? 'var(--success-bg)' : 'var(--error-bg)',
              color: scoreResult.passed ? 'var(--success)' : 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: scoreResult.passed ? '0 0 30px rgba(16, 185, 129, 0.4)' : 'none'
            }}>
              {scoreResult.passed ? <Trophy size={42} /> : <AlertCircle size={42} />}
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {scoreResult.passed ? 'تهانينا! لقد اجتزت الاختبار بنجاح 🎉' : 'لم توفق في اجتياز الاختبار هذه المرة'}
            </h3>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              درجتك: <strong style={{ color: scoreResult.passed ? 'var(--success)' : 'var(--error)', fontSize: '1.4rem' }}>{scoreResult.scorePct}%</strong> ({scoreResult.correctCount} من أصل {scoreResult.totalCount} إجابة صحيحة)
            </p>

            {/* Questions Review Breakdown */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                مراجعة الإجابات والشرح التفصيلي:
              </h4>

              {questions.map((q, idx) => {
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
                        <p style={{ margin: '2px 0', color: 'var(--success)', fontWeight: 600 }}>
                          الإجابة الصحيحة: {q.options[q.correctAnswer]}
                        </p>
                      )}
                      <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem', background: 'rgba(255, 255, 255, 0.5)', padding: '6px 10px', borderRadius: '6px' }}>
                        💡 <strong>الشرح:</strong> {q.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={handleRestart} className="btn btn-secondary" style={{ gap: '6px' }}>
                <RotateCcw size={16} />
                <span>إعادة الاختبار</span>
              </button>
              <button onClick={onClose} className="btn btn-primary">
                متابعة الدروس في قاعة الدراسة
              </button>
            </div>
          </div>
        ) : (
          /* Active Question View */
          <div>
            {/* Quiz Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{quizData.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>درجة الاجتياز: {quizData.passingScore}%</span>
                </div>
              </div>

              <span className="badge badge-primary">
                السؤال {currentQuestionIdx + 1} من {questions.length}
              </span>
            </div>

            {/* Question Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`,
                height: '100%',
                background: 'var(--primary-gradient)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  {currentQuestionIdx + 1}. {currentQuestion.question}
                </h4>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === optIdx;

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
                          fontWeight: isSelected ? 700 : 500
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid var(--primary-600)' : '2px solid var(--border-strong)',
                          background: '#FFFFFF',
                          flexShrink: 0
                        }} />
                        <span style={{ fontSize: '0.95rem' }}>{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex-between">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                className="btn btn-secondary"
                style={{ opacity: currentQuestionIdx === 0 ? 0.5 : 1, gap: '6px' }}
              >
                <ArrowRight size={16} />
                <span>السابق</span>
              </button>

              {currentQuestionIdx < questions.length - 1 ? (
                <button
                  disabled={selectedAnswers[currentQuestion?.id] === undefined}
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="btn btn-primary"
                  style={{ gap: '6px' }}
                >
                  <span>التالي</span>
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <button
                  disabled={Object.keys(selectedAnswers).length < questions.length}
                  onClick={calculateScore}
                  className="btn btn-success btn-lg"
                  style={{ gap: '6px' }}
                >
                  <span>تسليم الاختبار واحتساب النتيجة</span>
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
