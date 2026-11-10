const fs = require('fs');

const filePath = 'src/components/teacher-admin/sections/LecturesSection.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

const qTextLineIdx = lines.findIndex(l => l.includes('value={q.questionText}') && l.includes('onChange'));
let targetLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('value={q.questionText}') && lines[i+1] && lines[i+1].includes('handleUpdateQuestion(q.id, \'questionText\'')) {
    targetLineIdx = i - 3; // <input is 3 lines before
    break;
  }
}

console.log('targetLineIdx:', targetLineIdx);

if (targetLineIdx !== -1) {
  let endIdx = -1;
  for (let i = targetLineIdx; i < targetLineIdx + 60; i++) {
    if (lines[i].trim() === ')}' && lines[i-1].includes('</div>')) {
      endIdx = i;
      break;
    }
  }
  console.log('endIdx:', endIdx);

  if (endIdx !== -1) {
    const replacement = [
      '                      <div style={{ display: \'flex\', gap: \'8px\', alignItems: \'center\' }}>',
      '                        <input',
      '                          type="text"',
      '                          placeholder="نص السؤال..."',
      '                          value={q.questionText || q.question || \'\'}',
      '                          onChange={e => handleUpdateQuestion(q.id, \'questionText\', e.target.value)}',
      '                          className="admin-input"',
      '                          style={{ flex: 1, fontSize: \'0.9rem\', fontWeight: 700 }}',
      '                        />',
      '                        <div style={{ display: \'flex\', alignItems: \'center\', gap: \'4px\' }}>',
      '                          <span style={{ fontSize: \'0.78rem\', fontWeight: 700, color: \'var(--admin-text-muted)\' }}>الدرجة:</span>',
      '                          <input',
      '                            type="number"',
      '                            min="1"',
      '                            max="50"',
      '                            value={q.points || 5}',
      '                            onChange={e => handleUpdateQuestion(q.id, \'points\', Number(e.target.value))}',
      '                            className="admin-input"',
      '                            style={{ width: \'60px\', textAlign: \'center\', fontWeight: 800, padding: \'4px\' }}',
      '                          />',
      '                        </div>',
      '                      </div>',
      '',
      '                      {/* 1. MCQ Options */}',
      '                      {q.type === \'mcq\' && (',
      '                        <div style={{ display: \'grid\', gridTemplateColumns: \'repeat(auto-fit, minmax(200px, 1fr))\', gap: \'8px\' }}>',
      '                          {q.options.map((opt, oIdx) => (',
      '                            <div key={oIdx} style={{ display: \'flex\', alignItems: \'center\', gap: \'6px\' }}>',
      '                              <input',
      '                                type="radio"',
      '                                name={`correct-${q.id}`}',
      '                                checked={Number(q.correctAnswer) === oIdx}',
      '                                onChange={() => handleUpdateQuestion(q.id, \'correctAnswer\', oIdx)}',
      '                                title="تحديد كإجابة صحيحة"',
      '                              />',
      '                              <input',
      '                                type="text"',
      '                                placeholder={`اختيار ${oIdx + 1}`}',
      '                                value={opt}',
      '                                onChange={e => {',
      '                                  const newOpts = [...q.options];',
      '                                  newOpts[oIdx] = e.target.value;',
      '                                  handleUpdateQuestion(q.id, \'options\', newOpts);',
      '                                }}',
      '                                className="admin-input"',
      '                                style={{ width: \'100%\', fontSize: \'0.82rem\' }}',
      '                              />',
      '                            </div>',
      '                          ))}',
      '                        </div>',
      '                      )}',
      '',
      '                      {/* 2. True / False Options */}',
      '                      {q.type === \'tf\' && (',
      '                        <div style={{ display: \'flex\', gap: \'16px\', alignItems: \'center\', background: \'var(--admin-bg)\', padding: \'8px 12px\', borderRadius: \'8px\' }}>',
      '                          <span style={{ fontSize: \'0.82rem\', fontWeight: 700 }}>الإجابة الصحيحة:</span>',
      '                          <label style={{ display: \'flex\', alignItems: \'center\', gap: \'6px\', cursor: \'pointer\', fontSize: \'0.85rem\', fontWeight: 700 }}>',
      '                            <input',
      '                              type="radio"',
      '                              name={`tf-${q.id}`}',
      '                              checked={Number(q.correctAnswer) === 0}',
      '                              onChange={() => handleUpdateQuestion(q.id, \'correctAnswer\', 0)}',
      '                            />',
      '                            <span>صحيح (True) ✓</span>',
      '                          </label>',
      '                          <label style={{ display: \'flex\', alignItems: \'center\', gap: \'6px\', cursor: \'pointer\', fontSize: \'0.85rem\', fontWeight: 700 }}>',
      '                            <input',
      '                              type="radio"',
      '                              name={`tf-${q.id}`}',
      '                              checked={Number(q.correctAnswer) === 1}',
      '                              onChange={() => handleUpdateQuestion(q.id, \'correctAnswer\', 1)}',
      '                            />',
      '                            <span>خطأ (False) ✗</span>',
      '                          </label>',
      '                        </div>',
      '                      )}',
      '',
      '                      {/* 3. Short Answer (Auto-graded) */}',
      '                      {q.type === \'short_answer\' && (',
      '                        <div style={{ background: \'rgba(31, 77, 58, 0.05)\', padding: \'10px 12px\', borderRadius: \'8px\', border: \'1px solid rgba(31, 77, 58, 0.2)\' }}>',
      '                          <label style={{ display: \'block\', fontSize: \'0.82rem\', fontWeight: 800, color: \'var(--admin-primary)\', marginBottom: \'4px\' }}>',
      '                            ⚡ الإجابة الصحيحة للتصحيح التلقائي (اكتب الكلمة أو العبارة المتوقعة):',
      '                          </label>',
      '                          <input',
      '                            type="text"',
      '                            placeholder="مثال: taller أو caught أو was (يمكن كتابة بدائل بفصلها بـ / مثل: was / were)"',
      '                            value={q.correctAnswer || q.modelAnswer || \'\'}',
      '                            onChange={e => {',
      '                              handleUpdateQuestion(q.id, \'correctAnswer\', e.target.value);',
      '                              handleUpdateQuestion(q.id, \'modelAnswer\', e.target.value);',
      '                            }}',
      '                            className="admin-input"',
      '                            style={{ width: \'100%\', fontSize: \'0.88rem\', fontWeight: 700, direction: \'ltr\', textAlign: \'left\' }}',
      '                          />',
      '                        </div>',
      '                      )}',
      '',
      '                      {/* 4. Essay (Manual Grading) */}',
      '                      {q.type === \'essay\' && (',
      '                        <div style={{ background: \'rgba(245, 158, 11, 0.05)\', padding: \'10px 12px\', borderRadius: \'8px\', border: \'1px solid rgba(245, 158, 11, 0.2)\' }}>',
      '                          <label style={{ display: \'block\', fontSize: \'0.82rem\', fontWeight: 800, color: \'#D97706\', marginBottom: \'4px\' }}>',
      '                            ✍️ نموذج الإجابة الاسترشادي للمستر أثناء التصحيح اليدوي:',
      '                          </label>',
      '                          <textarea',
      '                            rows={2}',
      '                            placeholder="اكتب المعايير أو الإجابة النموذجية..."',
      '                            value={q.modelAnswer || \'\'}',
      '                            onChange={e => handleUpdateQuestion(q.id, \'modelAnswer\', e.target.value)}',
      '                            className="admin-input"',
      '                            style={{ width: \'100%\', fontSize: \'0.85rem\' }}',
      '                          />',
      '                        </div>',
      '                      )}',
      '',
      '                      {/* Question Explanation */}',
      '                      <div>',
      '                        <input',
      '                          type="text"',
      '                          placeholder="شرح وتوضيح الإجابة للطالب (يظهر بعد إعلان النتيجة)..."',
      '                          value={q.explanation || \'\'}',
      '                          onChange={e => handleUpdateQuestion(q.id, \'explanation\', e.target.value)}',
      '                          className="admin-input"',
      '                          style={{ width: \'100%\', fontSize: \'0.8rem\', color: \'var(--admin-text-muted)\' }}',
      '                        />',
      '                      </div>'
    ];

    lines.splice(targetLineIdx, endIdx - targetLineIdx + 1, ...replacement);
    const updatedContent = lines.join(isCRLF ? '\r\n' : '\n');
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log('✓ Successfully spliced question card into LecturesSection.jsx!');
  }
}
