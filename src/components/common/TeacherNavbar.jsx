import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  BookOpen, Award, Key, Phone, MessageCircle, Sun, Moon, 
  User, LogOut, LayoutDashboard, ChevronDown, CheckCircle2, 
  Send, Sparkles, Bell, ShieldCheck, Flame, Video, Settings, Trash2, Edit, Lock, Menu, X
} from 'lucide-react';

export default function TeacherNavbar({ onNavigate, currentPage, onOpenCodeModal, onOpenTeacherLogin }) {
  const { currentUser, role, switchRole, logout, openAuthModal } = useAuth();
  const { teacherProfile, announcements } = useTeacher();
  const { isDark, toggleTheme } = useTheme();

  const isCurrentlyInAdmin = currentPage === 'teacher-admin';

  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTeacherAccess = () => {
    if (onOpenTeacherLogin) onOpenTeacherLogin();
  };

  const handleTeacherLogout = () => {
    switchRole('student');
    onNavigate('home');
  };

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.3s ease'
    }}>
      {/* Top Banner Announcement */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        color: 'white',
        padding: '0.4rem 1rem',
        fontSize: '0.82rem',
        fontWeight: 600,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Sparkles size={14} color="#FBBF24" />
        <span>أهلاً بكم في المنصة الرسمية لـ <strong>{teacherProfile?.name || 'مستر مايكل شحاته'}</strong> • الدفعة الذهبية 2026!</span>
      </div>

      {/* Main Bar */}
      <div className="container-wide" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
        gap: '1rem'
      }}>
        {/* Right Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div 
            onClick={() => onNavigate('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
              border: '2px solid #818CF8'
            }}>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', fontFamily: 'monospace' }}>MS</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
                  {teacherProfile?.name || 'مستر مايكل شحاته'}
                </span>
                <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                  The Master 🇬🇧
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
                منصة اللغة الإنجليزية والثانوية العامة
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="desktop-nav">
            <button 
              onClick={() => onNavigate('home')} 
              className={`btn ${currentPage === 'home' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.9rem' }}
            >
              الرئيسية
            </button>
            <button 
              onClick={() => onNavigate('stages')} 
              className={`btn ${currentPage === 'stages' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.9rem' }}
            >
              الصفوف الدراسية
            </button>
            <button 
              onClick={() => onNavigate('achievers')} 
              className={`btn ${currentPage === 'achievers' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.9rem' }}
            >
              🏆 لوحة أوائل المستر
            </button>
            <button 
              onClick={() => onNavigate('booklets')} 
              className={`btn ${currentPage === 'booklets' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.9rem' }}
            >
              المذكرات المطبوعة
            </button>
          </nav>
        </div>

        {/* Left Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Teacher Admin Access Button (Requires PIN Every Time) */}
          {isCurrentlyInAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                ⚙️ أنت الآن في لوحة المستر
              </span>
              <button
                onClick={handleTeacherLogout}
                className="btn btn-ghost btn-sm"
                style={{ color: '#EF4444', fontWeight: 700, gap: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                title="قفل لوحة التحكم والخروج"
              >
                <LogOut size={15} />
                <span>قفل وخروج 🔒</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleTeacherAccess}
              className="btn btn-ghost btn-sm"
              style={{
                gap: '6px',
                fontWeight: 800,
                color: 'var(--primary-600)',
                border: '1px solid var(--primary-400)',
                background: 'rgba(79, 70, 229, 0.08)'
              }}
              title="دخول المستر لإدارة المنصة"
            >
              <Lock size={15} />
              <span>دخول المستر 🔐</span>
            </button>
          )}

          {/* Redeem Code Button */}
          <button
            onClick={onOpenCodeModal}
            className="btn btn-ghost btn-sm"
            style={{
              gap: '6px',
              border: '1px solid var(--primary-300)',
              color: 'var(--primary-600)',
              fontWeight: 700
            }}
          >
            <Key size={15} />
            <span>شحن كود</span>
          </button>

          {/* Student Google Auth & Profile Button */}
          {currentUser && currentUser.uid && currentUser.uid !== 'teacher-admin' ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="btn btn-ghost btn-sm"
                style={{
                  gap: '8px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid #10B981',
                  background: 'rgba(16, 185, 129, 0.08)'
                }}
                title="الملف الشخصي وحسابي"
              >
                <img
                  src={currentUser.photoURL || currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.name}
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#065F46' }}>
                  {currentUser.name?.split(' ')[0] || 'حسابي'}
                </span>
                <ChevronDown size={14} color="#059669" />
              </button>

              {isUserMenuOpen && (
                <div 
                  className="card animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: '115%',
                    left: 0,
                    minWidth: '220px',
                    padding: '0.75rem',
                    zIndex: 220,
                    boxShadow: 'var(--shadow-xl)',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {currentUser.name}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.email}
                    </span>
                  </div>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onNavigate('student-portal'); }}
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', fontWeight: 700 }}
                  >
                    <User size={15} color="var(--primary-600)" />
                    <span>حسابي واشتراكاتي 🎓</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); logout(); onNavigate('home'); }}
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', color: '#EF4444', fontWeight: 700 }}
                  >
                    <LogOut size={15} />
                    <span>تسجيل الخروج 🚪</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal ? openAuthModal('login') : null}
              className="btn btn-sm"
              style={{
                gap: '8px',
                fontWeight: 800,
                background: '#FFFFFF',
                color: '#1F2937',
                border: '1.5px solid #D1D5DB',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="تسجيل الدخول باستخدام Google"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>دخول Google</span>
            </button>
          )}

          {/* Direct WhatsApp Button */}
          <a
            href={`https://wa.me/${(teacherProfile?.whatsappNumber || '+201012345678').replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success btn-sm"
            style={{ gap: '6px' }}
            title="تواصل مباشر مع المستر"
          >
            <MessageCircle size={16} />
            <span>واتساب المستر</span>
          </a>

          {/* Announcements Popover */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsAnnouncementsOpen(!isAnnouncementsOpen)}
              className="btn btn-ghost btn-icon-only"
              style={{ position: 'relative', borderRadius: '50%' }}
              title="تنبيهات المستر"
            >
              <Bell size={18} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444'
              }} />
            </button>

            {isAnnouncementsOpen && (
              <div 
                className="card animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '115%',
                  left: 0,
                  width: '320px',
                  padding: '1rem',
                  zIndex: 200,
                  boxShadow: 'var(--shadow-xl)'
                }}
              >
                <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>📢 تنبيهات {teacherProfile?.name || 'مستر مايكل شحاته'}</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(Array.isArray(announcements) ? announcements : []).map(ann => (
                    <div key={ann.id} style={{ padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                      <strong style={{ display: 'block', color: 'var(--primary-600)', marginBottom: '2px' }}>{ann.title}</strong>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.4' }}>{ann.content}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>{ann.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon-only"
            style={{ borderRadius: '50%' }}
            title="تبديل الوضع الليلي / الفاتح"
          >
            {isDark ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#6366F1" />}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-nav-toggle"
            aria-label="القائمة"
            title="القائمة"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="card animate-fade-in" style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          borderRadius: 0,
          padding: '1rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--bg-surface)'
        }}>
          <button 
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('home'); }} 
            className={`btn ${currentPage === 'home' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.92rem' }}
          >
            الرئيسية
          </button>
          <button 
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('stages'); }} 
            className={`btn ${currentPage === 'stages' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.92rem' }}
          >
            الصفوف الدراسية
          </button>
          <button 
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('achievers'); }} 
            className={`btn ${currentPage === 'achievers' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.92rem' }}
          >
            🏆 لوحة أوائل المستر
          </button>
          <button 
            onClick={() => { setIsMobileMenuOpen(false); onNavigate('booklets'); }} 
            className={`btn ${currentPage === 'booklets' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'flex-start', width: '100%', fontSize: '0.92rem' }}
          >
            المذكرات المطبوعة
          </button>
        </div>
      )}
    </header>
  );
}
