import React from 'react';
import { Home, GraduationCap, FileCheck2, KeyRound, Crown, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';

export default function MobileBottomNav({ currentPage, onNavigate, onOpenCodeModal, onOpenTeacherLogin }) {
  const { role, currentUser } = useAuth();
  const { announcements } = useTeacher();
  const isTeacher = role === 'instructor';
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const isMob = 
        (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ||
        (typeof window !== 'undefined' && window.screen && window.screen.width < 1024) ||
        (typeof window !== 'undefined' && window.innerWidth < 1024);
      setIsMobile(Boolean(isMob));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  const unreadCount = Array.isArray(announcements) 
    ? announcements.filter(a => !a.isArchived).length 
    : 0;

  const handleTabClick = (page) => {
    if (page === 'code') {
      if (onOpenCodeModal) onOpenCodeModal();
      return;
    }
    if (page === 'teacher') {
      if (isTeacher) {
        onNavigate('teacher-admin');
      } else {
        if (onOpenTeacherLogin) onOpenTeacherLogin();
      }
      return;
    }
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'stages', label: 'المراحل', icon: GraduationCap },
    { id: 'comprehensive-exams', label: 'الامتحانات', icon: FileCheck2 },
    { id: 'code', label: 'شحن كود', icon: KeyRound, isAction: true },
    { id: 'teacher', label: isTeacher ? 'لوحة المستر' : 'دخول المستر', icon: isTeacher ? Crown : Crown, highlight: isTeacher }
  ];

  return (
    <nav 
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1050,
        background: 'rgba(10, 23, 18, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(166, 124, 82, 0.35)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0.45rem 0.25rem calc(0.45rem + env(safe-area-inset-bottom, 0px))',
        direction: 'rtl',
        userSelect: 'none'
      }}
      aria-label="شريط التنقل السفلي للتطبيق"
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = (item.id === currentPage) || 
          (item.id === 'teacher' && currentPage === 'teacher-admin');

        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 4px',
              color: isActive ? '#C5A880' : '#94A3B8',
              transition: 'all 0.2s ease',
              position: 'relative',
              outline: 'none'
            }}
          >
            {/* Active Indicator Pip */}
            {isActive && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                width: '18px',
                height: '3px',
                borderRadius: '3px',
                background: 'linear-gradient(90deg, #C5A880, #F59E0B)',
                boxShadow: '0 0 10px #C5A880'
              }} />
            )}

            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: isActive 
                ? 'rgba(197, 168, 128, 0.16)' 
                : item.highlight 
                ? 'rgba(245, 158, 11, 0.12)' 
                : 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <IconComponent 
                size={20} 
                color={isActive ? '#F59E0B' : item.highlight ? '#F59E0B' : '#94A3B8'} 
              />
            </div>

            <span style={{
              fontSize: '0.74rem',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? '#FCFBF7' : '#94A3B8',
              letterSpacing: '-0.2px'
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
