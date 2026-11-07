import React, { useState, useEffect } from 'react';
import { useTeacher, normalizeStageId } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { verifyAdminSession } from '../../services/authSecurity';
import { 
  BookOpen, Play, Lock, CheckCircle2, Clock, 
  HelpCircle, Upload, ArrowRight, Key, Sparkles, Award, MessageCircle, Calendar, ShieldCheck,
  ChevronDown, ChevronUp, Folder, FolderOpen, Layers, Check, ExternalLink
} from 'lucide-react';

export default function StageLecturesPage({ stageId, onNavigate, onOpenCodeModal }) {
  const { 
    teacherProfile, 
    stages, 
    lectures, 
    completedLectureIds, 
    homeworkSubmissions, 
    examResults,
    getSubscriptionStatus,
    isLectureUnlocked,
    canAccessLecture,
    videoWatchProgress,
    unlockedLectureIds,
    sections,
    refreshLecturesManifest
  } = useTeacher();
  const { currentUser, role, switchRole, openAuthModal } = useAuth();

  useEffect(() => {
    if (typeof refreshLecturesManifest === 'function') {
      refreshLecturesManifest();
    }
  }, [stageId, refreshLecturesManifest]);

  const [filterType, setFilterType] = useState('all'); // 'all' | 'month' | 'course'
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSectionCollapse = (secId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const currentStages = Array.isArray(stages) && stages.length > 0 ? stages : (teacherProfile?.stages || []);
  
  // 1. Stage Identification: if stageId is a section ID, resolve parent stage first
  let resolvedStageId = stageId;
  if (stageId && stageId.startsWith('sec-')) {
    const parentSec = (Array.isArray(sections) ? sections : []).find(s => s.id === stageId);
    if (parentSec?.stageId) {
      resolvedStageId = parentSec.stageId;
    }
  }

  // Exact ID match, or normalized alias match
  let stage = currentStages.find(s => s.id === resolvedStageId || s.id === stageId);
  if (!stage && stageId) {
    const normSearch = normalizeStageId(stageId);
    stage = currentStages.find(s => normalizeStageId(s.id, s.name) === normSearch);
  }
  // Fallback 1: check teacherProfile stages
  if (!stage && stageId) {
    const allKnown = teacherProfile?.stages || [];
    stage = allKnown.find(s => s.id === stageId || normalizeStageId(s.id, s.name) === normalizeStageId(stageId));
  }
  // Fallback 2: derive stage from existing lectures if custom stage was added
  if (!stage && stageId) {
    const lecForStage = (Array.isArray(lectures) ? lectures : []).find(l => l && (l.stageId === stageId || normalizeStageId(l.stageId, l.stageName) === normalizeStageId(stageId)));
    if (lecForStage) {
      stage = {
        id: stageId,
        name: lecForStage.stageName || (typeof getStageTitle === 'function' ? getStageTitle(stageId) : stageId),
        description: 'محتوى شامل ومنهج تدريبي متكامل.',
        badge: 'دفعة 2026 🔥',
        pricePerMonth: '30 ج.م'
      };
    }
  }
  // Fallback 3: synthesize stage from getStageTitle
  if (!stage && stageId) {
    const derivedTitle = typeof getStageTitle === 'function' ? getStageTitle(stageId) : '';
    if (derivedTitle && derivedTitle !== stageId) {
      stage = {
        id: stageId,
        name: derivedTitle,
        description: 'محتوى شامل ومنهج تدريبي متكامل.',
        badge: 'دفعة 2026 🔥',
        pricePerMonth: '40 ج.م'
      };
    }
  }

  // If stage does not exist, show dedicated "المرحلة غير موجودة" page with return to home
  if (!stage) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2.5rem 1.5rem',
        direction: 'rtl'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          border: '2px solid rgba(239, 68, 68, 0.2)'
        }}>
          <HelpCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          عذراً، هذه المرحلة الدراسية غير موجودة
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', marginBottom: '1.75rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
          المرحلة التي تحاول الوصول إليها غير مسجلة بالنظام أو ربما تم تعديل معرفها.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="btn btn-primary"
          style={{ gap: '8px', padding: '12px 24px', fontWeight: 800, fontSize: '0.95rem' }}
        >
          <ArrowRight size={18} />
          <span>العودة إلى الصفحة الرئيسية</span>
        </button>
      </div>
    );
  }

  // 2. Strict Lecture Isolation: lectures MUST belong strictly to THIS stage ID
  const deletedIds = (() => {
    try {
      const raw = localStorage.getItem('ms_deleted_lectures');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  })();

  const stageLectures = (Array.isArray(lectures) ? lectures : []).filter(l => {
    if (!l || l.isDeleted || deletedIds.has(l.id)) return false;
    if (l.stageId === stage.id) return true;
    if (normalizeStageId(l.stageId, l.stageName) === normalizeStageId(stage.id, stage.name)) return true;
    if (l.stageName && stage.name && l.stageName.trim().toLowerCase() === stage.name.trim().toLowerCase()) return true;
    return false;
  });

  // 3. Strict Section Isolation: dynamic sections strictly for THIS stage ID
  const stageSections = (Array.isArray(sections) ? sections : [])
    .filter(sec => {
      return sec && sec.isVisible !== false && sec.stageId === stage.id;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Check stage-level subscription status: strictly THIS stage or 'all-access'
  const directSub = getSubscriptionStatus(stage.id);
  const allAccessSub = getSubscriptionStatus('all-access');
  const stageSub = (directSub?.isSubscribed && !directSub?.isExpired) ? directSub 
    : ((allAccessSub?.isSubscribed && !allAccessSub?.isExpired) ? allAccessSub : directSub);
  const isStageSubscribed = stageSub.isSubscribed && !stageSub.isExpired;
  const cleanWhatsapp = (teacherProfile?.whatsappNumber || '01012345678').replace(/[^0-9]/g, '');

  const isTeacher = Boolean((verifyAdminSession()?.valid || verifyAdminSession()?.isValid) && role === 'instructor');

  // Subscribed sections (months/courses) inside THIS stage
  const subscribedSections = stageSections.filter(sec => {
    const secStatus = getSubscriptionStatus(sec.id);
    return secStatus.isSubscribed && !secStatus.isExpired;
  });
  const isAnySectionSubscribed = subscribedSections.length > 0;

  // Subscribed individual lectures in this stage
  const subscribedLectureList = stageLectures.filter(lec => {
    const s = getSubscriptionStatus(lec.id);
    return s.isSubscribed && !s.isExpired;
  });

  // Overall student subscription state in THIS stage
  const isStudentSubscribedInStage = Boolean(isStageSubscribed || isAnySectionSubscribed || subscribedLectureList.length > 0);

  // Compute accessible lectures for this student
  const accessibleLectures = stageLectures.filter(lec => {
    if (isTeacher) return true;
    const accessCheck = canAccessLecture ? canAccessLecture(lec, stage.id) : { allowed: isStageSubscribed || isLectureUnlocked(lec, stage.id) };
    return accessCheck.allowed;
  });

  const completedCount = completedLectureIds.filter(id => stageLectures.some(l => l.id === id)).length;
  const submittedHwCount = Object.keys(homeworkSubmissions || {}).filter(id => stageLectures.some(l => l.id === id)).length;
  const completedExamsCount = Object.keys(examResults || {}).filter(id => stageLectures.some(l => l.id === id)).length;

  // 4. Hide Empty Sections: If a month/section has 0 lectures, do not display it to students!
  const displayedSections = stageSections.filter(sec => {
    if (filterType !== 'all' && sec.type !== filterType) return false;
    
    // For students: ONLY show sections that actually contain at least one lecture
    if (!isTeacher) {
      const hasLectures = stageLectures.some(l => l.sectionId === sec.id);
      if (!hasLectures) return false;
    }

    return true;
  });

  // Identify lectures not assigned to any existing visible section
  const unassignedLectures = stageLectures.filter(l => !l.sectionId || !stageSections.some(s => s.id === l.sectionId));

  // Render a lecture card
  const renderLectureCard = (lec) => {
    const accessCheck = canAccessLecture ? canAccessLecture(lec, stage.id) : { allowed: isStageSubscribed || isLectureUnlocked(lec, stage.id) };
    const isUnlocked = accessCheck.allowed;
    const lecSub = getSubscriptionStatus(lec.id);
    const isCompleted = completedLectureIds.includes(lec.id);
    const hw = homeworkSubmissions[lec.id];
    const exam = examResults[lec.id];
    const watchProg = videoWatchProgress?.[lec.id] || { percent: 0 };

    return (
      <div
        key={lec.id}
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: isUnlocked 
            ? '2px solid #10B981' 
            : accessCheck.isProgressionLocked 
            ? '2px solid #F59E0B'
            : '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: isUnlocked 
            ? '0 8px 25px rgba(16, 185, 129, 0.15)' 
            : accessCheck.isProgressionLocked
            ? '0 8px 25px rgba(245, 158, 11, 0.15)'
            : 'var(--shadow-sm)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', height: '180px' }}>
          <img
            src={lec.thumbnail}
            alt={lec.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <span className="badge badge-primary" style={{ position: 'absolute', top: '12px', right: '12px' }}>
            {lec.unitNumber}
          </span>

          {isUnlocked ? (
            <span style={{ 
              position: 'absolute', top: '12px', left: '12px', 
              background: isTeacher ? '#4F46E5' : '#10B981', color: 'white', padding: '4px 10px', 
              borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
            }}>
              {isTeacher 
                ? `🔒 باشتراك (${lec.price || '70 ج.م'}) • معاينة المعلم 👑` 
                : (lec.isFree ? '🎁 تجريبية مجانية' : '✓ مفعّل باشتراكك 🟢')}
            </span>
          ) : accessCheck.isProgressionLocked ? (
            <span style={{ 
              position: 'absolute', top: '12px', left: '12px', 
              background: '#D97706', color: 'white', padding: '4px 10px', 
              borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
            }}>
              ⏳ تفتح بالتدريج
            </span>
          ) : (
            <span style={{ 
              position: 'absolute', top: '12px', left: '12px', 
              background: 'rgba(15, 23, 42, 0.85)', color: '#FCD34D', padding: '4px 10px', 
              borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, border: '1px solid rgba(252, 211, 77, 0.4)' 
            }}>
              🔒 باشتراك ({lec.price || '30 ج.م'}) • يتطلب كود الشهر
            </span>
          )}

          {!isUnlocked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: accessCheck.isProgressionLocked ? 'rgba(15, 23, 42, 0.78)' : 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              gap: '6px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <Lock size={28} color={accessCheck.isProgressionLocked ? '#FBBF24' : '#F87171'} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: accessCheck.isProgressionLocked ? '#FDE68A' : 'white' }}>
                {accessCheck.isProgressionLocked ? 'مقفلة: يلزم إنهاء المحاضرة السابقة ⏳' : 'المحاضرة مقفلة'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1', maxWidth: '90%' }}>
                {accessCheck.reason || 'اشحن كود تفعيل المحاضرة أو الشهر لفتحها فوراً'}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px', lineHeight: '1.4' }}>
              {lec.title}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              {lec.subtitle}
            </p>

            {/* Watch Progress Indicator */}
            {watchProg.percent > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>نسبة المشاهدة الفعلية:</span>
                  <strong style={{ color: watchProg.percent >= 50 ? '#10B981' : '#F59E0B' }}>{watchProg.percent}%</strong>
                </div>
                <div style={{ height: '5px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, watchProg.percent)}%`,
                    background: watchProg.percent >= 50 ? '#10B981' : '#F59E0B',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Status Badges Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            fontSize: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.75rem'
          }}>
            <span className="badge badge-subtle">⏱️ {lec.duration}</span>
            {isUnlocked && !lec.isFree && !isTeacher && (
              <span className="badge badge-success" style={{ fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                ✓ مفعّل بحسابك 🟢 (دائم مدى الحياة ♾️)
              </span>
            )}
            {!isUnlocked && !lec.isFree && (
              <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                💰 باشتراك ({lec.price || '70 ج.م'})
              </span>
            )}
            {lec.isFree && <span className="badge badge-success">🎁 تجريبية مجانية</span>}
            {isTeacher && (
              <span className="badge badge-gold" style={{ fontWeight: 700 }}>
                👑 معاينة المعلم
              </span>
            )}
            {isCompleted && <span className="badge badge-success">✓ تمت المشاهدة (50%+)</span>}
            {hw?.status === 'submitted' && <span className="badge badge-primary">📝 تم تسليم الواجب</span>}
            {exam && <span className="badge badge-gold">🏆 الامتحان: {exam.score}/{exam.total}</span>}
          </div>

          {/* Action */}
          <div>
            {isUnlocked ? (
              <button
                onClick={() => onNavigate('lecture-room', { lectureId: lec.id })}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                  fontWeight: 800
                }}
              >
                <Play size={16} fill="currentColor" />
                <span>{isTeacher ? 'معاينة المحاضرة كمعلم 👑' : 'مشاهدة المحاضرة والواجبات الآن ▶️'}</span>
              </button>
            ) : accessCheck.isProgressionLocked && accessCheck.prevLecture ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => onNavigate('lecture-room', { lectureId: accessCheck.prevLecture.id })}
                  className="btn btn-warning"
                  style={{
                    width: '100%',
                    gap: '8px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white'
                  }}
                >
                  <Play size={16} fill="currentColor" />
                  <span>أكمل المحاضرة السابقة أولاً (50%+) ⏳</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`مرحباً مستر مايكل، أريد الاشتراك في محاضرة: "${lec.title}" (${stage?.name || 'المرحلة الدراسية'}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <MessageCircle size={17} />
                  <span>الاشتراك عبر واتساب المستر 💬</span>
                </a>

                <button
                  onClick={onOpenCodeModal}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', gap: '6px', color: 'var(--primary-600)', fontWeight: 700 }}
                >
                  <Key size={14} />
                  <span>معي كود تفعيل المحاضرة 🔑</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container">
        {/* Stage Header Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #141419 0%, #1A1A22 50%, #201D17 100%)',
          color: 'white',
          padding: '2.5rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(245, 158, 11, 0.35)'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <button
                onClick={() => onNavigate('stages')}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(255, 255, 255, 0.15)', color: 'white', border: 'none', gap: '6px' }}
              >
                <ArrowRight size={16} />
                <span>كافة المراحل</span>
              </button>
              <span className="badge badge-gold">{stage.badge}</span>
              {isStudentSubscribedInStage && !isTeacher && (
                <span className="badge badge-success" style={{ background: '#10B981', color: 'white', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} />
                  <span>{isStageSubscribed ? '✓ اشتراك VIP للمرحلة نشط' : '✓ طالب مشترك بالمنصة 🟢'}</span>
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 8px', color: 'white' }}>
              محاضرات {stage.name} 🎓
            </h1>

            <p style={{ color: '#C7D2FE', fontSize: '1rem', maxWidth: '700px', lineHeight: '1.6', margin: 0 }}>
              {stage.description}
            </p>
          </div>
        </div>

        {/* Dynamic VIP Student Dashboard & Welcome Center */}
        {isStudentSubscribedInStage && !isTeacher ? (
          <div className="card animate-fade-in" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.22) 50%, rgba(15, 23, 42, 0.15) 100%)',
            border: '2px solid #10B981',
            borderRadius: 'var(--radius-2xl, 24px)',
            padding: '2rem',
            marginBottom: '2.5rem',
            boxShadow: '0 12px 35px rgba(16, 185, 129, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient Background Glow */}
            <div style={{
              position: 'absolute',
              top: '-60px',
              left: '-60px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Top Greeting Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
              paddingBottom: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
                  flexShrink: 0
                }}>
                  <Award size={36} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: '9999px', 
                      fontSize: '0.82rem', 
                      fontWeight: 900,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                    }}>
                      <ShieldCheck size={15} />
                      <span>أنت حالياً مشترك رسمي في المنصة 🟢</span>
                    </span>

                    <span style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)'
                    }}>
                      🔒 موثق ومربوط بحسابك: {currentUser?.email || currentUser?.name || 'طالب متميز'}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--text-main)' }}>
                    أهلاً بك يا {currentUser?.name || 'طالبنا المتميز'} في {stage.name}! 🎓✨
                  </h2>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6', maxWidth: '720px' }}>
                    منصة <strong style={{ color: '#10B981' }}>The Master</strong> ومستر <strong style={{ color: '#10B981' }}>مايكل شحاتة</strong> ترحب بك وتتمنى لك رحلة تعليمية ملهمة وممتعة وتحقيق أعلى الدرجات والتفوق في اللغة الإنجليزية!
                  </p>
                </div>
              </div>

              {/* Status Device Pill */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-lg)',
                color: '#059669',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#10B981" />
                <span>مفتوح ومفعل على جميع أجهزتك (موبايل، تابلت، كمبيوتر)</span>
              </div>
            </div>

            {/* Subscription Validity Section (يفضل سارياً لحد إمتى) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.1rem 1.4rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981' }}>
                    {isStageSubscribed 
                      ? '🏆 نطاق الاشتراك: اشتراك المرحلة بالكامل (VIP All-Access)' 
                      : isAnySectionSubscribed 
                      ? `📅 نطاق الاشتراك: ${subscribedSections.map(s => s.title).join(' • ')}`
                      : '🎯 نطاق الاشتراك: اشتراك محاضرة محددة'}
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⏳ مدة وصلاحية الاشتراك:</span>
                  <span style={{ color: '#059669', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 10px', borderRadius: '8px' }}>
                    ♾️ اشتراك دائم مدى الحياة (Permanent)
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  {isStageSubscribed 
                    ? 'يفتح لك جميع شهور ومحاضرات هذه المرحلة الحالية، وأي محاضرات أو شهور جديدة تنزل مستقبلاً دون أي تكلفة إضافية.'
                    : 'يظل هذا الشهر ومحاضراته وواجباته وامتحاناته مفتوحاً لك دائماً، بما في ذلك أي محاضرات جديدة تُضاف لنفس الشهر مستقبلاً، حتى بعد مرور سنوات!'}
                </p>
              </div>

              <button
                onClick={onOpenCodeModal}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontSize: '0.82rem', fontWeight: 700 }}
              >
                <Key size={14} />
                <span>شحن كود شهر إضافي 🔑</span>
              </button>
            </div>

            {/* 4 Academic KPI Information Boxes (كم معلومة كده) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem'
            }}>
              {/* Box 1: Available Lectures */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {accessibleLectures.length} محاضرة
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    متاحة للمشاهدة بدون تقطيع
                  </div>
                </div>
              </div>

              {/* Box 2: Watch Progress */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Play size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {completedCount} من {accessibleLectures.length} مكتملة
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    نسبة الإنجاز: {accessibleLectures.length > 0 ? Math.round((completedCount / accessibleLectures.length) * 100) : 0}% 🚀
                  </div>
                </div>
              </div>

              {/* Box 3: Homework & Exams */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Award size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {submittedHwCount} واجب • {completedExamsCount} امتحان
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    متابعة أسبوعية مع المستر
                  </div>
                </div>
              </div>

              {/* Box 4: Student XP & Level */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#A855F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {currentUser?.xp || 100} XP
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    المستوى {Math.floor((currentUser?.xp || 100) / 100) + 1} ⚡ استمر في التفوق
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Advice Strip from Teacher */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px dashed rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ fontSize: '1.1rem' }}>💡</span>
              <span>
                <strong style={{ color: 'var(--text-main)' }}>نصيحة مستر مايكل:</strong> ركز في حل التدريبات والواجبات فور الانتهاء من سماع كل محاضرة، واستعن بالمذكرات المرفقة لضمان تثبيت المعلومة والحصول على الدرجة النهائية!
              </span>
            </div>
          </div>
        ) : stageSub.isExpired ? (
          <div className="card animate-fade-in" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.08) 100%)',
            border: '2px solid #EF4444',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1.5px solid rgba(239, 68, 68, 0.3)'
              }}>
                <Clock size={30} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ 
                    background: '#EF4444', color: 'white', padding: '3px 10px', 
                    borderRadius: '20px', fontSize: '0.78rem', fontWeight: 900 
                  }}>
                    ⚠️ الحالة: اشتراك منتهي (Expired)
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                  انتهى اشتراكك في هذه المرحلة ({stage.name})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  انتهت صلاحية الاشتراك بتاريخ <strong>{stageSub.expiresAtFormatted}</strong>. يرجى تجديد الاشتراك أو شحن كود شهر جديد لمواصلة المشاهدة.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={onOpenCodeModal}
                className="btn btn-primary btn-sm"
                style={{ gap: '6px', fontWeight: 800 }}
              >
                <Key size={15} />
                <span>تجديد وشحن كود جديد 🔑</span>
              </button>
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`السلام عليكم يا مستر مايكل، انتهى اشتراكي في مرحلة: ${stage.name} وأريد تجديد الاشتراك.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontWeight: 700, textDecoration: 'none', color: '#059669' }}
              >
                <MessageCircle size={15} />
                <span>تجديد عبر واتساب</span>
              </a>
            </div>
          </div>
        ) : !isTeacher ? (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.03) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Lock size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-main)' }}>
                  المرحلة مقفلة - يمكنك الاشتراك في شهر محدد أو كورس أو شحن كود تفعيل 🔒
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  اختر الشهر الدراسي أو الكورس المطلوب بالأسفل لشحنه وفتحه مباشرة بحسابك
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`السلام عليكم مستر مايكل، أريد الاشتراك في محاضرات: ${stage.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  gap: '6px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <MessageCircle size={16} />
                <span>الاشتراك عبر واتساب</span>
              </a>

              <button
                onClick={onOpenCodeModal}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px', fontWeight: 700 }}
              >
                <Key size={15} />
                <span>شحن كود التفعيل 🔑</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Teacher Preview Mode Notice Banner */}
        {isTeacher && (
          <div className="card animate-fade-in" style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            border: '2px solid #818CF8',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
              }}>
                👑
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ background: '#6366F1', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900 }}>
                    وضع معاينة المعلم (مستر مايكل)
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#A5B4FC', fontWeight: 700 }}>
                    🔒 المحاضرات مقفلة 100% للطلاب وتتطلب كود الشهر
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#E0E7FF', lineHeight: '1.5' }}>
                  أنت تشاهد المحاضرات بصفتك مستر مايكل. جميع المحاضرات مقفلة برمز القفل لكافة الطلاب والزوار العاديين ولا يمكن لأي طالب مشاهدتها إلا بعد شحن كود تفعيل الشهر.
                </p>
              </div>
            </div>
            <button
              onClick={() => switchRole('student')}
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                fontWeight: 800,
                gap: '6px'
              }}
            >
              <span>👁️ معاينة كطالب لتجربة قفل المحاضرات والكود</span>
            </button>
          </div>
        )}

        {/* Section Filters & Header */}
        <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={24} color="var(--primary-600)" />
              <span>الشهور الدراسية والكورسات المتاحة</span>
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              إجمالي المحاضرات: {stageLectures.length} محاضرة معتمدة • {stageSections.length} أقسام دراسية
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Filter Pills */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              padding: '4px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              gap: '4px'
            }}>
              <button
                onClick={() => setFilterType('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: filterType === 'all' ? 'var(--primary-gradient)' : 'transparent',
                  color: filterType === 'all' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                الكل ({stageSections.length})
              </button>
              <button
                onClick={() => setFilterType('month')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: filterType === 'month' ? 'var(--primary-gradient)' : 'transparent',
                  color: filterType === 'month' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📅 الشهور الدراسية ({stageSections.filter(s => s.type === 'month').length})
              </button>
              <button
                onClick={() => setFilterType('course')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: filterType === 'course' ? 'var(--primary-gradient)' : 'transparent',
                  color: filterType === 'course' ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📁 الكورسات والمراجعات ({stageSections.filter(s => s.type === 'course').length})
              </button>
            </div>

            <button
              onClick={onOpenCodeModal}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <Key size={17} />
              <span>شحن وتفعيل كود 🔑</span>
            </button>
          </div>
        </div>

        {/* Dynamic Sections List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {displayedSections.map(sec => {
            const secLectures = stageLectures.filter(l => l.sectionId === sec.id);
            const secSub = getSubscriptionStatus(sec.id);
            const isSecSubscribed = isStageSubscribed || (secSub.isSubscribed && !secSub.isExpired);
            const isCollapsed = Boolean(collapsedSections[sec.id]);

            return (
              <div 
                key={sec.id}
                className="card"
                style={{
                  padding: 0,
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  background: 'var(--bg-surface)',
                  border: isSecSubscribed ? '2px solid #10B981' : '1px solid var(--border-subtle)',
                  boxShadow: isSecSubscribed ? '0 10px 30px rgba(16, 185, 129, 0.12)' : 'var(--shadow-md)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Section Header Card */}
                <div style={{
                  padding: '1.5rem 1.75rem',
                  background: isSecSubscribed 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)' 
                    : 'var(--bg-subtle)',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
                    {sec.cover ? (
                      <img 
                        src={sec.cover} 
                        alt={sec.title} 
                        style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }} 
                      />
                    ) : (
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: sec.type === 'course' 
                          ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' 
                          : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}>
                        {sec.type === 'course' ? <Layers size={28} /> : <Calendar size={28} />}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: sec.type === 'course' ? '#B45309' : '#D97706',
                          color: 'white'
                        }}>
                          {sec.type === 'course' ? '📁 كورس تعليمي' : '📅 شهر دراسي'}
                        </span>

                        {isSecSubscribed ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}>
                            <CheckCircle2 size={14} />
                            <span>مفعّل ومفتوح بحسابك 🟢 • دائم مدى الحياة ♾️</span>
                          </span>
                        ) : secSub.isExpired ? (
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: '#EF4444',
                            color: 'white'
                          }}>
                            ⚠️ اشتراك منتهي
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#DC2626',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            🔒 يتطلب اشتراك ({sec.price || 250} ج.م)
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px', color: 'var(--text-main)' }}>
                        {sec.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {sec.description || 'شرح تفصيلي مع تدريبات مكثفة ومتابعة أسبوعية'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {isSecSubscribed && (
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#059669',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CheckCircle2 size={15} color="#10B981" />
                        <span>جاهز للمشاهدة فوراً 🟢</span>
                      </span>
                    )}

                    {!isSecSubscribed && (
                      <>
                        <a
                          href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`السلام عليكم مستر مايكل، أريد الاشتراك في: "${sec.title}" (${stage.name}) - السعر: ${sec.price || 250} ج.م.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            gap: '6px',
                            textDecoration: 'none',
                            fontWeight: 800
                          }}
                        >
                          <MessageCircle size={15} />
                          <span>اشتراك عبر واتساب ({sec.price || 250} ج.م)</span>
                        </a>

                        <button
                          onClick={onOpenCodeModal}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px', fontWeight: 700 }}
                        >
                          <Key size={14} />
                          <span>شحن كود 🔑</span>
                        </button>
                      </>
                    )}

                    {/* Toggle Collapse Button */}
                    <button
                      onClick={() => toggleSectionCollapse(sec.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', padding: '7px 12px' }}
                      title={isCollapsed ? 'عرض المحاضرات' : 'طي المحاضرات'}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        {secLectures.length} محاضرة
                      </span>
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </div>
                </div>

                {/* Section Lectures Grid */}
                {!isCollapsed && (
                  <div style={{ padding: '1.75rem' }}>
                    {secLectures.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2.5rem 1rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-muted)'
                      }}>
                        <Folder size={40} style={{ opacity: 0.4, marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>
                          لم يتم إدراج محاضرات في هذا القسم بعد. سيتم رفع المحاضرات قريباً!
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                        gap: '1.5rem'
                      }}>
                        {secLectures.map(lec => renderLectureCard(lec))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Fallback / General Lectures not assigned to any specific section */}
          {unassignedLectures.length > 0 && (
            <div 
              className="card"
              style={{
                padding: 0,
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div style={{
                padding: '1.25rem 1.75rem',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'var(--primary-gradient)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 2px' }}>
                      محاضرات عامة وتدريبات إضافية 📚
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      محاضرات ومراجعات إضافية داعمة للمرحلة
                    </p>
                  </div>
                </div>

                <span className="badge badge-subtle" style={{ fontWeight: 800 }}>
                  {unassignedLectures.length} محاضرة
                </span>
              </div>

              <div style={{ padding: '1.75rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                  gap: '1.5rem'
                }}>
                  {unassignedLectures.map(lec => renderLectureCard(lec))}
                </div>
              </div>
            </div>
          )}

          {/* Empty Stage State */}
          {stageLectures.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <BookOpen size={52} color="var(--primary-400)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                لم يتم نشر محاضرات لهذه المرحلة حتى الآن
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                يقوم المستر حالياً بإعداد المحاضرات وتصويرها بجودة عالية، تابع التنبيهات لمعرفة موعد النشر فوراً.
              </p>
              <button onClick={() => onNavigate('stages')} className="btn btn-secondary">
                العودة لقائمة المراحل
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

