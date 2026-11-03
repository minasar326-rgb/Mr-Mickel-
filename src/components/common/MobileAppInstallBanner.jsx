import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';

export default function MobileAppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Detect if running standalone (Installed PWA or Native Capacitor App)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Listen for Android/Desktop PWA install event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // If already running inside installed app or dismissed, hide banner
  if (isStandalone || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Fallback for browsers without direct prompt
      alert('لتثبيت التطبيق على هاتفك: اضغط على خيارات المتصفح (⋮ أو المشاركة) ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home screen) 📱');
    }
  };

  return (
    <>
      {/* Floating Mobile App Bar */}
      <div 
        style={{
          position: 'fixed',
          top: '42px',
          left: '12px',
          right: '12px',
          maxWidth: '460px',
          margin: '0 auto',
          zIndex: 1100,
          background: 'linear-gradient(135deg, rgba(19, 39, 30, 0.96) 0%, rgba(10, 23, 18, 0.98) 100%)',
          border: '1px solid rgba(197, 168, 128, 0.45)',
          borderRadius: '16px',
          padding: '10px 14px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          direction: 'rtl',
          animation: 'fadeInDown 0.4s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #C5A880 0%, #A67C52 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(166, 124, 82, 0.4)'
          }}>
            <Smartphone size={22} color="#0B1712" />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FCFBF7' }}>
              تطبيق مستر مايكل شحاتة 📱
            </div>
            <div style={{ fontSize: '0.74rem', color: '#E2D3BE', lineHeight: 1.2 }}>
              ثبّت التطبيق على جهازك لتجربة أسرع بدون متصفح
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #C5A880 0%, #A67C52 100%)',
              color: '#0B1712',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 12px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(166, 124, 82, 0.35)',
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={15} />
            <span>تثبيت</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
            aria-label="إغلاق التنبيه"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIosGuide && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          direction: 'rtl'
        }}>
          <div style={{
            background: '#0B1712',
            border: '1px solid #C5A880',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            padding: '1.5rem',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <button
              onClick={() => setShowIosGuide(false)}
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <Smartphone size={40} color="#C5A880" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>
              تثبيت التطبيق على آيفون (iOS)
            </h3>
            <p style={{ color: '#E2D3BE', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              اتبع الخطوات البسيطة التالية لإضافة التطبيق لشاشتك الرئيسية:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'right', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                <Share size={20} color="#38BDF8" />
                <span>1. اضغط على زر المشاركة (Share) في أسفل متصفح Safari</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                <PlusSquare size={20} color="#34D399" />
                <span>2. مرر لأسفل واختر "إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                <CheckCircle size={20} color="#F59E0B" />
                <span>3. اضغط على "إضافة" (Add) في الزاوية العلوية</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #C5A880, #A67C52)',
                color: '#0B1712',
                border: 'none',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              فهمت، حسناً 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
