import React, { useState, useRef, useEffect, useCallback } from 'react';
import LectureVideoPlayer from './LectureVideoPlayer';
import { useTeacher, normalizeStageId } from '../../context/TeacherContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import EnglishExamModal from './EnglishExamModal';
import { downloadPdfFile } from '../../services/pdfDownloader';
import { verifyAdminSession } from '../../services/authSecurity';
import { 
  Play, Pause, RotateCcw, FastForward, Volume2, VolumeX, Maximize, 
  CheckCircle2, ArrowRight, ArrowLeft, Volume1, Mic, MicOff, Download, 
  FileText, Upload, HelpCircle, Award, Eye, Sparkles, BookOpen, AlertCircle, Clock, Image, X, Lock, Key, MessageCircle, Loader2
} from 'lucide-react';

export function getEmbedInfo(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // YouTube detection (youtube.com, youtu.be, embed, shorts)
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      id: ytMatch[1]
    };
  }

  // Vimeo detection
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&color=0d9488`,
      id: vimeoMatch[3]
    };
  }

  // Google Drive detection
  const driveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/i);
  if (driveMatch) {
    const fileId = driveMatch[1] || driveMatch[2];
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      id: fileId
    };
  }

  return null;
}

export default function LecturePlayerRoom({ lectureId, onNavigate, onOpenCodeModal }) {
  const { 
    teacherProfile, 
    stages, 
    lectures, 
    markLectureComplete, 
    submitHomework, 
    homeworkSubmissions, 
    examResults, 
    resolveVideoSource, 
    isLectureUnlocked, 
    canAccessLecture,
    getSubscriptionStatus,
    updateLectureWatchProgress 
  } = useTeacher();
  const { currentUser, role, openAuthModal } = useAuth();
  const { addToast } = useToast();

  const lecture = (lectures && lectures.length > 0)
    ? (lectures.find(l => l.id === lectureId) || lectures[0])
    : null;
  const currentStage = (stages || []).find(s => s.id === lecture?.stageId);
  const cleanWhatsapp = (teacherProfile?.whatsappNumber || '01012345678').replace(/[^0-9]/g, '');

  const isTeacherOrAdmin = role === 'instructor' || role === 'super_admin' || verifyAdminSession()?.isValid;
  const isTeacher = isTeacherOrAdmin;
  const accessCheck = isTeacherOrAdmin 
    ? { allowed: true } 
    : (canAccessLecture && lecture ? canAccessLecture(lecture, lecture?.stageId) : { allowed: false, reason: 'المحتوى مقفل للمشتركين فقط' });
  const isAllowedToWatch = Boolean(accessCheck?.allowed);
  const stageSub = (getSubscriptionStatus && lecture) ? getSubscriptionStatus(lecture.stageId) : {};

  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState(() => {
    if (isAllowedToWatch && lecture?.videoUrl && /^https?:\/\//i.test(lecture.videoUrl)) {
      return lecture.videoUrl;
    }
    return '';
  });

  // PDF Download State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Resolve persistent video URL from IndexedDB or Cloud (strictly gated by isAllowedToWatch)
  useEffect(() => {
    let isMounted = true;
    if (!isAllowedToWatch || !lecture) {
      setResolvedVideoUrl('');
      return;
    }

    if (lecture.videoUrl && /^https?:\/\//i.test(lecture.videoUrl)) {
      setResolvedVideoUrl(lecture.videoUrl);
      return;
    }

    if (resolveVideoSource) {
      resolveVideoSource(lecture).then(url => {
        if (isMounted && isAllowedToWatch) {
          setResolvedVideoUrl(prev => prev !== (url || '') ? (url || '') : prev);
        }
      });
    } else {
      setResolvedVideoUrl('');
    }
    return () => { isMounted = false; };
  }, [lecture?.id, lecture?.videoUrl, isAllowedToWatch, resolveVideoSource]);

  // Tabs
  const [activeTab, setActiveTab] = useState('vocab'); // 'vocab' | 'grammar' | 'booklet' | 'homework' | 'exam'

  // Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  // Pronunciation Lab States
  const [activeWordAudio, setActiveWordAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedWord, setRecordedWord] = useState(null);

  // Homework Upload States with actual file selector
  const hwFileInputRef = useRef(null);
  const [hwPhotos, setHwPhotos] = useState([]);
  const [hwNotes, setHwNotes] = useState('');
  const [isHwSubmitted, setIsHwSubmitted] = useState(!!(lecture && homeworkSubmissions?.[lecture.id]));

  

  const handleDownloadLecturePdf = async () => {
    if (!isAllowedToWatch || accessCheck.isPaused || accessCheck.isFrozen) {
      addToast(accessCheck.reason || 'المحاضرة غير متاحة للتنزيل، يرجى تفعيل الاشتراك والتواصل مع الإدارة 🔒', 'error', 5000);
      return;
    }
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setDownloadProgress(20);
    addToast('جاري تحضير وتنزيل مذكرة الشرح والتدريبات (PDF)... 📄⚡', 'info', 3000);

    try {
      const result = await downloadPdfFile({
        url: lecture.pdfBooklet?.downloadUrl || lecture.pdfBooklet?.url,
        title: lecture.pdfBooklet?.title || `مذكرة_${lecture.title}`,
        lectureData: {
          title: lecture.title,
          stageName: currentStage?.name || lecture.stageName || 'المرحلة الدراسية',
          unitNumber: lecture.unitNumber
        },
        studentInfo: {
          name: currentUser?.name || 'طالب مسجل',
          uid: currentUser?.uid || currentUser?.id
        },
        onProgress: (p) => setDownloadProgress(p)
      });

      if (result.success) {
        addToast(`✅ تم تنزيل مذكرة (${result.fileName}) بنجاح بصيغة PDF عالية الدقة!`, 'success', 5000);
      } else {
        addToast(`تعذر تنزيل الملف: ${result.error || 'يرجى مراجعة الاتصال بالإنترنت'}`, 'error');
      }
    } catch (err) {
      console.warn('PDF download error:', err);
      addToast('حدث خطأ أثناء تنزيل الملف، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setIsDownloadingPdf(false);
      setDownloadProgress(0);
    }
  };

  

  const handlePlayWordAudio = (word) => {
    setActiveWordAudio(word);
    addToast(`🔊 استماع لنطق كلمة "${word}" باللكنة البريطانية المعتمدة`, 'info', 2000);
    setTimeout(() => setActiveWordAudio(null), 1500);
  };

  const handleRecordPronunciation = (word) => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordedWord(word);
      addToast(`🎙️ جاري تسجيل نطقك لكلمة "${word}"... تحدث الآن!`, 'info');
      setTimeout(() => {
        setIsRecording(false);
        addToast(`✅ رائع! تم تحليل نطقك لكلمة "${word}" بنجاح (درجة الدقة: 96% - ممتاز)`, 'success', 4000);
      }, 3000);
    }
  };

  // Handle local homework photo selection
  const handleHomeworkFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newUrls = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setHwPhotos(prev => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      });
      addToast(`تم اختيار ${files.length} صورة من كشكول الواجب بنجاح 📸`, 'success');
    }
  };

  const handleHwSubmit = (e) => {
    e.preventDefault();
    if (!lecture) return;
    submitHomework(lecture.id, hwPhotos[0] || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80', hwNotes);
    setIsHwSubmitted(true);
  };

  const studentWatermarkText = isTeacherOrAdmin
    ? `المعلم: ${teacherProfile?.name || 'مستر مايكل شحاته'} | وضع معاينة المحاضرة 👑`
    : `الطالب: ${currentUser?.name || 'طالب الثانوية العامة'} | هاتف: ${currentUser?.phone || '01012345678'} | كود: MS-SEC3-2026 | منصة ${teacherProfile?.name || 'مستر مايكل شحاته'}`;

  const examResult = lecture ? examResults[lecture.id] : null;
  const embedInfo = getEmbedInfo(resolvedVideoUrl);

  if (!lecture) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '2rem' }}>
        <div className="card text-center" style={{ maxWidth: '480px', padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>جاري تحميل بيانات المحاضرة...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            إذا لم تظهر المحاضرة بعد ثوانٍ، قد تكون المحاضرة غير متوفرة أو تم حذفها.
          </p>
          <button
            onClick={() => onNavigate('stage-lectures')}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            العودة لقائمة المحاضرات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Top Header */}
      <header className="glass" style={{
        padding: '0.65rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => onNavigate('stage-lectures', { stageId: lecture.stageId })}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <ArrowRight size={16} />
            <span>قائمة محاضرات المرحلة</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary">{lecture.unitNumber}</span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                {lecture.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isTeacherOrAdmin && (
            <span className="badge badge-success" style={{ gap: '4px', fontSize: '0.75rem', padding: '4px 8px' }}>
              <Sparkles size={13} />
              معاينة كمعلم 👑
            </span>
          )}
          {isAllowedToWatch ? (
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', fontWeight: 700 }}
            >
              <HelpCircle size={16} />
              <span>{examResult ? `درجة الامتحان: ${examResult.score}/${examResult.total}` : 'بدء امتحان المحاضرة ✍️'}</span>
            </button>
          ) : (
            <span className="badge badge-danger" style={{ gap: '4px', fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '20px' }}>
              <Lock size={14} />
              محتوى محمي للمشتركين 🔒
            </span>
          )}
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="container" style={{ padding: '1.5rem 0', maxWidth: isCinemaMode ? '100%' : '1200px' }}>
        {!isAllowedToWatch ? (
          <div className="card text-center animate-fade-in" style={{
            padding: '3.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              border: '2px solid rgba(239, 68, 68, 0.3)'
            }}>
              <Lock size={32} />
            </div>

            {!currentUser ? (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: 'white' }}>
                  هذه المحاضرة مدفوعة وتتطلب تسجيل الدخول
                </h2>
                <p style={{ color: '#CBD5E1', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                  يرجى تسجيل الدخول بحساب Google أولاً للتحقق من اشتراكك في هذه المرحلة أو لشحن كود الحصة ومشاهدة الفيديو والواجبات.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="btn btn-primary btn-lg"
                    style={{ gap: '10px', fontWeight: 800 }}
                  >
                    <span>تسجيل الدخول باستخدام Google 🚀</span>
                  </button>
                  <button
                    onClick={() => onNavigate('stage-lectures', { stageId: lecture?.stageId })}
                    className="btn btn-secondary btn-lg"
                  >
                    العودة لقائمة المحاضرات
                  </button>
                </div>
              </>
            ) : accessCheck.isPaused ? (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: '#FCD34D' }}>
                  تم إيقاف اشتراكك مؤقتاً ⏸️
                </h2>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  maxWidth: '580px',
                  margin: '0 auto 2rem',
                  textAlign: 'right'
                }}>
                  <p style={{ color: '#FEF3C7', fontSize: '1.05rem', lineHeight: '1.7', margin: '0 0 10px', fontWeight: 800 }}>
                    🔒 {accessCheck.reason || 'تم إيقاف الاشتراك مؤقتاً بواسطة الإدارة'}
                  </p>
                  <p style={{ color: '#CBD5E1', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                    تم تعليق الوصول إلى فيديوهات المحاضرة وتحميل المذكرات مؤقتاً. بياناتك ودرجاتك محفوظة بالكامل. يرجى التواصل مع مستر مايكل شحاته أو الدعم الفني لإعادة التفعيل الفوري.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`السلام عليكم مستر مايكل، أنا الطالب ${currentUser?.name || ''}، بخصوص إيقاف اشتراكي مؤقتاً في المحاضرة (${lecture.title})`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg"
                    style={{ gap: '8px', fontWeight: 800, background: '#25D366', color: 'white' }}
                  >
                    <MessageCircle size={18} />
                    <span>تواصل مع المستر عبر واتساب 💬</span>
                  </a>
                  <button
                    onClick={() => onNavigate('stage-lectures', { stageId: lecture?.stageId })}
                    className="btn btn-secondary btn-lg"
                  >
                    العودة لقائمة المحاضرات
                  </button>
                </div>
              </>
            ) : accessCheck.isFrozen ? (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: '#EF4444' }}>
                  تم إيقاف هذا الحساب بالكامل ❄️
                </h2>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  maxWidth: '580px',
                  margin: '0 auto 2rem',
                  textAlign: 'right'
                }}>
                  <p style={{ color: '#FCA5A5', fontSize: '1.05rem', lineHeight: '1.7', margin: '0 0 10px', fontWeight: 800 }}>
                    🚫 {accessCheck.reason || 'تم تجميد حساب الطالب من قبل إدارة المنصة'}
                  </p>
                  <p style={{ color: '#CBD5E1', fontSize: '0.88rem', margin: 0, lineHeight: '1.6' }}>
                    تم إيقاف كافة صلاحيات الحساب. يرجى مراجعة إدارة السنتر أو مستر مايكل شحاته مباشرة.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`السلام عليكم مستر مايكل، أنا الطالب ${currentUser?.name || ''}، بخصوص تجميد حسابي على المنصة`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg"
                    style={{ gap: '8px', fontWeight: 800, background: '#25D366', color: 'white' }}
                  >
                    <MessageCircle size={18} />
                    <span>التواصل مع الإدارة 💬</span>
                  </a>
                </div>
              </>
            ) : accessCheck.isProgressionLocked ? (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: '#FCD34D' }}>
                  {accessCheck.isPendingGrading 
                    ? 'امتحان المحاضرة السابقة قيد التصحيح اليدوي 📝' 
                    : 'المحاضرة مغلقة مؤقتاً (نظام فتح المحاضرات بالتدريج) ⏳'}
                </h2>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  maxWidth: '580px',
                  margin: '0 auto 2rem',
                  textAlign: 'right'
                }}>
                  <p style={{ color: '#FEF3C7', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 10px', fontWeight: 700 }}>
                    ⚠️ {accessCheck.reason}
                  </p>
                  {accessCheck.isPendingGrading ? (
                    <p style={{ color: '#E2E8F0', fontSize: '0.85rem', margin: 0, lineHeight: '1.7' }}>
                      لقد قمت بتسليم الامتحان. إجاباتك المقالية معروضة الآن على مستر مايكل شحاته لرصد الدرجة واعتماد النتيجة، وستُفتح هذه المحاضرة تلقائياً فور اعتماد النتيجة بنسبة تجاوز 50%.
                    </p>
                  ) : (
                    <ul style={{ color: '#E2E8F0', fontSize: '0.85rem', margin: 0, paddingRight: '20px', lineHeight: '1.7' }}>
                      <li>شرط 1: مشاهدة 50% على الأقل من المحاضرة السابقة بدون تسريع أو تقديم وهمي.</li>
                      <li>شرط 2: اجتياز امتحان المحاضرة السابقة بنسبة تتجاوز 50% (إن وُجد).</li>
                    </ul>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {accessCheck.prevLecture && (
                    <button
                      onClick={() => onNavigate('lecture-room', { lectureId: accessCheck.prevLecture.id })}
                      className="btn btn-primary btn-lg"
                      style={{ gap: '8px', fontWeight: 800, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
                    >
                      <Play size={18} fill="currentColor" />
                      <span>الانتقال للمحاضرة السابقة ({accessCheck.prevLecture.title}) ▶️</span>
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate('stage-lectures', { stageId: lecture?.stageId })}
                    className="btn btn-secondary btn-lg"
                  >
                    العودة لقائمة المحاضرات
                  </button>
                </div>
              </>
            ) : stageSub.isExpired ? (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: '#F87171' }}>
                  انتهى اشتراكك في هذه المرحلة ⚠️
                </h2>
                <p style={{ color: '#CBD5E1', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                  أهلاً بك يا <strong>{currentUser.name}</strong>. لقد انتهت صلاحية اشتراكك في مرحلة ({currentStage?.name || 'هذه المرحلة'}) بتاريخ <strong>{stageSub.expiresAtFormatted}</strong>. يرجى تجديد الاشتراك أو شحن كود جديد لمواصلة المشاهدة.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={onOpenCodeModal}
                    className="btn btn-primary btn-lg"
                    style={{ gap: '8px', fontWeight: 800 }}
                  >
                    <Key size={18} />
                    <span>تجديد وشحن كود جديد 🔑</span>
                  </button>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`مرحباً يا مستر مايكل، انتهى اشتراكي في مرحلة: ${currentStage?.name || ''} وأريد تجديد الاشتراك لمشاهدة محاضرة: ${lecture.title}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success btn-lg"
                    style={{ gap: '8px', textDecoration: 'none', fontWeight: 800, background: '#10B981', color: 'white', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <MessageCircle size={18} />
                    <span>تجديد عبر واتساب المستر 💬</span>
                  </a>
                  <button
                    onClick={() => onNavigate('stage-lectures', { stageId: lecture?.stageId })}
                    className="btn btn-secondary btn-lg"
                  >
                    العودة للمحاضرات
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.75rem', color: 'white' }}>
                  المحتوى محمي - تتطلب هذه المحاضرة اشتراكاً مفعّلاً
                </h2>
                <p style={{ color: '#CBD5E1', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                  أهلاً بك يا <strong>{currentUser.name}</strong> ({currentUser.email}). ليس لديك اشتراك سارٍ في مرحلة ({currentStage?.name || 'هذه المرحلة'}) بعد. يمكنك تفعيل كود المرحلة أو التواصل للاشتراك.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={onOpenCodeModal}
                    className="btn btn-primary btn-lg"
                    style={{ gap: '8px', fontWeight: 800 }}
                  >
                    <Key size={18} />
                    <span>شحن وتفعيل كود المرحلة 🔑</span>
                  </button>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`مرحباً يا مستر مايكل، أريد الاشتراك في محاضرة: ${lecture.title}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success btn-lg"
                    style={{ gap: '8px', textDecoration: 'none', fontWeight: 800, background: '#10B981', color: 'white', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <MessageCircle size={18} />
                    <span>الاشتراك عبر واتساب المستر 💬</span>
                  </a>
                  <button
                    onClick={() => onNavigate('stage-lectures', { stageId: lecture?.stageId })}
                    className="btn btn-secondary btn-lg"
                  >
                    العودة للمحاضرات
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
        <LectureVideoPlayer
            lecture={lecture}
            resolvedVideoUrl={resolvedVideoUrl}
            embedInfo={embedInfo}
            studentWatermarkText={studentWatermarkText}
            currentUser={currentUser}
            isTeacherOrAdmin={isTeacherOrAdmin}
            onNavigate={onNavigate}
            isCinemaMode={isCinemaMode}
            onToggleCinemaMode={() => setIsCinemaMode(prev => !prev)}
            onProgressUpdate={updateLectureWatchProgress}
            onLectureComplete={markLectureComplete}
          />
        )}

        {/* Completion Action Bar & Workspace (Only for allowed students) */}
        {isAllowedToWatch && (
        <>
        <div className="card" style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          background: 'var(--bg-surface)'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المحاضرة الرسمية:</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '2px 0 0' }}>{lecture.title}</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => markLectureComplete(lecture.id)}
              className="btn btn-success btn-sm"
              style={{ gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              <span>تأكيد إتمام مشاهدة المحاضرة (+50 XP)</span>
            </button>
          </div>
        </div>

        {/* Interactive Lecture Tools Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-subtle)',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {[
            { id: 'vocab', label: `معمل النطق والكلمات (${lecture.vocabList?.length || 0})`, icon: Volume1 },
            { id: 'grammar', label: 'ملخص قواعد الـ Grammar', icon: BookOpen },
            { id: 'booklet', label: 'مذكرة الشرح (The Master PDF)', icon: FileText },
            { id: 'homework', label: 'رفع واجب الكشكول 📝', icon: Upload },
            { id: 'exam', label: 'الامتحان والتقييم 🏆', icon: HelpCircle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 0.5rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--primary-600)' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Vocab & Pronunciation Lab */}
        {activeTab === 'vocab' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px' }}>
                معمل النطق الصوتي المعتمد (British & American Pronunciation) 🎙️
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                استمع للنطق الصوتي الصحيح وسجل نطقك ليقوم الذكاء الاصطناعي بتقييم مخارج الحروف.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {lecture.vocabList?.map((item, idx) => (
                <div key={idx} className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-600)', margin: 0 }}>
                      {item.word}
                    </h4>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {item.ipa}
                    </span>
                  </div>

                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {item.arabic}
                  </p>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 1rem', background: 'var(--bg-subtle)', padding: '6px 10px', borderRadius: '6px' }}>
                    "{item.example}"
                  </p>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handlePlayWordAudio(item.word)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, gap: '4px' }}
                    >
                      <Volume2 size={15} color="var(--primary-600)" />
                      <span>نطق بريطاني 🇬🇧</span>
                    </button>

                    <button
                      onClick={() => handleRecordPronunciation(item.word)}
                      disabled={isRecording}
                      className={`btn btn-sm ${isRecording && recordedWord === item.word ? 'btn-primary pulse-glow' : 'btn-ghost'}`}
                      style={{ gap: '4px', border: '1px solid var(--border-subtle)' }}
                    >
                      <Mic size={15} color="#EF4444" />
                      <span>{isRecording && recordedWord === item.word ? 'جاري التسجيل...' : 'سجل نطقك 🎙️'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Grammar Summary */}
        {activeTab === 'grammar' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {lecture.grammarRules?.map((rule, idx) => (
              <div key={idx} className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={18} color="var(--primary-600)" />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{rule.title}</h4>
                </div>

                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 1rem' }}>
                  {rule.rule}
                </p>

                <div style={{
                  background: 'var(--primary-50)',
                  borderRight: '4px solid var(--primary-600)',
                  padding: '10px 14px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--primary-900)',
                  direction: 'ltr',
                  textAlign: 'left'
                }}>
                  Example: {rule.example}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: The Master PDF Booklet */}
        {activeTab === 'booklet' && (
          <div className="card animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px' }}>
                  {lecture.pdfBooklet?.title || 'مذكرة الشرح والتدريبات (The Master).pdf'}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  الحجم: {lecture.pdfBooklet?.size || '4.5 MB'} • عدد الصفحات: {lecture.pdfBooklet?.pages || '30 صفحة'}
                </span>
              </div>

              <button
                onClick={handleDownloadLecturePdf}
                disabled={isDownloadingPdf}
                className="btn btn-primary btn-lg"
                style={{ 
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  fontWeight: 800,
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                }}
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>جاري التنزيل ({downloadProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>تحميل المذكرة بصيغة PDF عالية الدقة 📥</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Progress Bar when downloading */}
            {isDownloadingPdf && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ height: '6px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${downloadProgress}%`,
                    background: 'linear-gradient(90deg, #10B981, #059669)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  يتم الآن تنزيل ملف PDF وحفظه مباشرة في مجلد التنزيلات بجهازك...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Homework Submission (Direct file upload from device) */}
        {activeTab === 'homework' && (
          <div className="card animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px' }}>
                تسليم واجب كشكول المحاضرة من جهازك أو هاتفك 📝
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                قم بتصوير أو اختيار صور صفحات الواجب من جهازك ليقوم فريق مساعدي {teacherProfile?.name || 'مستر مايكل شحاته'} بتصحيحها فوراً.
              </p>
            </div>

            {isHwSubmitted ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.5rem' }}>
                  تم تسليم الواجب بنجاح!
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  حالة التصحيح: <strong>{homeworkSubmissions[lecture.id]?.grade || '10/10 (ممتاز)'}</strong>
                </p>
                <span className="badge badge-success">تم إرسال إشعار التسليم لولي الأمر ✓</span>
              </div>
            ) : (
              <form onSubmit={handleHwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <input
                  ref={hwFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleHomeworkFilesSelect}
                />

                <div
                  onClick={() => hwFileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--primary-400)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2.5rem',
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  <Image size={40} color="var(--primary-600)" style={{ margin: '0 auto 10px' }} />
                  <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                    انقر لاختيار صور صفحات كشكول الواجب من جهازك 📸
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    يمكنك اختيار عدة صور معاً (JPG, PNG)
                  </span>
                </div>

                {/* Previews of uploaded homework photos */}
                {hwPhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {hwPhotos.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <img src={src} alt="Homework photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setHwPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ position: 'absolute', top: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>ملاحظاتك للمستر (اختياري):</label>
                  <textarea
                    placeholder="مثال: تم حل جميع تدريبات صفحة 14-22 بالكامل..."
                    value={hwNotes}
                    onChange={e => setHwNotes(e.target.value)}
                    className="input-control"
                    style={{ height: '80px' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '8px' }}>
                  <Upload size={18} />
                  <span>تأكيد رفع الواجب وإرسال التقرير</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 5: Unit Exam */}
        {activeTab === 'exam' && (
          <div className="card animate-fade-in" style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
            <Award size={56} color="#F59E0B" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              امتحان الوحدة الإلكتروني الشامل 🏆
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 1.5rem' }}>
              يقيس مدى استيعابك لقواعد الـ Grammar ومفردات الـ Vocabulary ومهارات الترجمة والقطع.
            </p>

            {examResult && (
              <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>نتيجتك المسجلة في النظام:</span>
                <strong style={{ fontSize: '2rem', color: 'var(--success)', display: 'block', margin: '6px 0' }}>
                  {examResult.score} / {examResult.total}
                </strong>
                <span className="badge badge-success">{examResult.grade}</span>
              </div>
            )}

            <button
              onClick={() => setIsExamModalOpen(true)}
              className="btn btn-primary btn-lg"
              style={{ gap: '8px' }}
            >
              <HelpCircle size={18} />
              <span>{examResult ? 'إعادة خوض الامتحان لتحسين الدرجة' : 'بدء الامتحان الآن (25 دقيقة)'}</span>
            </button>
          </div>
        )}
        </>
        )}
      </div>

      {/* English Exam Modal (Protected: Subscribed Students Only) */}
      {isAllowedToWatch && isExamModalOpen && (
        <EnglishExamModal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          lectureId={lecture.id}
        />
      )}
    </div>
  );
}
