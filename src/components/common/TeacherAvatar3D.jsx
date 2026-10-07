import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, Award, Shield, Zap, RotateCw, Hand, 
  Eye, Compass, Volume2, Flame, Star, Check 
} from 'lucide-react';

/**
 * TeacherAvatar3D - Interactive 3D Holographic Portrait
 * Transforms any teacher photo into a fully interactive 3D living character card.
 * Features:
 * - 3D Perspective Gyro/Tilt following mouse pointer & touch swipe
 * - Multi-layer Parallax Depth (Background Aura -> Photo -> Hologram Glare -> Floating 3D Badges)
 * - 5 Dynamic Animated Gestures (Welcome Bow/Wave, 360 Holographic Spin, Cyber Scan, Anti-Gravity Float, Aura Shield)
 * - Autonomous Breathing/Floating Idle Physics
 * - Auto-Motion cycler option
 * - Interactive gesture trigger buttons
 */
export default function TeacherAvatar3D({
  src,
  name = 'مستر مايكل شحاته',
  title = 'Senior English Expert',
  subtitle = 'حاصل على شهادات تدريس دولية من Cambridge & Oxford University',
  badgeText = 'The Master 👑',
  height = '480px',
  showControls = true,
  interactive = true,
  autoGestures = true
}) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [activeGesture, setActiveGesture] = useState(null); // 'wave', 'spin', 'scan', 'float', 'shield'
  const [speechText, setSpeechText] = useState(null);
  const [isAutoCycle, setIsAutoCycle] = useState(autoGestures);
  const [clickSparks, setClickSparks] = useState([]);
  const animTimeoutRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const autoCycleIntervalRef = useRef(null);

  // Fallback image if none provided
  const imageSource = src || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80';

  // Handle pointer tracking for 3D Tilt
  const handlePointerMove = useCallback((e) => {
    if (!interactive || activeGesture === 'spin') return;
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-18 to +18 degrees)
    const rotateY = ((x - centerX) / centerX) * 16;
    const rotateX = -((y - centerY) / centerY) * 16;

    // Calculate glare percentage
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.45 });
    setIsHovered(true);
  }, [interactive, activeGesture]);

  const handlePointerLeave = useCallback(() => {
    if (!interactive) return;
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  }, [interactive]);

  // Execute a specific 3D Gesture Motion
  const triggerGesture = useCallback((gestureType) => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    setActiveGesture(gestureType);

    // Dynamic Teacher Speech / Reaction on gesture
    const speeches = {
      wave: { text: `أهلاً بيك يا بطل في عالم الإنجليزي! جاهز للـ 50/50؟ 👋🎯`, duration: 4000 },
      spin: { text: `دوران هولوجرامي 3D بأعلى دقة تقنية! 🌀✨`, duration: 3500 },
      scan: { text: `جاري الفحص الذكي... مستوى الاستيعاب 100%! ⚡⚡`, duration: 3500 },
      float: { text: `انعدام جاذبية... رحلة التحليق للقمة بدأت! 🛸🌟`, duration: 4000 },
      shield: { text: `درع الهيبة والقوة... مع مستر مايكل لا خوف من الامتحان! 🛡️🔥`, duration: 4000 }
    };

    if (speeches[gestureType]) {
      setSpeechText(speeches[gestureType].text);
      speechTimeoutRef.current = setTimeout(() => {
        setSpeechText(null);
      }, speeches[gestureType].duration);
    }

    const duration = gestureType === 'spin' ? 1800 : gestureType === 'scan' ? 2400 : 2000;
    animTimeoutRef.current = setTimeout(() => {
      setActiveGesture(null);
    }, duration);
  }, []);

  // Handle click on the photo to trigger dynamic 3D reaction spark
  const handleCardClick = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSpark = { id: Date.now() + Math.random(), x, y };
    setClickSparks(prev => [...prev.slice(-4), newSpark]);

    setTimeout(() => {
      setClickSparks(prev => prev.filter(s => s.id !== newSpark.id));
    }, 900);

    // If no active gesture, trigger wave or pulse
    if (!activeGesture) {
      triggerGesture('wave');
    }
  };

  // Periodic subtle auto-gesture cycle
  useEffect(() => {
    if (!isAutoCycle) {
      if (autoCycleIntervalRef.current) clearInterval(autoCycleIntervalRef.current);
      return;
    }

    const gestures = ['wave', 'scan', 'float', 'shield', 'spin'];
    let idx = 0;

    autoCycleIntervalRef.current = setInterval(() => {
      if (!isHovered && !activeGesture) {
        triggerGesture(gestures[idx % gestures.length]);
        idx++;
      }
    }, 12000);

    return () => {
      if (autoCycleIntervalRef.current) clearInterval(autoCycleIntervalRef.current);
    };
  }, [isAutoCycle, isHovered, activeGesture, triggerGesture]);

  useEffect(() => {
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (autoCycleIntervalRef.current) clearInterval(autoCycleIntervalRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      <style>{`
        @keyframes avatarFloat3D {
          0%, 100% {
            transform: translateY(0px) rotateX(1deg) rotateY(-1deg);
          }
          50% {
            transform: translateY(-14px) rotateX(-2deg) rotateY(2deg);
          }
        }

        @keyframes avatarPulseRing {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.8;
          }
        }

        @keyframes avatarHoloScan {
          0% {
            top: 0%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @keyframes avatarSpin3D {
          0% {
            transform: perspective(1200px) rotateY(0deg) scale3d(1, 1, 1);
          }
          50% {
            transform: perspective(1200px) rotateY(180deg) scale3d(1.1, 1.1, 1.1);
          }
          100% {
            transform: perspective(1200px) rotateY(360deg) scale3d(1, 1, 1);
          }
        }

        @keyframes avatarWave3D {
          0% {
            transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);
          }
          20% {
            transform: perspective(1200px) rotateX(12deg) rotateY(-10deg) translateZ(35px) scale3d(1.04, 1.04, 1.04);
          }
          40% {
            transform: perspective(1200px) rotateX(8deg) rotateY(12deg) translateZ(35px) scale3d(1.04, 1.04, 1.04);
          }
          60% {
            transform: perspective(1200px) rotateX(12deg) rotateY(-8deg) translateZ(35px) scale3d(1.04, 1.04, 1.04);
          }
          80% {
            transform: perspective(1200px) rotateX(5deg) rotateY(5deg) translateZ(15px);
          }
          100% {
            transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);
          }
        }

        @keyframes avatarShieldPulse {
          0% {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(245, 158, 11, 0.2);
            border-color: rgba(245, 158, 11, 0.6);
          }
          50% {
            box-shadow: 0 0 50px rgba(245, 158, 11, 0.8), inset 0 0 40px rgba(245, 158, 11, 0.5);
            border-color: #FCD34D;
          }
          100% {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(245, 158, 11, 0.2);
            border-color: rgba(245, 158, 11, 0.6);
          }
        }

        @keyframes sparkBurst {
          0% {
            transform: scale(0.2) translate(-50%, -50%);
            opacity: 1;
          }
          100% {
            transform: scale(2.2) translate(-50%, -50%);
            opacity: 0;
          }
        }

        @keyframes rainbowSheen {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .avatar-3d-wrapper {
          perspective: 1200px;
          user-select: none;
          touch-action: pan-y;
        }

        .avatar-3d-card {
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
          will-change: transform;
        }

        .avatar-3d-idle {
          animation: avatarFloat3D 6s ease-in-out infinite;
        }

        .avatar-3d-gesture-wave {
          animation: avatarWave3D 2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .avatar-3d-gesture-spin {
          animation: avatarSpin3D 1.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .avatar-3d-gesture-shield {
          animation: avatarShieldPulse 2s ease-in-out;
        }

        .avatar-3d-btn-gesture {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(79, 70, 229, 0.25);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .avatar-3d-btn-gesture:hover {
          background: var(--primary-600);
          color: #FFFFFF;
          border-color: var(--primary-600);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
        }
        .avatar-3d-btn-gesture.active {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: #FFFFFF;
          border-color: #7C3AED;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
        }
      `}</style>

      {/* 3D Glowing Ambient Halo Background */}
      <div 
        style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.35) 0%, rgba(124, 58, 237, 0.2) 40%, transparent 70%)',
          borderRadius: '40px',
          filter: 'blur(28px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'avatarPulseRing 4s ease-in-out infinite'
        }}
      />

      {/* Speech / Greeting Floating Balloon */}
      {speechText && (
        <div style={{
          position: 'absolute',
          top: '-55px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#FFFFFF',
          padding: '8px 18px',
          borderRadius: '24px',
          fontSize: '0.85rem',
          fontWeight: 800,
          border: '2px solid #F59E0B',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35), 0 0 15px rgba(245, 158, 11, 0.5)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'avatarFloat3D 3s ease-in-out infinite'
        }}>
          <Sparkles size={16} color="#F59E0B" />
          <span>{speechText}</span>
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #F59E0B'
          }} />
        </div>
      )}

      {/* Main 3D Interactive Card Wrapper */}
      <div 
        className="avatar-3d-wrapper"
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerLeave}
      >
        <div
          ref={cardRef}
          onClick={handleCardClick}
          className={`avatar-3d-card ${
            activeGesture === 'wave' ? 'avatar-3d-gesture-wave' :
            activeGesture === 'spin' ? 'avatar-3d-gesture-spin' :
            activeGesture === 'shield' ? 'avatar-3d-gesture-shield' :
            isHovered ? '' : 'avatar-3d-idle'
          }`}
          style={{
            transform: activeGesture === 'spin' || activeGesture === 'wave'
              ? undefined
              : `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${isHovered ? 1.03 : 1}, ${isHovered ? 1.03 : 1}, 1)`,
            borderRadius: '28px',
            overflow: 'hidden',
            border: activeGesture === 'shield'
              ? '4px solid #F59E0B'
              : '4px solid rgba(124, 58, 237, 0.4)',
            boxShadow: isHovered
              ? '0 30px 70px -15px rgba(79, 70, 229, 0.5), 0 0 35px rgba(124, 58, 237, 0.3)'
              : '0 25px 60px -15px rgba(79, 70, 229, 0.35)',
            background: 'linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%)',
            height: height,
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          {/* Depth Layer 0: Teacher Photo */}
          <img
            src={imageSource}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: activeGesture === 'scan' ? 'contrast(1.15) brightness(1.08)' : 'contrast(1.03)',
              transform: 'translateZ(0px)',
              transition: 'filter 0.3s ease'
            }}
          />

          {/* Dynamic 3D Glare / Specular Lighting */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, ${glare.opacity}) 0%, rgba(255, 255, 255, 0) 65%)`,
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
              transform: 'translateZ(15px)',
              transition: 'opacity 0.2s ease'
            }}
          />

          {/* Holographic Rainbow Prismatic Edge Sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,0,128,0.12) 0%, rgba(0,255,255,0.12) 50%, rgba(255,215,0,0.15) 100%)',
              backgroundSize: '200% 200%',
              animation: 'rainbowSheen 6s ease infinite',
              opacity: isHovered || activeGesture ? 0.8 : 0.3,
              pointerEvents: 'none',
              mixBlendMode: 'color-dodge',
              transform: 'translateZ(20px)'
            }}
          />

          {/* Cyber Hologram Scanner Laser (Triggered on 'scan' gesture or hover) */}
          {(activeGesture === 'scan') && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, transparent 0%, #06B6D4 20%, #FFFFFF 50%, #06B6D4 80%, transparent 100%)',
                boxShadow: '0 0 15px #06B6D4, 0 0 30px #06B6D4',
                animation: 'avatarHoloScan 2.2s ease-in-out infinite',
                transform: 'translateZ(30px)',
                zIndex: 25,
                pointerEvents: 'none'
              }}
            >
              {/* Vertical Laser Glow Beam */}
              <div style={{
                position: 'absolute',
                top: '-35px',
                left: 0,
                right: 0,
                height: '70px',
                background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.25) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
            </div>
          )}

          {/* Interactive Click Spark Bursts */}
          {clickSparks.map(spark => (
            <div
              key={spark.id}
              style={{
                position: 'absolute',
                left: spark.x,
                top: spark.y,
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: '2px solid #F59E0B',
                boxShadow: '0 0 20px #F59E0B, inset 0 0 15px #F59E0B',
                pointerEvents: 'none',
                animation: 'sparkBurst 0.9s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
                zIndex: 35
              }}
            />
          ))}

          {/* Depth Layer 1: Top Floating 3D Badge */}
          <div
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              transform: 'translateZ(45px)',
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '9999px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#FDE68A',
              fontSize: '0.8rem',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
              zIndex: 20
            }}
          >
            <Sparkles size={14} color="#F59E0B" />
            <span>مجسم 3D تفاعلي</span>
          </div>

          {/* Depth Layer 2: Bottom Gradient & Teacher Information */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 35%, transparent 65%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '1.75rem',
              transform: 'translateZ(35px)',
              zIndex: 20
            }}
          >
            <div style={{ color: 'white', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, color: 'white', letterSpacing: '-0.5px' }}>
                  {name}
                </h3>
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)'
                }}>
                  {title}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#C7D2FE', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                {subtitle}
              </p>

              {/* 3D Motion Hint */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '0.72rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Compass size={13} color="#818CF8" /> حرك الماوس للميلان 3D
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hand size={13} color="#F59E0B" /> انقر لتفاعل الصورة
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 3D Gesture Controls Toolbar */}
      {showControls && (
        <div style={{
          marginTop: '1.25rem',
          padding: '0.85rem 1rem',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          borderRadius: '18px',
          border: '1px solid rgba(79, 70, 229, 0.15)',
          boxShadow: '0 8px 24px rgba(79, 70, 229, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#4F46E5" /> حركات ومؤثرات 3D الحية:
            </span>
            <button
              onClick={() => setIsAutoCycle(!isAutoCycle)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isAutoCycle ? '#059669' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="تشغيل الحركات تلقائياً كل بضع ثوانٍ"
            >
              <RotateCw size={12} className={isAutoCycle ? 'animate-spin' : ''} />
              <span>{isAutoCycle ? 'حركات تلقائية: نشط ✅' : 'حركات تلقائية: متوقف'}</span>
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              className={`avatar-3d-btn-gesture ${activeGesture === 'wave' ? 'active' : ''}`}
              onClick={() => triggerGesture('wave')}
            >
              <span>👋</span> <span>تحية وترحيب</span>
            </button>

            <button
              className={`avatar-3d-btn-gesture ${activeGesture === 'spin' ? 'active' : ''}`}
              onClick={() => triggerGesture('spin')}
            >
              <span>🌀</span> <span>دوران هولوجرامي</span>
            </button>

            <button
              className={`avatar-3d-btn-gesture ${activeGesture === 'scan' ? 'active' : ''}`}
              onClick={() => triggerGesture('scan')}
            >
              <span>⚡</span> <span>مسح ليزر AI</span>
            </button>

            <button
              className={`avatar-3d-btn-gesture ${activeGesture === 'shield' ? 'active' : ''}`}
              onClick={() => triggerGesture('shield')}
            >
              <span>🛡️</span> <span>درع الهيبة</span>
            </button>

            <button
              className={`avatar-3d-btn-gesture ${activeGesture === 'float' ? 'active' : ''}`}
              onClick={() => triggerGesture('float')}
            >
              <span>🛸</span> <span>طفو انعدام جاذبية</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
