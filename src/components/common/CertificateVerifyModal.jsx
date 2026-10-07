import React, { useState } from 'react';
import { useCourses } from '../../context/CourseContext';
import { X, Search, ShieldCheck, CheckCircle2, AlertCircle, Award, Calendar, User, BookOpen } from 'lucide-react';

export default function CertificateVerifyModal({ isOpen, onClose }) {
  const { verifyCertificate, certificates } = useCourses();
  const [serialInput, setSerialInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    const cert = verifyCertificate(serialInput);
    setResult(cert);
    setSearched(true);
  };

  const handleTryDemo = (demoId) => {
    setSerialInput(demoId);
    const cert = verifyCertificate(demoId);
    setResult(cert);
    setSearched(true);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      padding: '1.5rem'
    }}>
      <div 
        className="card animate-fade-in"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '2rem',
          position: 'relative'
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--success-gradient)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>التحقق من صحة ومصداقية الشهادات</h3>
            <p style={{ fontSize: '0.82rem', margin: 0, color: 'var(--text-muted)' }}>
              أدخل الرقم التسلسلي المطبوع على الشهادة للتحقق الفوري من سجلات المنصة
            </p>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="مثال: MDRK-AI-9942-SA"
            value={serialInput}
            onChange={e => setSerialInput(e.target.value)}
            className="input-control"
            style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={18} />
            <span>تحقق</span>
          </button>
        </form>

        {/* Demo Quick Pick */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <span>جرب شهادة جاهزة:</span>
          <button
            type="button"
            onClick={() => handleTryDemo('MDRK-AI-9942-SA')}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '2px 8px',
              color: 'var(--primary-600)',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}
          >
            MDRK-AI-9942-SA
          </button>
        </div>

        {/* Result Container */}
        {searched && (
          <div>
            {result ? (
              <div 
                className="card animate-fade-in"
                style={{
                  padding: '1.25rem',
                  background: 'var(--success-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, marginBottom: '1rem' }}>
                  <CheckCircle2 size={20} />
                  <span>شهادة معتمدة وصحيحة ومسجلة في النظام الرسمي</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>اسم الطالب:</span>
                    <strong>{result.studentName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>الدرجة / التقدير:</span>
                    <strong>{result.grade || 'امتياز 100%'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>المسار التدريبي:</span>
                    <strong>{result.courseTitle}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>المدرب المشرف:</span>
                    <span>{result.instructorName}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>تاريخ الإصدار:</span>
                    <span>{result.issueDate}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="card animate-fade-in"
                style={{
                  padding: '1.25rem',
                  background: 'var(--error-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <AlertCircle size={24} color="var(--error)" />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--error)', fontSize: '0.95rem' }}>
                    لم يتم العثور على شهادة بهذا الرقم التسلسلي
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    يرجى التأكد من كتابة الرقم بدقة متضمناً الحروف والأرقام والفواصل.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
