import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeacherProvider, useTeacher } from './context/TeacherContext';

// Common Components
import TeacherNavbar from './components/common/TeacherNavbar';
import TeacherLoginModal from './components/auth/TeacherLoginModal';
import CodeRedeemModal from './components/student/CodeRedeemModal';
import AuthModal from './components/auth/AuthModal';

// Landing & Stage Components
import TeacherHero from './components/teacher-landing/TeacherHero';
import StageSection from './components/teacher-landing/StageSection';
import AchieversLeaderboard from './components/teacher-landing/AchieversLeaderboard';
import BookletShowcase from './components/teacher-landing/BookletShowcase';

// Student Components
import StageLecturesPage from './components/stages/StageLecturesPage';
import LecturePlayerRoom from './components/student/LecturePlayerRoom';
import StudentPortal from './components/student/StudentPortal';

// Teacher Management Component
import TeacherAdminCenter from './components/teacher-admin/TeacherAdminCenter';

// Security Shield & Anti-Piracy Suite
import SecurityShield from './components/common/SecurityShield';
import ErrorBoundary from './components/common/ErrorBoundary';

function AppContent() {
  const { role, switchRole } = useAuth();
  const { teacherProfile } = useTeacher();

  // Parse current URL hash cleanly with no stale sessionStorage override on back
  const parseRoute = (customHash = null) => {
    try {
      const rawHash = customHash !== null ? customHash : window.location.hash;
      const cleanHash = (rawHash || '').replace(/^#\/?/, '').trim();
      if (cleanHash) {
        const [path, queryString] = cleanHash.split('?');
        const params = {};
        if (queryString) {
          new URLSearchParams(queryString).forEach((val, key) => {
            params[key] = val;
          });
        }
        return { page: path || 'home', params };
      }
    } catch (e) {}
    return { page: 'home', params: {} };
  };

  const initialRoute = parseRoute();
  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [pageParams, setPageParams] = useState(initialRoute.params);

  // Modals - Teacher PIN Login & Code Redeem
  const [isTeacherLoginModalOpen, setIsTeacherLoginModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Setup initial baseline entry in history stack & attach popstate handler
  useEffect(() => {
    // 1. Establish valid baseline history state
    const currentHash = window.location.hash || '#/';
    if (!window.location.hash) {
      window.history.replaceState({ page: 'home', params: {}, scrollY: 0 }, '', '#/');
    } else {
      window.history.replaceState(
        { page: initialRoute.page, params: initialRoute.params, scrollY: window.scrollY || 0 },
        '',
        currentHash
      );
    }

    // 2. Handle Android Hardware & Browser Back / Forward buttons
    const handlePopState = (event) => {
      // If modal was open, close it cleanly
      if (isCodeModalOpen) setIsCodeModalOpen(false);
      if (isTeacherLoginModalOpen) setIsTeacherLoginModalOpen(false);

      // Extract route from event state or fallback to current hash
      let targetPage = event.state?.page;
      let targetParams = event.state?.params;

      if (!targetPage) {
        const parsed = parseRoute();
        targetPage = parsed.page;
        targetParams = parsed.params;
      }

      if (targetPage === 'teacher-admin' && role !== 'teacher') {
        setIsTeacherLoginModalOpen(true);
        return;
      }

      setCurrentPage(targetPage || 'home');
      setPageParams(targetParams || {});

      // Restore exact scroll position of that page
      const savedScrollY = typeof event.state?.scrollY === 'number' ? event.state.scrollY : 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' });
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [role, isCodeModalOpen, isTeacherLoginModalOpen]);

  const handleNavigate = (page, params = {}) => {
    if (page === 'teacher-admin') {
      setIsTeacherLoginModalOpen(true);
      return;
    }
    // When leaving teacher-admin, reset role to student
    if (currentPage === 'teacher-admin' && page !== 'teacher-admin') {
      switchRole('student');
    }

    // Save scroll position into CURRENT history entry before pushing new one
    const currentScrollY = window.scrollY || window.pageYOffset || 0;
    try {
      window.history.replaceState({
        page: currentPage,
        params: pageParams,
        scrollY: currentScrollY
      }, '', window.location.hash || '#/');
    } catch (e) {}

    // Formulate target hash
    let newHash = page === 'home' ? '#/' : `#/${page}`;
    const qs = new URLSearchParams(params).toString();
    if (qs) newHash += `?${qs}`;

    // Push real forward navigation entry to browser history
    window.history.pushState({
      page,
      params,
      scrollY: 0
    }, '', newHash);

    setCurrentPage(page);
    setPageParams(params);

    // Scroll to top smoothly for the new view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCodeModal = () => {
    setIsCodeModalOpen(true);
    // Push modal state so Android back button closes the modal instead of exiting
    try {
      window.history.pushState({
        page: currentPage,
        params: pageParams,
        modal: 'code',
        scrollY: window.scrollY || 0
      }, '', window.location.hash);
    } catch (e) {}
  };

  const handleCloseCodeModal = () => {
    setIsCodeModalOpen(false);
  };

  const handleOpenTeacherLogin = () => {
    setIsTeacherLoginModalOpen(true);
    try {
      window.history.pushState({
        page: currentPage,
        params: pageParams,
        modal: 'teacher-login',
        scrollY: window.scrollY || 0
      }, '', window.location.hash);
    } catch (e) {}
  };

  const handleCloseTeacherLogin = () => {
    setIsTeacherLoginModalOpen(false);
  };

  return (
    <SecurityShield>
      <div className="app-container">
        {/* Teacher Navbar */}
        <TeacherNavbar
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onOpenCodeModal={handleOpenCodeModal}
          onOpenTeacherLogin={handleOpenTeacherLogin}
        />

      {/* Main Routed Content */}
      <main style={{ minHeight: '80vh' }}>
        {currentPage === 'home' && (
          <>
            <TeacherHero
              onNavigate={handleNavigate}
              onOpenCodeModal={handleOpenCodeModal}
            />
            <StageSection
              onNavigate={handleNavigate}
              onOpenCodeModal={handleOpenCodeModal}
            />
            <AchieversLeaderboard />
            <BookletShowcase />
          </>
        )}

        {currentPage === 'stages' && (
          <div style={{ paddingTop: '1.5rem' }}>
            <StageSection
              onNavigate={handleNavigate}
              onOpenCodeModal={handleOpenCodeModal}
            />
          </div>
        )}

        {currentPage === 'stage-lectures' && (
          <StageLecturesPage
            stageId={pageParams.stageId || 'sec-3'}
            onNavigate={handleNavigate}
            onOpenCodeModal={handleOpenCodeModal}
          />
        )}

        {currentPage === 'lecture-room' && (
          <LecturePlayerRoom
            lectureId={pageParams.lectureId || 'lec-s3-01'}
            onNavigate={handleNavigate}
            onOpenCodeModal={handleOpenCodeModal}
          />
        )}

        {currentPage === 'student-portal' && (
          <StudentPortal
            onNavigate={handleNavigate}
            onOpenCodeModal={handleOpenCodeModal}
          />
        )}

        {currentPage === 'teacher-admin' && (
          <TeacherAdminCenter
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'achievers' && (
          <div style={{ paddingTop: '1.5rem' }}>
            <AchieversLeaderboard />
          </div>
        )}

        {currentPage === 'booklets' && (
          <div style={{ paddingTop: '1.5rem' }}>
            <BookletShowcase />
          </div>
        )}
      </main>

      {/* Floating Fast WhatsApp Direct Assistance Button */}
      <a
        href={`https://wa.me/${(teacherProfile?.whatsappNumber || '+201012345678').replace(/[^0-9]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 999,
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: 'white',
          borderRadius: 'var(--radius-full)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.45)',
          fontWeight: 800,
          fontSize: '0.9rem',
          textDecoration: 'none',
          transition: 'transform 0.2s ease',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageCircle size={22} />
        <span>تواصل مع {teacherProfile?.name || 'مستر مايكل شحاته'} 💬</span>
      </a>

      {/* Global Modals */}
      <TeacherLoginModal
        isOpen={isTeacherLoginModalOpen}
        onClose={handleCloseTeacherLogin}
        onSuccess={() => {
          setCurrentPage('teacher-admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <CodeRedeemModal
        isOpen={isCodeModalOpen}
        onClose={handleCloseCodeModal}
        onNavigate={handleNavigate}
      />

      <AuthModal />

      {/* Teacher Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
        color: 'white',
        padding: '3rem 0 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }}>
                  MS
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'white' }}>
                  {teacherProfile?.name || 'مستر مايكل شحاتة'}
                </h3>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                {teacherProfile?.subtitle || 'صاحب سلسلة The Master ومعد أوائل الطلاب'} • خبرة أكثر من 16 عاماً في تدريس وتبسيط اللغة الإنجليزية للمراحل الابتدائية والإعدادية والثانوية.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>المراحل الدراسية</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94A3B8' }}>
                <li style={{ cursor: 'pointer' }} onClick={() => handleNavigate('stage-lectures', { stageId: 'sec-3' })}>المرحلة الثانوية (صفوف 1، 2، 3 ثانوي)</li>
                <li style={{ cursor: 'pointer' }} onClick={() => handleNavigate('stage-lectures', { stageId: 'prep' })}>المرحلة الإعدادية (صفوف 1، 2، 3 إعدادي)</li>
                <li style={{ cursor: 'pointer' }} onClick={() => handleNavigate('stage-lectures', { stageId: 'pri' })}>المرحلة الابتدائية (الصفوف الابتدائية)</li>
                <li style={{ cursor: 'pointer' }} onClick={() => handleNavigate('stage-lectures', { stageId: 'foundation' })}>كورس التأسيس والمحادثة الشامل</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>الدعم والمتابعة</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94A3B8' }}>
                <span>📞 الخط الساخن: {teacherProfile?.supportHotline || '01012345678'}</span>
                <span>💬 واتساب المستر: {teacherProfile?.whatsappNumber || '01012345678'}</span>
                <span>🔒 نظام حماية المحتوى: علامة مائية ذكية ضد التسريب</span>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1.25rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#64748B'
          }}>
            جميع الحقوق محفوظة © 2026 • منصة {teacherProfile?.name || 'مستر مايكل شحاته'} التعليمية للغة الإنجليزية | The Master
          </div>
        </div>
      </footer>
      </div>
    </SecurityShield>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <TeacherProvider>
              <AppContent />
            </TeacherProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
