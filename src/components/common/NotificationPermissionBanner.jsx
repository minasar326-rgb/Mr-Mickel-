import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { isPushSupported, getNotificationPermission, requestNotificationPermission } from '../../services/pushNotificationService';

export default function NotificationPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    const dismissed = localStorage.getItem('ms_notifications_dismissed');
    const perm = getNotificationPermission();

    if (perm === 'default' && !dismissed) {
      // Delay slightly so student sees page first
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequest = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      setGranted(true);
      setTimeout(() => {
        setShowBanner(false);
      }, 2000);
    } else {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('ms_notifications_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '92%',
        maxWidth: '560px',
        background: 'linear-gradient(135deg, #1F4D3A 0%, #15382A 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4), 0 0 0 1.5px rgba(166, 124, 82, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'rgba(166, 124, 82, 0.25)',
          border: '1px solid rgba(166, 124, 82, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {granted ? <CheckCircle2 size={24} color="#34D399" /> : <Bell size={24} color="#FCD34D" />}
        </div>
        <div>
          <strong style={{ fontSize: '0.98rem', display: 'block', marginBottom: '2px', color: '#F4E8D3' }}>
            {granted ? 'تم تفعيل التنبيهات بنجاح 🎉' : 'تفعيل الإشعارات الخارجية الفورية 🔔'}
          </strong>
          <span style={{ fontSize: '0.8rem', color: '#E2D3BE', lineHeight: '1.4', display: 'block' }}>
            {granted 
              ? 'ستصلك إشعارات فورية بالمحاضرات الجديدة ومواعيد الامتحانات على جهازك.' 
              : 'فعّل التنبيهات لتصلك رسائل فورية فور نزول المحاضرات الجديدة وتذكيرات الامتحانات.'}
          </span>
        </div>
      </div>

      {!granted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleRequest}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #A67C52 0%, #8C643E 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            تفعيل الآن 🔔
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#D6CEBF',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="لاحقاً"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
