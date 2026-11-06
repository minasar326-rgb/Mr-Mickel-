import React, { useState, useRef } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  FileText, Upload, Trash2, CheckCircle2, FileUp, 
  Image, ExternalLink, BookOpen, Download
} from 'lucide-react';
import { uploadFileToR2 } from '../../../services/r2Storage';

export default function BookletsSection() {
  const { booklets = [], addBooklet, deleteBooklet, stages = [], addToast } = useTeacher();
  const { activeStageId } = useAdminUI();

  const [title, setTitle] = useState('');
  const [pages, setPages] = useState('45 صفحة');
  const [stageId, setStageId] = useState(activeStageId !== 'all' ? activeStageId : (stages[0]?.id || 'sec-3'));
  const [coverPreview, setCoverPreview] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileSize, setPdfFileSize] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handlePdfChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfFile(file);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setPdfFileSize(`${sizeMB} MB`);
    setIsUploading(true);
    addToast(`جاري رفع وتأمين مذكرة "${file.name}" سحابياً... ⏳`, 'info');

    try {
      const res = await uploadFileToR2(file, 'booklets', null, 'pdf');
      if (res && res.downloadUrl) {
        setDownloadUrl(res.downloadUrl);
        addToast('✅ تم رفع المذكرة بنجاح وجاهزة للنشر!', 'success');
      }
    } catch (err) {
      console.warn('Booklet upload error:', err);
      addToast('⚠️ تعذر استكمال الرفع السحابي للمذكرة. يرجى المحاولة لاحقاً.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverPreview(event.target.result);
      addToast('تم تحديث غلاف المذكرة 🖼️', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('يرجى كتابة عنوان المذكرة', 'error');
      return;
    }

    const newBk = {
      id: `bk-${Date.now()}`,
      title: title.trim(),
      pages: pages.trim() || '30 صفحة',
      stageId,
      cover: coverPreview,
      fileSize: pdfFileSize || '5.5 MB',
      downloadUrl: downloadUrl || '',
      url: downloadUrl || '',
      createdAt: new Date().toISOString()
    };

    addBooklet(newBk);
    addToast(`تم نشر مذكرة "${newBk.title}" بنجاح 📚`, 'success');

    setTitle('');
    setPdfFile(null);
    setDownloadUrl('');
    setPdfFileSize('');
  };

  const filteredBooklets = booklets.filter(b => {
    if (activeStageId !== 'all' && b.stageId && b.stageId !== activeStageId) return false;
    return true;
  });

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Upload New Booklet Card */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
              إضافة ورفع مذكرة PDF جديدة من جهازك 📚
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
              ارفع مذكرات The Master وملفات المراجعة النهائية لتكون متاحة للطلاب
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            
            {/* File Upload Button */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                ملف المذكرة (PDF):
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={handlePdfChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="admin-btn admin-btn-secondary"
                style={{ width: '100%', height: '44px', justifyContent: 'center', gap: '8px', border: downloadUrl ? '1px solid #10B981' : undefined }}
              >
                <FileUp size={18} />
                <span>
                  {isUploading ? 'جاري الرفع السحابي... ⏳' : pdfFile ? `${pdfFile.name} (${pdfFileSize})` : 'اختر ملف PDF من جهازك'}
                </span>
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                عنوان المذكرة:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: مذكرة شرح وقواعد Unit 1 & 2"
                className="admin-input"
                style={{ width: '100%', height: '44px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                المرحلة الدراسية:
              </label>
              <select
                value={stageId}
                onChange={e => setStageId(e.target.value)}
                className="admin-input"
                style={{ width: '100%', height: '44px' }}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                عدد الصفحات:
              </label>
              <input
                type="text"
                value={pages}
                onChange={e => setPages(e.target.value)}
                placeholder="مثال: 45 صفحة"
                className="admin-input"
                style={{ width: '100%', height: '44px' }}
              />
            </div>
          </div>

          {downloadUrl && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '8px', color: '#065F46', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>تم رفع المذكرة بنجاح إلى Cloudflare R2! اضغط على زر النشر لإتاحتها للطلاب.</span>
            </div>
          )}

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ height: '46px', alignSelf: 'flex-start', minWidth: '180px', fontWeight: 900 }}
          >
            حفظ ونشر المذكرة 📚
          </button>
        </form>
      </div>

      {/* Booklets Directory */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--admin-text)' }}>
          المذكرات المنشورة ({filteredBooklets.length})
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredBooklets.map(bk => (
            <div
              key={bk.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'var(--admin-bg-subtle)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)', display: 'block' }}>{bk.title}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{bk.pages} • {bk.fileSize || '5.5 MB'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {bk.downloadUrl && (
                  <a
                    href={bk.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    title="تحميل المذكرة"
                  >
                    <Download size={14} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من حذف مذكرة "${bk.title}"؟`)) {
                      deleteBooklet(bk.id);
                      addToast('تم حذف المذكرة 🗑️', 'info');
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
    </div>
  );
}
