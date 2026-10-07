import React, { useRef } from 'react';
import { X, Award, Printer, Share2, Download, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function CertificateModal({ isOpen, onClose, certificate }) {
  const { addToast } = useToast();
  const certRef = useRef(null);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://madarek.edu.sa/verify/${certificate.id}`);
      addToast('تم نسخ رابط توثيق الشهادة إلى الحافظة! 📋', 'success');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(6px)',
      padding: '1.5rem',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* Top Control Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={22} color="#F59E0B" />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>شهادة إتمام معتمدة</span>
            <span className="badge badge-success">موثقة رسمياً</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              <Printer size={16} />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button onClick={handleShare} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              <Share2 size={16} />
              <span>مشاركة الرابط</span>
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-icon-only" style={{ borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div
          ref={certRef}
          id="printable-certificate"
          style={{
            background: '#FFFFFF',
            color: '#0F172A',
            padding: '3.5rem 3rem',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '12px double #D97706',
            position: 'relative',
            textAlign: 'center',
            fontFamily: 'Cairo, sans-serif'
          }}
        >
          {/* Subtle Background Pattern Accent */}
          <div style={{
            position: 'absolute',
            inset: '12px',
            border: '2px solid #FCD34D',
            pointerEvents: 'none',
            borderRadius: '8px'
          }} />

          {/* Platform Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Award size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E1B4B', margin: 0 }}>مَنَصَّة مَدَارِك التَّعْلِيمِيَّة</h2>
              <span style={{ fontSize: '0.78rem', color: '#6B7280', letterSpacing: '1px' }}>MADAREK ACADEMY FOR DIGITAL EXCELLENCE</span>
            </div>
          </div>

          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: '#B45309',
            margin: '0.5rem 0 1rem',
            letterSpacing: '-0.5px'
          }}>
            شَهَادَةُ إِتْمَامٍ وَتَفَوُّق
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#4B5563', margin: '0 0 1rem' }}>
            تشهد إدارة منصة مدارك بأن الطالب / المتدرب:
          </p>

          {/* Student Name */}
          <div style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            color: '#4338CA',
            padding: '0.5rem 0',
            borderBottom: '2px dashed #CBD5E1',
            maxWidth: '500px',
            margin: '0 auto 1.5rem',
            fontFamily: 'Cairo, Tajawal, serif'
          }}>
            {certificate.studentName}
          </div>

          <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto 2rem' }}>
            قد أتم بنجاح متطلبات المسار التدريبي المكثف والتطبيقات العملية لمسار:
            <br />
            <strong style={{ fontSize: '1.35rem', color: '#0F172A', display: 'block', margin: '0.5rem 0' }}>
              « {certificate.courseTitle} »
            </strong>
            بمعدل تقييم <strong>{certificate.grade || 'امتياز 100%'}</strong> وبإجمالي ساعات تدريبية <strong>{certificate.hours || '30 ساعة'}</strong>.
          </p>

          {/* Signatures & Seal Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            alignItems: 'center',
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #E2E8F0'
          }}>
            {/* Instructor Signature */}
            <div>
              <span style={{ fontSize: '0.85rem', color: '#6B7280', display: 'block', marginBottom: '8px' }}>توقيع المدرب المعتمد</span>
              <div style={{ fontStyle: 'italic', fontFamily: 'serif', fontSize: '1.25rem', fontWeight: 700, color: '#1E293B' }}>
                {certificate.instructorName}
              </div>
            </div>

            {/* Official Gold Seal Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)',
                border: '3px solid #FEF3C7'
              }}>
                <ShieldCheck size={38} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E' }}>الختم الرقمي الرسمي</span>
            </div>

            {/* Serial & QR Verification */}
            <div>
              <span style={{ fontSize: '0.85rem', color: '#6B7280', display: 'block', marginBottom: '4px' }}>تاريخ الإصدار: {certificate.issueDate}</span>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#4F46E5',
                background: '#EEF2FF',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                {certificate.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
