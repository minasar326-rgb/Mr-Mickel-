import React from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { Award, Printer, X, CheckCircle2, QrCode, Shield, Sparkles } from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, studentData, examScore = '50 / 50' }) {
  const { teacherProfile } = useTeacher();
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const studentName = studentData?.name || currentUser?.name || 'سعد القحطاني';
  const studentCode = studentData?.code || 'MS-SEC3-101';
  const stageName = studentData?.stageName || 'الصف الثالث الثانوي (Thanaweya Amma)';
  const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      padding: '1rem'
    }}>
      <div style={{
        maxWidth: '780px',
        width: '100%',
        background: '#FFFFFF',
        color: '#0F172A',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>

        {/* Printable Certificate Canvas */}
        <div id="printable-certificate" style={{
          padding: '3rem 3.5rem',
          border: '12px double #D97706',
          margin: '12px',
          borderRadius: '12px',
          background: 'radial-gradient(ellipse at center, #FFFBEB 0%, #FFFFFF 100%)',
          position: 'relative',
          textAlign: 'center'
        }}>
          {/* Top Royal Seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '0.75rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)'
            }}>
              <Award size={32} />
            </div>
          </div>

          <span style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#B45309',
            textTransform: 'uppercase'
          }}>
            MR. MICHAEL SHEHATA ACADEMY OF ENGLISH 🇬🇧
          </span>

          <h2 style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            color: '#1E1B4B',
            margin: '6px 0 10px',
            letterSpacing: '-0.5px'
          }}>
            شهادة تفوق واجتياز رسمي معتمدة
          </h2>

          <p style={{ fontSize: '1rem', color: '#64748B', margin: '0 0 1.5rem' }}>
            CERTIFICATE OF EXCELLENCE & MASTERY IN ADVANCED ENGLISH
          </p>

          <div style={{
            height: '2px',
            width: '180px',
            background: 'linear-gradient(to right, transparent, #F59E0B, transparent)',
            margin: '0 auto 1.5rem'
          }} />

          <p style={{ fontSize: '1.05rem', color: '#334155', margin: '0 0 0.5rem' }}>
            تشهد إدارة الأكاديمية تحت إشراف <strong>{teacherProfile?.name || 'مستر مايكل شحاته'}</strong> بأن الطالب:
          </p>

          <h3 style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#4F46E5',
            margin: '0.5rem 0',
            borderBottom: '2px dashed #CBD5E1',
            display: 'inline-block',
            padding: '0 2rem 6px'
          }}>
            {studentName}
          </h3>

          <p style={{ fontSize: '0.95rem', color: '#475569', margin: '1rem 0 1.5rem', lineHeight: '1.8' }}>
            قد اجتاز بنجاح واقتدار كافة متطلبات الدورة المكثفة والامتحانات الشهرية في مادة اللغة الإنجليزية لـ
            <br />
            <strong>({stageName})</strong> بتقدير عام: 
            <span style={{ color: '#059669', fontWeight: 900, fontSize: '1.15rem', marginRight: '6px' }}>
              امتياز مع مرتبة الشرف ({examScore}) 🌟
            </span>
          </p>

          {/* Footer of the Certificate */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            alignItems: 'flex-end',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #E2E8F0',
            fontSize: '0.85rem'
          }}>
            {/* Left: QR Verification */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '6px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '4px' }}>
                <QrCode size={48} color="#1E1B4B" />
              </div>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B' }}>
                كود التحقق الرقمي: <strong>{studentCode}</strong>
              </span>
            </div>

            {/* Center: Official Stamp */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                border: '3px dashed #D97706',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B45309',
                fontWeight: 900,
                fontSize: '0.72rem',
                transform: 'rotate(-8deg)'
              }}>
                <span>ختم الاعتماد</span>
                <span>The Master</span>
                <span>★ 2026 ★</span>
              </div>
            </div>

            {/* Right: Teacher Signature */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: '4px' }}>
                المشرف العام والمعلم المعتمد:
              </span>
              <strong style={{ fontSize: '1.05rem', color: '#1E1B4B', display: 'block', fontFamily: 'serif' }}>
                {teacherProfile?.name || 'مستر مايكل شحاته'}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Cambridge CELTA Certified
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'block', marginTop: '4px' }}>
                تاريخ الإصدار: {dateStr}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div style={{
          padding: '1rem 2rem',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
            <CheckCircle2 size={18} />
            <span>شهادة أصلية موثقة ومحمية برمز QR</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ gap: '6px', fontWeight: 800 }}
            >
              <Printer size={16} />
              <span>🖨️ طباعة الشهادة / حفظ PDF</span>
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
