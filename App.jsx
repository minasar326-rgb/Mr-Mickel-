import React, { useState } from 'react';
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

  // Navigation State
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});

  // Modals - Teacher PIN Login & Code Redeem (No student login modal!)
  const [isTeacherLoginModalOpen, setIsTeacherLoginModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const handleNavigate = (page, params = {}) => {
    if (page === 'teacher-admin') {
      setIsTeacherLoginModalOpen(true);
      return;
    }
    // When leaving teacher-admin, reset role to student so next entry requires password again
    if (currentPage === 'teacher-admin' && page !== 'teacher-admin') {
      switchRole('student');
    }
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SecurityShield>
      <div className="app-container">
        {/* Teacher Navbar */}
        <TeacherNavbar
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onOpenCodeModal={() => setIsCodeModalOpen(true)}
          onOpenTeacherLogin={() => setIsTeacherLoginModalOpen(true)}
        />

      {/* Main Routed Content */}
      <main style={{ minHeight: '80vh' }}>
        {currentPage === 'home' && (
          <>
            <TeacherHero
              onNavigate={handleNavigate}
              onOpenCodeModal={() => setIsCodeModalOpen(true)}
            />
            <StageSection
              onNavigate={handleNavigate}
              onOpenCodeModal={() => setIsCodeModalOpen(true)}
            />
            <AchieversLeaderboard />
            <BookletShowcase />
          </>
        )}

        {currentPage === 'stages' && (
          <div style={{ paddingTop: '1.5rem' }}>
            <StageSection
              onNavigate={handleNavigate}
              onOpenCodeModal={() => setIsCodeModalOpen(true)}
            />
          </div>
        )}

        {currentPage === 'stage-lectures' && (
          <StageLecturesPage
            stageId={pageParams.stageId || 'sec-3'}
            onNavigate={handleNavigate}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
          />
        )}

        {currentPage === 'lecture-room' && (
          <LecturePlayerRoom
            lectureId={pageParams.lectureId || 'lec-s3-01'}
            onNavigate={handleNavigate}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
          />
        )}

        {currentPage === 'student-portal' && (
          <StudentPortal
            onNavigate={handleNavigate}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
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
        onClose={() => setIsTeacherLoginModalOpen(false)}
        onSuccess={() => {
          setCurrentPage('teacher-admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <CodeRedeemModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
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
                  {teacherProfile?.name || 'مستر مايكل شحاته'}
                </h3>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                {teacherProfile?.subtitle || 'صاحب أقوى سلسلة تعليمية للغة الإنجليزية ومعد أوائل الجمهورية'} • خبرة أكثر من 16 عاماً في تدريس اللغة الإنجليزية للثانوية العامة وصانع أوائل الجمهورية.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>المراحل الدراسية</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94A3B8' }}>
                <li style={{ cursor: 'pointer' }} onClick={() => handleNavigate('stage-lectures', { stageId: 'sec-3' })}>الصف الثالث الثانوي (Thanaweya Amma)</li>
                <li style={{ cursor: 'pointer' }} onClick={() => handleNavigate('stage-lectures', { stageId: 'sec-2' })}>الصف الثاني الثانوي</li>
                <li style={{ cursor: 'pointer' }} onClick={() => handleNavigate('stage-lectures', { stageId: 'sec-1' })}>الصف الأول الثانوي</li>
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
            fontSize: '0.82rem',
            color: '#94A3B8',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/privacy-policy.html" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'none' }}>سياسة الخصوصية (Privacy Policy)</a>
              <span>•</span>
              <a href="/terms.html" target="_blank" rel="noreferrer" style={{ color: '#38BDF8', textDecoration: 'none' }}>الشروط والأحكام (Terms)</a>
              <span>•</span>
              <a href="/account-deletion.html" target="_blank" rel="noreferrer" style={{ color: '#F87171', textDecoration: 'none' }}>حذف الحساب والبيانات (Data Deletion)</a>
            </div>
            <div>
              جميع الحقوق محفوظة © 2026 • منصة {teacherProfile?.name || 'مستر مايكل شحاته'} التعليمية للغة الإنجليزية | The Master
            </div>
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
