import React from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Download, FileText, CheckCircle2, Sparkles, Eye, ShieldCheck } from 'lucide-react';

export default function BookletShowcase() {
  const { booklets, teacherProfile } = useTeacher();
  const { addToast } = useToast();

  return (
    <section style={{ padding: '4.5rem 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            fontSize: '0.85rem',
            fontWeight: 800,
            marginBottom: '0.75rem'
          }}>
            <BookOpen size={16} color="var(--primary-600)" />
            <span>المكتبة الرقمية والمذكرات المطبوعة</span>
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.75rem' }}>
            سلسلة مذكرات {teacherProfile?.name || 'مستر مايكل شحاته'} المعتمدة 📖
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            أقوى مذكرات وملازم شرح وتدريبات ملونة مصممة بعناية فائقة لتغنيك عن أي كتاب خارجي
          </p>
        </div>

        {/* Booklets Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {(Array.isArray(booklets) ? booklets : []).map((booklet) => (
            <div
              key={booklet.id}
              className="card"
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-surface)'
              }}
            >
              {/* Cover Preview Image */}
              <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                <img
                  src={booklet.cover}
                  alt={booklet.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="badge badge-gold" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  {booklet.badge || 'PDF عالي الجودة'}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px', lineHeight: '1.5' }}>
                    {booklet.title}
                  </h3>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span>📄 {booklet.pages}</span>
                    <span>💾 {booklet.size}</span>
                    <span>✓ {booklet.format}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {booklet.downloadUrl && booklet.downloadUrl !== '#' ? (
                    <a
                      href={booklet.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`${booklet.title || 'مذكرة-شرح'}.pdf`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, gap: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => addToast(`جاري فتح وتحميل (${booklet.title})...`, 'success')}
                    >
                      <Download size={16} />
                      <span>تحميل المذكرة PDF</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => addToast(`المذكرة متوفرة في السنتر أو سيتم رفع الرابط قريباً من لوحة المستر`, 'info')}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, gap: '6px' }}
                    >
                      <Download size={16} />
                      <span>تحميل المذكرة PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
