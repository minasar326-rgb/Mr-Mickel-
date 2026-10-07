import React from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { 
  Sparkles, Award, Trophy, Users, BookOpen, Key, 
  ArrowLeft, CheckCircle2, MessageCircle, Send, Play, Shield 
} from 'lucide-react';
import TeacherAvatar3D from '../common/TeacherAvatar3D';

export default function TeacherHero({ onNavigate, onOpenCodeModal }) {
  const { teacherProfile } = useTeacher();

  return (
    <section style={{
      position: 'relative',
      padding: '3.5rem 0 4.5rem',
      background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79, 70, 229, 0.2), transparent)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.85fr',
          gap: '3.5rem',
          alignItems: 'center'
        }}>
          {/* Right Column: Hero Content */}
          <div className="animate-fade-in">
            {/* Master Official Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              color: '#92400E',
              border: '1px solid #FCD34D',
              fontSize: '0.88rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.15)'
            }}>
              <Trophy size={16} color="#D97706" />
              <span>المنصة التعليمية الرسمية • ابتدائي وإعدادي وثانوي 🇬🇧</span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(2.4rem, 4.2vw, 3.6rem)',
              fontWeight: 900,
              lineHeight: '1.2',
              marginBottom: '1rem',
              letterSpacing: '-1px'
            }}>
              مع <span style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>{teacherProfile?.name || 'مستر مايكل شحاتة'}</span>
              <br />
              الدرجة النهائية في الإنجليزي مضمونة 🎯
            </h1>

            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              maxWidth: '580px'
            }}>
              المنصة التعليمية الرسمية لمستر مايكل شحاتة لطلاب المرحلة الابتدائية والإعدادية والثانوية: شرح مبسط ومنظم، فيديوهات تعليمية، تدريبات مكثفة، بنوك أسئلة، اختبارات دورية ومتابعة شاملة للطلاب.
            </p>

            {/* Main CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <button
                onClick={onOpenCodeModal}
                className="btn btn-primary btn-lg"
                style={{ gap: '10px', boxShadow: '0 8px 25px rgba(79, 70, 229, 0.4)' }}
              >
                <Key size={20} />
                <span>شحن كود الحصة والبدء فوراً</span>
                <ArrowLeft size={18} />
              </button>

              <button
                onClick={() => onNavigate('stages')}
                className="btn btn-secondary btn-lg"
                style={{ gap: '8px' }}
              >
                <BookOpen size={20} />
                <span>استعراض الصفوف والمحاضرات</span>
              </button>
            </div>

            {/* Quick 4 Feature Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              {[
                'علامة مائية ذكية ضد تسريب الفيديوهات',
                'مذكرات The Master الملونة PDF',
                'بنك أسئلة وامتحانات إلكترونية أسبوعية',
                'معمل صوتي لتدريب النطق والـ Speaking'
              ].map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Left Column: Prestigious 3D Living Teacher Portrait */}
          <div style={{ position: 'relative' }}>
            <TeacherAvatar3D
              src={teacherProfile?.avatar}
              name={teacherProfile?.name || 'مستر مايكل شحاته'}
              title={teacherProfile?.title || 'Senior English Expert'}
              subtitle={teacherProfile?.subtitle || 'حاصل على شهادات تدريس دولية من Cambridge & Oxford University'}
              height="480px"
              showControls={true}
              autoGestures={true}
            />

            {/* Floating Metric 1: 50/50 Full Marks Badge */}
            <div className="card glass animate-fade-in" style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              zIndex: 30
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trophy size={24} />
              </div>
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'block' }}>+1,420 طالب</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الدرجة النهائية 50/50 في الثانوية</span>
              </div>
            </div>

            {/* Floating Metric 2: WhatsApp Hotline */}
            <div className="card glass animate-fade-in" style={{
              position: 'absolute',
              bottom: '90px',
              left: '-20px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 'var(--radius-lg)',
              zIndex: 30
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageCircle size={24} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>دعم ومتابعة أسبوعية</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>تقارير واتساب مباشرة لأولياء الأمور</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
