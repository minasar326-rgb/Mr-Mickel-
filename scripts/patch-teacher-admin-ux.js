import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, '../src/components/teacher-admin/TeacherAdminCenter.jsx');

let code = fs.readFileSync(targetFile, 'utf8');

// 1. Add lastPublishedLecture state near top of component
code = code.replace(
  `  const [isSubmitting, setIsSubmitting] = useState(false);`,
  `  const [isSubmitting, setIsSubmitting] = useState(false);\n  const [lastPublishedLecture, setLastPublishedLecture] = useState(null);`
);

// 2. In handleUploadLecture: set lastPublishedLecture and setLectureStageFilter('all')
const oldPublishSuccess = `        console.log('[DEBUG] Calling uploadNewLecture with:', lecturePayload);
        await uploadNewLecture(lecturePayload);
        console.log('[DEBUG] uploadNewLecture finished successfully!');
        addToast('🎉 تم نشر المحاضرة بنجاح وتثبيتها لجميع طلاب المرحلة!', 'success', 6000);`;

const newPublishSuccess = `        console.log('[DEBUG] Calling uploadNewLecture with:', lecturePayload);
        await uploadNewLecture(lecturePayload);
        console.log('[DEBUG] uploadNewLecture finished successfully!');
        const savedInfo = {
          id: lecturePayload.id || \`lec-\${Date.now()}\`,
          title: lecturePayload.title,
          stageName: targetStage?.name || lecturePayload.stageName || 'المرحلة الدراسية',
          stageId: lecturePayload.stageId,
          duration: lecturePayload.duration,
          unitNumber: lecturePayload.unitNumber
        };
        setLastPublishedLecture(savedInfo);
        setLectureStageFilter('all');
        addToast('🎉 تم نشر المحاضرة بنجاح وتثبيتها لجميع طلاب المرحلة!', 'success', 6000);
        setTimeout(() => {
          const listEl = document.getElementById('published-lectures-container');
          if (listEl) listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 400);`;

code = code.replace(oldPublishSuccess, newPublishSuccess);

// 3. Render Success Banner above form
const successBanner = `              {/* Persistent High-Visibility Success Card */}
              {lastPublishedLecture && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
                  border: '2px solid #10B981',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎉</span>
                      <strong style={{ fontSize: '1.15rem', color: '#10B981' }}>تم حفظ ونشر المحاضرة بنجاح تام!</strong>
                      <span className="badge badge-success" style={{ fontWeight: 800 }}>محفوظة سحابياً ومثبتة للطلاب ✓</span>
                    </div>
                    <p style={{ margin: 0, color: '#E2E8F0', fontSize: '0.9rem' }}>
                      عنوان المحاضرة: <strong style={{ color: '#F8FAFC' }}>{lastPublishedLecture.title}</strong> | المرحلة: <strong>{lastPublishedLecture.stageName}</strong> | المدة: <strong>{lastPublishedLecture.duration}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('lecture-room', { lectureId: lastPublishedLecture.id })}
                      className="btn btn-primary"
                      style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800, padding: '0.6rem 1.25rem', gap: '8px' }}
                    >
                      <Play size={16} fill="white" />
                      <span>فتح ومعاينة المحاضرة الآن ▶️</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const listEl = document.getElementById('published-lectures-container');
                        if (listEl) listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="btn btn-secondary"
                      style={{ fontWeight: 700 }}
                    >
                      <span>عرض في القائمة بالأسفل ⬇️</span>
                    </button>
                  </div>
                </div>
              )}

              <form id="lecture-upload-studio-form"`;

code = code.replace(
  `              <form id="lecture-upload-studio-form"`,
  successBanner
);

// 4. Add id="published-lectures-container" to the card
code = code.replace(
  `            {/* Existing Lectures List with Delete */}\n            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>`,
  `            {/* Existing Lectures List with Delete */}\n            <div id="published-lectures-container" className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>`
);

// 5. Update lecture filter to use normalizeStageId and highlight newly published lecture
const oldFilterMap = `                {lectures
                  .filter(l => !l.isDeleted && (lectureStageFilter === 'all' ? true : l.stageId === lectureStageFilter))
                  .map(lec => (`;

const newFilterMap = `                {lectures
                  .filter(l => !l.isDeleted && (lectureStageFilter === 'all' ? true : (l.stageId === lectureStageFilter || normalizeStageId(l.stageId) === normalizeStageId(lectureStageFilter))))
                  .map(lec => {
                    const isJustPublished = lastPublishedLecture && lastPublishedLecture.id === lec.id;
                    return (`;

code = code.replace(oldFilterMap, newFilterMap);

// 6. Highlight card border and add badge if just published
const oldCardStyle = `                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}`;

const newCardStyle = `                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: isJustPublished ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      border: isJustPublished ? '2px solid #10B981' : '1px solid var(--border-subtle)',
                      boxShadow: isJustPublished ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}`;

code = code.replace(oldCardStyle, newCardStyle);

// 7. Add return closing bracket for map
const oldBadgeRow = `                          <span className="badge badge-primary">{lec.unitNumber}</span>`;
const newBadgeRow = `                          {isJustPublished && <span className="badge badge-success" style={{ fontWeight: 800 }}>✨ تم النشر للتو ومثبتة للطلاب</span>}\n                          <span className="badge badge-primary">{lec.unitNumber}</span>`;

code = code.replace(oldBadgeRow, newBadgeRow);

// Replace closing of map
code = code.replace(
  `                  </div>\n                  ))\n                }`,
  `                  </div>\n                  );\n                  })\n                }`
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('✅ TeacherAdminCenter.jsx UX patched successfully!');
