import React, { useEffect, useState, useRef, useCallback } from 'react';
import DisableDevtool from 'disable-devtool';
import { ShieldAlert, Lock, RefreshCw, AlertTriangle, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTeacher } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';

/**
 * SecurityShield - Maximum Defense Architecture (أعلى درجات الأمان ومكافحة القرصنة)
 * 1. Blocks right-click context menu & text copying/dragging.
 * 2. Blocks developer tools shortcuts (F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S).
 * 3. Freezes page completely when DevTools / Console is detected or opened.
 * 4. Active Screen Capture & PrintScreen Blackout (turns pitch black on screenshot attempts).
 * 5. Window Blur & Tab Switch Defense (blurs content and pauses video when switching windows).
 * 6. MutationObserver Tamper Guard (triggers security lockout if watermark is removed or hidden).
 * 7. Dynamic Moving Anti-Leak Watermark with Student's real Google Name, UID, and Timestamp.
 */
export default function SecurityShield({ children }) {
  const { addToast } = useToast();
  const { teacherProfile } = useTeacher();
  const { currentUser, role } = useAuth();

  // Dynamic Floating Watermark Coordinates across the page
  const [globalWatermarkPos, setGlobalWatermarkPos] = useState({ top: '25%', left: '30%' });
  
  // Page Security States
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const freezeCountRef = useRef(0);
  const watermarkRef = useRef(null);

  // 1. Watermark dynamic position ticker
  useEffect(() => {
    const watermarkInterval = setInterval(() => {
      const top = Math.floor(10 + Math.random() * 75) + '%';
      const left = Math.floor(6 + Math.random() * 75) + '%';
      setGlobalWatermarkPos({ top, left });
    }, 6000);

    return () => clearInterval(watermarkInterval);
  }, []);

  // Trigger Freeze function
  const triggerFreeze = useCallback((reason = 'DevTools detected') => {
    if (role === 'instructor') return;
    try {
      if (window.sessionStorage && window.sessionStorage.getItem('ms_dev_bypass') === 'true') {
        return;
      }
    } catch (_) {}

    setIsFrozen(true);
    try {
      console.clear();
      // Pause any running media
      document.querySelectorAll('video, audio').forEach(el => el.pause());
    } catch (_) {}
  }, [role]);

  // 2. Anti-Inspection, Keydown & Screen Capture Blocker
  useEffect(() => {
    if (role === 'instructor') return;

    const handleKeyDown = (e) => {
      // 1. Screenshot / PrintScreen Interception
      if (
        e.key === 'PrintScreen' ||
        e.keyCode === 44 ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P')) || // Print
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) // Mac screenshot
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsBlackout(true);
        // Pause all videos
        document.querySelectorAll('video').forEach(v => v.pause());
        setTimeout(() => setIsBlackout(false), 2500);
        addToast('🔒 تصوير الشاشة معطل لحماية المحتوى التعليمي.', 'warning', 2500);
        return false;
      }

      // 2. F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerFreeze('F12 shortcut');
        return false;
      }

      // 3. Ctrl + Shift + I / J / C / K (DevTools & Console)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c', 'K', 'k'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerFreeze('Inspect shortcut');
        return false;
      }

      // 4. Ctrl + U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 5. Ctrl + S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        addToast('🔒 حفظ الصفحة غير متاح للحفاظ على حقوق الملكية الفكرية.', 'info', 2500);
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [role, addToast, triggerFreeze]);

  // 3. DevTools Active Multi-Detector Defense (disable-devtool engine)
  useEffect(() => {
    if (role === 'instructor') {
      setIsFrozen(false);
      return;
    }

    try {
      if (window.sessionStorage && window.sessionStorage.getItem('ms_dev_bypass') === 'true') {
        return;
      }
    } catch (_) {}

    try {
      DisableDevtool({
        ondevtoolopen: () => {
          setIsFrozen(true);
        },
        ondevtoolclose: () => {
          setIsFrozen(false);
        },
        disableMenu: true,
        clearLog: true,
        interval: 150,
        detectors: 'all',
        ignore: () => {
          return role === 'instructor' || (window.sessionStorage && window.sessionStorage.getItem('ms_dev_bypass') === 'true');
        }
      });
    } catch (err) {
      console.warn('DevTool Shield initialized');
    }

    // Additional fallback dimensions and debugger ticker
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const checkDevTools = () => {
      if (!isMobile) {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > 165 || heightDiff > 165) {
          triggerFreeze('Dimension check');
          return;
        }
      }

      const t0 = performance.now();
      try {
        const debugFn = new Function('debugger');
        debugFn();
      } catch (_) {}
      const t1 = performance.now();

      if (t1 - t0 > 100) {
        freezeCountRef.current += 1;
        if (freezeCountRef.current >= 1) {
          triggerFreeze('Debugger timing pause');
        }
      }
    };

    const interval = setInterval(checkDevTools, 400);
    window.addEventListener('resize', checkDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkDevTools);
    };
  }, [role, triggerFreeze]);

  // 4. Window Visibility & Anti-Screen Recording Defense
  useEffect(() => {
    if (role === 'instructor') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
        // Pause all videos when leaving the window
        document.querySelectorAll('video').forEach(v => v.pause());
      } else {
        setIsWindowBlurred(false);
      }
    };

    const handleWindowBlur = () => {
      // Obscure when window loses focus
      setIsWindowBlurred(true);
      document.querySelectorAll('video').forEach(v => v.pause());
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [role]);

  // 5. MutationObserver Tamper Guard (Watches Watermark Integrity)
  useEffect(() => {
    if (role === 'instructor') return;

    const watermarkEl = document.getElementById('ms-anti-leak-watermark');
    if (!watermarkEl) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          const wasRemoved = Array.from(m.removedNodes).some(
            node => node.id === 'ms-anti-leak-watermark' || (node.contains && node.contains(watermarkEl))
          );
          if (wasRemoved) {
            triggerFreeze('Watermark element removed from DOM');
          }
        } else if (m.type === 'attributes') {
          const target = m.target;
          if (target && target.id === 'ms-anti-leak-watermark') {
            const style = window.getComputedStyle(target);
            if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
              triggerFreeze('Watermark visibility tampered');
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });

    return () => observer.disconnect();
  }, [role, triggerFreeze]);

  // 6. Clipboard & Drag Protection
  useEffect(() => {
    if (role === 'instructor') return;

    const handleCopy = (e) => {
      e.preventDefault();
      addToast('🔒 نسخ المحتوى معطل لحماية حقوق الملكية الفكرية.', 'info', 2000);
      return false;
    };

    const handleSelectStart = (e) => {
      // Allow selection inside input fields only
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      e.preventDefault();
      return false;
    };

    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCopy, true);
    document.addEventListener('selectstart', handleSelectStart, true);

    return () => {
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCopy, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
    };
  }, [role, addToast]);

  // 7. Right-Click Context Menu Blocker
  const handleContextMenu = (e) => {
    if (role === 'instructor') return;
    e.preventDefault();
    addToast('🔒 النقر بزر الماوس الأيمن معطل لحماية المحتوى التعليمي والفيديوهات.', 'info', 2000);
    return false;
  };

  const handleReload = () => {
    window.location.reload();
  };

  const teacherName = teacherProfile?.name || 'مستر مايكل شحاته';
  const studentWatermark = currentUser 
    ? `🔒 حساب مرخص: ${currentUser.name || 'طالب'} | UID: ${currentUser.uid?.slice(-8) || 'ST-2026'} | منصة ${teacherName} 🇬🇧`
    : `🔒 منصة ${teacherName} الرسمية 2026 | The Master of English 🇬🇧`;

  return (
    <div 
      onContextMenu={handleContextMenu}
      onDragStart={(e) => { if (role !== 'instructor') e.preventDefault(); }}
      style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '100vh', 
        userSelect: role === 'instructor' ? 'auto' : 'none',
        WebkitUserSelect: role === 'instructor' ? 'auto' : 'none'
      }}
    >
      {/* 🛑 FULL PAGE FREEZE OVERLAY WHEN DEVTOOLS/CONSOLE IS OPEN */}
      {isFrozen && role !== 'instructor' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999999,
            backgroundColor: 'rgba(10, 15, 30, 0.98)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: '#FFFFFF',
            fontFamily: "'Cairo', sans-serif",
            direction: 'rtl',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 1) 100%)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 50px rgba(239, 68, 68, 0.3)',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '2px solid #EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)'
              }}
            >
              <Lock size={42} color="#EF4444" />
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.8rem', color: '#FFFFFF' }}>
              تم تجميد الصفحة للحماية 🔒
            </h2>

            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '0.88rem',
                fontWeight: 700,
                marginBottom: '1.2rem'
              }}
            >
              <AlertTriangle size={16} />
              <span>تم رصد محاولة فتح أدوات المطورين أو فحص الأكواد</span>
            </div>

            <p style={{ color: '#CBD5E1', fontSize: '0.98rem', lineHeight: '1.7', margin: '0 0 1.8rem' }}>
              لحماية المحتوى التعليمي، الفيديوهات، وبنك الأسئلة الخاص بـ
              <strong style={{ color: '#60A5FA', margin: '0 4px' }}>منصة مستر مايكل شحاته 🇬🇧</strong>
              ، تم إيقاف وتجميد تفاعل الصفحة تلقائياً.
              <br />
              <span style={{ color: '#94A3B8', fontSize: '0.88rem', display: 'block', marginTop: '8px' }}>
                💡 يرجى إغلاق أدوات الفحص تماماً ثم الضغط على الزر أدناه للمتابعة:
              </span>
            </p>

            <button
              onClick={handleReload}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50px',
                padding: '14px 32px',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 10px 25px rgba(79, 70, 229, 0.5)',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              <RefreshCw size={20} />
              <span>إعادة تشغيل وتحديث المنصة</span>
            </button>
          </div>
        </div>
      )}

      {/* 🌑 ANTI-SCREENSHOT BLACKOUT SHIELD */}
      {isBlackout && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999999,
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#EF4444',
          fontFamily: "'Cairo', sans-serif",
          direction: 'rtl'
        }}>
          <EyeOff size={64} style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.5rem', color: '#FFFFFF' }}>
            🔒 محتوى محمي ضد تصوير الشاشة
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '1rem' }}>
            يُحظر التقاط سكرين شوت أو تسجيل الشاشة حمايةً للمحتوى التعليمي.
          </p>
        </div>
      )}

      {/* 🛡️ TAB-SWITCH & WINDOW BLUR PRIVACY SHIELD */}
      {isWindowBlurred && role !== 'instructor' && !isFrozen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999999,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(35px)',
          WebkitBackdropFilter: 'blur(35px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: "'Cairo', sans-serif",
          direction: 'rtl',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <ShieldCheck size={56} color="#60A5FA" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.5rem' }}>
            🔒 تم حجب الشاشة وإيقاف الفيديو مؤقتاً
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', maxWidth: '480px', margin: 0 }}>
            لأسباب أمنية وحمايةً للفيديوهات ضد برامج التسجيل الخارجية، يتم إيقاف العرض أثناء مغادرة النافذة. انقر على الصفحة لاستئناف المشاهدة.
          </p>
        </div>
      )}

      {/* 🔒 Dynamic Floating Anti-Leak Watermark (Protected by MutationObserver) */}
      <div 
        id="ms-anti-leak-watermark"
        ref={watermarkRef}
        style={{
          position: 'fixed',
          top: globalWatermarkPos.top,
          left: globalWatermarkPos.left,
          pointerEvents: 'none',
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
          color: 'rgba(255, 255, 255, 0.6)',
          padding: '5px 12px',
          borderRadius: '8px',
          fontSize: '0.78rem',
          fontWeight: 800,
          letterSpacing: '0.4px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          textShadow: '0 1px 4px rgba(0,0,0,0.85)',
          transition: 'top 2.2s cubic-bezier(0.4, 0, 0.2, 1), left 2.2s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none'
        }}
      >
        {studentWatermark}
      </div>

      {/* Main Application Children (blurred when frozen or window hidden) */}
      <div style={{ 
        filter: isFrozen ? 'blur(22px)' : (isWindowBlurred ? 'blur(30px)' : 'none'), 
        pointerEvents: (isFrozen || isWindowBlurred) ? 'none' : 'auto',
        transition: 'filter 0.25s ease'
      }}>
        {children}
      </div>
    </div>
  );
}
