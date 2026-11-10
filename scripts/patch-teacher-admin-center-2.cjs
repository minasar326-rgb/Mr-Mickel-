const fs = require('fs');

const filePath = 'src/components/teacher-admin/TeacherAdminCenter.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
const normalize = s => isCRLF ? s.replace(/\r?\n/g, '\r\n') : s.replace(/\r?\n/g, '\n');

const oldBlock = `                    {/* Model Answer for Essay & Short Answer */}
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

const newBlock = `                    {/* 1. Short Answer Auto-grading input */}
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

if (content.includes(normalize(oldBlock))) {
  content = content.replace(normalize(oldBlock), normalize(newBlock));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Successfully updated Model Answer block 2 in TeacherAdminCenter.jsx');
} else {
  console.error('✗ Failed to find oldBlock 2');
}
