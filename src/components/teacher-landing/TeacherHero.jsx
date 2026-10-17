import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { 
  Sparkles, Award, Trophy, Users, BookOpen, Key, 
  ArrowLeft, CheckCircle2, MessageCircle, Send, Play, Shield,
  RotateCw, FastForward, Film, Star, Zap
} from 'lucide-react';
import TeacherAvatar3D from '../common/TeacherAvatar3D';

export default function TeacherHero({ onNavigate, onOpenCodeModal }) {
  const { teacherProfile } = useTeacher();
  const targetSlotRef = useRef(null);

  // Dynamic Avatar Source with fallback sanitization
  const isOldDummyAvatar = !teacherProfile?.avatar || 
    typeof teacherProfile.avatar !== 'string' || 
    teacherProfile.avatar.includes('unsplash.com/photo-1560250097-0b93528c311a');
  const imageSource = isOldDummyAvatar ? './teacher-avatar.jpg' : teacherProfile.avatar;
  const teacherName = teacherProfile?.name || 'مستر مايكل شحاتة';
  const teacherTitle = teacherProfile?.title || 'Senior English Expert';
  const teacherSubtitle = teacherProfile?.subtitle || 'حاصل على شهادات تدريس دولية من Cambridge & Oxford University';

  // Cinematic Intro State: 'intro' (0-1.4s) | 'pullback' (1.4-2.6s) | 'complete' (>2.6s)
  const [introPhase, setIntroPhase] = useState(() => {
    // Check if reduced motion is requested or already shown in current tab session
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const alreadyPlayed = sessionStorage.getItem('ms_hero_cinematic_played');
      if (prefersReduced || alreadyPlayed === 'true') {
        return 'complete';
      }
      return 'intro';
    }
    return 'complete';
  });

  // Measured coordinates of the final destination card slot
  const [targetRect, setTargetRect] = useState(null);

  // Measure card position in viewport for shared-element FLIP transition
  const measureTarget = useCallback(() => {
    if (targetSlotRef.current) {
      const rect = targetSlotRef.current.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  }, []);

  // Measure on mount and handle responsive resize
  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

  // Handle sequence timeline
  useEffect(() => {
    if (introPhase === 'intro') {
      // Lock scrollbar during fullscreen intro
      document.body.style.overflow = 'hidden';

      // Measure target position right away
      measureTarget();

      // Trigger Camera Pullback at 1.4s
      const pullbackTimer = setTimeout(() => {
        measureTarget();
        setIntroPhase('pullback');
      }, 1400);

      // Complete handover at 2.6s
      const completeTimer = setTimeout(() => {
        setIntroPhase('complete');
        document.body.style.overflow = '';
        sessionStorage.setItem('ms_hero_cinematic_played', 'true');
      }, 2600);

      return () => {
        clearTimeout(pullbackTimer);
        clearTimeout(completeTimer);
        document.body.style.overflow = '';
      };
    } else if (introPhase === 'pullback') {
      const finishTimer = setTimeout(() => {
        setIntroPhase('complete');
        document.body.style.overflow = '';
        sessionStorage.setItem('ms_hero_cinematic_played', 'true');
      }, 1200);
      return () => clearTimeout(finishTimer);
    }
  }, [introPhase, measureTarget]);

  // Skip Intro Handler
  const handleSkipIntro = () => {
    setIntroPhase('complete');
    document.body.style.overflow = '';
    sessionStorage.setItem('ms_hero_cinematic_played', 'true');
  };

  // Replay Intro Handler
  const handleReplayIntro = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIntroPhase('intro');
  };

  const isIntroActive = introPhase === 'intro' || introPhase === 'pullback';

  return (
    <section 
      id="teacher-hero-section"
      style={{
        position: 'relative',
        padding: '3.5rem 0 4.5rem',
        background: 'radial-gradient(ellipse 85% 60% at 50% -10%, rgba(0, 82, 204, 0.22), transparent)',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}
    >
      <style>{`
        /* 3D Cinematic Intro & Shared Element Animations */
        @keyframes introCameraPush {
          0% {
            transform: perspective(1200px) translate3d(0, 0, -80px) rotateX(4deg) scale(0.94);
            opacity: 0;
            filter: blur(8px);
          }
          25% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: perspective(1200px) translate3d(0, 0, 20px) rotateX(1deg) scale(1.02);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes introGoldAuraPulse {
          0%, 100% {
            transform: scale(0.95);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.95;
          }
        }

        @keyframes introFloatingSymbol {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) rotate(6deg);
          }
        }

        @keyframes heroStaggerSlideUp {
          0% {
            opacity: 0;
            transform: translateY(28px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes badgePopIn {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(15px);
          }
          70% {
            transform: scale(1.08) translateY(-3px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Responsive Hero Grid */
        .teacher-hero-layout {
          display: grid;
          grid-template-columns: 1.2fr 0.85fr;
          gap: 3.5rem;
          alignItems: center;
        }

        @media (max-width: 992px) {
          .teacher-hero-layout {
            grid-template-columns: 1fr;
            gap: 2.5rem;
            text-align: center;
          }
          .teacher-hero-headline-desc {
            margin-left: auto;
            margin-right: auto;
          }
          .teacher-hero-cta-group {
            justify-content: center;
          }
          .teacher-hero-features-grid {
            text-align: right;
            max-width: 480px;
            margin: 0 auto;
          }
        }

        /* Elements Staggering Classes */
        .hero-elem-stagger-1 {
          animation: heroStaggerSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .hero-elem-stagger-2 {
          animation: heroStaggerSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }
        .hero-elem-stagger-3 {
          animation: heroStaggerSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }
        .hero-elem-stagger-4 {
          animation: heroStaggerSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
        }
        .hero-badge-stagger-1 {
          animation: badgePopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
        }
        .hero-badge-stagger-2 {
          animation: badgePopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.65s both;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. FULLSCREEN 3D CINEMATIC INTRO & SHARED ELEMENT CAMERA PULLBACK OVERLAY */}
      {/* ========================================================================= */}
      {isIntroActive && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 99999,
            pointerEvents: introPhase === 'intro' ? 'auto' : 'none',
            background: introPhase === 'intro'
              ? 'radial-gradient(ellipse 95% 85% at 50% 45%, #0F172A 0%, #030712 100%)'
              : 'transparent',
            transition: 'background 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          {/* Skip Intro Button */}
          <button
            onClick={handleSkipIntro}
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              zIndex: 100000,
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
              opacity: introPhase === 'intro' ? 1 : 0
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>تخطي المقدمة</span>
            <FastForward size={16} />
          </button>

          {/* Intro Ambient Golden Lighting & Cyber Grid Background */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              opacity: introPhase === 'intro' ? 1 : 0,
              transition: 'opacity 0.9s ease',
              pointerEvents: 'none'
            }}
          >
            {/* Deep Royal Oxford Navy & Crimson Ambient Backlight */}
            <div style={{
              position: 'absolute',
              width: '120vw',
              height: '120vh',
              top: '-10%',
              left: '-10%',
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 82, 204, 0.35) 0%, rgba(220, 38, 38, 0.15) 35%, transparent 70%)',
              filter: 'blur(60px)'
            }} />

            {/* Golden Core Glow */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '600px',
              height: '600px',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.15) 45%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(45px)',
              animation: 'introGoldAuraPulse 3.5s ease-in-out infinite'
            }} />

            {/* Floating 3D Educational & Mathematical Particles at Diverse Depths */}
            {[
              { text: 'The Master 👑', top: '15%', right: '12%', delay: '0s', size: '1rem', color: '#FDE68A' },
              { text: 'A+ 50/50 🎯', top: '25%', left: '10%', delay: '0.4s', size: '1.2rem', color: '#6EE7B7' },
              { text: 'Cambridge Certified 🇬🇧', bottom: '20%', right: '14%', delay: '0.8s', size: '0.95rem', color: '#93C5FD' },
              { text: 'Oxford Curriculum ✨', bottom: '22%', left: '12%', delay: '1.1s', size: '0.95rem', color: '#F472B6' },
              { text: 'Grammar Secrets ⚡', top: '48%', left: '6%', delay: '0.6s', size: '0.85rem', color: '#FBBF24' },
              { text: 'Speaking Lab 🎙️', top: '50%', right: '6%', delay: '0.9s', size: '0.85rem', color: '#A78BFA' }
            ].map((item, idx) => (
              <div 
                key={idx}
                style={{
                  position: 'absolute',
                  top: item.top,
                  left: item.left,
                  right: item.right,
                  bottom: item.bottom,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: item.color,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: item.size,
                  fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  animation: `introFloatingSymbol 4s ease-in-out infinite`,
                  animationDelay: item.delay,
                  whiteSpace: 'nowrap'
                }}
              >
                {item.text}
              </div>
            ))}
          </div>

          {/* Intro Luxury Header Text Over Teacher (Revealed in Phase 1, Fades in Phase 2) */}
          <div 
            style={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              zIndex: 100001,
              opacity: introPhase === 'intro' ? 1 : 0,
              transition: 'opacity 0.6s ease',
              pointerEvents: 'none'
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 18px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.6)',
              color: '#FCD34D',
              fontSize: '0.9rem',
              fontWeight: 800,
              marginBottom: '10px',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)'
            }}>
              <Trophy size={16} color="#F59E0B" />
              <span>المنصة التعليمية الرسمية لجمهورية مصر العربية</span>
            </div>
            <h2 style={{
              fontSize: 'clamp(1.6rem, 3.2vw, 2.6rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
              margin: 0,
              textShadow: '0 4px 20px rgba(0,0,0,0.8)'
            }}>
              {teacherName}
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#C7D2FE',
              marginTop: '4px',
              fontWeight: 600
            }}>
              {teacherTitle} • {teacherSubtitle}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* THE HERO 3D PORTRAIT: SINGLE CONTINUOUS SHARED-ELEMENT IN MOTION          */}
          {/* ========================================================================= */}
          <div
            style={{
              position: 'fixed',
              // Coordinates transition seamlessly from fullscreen viewport center to exact target slot
              top: introPhase === 'intro'
                ? '50%'
                : targetRect ? `${targetRect.top}px` : '50%',
              left: introPhase === 'intro'
                ? '50%'
                : targetRect ? `${targetRect.left}px` : '50%',
              width: introPhase === 'intro'
                ? 'min(86vw, 440px)'
                : targetRect ? `${targetRect.width}px` : 'min(86vw, 440px)',
              height: introPhase === 'intro'
                ? 'min(70vh, 520px)'
                : targetRect ? `${targetRect.height}px` : '480px',
              transform: introPhase === 'intro'
                ? 'translate(-50%, -46%) perspective(1200px) rotateX(1deg) rotateY(0deg) scale(1)'
                : 'translate(0, 0) perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)',
              transition: introPhase === 'pullback'
                ? 'all 1.15s cubic-bezier(0.16, 1, 0.3, 1)'
                : 'none',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: introPhase === 'intro'
                ? '0 35px 80px -15px rgba(0, 0, 0, 0.9), 0 0 60px rgba(245, 158, 11, 0.45), 0 0 100px rgba(0, 82, 204, 0.45)'
                : '0 25px 60px -15px rgba(0, 82, 204, 0.35)',
              border: introPhase === 'intro'
                ? '4px solid #F59E0B'
                : '4px solid rgba(0, 82, 204, 0.5)',
              background: 'linear-gradient(180deg, #0A192F 0%, #060B14 100%)',
              zIndex: 100002,
              animation: introPhase === 'intro' ? 'introCameraPush 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'none',
              transformOrigin: 'center center'
            }}
          >
            {/* The Authentic Teacher Photo */}
            <img
              src={imageSource}
              alt={teacherName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 18%',
                display: 'block',
                filter: introPhase === 'intro' ? 'contrast(1.08) brightness(1.05)' : 'contrast(1.03)',
                transition: 'filter 0.5s ease'
              }}
            />

            {/* Specular 3D Holographic Sheen during Intro */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 45%, rgba(245, 158, 11, 0.2) 80%, rgba(0, 82, 204, 0.25) 100%)',
                pointerEvents: 'none',
                mixBlendMode: 'overlay'
              }}
            />

            {/* Bottom Teacher Badge during Motion */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.5) 30%, transparent 65%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '1.5rem',
                color: 'white',
                opacity: introPhase === 'intro' ? 1 : 0.85,
                transition: 'opacity 0.4s ease'
              }}
            >
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: 'white' }}>
                    {teacherName}
                  </h3>
                  <span style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 800
                  }}>
                    {teacherTitle}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#C7D2FE', margin: 0 }}>
                  {teacherSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. THE HERO SECTION CONTENT (REVEALED IN PERFECTION AFTER CAMERA PULLBACK) */}
      {/* ========================================================================= */}
      <div className="container">
        <div className="teacher-hero-layout">
          
          {/* Right Column: Hero Content & Typography */}
          <div style={{
            opacity: introPhase === 'intro' ? 0 : 1,
            transition: 'opacity 0.6s ease'
          }}>
            {/* Master Official Badge */}
            <div 
              className={introPhase === 'complete' ? '' : 'hero-elem-stagger-1'}
              style={{
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
              }}
            >
              <Trophy size={16} color="#D97706" />
              <span>المنصة التعليمية الرسمية • ابتدائي وإعدادي وثانوي 🇬🇧</span>
            </div>

            {/* Main Headline */}
            <h1 
              className={introPhase === 'complete' ? '' : 'hero-elem-stagger-2'}
              style={{
                fontSize: 'clamp(2.4rem, 4.2vw, 3.6rem)',
                fontWeight: 900,
                lineHeight: '1.2',
                marginBottom: '1rem',
                letterSpacing: '-1px'
              }}
            >
              مع <span style={{
                background: 'linear-gradient(135deg, #0052CC 0%, #002B66 50%, #DC2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>{teacherName}</span>
              <br />
              الدرجة النهائية في الإنجليزي مضمونة 🎯
            </h1>

            <p 
              className={`teacher-hero-headline-desc ${introPhase === 'complete' ? '' : 'hero-elem-stagger-3'}`}
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                maxWidth: '580px'
              }}
            >
              المنصة التعليمية الرسمية لمستر مايكل شحاتة لطلاب المرحلة الابتدائية والإعدادية والثانوية: شرح مبسط ومنظم، فيديوهات تعليمية، تدريبات مكثفة، بنوك أسئلة، اختبارات دورية ومتابعة شاملة للطلاب.
            </p>

            {/* Main CTAs & Replay Intro Button */}
            <div 
              className={`teacher-hero-cta-group ${introPhase === 'complete' ? '' : 'hero-elem-stagger-4'}`}
              style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}
            >
              <button
                onClick={onOpenCodeModal}
                className="btn btn-primary btn-lg"
                style={{ gap: '10px', boxShadow: '0 8px 25px rgba(0, 82, 204, 0.4)' }}
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

              {/* Watch Cinematic Intro Button (allows user/teacher to replay anytime) */}
              <button
                onClick={handleReplayIntro}
                className="btn btn-sm"
                title="إعادة تشغيل المشهد السينمائي ثلاثي الأبعاد"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: '#D97706',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  alignSelf: 'center'
                }}
              >
                <Film size={15} />
                <span>عرض سينمائي 3D</span>
              </button>
            </div>

            {/* Quick 4 Feature Pills */}
            <div 
              className={`teacher-hero-features-grid ${introPhase === 'complete' ? '' : 'hero-elem-stagger-4'}`}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}
            >
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

          {/* Left Column: Designated Card Slot & Final Living 3D Avatar */}
          <div 
            ref={targetSlotRef}
            style={{ 
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto'
            }}
          >
            {/* The Living 3D Avatar - seamlessly revealed once intro completes */}
            <div style={{
              opacity: introPhase === 'complete' ? 1 : 0,
              transition: 'opacity 0.25s ease'
            }}>
              <TeacherAvatar3D
                src={teacherProfile?.avatar}
                name={teacherName}
                title={teacherTitle}
                subtitle={teacherSubtitle}
                height="480px"
                showControls={true}
                autoGestures={true}
              />
            </div>

            {/* Floating Metric 1: 50/50 Full Marks Badge */}
            <div 
              className={`card glass ${introPhase === 'complete' ? '' : 'hero-badge-stagger-1'}`} 
              style={{
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
                zIndex: 30,
                opacity: introPhase === 'intro' ? 0 : 1,
                transition: 'opacity 0.5s ease'
              }}
            >
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
            <div 
              className={`card glass ${introPhase === 'complete' ? '' : 'hero-badge-stagger-2'}`} 
              style={{
                position: 'absolute',
                bottom: '90px',
                left: '-20px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-xl)',
                borderRadius: 'var(--radius-lg)',
                zIndex: 30,
                opacity: introPhase === 'intro' ? 0 : 1,
                transition: 'opacity 0.5s ease'
              }}
            >
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
