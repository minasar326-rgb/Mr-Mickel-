const fs = require('fs');

const filePath = 'src/components/teacher-admin/TeacherAdminCenter.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
const normalize = s => isCRLF ? s.replace(/\r?\n/g, '\r\n') : s.replace(/\r?\n/g, '\n');

// 1. In handleAddQuestionToBuilder
content = content.replace(
  normalize("      correctAnswer: type === 'multi' ? [0] : 0,\n      modelAnswer: (type === 'essay' || type === 'short_answer') ? '' : '',\n      points: type === 'essay' ? 5 : (type === 'short_answer' ? 4 : 2),"),
  normalize("      correctAnswer: type === 'multi' ? [0] : (type === 'short_answer' || type === 'essay') ? '' : 0,\n      modelAnswer: '',\n      points: type === 'essay' ? 5 : (type === 'short_answer' ? 5 : 2),")
);

// 2. In handleSaveExamFromBuilder
content = content.replace(
  normalize("    const objectiveQuestions = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi' || q.type === 'tf');\n    const subjectiveQuestions = bldExamQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer');"),
  normalize("    const objectiveQuestions = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi' || q.type === 'tf' || q.type === 'short_answer');\n    const subjectiveQuestions = bldExamQuestions.filter(q => q.type === 'essay');")
);

// 3. In handleOpenPreviewModal
content = content.replace(
  normalize("    const hasManualGrading = bldExamQuestions.some(q => q.type === 'essay' || q.type === 'short_answer');"),
  normalize("    const hasManualGrading = bldExamQuestions.some(q => q.type === 'essay');")
);

// 4. In handleSubmitLecture / handleSaveExistingLecture
content = content.replace(
  normalize("      const objectiveQuestions = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi' || q.type === 'tf');\n      const subjectiveQuestions = bldExamQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer');"),
  normalize("      const objectiveQuestions = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi' || q.type === 'tf' || q.type === 'short_answer');\n      const subjectiveQuestions = bldExamQuestions.filter(q => q.type === 'essay');")
);

// 5. Update badge and text for short_answer in the builder (first occurrence ~ line 2467)
content = content.replace(
  normalize("                                    q.type === 'essay' ? 'badge badge-gold' :\n                                    q.type === 'short_answer' ? 'badge badge-warning' :"),
  normalize("                                    q.type === 'essay' ? 'badge badge-gold' :\n                                    q.type === 'short_answer' ? 'badge badge-success' :")
);

content = content.replace(
  normalize("                                      q.type === 'essay' ? 'سؤال مقالي (تصحيح يدوي)' : 'إجابة قصيرة (تصحيح يدوي)'}"),
  normalize("                                      q.type === 'essay' ? 'سؤال مقالي (تصحيح يدوي)' : 'إجابة قصيرة (تصحيح تلقائي ⚡)'}")
);

content = content.replace(
  normalize("                                  {(q.type === 'essay' || q.type === 'short_answer') && (\n                                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-600)', fontWeight: 700 }}>\n                                      ⚠️ يتطلب تصحيح يدوي لفك القفل\n                                    </span>\n                                  )}"),
  normalize("                                  {q.type === 'essay' && (\n                                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-600)', fontWeight: 700 }}>\n                                      ⚠️ يتطلب تصحيح يدوي لفك القفل\n                                    </span>\n                                  )}")
);

// 6. Update Model Answer for Essay & Short Answer (first occurrence ~ line 2737)
const oldModelAnswerBlock = `                              {/* Model Answer for Essay & Short Answer */}
                              {(q.type === 'essay' || q.type === 'short_answer') && (
                                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px' }}>
                                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '4px' }}>
                                    نموذج الإجابة أو المعايير التي يقيس عليها المستر أثناء التصحيح اليدوي:
                                  </label>
                                  <textarea
                                    value={q.modelAnswer || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, modelAnswer: val } : item));
                                    }}
                                    placeholder="اكتب المعايير أو الإجابة النموذجية الاسترشادية لتسهيل تقييم إجابة الطالب..."
                                    className="input-control"
                                    style={{ height: '65px' }}
                                  />
                                </div>
                              )}`;

const newModelAnswerBlock = `                              {/* 1. Short Answer Auto-grading input */}
                              {q.type === 'short_answer' && (
                                <div style={{ background: 'rgba(31, 77, 58, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(31, 77, 58, 0.25)' }}>
                                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#1F4D3A', marginBottom: '4px' }}>
                                    ⚡ الإجابة الصحيحة للتصحيح التلقائي (اكتب الكلمة أو العبارة المتوقعة):
                                  </label>
                                  <input
                                    type="text"
                                    value={q.correctAnswer || q.modelAnswer || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, correctAnswer: val, modelAnswer: val } : item));
                                    }}
                                    placeholder="مثال: taller أو caught أو was (يمكن كتابة بدائل بفصلها بـ / مثل: was / were)"
                                    className="input-control"
                                    style={{ direction: 'ltr', textAlign: 'left', fontWeight: 700 }}
                                  />
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    💡 سيتم تصحيح إجابة الطالب تلقائياً واحتساب الدرجة فوراً بناءً على هذه الإجابة.
                                  </div>
                                </div>
                              )}

                              {/* 2. Essay Manual Grading guidelines */}
                              {q.type === 'essay' && (
                                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#D97706', marginBottom: '4px' }}>
                                    ✍️ نموذج الإجابة أو المعايير التي يقيس عليها المستر أثناء التصحيح اليدوي:
                                  </label>
                                  <textarea
                                    value={q.modelAnswer || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, modelAnswer: val } : item));
                                    }}
                                    placeholder="اكتب المعايير أو الإجابة النموذجية الاسترشادية لتسهيل تقييم إجابة الطالب..."
                                    className="input-control"
                                    style={{ height: '65px' }}
                                  />
                                </div>
                              )}`;

if (content.includes(normalize(oldModelAnswerBlock))) {
  content = content.replace(normalize(oldModelAnswerBlock), normalize(newModelAnswerBlock));
  console.log('✓ Successfully updated Model Answer block 1 in TeacherAdminCenter.jsx');
} else {
  console.log('Note: oldModelAnswerBlock 1 not found via exact match, checking normalized');
}

// 7. Update second builder occurrence (~ line 7850 - 8130)
content = content.replace(
  normalize("                        q.type === 'essay' ? 'badge badge-gold' :\n                        q.type === 'short_answer' ? 'badge badge-warning' :"),
  normalize("                        q.type === 'essay' ? 'badge badge-gold' :\n                        q.type === 'short_answer' ? 'badge badge-success' :")
);

content = content.replace(
  normalize("                          q.type === 'essay' ? 'سؤال مقالي (تصحيح يدوي)' : 'إجابة قصيرة (تصحيح يدوي)'}"),
  normalize("                          q.type === 'essay' ? 'سؤال مقالي (تصحيح يدوي)' : 'إجابة قصيرة (تصحيح تلقائي ⚡)'}")
);

content = content.replace(
  normalize("                      {(q.type === 'essay' || q.type === 'short_answer') && (\n                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-600)', fontWeight: 700 }}>\n                          ⚠️ يتطلب تصحيح يدوي لفك القفل\n                        </span>\n                      )}"),
  normalize("                      {q.type === 'essay' && (\n                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-600)', fontWeight: 700 }}>\n                          ⚠️ يتطلب تصحيح يدوي لفك القفل\n                        </span>\n                      )}")
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating TeacherAdminCenter.jsx');
