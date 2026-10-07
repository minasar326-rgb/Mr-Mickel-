import React, { useState } from 'react';
import { Search, Sparkles, ArrowLeft, Play, ShieldCheck, Award, Users, Star, Code2, BrainCircuit } from 'lucide-react';

export default function HeroSection({ onNavigate, onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onNavigate('courses', { query: searchTerm });
    }
  };

  return (
    <section style={{
      position: 'relative',
      padding: '4rem 0 5rem',
      overflow: 'hidden',
      background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79, 70, 229, 0.15), transparent)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.9fr',
          gap: '3.5rem',
          alignItems: 'center'
        }}>
          {/* Right Column: Hero Copy & Actions */}
          <div className="animate-fade-in">
            {/* Top Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-50)',
              color: 'var(--primary-700)',
              border: '1px solid var(--primary-200)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '1.5rem'
            }}>
              <Sparkles size={16} color="var(--primary-600)" />
              <span>الجيل الجديد من منصات التعلم الذكي 2026</span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(2.3rem, 4vw, 3.4rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: '1.25rem',
              letterSpacing: '-1px'
            }}>
              طوّر مهاراتك الرقمية مع <br />
              <span style={{
                background: 'var(--primary-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                أقوى مسارات التقنية والذكاء الاصطناعي
              </span>
            </h1>

            {/* Subheading */}
            <p style={{
              fontSize: '1.15rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              maxWidth: '560px'
            }}>
              انضم لأكثر من 64,000 متعلم عربي في مسارات تطبيقية مكثفة بإشراف نخبة من كبار مهندسي البرمجيات والذكاء الاصطناعي مع شهادات مهنية معتمدة.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 8px 6px 16px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
              maxWidth: '540px'
            }}>
              <Search size={20} color="var(--text-muted)" style={{ marginLeft: '10px' }} />
              <input
                type="text"
                placeholder="ما المهارة أو التقنية التي تريد إتقانها اليوم؟"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  flex: 1,
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem' }}>
                استكشف المسارات
              </button>
            </form>

            {/* Popular Search Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>الأكثر طلباً:</span>
              {['Next.js 15', 'هندسة الأوامر Prompt', 'Figma UI/UX', 'أمن سيبراني', 'Flutter 3'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onNavigate('courses', { query: tag })}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-full)',
                    padding: '3px 10px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary-400)';
                    e.currentTarget.style.color = 'var(--primary-600)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Left Column: Visual Showcase & Floating Metrics */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)'
            }}>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80"
                alt="Madarek Learning Environment"
                style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, transparent 60%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '1.5rem'
              }}>
                <div style={{ color: 'white' }}>
                  <span className="badge badge-success" style={{ marginBottom: '6px' }}>بث حي ومباشر الآن 🔴</span>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>ورشة بناء وكيل الذكاء الاصطناعي الذاتي</p>
                  <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>بإشراف د. سارة المنصور • 380 متدرب متواجد</span>
                </div>
              </div>
            </div>

            {/* Floating Card 1: Certificate Badge */}
            <div className="card glass animate-fade-in" style={{
              position: 'absolute',
              top: '-20px',
              right: '-25px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>شهادات احترافية</span>
                <strong style={{ fontSize: '0.9rem' }}>معتمدة وموثقة برقم تسلسلي</strong>
              </div>
            </div>

            {/* Floating Card 2: Student Rating */}
            <div className="card glass animate-fade-in" style={{
              position: 'absolute',
              bottom: '-25px',
              left: '-20px',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'var(--shadow-lg)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Star size={22} fill="#10B981" />
              </div>
              <div>
                <strong style={{ fontSize: '1rem', display: 'block' }}>4.9 / 5.0</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>تقييم من +15,000 خريج</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
