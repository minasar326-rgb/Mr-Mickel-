import React, { useState, useRef, useEffect } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import CertificateModal from '../student/CertificateModal';
import EnglishExamModal from '../student/EnglishExamModal';
import { 
  Upload, Key, Users, BookOpen, Video, FileText, CheckCircle2, 
  Send, MessageCircle, Plus, Copy, Sparkles, Bell, Trophy, Shield, 
  Trash2, Edit, Settings, RotateCcw, UserCheck, Eye, HelpCircle, 
  DollarSign, CreditCard, AlertCircle, Phone, Search, Filter, Printer, 
  QrCode, Lock, Unlock, ArrowUpRight, Check, X, Image, Film, FileUp,
  Award, ScanLine, ShieldCheck, ShieldAlert, Activity, Flame, Cloud,
  Database, HardDrive, RefreshCw, KeyRound, Smartphone, Download,
  Pause, Play, Calendar, UserX, AlertTriangle, ArrowUp, ArrowDown, CheckSquare, Square
} from 'lucide-react';
import { uploadFileToFirebaseStorage } from '../../services/firestoreSync';
import { uploadFileToR2, uploadTeacherAvatarToR2, uploadAppIconToR2 } from '../../services/r2Storage';
import { saveMediaFilePermanently, updateMediaCloudUrl } from '../../services/persistentStorage';
import { generatePlatformIconsSuite, generateMasterIconCanvas, loadImage } from '../../services/iconGenerator';
import ChangePasswordModal from './ChangePasswordModal';
import TeacherAvatar3D from '../common/TeacherAvatar3D';
import { dispatchExternalNotification } from '../../services/pushNotificationService';

export default function TeacherAdminCenter({ onNavigate }) {
  const { 
    teacherProfile, stages, lectures, booklets, topAchievers, accessCodes, students, announcements,
    sections, addSection, updateSection, deleteSection, moveLectureToSection,
    transactions, recordTransaction, toggleCodeStatus,
    addStudent, updateStudent, deleteStudent, toggleStudentStatus, recordPayment,
    generatePaymentReminderWhatsApp, generateStudentReceiptWhatsApp, generateParentWhatsAppReport,
    updateTeacherProfile, uploadNewLecture, updateLecture, deleteLecture,
    addStage, deleteStage,
    addBooklet, deleteBooklet,
    addAchiever, deleteAchiever,
    generateNewCode, deleteCode,
    postAnnouncement, deleteAnnouncement,
    overrideUnlockLecture, revokeOverrideLecture, manualOverrides,
    examsData, examSubmissions, subscriptionAuditLogs,
    generalExams, generalExamCodes, saveGeneralExam, deleteGeneralExam,
    generateGeneralExamCode, bulkGenerateGeneralExamCodes, resetGeneralExamAttempt, cancelGeneralExamCode,
    saveExamToLecture, deleteExamFromLecture, gradeManualExamSubmission,
    pauseStudentSubscription, resumeStudentSubscription, extendStudentSubscription,
    cancelStudentSubscription, toggleStudentFreeze, bulkUpdateSubscriptions,
    resetToFactoryDefaults,
    syncAllToFirebase,
    changeTeacherPassword
  } = useTeacher();
  const { addToast } = useToast();

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('lectures'); 
  // 'sections' | 'lectures' | 'subscriptions' | 'exams' | 'security' | 'students' | 'finance' | 'profile' | 'stages' | 'booklets' | 'achievers' | 'codes' | 'broadcast'

  // Student Search & Filter
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [selectedPayFilter, setSelectedPayFilter] = useState('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Add New Student Form State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [stdName, setStdName] = useState('');
  const [stdPhone, setStdPhone] = useState('');
  const [stdParentPhone, setStdParentPhone] = useState('');
  const [stdParentName, setStdParentName] = useState('');
  const [stdStageId, setStdStageId] = useState(stages[0]?.id || 'sec-3');
  const [stdGroupType, setStdGroupType] = useState('center');
  const [stdCenterName, setStdCenterName] = useState('سنتر النخبة (الدقي)');
  const [stdMonthlyFee, setStdMonthlyFee] = useState('250');
  const [stdPaidAmount, setStdPaidAmount] = useState('250');
  const [stdPayMethod, setStdPayMethod] = useState('فودافون كاش');
  const [stdNotes, setStdNotes] = useState('');
  const [stdAvatarPreview, setStdAvatarPreview] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');

  // Modals States
  const [activeCardStudent, setActiveCardStudent] = useState(null);
  const [activePaymentStudent, setActivePaymentStudent] = useState(null);
  const [activeProfileStudent, setActiveProfileStudent] = useState(null);
  const [activeReportStudent, setActiveReportStudent] = useState(null);
  const [activeReminderStudent, setActiveReminderStudent] = useState(null);
  const [activeCertificateStudent, setActiveCertificateStudent] = useState(null);

  // Sections (Months & Courses) Form State
  const [newSecStageId, setNewSecStageId] = useState(stages[0]?.id || 'sec-3');
  const [newSecType, setNewSecType] = useState('month'); // 'month' | 'course'
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecMonthNumber, setNewSecMonthNumber] = useState('1');
  const [newSecPrice, setNewSecPrice] = useState('180');
  const [newSecDesc, setNewSecDesc] = useState('');
  const [newSecCover, setNewSecCover] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
  const [newSecIsVisible, setNewSecIsVisible] = useState(true);
  const [selectedSectionStageFilter, setSelectedSectionStageFilter] = useState('all');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const sectionCoverInputRef = useRef(null);

  // Lecture Section Assignment State
  const [lectureSectionId, setLectureSectionId] = useState('');

  // Treasury Filter State
  const [txFilterMethod, setTxFilterMethod] = useState('all');

  // Security Suite State
  const [securitySettings, setSecuritySettings] = useState({
    antiDevTools: true,
    antiScreenRecord: true,
    dynamicWatermark: true,
    antiRightClick: true,
    examCopyBlock: true
  });

  // Payment Recording Form inside modal
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payMethodInput, setPayMethodInput] = useState('فودافون كاش (Vodafone Cash)');
  const [payNotesInput, setPayNotesInput] = useState('');

  // Profile Form State
  const [profileName, setProfileName] = useState(teacherProfile.name || '');
  const [profileTitle, setProfileTitle] = useState(teacherProfile.title || '');
  const [profileSubtitle, setProfileSubtitle] = useState(teacherProfile.subtitle || '');
  const [profileBio, setProfileBio] = useState(teacherProfile.aboutBio || '');
  const [profileWhatsapp, setProfileWhatsapp] = useState(teacherProfile.whatsappNumber || '');
  const [profileAvatar, setProfileAvatar] = useState(teacherProfile.avatar || '');
  const [profileStudents, setProfileStudents] = useState(teacherProfile.totalStudents || 18500);
  const [profileWelcomeBadge, setProfileWelcomeBadge] = useState(teacherProfile.welcomeBadge || 'المنصة التعليمية الرسمية • ابتدائي وإعدادي وثانوي 🇬🇧');
  const [profileHeroSlogan, setProfileHeroSlogan] = useState(teacherProfile.heroSlogan || 'الدرجة النهائية في الإنجليزي مضمونة 🎯');
  const [profileHeroDescription, setProfileHeroDescription] = useState(teacherProfile.heroDescription || 'المنصة التعليمية الرسمية لمستر مايكل شحاتة لطلاب المرحلة الابتدائية والإعدادية والثانوية: شرح مبسط ومنظم، فيديوهات تعليمية، تدريبات مكثفة، بنوك أسئلة، اختبارات دورية ومتابعة شاملة للطلاب.');
  const [profileStatBadgeNumber, setProfileStatBadgeNumber] = useState(teacherProfile.statBadgeNumber || '+1,420 طالب');
  const [profileStatBadgeText, setProfileStatBadgeText] = useState(teacherProfile.statBadgeText || 'الدرجة النهائية 50/50 في الثانوية');
  const [profileSupportBadgeTitle, setProfileSupportBadgeTitle] = useState(teacherProfile.supportBadgeTitle || 'دعم ومتابعة أسبوعية');
  const [profileSupportBadgeText, setProfileSupportBadgeText] = useState(teacherProfile.supportBadgeText || 'تقارير واتساب مباشرة لأولياء الأمور');
  const [appIconPreview, setAppIconPreview] = useState(null);
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);

  // Automatically generate live App Icon preview whenever profileAvatar changes
  useEffect(() => {
    let active = true;
    if (profileAvatar) {
      loadImage(profileAvatar)
        .then(img => {
          if (!active) return;
          const canvas = generateMasterIconCanvas(img, 192, false);
          setAppIconPreview(canvas.toDataURL('image/png'));
        })
        .catch(err => {
          console.warn('Icon preview generation error:', err);
        });
    }
    return () => { active = false; };
  }, [profileAvatar]);

  // Lecture Form State
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [stageId, setStageId] = useState(stages[0]?.id || 'sec-3');
  const [unitNumber, setUnitNumber] = useState('Unit 4');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isFreeLecture, setIsFreeLecture] = useState(false);
  const [lecturePrice, setLecturePrice] = useState('70 ج.م');
  const [videoSourceType, setVideoSourceType] = useState('file'); // 'file' | 'url'
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoFileSize, setVideoFileSize] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [duration, setDuration] = useState('1:40:00');
  const [thumbnailPreview, setThumbnailPreview] = useState('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80');
  const [pdfTitle, setPdfTitle] = useState('مذكرة The Master الشاملة - الوحدة 4.pdf');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Optional Lecture Exam Builder State
  const [hasLectureExam, setHasLectureExam] = useState(true);
  const [lectureExamDuration, setLectureExamDuration] = useState(25);
  const [lectureExamPassMarks, setLectureExamPassMarks] = useState(14);
  const [lectureExamTotalMarks, setLectureExamTotalMarks] = useState(20);
  const [lectureExamMaxAttempts, setLectureExamMaxAttempts] = useState(2);
  const [lectureExamQuestions, setLectureExamQuestions] = useState([
    {
      id: "q-1",
      type: "mcq",
      question: "Choose the correct answer based on the grammar rule taught in this lecture:",
      options: ["Option A (Correct)", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      points: 4,
      explanation: "نموذج إجابة وتوضيح القاعدة."
    },
    {
      id: "q-2",
      type: "tf",
      question: "Online piracy and unauthorized sharing of content is strictly illegal under international law.",
      options: ["True (صحيح)", "False (خطأ)"],
      correctAnswer: 0,
      points: 4,
      explanation: "القرصنة وانتهاك حقوق الطبع والنشر مجرم قانونياً."
    }
  ]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [localMediaKey, setLocalMediaKey] = useState(null);
  const [uploadDetails, setUploadDetails] = useState({
    percent: 0,
    transferredMB: '0',
    totalMB: '0',
    isCloudReady: false,
    localSaved: false
  });

  // Stage Form State
  const [newStageName, setNewStageName] = useState('');
  const [newStageBadge, setNewStageBadge] = useState('دفعة 2026 🔥');
  const [newStageDesc, setNewStageDesc] = useState('');
  const [newStagePrice, setNewStagePrice] = useState('200 ج.م');

  // Booklet Form State
  const [newBkTitle, setNewBkTitle] = useState('');
  const [newBkPages, setNewBkPages] = useState('50 صفحة');
  const [newBkSize, setNewBkSize] = useState('8 MB');
  const [newBkCoverPreview, setNewBkCoverPreview] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
  const [newBkFile, setNewBkFile] = useState(null);
  const [newBkDownloadUrl, setNewBkDownloadUrl] = useState('');
  const [newBkFileSize, setNewBkFileSize] = useState('');
  const [isUploadingBk, setIsUploadingBk] = useState(false);

  // Achiever Form State
  const [newAchName, setNewAchName] = useState('');
  const [newAchStageId, setNewAchStageId] = useState(stages[0]?.id || 'sec-3');
  const [newAchScore, setNewAchScore] = useState('50 / 50 (الدرجة النهائية)');
  const [newAchSchool, setNewAchSchool] = useState('ثانوية المتفوقين');
  const [newAchBadge, setNewAchBadge] = useState('🥇 أوائل الجمهورية');
  const [newAchAvatarPreview, setNewAchAvatarPreview] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');

  // Filters for Admin views
  const [lectureStageFilter, setLectureStageFilter] = useState('all');
  const [achieverStageFilter, setAchieverStageFilter] = useState('all');

  // Code Generator State (4 types: Month, Lecture, Course, Bundle)
  const [genCodeStageId, setGenCodeStageId] = useState(stages[0]?.id || 'sec-3');
  const [genCodeType, setGenCodeType] = useState('month'); // 'month' | 'lecture' | 'course' | 'bundle'
  const [genCodeTargetId, setGenCodeTargetId] = useState('');
  const [genCodePrice, setGenCodePrice] = useState('180');
  const [genCodeDuration, setGenCodeDuration] = useState('30'); // '7' | '15' | '30' | '60' | '120' | '365'
  const [genCodeExpiryDate, setGenCodeExpiryDate] = useState('');
  const [genCodeMaxUses, setGenCodeMaxUses] = useState(1);
  const [genCodeIsGift, setGenCodeIsGift] = useState(false);
  const [genCodeCustomCode, setGenCodeCustomCode] = useState('');
  const [genCodeBundleItems, setGenCodeBundleItems] = useState([]);
  const [codeFilterType, setCodeFilterType] = useState('all');

  // Broadcast State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annAudience, setAnnAudience] = useState('all'); // 'all' | 'stage' | 'student'
  const [annTargetStage, setAnnTargetStage] = useState('sec-3');
  const [annTargetStudent, setAnnTargetStudent] = useState('');
  const [annSendAsPush, setAnnSendAsPush] = useState(true);

  // -------------------------------------------------------------
  // Student Subscriptions State (التحكم في اشتراكات الطلاب)
  // -------------------------------------------------------------
  const [subSearch, setSubSearch] = useState('');
  const [subStageFilter, setSubStageFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [selectedSubStudentIds, setSelectedSubStudentIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('pause'); // 'pause' | 'resume' | 'extend'
  const [bulkActionReason, setBulkActionReason] = useState('إيقاف مؤقت من الإدارة');
  const [bulkActionDays, setBulkActionDays] = useState(30);

  const [activePauseStudent, setActivePauseStudent] = useState(null);
  const [pauseReasonInput, setPauseReasonInput] = useState('تأخر في سداد القسط الثاني');
  const [activeExtendStudent, setActiveExtendStudent] = useState(null);
  const [extendDaysInput, setExtendDaysInput] = useState(30);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // -------------------------------------------------------------
  // Manual Exam Builder & Grading State (إنشاء الامتحانات والتصحيح)
  // -------------------------------------------------------------
  const [examsSubTab, setExamsSubTab] = useState('list'); // 'list' | 'grading' | 'general'
  const [isExamBuilderOpen, setIsExamBuilderOpen] = useState(false);
  const [editingExamLectureId, setEditingExamLectureId] = useState('');
  const [bldIsGeneralExam, setBldIsGeneralExam] = useState(false);
  const [bldExamStageId, setBldExamStageId] = useState('sec-3');
  const [bldExamTitle, setBldExamTitle] = useState('');
  const [bldExamDuration, setBldExamDuration] = useState(25);
  const [bldExamTotalMarks, setBldExamTotalMarks] = useState(20);
  const [bldExamPassMarks, setBldExamPassMarks] = useState(10);
  const [bldExamMaxAttempts, setBldExamMaxAttempts] = useState(2);
  const [bldExamShowResult, setBldExamShowResult] = useState(true);
  const [bldExamShowCorrectAnswers, setBldExamShowCorrectAnswers] = useState(true);
  const [bldExamIsDraft, setBldExamIsDraft] = useState(false);
  const [bldExamQuestions, setBldExamQuestions] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewExamPayload, setPreviewExamPayload] = useState(null);

  // General Exam Codes Management State
  const [genExamCodeSearch, setGenExamCodeSearch] = useState('');
  const [genExamCodeStageFilter, setGenExamCodeStageFilter] = useState('all');
  const [genExamCodeExamFilter, setGenExamCodeExamFilter] = useState('all');
  const [genExamCodeStatusFilter, setGenExamCodeStatusFilter] = useState('all');
  const [selectedGenExamIdForCode, setSelectedGenExamIdForCode] = useState('');
  const [selectedGenStudentForCode, setSelectedGenStudentForCode] = useState('');
  const [customGenStudentName, setCustomGenStudentName] = useState('');
  const [customGenStudentStage, setCustomGenStudentStage] = useState('sec-3');
  const [selectedGenStageForBulk, setSelectedGenStageForBulk] = useState('sec-3');
  const [viewingSubmissionsExamId, setViewingSubmissionsExamId] = useState(null);

  // Manual Grading Queue State
  const [activeGradingItem, setActiveGradingItem] = useState(null);
  const [manualQuestionScores, setManualQuestionScores] = useState({});
  const [gradingTeacherNotes, setGradingTeacherNotes] = useState('');
  const [examQImageInputIdx, setExamQImageInputIdx] = useState(null);
  const examQImageInputRef = useRef(null);
  const examOptImageInputRef = useRef(null);
  const [activeOptUploadTarget, setActiveOptUploadTarget] = useState({ qIdx: 0, optIdx: 0 });

  // Refs for hidden file inputs
  const videoFileInputRef = useRef(null);
  const thumbnailFileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);
  const profileAvatarInputRef = useRef(null);
  const bookletCoverInputRef = useRef(null);
  const bookletPdfFileInputRef = useRef(null);
  const studentAvatarInputRef = useRef(null);
  const achieverAvatarInputRef = useRef(null);

  // -------------------------------------------------------------
  // File Upload Handlers (Reading from local device + Cloud Sync)
  // -------------------------------------------------------------
  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(5);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setVideoFileName(file.name);
    setVideoFileSize(`${sizeMB} MB`);
    setUploadDetails({
      percent: 5,
      transferredMB: '0',
      totalMB: sizeMB,
      isCloudReady: false,
      localSaved: false
    });

    // 1. Immediate local playable preview
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);
    // videoUrl is kept empty until cloud upload completes to prevent temporary blob URLs from being saved
    setVideoUrl('');

    // Compute duration from video
    const tempVideo = document.createElement('video');
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const totalSecs = Math.floor(tempVideo.duration);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      const durStr = hours > 0 
        ? `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
        : `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      setDuration(durStr);
    };

    // 2. Save directly & permanently to browser's IndexedDB
    const mediaKey = `media_video_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    setLocalMediaKey(mediaKey);
    try {
      await saveMediaFilePermanently(mediaKey, file, { name: file.name });
      setUploadDetails(prev => ({ ...prev, localSaved: true }));
      addToast(`تم تأمين وحفظ الفيديو داخل قاعدة البيانات الدائمة بنجاح! 💾 (جاهز للنشر فوراً)`, 'success');
    } catch (err) {
      console.warn('Local permanent store notice:', err);
    }

    // 3. High-Speed Upload to Cloudflare R2 (Unlimited Bandwidth & Storage)
    uploadFileToR2(file, 'lectures/videos', (prog) => {
      setUploadDetails(prev => ({
        ...prev,
        percent: prog.percent,
        transferredMB: prog.transferredMB,
        totalMB: prog.totalMB
      }));
      setUploadProgress(prog.percent);
    }).then(async (res) => {
      if (res && res.downloadUrl) {
        setVideoUrl(res.downloadUrl);
        setVideoPreviewUrl(res.downloadUrl);
        setIsUploading(false);
        setUploadProgress(100);
        setUploadDetails(prev => ({ ...prev, percent: 100, isCloudReady: true }));
        await updateMediaCloudUrl(mediaKey, res.downloadUrl);
        addToast(`✅ تم حفظ وتأمين فيديو المحاضرة بنجاح على السحابة التعليمية! ☁️🎬`, 'success', 5000);
      }
    }).catch((r2Err) => {
      console.warn('Cloudflare R2 notice, trying Firebase fallback:', r2Err);
      // Fallback to Firebase Storage
      uploadFileToFirebaseStorage(file, 'lectures/videos', (prog) => {
        setUploadDetails(prev => ({
          ...prev,
          percent: prog.percent,
          transferredMB: prog.transferredMB,
          totalMB: prog.totalMB
        }));
        setUploadProgress(prog.percent);
      }).then(async (res) => {
        if (res && res.downloadUrl) {
          setVideoUrl(res.downloadUrl);
          setVideoPreviewUrl(res.downloadUrl);
          setIsUploading(false);
          setUploadProgress(100);
          setUploadDetails(prev => ({ ...prev, percent: 100, isCloudReady: true }));
          await updateMediaCloudUrl(mediaKey, res.downloadUrl);
          addToast(`✅ تم رفع وحفظ الفيديو سحابياً بنجاح! ☁️`, 'success', 5000);
        }
      }).catch((cloudErr) => {
        console.warn('Cloud storage fallback notice:', cloudErr);
        setIsUploading(false);
        setUploadDetails(prev => ({ ...prev, isCloudReady: false, cloudNotice: true }));
      });
    });
  };

  const handleImageFileChange = (e, setter, label = 'الصورة') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target.result);
        addToast(`تم رفع ${label} من جهازك بنجاح 🖼️`, 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfFile(file);
    setPdfTitle(file.name);
    setIsUploadingPdf(true);
    addToast(`جاري رفع ملف المذكرة (${file.name}) وتأمينه سحابياً... 📄⚡`, 'info');

    try {
      const res = await uploadFileToR2(file, 'lectures/pdfs');
      if (res && res.downloadUrl) {
        setPdfDownloadUrl(res.downloadUrl);
        addToast(`✅ تم رفع المذكرة (${file.name}) بنجاح وجاهزة للتنزيل الفوري!`, 'success', 4000);
      }
    } catch (err) {
      console.warn('Lecture PDF R2 upload notice:', err);
      addToast(`تم حفظ المذكرة (${file.name}) محلياً وجاري مزامنتها تلقائياً`, 'info');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleBookletPdfFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setNewBkFile(file);
    setNewBkFileSize(`${sizeMB} MB`);
    if (!newBkTitle.trim()) {
      setNewBkTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    setIsUploadingBk(true);
    addToast(`جاري حفظ وتأمين ملف المذكرة (${file.name}) على السحابة التعليمية... 📄☁️`, 'info');

    try {
      const res = await uploadFileToR2(file, 'booklets/pdfs');
      if (res && res.downloadUrl) {
        setNewBkDownloadUrl(res.downloadUrl);
        setIsUploadingBk(false);
        addToast(`✅ تم رفع وتأمين ملف المذكرة (${file.name}) بنجاح وجاهز للتحميل السحابي! 📚`, 'success', 5000);
      }
    } catch (err) {
      console.warn('Booklet R2 upload notice:', err);
      setIsUploadingBk(false);
      setNewBkDownloadUrl('');
      addToast(`تعذر رفع ملف المذكرة سحابياً، يرجى إعادة المحاولة ⚠️`, 'error');
    }
  };

  // -------------------------------------------------------------
  // Section (Months & Courses) Handlers
  // -------------------------------------------------------------
  const handleSaveSection = (e) => {
    e.preventDefault();
    if (!newSecTitle.trim()) {
      addToast('يرجى كتابة عنوان الشهر أو الكورس', 'error');
      return;
    }
    const stageObj = stages.find(s => s.id === newSecStageId) || stages[0];
    if (editingSectionId) {
      updateSection(editingSectionId, {
        stageId: newSecStageId,
        stageName: stageObj?.name || 'المرحلة الدراسية',
        type: newSecType,
        monthNumber: newSecType === 'month' ? Number(newSecMonthNumber) : undefined,
        title: newSecTitle,
        description: newSecDesc,
        price: Number(newSecPrice) || 0,
        cover: newSecCover,
        isVisible: newSecIsVisible
      });
      setEditingSectionId(null);
    } else {
      addSection({
        stageId: newSecStageId,
        stageName: stageObj?.name || 'المرحلة الدراسية',
        type: newSecType,
        monthNumber: newSecType === 'month' ? Number(newSecMonthNumber) : undefined,
        title: newSecTitle,
        description: newSecDesc,
        price: Number(newSecPrice) || 0,
        cover: newSecCover,
        isVisible: newSecIsVisible
      });
    }
    setNewSecTitle('');
    setNewSecDesc('');
  };

  // -------------------------------------------------------------
  // Treasury & Financial Computations (Strictly Paid Redeemed Codes - No Unintegrated Online/Unused/Gift)
  // -------------------------------------------------------------
  const paidRedeemedCodesTransactions = transactions.filter(t => t.paymentMethod === 'code' && !t.isGift && t.status === 'completed');
  const totalCollectedRevenue = paidRedeemedCodesTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const codesRevenue = totalCollectedRevenue;
  const totalPaidCodesCount = paidRedeemedCodesTransactions.length;
  const giftCodesCount = transactions.filter(t => t.isGift).length;
  const totalPendingDues = students.reduce((sum, s) => sum + (Number(s.finance?.dueAmount) || 0), 0);
  const totalExpectedRevenue = totalCollectedRevenue + totalPendingDues;
  const collectionRate = totalExpectedRevenue > 0 ? Math.round((totalCollectedRevenue / totalExpectedRevenue) * 100) : 100;

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.phone.includes(studentSearch) ||
      (s.code && s.code.toLowerCase().includes(studentSearch.toLowerCase()));
    const matchStage = selectedStageFilter === 'all' || s.stageId === selectedStageFilter;
    const matchPay = selectedPayFilter === 'all' || s.finance?.paymentStatus === selectedPayFilter;
    const matchGroup = selectedGroupFilter === 'all' || s.groupType === selectedGroupFilter;

    return matchSearch && matchStage && matchPay && matchGroup;
  });

  // -------------------------------------------------------------
  // Comprehensive Student Subscriptions Computations & Handlers
  // -------------------------------------------------------------
  const allStudentSubscriptions = [];
  (students || []).forEach(std => {
    const userSubs = std.subscriptions || {};
    const subKeys = Object.keys(userSubs);
    if (subKeys.length === 0) {
      const defaultTargetId = `${std.stageId || 'sec-3'}-month-1`;
      allStudentSubscriptions.push({
        studentId: std.id,
        studentCode: std.code,
        studentName: std.name,
        studentPhone: std.phone,
        parentPhone: std.parentPhone,
        avatar: std.avatar,
        stageId: std.stageId,
        stageName: std.stageName,
        targetId: defaultTargetId,
        targetTitle: `الشهر الأول: ${std.stageName || 'المرحلة الدراسية'}`,
        targetType: 'month',
        activationCode: 'MS-SEC3-2026',
        startDate: std.joinedDate || '2026-08-01',
        expirationDate: '2026-11-01',
        status: std.isFrozen ? 'frozen' : (std.finance?.paymentStatus === 'unpaid' ? 'paused' : 'active'),
        paidAmount: std.finance?.paidAmount || 250,
        isFrozen: std.isFrozen,
        pauseReason: std.finance?.paymentStatus === 'unpaid' ? 'تأخر في السداد' : ''
      });
    } else {
      subKeys.forEach(tId => {
        const sub = userSubs[tId];
        if (!sub) return;
        const now = Date.now();
        const expTime = sub.expirationDate || sub.expiresAt ? new Date(sub.expirationDate || sub.expiresAt).getTime() : now + 30 * 86400000;
        const isExp = expTime < now;
        const status = std.isFrozen 
          ? 'frozen' 
          : (sub.status === 'paused' || sub.isPaused ? 'paused' : (sub.status === 'cancelled' ? 'cancelled' : (isExp ? 'expired' : 'active')));

        allStudentSubscriptions.push({
          studentId: std.id,
          studentCode: std.code,
          studentName: std.name,
          studentPhone: std.phone,
          parentPhone: std.parentPhone,
          avatar: std.avatar,
          stageId: std.stageId,
          stageName: std.stageName,
          targetId: tId,
          targetTitle: sub.targetTitle || `اشتراك ${tId}`,
          targetType: sub.targetType || sub.type || 'month',
          activationCode: sub.activationCode || sub.codeUsed || 'كود شحن مباشر',
          startDate: sub.startDate || sub.activatedAt || std.joinedDate || '2026-08-01',
          expirationDate: sub.expirationDate || sub.expiresAt || '2026-11-01',
          status,
          paidAmount: sub.paidAmount !== undefined ? sub.paidAmount : (std.finance?.paidAmount || 250),
          isFrozen: std.isFrozen,
          pauseReason: sub.pauseReason || ''
        });
      });
    }
  });

  const filteredSubscriptions = allStudentSubscriptions.filter(sub => {
    const matchSearch = (sub.studentName || '').toLowerCase().includes(subSearch.toLowerCase()) ||
      (sub.studentPhone || '').includes(subSearch) ||
      (sub.studentCode || '').toLowerCase().includes(subSearch.toLowerCase()) ||
      (sub.activationCode || '').toLowerCase().includes(subSearch.toLowerCase()) ||
      (sub.targetTitle || '').toLowerCase().includes(subSearch.toLowerCase());
    const matchStage = subStageFilter === 'all' || sub.stageId === subStageFilter;
    const matchStatus = subStatusFilter === 'all' || sub.status === subStatusFilter;
    return matchSearch && matchStage && matchStatus;
  });

  const activeSubCount = allStudentSubscriptions.filter(s => s.status === 'active').length;
  const pausedSubCount = allStudentSubscriptions.filter(s => s.status === 'paused').length;
  const expiredSubCount = allStudentSubscriptions.filter(s => s.status === 'expired').length;
  const frozenSubCount = allStudentSubscriptions.filter(s => s.status === 'frozen').length;

  // Bulk Subscriptions Handlers
  const handleToggleSelectSubStudent = (stdId) => {
    setSelectedSubStudentIds(prev => 
      prev.includes(stdId) ? prev.filter(id => id !== stdId) : [...prev, stdId]
    );
  };

  const handleSelectAllSubscriptions = () => {
    if (selectedSubStudentIds.length === filteredSubscriptions.length) {
      setSelectedSubStudentIds([]);
    } else {
      setSelectedSubStudentIds(filteredSubscriptions.map(s => s.studentId));
    }
  };

  const handleOpenBulkModal = (type) => {
    if (selectedSubStudentIds.length === 0) {
      addToast('يرجى تحديد طالب واحد على الأقل أولاً لتنفيذ الإجراء الجماعي', 'warning');
      return;
    }
    setBulkActionType(type);
    setIsBulkModalOpen(true);
  };

  const handleConfirmBulkAction = () => {
    if (bulkActionType === 'pause') {
      bulkUpdateSubscriptions(selectedSubStudentIds, 'pause', { reason: bulkActionReason });
    } else if (bulkActionType === 'resume') {
      bulkUpdateSubscriptions(selectedSubStudentIds, 'resume');
    } else if (bulkActionType === 'extend') {
      bulkUpdateSubscriptions(selectedSubStudentIds, 'extend', { days: Number(bulkActionDays) || 30 });
    }
    setIsBulkModalOpen(false);
    setSelectedSubStudentIds([]);
  };

  const handleOpenPauseModal = (subItem) => {
    setActivePauseStudent(subItem);
    setPauseReasonInput('تأخر في سداد القسط الثاني بالسنتر');
  };

  const handleConfirmPauseSingle = () => {
    if (!activePauseStudent) return;
    pauseStudentSubscription(activePauseStudent.studentId, activePauseStudent.targetId, pauseReasonInput.trim() || 'إيقاف مؤقت من الإدارة');
    setActivePauseStudent(null);
  };

  const handleOpenExtendModal = (subItem) => {
    setActiveExtendStudent(subItem);
    setExtendDaysInput(30);
  };

  const handleConfirmExtendSingle = () => {
    if (!activeExtendStudent) return;
    extendStudentSubscription(activeExtendStudent.studentId, activeExtendStudent.targetId, Number(extendDaysInput) || 30);
    setActiveExtendStudent(null);
  };

  // -------------------------------------------------------------
  // Manual Exam Builder & Grading Handlers
  // -------------------------------------------------------------
  const allSubmissionsList = [];
  Object.keys(examSubmissions || {}).forEach(lecId => {
    const subsForLec = examSubmissions[lecId] || {};
    Object.keys(subsForLec).forEach(uid => {
      allSubmissionsList.push(subsForLec[uid]);
    });
  });

  const pendingGradingSubmissions = allSubmissionsList.filter(s => s.status === 'pending_grading');

  const handleOpenExamBuilder = (lec) => {
    setBldIsGeneralExam(false);
    setEditingExamLectureId(lec.id);
    const existing = lec.exam || (examsData && examsData[lec.id]);
    if (existing) {
      setBldExamTitle(existing.title || `امتحان ${lec.title}`);
      setBldExamDuration(existing.timeMinutes || 25);
      setBldExamTotalMarks(existing.totalMarks || 20);
      setBldExamPassMarks(existing.passingMarks || 10);
      setBldExamMaxAttempts(existing.maxAttempts || 2);
      setBldExamShowResult(existing.showResult !== false);
      setBldExamShowCorrectAnswers(existing.showCorrectAnswers !== false);
      setBldExamIsDraft(existing.status === 'draft');
      setBldExamQuestions(existing.questions && existing.questions.length > 0 ? JSON.parse(JSON.stringify(existing.questions)) : [
        {
          id: `q-${Date.now()}-1`,
          type: 'mcq',
          question: 'اختر الإجابة الصحيحة للقاعدة اللغوية:',
          questionImage: '',
          options: ['الاختيار الأول (صحيح)', 'الاختيار الثاني', 'الاختيار الثالث', 'الاختيار الرابع'],
          optionImages: ['', '', '', ''],
          correctAnswer: 0,
          points: 4,
          explanation: 'توضيح نموذج الإجابة للقاعدة.'
        }
      ]);
    } else {
      setBldExamTitle(`الامتحان الشامل - ${lec.title}`);
      setBldExamDuration(25);
      setBldExamTotalMarks(20);
      setBldExamPassMarks(10);
      setBldExamMaxAttempts(2);
      setBldExamShowResult(true);
      setBldExamShowCorrectAnswers(true);
      setBldExamIsDraft(false);
      setBldExamQuestions([
        {
          id: `q-${Date.now()}-1`,
          type: 'mcq',
          question: 'Choose the correct answer based on the grammar rule taught in this lecture:',
          questionImage: '',
          options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
          optionImages: ['', '', '', ''],
          correctAnswer: 0,
          points: 4,
          explanation: 'Model answer explanation.'
        },
        {
          id: `q-${Date.now()}-2`,
          type: 'essay',
          question: 'Write a comprehensive answer or essay paragraph explaining the rule:',
          questionImage: '',
          options: [],
          optionImages: [],
          correctAnswer: '',
          modelAnswer: 'Clear answer demonstrating proper grammar structure.',
          points: 6,
          explanation: 'يتم تقييم دقة الجمل والكلمات.'
        }
      ]);
    }
    setIsExamBuilderOpen(true);
  };

  const handleOpenGeneralExamBuilder = (existingGenExam = null) => {
    setBldIsGeneralExam(true);
    if (existingGenExam) {
      setEditingExamLectureId(existingGenExam.id);
      setBldExamTitle(existingGenExam.title || 'الامتحان العام الشامل');
      setBldExamStageId(existingGenExam.stageId || 'sec-3');
      setBldExamDuration(existingGenExam.timeMinutes || 45);
      setBldExamTotalMarks(existingGenExam.totalMarks || 30);
      setBldExamPassMarks(existingGenExam.passingMarks || 18);
      setBldExamMaxAttempts(1); // General exams strictly 1 attempt
      setBldExamShowResult(existingGenExam.showScoreImmediately !== false);
      setBldExamShowCorrectAnswers(existingGenExam.allowReviewAfter !== false);
      setBldExamIsDraft(existingGenExam.status === 'draft');
      setBldExamQuestions(existingGenExam.questions && existingGenExam.questions.length > 0 ? JSON.parse(JSON.stringify(existingGenExam.questions)) : []);
    } else {
      setEditingExamLectureId(`gen-exam-${Date.now()}`);
      setBldExamTitle('الامتحان العام الشامل — The Master Grand Exam');
      setBldExamStageId('sec-3');
      setBldExamDuration(45);
      setBldExamTotalMarks(30);
      setBldExamPassMarks(18);
      setBldExamMaxAttempts(1);
      setBldExamShowResult(true);
      setBldExamShowCorrectAnswers(true);
      setBldExamIsDraft(false);
      setBldExamQuestions([
        {
          id: `q-${Date.now()}-1`,
          type: 'mcq',
          question: 'اختر الإجابة الصحيحة للقاعدة:',
          questionImage: '',
          options: ['الاختيار الأول (صحيح)', 'الاختيار الثاني', 'الاختيار الثالث', 'الاختيار الرابع'],
          optionImages: ['', '', '', ''],
          correctAnswer: 0,
          points: 2,
          explanation: 'شرح وتوضيح الإجابة الصحيحة.'
        },
        {
          id: `q-${Date.now()}-2`,
          type: 'tf',
          question: 'جملة صحيحة قواعدياً:',
          questionImage: '',
          options: ['صحيح (True)', 'خطأ (False)'],
          optionImages: [],
          correctAnswer: 0,
          points: 2,
          explanation: 'القاعدة النحوية الصحيحة.'
        },
        {
          id: `q-${Date.now()}-3`,
          type: 'essay',
          question: 'سؤال مقالي: اكتب فقرة باللغة الإنجليزية تشرح فيها...',
          questionImage: '',
          options: [],
          optionImages: [],
          correctAnswer: '',
          modelAnswer: 'نموذج الإجابة لتقييم المستر اليدوي.',
          points: 10,
          explanation: 'معايير التصحيح اليدوي.'
        }
      ]);
    }
    setIsExamBuilderOpen(true);
  };

  const handleAddQuestionToBuilder = (type = 'mcq') => {
    const newQ = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      question: '',
      questionImage: '',
      options: (type === 'mcq' || type === 'multi') ? ['اختيار 1', 'اختيار 2', 'اختيار 3', 'اختيار 4'] : (type === 'tf' ? ['صحيح (True)', 'خطأ (False)'] : []),
      optionImages: (type === 'mcq' || type === 'multi') ? ['', '', '', ''] : [],
      correctAnswer: type === 'multi' ? [0] : 0,
      modelAnswer: (type === 'essay' || type === 'short_answer') ? '' : '',
      points: type === 'essay' ? 5 : (type === 'short_answer' ? 4 : 2),
      explanation: ''
    };
    // Append to bottom of questions list
    setBldExamQuestions(prev => [...prev, newQ]);
  };

  const handleMoveQuestion = (idx, direction) => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === bldExamQuestions.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...bldExamQuestions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBldExamQuestions(updated);
  };

  const handleDeleteQuestion = (idx) => {
    setBldExamQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUploadQuestionImage = (e, qIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setBldExamQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, questionImage: dataUrl } : q));
      addToast('تم إرفاق صورة السؤال بنجاح 🖼️', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadOptionImage = (e, qIdx, optIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setBldExamQuestions(prev => prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newImages = [...(q.optionImages || [])];
        newImages[optIdx] = dataUrl;
        return { ...q, optionImages: newImages };
      }));
      addToast('تم إرفاق صورة الاختيار بنجاح 🖼️', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExamSubmit = (e) => {
    e.preventDefault();
    if (!editingExamLectureId) {
      addToast('يرجى تحديد المحاضرة أو معرف الامتحان', 'error');
      return;
    }
    if (!bldExamTitle.trim()) {
      addToast('يرجى إدخال عنوان الامتحان', 'error');
      return;
    }
    if (bldExamQuestions.length === 0) {
      addToast('يرجى إضافة سؤال واحد على الأقل داخل الامتحان', 'error');
      return;
    }

    // Strict Ordering Rule: Objective questions (mcq, multi, tf) first, then Essay & Short answer questions
    const objectiveQuestions = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi' || q.type === 'tf');
    const subjectiveQuestions = bldExamQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer');
    const strictlyOrderedQuestions = [...objectiveQuestions, ...subjectiveQuestions];

    const calculatedTotal = strictlyOrderedQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    const hasManualGrading = subjectiveQuestions.length > 0;

    if (bldIsGeneralExam) {
      const stgName = stages.find(s => s.id === bldExamStageId)?.name || 'جميع المراحل';
      const genPayload = {
        id: editingExamLectureId || `gen-exam-${Date.now()}`,
        title: bldExamTitle.trim(),
        description: 'امتحان عام مستقل - دخول لمرة واحدة فقط بكود شخصي.',
        stageId: bldExamStageId,
        stageName: stgName,
        timeMinutes: Number(bldExamDuration) || 45,
        totalMarks: Number(bldExamTotalMarks) || calculatedTotal,
        passingMarks: Number(bldExamPassMarks) || Math.ceil((bldExamTotalMarks || calculatedTotal) * 0.5),
        maxAttempts: 1, // Strictly single attempt
        status: bldExamIsDraft ? 'draft' : 'published',
        allowReviewAfter: bldExamShowCorrectAnswers,
        showScoreImmediately: bldExamShowResult,
        hasManualGrading,
        questions: strictlyOrderedQuestions
      };
      saveGeneralExam(genPayload);
    } else {
      const examPayload = {
        id: `exam-${editingExamLectureId}`,
        lectureId: editingExamLectureId,
        title: bldExamTitle.trim(),
        timeMinutes: Number(bldExamDuration) || 25,
        totalMarks: Number(bldExamTotalMarks) || calculatedTotal,
        passingMarks: Number(bldExamPassMarks) || Math.ceil((bldExamTotalMarks || calculatedTotal) * 0.5),
        maxAttempts: Number(bldExamMaxAttempts) || 2,
        status: bldExamIsDraft ? 'draft' : 'published',
        showResult: bldExamShowResult,
        showCorrectAnswers: bldExamShowCorrectAnswers,
        hasManualGrading,
        questions: strictlyOrderedQuestions
      };
      saveExamToLecture(editingExamLectureId, examPayload);
    }

    setIsExamBuilderOpen(false);
  };

  const handleOpenPreviewModal = () => {
    const calculatedTotal = bldExamQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    const hasManualGrading = bldExamQuestions.some(q => q.type === 'essay' || q.type === 'short_answer');

    const targetLectureId = editingExamLectureId || editingLectureId || 'temp-lecture';
    const payload = {
      id: `preview-${targetLectureId}`,
      lectureId: targetLectureId,
      title: bldExamTitle || (title ? `امتحان: ${title}` : 'معاينة الامتحان'),
      timeMinutes: Number(bldExamDuration) || 25,
      totalMarks: Number(bldExamTotalMarks) || calculatedTotal,
      passingMarks: Number(bldExamPassMarks) || Math.ceil(((Number(bldExamTotalMarks) || calculatedTotal) * 0.5)),
      showResult: bldExamShowResult,
      showCorrectAnswers: bldExamShowCorrectAnswers,
      hasManualGrading,
      questions: bldExamQuestions
    };
    setPreviewExamPayload(payload);
    setIsPreviewModalOpen(true);
  };

  const handleOpenGradingModal = (sub) => {
    setActiveGradingItem(sub);
    const initialScores = {};
    const lecExam = examsData[sub.lectureId] || lectures.find(l => l.id === sub.lectureId)?.exam;
    (lecExam?.questions || []).forEach(q => {
      if (q.type === 'essay' || q.type === 'short_answer') {
        initialScores[q.id] = sub.gradedQuestions?.[q.id]?.score || 0;
      }
    });
    setManualQuestionScores(initialScores);
    setGradingTeacherNotes(sub.teacherNotes || '');
  };

  const handleSubmitManualGrading = () => {
    if (!activeGradingItem) return;

    let manualSum = 0;
    const gradedQuestionsMap = {};
    const lecExam = examsData[activeGradingItem.lectureId] || lectures.find(l => l.id === activeGradingItem.lectureId)?.exam;

    (lecExam?.questions || []).forEach(q => {
      if (q.type === 'essay' || q.type === 'short_answer') {
        const assignedScore = Number(manualQuestionScores[q.id]) || 0;
        manualSum += assignedScore;
        gradedQuestionsMap[q.id] = {
          score: assignedScore,
          maxScore: Number(q.points) || 5,
          studentAnswer: activeGradingItem.answers?.[q.id] || '',
          gradedAt: new Date().toISOString()
        };
      }
    });

    gradeManualExamSubmission(activeGradingItem.lectureId, activeGradingItem.studentUid, {
      gradedQuestions: gradedQuestionsMap,
      teacherNotes: gradingTeacherNotes,
      additionalScore: manualSum
    });

    setActiveGradingItem(null);
  };

  // Handlers
  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    if (!stdName.trim() || !stdPhone.trim()) {
      addToast('يرجى إدخال اسم الطالب ورقم هاتفه', 'error');
      return;
    }

    addStudent({
      name: stdName,
      phone: stdPhone,
      parentPhone: stdParentPhone || stdPhone,
      parentName: stdParentName || `ولي أمر ${stdName}`,
      stageId: stdStageId,
      groupType: stdGroupType,
      centerName: stdGroupType === 'center' ? stdCenterName : 'أونلاين VIP',
      monthlyFee: Number(stdMonthlyFee),
      paidAmount: Number(stdPaidAmount),
      paymentMethod: stdPayMethod,
      teacherNotes: stdNotes,
      avatar: stdAvatarPreview
    });

    setIsAddStudentModalOpen(false);
    setStdName('');
    setStdPhone('');
    setStdParentPhone('');
    setStdParentName('');
    setStdNotes('');
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!activePaymentStudent || !payAmountInput) return;
    recordPayment(activePaymentStudent.id, payAmountInput, payMethodInput, payNotesInput);
    setActivePaymentStudent(null);
    setPayAmountInput('');
    setPayNotesInput('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    let finalAvatar = profileAvatar;
    setIsGeneratingIcons(true);

    // 1. Upload avatar to permanent Cloudflare URL so WhatsApp and social previews update automatically
    if (profileAvatar) {
      try {
        const publicUrl = await uploadTeacherAvatarToR2(profileAvatar);
        if (publicUrl) {
          finalAvatar = publicUrl;
          addToast('تم تحديث صورة كارت المعاينة للواتساب والفيسبوك تلقائياً 🌐', 'info', 3000);
        }
      } catch (err) {
        console.warn('Social preview upload notice:', err);
      }

      // 2. Automatically generate and publish branded mobile App Icons with safe-area
      try {
        const { standardBlob, maskableBlob } = await generatePlatformIconsSuite(profileAvatar);
        if (standardBlob) {
          await uploadAppIconToR2(standardBlob, 'icon-512x512.png');
          await uploadAppIconToR2(standardBlob, 'icon-192x192.png');
        }
        if (maskableBlob) {
          await uploadAppIconToR2(maskableBlob, 'icon-maskable-512x512.png');
          await uploadAppIconToR2(maskableBlob, 'icon-maskable-192x192.png');
        }
        addToast('تم تحديث وتوليد أيقونة التطبيق الذكية للموبايل تلقائياً ✨📱', 'success', 3500);
      } catch (err) {
        console.warn('App icon auto-generation notice:', err);
      }
    }
    setIsGeneratingIcons(false);

    updateTeacherProfile({
      name: profileName,
      title: profileTitle,
      subtitle: profileSubtitle,
      aboutBio: profileBio,
      whatsappNumber: profileWhatsapp,
      avatar: finalAvatar,
      totalStudents: Number(profileStudents),
      welcomeBadge: profileWelcomeBadge,
      heroSlogan: profileHeroSlogan,
      heroDescription: profileHeroDescription,
      statBadgeNumber: profileStatBadgeNumber,
      statBadgeText: profileStatBadgeText,
      supportBadgeTitle: profileSupportBadgeTitle,
      supportBadgeText: profileSupportBadgeText
    });
    addToast('تم حفظ وتحديث بيانات المعلم ونصوص الصفحة الرئيسية بنجاح ✅', 'success', 2500);
  };

  const handleStartEditLecture = (lec) => {
    if (!lec) return;
    setEditingLectureId(lec.id);
    setTitle(lec.title || '');
    setSubtitle(lec.subtitle || '');
    setStageId(lec.stageId || 'sec-3');
    setLectureSectionId(lec.sectionId || '');
    setUnitNumber(lec.unitNumber || 'Unit 4');
    setIsFreeLecture(Boolean(lec.isFree));
    setLecturePrice(lec.price || '70 ج.م');
    setVideoUrl(lec.videoUrl || '');
    setVideoFileName(lec.videoFileName || '');
    setVideoFileSize(lec.videoFileSize || '');
    setThumbnailPreview(lec.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80');
    setDuration(lec.duration || '1:30:00');
    setPdfTitle(lec.pdfBooklet?.title || 'مذكرة The Master الشاملة.pdf');
    setPdfDownloadUrl(lec.pdfBooklet?.downloadUrl || lec.pdfBooklet?.url || '');

    const linkedExam = lec.exam || (examsData && examsData[lec.id]);
    if (linkedExam && Array.isArray(linkedExam.questions) && linkedExam.questions.length > 0) {
      setHasLectureExam(true);
      setBldExamTitle(linkedExam.title || `امتحان: ${lec.title}`);
      setBldExamDuration(linkedExam.timeMinutes || 25);
      setBldExamTotalMarks(linkedExam.totalMarks || 20);
      setBldExamPassMarks(linkedExam.passingMarks || 10);
      setBldExamMaxAttempts(linkedExam.maxAttempts || 2);
      setBldExamShowResult(linkedExam.showResult !== false);
      setBldExamShowCorrectAnswers(linkedExam.showCorrectAnswers !== false);
      setBldExamIsDraft(linkedExam.status === 'draft');
      setBldExamQuestions(linkedExam.questions);
    } else {
      setHasLectureExam(false);
      setBldExamTitle(`امتحان: ${lec.title}`);
      setBldExamQuestions([]);
    }

    const formEl = document.getElementById('lecture-upload-studio-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
    addToast(`تم فتح محاضرة (${lec.title}) في وضع التعديل ✏️`, 'info');
  };

  const handleCancelEditLecture = () => {
    setEditingLectureId(null);
    setTitle('');
    setSubtitle('');
    setLectureSectionId('');
    setUnitNumber('Unit 4');
    setIsFreeLecture(false);
    setLecturePrice('70 ج.م');
    setVideoUrl('');
    setVideoFileName('');
    setVideoFileSize('');
    setThumbnailPreview('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80');
    setDuration('1:30:00');
    setPdfTitle('مذكرة The Master الشاملة.pdf');
    setPdfDownloadUrl('');
    setHasLectureExam(false);
    setBldExamQuestions([]);
    addToast('تم إلغاء التعديل والعودة للوضع الافتراضي', 'info');
  };

  const handleUploadLecture = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('يرجى كتابة عنوان المحاضرة', 'error');
      return;
    }

    if (isUploading) {
      addToast('⚠️ جاري استكمال رفع الفيديو إلى السحابة... يرجى الانتظار بضع ثوانٍ حتى يكتمل الرفع 100%!', 'warning');
      return;
    }

    const targetStage = stages.find(s => s.id === stageId) || stages[0];
    const cleanVideoUrl = (videoUrl && !videoUrl.startsWith('blob:')) ? videoUrl : '';

    let examPayload = null;
    if (hasLectureExam) {
      if (bldExamQuestions.length === 0) {
        addToast('لقد اخترت تفعيل امتحان للمحاضرة! يرجى إضافة سؤال واحد على الأقل داخل الامتحان.', 'error');
        return;
      }

      // Rule 6: Strictly sort questions so MCQ, Multi, and True/False appear FIRST, then Essay & Short answer questions
      const objectiveQuestions = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi' || q.type === 'tf');
      const subjectiveQuestions = bldExamQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer');
      const strictlyOrderedQuestions = [...objectiveQuestions, ...subjectiveQuestions];

      const calculatedTotal = strictlyOrderedQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
      const totalMarksToSave = Number(bldExamTotalMarks) || calculatedTotal;
      const passMarksToSave = Number(bldExamPassMarks) || Math.ceil(totalMarksToSave * 0.5);

      examPayload = {
        id: editingLectureId ? (lectures.find(l => l.id === editingLectureId)?.exam?.id || `exam-${editingLectureId}`) : `exam-${Date.now()}`,
        lectureId: editingLectureId || null,
        title: (bldExamTitle || `امتحان: ${title}`).trim(),
        timeMinutes: Number(bldExamDuration) || 25,
        totalMarks: totalMarksToSave,
        passingMarks: passMarksToSave,
        maxAttempts: Number(bldExamMaxAttempts) || 2,
        showResult: bldExamShowResult,
        showCorrectAnswers: bldExamShowCorrectAnswers,
        status: bldExamIsDraft ? 'draft' : 'published',
        questions: strictlyOrderedQuestions,
        createdAt: new Date().toISOString(),
        hasManualQuestions: subjectiveQuestions.length > 0
      };
    }

    const lecturePayload = {
      stageId: targetStage?.id || stageId,
      stageName: targetStage?.name || 'المرحلة الدراسية',
      sectionId: lectureSectionId || '',
      unitNumber,
      title,
      subtitle: subtitle || 'شرح تفصيلي ومكثف للوحدة وحل أسئلة الامتحانات.',
      duration: duration || '1:30:00',
      videoUrl: cleanVideoUrl,
      localMediaKey: localMediaKey,
      videoFileName: videoFileName || 'lecture_video.mp4',
      videoFileSize: videoFileSize || '',
      thumbnail: thumbnailPreview,
      isFree: isFreeLecture,
      price: isFreeLecture ? 'مجاناً' : lecturePrice,
      homeworkRequired: true,
      examRequired: Boolean(hasLectureExam),
      exam: examPayload,
      pdfBooklet: { 
        title: pdfTitle, 
        size: pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(1)} MB` : '5.2 MB', 
        pages: 30,
        url: pdfDownloadUrl || '',
        downloadUrl: pdfDownloadUrl || ''
      },
      vocabList: [{ word: 'Extraordinary', ipa: '/ɪkˈstrɔː.dɪn.ər.i/', arabic: 'استثنائي / خارق للعادة', example: 'She showed extraordinary commitment.' }],
      grammarRules: [{ title: 'قاعدة الوحدة الجديدة', rule: 'تطبيق عملي لأهم نقاط الجرامر.', example: 'Hard work leads to success.' }]
    };

    if (editingLectureId) {
      await updateLecture(editingLectureId, lecturePayload);
      setEditingLectureId(null);
    } else {
      await uploadNewLecture(lecturePayload);
    }

    setTitle('');
    setSubtitle('');
    setLectureSectionId('');
    setVideoPreviewUrl('');
    setVideoFileName('');
    setVideoFileSize('');
    setLocalMediaKey(null);
    setPdfFile(null);
    setPdfDownloadUrl('');
    setHasLectureExam(false);
    setBldExamQuestions([]);
    setUploadProgress(0);
    setUploadDetails({ percent: 0, transferredMB: '0', totalMB: '0', isCloudReady: false, localSaved: false });
  };

  const handleAddStage = (e) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    addStage({
      name: newStageName,
      badge: newStageBadge,
      description: newStageDesc || 'محتوى شامل ومنهج تدريبي متكامل.',
      pricePerMonth: newStagePrice,
      features: ['شرح المنهج كامل', 'مذكرات واختبارات أسبوعية', 'تقارير واتساب لولي الأمر']
    });
    setNewStageName('');
    setNewStageDesc('');
  };

  const handleAddBooklet = (e) => {
    e.preventDefault();
    if (!newBkTitle.trim()) return;
    addBooklet({
      title: newBkTitle,
      pages: newBkPages || '50 صفحة',
      size: newBkFileSize || newBkSize || '8 MB',
      format: 'PDF عالي الجودة للطباعة',
      cover: newBkCoverPreview,
      badge: 'نسخة معتمدة 📚',
      downloadUrl: newBkDownloadUrl || '#'
    });
    setNewBkTitle('');
    setNewBkDownloadUrl('');
    setNewBkFileSize('');
    setNewBkFile(null);
  };

  const handleAddAchiever = (e) => {
    e.preventDefault();
    if (!newAchName.trim()) return;
    const targetStage = stages.find(s => s.id === newAchStageId) || stages[0];
    addAchiever({
      name: newAchName,
      stageId: targetStage?.id || newAchStageId,
      stageName: targetStage?.name || 'الصف الثالث الثانوي',
      score: newAchScore,
      school: newAchSchool,
      badge: newAchBadge,
      avatar: newAchAvatarPreview
    });
    setNewAchName('');
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    const stageObj = stages.find(s => s.id === genCodeStageId) || stages[0];

    let targetTitle = 'اشتراك المحتوى';
    let targetId = '';

    if (genCodeType === 'month') {
      const sec = sections.find(s => s.id === genCodeTargetId && s.type === 'month') || sections.find(s => s.stageId === genCodeStageId && s.type === 'month') || sections[0];
      targetId = sec?.id || 'sec3-month-1';
      targetTitle = sec ? `اشتراك: ${sec.title}` : 'اشتراك شهر كامل';
    } else if (genCodeType === 'course') {
      const sec = sections.find(s => s.id === genCodeTargetId && s.type === 'course') || sections.find(s => s.stageId === genCodeStageId && s.type === 'course') || sections[0];
      targetId = sec?.id || 'sec3-course-fnd';
      targetTitle = sec ? `كورس: ${sec.title}` : 'اشتراك كورس كامل';
    } else if (genCodeType === 'lecture') {
      const lec = lectures.find(l => l.id === genCodeTargetId) || lectures[0];
      targetId = lec?.id || 'lec-s3-01';
      targetTitle = lec ? `محاضرة: ${lec.title}` : 'اشتراك محاضرة واحدة';
    } else if (genCodeType === 'bundle') {
      targetId = `bundle-${Date.now()}`;
      targetTitle = `باقة مخصصة (${genCodeBundleItems.length > 0 ? `${genCodeBundleItems.length} عناصر` : 'مجموعة شهور ومحاضرات'})`;
    }

    await generateNewCode({
      stageName: stageObj?.name || 'الصف الثالث الثانوي',
      stageId: stageObj?.id || 'sec-3',
      targetTitle,
      targetId,
      codeType: genCodeType,
      price: genCodePrice,
      durationDays: Number(genCodeDuration) || 30,
      expiryDate: genCodeExpiryDate,
      maxUses: Number(genCodeMaxUses) || 1,
      isGift: Boolean(genCodeIsGift),
      customCode: genCodeCustomCode,
      bundleItems: genCodeBundleItems
    });

    setGenCodeCustomCode('');
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    let audienceDetails = 'الكل';
    if (annAudience === 'stage') {
      const stg = stages.find(s => s.id === annTargetStage);
      audienceDetails = stg ? stg.name : 'مرحلة دراسية';
    } else if (annAudience === 'student') {
      const std = students.find(s => s.id === annTargetStudent);
      audienceDetails = std ? `طالب: ${std.name}` : 'طالب محدد';
    }

    const fullContent = annAudience === 'all' 
      ? annContent.trim() 
      : `[موجه إلى: ${audienceDetails}]\n${annContent.trim()}`;

    postAnnouncement(annTitle.trim(), fullContent);

    if (annSendAsPush) {
      await dispatchExternalNotification({
        title: annTitle.trim(),
        body: annContent.trim(),
        url: './',
        tag: `ms-ann-${Date.now()}`,
        targetAudience: annAudience
      });
      addToast('تم إرسال التنبيه ونشر الإشعار الخارجي (Push Notification) بنجاح 🔔📲', 'success');
    } else {
      addToast('تم نشر التنبيه بنجاح داخل المنصة 📢', 'success');
    }

    setAnnTitle('');
    setAnnContent('');
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container-wide">
        {/* Top Control Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #141419 0%, #1A1A22 50%, #201D17 100%)',
          color: 'white',
          padding: '2rem 2.5rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          border: '1px solid rgba(245, 158, 11, 0.35)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-gold">لوحة الإدارة والدرع الأمني الشامل 🛡️</span>
              <span style={{ fontSize: '0.85rem', color: '#FBBF24' }}>The Master Studio 🇬🇧</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 4px', color: 'white' }}>
              استوديو إدارة منصة {teacherProfile.name}
            </h1>
            <p style={{ color: '#FDE68A', fontSize: '0.92rem', margin: 0 }}>
              رفع الفيديوهات من جهازك، إدارة الشهور والكورسات، درع حماية المحتوى، الخزينة المتطورة وأكواد الشحن
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="btn btn-warning"
              style={{
                gap: '8px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
              }}
            >
              <KeyRound size={18} />
              <span>تغيير باسورد المستر 🔑</span>
            </button>

            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="btn btn-success btn-lg"
              style={{ gap: '8px', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}
            >
              <Plus size={20} />
              <span>إضافة طالب جديد 👨‍🎓</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="btn btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: 'white', border: 'none' }}
            >
              👁️ معاينة كطالب
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-subtle)',
          gap: '0.65rem',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {[
            { id: 'lectures', label: `🎥 رفع المحاضرات (${lectures.length})`, icon: Video },
            { id: 'sections', label: `📅 الشهور والكورسات (${sections.length})`, icon: BookOpen },
            { id: 'subscriptions', label: `🎫 إدارة الاشتراكات والمشتركين (${allStudentSubscriptions.length})`, icon: CreditCard },
            { id: 'exams', label: `📝 امتحانات المحاضرات والتصحيح ${pendingGradingSubmissions.length > 0 ? `(${pendingGradingSubmissions.length} 🔔)` : ''}`, icon: HelpCircle },
            { id: 'general-exams', label: `🌟 إدارة الامتحانات الشاملة (${generalExams.length})`, icon: Trophy },
            { id: 'general-codes', label: `🎟️ أكواد الامتحانات الشاملة (${generalExamCodes.length})`, icon: Key },
            { id: 'security', label: '🛡️ درع الحماية والأمان (Anti-Piracy)', icon: ShieldCheck },
            { id: 'finance', label: `💰 الخزينة (${totalCollectedRevenue.toLocaleString()} ج.م)`, icon: DollarSign },
            { id: 'profile', label: '👤 بيانات المستر', icon: Settings },
            { id: 'stages', label: `🎓 المراحل (${stages.length})`, icon: BookOpen },
            { id: 'booklets', label: `📚 المذكرات (${booklets.length})`, icon: FileText },
            { id: 'achievers', label: `🏆 أوائل المستر (${topAchievers.length})`, icon: Trophy },
            { id: 'codes', label: `🎟️ كروت الشحن (${accessCodes.length})`, icon: Key },
            { id: 'broadcast', label: `📢 التنبيهات (${announcements.length})`, icon: Bell }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.85rem 0.65rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
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

        {/* ========================================================= */}
        {/* TAB 1: LECTURES & DIRECT LOCAL FILE UPLOAD STUDIO */}
        {/* ========================================================= */}
        {activeTab === 'lectures' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2.5rem', background: 'var(--bg-surface)', border: '2px solid var(--primary-400)', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Film size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
                      رفع محاضرة وفيديو من جهازك مباشرة (Direct File Upload) 🎬
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                      اختر أي ملف فيديو من جهازك (MP4, MKV, MOV, AVI, WebM) وسيتم معالجته وتشغيله فوراً داخل قاعة المحاضرات المحمية!
                    </p>
                  </div>
                </div>
              </div>

              {editingLectureId && (
                <div style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  border: '2px solid #F59E0B',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Edit size={24} color="#D97706" />
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: '#92400E', display: 'block' }}>
                        ✏️ أنت الآن في وضع تعديل المحاضرة: «{title || 'المحاضرة'}»
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#B45309' }}>
                        يمكنك تعديل بيانات المحاضرة وامتحانها المرفق مباشرة، ثم الضغط على "حفظ تعديلات المحاضرة والامتحان" بالأسفل.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEditLecture}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 800, background: '#FFF' }}
                  >
                    إلغاء وضع التعديل ✕
                  </button>
                </div>
              )}

              <form id="lecture-upload-studio-form" onSubmit={handleUploadLecture} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                        المرحلة المستهدفة:
                      </label>
                      <select 
                        value={stageId} 
                        onChange={e => {
                          setStageId(e.target.value);
                          setLectureSectionId('');
                        }} 
                        className="input-control"
                        style={{ fontWeight: 800, borderColor: 'var(--primary-400)', background: 'var(--bg-subtle)' }}
                      >
                        {stages.map(s => (
                          <option key={s.id} value={s.id}>🎓 {s.name} ({s.badge || 'دفعة 2026'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                        📅 الشهر أو الكورس التابع له:
                      </label>
                      <select 
                        value={lectureSectionId} 
                        onChange={e => setLectureSectionId(e.target.value)} 
                        className="input-control"
                        style={{ fontWeight: 800, borderColor: 'var(--primary-400)' }}
                      >
                        <option value="">بدون شهر محدد (محاضرة مستقلة / عامة)</option>
                        {sections
                          .filter(sec => sec.stageId === stageId)
                          .map(sec => (
                            <option key={sec.id} value={sec.id}>
                              {sec.type === 'course' ? '📁 كورس: ' : '📅 شهر: '}{sec.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رقم الوحدة (Unit):</label>
                      <input
                        type="text"
                        placeholder="مثال: Unit 4"
                        value={unitNumber}
                        onChange={e => setUnitNumber(e.target.value)}
                        className="input-control"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان المحاضرة الرئيسي:</label>
                    <input
                      type="text"
                      placeholder="مثال: المحاضرة 4: شرح أزمنة المستقبل وكتابة المقال الإنجليزي"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="input-control"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>وصف ونقاط المحاضرة:</label>
                    <input
                      type="text"
                      placeholder="تفكيك قواعد الوحدة وحل 80 جملة وتدريب المقال..."
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      className="input-control"
                    />
                  </div>

                  {/* Lecture Access Type: Free vs Paid */}
                  <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, marginBottom: '8px' }}>
                      صلاحية ونوع المحاضرة (مجانية أم باشتراك مدفوع؟):
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setIsFreeLecture(false)}
                        className={`btn btn-sm ${!isFreeLecture ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ gap: '6px', justifyContent: 'center', fontWeight: 800, padding: '10px' }}
                      >
                        <Lock size={16} />
                        <span>🔒 باشتراك مدفوع (تتطلب كود/شحن)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFreeLecture(true)}
                        className={`btn btn-sm ${isFreeLecture ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ gap: '6px', justifyContent: 'center', fontWeight: 800, padding: '10px', background: isFreeLecture ? '#10B981' : undefined, borderColor: isFreeLecture ? '#10B981' : undefined }}
                      >
                        <Sparkles size={16} />
                        <span>🟢 مجانية تجريبية (مفتوحة للجميع)</span>
                      </button>
                    </div>

                    {!isFreeLecture ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', alignItems: 'center' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>سعر المحاضرة:</label>
                          <input
                            type="text"
                            value={lecturePrice}
                            onChange={e => setLecturePrice(e.target.value)}
                            className="input-control"
                            placeholder="مثال: 70 ج.م"
                          />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#059669', background: '#ECFDF5', padding: '8px 12px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                          💬 عندما يضغط الطالب على "اشتراك"، سيتم تحويله مباشرة لواتساب المستر ({teacherProfile.whatsappNumber || '01012345678'}) للاشتراك واستلام الكود!
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#065F46', background: '#ECFDF5', padding: '8px 12px', borderRadius: '8px', fontWeight: 700 }}>
                        ✓ هذه المحاضرة ستكون متاحة فوراً لكافة الطلاب والزوار مجاناً دون الحاجة لكود شحن.
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>طريقة إضافة الفيديو:</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setVideoSourceType('file')}
                        className={`btn btn-sm ${videoSourceType === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, gap: '6px' }}
                      >
                        <FileUp size={16} />
                        <span>📁 رفع ملف فيديو من جهازي (MP4/MKV)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoSourceType('url')}
                        className={`btn btn-sm ${videoSourceType === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, gap: '6px' }}
                      >
                        <Video size={16} />
                        <span>🔗 رابط خارجي (YouTube/Drive)</span>
                      </button>
                    </div>

                    {videoSourceType === 'file' ? (
                      <div>
                        <input
                          ref={videoFileInputRef}
                          type="file"
                          accept="video/*,.mkv,.mp4,.mov,.avi,.webm"
                          style={{ display: 'none' }}
                          onChange={handleVideoFileChange}
                        />
                        <div
                          onClick={() => videoFileInputRef.current?.click()}
                          style={{
                            border: '2px dashed var(--primary-500)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '2rem',
                            textAlign: 'center',
                            background: 'var(--bg-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                        >
                          <Film size={42} color="var(--primary-600)" style={{ margin: '0 auto 8px' }} />
                          <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--primary-700)', marginBottom: '4px' }}>
                            {videoFileName ? `ملف الفيديو المختار: ${videoFileName} (${videoFileSize})` : 'انقر لاختيار ملف الفيديو من جهازك أو اسحبه هنا'}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            يدعم كافة الصيغ: MP4, MKV, MOV, AVI, WebM بدون قيود حجم!
                          </span>

                          {/* Live Upload & Storage Status */}
                          {isUploading ? (
                            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.85)', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                                <span style={{ color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Cloud size={16} className="animate-pulse" /> جاري حفظ وتأمين الفيديو محلياً وسحابياً...
                                </span>
                                <span style={{ color: 'var(--primary-800)' }}>
                                  {uploadDetails.totalMB} MB ({uploadProgress}%)
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.max(uploadProgress, 20)}%`, height: '100%', background: 'linear-gradient(90deg, #F59E0B 0%, #10B981 100%)', transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                          ) : videoFileName ? (
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                <span style={{ 
                                  display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                  padding: '6px 14px', background: '#ECFDF5', color: '#065F46', 
                                  borderRadius: '20px', fontSize: '0.84rem', fontWeight: 800, border: '1px solid #A7F3D0' 
                                }}>
                                  <CheckCircle2 size={16} color="#059669" /> ✅ الفيديو جاهز للنشر والمشاهدة فوراً! (يمكنك الضغط على نشر المحاضرة)
                                </span>
                                {uploadDetails.isCloudReady ? (
                                  <span style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                    padding: '6px 14px', background: '#FEF3C7', color: '#92400E', 
                                    borderRadius: '20px', fontSize: '0.84rem', fontWeight: 800, border: '1px solid #FDE68A' 
                                  }}>
                                    <Cloud size={16} color="#D97706" /> ☁️ تم الرفع والحفظ في سحابة Firebase
                                  </span>
                                ) : uploadDetails.cloudNotice ? (
                                  <span style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                    padding: '6px 14px', background: '#FFFBEB', color: '#92400E', 
                                    borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #FDE68A' 
                                  }}>
                                    💡 الفيديو شغال ومحفوظ بجهازك (لتفعيله سحابياً انشر قواعد Storage في فايربيز)
                                  </span>
                                ) : (
                                  <span style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                                    padding: '5px 12px', background: '#F1F5F9', color: '#475569', 
                                    borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 
                                  }}>
                                    ⏳ جاري مزامنة السحابة بالخلفية...
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="ضع رابط الفيديو هنا (MP4 / YouTube / Vimeo)"
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        className="input-control"
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>مذكرة الشرح المرفقة (PDF):</label>
                    <input
                      ref={pdfFileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handlePdfFileChange}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={pdfTitle}
                        onChange={e => setPdfTitle(e.target.value)}
                        className="input-control"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => pdfFileInputRef.current?.click()}
                        className="btn btn-secondary"
                        style={{ gap: '6px' }}
                      >
                        <FileText size={16} />
                        <span>اختر PDF من جهازك</span>
                      </button>
                    </div>
                  </div>

                  </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>معاينة الفيديو المرفوع:</label>
                    <div style={{
                      aspectRatio: '16/9',
                      background: '#000',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {videoPreviewUrl ? (
                        <video
                          src={videoPreviewUrl}
                          controls
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                          <Film size={36} style={{ margin: '0 auto 6px' }} />
                          <span style={{ fontSize: '0.82rem', display: 'block' }}>سيظهر الفيديو هنا فور اختياره من جهازك</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>صورة غلاف المحاضرة (Thumbnail):</label>
                    <input
                      ref={thumbnailFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleImageFileChange(e, setThumbnailPreview, 'غلاف المحاضرة')}
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail"
                        style={{ width: '90px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                      />
                      <button
                        type="button"
                        onClick={() => thumbnailFileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <Image size={15} />
                        <span>رفع صورة من جهازك 🖼️</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المدة المحسوبة:</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      className="input-control"
                    />
                  </div>
                </div>

                {/* ========================================================= */}
                {/* INLINE LECTURE EXAM SECTION (Full Width Spanning 1 / -1) */}
                {/* ========================================================= */}
                <div
                  id="lecture-exam-inline-section"
                  style={{
                    gridColumn: '1 / -1',
                    background: 'var(--bg-subtle)',
                    border: hasLectureExam ? '2px solid var(--primary-500)' : '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    marginTop: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Header & Toggle Question */}
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: hasLectureExam ? 'var(--primary-gradient)' : 'var(--bg-surface)',
                        color: hasLectureExam ? '#fff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                          امتحان المحاضرة (Lecture Exam) 📝
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          هل تريد إضافة امتحان تقييمي لهذه المحاضرة لضمان فهم الطلاب؟
                        </p>
                      </div>
                    </div>

                    {/* Toggle Choice: هل تريد إضافة امتحان لهذه المحاضرة؟ (نعم / لا) */}
                    <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setHasLectureExam(true);
                          if (bldExamQuestions.length === 0) {
                            handleAddQuestionToBuilder('mcq');
                          }
                        }}
                        className={`btn btn-sm ${hasLectureExam ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontWeight: 800, gap: '6px' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>نعم، أريد إضافة امتحان ✍️</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasLectureExam(false)}
                        className={`btn btn-sm ${!hasLectureExam ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ fontWeight: 800, gap: '6px' }}
                      >
                        <X size={16} />
                        <span>لا، بدون امتحان (فيديو ومذكرة فقط) 🚫</span>
                      </button>
                    </div>
                  </div>

                  {/* If NO Exam: Explanatory note */}
                  {!hasLectureExam && (
                    <div style={{
                      padding: '1.25rem',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <AlertCircle size={22} style={{ color: '#2563EB', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <strong style={{ color: '#2563EB', display: 'block', marginBottom: '2px' }}>
                          نظام فتح المحاضرات عند عدم وجود امتحان:
                        </strong>
                        يكفي أن يشاهد الطالب <strong>50%</strong> من مدة هذه المحاضرة لفتح المحاضرة التالية مباشرة وبشكل تلقائي دون أي قيود امتحانات.
                      </div>
                    </div>
                  )}

                  {/* If YES Exam: Render Full Inline Editor */}
                  {hasLectureExam && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Rule 12 Info Banner */}
                      <div style={{
                        padding: '1rem 1.25rem',
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <ShieldAlert size={22} style={{ color: '#D97706', flexShrink: 0 }} />
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          <strong style={{ color: '#D97706', display: 'block', marginBottom: '2px' }}>
                            شروط فك القفل التلقائي للمحاضرة التالية:
                          </strong>
                          لن يتمكن الطالب من فتح المحاضرة التالية إلا بعد <strong>مشاهدة 50% على الأقل</strong> من فيديو المحاضرة الحالية، و<strong>الحصول على أكثر من 50%</strong> في هذا الامتحان.
                        </div>
                      </div>

                      {/* Exam General Settings Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        background: 'var(--bg-surface)',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                            عنوان الامتحان:
                          </label>
                          <input
                            type="text"
                            value={bldExamTitle}
                            onChange={e => setBldExamTitle(e.target.value)}
                            placeholder={title ? `امتحان: ${title}` : 'امتحان المحاضرة الشامل'}
                            className="input-control"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                            مدة الامتحان (بالدقائق):
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="180"
                            value={bldExamDuration}
                            onChange={e => setBldExamDuration(e.target.value)}
                            className="input-control"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                            أقصى عدد محاولات للطالب:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={bldExamMaxAttempts}
                            onChange={e => setBldExamMaxAttempts(e.target.value)}
                            className="input-control"
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                            حالة النشر:
                          </label>
                          <select
                            value={bldExamIsDraft ? 'draft' : 'published'}
                            onChange={e => setBldExamIsDraft(e.target.value === 'draft')}
                            className="input-control"
                          >
                            <option value="published">🚀 منشور للطلاب مباشرة</option>
                            <option value="draft">📁 مسودة (غير متاح للطلاب حتى الآن)</option>
                          </select>
                        </div>
                      </div>

                      {/* Display & Feedback Options */}
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.5rem 0.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={bldExamShowResult}
                            onChange={e => setBldExamShowResult(e.target.checked)}
                            style={{ accentColor: 'var(--primary-600)', width: '16px', height: '16px' }}
                          />
                          <span>إظهار الدرجة للطالب فور إنهاء الامتحان</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={bldExamShowCorrectAnswers}
                            onChange={e => setBldExamShowCorrectAnswers(e.target.checked)}
                            style={{ accentColor: 'var(--primary-600)', width: '16px', height: '16px' }}
                          />
                          <span>إظهار الإجابات الصحيحة والنموذجية بعد التصحيح</span>
                        </label>
                      </div>

                      {/* Live Fixed Statistics Counter Dashboard */}
                      {(() => {
                        const totalQ = bldExamQuestions.length;
                        const mcqCount = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi').length;
                        const tfCount = bldExamQuestions.filter(q => q.type === 'tf').length;
                        const essayCount = bldExamQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer').length;
                        const totalMarks = bldExamQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);

                        return (
                          <div style={{
                            background: 'var(--primary-gradient-subtle, rgba(31, 77, 58, 0.06))',
                            border: '1.5px solid rgba(31, 77, 58, 0.25)',
                            borderRadius: '12px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}>
                            <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary-700)' }}>
                                  📊 إحصائيات وهيكل امتحان المحاضرة (مباشر):
                                </span>
                                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                                  ترتيب تلقائي: الموضوعي أولاً ثم المقالي
                                </span>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                يتحدث العداد فورياً أثناء كتابة وتعديل الأسئلة
                              </span>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                              gap: '0.75rem'
                            }}>
                              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي الأسئلة</span>
                                <strong style={{ fontSize: '1.2rem', color: 'var(--primary-700)' }}>{totalQ}</strong>
                              </div>

                              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>اختيار من متعدد</span>
                                <strong style={{ fontSize: '1.2rem', color: '#0284C7' }}>{mcqCount}</strong>
                              </div>

                              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>صح أو خطأ (T/F)</span>
                                <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{tfCount}</strong>
                              </div>

                              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>مقالي وإجابة قصيرة</span>
                                <strong style={{ fontSize: '1.2rem', color: '#D97706' }}>{essayCount}</strong>
                              </div>

                              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid var(--primary-500)', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>مجموع الدرجات</span>
                                <strong style={{ fontSize: '1.2rem', color: 'var(--primary-800)' }}>{totalMarks} درجة</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Questions List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {bldExamQuestions.length === 0 ? (
                          <div style={{
                            padding: '2.5rem',
                            textAlign: 'center',
                            background: 'var(--bg-surface)',
                            borderRadius: '12px',
                            border: '1px dashed var(--border-subtle)',
                            color: 'var(--text-muted)'
                          }}>
                            <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                            <p style={{ fontWeight: 700, margin: '0 0 6px' }}>لا توجد أسئلة مضافة حتى الآن في هذا الامتحان</p>
                            <span style={{ fontSize: '0.85rem' }}>اختر نوع السؤال من الأزرار بالأسفل لإضافته يدوياً وتحديد خياراته ودرجته</span>
                          </div>
                        ) : (
                          bldExamQuestions.map((q, qIdx) => (
                            <div
                              key={q.id || qIdx}
                              style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                              }}
                            >
                              {/* Question Header Bar */}
                              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    background: 'var(--primary-600)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.85rem'
                                  }}>
                                    {qIdx + 1}
                                  </span>

                                  <span className={
                                    q.type === 'essay' ? 'badge badge-gold' :
                                    q.type === 'short_answer' ? 'badge badge-warning' :
                                    q.type === 'multi' ? 'badge badge-primary' :
                                    q.type === 'tf' ? 'badge badge-secondary' : 'badge badge-success'
                                  } style={{ fontSize: '0.75rem' }}>
                                    {q.type === 'mcq' ? 'اختيار من متعدد (إجابة واحدة)' :
                                     q.type === 'multi' ? 'اختيار من متعدد (أكثر من إجابة)' :
                                     q.type === 'tf' ? 'صح أو خطأ' :
                                     q.type === 'essay' ? 'سؤال مقالي (تصحيح يدوي)' : 'إجابة قصيرة (تصحيح يدوي)'}
                                  </span>

                                  {(q.type === 'essay' || q.type === 'short_answer') && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-600)', fontWeight: 700 }}>
                                      ⚠️ يتطلب تصحيح يدوي لفك القفل
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>الدرجة:</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="50"
                                      value={q.points || 2}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, points: Number(val) } : item));
                                      }}
                                      className="input-control"
                                      style={{ width: '65px', height: '32px', textAlign: 'center', fontWeight: 800 }}
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(qIdx, 'up')}
                                    disabled={qIdx === 0}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px 8px' }}
                                    title="تحريك لأعلى"
                                  >
                                    <ArrowUp size={16} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(qIdx, 'down')}
                                    disabled={qIdx === bldExamQuestions.length - 1}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px 8px' }}
                                    title="تحريك لأسفل"
                                  >
                                    <ArrowDown size={16} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(qIdx)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px 8px', color: '#EF4444' }}
                                    title="حذف هذا السؤال"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              {/* Question Text & Image Section */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                                  نص السؤال (أو اتركه فارغاً واكتفِ بالصورة):
                                </label>
                                <textarea
                                  value={q.question || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, question: val } : item));
                                  }}
                                  placeholder="اكتب السؤال باللغة الإنجليزية أو العربية هنا..."
                                  className="input-control"
                                  style={{ height: '70px' }}
                                />
                              </div>

                              {/* Question Image Attachment */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExamQImageInputIdx(qIdx);
                                      examQImageInputRef.current.click();
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.78rem', gap: '6px' }}
                                  >
                                    <Image size={15} />
                                    <span>{q.questionImage ? 'تغيير صورة السؤال 🖼️' : 'إرفاق صورة للسؤال 🖼️'}</span>
                                  </button>

                                  {q.questionImage && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, questionImage: '' } : item));
                                      }}
                                      className="btn btn-ghost btn-sm"
                                      style={{ fontSize: '0.75rem', color: '#EF4444' }}
                                    >
                                      إزالة الصورة ✖
                                    </button>
                                  )}
                                </div>

                                {q.questionImage && (
                                  <div style={{ marginTop: '8px', maxWidth: '320px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                    <img src={q.questionImage} alt="Question Attachment" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', background: '#000' }} />
                                  </div>
                                )}
                              </div>

                              {/* Choices / Options for MCQ, Multi, TF */}
                              {(q.type === 'mcq' || q.type === 'multi' || q.type === 'tf') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px' }}>
                                  <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                                    خيارات الإجابة (حدد الإجابة الصحيحة):
                                  </label>

                                  {(q.options || []).map((opt, optIdx) => {
                                    const isCorrect = q.type === 'multi' 
                                      ? (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIdx))
                                      : (q.correctAnswer === optIdx);

                                    return (
                                      <div key={optIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '8px', border: isCorrect ? '1.5px solid var(--success)' : '1px solid var(--border-subtle)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {/* Radio / Checkbox for correct answer */}
                                          {q.type === 'multi' ? (
                                            <input
                                              type="checkbox"
                                              checked={isCorrect}
                                              onChange={e => {
                                                setBldExamQuestions(prev => prev.map((item, i) => {
                                                  if (i !== qIdx) return item;
                                                  const currentArr = Array.isArray(item.correctAnswer) ? [...item.correctAnswer] : [];
                                                  const nextArr = e.target.checked 
                                                    ? [...currentArr, optIdx]
                                                    : currentArr.filter(idx => idx !== optIdx);
                                                  return { ...item, correctAnswer: nextArr };
                                                }));
                                              }}
                                              style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                                              title="تحديد كإجابة صحيحة"
                                            />
                                          ) : (
                                            <input
                                              type="radio"
                                              name={`inline_correct_${q.id || qIdx}`}
                                              checked={isCorrect}
                                              onChange={() => {
                                                setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, correctAnswer: optIdx } : item));
                                              }}
                                              style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                                              title="تحديد كإجابة صحيحة"
                                            />
                                          )}

                                          <input
                                            type="text"
                                            value={opt}
                                            disabled={q.type === 'tf'}
                                            onChange={e => {
                                              const val = e.target.value;
                                              setBldExamQuestions(prev => prev.map((item, i) => {
                                                if (i !== qIdx) return item;
                                                const newOpts = [...item.options];
                                                newOpts[optIdx] = val;
                                                return { ...item, options: newOpts };
                                              }));
                                            }}
                                            className="input-control"
                                            style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                                            placeholder={`نص الاختيار ${optIdx + 1}`}
                                          />

                                          {/* Option Image Upload Button */}
                                          {q.type !== 'tf' && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveOptUploadTarget({ qIdx, optIdx });
                                                examOptImageInputRef.current.click();
                                              }}
                                              className="btn btn-ghost btn-sm"
                                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                              title="إرفاق صورة لهذا الاختيار"
                                            >
                                              <Image size={15} />
                                            </button>
                                          )}

                                          {/* Delete option button if > 2 */}
                                          {q.type !== 'tf' && (q.options?.length || 0) > 2 && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBldExamQuestions(prev => prev.map((item, i) => {
                                                  if (i !== qIdx) return item;
                                                  const newOpts = item.options.filter((_, idx) => idx !== optIdx);
                                                  const newImages = (item.optionImages || []).filter((_, idx) => idx !== optIdx);
                                                  return { ...item, options: newOpts, optionImages: newImages };
                                                }));
                                              }}
                                              className="btn btn-ghost btn-sm"
                                              style={{ color: '#EF4444', padding: '4px 8px' }}
                                            >
                                              <X size={15} />
                                            </button>
                                          )}
                                        </div>

                                        {/* Option image preview if attached */}
                                        {q.optionImages?.[optIdx] && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '26px' }}>
                                            <img src={q.optionImages[optIdx]} alt={`Option ${optIdx + 1}`} style={{ height: '50px', borderRadius: '4px', objectFit: 'contain', background: '#000' }} />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBldExamQuestions(prev => prev.map((item, i) => {
                                                  if (i !== qIdx) return item;
                                                  const newImages = [...(item.optionImages || [])];
                                                  newImages[optIdx] = '';
                                                  return { ...item, optionImages: newImages };
                                                }));
                                              }}
                                              className="btn btn-ghost btn-sm"
                                              style={{ color: '#EF4444', fontSize: '0.72rem' }}
                                            >
                                              إزالة صورة الاختيار
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {q.type !== 'tf' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBldExamQuestions(prev => prev.map((item, i) => {
                                          if (i !== qIdx) return item;
                                          return {
                                            ...item,
                                            options: [...(item.options || []), `اختيار جديد ${(item.options?.length || 0) + 1}`],
                                            optionImages: [...(item.optionImages || []), '']
                                          };
                                        }));
                                      }}
                                      className="btn btn-ghost btn-sm"
                                      style={{ alignSelf: 'flex-start', fontSize: '0.78rem', marginTop: '4px' }}
                                    >
                                      + إضافة اختيار إضافي
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Model Answer for Essay & Short Answer */}
                              {(q.type === 'essay' || q.type === 'short_answer') && (
                                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px' }}>
                                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '4px' }}>
                                    نموذج الإجابة أو المعايير التي يقيس عليها المستر أثناء التصحيح اليدوي:
                                  </label>
                                  <textarea
                                    value={q.modelAnswer || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, modelAnswer: val } : item));
                                    }}
                                    placeholder="اكتب المعايير أو الإجابة النموذجية الاسترشادية لتسهيل تقييم إجابة الطالب..."
                                    className="input-control"
                                    style={{ height: '65px' }}
                                  />
                                </div>
                              )}

                              {/* Rationale / Explanation */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                                  شرح الإجابة النموذجية وتوضيح القاعدة (يظهر للطالب بعد إعلان النتيجة):
                                </label>
                                <input
                                  type="text"
                                  value={q.explanation || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, explanation: val } : item));
                                  }}
                                  placeholder="توضيح سبب صحة الإجابة أو القاعدة اللغوية..."
                                  className="input-control"
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Question Toolbar (Positioned at the BOTTOM of the questions list) */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        background: 'var(--bg-surface)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '2px dashed var(--primary-500)',
                        marginTop: '0.5rem'
                      }}>
                        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--primary-700)' }}>
                            ➕ إضافة سؤال جديد في نهاية الامتحان (أسفل آخر سؤال):
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            اختر نوع السؤال لإضافته في نهاية القائمة مباشرة
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleAddQuestionToBuilder('mcq')}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.82rem', gap: '6px' }}
                          >
                            <Plus size={14} /> <span>+ اختيار من متعدد (إجابة واحدة)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddQuestionToBuilder('multi')}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.82rem', gap: '6px' }}
                          >
                            <Plus size={14} /> <span>+ اختيار من متعدد (أكثر من إجابة)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddQuestionToBuilder('tf')}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.82rem', gap: '6px' }}
                          >
                            <Plus size={14} /> <span>+ صح أو خطأ (True/False)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddQuestionToBuilder('essay')}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.82rem', gap: '6px', borderColor: 'var(--accent-500)', color: 'var(--accent-700)', fontWeight: 800 }}
                          >
                            <Plus size={14} /> <span>+ سؤال مقالي (تصحيح يدوي) ✍️</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddQuestionToBuilder('short_answer')}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.82rem', gap: '6px', borderColor: 'var(--accent-500)', color: 'var(--accent-700)', fontWeight: 800 }}
                          >
                            <Plus size={14} /> <span>+ إجابة قصيرة (تصحيح يدوي) 📝</span>
                          </button>
                        </div>
                      </div>

                      {/* Preview Exam Button */}
                      {bldExamQuestions.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <button
                            type="button"
                            onClick={handleOpenPreviewModal}
                            className="btn btn-secondary btn-md"
                            style={{ gap: '8px', fontWeight: 800 }}
                          >
                            <Eye size={16} />
                            <span>👁️ معاينة الامتحان كطالب قبل حفظ ونشر المحاضرة</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ========================================================= */}
                {/* FORM ACTION BUTTONS BAR (Spanning 1 / -1 Full Width) */}
                {/* ========================================================= */}
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '2px solid var(--border-subtle)',
                  marginTop: '0.5rem'
                }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{
                      flex: 1,
                      gap: '8px',
                      padding: '1rem 1.75rem',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      background: editingLectureId ? 'var(--accent-gradient, #4f46e5)' : 'var(--primary-gradient)'
                    }}
                  >
                    <Upload size={20} />
                    <span>
                      {editingLectureId 
                        ? '💾 حفظ وتثبيت تعديلات المحاضرة والامتحان الآن' 
                        : (hasLectureExam ? '🚀 نشر المحاضرة والامتحان الآن لجميع الطلاب' : '🚀 نشر المحاضرة والفيديو الآن لجميع الطلاب')}
                    </span>
                  </button>

                  {editingLectureId && (
                    <button
                      type="button"
                      onClick={handleCancelEditLecture}
                      className="btn btn-ghost btn-lg"
                      style={{
                        padding: '1rem 1.5rem',
                        fontSize: '0.95rem',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      إلغاء التعديل ✖
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Existing Lectures List with Delete */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  المحاضرات المنشورة حالياً (يمكنك تصفية المحاضرات حسب المرحلة)
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي: {lectures.length} محاضرة</span>
              </div>

              {/* Stage Filter Tabs for Lectures */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setLectureStageFilter('all')}
                  className={`btn btn-sm ${lectureStageFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}
                >
                  🌟 جميع المراحل ({lectures.length})
                </button>
                {stages.map(s => {
                  const count = (Array.isArray(lectures) ? lectures : []).filter(l => l.stageId === s.id).length;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setLectureStageFilter(s.id)}
                      className={`btn btn-sm ${lectureStageFilter === s.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}
                    >
                      🎓 {s.name} ({count})
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {lectures
                  .filter(l => lectureStageFilter === 'all' ? true : l.stageId === lectureStageFilter)
                  .map(lec => (
                  <div
                    key={lec.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={lec.thumbnail} alt={lec.title} style={{ width: '70px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <span className="badge badge-primary">{lec.unitNumber}</span>
                          <strong style={{ fontSize: '0.95rem' }}>{lec.title}</strong>
                          {(() => {
                            const sec = sections.find(s => s.id === lec.sectionId);
                            if (sec) {
                              return (
                                <span className={sec.type === 'course' ? 'badge badge-gold' : 'badge badge-success'} style={{ fontSize: '0.72rem' }}>
                                  {sec.type === 'course' ? '📁 كورس: ' : '📅 شهر: '}{sec.title}
                                </span>
                              );
                            }
                            return <span className="badge" style={{ background: '#E2E8F0', color: '#475569', fontSize: '0.72rem' }}>محاضرة عامة</span>;
                          })()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span>المرحلة: {stages.find(s => s.id === lec.stageId)?.name || lec.stageId}</span>
                          <span>•</span>
                          <span>⏱️ {lec.duration}</span>
                          <span>•</span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 700 }}>نقل للقسم:</span>
                            <select
                              value={lec.sectionId || ''}
                              onChange={e => moveLectureToSection(lec.id, e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
                            >
                              <option value="">(بدون قسم)</option>
                              {sections.filter(s => s.stageId === lec.stageId).map(s => (
                                <option key={s.id} value={s.id}>{s.type === 'course' ? 'كورس: ' : 'شهر: '}{s.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEditLecture(lec)}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '4px', background: 'var(--accent-gradient, #4f46e5)', color: '#fff' }}
                        title="تعديل بيانات المحاضرة والامتحان المرتبط بها داخل نفس الصفحة"
                      >
                        <Edit size={14} />
                        <span>تعديل المحاضرة والامتحان ✏️</span>
                      </button>
                      <button
                        onClick={() => onNavigate('lecture-room', { lectureId: lec.id })}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '4px' }}
                      >
                        <Eye size={14} />
                        <span>تشغيل المحاضرة</span>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من رغبتك في حذف محاضرة "${lec.title}" نهائياً؟`)) {
                            deleteLecture(lec.id);
                          }
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', gap: '4px' }}
                      >
                        <Trash2 size={14} />
                        <span>حذف المحاضرة</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MONTHS & COURSES DYNAMIC MANAGEMENT (SECTIONS) */}
        {/* ========================================================= */}
        {activeTab === 'sections' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)', border: '2px solid var(--primary-500)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
                    إدارة الشهور والكورسات الدراسية (Months & Courses Manager) 📅
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    لكل مرحلة تعليمية إمكانية إنشاء شهور دراسية أو كورسات كاملة، تحديد أسعارها وأغلفتها، والتحكم في ظهورها للطلاب.
                  </p>
                </div>
              </div>

              {/* Add / Edit Section Form */}
              <form onSubmit={handleSaveSection} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'flex-end', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المرحلة التعليمية:</label>
                  <select 
                    value={newSecStageId} 
                    onChange={e => setNewSecStageId(e.target.value)} 
                    className="input-control"
                    style={{ fontWeight: 800 }}
                  >
                    {stages.map(s => <option key={s.id} value={s.id}>🎓 {s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نوع القسم:</label>
                  <select 
                    value={newSecType} 
                    onChange={e => setNewSecType(e.target.value)} 
                    className="input-control"
                    style={{ fontWeight: 800 }}
                  >
                    <option value="month">📅 شهر دراسي (Month)</option>
                    <option value="course">📁 كورس كامل / تأسيس (Course)</option>
                  </select>
                </div>

                {newSecType === 'month' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رقم الشهر:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="12" 
                      value={newSecMonthNumber} 
                      onChange={e => setNewSecMonthNumber(e.target.value)} 
                      className="input-control" 
                      placeholder="1, 2, 3..." 
                      required 
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سعر الاشتراك (ج.م):</label>
                  <input 
                    type="number" 
                    value={newSecPrice} 
                    onChange={e => setNewSecPrice(e.target.value)} 
                    className="input-control" 
                    placeholder="مثال: 180" 
                    required 
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان الشهر أو الكورس:</label>
                  <input 
                    type="text" 
                    value={newSecTitle} 
                    onChange={e => setNewSecTitle(e.target.value)} 
                    className="input-control" 
                    placeholder="مثال: الشهر الأول: شرح Units 1 & 2 أو كورس التأسيس الشامل" 
                    required 
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>وصف محتوى الشهر / الكورس:</label>
                  <input 
                    type="text" 
                    value={newSecDesc} 
                    onChange={e => setNewSecDesc(e.target.value)} 
                    className="input-control" 
                    placeholder="تفاصيل ما يحتويه هذا الشهر من قواعد وكلمات ومهارات..." 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>صورة غلاف القسم:</label>
                  <input 
                    ref={sectionCoverInputRef} 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => handleImageFileChange(e, setNewSecCover, 'غلاف القسم')} 
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <img src={newSecCover} alt="Cover" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                    <button type="button" onClick={() => sectionCoverInputRef.current?.click()} className="btn btn-secondary btn-sm" style={{ flex: 1, gap: '6px' }}>
                      <Image size={15} /> <span>رفع غلاف 🖼️</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', marginBottom: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={newSecIsVisible} 
                      onChange={e => setNewSecIsVisible(e.target.checked)} 
                    />
                    <span>ظاهر ومتاح للطلاب بالمنصة ✓</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingSectionId && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingSectionId(null); setNewSecTitle(''); setNewSecDesc(''); }} 
                        className="btn btn-secondary btn-sm"
                      >
                        إلغاء
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '44px', fontWeight: 800 }}>
                      {editingSectionId ? '💾 حفظ التعديلات' : '➕ إضافة الشهر / الكورس'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Sections Listing */}
              <div>
                <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    قائمة الشهور والكورسات المسجلة ({sections.length})
                  </h4>
                  {/* Stage filter pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedSectionStageFilter('all')} 
                      className={`btn btn-sm ${selectedSectionStageFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      🌟 الكل ({sections.length})
                    </button>
                    {stages.map(s => {
                      const count = sections.filter(sec => sec.stageId === s.id).length;
                      return (
                        <button 
                          key={s.id} 
                          type="button" 
                          onClick={() => setSelectedSectionStageFilter(s.id)} 
                          className={`btn btn-sm ${selectedSectionStageFilter === s.id ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          🎓 {s.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sections
                    .filter(sec => selectedSectionStageFilter === 'all' || sec.stageId === selectedSectionStageFilter)
                    .map(sec => {
                      const secLecs = lectures.filter(l => l.sectionId === sec.id);
                      return (
                        <div key={sec.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '1.1rem 1.4rem', 
                          background: 'var(--bg-subtle)', 
                          borderRadius: '12px', 
                          border: sec.isVisible !== false ? '1px solid var(--border-subtle)' : '1px dashed #EF4444',
                          flexWrap: 'wrap', 
                          gap: '1rem' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <img src={sec.cover} alt={sec.title} style={{ width: '80px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <span className={sec.type === 'course' ? 'badge badge-gold' : 'badge badge-primary'}>
                                  {sec.type === 'course' ? '📁 كورس كامل' : `📅 الشهر ${sec.monthNumber || 1}`}
                                </span>
                                <strong style={{ fontSize: '1.05rem' }}>{sec.title}</strong>
                                <span className="badge badge-success" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                                  {sec.price} ج.م
                                </span>
                                {sec.isVisible !== false ? (
                                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>ظاهر للطلاب ✓</span>
                                ) : (
                                  <span className="badge badge-error" style={{ fontSize: '0.72rem' }}>🔒 مخفي مؤقتاً</span>
                                )}
                              </div>
                              <p style={{ margin: '0 0 4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{sec.description}</p>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                المرحلة: <strong>{sec.stageName}</strong> • عدد المحاضرات المندرجة داخله: <strong style={{ color: 'var(--primary-600)' }}>{secLecs.length} محاضرة</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => updateSection(sec.id, { isVisible: sec.isVisible === false ? true : false })}
                              className={`btn btn-sm ${sec.isVisible !== false ? 'btn-secondary' : 'btn-warning'}`}
                              title="تبديل حالة الظهور"
                            >
                              {sec.isVisible !== false ? 'إخفاء 🔒' : 'إظهار 👁️'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingSectionId(sec.id);
                                setNewSecStageId(sec.stageId);
                                setNewSecType(sec.type || 'month');
                                setNewSecTitle(sec.title);
                                setNewSecDesc(sec.description || '');
                                setNewSecPrice(String(sec.price || 180));
                                setNewSecCover(sec.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80');
                                setNewSecIsVisible(sec.isVisible !== false);
                                window.scrollTo({ top: 350, behavior: 'smooth' });
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              <Edit size={14} /> <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف قسم "${sec.title}"؟ (المحاضرات المندرجة لن تُحذف وستبقى محفوظة)`)) {
                                  deleteSection(sec.id);
                                }
                              }}
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#EF4444' }}
                            >
                              <Trash2 size={14} /> <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: STUDENT SUBSCRIPTIONS MANAGEMENT (إدارة الاشتراكات) */}
        {/* ========================================================= */}
        {activeTab === 'subscriptions' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #1F4D3A 0%, #15382A 100%)', color: '#F4E8D3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(166, 124, 82, 0.4)' }}>
                    <CreditCard size={26} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
                      التحكم الكامل في اشتراكات وصلاحيات الطلاب 🎫
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                      إيقاف مؤقت، تمديد الصلاحية، إعادة تفعيل، إلغاء نهائي، وتجميد الحسابات مع سجل تدقيق أمني وإجراءات جماعية.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setIsAuditModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ gap: '8px', fontWeight: 800 }}
                  >
                    <span>سجل العمليات والتدقيق 📜</span>
                    <span className="badge badge-gold">{subscriptionAuditLogs.length}</span>
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #10B981' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>اشتراكات نشطة سارية:</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#10B981' }}>{activeSubCount}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>طالب مشترك</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #F59E0B' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>موقوفة مؤقتاً (Paused):</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#F59E0B' }}>{pausedSubCount}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>اشتراك</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #EF4444' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>منتهية الصلاحية:</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#EF4444' }}>{expiredSubCount}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>اشتراك</span>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #6366F1' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>حسابات مجمدة بالكامل:</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#6366F1' }}>{frozenSubCount}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>حساب</span>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={subSearch}
                    onChange={e => setSubSearch(e.target.value)}
                    placeholder="بحث باسم الطالب، الهاتف، الكود..."
                    className="input-control"
                    style={{ paddingRight: '40px' }}
                  />
                </div>

                <div>
                  <select
                    value={subStageFilter}
                    onChange={e => setSubStageFilter(e.target.value)}
                    className="input-control"
                    style={{ fontWeight: 700 }}
                  >
                    <option value="all">🎓 كل المراحل الدراسية</option>
                    {stages.map(stg => (
                      <option key={stg.id} value={stg.id}>{stg.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={subStatusFilter}
                    onChange={e => setSubStatusFilter(e.target.value)}
                    className="input-control"
                    style={{ fontWeight: 700 }}
                  >
                    <option value="all">⚡ كل الحالات</option>
                    <option value="active">🟢 سارية ونشطة فقط</option>
                    <option value="paused">🟡 موقوفة مؤقتاً فقط</option>
                    <option value="expired">🔴 منتهية الصلاحية فقط</option>
                    <option value="cancelled">⚫ ملغاة نهائياً</option>
                    <option value="frozen">❄️ حسابات مجمدة</option>
                  </select>
                </div>
              </div>

              {/* Sticky Bulk Selection Bar */}
              {selectedSubStudentIds.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #1F4D3A 0%, #15382A 100%)',
                  color: 'white',
                  padding: '1rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 8px 25px rgba(31, 77, 58, 0.4)',
                  border: '1px solid rgba(166, 124, 82, 0.5)'
                }} className="animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                      تم تحديد {selectedSubStudentIds.length} طالب
                    </span>
                    <span style={{ fontSize: '0.9rem' }}>
                      اختر الإجراء الجماعي لتطبيقه دفعة واحدة:
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleOpenBulkModal('pause')}
                      className="btn btn-warning btn-sm"
                      style={{ gap: '6px', fontWeight: 800 }}
                    >
                      <Pause size={16} />
                      <span>إيقاف جماعي ⏸️</span>
                    </button>

                    <button
                      onClick={() => handleOpenBulkModal('resume')}
                      className="btn btn-success btn-sm"
                      style={{ gap: '6px', fontWeight: 800 }}
                    >
                      <Play size={16} />
                      <span>تفعيل جماعي ▶️</span>
                    </button>

                    <button
                      onClick={() => handleOpenBulkModal('extend')}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', fontWeight: 800, background: 'rgba(255,255,255,0.2)', color: 'white' }}
                    >
                      <Calendar size={16} />
                      <span>تمديد جماعي (+30 يوم) ⏳</span>
                    </button>

                    <button
                      onClick={() => setSelectedSubStudentIds([])}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#FCA5A5' }}
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>
              )}

              {/* Subscriptions Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                      <th style={{ padding: '12px 14px', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={filteredSubscriptions.length > 0 && selectedSubStudentIds.length === filteredSubscriptions.length}
                          onChange={handleSelectAllSubscriptions}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </th>
                      <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>الطالب</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>المرحلة</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>المحتوى المشترك فيه</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>كود التفعيل</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>الصلاحية والانتهاء</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>الحالة</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.85rem', textAlign: 'center' }}>إجراءات التحكم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          لم يتم العثور على اشتراكات مطابقة للبحث أو الفلتر المحدد.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptions.map((sub, idx) => {
                        const isSelected = selectedSubStudentIds.includes(sub.studentId);
                        const expDate = new Date(sub.expirationDate);
                        const diffDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                        return (
                          <tr
                            key={`${sub.studentId}-${sub.targetId}-${idx}`}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              background: isSelected ? 'rgba(31, 77, 58, 0.05)' : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ padding: '12px 14px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectSubStudent(sub.studentId)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                              />
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={sub.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                  alt={sub.studentName}
                                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                                />
                                <div>
                                  <strong style={{ display: 'block', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                    {sub.studentName}
                                  </strong>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    <span>كود: {sub.studentCode || sub.studentId}</span>
                                    <span>•</span>
                                    <a
                                      href={`https://wa.me/${(sub.studentPhone || '').replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#059669', textDecoration: 'none' }}
                                    >
                                      {sub.studentPhone}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontWeight: 700 }}>
                                {sub.stageName}
                              </span>
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                {sub.targetTitle}
                              </strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                نوع المحتوى: {sub.targetType === 'month' ? 'شهر دراسي' : (sub.targetType === 'course' ? 'كورس' : 'محاضرة')}
                              </span>
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              <code style={{ fontSize: '0.82rem', background: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 700 }}>
                                {sub.activationCode}
                              </code>
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                                  {new Date(sub.expirationDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                                {sub.status === 'active' && (
                                  <span className="badge" style={{ background: diffDays <= 5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: diffDays <= 5 ? '#EF4444' : '#10B981', marginRight: '6px', fontSize: '0.72rem' }}>
                                    متبقي {diffDays} يوم
                                  </span>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: '12px 14px' }}>
                              {sub.isFrozen ? (
                                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1', fontWeight: 800 }}>
                                  ❄️ حساب مجمد
                                </span>
                              ) : sub.status === 'paused' ? (
                                <div>
                                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontWeight: 800 }}>
                                    ⏸️ موقوف مؤقتاً
                                  </span>
                                  {sub.pauseReason && (
                                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {sub.pauseReason}
                                    </span>
                                  )}
                                </div>
                              ) : sub.status === 'expired' ? (
                                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: 800 }}>
                                  🔴 منتهي الصلاحية
                                </span>
                              ) : sub.status === 'cancelled' ? (
                                <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#64748B', fontWeight: 800 }}>
                                  ⚫ ملغي نهائياً
                                </span>
                              ) : (
                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800 }}>
                                  🟢 نشط وسارٍ
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {sub.status === 'paused' ? (
                                  <button
                                    onClick={() => resumeStudentSubscription(sub.studentId, sub.targetId)}
                                    className="btn btn-success btn-sm"
                                    title="إعادة تفعيل الاشتراك فوراً"
                                    style={{ gap: '4px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 800 }}
                                  >
                                    <Play size={13} />
                                    <span>تفعيل</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenPauseModal(sub)}
                                    className="btn btn-warning btn-sm"
                                    title="إيقاف الاشتراك مؤقتاً"
                                    style={{ gap: '4px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 800 }}
                                  >
                                    <Pause size={13} />
                                    <span>إيقاف</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenExtendModal(sub)}
                                  className="btn btn-secondary btn-sm"
                                  title="تمديد مدة الاشتراك"
                                  style={{ gap: '4px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                                >
                                  <Calendar size={13} />
                                  <span>تمديد</span>
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من تجميد/فك تجميد حساب الطالب (${sub.studentName}) بالكامل؟`)) {
                                      toggleStudentFreeze(sub.studentId, 'قرار إدارة المنصة');
                                    }
                                  }}
                                  className="btn btn-ghost btn-sm"
                                  title={sub.isFrozen ? 'فك تجميد الحساب' : 'تجميد الحساب بالكامل'}
                                  style={{ color: sub.isFrozen ? '#10B981' : '#6366F1', padding: '4px 8px' }}
                                >
                                  <UserX size={14} />
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`⚠️ تحذير: هل أنت متأكد من إلغاء اشتراك الطالب (${sub.studentName}) في "${sub.targetTitle}" نهائياً؟`)) {
                                      cancelStudentSubscription(sub.studentId, sub.targetId, 'إلغاء نهائي من قِبل المستر');
                                    }
                                  }}
                                  className="btn btn-ghost btn-sm"
                                  title="إلغاء الاشتراك نهائياً"
                                  style={{ color: '#EF4444', padding: '4px 8px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: MANUAL EXAM CREATION & MANUAL GRADING SUITE */}
        {/* ========================================================= */}
        {activeTab === 'exams' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #1F4D3A 0%, #15382A 100%)', color: '#F4E8D3', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(166, 124, 82, 0.4)' }}>
                    <HelpCircle size={26} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
                      استوديو إنشاء الامتحانات والتصحيح اليدوي (100% Manual - No AI) ✍️
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                      أنشئ امتحانات المحاضرات يدويًا بالكامل مع دعم الصور والأسئلة المقالية، ومراجعة وتصحيح إجابات الطلاب وفك المحاضرات التالية.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setExamsSubTab('list')}
                    className={`btn ${examsSubTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ gap: '6px', fontWeight: 800 }}
                  >
                    <BookOpen size={16} />
                    <span>قائمة الامتحانات ({lectures.length})</span>
                  </button>

                  <button
                    onClick={() => setExamsSubTab('grading')}
                    className={`btn ${examsSubTab === 'grading' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ gap: '6px', fontWeight: 800 }}
                  >
                    <FileText size={16} />
                    <span>التصحيح اليدوي للأسئلة المقالية</span>
                    {pendingGradingSubmissions.length > 0 && (
                      <span className="badge badge-warning" style={{ background: '#EF4444', color: 'white' }}>
                        {pendingGradingSubmissions.length} 🔔
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setExamsSubTab('general')}
                    className={`btn ${examsSubTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ gap: '6px', fontWeight: 800 }}
                  >
                    <Trophy size={16} color="#F59E0B" />
                    <span>🌟 الامتحان العام الشامل وأكواد الطلاب ({generalExams.length})</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Exams List by Lecture */}
              {examsSubTab === 'list' && (
                <div>
                  <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800 }}>
                        امتحانات المحاضرات المسجلة بالمنصة:
                      </h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        اضغط على «تعديل الامتحان» أو «إنشاء امتحان» لفتح محرر الأسئلة اليدوي الكامل.
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          if (lectures.length > 0) {
                            handleOpenExamBuilder(lectures[0]);
                          } else {
                            addToast('يرجى رفع محاضرة أولاً لإنشاء امتحان لها', 'warning');
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px', fontWeight: 700 }}
                      >
                        <Plus size={15} />
                        <span>+ إضافة امتحان لمحاضرة</span>
                      </button>

                      <button
                        onClick={() => handleOpenGeneralExamBuilder()}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '6px', fontWeight: 800 }}
                      >
                        <Trophy size={15} />
                        <span>🌟 إنشاء امتحان عام مستقل</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                    {lectures.map((lec) => {
                      const lecExam = lec.exam || (examsData && examsData[lec.id]);
                      const hasExam = Boolean(lecExam);
                      const qCount = (lecExam?.questions || []).length;
                      const hasManualQ = (lecExam?.questions || []).some(q => q.type === 'essay' || q.type === 'short_answer');

                      return (
                        <div
                          key={lec.id}
                          className="card"
                          style={{
                            padding: '1.5rem',
                            background: 'var(--bg-subtle)',
                            border: hasExam ? '1.5px solid rgba(31, 77, 58, 0.4)' : '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div className="flex-between" style={{ marginBottom: '8px' }}>
                              <span className="badge badge-primary">{lec.stageName || 'المرحلة'}</span>
                              {hasExam ? (
                                <span className="badge" style={{ background: lecExam.status === 'draft' ? '#F59E0B' : '#10B981', color: 'white', fontWeight: 800 }}>
                                  {lecExam.status === 'draft' ? 'مسودة 📝' : 'منشور للطلاب ✓'}
                                </span>
                              ) : (
                                <span className="badge" style={{ background: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                                  لا يوجد امتحان
                                </span>
                              )}
                            </div>

                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                              {lec.title}
                            </h4>

                            {hasExam ? (
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '6px 0' }}>
                                  <span className="badge" style={{ background: 'var(--bg-surface)' }}>⏱️ {lecExam.timeMinutes || 25} دقيقة</span>
                                  <span className="badge" style={{ background: 'var(--bg-surface)' }}>❓ {qCount} أسئلة</span>
                                  <span className="badge" style={{ background: 'var(--bg-surface)' }}>🎯 {lecExam.passingMarks || 10}/{lecExam.totalMarks || 20} درجة</span>
                                </div>
                                {hasManualQ && (
                                  <div style={{ color: '#D97706', fontWeight: 700, fontSize: '0.78rem', marginTop: '4px' }}>
                                    ⚠️ يتضمن أسئلة مقالية تتطلب تصحيحاً يدوياً
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                لم يتم ربط امتحان بعد بهذه المحاضرة. يمكنك إنشاء امتحان يدوي كامل في ثوانٍ.
                              </p>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                            <button
                              onClick={() => handleOpenExamBuilder(lec)}
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1, gap: '6px', fontWeight: 800 }}
                            >
                              <Edit size={14} />
                              <span>{hasExam ? 'تعديل الامتحان ✏️' : 'إنشاء امتحان يدوي ➕'}</span>
                            </button>

                            {hasExam && (
                              <>
                                <button
                                  onClick={() => {
                                    setPreviewExamPayload(lecExam);
                                    setIsPreviewModalOpen(true);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  title="معاينة الامتحان كطالب"
                                  style={{ gap: '4px' }}
                                >
                                  <Eye size={14} />
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف امتحان محاضرة "${lec.title}"؟`)) {
                                      deleteExamFromLecture(lec.id);
                                    }
                                  }}
                                  className="btn btn-ghost btn-sm"
                                  title="حذف الامتحان"
                                  style={{ color: '#EF4444' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Manual Grading Queue */}
              {examsSubTab === 'grading' && (
                <div>
                  <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800 }}>
                        طابور التصحيح اليدوي لإجابات الطلاب المقالية 📝
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        المحاضرات التالية مقفولة لهؤلاء الطلاب حتى تقوم باعتماد درجاتهم المقالية وتجاوز نسبة 50%.
                      </p>
                    </div>

                    <span className="badge badge-warning" style={{ fontWeight: 800, padding: '6px 14px' }}>
                      {pendingGradingSubmissions.length} إجابة بانتظار اعتماد المستر
                    </span>
                  </div>

                  {pendingGradingSubmissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                      <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px' }}>
                        رائع! لا توجد امتحانات معلقة بانتظار التصحيح اليدوي 🎉
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        جميع إجابات الطلاب المقالية تم تصحيحها واعتماد درجاتها بنجاح.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                      {pendingGradingSubmissions.map((sub, sIdx) => (
                        <div
                          key={`${sub.lectureId}-${sub.studentUid}-${sIdx}`}
                          className="card"
                          style={{
                            padding: '1.5rem',
                            background: 'var(--bg-subtle)',
                            border: '1.5px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div className="flex-between" style={{ marginBottom: '10px' }}>
                              <span className="badge badge-gold">بانتظار تصحيح المستر ⏳</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                              الطالب: {sub.studentName}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                              امتحان: <strong>{sub.lectureTitle}</strong>
                            </p>

                            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                              <div className="flex-between">
                                <span style={{ color: 'var(--text-muted)' }}>الدرجة التلقائية المحتسبة:</span>
                                <strong style={{ color: '#1F4D3A' }}>{sub.autoScore} / {sub.maxMarks}</strong>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenGradingModal(sub)}
                            className="btn btn-primary"
                            style={{ gap: '8px', fontWeight: 800, width: '100%' }}
                          >
                            <Edit size={16} />
                            <span>مراجعة الإجابات المقالية ورصد الدرجة ✍️</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: General Exams & Student Personalized Codes */}
              {examsSubTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* General Exams Cards Showcase */}
                  <div>
                    <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#1F4D3A' }}>
                          🌟 الامتحانات العامة الشاملة المستقلة ({generalExams.length})
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          امتحانات مستقلة غير مرتبطة بمحاضرة محددة، تظهر في القائمة الرئيسية للطلاب ولا يدخل الطالب إلا بكود شخصي لمرة واحدة.
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenGeneralExamBuilder()}
                        className="btn btn-primary"
                        style={{ gap: '8px', fontWeight: 800 }}
                      >
                        <Plus size={16} />
                        <span>+ إنشاء امتحان عام جديد</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                      {generalExams.map(gExam => {
                        const qCount = (gExam.questions || []).length;
                        const essayCount = (gExam.questions || []).filter(q => q.type === 'essay' || q.type === 'short_answer').length;

                        return (
                          <div
                            key={gExam.id}
                            className="card"
                            style={{
                              padding: '1.5rem',
                              background: 'var(--bg-subtle)',
                              border: '2px solid rgba(166, 124, 82, 0.45)',
                              borderRadius: 'var(--radius-lg)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 4px 15px rgba(31, 77, 58, 0.06)'
                            }}
                          >
                            <div>
                              <div className="flex-between" style={{ marginBottom: '8px' }}>
                                <span className="badge badge-gold">امتحان عام شامل 🌟</span>
                                <span className="badge" style={{ background: gExam.status === 'draft' ? '#F59E0B' : '#10B981', color: 'white', fontWeight: 800 }}>
                                  {gExam.status === 'draft' ? 'مسودة' : 'منشور للطلاب ✓'}
                                </span>
                              </div>

                              <h4 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                                {gExam.title}
                              </h4>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: '1.5' }}>
                                {gExam.description || 'امتحان شامل لتقييم مستوى الطالب بكود مخصص.'}
                              </p>

                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                <span className="badge" style={{ background: 'var(--bg-surface)' }}>⏱️ {gExam.timeMinutes || 45} دقيقة</span>
                                <span className="badge" style={{ background: 'var(--bg-surface)' }}>❓ {qCount} سؤال</span>
                                <span className="badge" style={{ background: 'var(--bg-surface)' }}>🎯 {gExam.totalMarks || 30} درجة</span>
                                <span className="badge" style={{ background: 'var(--bg-surface)' }}>🔒 محاولة واحدة فقط</span>
                                {essayCount > 0 && (
                                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                                    ✍️ {essayCount} أسئلة مقالية
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                              <button
                                onClick={() => handleOpenGeneralExamBuilder(gExam)}
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1, gap: '6px', fontWeight: 800 }}
                              >
                                <Edit size={14} />
                                <span>تعديل الامتحان</span>
                              </button>

                              <button
                                onClick={() => {
                                  setPreviewExamPayload(gExam);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ gap: '4px' }}
                                title="معاينة كطالب"
                              >
                                <Eye size={14} />
                                <span>معاينة</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`حذف الامتحان العام "${gExam.title}" نهائياً؟`)) {
                                    deleteGeneralExam(gExam.id);
                                  }
                                }}
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#EF4444' }}
                                title="حذف الامتحان"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personalized Student Exam Codes Generator & Ledger */}
                  <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px', color: '#1F4D3A' }}>
                          🎟️ أكواد الامتحان العام المخصصة لكل طالب (Personalized Exam Codes)
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          يتم توليد كود خاص وفريد مربوط حصرياً باسم وكود الطالب ومرحلته، لا يمكن لأي طالب آخر استخدامه، ويُقفل فور تسليم الامتحان.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => window.print()}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '6px' }}
                          title="طباعة وتصدير قائمة الأكواد"
                        >
                          <Printer size={15} />
                          <span>طباعة وتصدير 🖨️</span>
                        </button>
                      </div>
                    </div>

                    {/* Generator Controls Box */}
                    <div style={{
                      background: 'var(--bg-subtle)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      marginBottom: '1.5rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1.25rem',
                      alignItems: 'flex-end'
                    }}>
                      {/* Single Student Generator */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                          توليد كود لطالب محدد:
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            value={selectedGenStudentForCode}
                            onChange={e => setSelectedGenStudentForCode(e.target.value)}
                            className="input-control"
                          >
                            <option value="">اختر الطالب من القائمة...</option>
                            {students.map(std => (
                              <option key={std.id} value={std.id}>
                                {std.name} ({std.code || std.id}) - {std.stageName}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedGenStudentForCode) {
                                addToast('يرجى اختيار الطالب أولاً', 'warning');
                                return;
                              }
                              const targetStd = students.find(s => s.id === selectedGenStudentForCode);
                              if (targetStd) {
                                generateGeneralExamCode({
                                  studentId: targetStd.id,
                                  studentName: targetStd.name,
                                  studentPhone: targetStd.phone,
                                  stageId: targetStd.stageId,
                                  stageName: targetStd.stageName,
                                  examId: generalExams[0]?.id || 'gen-exam-01',
                                  examTitle: generalExams[0]?.title || 'الامتحان العام الشامل'
                                });
                              }
                            }}
                            className="btn btn-primary"
                            style={{ flexShrink: 0, fontWeight: 800 }}
                          >
                            توليد الكود 🎟️
                          </button>
                        </div>
                      </div>

                      {/* Bulk Stage Generator */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                          توليد أكواد جماعية لكافة طلاب مرحلة:
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            value={selectedGenStageForBulk}
                            onChange={e => setSelectedGenStageForBulk(e.target.value)}
                            className="input-control"
                          >
                            {stages.map(stg => (
                              <option key={stg.id} value={stg.id}>{stg.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              bulkGenerateGeneralExamCodes(selectedGenStageForBulk, generalExams[0]?.id || 'gen-exam-01');
                            }}
                            className="btn btn-secondary"
                            style={{ flexShrink: 0, fontWeight: 800 }}
                          >
                            توليد للدفعة بالكامل ⚡
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          value={genExamCodeSearch}
                          onChange={e => setGenExamCodeSearch(e.target.value)}
                          placeholder="ابحث باسم الطالب، الكود الشخصي، أو رقم الهاتف..."
                          className="input-control"
                          style={{ paddingRight: '36px' }}
                        />
                      </div>

                      <select
                        value={genExamCodeStageFilter}
                        onChange={e => setGenExamCodeStageFilter(e.target.value)}
                        className="input-control"
                        style={{ width: 'auto' }}
                      >
                        <option value="all">جميع المراحل</option>
                        {stages.map(stg => (
                          <option key={stg.id} value={stg.id}>{stg.name}</option>
                        ))}
                      </select>

                      <select
                        value={genExamCodeStatusFilter}
                        onChange={e => setGenExamCodeStatusFilter(e.target.value)}
                        className="input-control"
                        style={{ width: 'auto' }}
                      >
                        <option value="all">جميع الحالات</option>
                        <option value="unused">🟢 غير مستخدم (متاح للدخول)</option>
                        <option value="used">✓ مستخدم (تم التسليم)</option>
                      </select>
                    </div>

                    {/* Personalized Codes Table */}
                    {(() => {
                      const filteredCodes = generalExamCodes.filter(c => {
                        const matchSearch = (c.studentName || '').toLowerCase().includes(genExamCodeSearch.toLowerCase()) ||
                          (c.code || '').toLowerCase().includes(genExamCodeSearch.toLowerCase()) ||
                          (c.studentPhone || '').includes(genExamCodeSearch);
                        const matchStage = genExamCodeStageFilter === 'all' || c.stageId === genExamCodeStageFilter;
                        const matchStatus = genExamCodeStatusFilter === 'all' ||
                          (genExamCodeStatusFilter === 'used' ? c.isUsed : !c.isUsed);
                        return matchSearch && matchStage && matchStatus;
                      });

                      return (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                                <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>اسم الطالب</th>
                                <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>المرحلة</th>
                                <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>الكود المخصص (حصرى)</th>
                                <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>حالة الكود والامتحان</th>
                                <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>تاريخ الإنشاء</th>
                                <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>تاريخ الاستخدام والدرجة</th>
                                <th style={{ padding: '12px 14px', fontSize: '0.85rem', textAlign: 'center' }}>إجراءات التحكم</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredCodes.length === 0 ? (
                                <tr>
                                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    لا توجد أكواد مطابقة. يمكنك توليد أكواد لطلابك فوراً من الأعلى.
                                  </td>
                                </tr>
                              ) : (
                                filteredCodes.map((cObj, cIdx) => (
                                  <tr
                                    key={cObj.code || cIdx}
                                    style={{
                                      borderBottom: '1px solid var(--border-subtle)',
                                      background: cObj.isUsed ? 'rgba(245, 158, 11, 0.03)' : 'transparent'
                                    }}
                                  >
                                    <td style={{ padding: '12px 14px' }}>
                                      <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--text-primary)' }}>
                                        {cObj.studentName}
                                      </strong>
                                      {cObj.studentPhone && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          {cObj.studentPhone}
                                        </span>
                                      )}
                                    </td>

                                    <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                                      <span className="badge badge-primary">{cObj.stageName || cObj.stageId}</span>
                                    </td>

                                    <td style={{ padding: '12px 14px' }}>
                                      <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.92rem',
                                        fontWeight: 800,
                                        letterSpacing: '1px',
                                        background: 'var(--bg-subtle)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-subtle)',
                                        color: '#1F4D3A'
                                      }}>
                                        {cObj.code}
                                      </span>
                                    </td>

                                    <td style={{ padding: '12px 14px' }}>
                                      {cObj.isUsed ? (
                                        <span className="badge" style={{ background: '#E2E8F0', color: '#475569', fontWeight: 800 }}>
                                          ✓ مستخدم (تم التسليم)
                                        </span>
                                      ) : (
                                        <span className="badge badge-success" style={{ fontWeight: 800 }}>
                                          🟢 متاح للدخول (غير مستخدم)
                                        </span>
                                      )}
                                    </td>

                                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {cObj.createdAt ? new Date(cObj.createdAt).toLocaleDateString('ar-EG') : 'اليوم'}
                                    </td>

                                    <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                                      {cObj.isUsed ? (
                                        <div>
                                          <strong style={{ color: '#1F4D3A', display: 'block' }}>{cObj.score || 'تم التسليم'}</strong>
                                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {cObj.usedAt ? new Date(cObj.usedAt).toLocaleString('ar-EG') : ''}
                                          </span>
                                        </div>
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>لم يبدأ بعد</span>
                                      )}
                                    </td>

                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(cObj.code);
                                            addToast(`تم نسخ كود الطالب (${cObj.studentName}): ${cObj.code}`, 'success');
                                          }}
                                          className="btn btn-secondary btn-sm"
                                          style={{ gap: '4px', fontSize: '0.75rem' }}
                                          title="نسخ الكود"
                                        >
                                          <Copy size={13} />
                                          <span>نسخ</span>
                                        </button>

                                        {cObj.isUsed && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm(`هل أنت متأكد من إعادة فتح محاولة الامتحان العام للطالب (${cObj.studentName})؟`)) {
                                                resetGeneralExamAttempt(cObj.studentId, cObj.examId);
                                              }
                                            }}
                                            className="btn btn-warning btn-sm"
                                            style={{ gap: '4px', fontSize: '0.75rem', fontWeight: 800 }}
                                            title="السماح بإعادة المحاولة"
                                          >
                                            <RotateCcw size={13} />
                                            <span>إعادة فتح</span>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: STANDALONE COMPREHENSIVE EXAMS STUDIO */}
        {/* ========================================================= */}
        {(activeTab === 'general-exams' || activeTab === 'comprehensive-exams') && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              {/* Header */}
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#1F4D3A' }}>
                      🌟 إدارة الامتحانات الشاملة (The Master Comprehensive Exams Studio)
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                      امتحانات شاملة مستقلة تماماً لا تتبع أي مرحلة أو محاضرة، تظهر للطلاب في قسم مستقل وفي القائمة الرئيسية، وتُدار بأكواد دخول مخصصة ومحاولة واحدة فقط.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('general-codes')}
                    className="btn btn-secondary"
                    style={{ gap: '6px', fontWeight: 700 }}
                  >
                    <Key size={16} />
                    <span>🎟️ أكواد الامتحانات الشاملة ({generalExamCodes.length})</span>
                  </button>

                  <button
                    onClick={() => handleOpenGeneralExamBuilder()}
                    className="btn btn-primary"
                    style={{ gap: '8px', fontWeight: 800 }}
                  >
                    <Plus size={16} />
                    <span>+ إضافة امتحان شامل جديد</span>
                  </button>
                </div>
              </div>

              {/* Cards Showcase */}
              {generalExams.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <Trophy size={48} style={{ color: '#F59E0B', marginBottom: '1rem', opacity: 0.6 }} />
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>لم يتم إنشاء أي امتحان شامل حتى الآن</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                    يمكنك إنشاء أول امتحان شامل لطلابك الآن، وتحديد المدة والدرجات وحالة الامتحان وكتابة الأسئلة يدويًا.
                  </p>
                  <button
                    onClick={() => handleOpenGeneralExamBuilder()}
                    className="btn btn-primary"
                    style={{ fontWeight: 800, gap: '6px' }}
                  >
                    <Plus size={16} />
                    <span>+ إضافة أول امتحان شامل الآن</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                  {generalExams.map(gExam => {
                    const qCount = (gExam.questions || []).length;
                    const essayCount = (gExam.questions || []).filter(q => q.type === 'essay' || q.type === 'short_answer').length;
                    const codesForThisExam = generalExamCodes.filter(c => c.examId === gExam.id);
                    const examKey = `general-${gExam.id}`;
                    const submissionsForThisExam = examSubmissions[examKey] ? Object.values(examSubmissions[examKey]) : [];

                    return (
                      <React.Fragment key={gExam.id}>
                        <div
                          className="card"
                          style={{
                            padding: '1.5rem',
                            background: 'var(--bg-subtle)',
                            border: '2px solid rgba(166, 124, 82, 0.45)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 15px rgba(31, 77, 58, 0.06)'
                          }}
                        >
                          <div>
                            <div className="flex-between" style={{ marginBottom: '8px' }}>
                              <span className="badge badge-gold">امتحان شامل مستقل 🌟</span>
                              <select
                                value={gExam.status || 'published'}
                                onChange={e => saveGeneralExam({ ...gExam, status: e.target.value })}
                                className="input-control"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  height: '28px',
                                  width: 'auto',
                                  fontWeight: 800,
                                  background: gExam.status === 'draft' ? '#FEF3C7' : gExam.status === 'suspended' ? '#FEE2E2' : '#D1FAE5',
                                  color: gExam.status === 'draft' ? '#92400E' : gExam.status === 'suspended' ? '#991B1B' : '#065F46',
                                  border: '1px solid var(--border-subtle)'
                                }}
                              >
                                <option value="published">منشور للطلاب ✓</option>
                                <option value="draft">مسودة 📁</option>
                                <option value="suspended">موقوف مؤقتاً 🚫</option>
                              </select>
                            </div>

                            <h4 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                              {gExam.title}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem', lineHeight: '1.5' }}>
                              {gExam.description || 'امتحان شامل لتقييم مستوى الطالب بكود مخصص.'}
                            </p>

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                              <span className="badge" style={{ background: 'var(--bg-surface)' }}>⏱️ {gExam.timeMinutes || 45} دقيقة</span>
                              <span className="badge" style={{ background: 'var(--bg-surface)' }}>❓ {qCount} سؤال</span>
                              <span className="badge" style={{ background: 'var(--bg-surface)' }}>🎯 {gExam.totalMarks || 30} درجة</span>
                              <span className="badge" style={{ background: 'var(--bg-surface)' }}>🔒 محاولة واحدة فقط</span>
                              {essayCount > 0 && (
                                <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                                  ✍️ {essayCount} أسئلة مقالية
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleOpenGeneralExamBuilder(gExam)}
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1, gap: '6px', fontWeight: 800 }}
                              >
                                <Edit size={14} />
                                <span>تعديل الامتحان</span>
                              </button>

                              <button
                                onClick={() => {
                                  setPreviewExamPayload(gExam);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ gap: '4px' }}
                                title="معاينة كطالب"
                              >
                                <Eye size={14} />
                                <span>معاينة</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`حذف الامتحان الشامل "${gExam.title}" نهائياً؟`)) {
                                    deleteGeneralExam(gExam.id);
                                  }
                                }}
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#EF4444' }}
                                title="حذف الامتحان"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setViewingSubmissionsExamId(viewingSubmissionsExamId === gExam.id ? null : gExam.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ width: '100%', gap: '6px', fontSize: '0.82rem', fontWeight: 800 }}
                            >
                              <Users size={14} />
                              <span>{viewingSubmissionsExamId === gExam.id ? 'إخفاء نتائج ومحاولات الطلاب ✖' : `عرض نتائج ومحاولات الطلاب (${submissionsForThisExam.length}) 👥`}</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedGenExamIdForCode(gExam.id);
                                setActiveTab('general-codes');
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', gap: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                              <Key size={13} />
                              <span>توليد أكواد لهذا الامتحان ({codesForThisExam.length} كود حالي)</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Submissions / Attempts Inspector */}
                        {viewingSubmissionsExamId === gExam.id && (
                          <div style={{
                            gridColumn: '1 / -1',
                            background: 'var(--bg-surface)',
                            border: '2px solid var(--primary-500)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            marginTop: '0.5rem',
                            marginBottom: '1rem',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.06)'
                          }}>
                            <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                              <h4 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                                📊 نتائج ومحاولات الطلاب في: {gExam.title}
                              </h4>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                إجمالي الطلاب الذين أتموا الامتحان: {submissionsForThisExam.length} طالب
                              </span>
                            </div>

                            {submissionsForThisExam.length === 0 ? (
                              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', margin: 0, fontSize: '0.92rem' }}>
                                لا توجد محاولات مسجلة حتى الآن لهذا الامتحان الشامل.
                              </p>
                            ) : (
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                  <thead>
                                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '2px solid var(--border-subtle)' }}>
                                      <th style={{ padding: '10px 14px', fontSize: '0.85rem' }}>اسم الطالب</th>
                                      <th style={{ padding: '10px 14px', fontSize: '0.85rem' }}>الكود المستخدم</th>
                                      <th style={{ padding: '10px 14px', fontSize: '0.85rem' }}>الدرجة المسجلة</th>
                                      <th style={{ padding: '10px 14px', fontSize: '0.85rem' }}>حالة التصحيح</th>
                                      <th style={{ padding: '10px 14px', fontSize: '0.85rem' }}>تاريخ المحاولة</th>
                                      <th style={{ padding: '10px 14px', fontSize: '0.85rem', textAlign: 'center' }}>إجراءات</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {submissionsForThisExam.map((sub, sIdx) => {
                                      const studentCodeObj = generalExamCodes.find(c => c.studentId === sub.studentId && c.examId === gExam.id);
                                      return (
                                        <tr key={sub.studentId || sIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                          <td style={{ padding: '10px 14px', fontWeight: 800 }}>{sub.studentName || 'طالب مسجل'}</td>
                                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#1F4D3A' }}>
                                            {sub.code || studentCodeObj?.code || '—'}
                                          </td>
                                          <td style={{ padding: '10px 14px' }}>
                                            <strong style={{ fontSize: '1rem', color: 'var(--primary-700)' }}>
                                              {sub.totalScore} / {sub.maxMarks}
                                            </strong>
                                          </td>
                                          <td style={{ padding: '10px 14px' }}>
                                            <span className={sub.status === 'pending_grading' ? 'badge badge-warning' : 'badge badge-success'} style={{ fontSize: '0.75rem' }}>
                                              {sub.status === 'pending_grading' ? 'بانتظار تصحيح المقالي ⏳' : 'تم التصحيح والاعتماد ✓'}
                                            </span>
                                          </td>
                                          <td style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('ar-EG') : '—'}
                                          </td>
                                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                            <button
                                              type="button"
                                              onClick={() => resetGeneralExamAttempt(sub.studentId, gExam.id)}
                                              className="btn btn-ghost btn-sm"
                                              style={{ color: '#D97706', fontSize: '0.78rem', gap: '4px', border: '1px solid rgba(217, 119, 6, 0.3)' }}
                                              title="إعادة فتح محاولة جديدة للطالب"
                                            >
                                              <RotateCcw size={14} />
                                              <span>إعادة فتح المحاولة 🔓</span>
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: STANDALONE COMPREHENSIVE EXAM CODES STUDIO */}
        {/* ========================================================= */}
        {(activeTab === 'general-codes' || activeTab === 'comprehensive-codes') && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              {/* Header */}
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: '#1F4D3A' }}>
                      🎟️ أكواد الامتحانات الشاملة (Comprehensive Exam Codes Studio)
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                      توليد كود دخول مشفر ومخصص لكل طالب مربوط باسمه ومرحلته وامتحانه، لا يمكن لأي طالب آخر استخدامه. المرحلة التعليمية هنا تُستخدم لحفظ بيانات الطالب فقط، ولا تجعل الامتحان الشامل تابعاً لأي مرحلة.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    style={{ gap: '6px', fontWeight: 700 }}
                    title="طباعة وتصدير قائمة الأكواد"
                  >
                    <Printer size={16} />
                    <span>طباعة وتصدير 🖨️</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('general-exams')}
                    className="btn btn-primary"
                    style={{ gap: '6px', fontWeight: 800 }}
                  >
                    <Trophy size={16} />
                    <span>🌟 إدارة الامتحانات الشاملة</span>
                  </button>
                </div>
              </div>

              {/* Generator Box */}
              <div style={{
                background: 'var(--bg-subtle)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 1rem', color: '#1F4D3A' }}>
                  توليد كود شخصي مخصص لطالب:
                </h4>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  alignItems: 'flex-end',
                  marginBottom: '1rem'
                }}>
                  {/* 1. Select Comprehensive Exam */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      1. اختيار الامتحان الشامل:
                    </label>
                    <select
                      value={selectedGenExamIdForCode || (generalExams[0]?.id || '')}
                      onChange={e => setSelectedGenExamIdForCode(e.target.value)}
                      className="input-control"
                    >
                      {generalExams.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Choose from enrolled students OR manual name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      2. اختيار طالب مسجل (اختياري):
                    </label>
                    <select
                      value={selectedGenStudentForCode}
                      onChange={e => {
                        const stdId = e.target.value;
                        setSelectedGenStudentForCode(stdId);
                        const foundStd = students.find(s => s.id === stdId);
                        if (foundStd) {
                          setCustomGenStudentName(foundStd.name);
                          setCustomGenStudentStage(foundStd.stageId || 'sec-3');
                        }
                      }}
                      className="input-control"
                    >
                      <option value="">-- أو اكتب الاسم يدويًا --</option>
                      {students.map(std => (
                        <option key={std.id} value={std.id}>
                          {std.name} ({std.code || std.id}) - {std.stageName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Student Name (Manual Text Input) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      3. إدخال اسم الطالب بالكامل:
                    </label>
                    <input
                      type="text"
                      value={customGenStudentName}
                      onChange={e => setCustomGenStudentName(e.target.value)}
                      placeholder="اسم الطالب ثلاثي..."
                      className="input-control"
                    />
                  </div>

                  {/* 4. Student Stage (for metadata/record keeping only) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      4. المرحلة التعليمية (لحفظ بيانات الطالب فقط):
                    </label>
                    <select
                      value={customGenStudentStage}
                      onChange={e => setCustomGenStudentStage(e.target.value)}
                      className="input-control"
                    >
                      {stages.map(stg => (
                        <option key={stg.id} value={stg.id}>{stg.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Generate Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!customGenStudentName.trim()) {
                          addToast('يرجى كتابة اسم الطالب أولاً لتوليد الكود المخصص', 'warning');
                          return;
                        }
                        const targetExamId = selectedGenExamIdForCode || (generalExams[0]?.id || 'gen-exam-01');
                        const targetExam = generalExams.find(e => e.id === targetExamId) || generalExams[0];
                        const foundStd = students.find(s => s.id === selectedGenStudentForCode);
                        const targetStageObj = stages.find(s => s.id === customGenStudentStage);

                        generateGeneralExamCode({
                          studentId: foundStd?.id || `std-${Date.now().toString().slice(-6)}`,
                          studentName: customGenStudentName.trim(),
                          studentPhone: foundStd?.phone || '',
                          stageId: customGenStudentStage,
                          stageName: targetStageObj?.name || 'مرحلة ثانوية',
                          examId: targetExamId,
                          examTitle: targetExam?.title || 'الامتحان الشامل'
                        });

                        setCustomGenStudentName('');
                        setSelectedGenStudentForCode('');
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', fontWeight: 800, padding: '0.85rem' }}
                    >
                      توليد كود الامتحان الشامل 🎟️
                    </button>
                  </div>
                </div>

                {/* Bulk Stage Generator Accordion */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <details style={{ cursor: 'pointer' }}>
                    <summary style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1F4D3A' }}>
                      ⚡ توليد سريع لكامل طلاب مرحلة دفعة واحدة (اضغط للفتح)
                    </summary>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={selectedGenStageForBulk}
                        onChange={e => setSelectedGenStageForBulk(e.target.value)}
                        className="input-control"
                        style={{ width: 'auto', minWidth: '200px' }}
                      >
                        {stages.map(stg => (
                          <option key={stg.id} value={stg.id}>{stg.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const targetExamId = selectedGenExamIdForCode || (generalExams[0]?.id || 'gen-exam-01');
                          bulkGenerateGeneralExamCodes(selectedGenStageForBulk, targetExamId);
                        }}
                        className="btn btn-secondary"
                        style={{ fontWeight: 800 }}
                      >
                        توليد أكواد لجميع طلاب المرحلة الآن 🚀
                      </button>
                    </div>
                  </details>
                </div>
              </div>

              {/* Search & Filters Bar */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={genExamCodeSearch}
                    onChange={e => setGenExamCodeSearch(e.target.value)}
                    placeholder="ابحث باسم الطالب، الكود المخصص، أو رقم الهاتف..."
                    className="input-control"
                    style={{ paddingRight: '36px' }}
                  />
                </div>

                <select
                  value={genExamCodeExamFilter}
                  onChange={e => setGenExamCodeExamFilter(e.target.value)}
                  className="input-control"
                  style={{ width: 'auto' }}
                >
                  <option value="all">جميع الامتحانات العامة</option>
                  {generalExams.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>

                <select
                  value={genExamCodeStageFilter}
                  onChange={e => setGenExamCodeStageFilter(e.target.value)}
                  className="input-control"
                  style={{ width: 'auto' }}
                >
                  <option value="all">جميع المراحل</option>
                  {stages.map(stg => (
                    <option key={stg.id} value={stg.id}>{stg.name}</option>
                  ))}
                </select>

                <select
                  value={genExamCodeStatusFilter}
                  onChange={e => setGenExamCodeStatusFilter(e.target.value)}
                  className="input-control"
                  style={{ width: 'auto' }}
                >
                  <option value="all">جميع الحالات</option>
                  <option value="unused">🟢 غير مستخدم (متاح للدخول)</option>
                  <option value="used">✓ مستخدم (تم التسليم)</option>
                  <option value="cancelled">🚫 ملغي</option>
                </select>
              </div>

              {/* Codes Table */}
              {(() => {
                const filteredCodes = generalExamCodes.filter(c => {
                  const matchSearch = (c.studentName || '').toLowerCase().includes(genExamCodeSearch.toLowerCase()) ||
                    (c.code || '').toLowerCase().includes(genExamCodeSearch.toLowerCase()) ||
                    (c.studentPhone || '').includes(genExamCodeSearch);
                  const matchExam = genExamCodeExamFilter === 'all' || c.examId === genExamCodeExamFilter;
                  const matchStage = genExamCodeStageFilter === 'all' || c.stageId === genExamCodeStageFilter;
                  const isCanc = c.isCancelled || c.status === 'cancelled';
                  let matchStatus = true;
                  if (genExamCodeStatusFilter === 'cancelled') {
                    matchStatus = isCanc;
                  } else if (genExamCodeStatusFilter === 'used') {
                    matchStatus = !isCanc && c.isUsed;
                  } else if (genExamCodeStatusFilter === 'unused') {
                    matchStatus = !isCanc && !c.isUsed;
                  }
                  return matchSearch && matchExam && matchStage && matchStatus;
                });

                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>اسم الطالب</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>المرحلة</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>الامتحان العام</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>الكود المخصص (حصرى)</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>حالة الكود</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>تاريخ الإنشاء</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem' }}>الاستخدام والدرجة</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.85rem', textAlign: 'center' }}>إجراءات التحكم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCodes.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              لا توجد أكواد مطابقة. يمكنك توليد كود جديد من النموذج بالأعلى.
                            </td>
                          </tr>
                        ) : (
                          filteredCodes.map((cObj, cIdx) => {
                            const isCanc = cObj.isCancelled || cObj.status === 'cancelled';
                            return (
                              <tr
                                key={cObj.code || cIdx}
                                style={{
                                  borderBottom: '1px solid var(--border-subtle)',
                                  background: isCanc ? 'rgba(239, 68, 68, 0.04)' : cObj.isUsed ? 'rgba(245, 158, 11, 0.03)' : 'transparent'
                                }}
                              >
                                <td style={{ padding: '12px 14px' }}>
                                  <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--text-primary)' }}>
                                    {cObj.studentName}
                                  </strong>
                                  {cObj.studentPhone && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {cObj.studentPhone}
                                    </span>
                                  )}
                                </td>

                                <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                                  <span className="badge badge-primary">{cObj.stageName || cObj.stageId}</span>
                                </td>

                                <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                                  <strong>{cObj.examTitle || 'الامتحان العام'}</strong>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.92rem',
                                    fontWeight: 800,
                                    letterSpacing: '1px',
                                    background: 'var(--bg-subtle)',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    color: isCanc ? '#EF4444' : '#1F4D3A',
                                    textDecoration: isCanc ? 'line-through' : 'none'
                                  }}>
                                    {cObj.code}
                                  </span>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  {isCanc ? (
                                    <span className="badge" style={{ background: '#EF4444', color: 'white', fontWeight: 800 }}>
                                      🚫 ملغي
                                    </span>
                                  ) : cObj.isUsed ? (
                                    <span className="badge" style={{ background: '#E2E8F0', color: '#475569', fontWeight: 800 }}>
                                      ✓ مستخدم (تم التسليم)
                                    </span>
                                  ) : (
                                    <span className="badge badge-success" style={{ fontWeight: 800 }}>
                                      🟢 غير مستخدم (متاح)
                                    </span>
                                  )}
                                </td>

                                <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {cObj.createdAt ? new Date(cObj.createdAt).toLocaleDateString('ar-EG') : 'اليوم'}
                                </td>

                                <td style={{ padding: '12px 14px', fontSize: '0.85rem' }}>
                                  {cObj.isUsed ? (
                                    <div>
                                      <strong style={{ color: '#1F4D3A', display: 'block' }}>{cObj.score || 'تم التسليم'}</strong>
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {cObj.usedAt ? new Date(cObj.usedAt).toLocaleString('ar-EG') : ''}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>لم يبدأ بعد</span>
                                  )}
                                </td>

                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(cObj.code);
                                        addToast(`تم نسخ كود الطالب (${cObj.studentName}): ${cObj.code}`, 'success');
                                      }}
                                      className="btn btn-secondary btn-sm"
                                      style={{ gap: '4px', fontSize: '0.75rem' }}
                                      title="نسخ الكود"
                                    >
                                      <Copy size={13} />
                                      <span>نسخ</span>
                                    </button>

                                    {!isCanc && !cObj.isUsed && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`هل أنت متأكد من إلغاء كود الطالب (${cObj.studentName})؟ لن يتمكن من استخدامه.`)) {
                                            cancelGeneralExamCode(cObj.code);
                                          }
                                        }}
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: '#EF4444', gap: '4px', fontSize: '0.75rem' }}
                                        title="إلغاء الكود"
                                      >
                                        <X size={13} />
                                        <span>إلغاء</span>
                                      </button>
                                    )}

                                    {cObj.isUsed && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`هل أنت متأكد من إعادة فتح محاولة الامتحان العام للطالب (${cObj.studentName})؟`)) {
                                            resetGeneralExamAttempt(cObj.studentId, cObj.examId);
                                          }
                                        }}
                                        className="btn btn-warning btn-sm"
                                        style={{ gap: '4px', fontSize: '0.75rem', fontWeight: 800 }}
                                        title="السماح بإعادة المحاولة"
                                      >
                                        <RotateCcw size={13} />
                                        <span>إعادة فتح</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SECURITY & ANTI-PIRACY SHIELD SUITE */}
        {/* ========================================================= */}
        {activeTab === 'security' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
                    مركز الأمان ودرع الحماية الفولاذي (The Master Shield Suite) 🛡️
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    نظام حماية متطور يمنع سرقة الفيديوهات، حجب تصوير الشاشة، منع كليك يمين، وحرق بيانات الطالب على الشاشة.
                  </p>
                </div>
              </div>

              {/* 5 Security Shields Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #10B981' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1rem' }}>1. منع كليك يمين والفحص</strong>
                    <span className="badge badge-success">نشط 100%</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    تعطيل القائمة المنسدلة ومنع حفظ الصور أو تنزيل روابط الفيديو مباشرة.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #F59E0B' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1rem' }}>2. حظر أدوات المطورين</strong>
                    <span className="badge badge-success">نشط 100%</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    منع أزرار F12 و Ctrl+Shift+I وتجميد الشاشة فور فتح أي أداة فحص برمجية.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #D97706' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1rem' }}>3. حجب تسجيل الشاشة (Blur)</strong>
                    <span className="badge badge-success">نشط 100%</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    تعتيم الشاشة وإيقاف الصوت تلقائياً عند تبديل التبويب أو تشغيل برامج التقاط النوافذ.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #DC2626' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1rem' }}>4. علامة مائية متحركة عشوائية</strong>
                    <span className="badge badge-success">نشط 100%</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    ظهور اسم ورقم هاتف وكود الطالب متقلباً في زوايا عشوائية لمنع التصوير بكاميرا موبايل خارجية.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #B45309' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1rem' }}>5. منع نسخ نصوص الامتحانات</strong>
                    <span className="badge badge-success">نشط 100%</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    تعطيل التحديد (User-Select: None) لمنع نسخ أسئلة الامتحانات والمذكرات.
                  </p>
                </div>
              </div>

              {/* Security Logs Sample */}
              <div style={{ background: '#0F172A', color: '#E2E8F0', padding: '1.5rem', borderRadius: 'var(--radius-lg)', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#34D399', fontWeight: 800 }}>
                  <Activity size={16} />
                  <span>سجل حماية وتأمين المنصة المباشر (Security Live Audit):</span>
                </div>
                <div>[2026-09-13 04:12:01] 🛡️ RIGHT-CLICK ATTEMPT BLOCKED: ContextMenu was neutralized.</div>
                <div>[2026-09-13 04:18:22] 🔒 SCREEN BLUR ACTIVATED: User navigated away from lecture tab. Video auto-paused.</div>
                <div>[2026-09-13 04:22:45] ⚡ WATERMARK SYNC: Dynamic watermark coordinates relocated to (X: 62%, Y: 35%).</div>
                <div>[2026-09-13 04:29:10] 🛡️ DEVTOOLS PROTECTION: F12 keystroke intercepted and suppressed.</div>
              </div>

              {/* Teacher Password Management Card */}
              <div style={{
                marginTop: '1.5rem',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.04) 100%)',
                border: '2px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}>
                    <KeyRound size={26} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 4px' }}>
                      كلمة مرور دخول المستر للوحة التحكم (Teacher Admin PIN) 🔐
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                      كلمة المرور الحالية المعتمدة: <strong style={{ color: 'var(--primary-600)', background: 'var(--bg-subtle)', padding: '2px 10px', borderRadius: '6px', fontSize: '0.92rem' }}>{teacherProfile?.password || localStorage.getItem('ms_teacher_pin') || '12345'}</strong>
                      <span style={{ marginRight: '8px', color: 'var(--text-muted)' }}>(الافتراضية: 12345)</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="btn btn-primary btn-lg"
                  style={{ gap: '8px', fontWeight: 800, boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)', padding: '0.75rem 1.4rem' }}
                >
                  <KeyRound size={18} />
                  <span>تغيير كلمة المرور الآن 🔑</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ADVANCED TREASURY & FINANCIAL LEDGER */}
        {/* ========================================================= */}
        {activeTab === 'finance' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '5px solid var(--success)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>💵 إجمالي الإيرادات الفعلية للأكواد</span>
                  <span className="badge badge-success">نقدي محصل</span>
                </div>
                <strong style={{ fontSize: '2.1rem', color: 'var(--success)', display: 'block' }}>{totalCollectedRevenue.toLocaleString()} ج.م</strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>صافي مبيعات كروت الشحن وأكواد التفعيل المدفوعة والمشحونة فعليًا</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '5px solid #F59E0B', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>🎟️ الأكواد المدفوعة المشحونة</span>
                  <span className="badge badge-primary">مفعلة بنجاح</span>
                </div>
                <strong style={{ fontSize: '2.1rem', color: '#D97706', display: 'block' }}>{totalPaidCodesCount} كود</strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>أكواد مدفوعة تم شحنها وتفعيل محتواها للطلاب</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '5px solid #10B981', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>🎁 أكواد الهدايا المفعلة</span>
                  <span className="badge badge-gold">معفاة تماماً</span>
                </div>
                <strong style={{ fontSize: '2.1rem', color: '#059669', display: 'block' }}>{giftCodesCount} كود</strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>أكواد هدايا مجانية مستبعدة تماماً من حساب الإيرادات المالية</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '5px solid #6366F1', boxShadow: 'var(--shadow-sm)' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>👥 إجمالي الطلاب المشتركين</span>
                  <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA' }}>مشتركون</span>
                </div>
                <strong style={{ fontSize: '2.1rem', color: '#4F46E5', display: 'block' }}>
                  {new Set(paidRedeemedCodesTransactions.map(t => t.userId)).size} طالب
                </strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>عدد الطلاب الفعليين الذين شحنوا أكواد اشتراك</span>
              </div>
            </div>

            {/* Revenue by Stage Grid */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>🎓 إيرادات المنصة مفصلة حسب المراحل الدراسية</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>توزيع دخل كروت الشحن لكل مرحلة دراسية على حدة</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {stages.map(stg => {
                  const stageTx = paidRedeemedCodesTransactions.filter(t => t.stageId === stg.id || (t.stageName && t.stageName.includes(stg.name)));
                  const stageRev = stageTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                  const stageCodesCount = stageTx.length;
                  const stageStudentsCount = new Set(stageTx.map(t => t.userId)).size;

                  return (
                    <div key={stg.id} style={{
                      padding: '1.25rem',
                      borderRadius: '14px',
                      background: 'var(--bg-subtle)',
                      border: '1.5px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-xs)'
                    }}>
                      <div>
                        <div className="flex-between" style={{ marginBottom: '8px' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{stg.badge || 'مرحلة دراسية'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stageCodesCount} كود مشحون</span>
                        </div>
                        <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>{stg.name}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>الطلاب المشتركون</span>
                          <strong style={{ fontSize: '0.92rem' }}>{stageStudentsCount} طالب</strong>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي الإيراد</span>
                          <strong style={{ fontSize: '1.2rem', color: 'var(--success)' }}>{stageRev.toLocaleString()} ج.م</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue by Month & Course Grid */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>📊 إيرادات المنصة مفصلة حسب الشهور والكورسات</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>توزيع دخل المنصة على كل شهر وكورس بناءً على الأكواد المشحونة</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {sections.map(sec => {
                  const secTx = paidRedeemedCodesTransactions.filter(t => t.targetId === sec.id);
                  const secRev = secTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                  const secStudentsCount = new Set(secTx.map(t => t.userId)).size;

                  return (
                    <div key={sec.id} style={{ 
                      padding: '1.1rem', 
                      borderRadius: '12px', 
                      background: 'var(--bg-subtle)', 
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className={sec.type === 'course' ? 'badge badge-gold' : 'badge badge-primary'} style={{ fontSize: '0.72rem' }}>
                            {sec.type === 'course' ? '📁 كورس' : '📅 شهر'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sec.stageName}</span>
                        </div>
                        <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '8px' }}>{sec.title}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '6px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>الطلاب المشتركون</span>
                          <strong style={{ fontSize: '0.95rem' }}>{secStudentsCount} طالب</strong>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي الإيراد</span>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{secRev.toLocaleString()} ج.م</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Transaction Ledger Table */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>📜 سجل المعاملات المالية والخزينة (Transaction Ledger)</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>سجل شحن وتفعيل الكروت المحصلة: {transactions.filter(t => t.paymentMethod === 'code').length} عملية شحن</span>
                </div>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `الكل (${transactions.filter(t => t.paymentMethod === 'code').length})` },
                    { id: 'code', label: `أكواد مدفوعة (${paidRedeemedCodesTransactions.length})` },
                    { id: 'gift', label: `أكواد هدايا معفاة (${giftCodesCount})` }
                  ].map(flt => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setTxFilterMethod(flt.id)}
                      className={`btn btn-sm ${txFilterMethod === flt.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>تاريخ وتوقيت العملية</th>
                      <th style={{ padding: '0.75rem' }}>اسم الطالب والهاتف</th>
                      <th style={{ padding: '0.75rem' }}>المحتوى المشترى</th>
                      <th style={{ padding: '0.75rem' }}>طريقة الدفع</th>
                      <th style={{ padding: '0.75rem' }}>المبلغ</th>
                      <th style={{ padding: '0.75rem' }}>رمز الكود</th>
                      <th style={{ padding: '0.75rem' }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(t => t.paymentMethod === 'code')
                      .filter(t => {
                        if (txFilterMethod === 'code') return !t.isGift && t.status === 'completed';
                        if (txFilterMethod === 'gift') return t.isGift;
                        return true;
                      })
                      .map((tx, idx) => {
                        const dateFormatted = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'الآن';

                        return (
                          <tr key={tx.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.85rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {dateFormatted}
                            </td>
                            <td style={{ padding: '0.85rem' }}>
                              <strong style={{ display: 'block', fontSize: '0.92rem' }}>{tx.studentName || 'طالب مسجل'}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.studentPhone || 'أونلاين'}</span>
                            </td>
                            <td style={{ padding: '0.85rem' }}>
                              <span style={{ fontWeight: 800, display: 'block' }}>{tx.targetTitle}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)' }}>{tx.stageName}</span>
                            </td>
                            <td style={{ padding: '0.85rem' }}>
                              <span className={tx.isGift ? 'badge badge-gold' : tx.paymentMethod === 'code' ? 'badge badge-primary' : 'badge badge-success'}>
                                {tx.paymentMethodLabel || tx.paymentMethod}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem', fontWeight: 900, color: tx.isGift ? '#D97706' : 'var(--success)' }}>
                              {tx.isGift ? '0 ج.م (هدية)' : `${Number(tx.amount || 0).toLocaleString()} ج.م`}
                            </td>
                            <td style={{ padding: '0.85rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {tx.codeUsed ? (
                                <span style={{ background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                                  {tx.codeUsed}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>دفع إلكتروني مباشر</span>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem' }}>
                              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>✓ مكتملة</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students with Pending Dues Reminder */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem', color: '#EF4444' }}>⚠️ الطلاب المتأخرين عن سداد المصاريف</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {students.filter(s => (s.finance?.dueAmount || 0) > 0).map(std => (
                  <div key={std.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <strong>{std.name}</strong> - <span style={{ color: '#EF4444', fontWeight: 700 }}>متبقي: {std.finance?.dueAmount} ج.م</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>المرحلة: {std.stageName} • هاتف ولي الأمر: {std.parentPhone}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setActiveReminderStudent(std)} className="btn btn-warning btn-sm" style={{ gap: '6px' }}>
                        <MessageCircle size={15} />
                        <span>تذكير واتساب لولي الأمر</span>
                      </button>
                      <button onClick={() => { setActivePaymentStudent(std); setPayAmountInput(String(std.finance?.dueAmount)); }} className="btn btn-success btn-sm">
                        💵 تسجيل السداد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: TEACHER PROFILE & LOCAL AVATAR UPLOAD */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="card animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>تعديل بيانات وصورة المستر الشخصية 👤</h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم المعلم:</label>
                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="input-control" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اللقب والاعتماد:</label>
                <input type="text" value={profileTitle} onChange={e => setProfileTitle(e.target.value)} className="input-control" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الشعار الترويجي:</label>
                <input type="text" value={profileSubtitle} onChange={e => setProfileSubtitle(e.target.value)} className="input-control" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رقم واتساب المستر:</label>
                <input type="text" value={profileWhatsapp} onChange={e => setProfileWhatsapp(e.target.value)} className="input-control" required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الصورة الشخصية للمستر:</label>
                <input
                  ref={profileAvatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleImageFileChange(e, setProfileAvatar, 'الصورة الشخصية')}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src={profileAvatar} alt="Avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => profileAvatarInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Image size={15} />
                    <span>رفع صورة من جهازك 🖼️</span>
                  </button>
                </div>
              </div>

              {/* 3D Live Holographic Avatar Preview Box */}
              <div style={{
                gridColumn: 'span 2',
                padding: '1.25rem',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)',
                border: '1.5px dashed rgba(245, 158, 11, 0.35)',
                textAlign: 'center',
                margin: '0.5rem 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Sparkles size={18} color="#F59E0B" />
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    المعاينة ثلاثية الأبعاد الفورية لصورتك (مجسم 3D تفاعلي مع الحركات) ✨🔮
                  </strong>
                </div>
                <div style={{ maxWidth: '360px', margin: '0 auto' }}>
                  <TeacherAvatar3D
                    src={profileAvatar}
                    name={profileName || teacherProfile?.name || 'مستر مايكل شحاته'}
                    title={profileTitle || teacherProfile?.title || 'Senior English Expert'}
                    subtitle={profileSubtitle || teacherProfile?.subtitle || 'The Master of English'}
                    height="380px"
                    showControls={true}
                    autoGestures={true}
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                  أي صورة ترفعها تتحول فوراً إلى مجسم 3D هولوجرامي تفاعلي يتحرك مع حركة الماوس واللمس ويؤدي حركات وتأثيرات سينمائية 🎯
                </p>
              </div>

              {/* Official App Icon & Mobile Launcher Preview */}
              <div style={{
                gridColumn: 'span 2',
                padding: '1.25rem',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 27, 75, 0.6) 100%)',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                margin: '0.5rem 0',
                color: '#fff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Smartphone size={20} color="#F59E0B" />
                    <strong style={{ fontSize: '0.95rem', color: '#F8FAFC' }}>
                      معاينة أيقونة التطبيق الذكية لشاشات الموبايل (Safe Area & PWA) 📱👑
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                    تتولّد تلقائياً من صورتك
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', margin: '1rem 0' }}>
                  {/* Android Squircle */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '22px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(255,255,255,0.1)',
                      margin: '0 auto 6px',
                      background: '#0B0F1D'
                    }}>
                      {appIconPreview ? (
                        <img src={appIconPreview} alt="App Icon Squircle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#94A3B8' }}>جاري التوليد...</div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>شكل المربع المنحني (Android/iOS)</span>
                  </div>

                  {/* Android Adaptive Circle */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      margin: '0 auto 6px',
                      background: '#0B0F1D'
                    }}>
                      {appIconPreview ? (
                        <img src={appIconPreview} alt="App Icon Circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#94A3B8' }}>جاري التوليد...</div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>شكل الدائرة (Pixel / Samsung)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>
                    💡 تم ضبط منطقة الأمان (Safe Area 66%) بدقة لضمان عدم قص الوجه أو الشعار في أي نوع شاشة أندرويد أو آيفون.
                  </p>
                  {appIconPreview && (
                    <a
                      href={appIconPreview}
                      download="master-app-icon-512x512.png"
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.08)' }}
                    >
                      <Download size={14} />
                      <span>تحميل نسخة الأيقونة (PNG)</span>
                    </a>
                  )}
                </div>
              </div>


              {/* Dynamic Hero Section Customization */}
              <div style={{
                gridColumn: 'span 2',
                padding: '1.25rem',
                borderRadius: '16px',
                background: 'var(--bg-subtle)',
                border: '1.5px solid var(--border-subtle)',
                margin: '0.5rem 0'
              }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem', color: '#1F4D3A' }}>
                  🎯 نصوص الواجهة والبانر الرئيسي (النصوص بجوار صورة المستر بالصفحة الرئيسية)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      شارة الترحيب العلوية (Welcome Badge):
                    </label>
                    <input 
                      type="text" 
                      value={profileWelcomeBadge} 
                      onChange={e => setProfileWelcomeBadge(e.target.value)} 
                      className="input-control" 
                      placeholder="المنصة التعليمية الرسمية • ابتدائي وإعدادي وثانوي 🇬🇧"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      الشعار التحفيزي بجوار الصورة (Hero Slogan):
                    </label>
                    <input 
                      type="text" 
                      value={profileHeroSlogan} 
                      onChange={e => setProfileHeroSlogan(e.target.value)} 
                      className="input-control" 
                      placeholder="الدرجة النهائية في الإنجليزي مضمونة 🎯"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      إجمالي الطلاب المسجلين:
                    </label>
                    <input 
                      type="number" 
                      value={profileStudents} 
                      onChange={e => setProfileStudents(e.target.value)} 
                      className="input-control" 
                      placeholder="18500"
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      الوصف التعريفي للبانر الرئيسي (Hero Description):
                    </label>
                    <textarea 
                      value={profileHeroDescription} 
                      onChange={e => setProfileHeroDescription(e.target.value)} 
                      className="input-control" 
                      style={{ height: '70px' }} 
                      placeholder="المنصة التعليمية الرسمية لمستر مايكل شحاتة..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      رقم إحصائية التفوق (Stat Badge Number):
                    </label>
                    <input 
                      type="text" 
                      value={profileStatBadgeNumber} 
                      onChange={e => setProfileStatBadgeNumber(e.target.value)} 
                      className="input-control" 
                      placeholder="+1,420 طالب"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      عنوان إحصائية التفوق (Stat Badge Text):
                    </label>
                    <input 
                      type="text" 
                      value={profileStatBadgeText} 
                      onChange={e => setProfileStatBadgeText(e.target.value)} 
                      className="input-control" 
                      placeholder="الدرجة النهائية 50/50 في الثانوية"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      عنوان كارت المتابعة (Support Badge Title):
                    </label>
                    <input 
                      type="text" 
                      value={profileSupportBadgeTitle} 
                      onChange={e => setProfileSupportBadgeTitle(e.target.value)} 
                      className="input-control" 
                      placeholder="دعم ومتابعة أسبوعية"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                      وصف كارت المتابعة (Support Badge Text):
                    </label>
                    <input 
                      type="text" 
                      value={profileSupportBadgeText} 
                      onChange={e => setProfileSupportBadgeText(e.target.value)} 
                      className="input-control" 
                      placeholder="تقارير واتساب مباشرة لأولياء الأمور"
                    />
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نبذة المستر (Bio):</label>
                <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="input-control" style={{ height: '100px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" disabled={isGeneratingIcons} className="btn btn-primary btn-lg" style={{ width: '100%', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>{isGeneratingIcons ? 'جاري توليد ونشر أيقونات المنصة الذكية...' : 'حفظ التعديلات وتحديث الأيقونة'}</span>
                </button>
              </div>
            </form>

            {/* Teacher Password Settings Card */}
            <div style={{
              marginTop: '1.75rem',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.06) 100%)',
              border: '2px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #B45309 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)' }}>
                  <KeyRound size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 3px' }}>أمان الحساب وكلمة مرور المستر 🔐</h4>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    كلمة المرور الحالية المعتمدة: <strong style={{ color: 'var(--primary-600)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '6px' }}>{teacherProfile?.password || localStorage.getItem('ms_teacher_pin') || '12345'}</strong>
                    <span style={{ marginRight: '8px', color: 'var(--text-muted)' }}>(الافتراضية: 12345)</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="btn btn-warning"
                style={{ gap: '8px', fontWeight: 800, padding: '0.75rem 1.4rem' }}
              >
                <KeyRound size={18} />
                <span>تغيير كلمة المرور 🔑</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* OTHER TABS: STAGES, BOOKLETS, ACHIEVERS, CODES, BROADCAST */}
        {/* ========================================================= */}
        {activeTab === 'stages' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>إضافة مرحلة / صف جديد 🎓</h3>
              <form onSubmit={handleAddStage} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم المرحلة:</label>
                  <input type="text" value={newStageName} onChange={e => setNewStageName(e.target.value)} className="input-control" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سعر الشهر:</label>
                  <input type="text" value={newStagePrice} onChange={e => setNewStagePrice(e.target.value)} className="input-control" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '44px' }}>إضافة المرحلة</button>
              </form>
            </div>
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem' }}>المراحل المسجلة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {stages.map(stg => (
                  <div key={stg.id} className="card" style={{ padding: '1rem', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>{stg.name}</strong><span style={{ display: 'block', color: 'var(--primary-600)' }}>{stg.pricePerMonth}</span></div>
                    <button onClick={() => deleteStage(stg.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'booklets' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>إضافة ورفع مذكرة PDF جديدة من جهازك 📚</h3>
              <form onSubmit={handleAddBooklet} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                  {/* File Upload from Device */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>ملف المذكرة (PDF) من جهازك:</label>
                    <input 
                      ref={bookletPdfFileInputRef} 
                      type="file" 
                      accept=".pdf,application/pdf" 
                      style={{ display: 'none' }} 
                      onChange={handleBookletPdfFileChange} 
                    />
                    <button 
                      type="button" 
                      onClick={() => bookletPdfFileInputRef.current?.click()} 
                      className="btn btn-secondary" 
                      style={{ width: '100%', gap: '6px', height: '44px', border: '2px dashed var(--primary-500)', background: newBkDownloadUrl ? '#ECFDF5' : undefined }}
                    >
                      <FileUp size={18} color="var(--primary-600)" />
                      <span style={{ fontWeight: 800, color: newBkDownloadUrl ? '#065F46' : undefined }}>
                        {isUploadingBk ? 'جاري الحفظ والتأمين سحابياً... ⏳' : newBkFile ? `ملف: ${newBkFile.name} (${newBkFileSize})` : 'اختر ملف PDF من جهازك'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان المذكرة:</label>
                    <input type="text" value={newBkTitle} onChange={e => setNewBkTitle(e.target.value)} placeholder="مثال: مذكرة شرح وقواعد Unit 1 & 2" className="input-control" required />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عدد الصفحات:</label>
                    <input type="text" value={newBkPages} onChange={e => setNewBkPages(e.target.value)} placeholder="مثال: 45 صفحة" className="input-control" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>غلاف المذكرة (اختياري):</label>
                    <input ref={bookletCoverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFileChange(e, setNewBkCoverPreview, 'غلاف المذكرة')} />
                    <button type="button" onClick={() => bookletCoverInputRef.current?.click()} className="btn btn-secondary btn-sm" style={{ width: '100%', gap: '6px', height: '44px' }}>
                      <Image size={15} /> <span>رفع صورة غلاف</span>
                    </button>
                  </div>
                </div>

                {newBkDownloadUrl && (
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '8px 14px', borderRadius: '8px', color: '#065F46', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>تم حفظ وتأمين المذكرة بنجاح على السحابة التعليمية! جاهزة للتنزيل من قِبل الطلاب.</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ height: '46px', fontWeight: 800, alignSelf: 'flex-start', minWidth: '180px' }}>
                  حفظ ونشر المذكرة 📚
                </button>
              </form>
            </div>
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem' }}>المذكرات المنشورة</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {booklets.map(bk => (
                  <div key={bk.id} className="card" style={{ padding: '1rem', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>{bk.title}</strong><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>{bk.pages}</span></div>
                    <button onClick={() => deleteBooklet(bk.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievers' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>إضافة طالب إلى لوحة أوائل المستر 🏆</h3>
              <form onSubmit={handleAddAchiever} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم الطالب المتفوق:</label>
                  <input type="text" placeholder="مثال: أحمد محمد علي" value={newAchName} onChange={e => setNewAchName(e.target.value)} className="input-control" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المرحلة الدراسية للطالب:</label>
                  <select 
                    value={newAchStageId} 
                    onChange={e => setNewAchStageId(e.target.value)} 
                    className="input-control"
                    style={{ fontWeight: 800, borderColor: 'var(--primary-400)' }}
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>🎓 {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الدرجة في الإنجليزي:</label>
                  <input type="text" placeholder="مثال: 50 / 50 (الدرجة النهائية)" value={newAchScore} onChange={e => setNewAchScore(e.target.value)} className="input-control" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المدرسة / المركز:</label>
                  <input type="text" placeholder="مثال: مدرسة المتفوقين أو سنتر النخبة" value={newAchSchool} onChange={e => setNewAchSchool(e.target.value)} className="input-control" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>شارة التكريم والمركز:</label>
                  <select value={newAchBadge} onChange={e => setNewAchBadge(e.target.value)} className="input-control">
                    <option value="🥇 المركز الأول على مستوى الجمهورية">🥇 المركز الأول على مستوى الجمهورية</option>
                    <option value="🥈 المركز الثاني على مستوى المحافظة">🥈 المركز الثاني على مستوى المحافظة</option>
                    <option value="🥉 المركز الثالث">🥉 المركز الثالث</option>
                    <option value="🌟 الدرجة النهائية 100%">🌟 الدرجة النهائية 100%</option>
                    <option value="🏆 من أوائل دفعة The Master">🏆 من أوائل دفعة The Master</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>صورة الطالب:</label>
                  <input ref={achieverAvatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageFileChange(e, setNewAchAvatarPreview, 'صورة الطالب')} />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <img src={newAchAvatarPreview} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-400)' }} />
                    <button type="button" onClick={() => achieverAvatarInputRef.current?.click()} className="btn btn-secondary btn-sm" style={{ flex: 1, gap: '6px' }}>
                      <Image size={15} /> <span>رفع صورة</span>
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: '44px', fontWeight: 800 }}>
                  إضافة للوحة الشرف 🌟
                </button>
              </form>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  أوائل المستر المسجلين (يمكنك تصفية الأوائل حسب المرحلة)
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي: {topAchievers.length} طالب</span>
              </div>

              {/* Stage Filter for Achievers */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setAchieverStageFilter('all')}
                  className={`btn btn-sm ${achieverStageFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}
                >
                  🌟 جميع المراحل ({topAchievers.length})
                </button>
                {stages.map(s => {
                  const count = (Array.isArray(topAchievers) ? topAchievers : []).filter(a => a.stageId === s.id).length;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAchieverStageFilter(s.id)}
                      className={`btn btn-sm ${achieverStageFilter === s.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ borderRadius: 'var(--radius-full)', fontWeight: 800 }}
                    >
                      🎓 {s.name} ({count})
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topAchievers
                  .filter(a => achieverStageFilter === 'all' ? true : a.stageId === achieverStageFilter)
                  .map(ach => {
                    const stgName = ach.stageName || stages.find(s => s.id === ach.stageId)?.name || 'الصف الثالث الثانوي';
                    return (
                      <div key={ach.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={ach.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={ach.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-300)' }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <strong style={{ fontSize: '1rem' }}>{ach.name}</strong>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: 'rgba(79, 70, 229, 0.1)',
                                color: 'var(--primary-600)',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}>
                                🎓 {stgName}
                              </span>
                              <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{ach.badge}</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              🏫 {ach.school || 'ثانوية عامة'} • الدرجة: <strong style={{ color: 'var(--success)' }}>{ach.score}</strong>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف الطالب (${ach.name}) من لوحة الشرف؟`)) {
                              deleteAchiever(ach.id);
                            }
                          }}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', gap: '4px' }}
                        >
                          <Trash2 size={15} />
                          <span>حذف</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: ADVANCED MULTI-TYPE ACTIVATION CODES */}
        {/* ========================================================= */}
        {activeTab === 'codes' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)', border: '2px solid var(--primary-400)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>توليد وإصدار كروت الشحن الذكية (4 أنواع تفعيل) 🎟️</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    أنشئ كود شهر كامل، كود محاضرة واحدة، كود كورس تأسيس، أو باقة مخصصة مع تحديد السعر والصلاحية وعدد الاستخدامات.
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerateCode} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', alignItems: 'flex-end', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المرحلة الدراسية:</label>
                  <select 
                    value={genCodeStageId} 
                    onChange={e => {
                      setGenCodeStageId(e.target.value);
                      setGenCodeTargetId('');
                    }} 
                    className="input-control"
                    style={{ fontWeight: 800 }}
                  >
                    {stages.map(s => <option key={s.id} value={s.id}>🎓 {s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نوع الكود المطلوب:</label>
                  <select 
                    value={genCodeType} 
                    onChange={e => {
                      setGenCodeType(e.target.value);
                      setGenCodeTargetId('');
                    }} 
                    className="input-control"
                    style={{ fontWeight: 800, borderColor: 'var(--primary-500)', background: 'var(--bg-surface)' }}
                  >
                    <option value="month">📅 1. كود شهر كامل (Month)</option>
                    <option value="lecture">🎬 2. كود محاضرة واحدة (Lecture)</option>
                    <option value="course">📁 3. كود كورس كامل / تأسيس (Course)</option>
                    <option value="bundle">📦 4. كود باقة مخصصة (Custom Bundle)</option>
                  </select>
                </div>

                {/* Target selector according to type */}
                {genCodeType === 'month' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الشهر الدراسي المستهدف:</label>
                    <select 
                      value={genCodeTargetId} 
                      onChange={e => setGenCodeTargetId(e.target.value)} 
                      className="input-control"
                    >
                      <option value="">(اختر الشهر الدراسي)</option>
                      {sections
                        .filter(s => s.stageId === genCodeStageId && s.type === 'month')
                        .map(s => (
                          <option key={s.id} value={s.id}>📅 {s.title} ({s.price} ج.م)</option>
                        ))}
                    </select>
                  </div>
                )}

                {genCodeType === 'course' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الكورس المستهدف:</label>
                    <select 
                      value={genCodeTargetId} 
                      onChange={e => setGenCodeTargetId(e.target.value)} 
                      className="input-control"
                    >
                      <option value="">(اختر الكورس)</option>
                      {sections
                        .filter(s => s.stageId === genCodeStageId && s.type === 'course')
                        .map(s => (
                          <option key={s.id} value={s.id}>📁 {s.title} ({s.price} ج.م)</option>
                        ))}
                    </select>
                  </div>
                )}

                {genCodeType === 'lecture' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المحاضرة المستهدفة:</label>
                    <select 
                      value={genCodeTargetId} 
                      onChange={e => setGenCodeTargetId(e.target.value)} 
                      className="input-control"
                    >
                      <option value="">(اختر المحاضرة)</option>
                      {lectures
                        .filter(l => l.stageId === genCodeStageId)
                        .map(l => (
                          <option key={l.id} value={l.id}>🎬 {l.unitNumber}: {l.title.slice(0, 32)}...</option>
                        ))}
                    </select>
                  </div>
                )}

                {genCodeType === 'bundle' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      اختر الشهور والكورسات التي تفتحها هذه الباقة:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto', background: 'var(--bg-surface)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      {sections
                        .filter(s => s.stageId === genCodeStageId)
                        .map(sec => (
                          <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '4px 8px', background: 'var(--bg-subtle)', borderRadius: '6px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={genCodeBundleItems.includes(sec.id)} 
                              onChange={e => {
                                if (e.target.checked) setGenCodeBundleItems(prev => [...prev, sec.id]);
                                else setGenCodeBundleItems(prev => prev.filter(id => id !== sec.id));
                              }} 
                            />
                            <span>{sec.type === 'course' ? '📁' : '📅'} {sec.title.slice(0, 24)}...</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    ⏳ مدة وصول الطالب للمحتوى:
                  </label>
                  <select 
                    value={genCodeDuration} 
                    onChange={e => setGenCodeDuration(e.target.value)} 
                    className="input-control"
                    style={{ fontWeight: 800 }}
                  >
                    <option value="7">⚡ 7 أيام (أسبوع)</option>
                    <option value="15">📅 15 يوم</option>
                    <option value="30">🌟 شهر كامل (30 يوم) - قياسي</option>
                    <option value="60">🔥 شهرين (60 يوم)</option>
                    <option value="120">📚 تيرم دراسي كامل (4 شهور)</option>
                    <option value="365">🎓 سنة دراسية كاملة (365 يوم)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    سعر الكود (ج.م):
                  </label>
                  <input 
                    type="number" 
                    value={genCodePrice} 
                    onChange={e => setGenCodePrice(e.target.value)} 
                    disabled={genCodeIsGift}
                    placeholder="180" 
                    className="input-control" 
                    required={!genCodeIsGift}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    عدد مرات الاستخدام:
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={genCodeMaxUses} 
                    onChange={e => setGenCodeMaxUses(e.target.value)} 
                    className="input-control" 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    تاريخ انتهاء صلاحية الكود (اختياري):
                  </label>
                  <input 
                    type="date" 
                    value={genCodeExpiryDate} 
                    onChange={e => setGenCodeExpiryDate(e.target.value)} 
                    className="input-control" 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    كود مخصص (اختياري):
                  </label>
                  <input 
                    type="text" 
                    value={genCodeCustomCode} 
                    onChange={e => setGenCodeCustomCode(e.target.value)} 
                    placeholder="مثال: MS-VIP-2026" 
                    className="input-control" 
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', marginBottom: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={genCodeIsGift} 
                      onChange={e => setGenCodeIsGift(e.target.checked)} 
                    />
                    <span>🎁 كود مجاني / هدية (لا يُحتسب كإيراد)</span>
                  </label>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px', fontWeight: 800, gap: '6px' }}>
                    <Plus size={18} />
                    <span>توليد كود الشحن الآن</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Access Codes Listing */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    سجل كروت الشحن وأكواد التفعيل ({accessCodes.length} كود)
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    تحكم فوري في تفعيل أو إيقاف الأكواد، ومتابعة عدد مرات الاستخدام
                  </span>
                </div>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `الكل (${accessCodes.length})` },
                    { id: 'month', label: `شهور كاملة (${accessCodes.filter(c => c.codeType === 'month' || c.type === 'month').length})` },
                    { id: 'course', label: `كورسات (${accessCodes.filter(c => c.codeType === 'course' || c.type === 'course').length})` },
                    { id: 'lecture', label: `محاضرات (${accessCodes.filter(c => c.codeType === 'lecture' || c.type === 'lecture').length})` },
                    { id: 'bundle', label: `باقات (${accessCodes.filter(c => c.codeType === 'bundle' || c.type === 'bundle').length})` }
                  ].map(flt => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setCodeFilterType(flt.id)}
                      className={`btn btn-sm ${codeFilterType === flt.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accessCodes
                  .filter(c => {
                    if (codeFilterType === 'all') return true;
                    return (c.codeType || c.type) === codeFilterType;
                  })
                  .map((codeObj, idx) => {
                    const isFullyUsed = codeObj.isUsed || (codeObj.usedCount >= (codeObj.maxUses || 1));
                    const isCodeDisabled = codeObj.isActive === false;

                    return (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '1rem 1.25rem', 
                        background: isCodeDisabled ? '#FEF2F2' : isFullyUsed ? 'rgba(0,0,0,0.02)' : 'var(--bg-subtle)', 
                        borderRadius: '12px',
                        border: isCodeDisabled ? '1px dashed #EF4444' : isFullyUsed ? '1px solid var(--border-subtle)' : '1px solid var(--primary-300)',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            padding: '6px 12px',
                            background: isCodeDisabled ? '#FEE2E2' : isFullyUsed ? '#E2E8F0' : 'var(--primary-50)',
                            color: isCodeDisabled ? '#991B1B' : isFullyUsed ? '#64748B' : 'var(--primary-700)',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '1rem',
                            letterSpacing: '1px'
                          }}>
                            {codeObj.code}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.95rem' }}>{codeObj.targetTitle}</strong>
                              <span className={codeObj.codeType === 'course' ? 'badge badge-gold' : codeObj.codeType === 'bundle' ? 'badge badge-primary' : 'badge badge-success'} style={{ fontSize: '0.72rem' }}>
                                {codeObj.codeType === 'month' ? '📅 كود شهر' : codeObj.codeType === 'course' ? '📁 كود كورس' : codeObj.codeType === 'bundle' ? '📦 باقة مخصصة' : '🎬 كود محاضرة'}
                              </span>
                              {codeObj.isGift && (
                                <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>🎁 كود هدية</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <span>المرحلة: {codeObj.stage}</span>
                              <span>•</span>
                              <span>المدة: <strong style={{ color: 'var(--primary-600)' }}>{codeObj.durationLabel || `${codeObj.durationDays || 30} يوم`}</strong></span>
                              <span>•</span>
                              <span>السعر: <strong>{codeObj.isGift ? 'مجاني / هدية' : codeObj.price}</strong></span>
                              <span>•</span>
                              <span>الاستخدام: <strong>{codeObj.usedCount || (codeObj.isUsed ? 1 : 0)} / {codeObj.maxUses || 1}</strong></span>
                              {codeObj.expiryDate && <span>• ينتهي الكود: {codeObj.expiryDate}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {isCodeDisabled ? (
                            <span style={{ padding: '4px 10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 800 }}>
                              🔒 موقوف
                            </span>
                          ) : isFullyUsed ? (
                            <span style={{ padding: '4px 10px', background: '#E2E8F0', color: '#475569', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 800 }}>
                              ✓ اكتمل الاستخدام ({codeObj.usedBy || 'طالب'})
                            </span>
                          ) : (
                            <span style={{ padding: '4px 10px', background: '#DCFCE7', color: '#166534', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 800 }}>
                              🟢 متاح للتفعيل
                            </span>
                          )}

                          <button 
                            type="button"
                            onClick={() => toggleCodeStatus(codeObj.code)} 
                            className={`btn btn-sm ${codeObj.isActive === false ? 'btn-success' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', gap: '4px' }}
                            title={codeObj.isActive === false ? 'تفعيل الكود' : 'إيقاف الكود مؤقتاً'}
                          >
                            {codeObj.isActive === false ? 'تفعيل 🟢' : 'إيقاف 🔒'}
                          </button>

                          <button 
                            type="button"
                            onClick={() => { 
                              navigator.clipboard.writeText(codeObj.code); 
                              addToast(`تم نسخ الكود: ${codeObj.code}`, 'success'); 
                            }} 
                            className="btn btn-secondary btn-sm" 
                            title="نسخ الكود"
                          >
                            <Copy size={14} />
                            <span>نسخ</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              if (window.confirm(`حذف كود الشحن (${codeObj.code})؟`)) {
                                deleteCode(codeObj.code);
                              }
                            }} 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: '#EF4444' }} 
                            title="حذف الكود"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: '#1F4D3A' }}>
                    📢 إرسال التنبيهات والإشعارات الخارجية للطلاب (Web Push & Broadcast)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    أرسل تنبيهات فورية تظهر داخل الموقع أو مباشرة كإشعارات خارجية على شاشات هواتف وحواسيب الطلاب.
                  </p>
                </div>
                <span className="badge badge-primary" style={{ padding: '6px 14px', fontWeight: 800 }}>
                  Push Notifications جاهز 📲
                </span>
              </div>

              <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      عنوان التنبيه أو المحاضرة:
                    </label>
                    <input 
                      type="text" 
                      value={annTitle} 
                      onChange={e => setAnnTitle(e.target.value)} 
                      className="input-control" 
                      placeholder="مثال: تم رفع محاضرة القواعد الجديدة + امتحان الأسبوع" 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      الجمهور المستهدف:
                    </label>
                    <select 
                      value={annAudience} 
                      onChange={e => setAnnAudience(e.target.value)} 
                      className="input-control"
                    >
                      <option value="all">📢 جميع الطلاب المسجلين بالمنصة (الكل)</option>
                      <option value="stage">🎓 طلاب مرحلة دراسية محددة</option>
                      <option value="student">👤 طالب محدد بالاسم</option>
                    </select>
                  </div>
                </div>

                {annAudience === 'stage' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      اختر المرحلة الدراسية المستهدفة:
                    </label>
                    <select 
                      value={annTargetStage} 
                      onChange={e => setAnnTargetStage(e.target.value)} 
                      className="input-control"
                    >
                      {stages.map(stg => (
                        <option key={stg.id} value={stg.id}>{stg.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {annAudience === 'student' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      اختر الطالب المستهدف:
                    </label>
                    <select 
                      value={annTargetStudent} 
                      onChange={e => setAnnTargetStudent(e.target.value)} 
                      className="input-control"
                    >
                      <option value="">-- اختر الطالب من القائمة --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code || s.phone}) - {s.stageName}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    نص التنبيه والتعليمات:
                  </label>
                  <textarea 
                    value={annContent} 
                    onChange={e => setAnnContent(e.target.value)} 
                    className="input-control" 
                    style={{ height: '110px' }} 
                    placeholder="اكتب رسالة التنبيه التي ستصل للطلاب..."
                    required 
                  />
                </div>

                {/* External Push Notification Checkbox Option */}
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(31, 77, 58, 0.08) 0%, rgba(166, 124, 82, 0.08) 100%)',
                  border: '1.5px solid rgba(31, 77, 58, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <input
                    type="checkbox"
                    id="sendAsPushCheck"
                    checked={annSendAsPush}
                    onChange={e => setAnnSendAsPush(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#1F4D3A' }}
                  />
                  <label htmlFor="sendAsPushCheck" style={{ cursor: 'pointer', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    📲 إرسال كإشعار خارجي للأجهزة (Push Notification)
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                      يظهر الإشعار في شريط إشعارات الهاتف أو سطح مكتب الحاسوب حتى وإن كان المتصفح مصغراً.
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '8px', alignSelf: 'flex-start' }}>
                  <Send size={18} />
                  <span>إرسال التنبيه ونشر الإشعار الآن</span>
                </button>
              </form>
            </div>

            {/* Announcements History List */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  📜 سجل التنبيهات المنشورة سابقاً ({announcements.length})
                </h4>
              </div>

              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  لا توجد تنبيهات منشورة حالياً.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {announcements.map((ann, aIdx) => (
                    <div key={ann.id || aIdx} style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span className="badge badge-primary">تنبيه رسمي 📢</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ann.date || 'اليوم'}
                          </span>
                        </div>
                        <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
                          {ann.title}
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                          {ann.content}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`حذف التنبيه "${ann.title}"؟`)) {
                            deleteAnnouncement(ann.id);
                          }
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#EF4444' }}
                        title="حذف التنبيه"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD NEW STUDENT MODAL (With local avatar upload) */}
      {/* ========================================================= */}
      {isAddStudentModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '640px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>إضافة وتسجيل طالب جديد بالمنصة 👨‍🎓</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>سيتم توليد كود خاص بالطالب فوراً وتفعيل حسابه</span>
                </div>
              </div>
              <button onClick={() => setIsAddStudentModalOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddStudentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم الطالب ثلاثي:</label>
                <input
                  type="text"
                  placeholder="مثال: يوسف أحمد علي"
                  value={stdName}
                  onChange={e => setStdName(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رقم هاتف الطالب (واتساب):</label>
                <input
                  type="text"
                  placeholder="مثال: 01012345678"
                  value={stdPhone}
                  onChange={e => setStdPhone(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم ولي الأمر:</label>
                <input
                  type="text"
                  placeholder="مثال: أحمد علي (ولي الأمر)"
                  value={stdParentName}
                  onChange={e => setStdParentName(e.target.value)}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رقم واتساب ولي الأمر:</label>
                <input
                  type="text"
                  placeholder="مثال: 01099887766"
                  value={stdParentPhone}
                  onChange={e => setStdParentPhone(e.target.value)}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الصف والمرحلة الدراسية:</label>
                <select value={stdStageId} onChange={e => setStdStageId(e.target.value)} className="input-control">
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نوع الحضور والمجموعة:</label>
                <select value={stdGroupType} onChange={e => setStdGroupType(e.target.value)} className="input-control">
                  <option value="center">حضور بالسنتر 🏢</option>
                  <option value="online">أونلاين عبر المنصة 💻</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>صورة الطالب الشخصية (للكارنيه والشهادة):</label>
                <input
                  ref={studentAvatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleImageFileChange(e, setStdAvatarPreview, 'صورة الطالب')}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src={stdAvatarPreview} alt="Student Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => studentAvatarInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Image size={15} />
                    <span>رفع صورة الطالب من جهازك 🖼️</span>
                  </button>
                </div>
              </div>

              {stdGroupType === 'center' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم السنتر / الفرع:</label>
                  <input
                    type="text"
                    value={stdCenterName}
                    onChange={e => setStdCenterName(e.target.value)}
                    className="input-control"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>قيمة الاشتراك الشهري (ج.م):</label>
                <input
                  type="number"
                  value={stdMonthlyFee}
                  onChange={e => setStdMonthlyFee(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المبلغ المسدد حالياً (ج.م):</label>
                <input
                  type="number"
                  value={stdPaidAmount}
                  onChange={e => setStdPaidAmount(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-success btn-lg" style={{ width: '100%', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>تأكيد تسجيل الطالب وتوليد الكود</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: RECORD PAYMENT MODAL */}
      {/* ========================================================= */}
      {activePaymentStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={24} color="var(--success)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>تسجيل دفعة مصاريف: {activePaymentStudent.name}</h3>
              </div>
              <button onClick={() => setActivePaymentStudent(null)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المبلغ المراد سداده الآن (ج.م):</label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={e => setPayAmountInput(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>طريقة الاستلام:</label>
                <select value={payMethodInput} onChange={e => setPayMethodInput(e.target.value)} className="input-control">
                  <option value="فودافون كاش">فودافون كاش (Vodafone Cash)</option>
                  <option value="إنستاباي">إنستاباي (InstaPay)</option>
                  <option value="كاش بالسنتر">كاش بالسنتر</option>
                  <option value="فوري">فوري (Fawry)</option>
                  <option value="فيزا">بطاقة ائتمان / فيزا</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-success btn-lg" style={{ flex: 1, gap: '8px' }}>
                  <Check size={18} />
                  <span>تأكيد السداد وتحديث الحساب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: STUDENT QR / BARCODE ID CARD */}
      {/* ========================================================= */}
      {activeCardStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '0', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: '#FFFFFF', color: '#0F172A' }}>
            <div style={{ background: 'linear-gradient(135deg, #141419 0%, #1A1A22 50%, #201D17 100%)', color: 'white', padding: '1.25rem', textAlign: 'center', position: 'relative' }}>
              <button
                onClick={() => setActiveCardStudent(null)}
                style={{ position: 'absolute', top: '12px', left: '12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
              <div style={{ fontSize: '0.72rem', color: '#FDE68A', fontWeight: 800, letterSpacing: '1px' }}>MR. MICHAEL SHEHATA ACADEMY 🇬🇧</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '2px 0 0', color: 'white' }}>كارنيه عضوية الطالب المعتمد</h3>
            </div>

            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <img
                src={activeCardStudent.avatar}
                alt={activeCardStudent.name}
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #F59E0B', margin: '0 auto 10px', objectFit: 'cover' }}
              />
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px', color: '#92400E' }}>{activeCardStudent.name}</h4>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '4px 12px', marginBottom: '1rem' }}>{activeCardStudent.stageName}</span>

              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem', textAlign: 'right', fontSize: '0.82rem' }}>
                <div className="flex-between" style={{ marginBottom: '4px' }}><span style={{ color: '#64748B' }}>كود الطالب:</span><strong style={{ fontFamily: 'monospace', color: '#B45309' }}>{activeCardStudent.code}</strong></div>
                <div className="flex-between" style={{ marginBottom: '4px' }}><span style={{ color: '#64748B' }}>هاتف الطالب:</span><strong>{activeCardStudent.phone}</strong></div>
                <div className="flex-between"><span style={{ color: '#64748B' }}>طوارئ ولي الأمر:</span><strong>{activeCardStudent.parentPhone}</strong></div>
              </div>

              <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <QrCode size={64} color="#92400E" />
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '2px', fontWeight: 700 }}>*{activeCardStudent.code}*</span>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px' }}>
              <button onClick={() => { window.print(); addToast('جاري تحضير الكارنيه للطباعة 🖨️', 'success'); }} className="btn btn-primary btn-sm" style={{ flex: 1, gap: '6px' }}>
                <Printer size={15} /> <span>طباعة الكارنيه</span>
              </button>
              <button onClick={() => setActiveCardStudent(null)} className="btn btn-secondary btn-sm">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: STUDENT 360 PROFILE */}
      {/* ========================================================= */}
      {activeProfileStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '600px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={activeProfileStudent.avatar} alt={activeProfileStudent.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>الملف الأكاديمي للطالب: {activeProfileStudent.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>كود: {activeProfileStudent.code} • {activeProfileStudent.stageName}</span>
                </div>
              </div>
              <button onClick={() => setActiveProfileStudent(null)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>نسبة الحضور:</span>
                <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--success)' }}>{activeProfileStudent.attendanceRate}</strong>
              </div>
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>دقة النطق والصوتيات:</span>
                <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary-600)' }}>{activeProfileStudent.pronunciationScore || '92%'}</strong>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>ملاحظات المستر المسجلة:</strong>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{activeProfileStudent.teacherNotes || 'طالب ملتزم جداً ومتفوق.'}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setActiveCertificateStudent(activeProfileStudent); setActiveProfileStudent(null); }} className="btn btn-warning" style={{ flex: 1, gap: '6px' }}>
                <Award size={16} /> <span>إصدار شهادة التقدير 🏆</span>
              </button>
              <button onClick={() => { setActiveReportStudent(activeProfileStudent); setActiveProfileStudent(null); }} className="btn btn-success" style={{ flex: 1, gap: '6px' }}>
                <MessageCircle size={16} /> <span>تقرير الواتساب لولي الأمر</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: WHATSAPP PARENT REPORT MODAL */}
      {/* ========================================================= */}
      {activeReportStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={24} color="#059669" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>تقرير أداء الطالب: {activeReportStudent.name}</h3>
              </div>
              <button onClick={() => setActiveReportStudent(null)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
              {generateParentWhatsAppReport(activeReportStudent)}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={`https://wa.me/${(activeReportStudent.parentPhone || activeReportStudent.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generateParentWhatsAppReport(activeReportStudent))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-lg"
                style={{ flex: 1, gap: '8px' }}
                onClick={() => { addToast(`تم إرسال التقرير لولي أمر (${activeReportStudent.name})! 🚀`, 'success'); setActiveReportStudent(null); }}
              >
                <MessageCircle size={18} /> <span>إرسال عبر الواتساب الفوري</span>
              </a>
              <button onClick={() => setActiveReportStudent(null)} className="btn btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: WHATSAPP PAYMENT REMINDER MODAL */}
      {/* ========================================================= */}
      {activeReminderStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={24} color="#D97706" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>تذكير بمصاريف الطالب: {activeReminderStudent.name}</h3>
              </div>
              <button onClick={() => setActiveReminderStudent(null)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
              {generatePaymentReminderWhatsApp(activeReminderStudent)}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={`https://wa.me/${(activeReminderStudent.parentPhone || activeReminderStudent.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generatePaymentReminderWhatsApp(activeReminderStudent))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning btn-lg"
                style={{ flex: 1, gap: '8px' }}
                onClick={() => { addToast(`تم إرسال تذكير المصاريف لولي أمر (${activeReminderStudent.name})! 💸`, 'success'); setActiveReminderStudent(null); }}
              >
                <MessageCircle size={18} /> <span>إرسال تذكير الدفع عبر الواتساب</span>
              </a>
              <button onClick={() => setActiveReminderStudent(null)} className="btn btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: OFFICIAL CERTIFICATE MODAL */}
      {/* ========================================================= */}
      {activeCertificateStudent && (
        <CertificateModal
          isOpen={!!activeCertificateStudent}
          onClose={() => setActiveCertificateStudent(null)}
          studentData={activeCertificateStudent}
          examScore="50 / 50 (الدرجة النهائية)"
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 8: CHANGE TEACHER PASSWORD MODAL */}
      {/* ========================================================= */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      {/* ========================================================= */}
      {/* MODAL 9: FULL MANUAL EXAM BUILDER MODAL */}
      {/* ========================================================= */}
      {isExamBuilderOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(6px)',
          padding: '1.25rem'
        }}>
          <div className="card animate-fade-in" style={{
            maxWidth: '920px',
            width: '100%',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'var(--bg-surface)'
          }}>
            {/* Modal Header */}
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
                      {bldIsGeneralExam ? '🌟 استوديو إنشاء الامتحان العام الشامل المستقل' : 'إنشاء وتعديل امتحان المحاضرة يدويًا 📝'}
                    </h3>
                    <span className={bldExamIsDraft ? 'badge badge-warning' : 'badge badge-success'} style={{ fontSize: '0.75rem' }}>
                      {bldExamIsDraft ? 'مسودة (غير معلن)' : 'منشور للطلاب 🟢'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {bldIsGeneralExam ? 'امتحان عام شامل للطلاب (دخول فردي لمرة واحدة بكود شخصي)' : `المحاضرة: ${lectures.find(l => l.id === editingExamLectureId)?.title || 'المحاضرة المحددة'}`}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsExamBuilderOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveExamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Exam General Settings Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                background: 'var(--bg-subtle)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان الامتحان الكامل:</label>
                  <input
                    type="text"
                    value={bldExamTitle}
                    onChange={e => setBldExamTitle(e.target.value)}
                    className="input-control"
                    placeholder="مثال: امتحان شامل على قواعد الوحدة الأولى"
                    required
                  />
                </div>

                {bldIsGeneralExam && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      المرحلة الدراسية المستهدفة للامتحان العام:
                    </label>
                    <select
                      value={bldExamStageId}
                      onChange={e => setBldExamStageId(e.target.value)}
                      className="input-control"
                    >
                      {stages.map(stg => (
                        <option key={stg.id} value={stg.id}>{stg.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>مدة الامتحان (بالدقائق):</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={bldExamDuration}
                    onChange={e => setBldExamDuration(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الدرجة الكلية للامتحان:</label>
                  <input
                    type="number"
                    min="1"
                    value={bldExamTotalMarks}
                    onChange={e => setBldExamTotalMarks(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>درجة النجاح المقررة (50%+):</label>
                  <input
                    type="number"
                    min="1"
                    value={bldExamPassMarks}
                    onChange={e => setBldExamPassMarks(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عدد المحاولات المسموحة:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={bldExamMaxAttempts}
                    onChange={e => setBldExamMaxAttempts(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Toggles */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={bldExamShowResult}
                      onChange={e => setBldExamShowResult(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                    />
                    <span>إظهار النتيجة للطالب فور الانتهاء</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={bldExamShowCorrectAnswers}
                      onChange={e => setBldExamShowCorrectAnswers(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                    />
                    <span>عرض نموذج الإجابة الصحيحة والتفسير</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={bldExamIsDraft}
                      onChange={e => setBldExamIsDraft(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--warning)' }}
                    />
                    <span>حفظ كمسودة مؤقتة (لا يظهر للطالب حتى تنشره)</span>
                  </label>
                </div>
              </div>

              {/* Live Exam Structure & Metrics Dashboard */}
              {(() => {
                const totalQ = bldExamQuestions.length;
                const mcqCount = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi').length;
                const tfCount = bldExamQuestions.filter(q => q.type === 'tf').length;
                const essayCount = bldExamQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer').length;
                const totalMarks = bldExamQuestions.reduce((s, q) => s + (Number(q.points) || 0), 0);

                return (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(31, 77, 58, 0.08) 0%, rgba(166, 124, 82, 0.1) 100%)',
                    border: '1.5px solid rgba(31, 77, 58, 0.25)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary-700)' }}>
                          📊 لوحة إحصائيات وهيكل الامتحان:
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                          ترتيب إلزامي: الموضوعي أولاً ثم المقالي
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        يتم حفظ وترتيب الأسئلة أوتوماتيكياً: أسئلة الاختيارات أولاً ثم الأسئلة المقالية
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي الأسئلة</span>
                        <strong style={{ fontSize: '1.15rem', color: 'var(--primary-700)' }}>{totalQ}</strong>
                      </div>

                      <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>اختيار من متعدد</span>
                        <strong style={{ fontSize: '1.15rem', color: '#0284C7' }}>{mcqCount}</strong>
                      </div>

                      <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>صح أو خطأ (T/F)</span>
                        <strong style={{ fontSize: '1.15rem', color: '#10B981' }}>{tfCount}</strong>
                      </div>

                      <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>مقالي وإجابة قصيرة</span>
                        <strong style={{ fontSize: '1.15rem', color: '#D97706' }}>{essayCount}</strong>
                      </div>

                      <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1.5px solid var(--primary-500)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>مجموع الدرجات</span>
                        <strong style={{ fontSize: '1.15rem', color: 'var(--primary-800)' }}>{totalMarks} درجة</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {bldExamQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Question Header Bar */}
                    <div className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'var(--primary-600)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          {qIdx + 1}
                        </span>

                        <span className={
                          q.type === 'essay' ? 'badge badge-gold' :
                          q.type === 'short_answer' ? 'badge badge-warning' :
                          q.type === 'multi' ? 'badge badge-primary' :
                          q.type === 'tf' ? 'badge badge-secondary' : 'badge badge-success'
                        } style={{ fontSize: '0.75rem' }}>
                          {q.type === 'mcq' ? 'اختيار من متعدد (إجابة واحدة)' :
                           q.type === 'multi' ? 'اختيار من متعدد (أكثر من إجابة)' :
                           q.type === 'tf' ? 'صح أو خطأ' :
                           q.type === 'essay' ? 'سؤال مقالي (تصحيح يدوي)' : 'إجابة قصيرة (تصحيح يدوي)'}
                        </span>

                        {(q.type === 'essay' || q.type === 'short_answer') && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-600)', fontWeight: 700 }}>
                            ⚠️ يتطلب مراجعة المستر لفك قفل المحاضرة التالية
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>الدرجة:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={q.points || 3}
                            onChange={e => {
                              const val = e.target.value;
                              setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, points: Number(val) } : item));
                            }}
                            className="input-control"
                            style={{ width: '65px', height: '32px', textAlign: 'center', fontWeight: 800 }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'up')}
                          disabled={qIdx === 0}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="تحريك لأعلى"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 'down')}
                          disabled={qIdx === bldExamQuestions.length - 1}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="تحريك لأسفل"
                        >
                          <ArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(qIdx)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: '#EF4444' }}
                          title="حذف هذا السؤال"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Question Text & Image Section */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                        نص السؤال (أو اتركه فارغاً واكتفِ بالصورة):
                      </label>
                      <textarea
                        value={q.question || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, question: val } : item));
                        }}
                        placeholder="اكتب السؤال باللغة الإنجليزية أو العربية هنا..."
                        className="input-control"
                        style={{ height: '70px' }}
                      />
                    </div>

                    {/* Question Image Attachment */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setExamQImageInputIdx(qIdx);
                            examQImageInputRef.current.click();
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem', gap: '6px' }}
                        >
                          <Image size={15} />
                          <span>{q.questionImage ? 'تغيير صورة السؤال 🖼️' : 'إرفاق صورة للسؤال 🖼️'}</span>
                        </button>

                        {q.questionImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, questionImage: '' } : item));
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem', color: '#EF4444' }}
                          >
                            إزالة الصورة ✖
                          </button>
                        )}
                      </div>

                      {q.questionImage && (
                        <div style={{ marginTop: '8px', maxWidth: '320px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                          <img src={q.questionImage} alt="Question Attachment" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', background: '#000' }} />
                        </div>
                      )}
                    </div>

                    {/* Choices / Options for MCQ, Multi, TF */}
                    {(q.type === 'mcq' || q.type === 'multi' || q.type === 'tf') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                          خيارات الإجابة (حدد الإجابة الصحيحة):
                        </label>

                        {(q.options || []).map((opt, optIdx) => {
                          const isCorrect = q.type === 'multi' 
                            ? (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIdx))
                            : (q.correctAnswer === optIdx);

                          return (
                            <div key={optIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '8px', border: isCorrect ? '1.5px solid var(--success)' : '1px solid var(--border-subtle)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Radio / Checkbox for correct answer */}
                                {q.type === 'multi' ? (
                                  <input
                                    type="checkbox"
                                    checked={isCorrect}
                                    onChange={e => {
                                      setBldExamQuestions(prev => prev.map((item, i) => {
                                        if (i !== qIdx) return item;
                                        const currentArr = Array.isArray(item.correctAnswer) ? [...item.correctAnswer] : [];
                                        const nextArr = e.target.checked 
                                          ? [...currentArr, optIdx]
                                          : currentArr.filter(idx => idx !== optIdx);
                                        return { ...item, correctAnswer: nextArr };
                                      }));
                                    }}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                                    title="تحديد كإجابة صحيحة"
                                  />
                                ) : (
                                  <input
                                    type="radio"
                                    name={`correct_${q.id || qIdx}`}
                                    checked={isCorrect}
                                    onChange={() => {
                                      setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, correctAnswer: optIdx } : item));
                                    }}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--success)' }}
                                    title="تحديد كإجابة صحيحة"
                                  />
                                )}

                                <input
                                  type="text"
                                  value={opt}
                                  disabled={q.type === 'tf'}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setBldExamQuestions(prev => prev.map((item, i) => {
                                      if (i !== qIdx) return item;
                                      const newOpts = [...item.options];
                                      newOpts[optIdx] = val;
                                      return { ...item, options: newOpts };
                                    }));
                                  }}
                                  className="input-control"
                                  style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                                  placeholder={`نص الاختيار ${optIdx + 1}`}
                                />

                                {/* Option Image Upload Button */}
                                {q.type !== 'tf' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveOptUploadTarget({ qIdx, optIdx });
                                      examOptImageInputRef.current.click();
                                    }}
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                    title="إرفاق صورة لهذا الاختيار"
                                  >
                                    <Image size={15} />
                                  </button>
                                )}

                                {/* Delete option button if > 2 */}
                                {q.type !== 'tf' && (q.options?.length || 0) > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBldExamQuestions(prev => prev.map((item, i) => {
                                        if (i !== qIdx) return item;
                                        const newOpts = item.options.filter((_, idx) => idx !== optIdx);
                                        const newImages = (item.optionImages || []).filter((_, idx) => idx !== optIdx);
                                        return { ...item, options: newOpts, optionImages: newImages };
                                      }));
                                    }}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: '#EF4444', padding: '4px 8px' }}
                                  >
                                    <X size={15} />
                                  </button>
                                )}
                              </div>

                              {/* Option image preview if attached */}
                              {q.optionImages?.[optIdx] && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '26px' }}>
                                  <img src={q.optionImages[optIdx]} alt={`Option ${optIdx + 1}`} style={{ height: '50px', borderRadius: '4px', objectFit: 'contain', background: '#000' }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBldExamQuestions(prev => prev.map((item, i) => {
                                        if (i !== qIdx) return item;
                                        const newImages = [...(item.optionImages || [])];
                                        newImages[optIdx] = '';
                                        return { ...item, optionImages: newImages };
                                      }));
                                    }}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: '#EF4444', fontSize: '0.72rem' }}
                                  >
                                    إزالة صورة الاختيار
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {q.type !== 'tf' && (
                          <button
                            type="button"
                            onClick={() => {
                              setBldExamQuestions(prev => prev.map((item, i) => {
                                if (i !== qIdx) return item;
                                return {
                                  ...item,
                                  options: [...(item.options || []), `اختيار جديد ${(item.options?.length || 0) + 1}`],
                                  optionImages: [...(item.optionImages || []), '']
                                };
                              }));
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ alignSelf: 'flex-start', fontSize: '0.78rem', marginTop: '4px' }}
                          >
                            + إضافة اختيار إضافي
                          </button>
                        )}
                      </div>
                    )}

                    {/* Model Answer for Essay & Short Answer */}
                    {(q.type === 'essay' || q.type === 'short_answer') && (
                      <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '4px' }}>
                          نموذج الإجابة أو المعايير التي يقيس عليها المستر أثناء التصحيح اليدوي:
                        </label>
                        <textarea
                          value={q.modelAnswer || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, modelAnswer: val } : item));
                          }}
                          placeholder="اكتب المعايير أو الإجابة النموذجية الاسترشادية لتسهيل تقييم إجابة الطالب..."
                          className="input-control"
                          style={{ height: '65px' }}
                        />
                      </div>
                    )}

                    {/* Rationale / Explanation */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                        شرح الإجابة النموذجية وتوضيح القاعدة (يظهر للطالب بعد إعلان النتيجة):
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setBldExamQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, explanation: val } : item));
                        }}
                        placeholder="توضيح سبب صحة الإجابة أو القاعدة اللغوية..."
                        className="input-control"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Toolbar (Positioned at the BOTTOM of the questions list) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'var(--bg-subtle)',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '2px dashed var(--primary-500)',
                marginTop: '0.5rem'
              }}>
                <div className="flex-between">
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--primary-700)' }}>
                    ➕ إضافة سؤال جديد في نهاية الامتحان:
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    يُضاف السؤال لأسفل القائمة مباشرة
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleAddQuestionToBuilder('mcq')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.82rem', gap: '6px' }}
                  >
                    <Plus size={14} /> <span>+ اختيار من متعدد (إجابة واحدة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestionToBuilder('multi')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.82rem', gap: '6px' }}
                  >
                    <Plus size={14} /> <span>+ اختيار من متعدد (أكثر من إجابة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestionToBuilder('tf')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.82rem', gap: '6px' }}
                  >
                    <Plus size={14} /> <span>+ صح أو خطأ (True/False)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestionToBuilder('essay')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.82rem', gap: '6px', borderColor: 'var(--accent-500)', color: 'var(--accent-700)', fontWeight: 800 }}
                  >
                    <Plus size={14} /> <span>+ سؤال مقالي (تصحيح يدوي) ✍️</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddQuestionToBuilder('short_answer')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.82rem', gap: '6px', borderColor: 'var(--accent-500)', color: 'var(--accent-700)', fontWeight: 800 }}
                  >
                    <Plus size={14} /> <span>+ إجابة قصيرة (تصحيح يدوي) 📝</span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenPreviewModal}
                  className="btn btn-secondary btn-lg"
                  style={{ gap: '8px' }}
                >
                  <Eye size={18} />
                  <span>معاينة الامتحان كطالب 👁️</span>
                </button>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, gap: '8px', fontWeight: 800 }}
                >
                  <Check size={18} />
                  <span>{bldExamIsDraft ? 'حفظ الامتحان كمسودة 💾' : 'حفظ واعتماد الامتحان ونشره للطلاب 🚀'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExamBuilderOpen(false)}
                  className="btn btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 10: TEACHER MANUAL GRADING WORKFLOW MODAL */}
      {/* ========================================================= */}
      {activeGradingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(6px)',
          padding: '1.25rem'
        }}>
          <div className="card animate-fade-in" style={{
            maxWidth: '840px',
            width: '100%',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: 'var(--bg-surface)'
          }}>
            {/* Grading Header */}
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-100)', color: 'var(--accent-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                    تصحيح إجابات الطالب يدوياً 📝
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    الطالب: <strong style={{ color: 'var(--primary-700)' }}>{activeGradingItem.studentName}</strong> • {lectures.find(l => l.id === activeGradingItem.lectureId)?.title}
                  </span>
                </div>
              </div>
              <button onClick={() => setActiveGradingItem(null)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            {/* Score Strip */}
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              background: 'var(--bg-subtle)',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>درجة الأسئلة التلقائية (MCQ/TF):</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--success)' }}>{activeGradingItem.autoScore || 0} درجات</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي درجات الامتحان:</span>
                <strong style={{ fontSize: '1.15rem' }}>{activeGradingItem.maxScore || 20} درجة</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>درجة النجاح المقررة:</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--primary-700)' }}>{activeGradingItem.passingScore || 10} درجة</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>حالة التصحيح:</span>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>قيد المراجعة اليدوية</span>
              </div>
            </div>

            {/* Essay and Short Answer Questions to Grade */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {(examsData[activeGradingItem.lectureId] || lectures.find(l => l.id === activeGradingItem.lectureId)?.exam)?.questions
                ?.filter(q => q.type === 'essay' || q.type === 'short_answer')
                ?.map((q, qIndex) => {
                  const studentAns = activeGradingItem.answers?.[q.id] || 'لم يتم تقديم إجابة';
                  const maxPts = Number(q.points) || 5;

                  return (
                    <div
                      key={q.id || qIndex}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div className="flex-between">
                        <strong style={{ fontSize: '0.95rem', color: 'var(--primary-800)' }}>
                          سؤال {qIndex + 1}: {q.question}
                        </strong>
                        <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                          الدرجة القصوى: {maxPts} درجات
                        </span>
                      </div>

                      {q.questionImage && (
                        <div style={{ maxWidth: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={q.questionImage} alt="Question" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} />
                        </div>
                      )}

                      {q.modelAnswer && (
                        <div style={{ background: '#FEF3C7', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#92400E' }}>
                          <strong>دليل ونموذج الإجابة:</strong> {q.modelAnswer}
                        </div>
                      )}

                      {/* Student's Actual Answer Box */}
                      <div style={{
                        background: 'var(--bg-surface)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1.5px solid var(--primary-300)',
                        fontSize: '0.92rem',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}>
                        <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          إجابة الطالب المسجلة:
                        </strong>
                        {studentAns}
                      </div>

                      {/* Teacher Score Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'flex-start', marginTop: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 800 }}>منح الطالب درجة لهذا السؤال:</label>
                        <input
                          type="number"
                          min="0"
                          max={maxPts}
                          value={manualQuestionScores[q.id] !== undefined ? manualQuestionScores[q.id] : ''}
                          onChange={e => {
                            const val = Math.min(maxPts, Math.max(0, Number(e.target.value) || 0));
                            setManualQuestionScores(prev => ({ ...prev, [q.id]: val }));
                          }}
                          className="input-control"
                          style={{ width: '80px', height: '36px', textAlign: 'center', fontWeight: 900, fontSize: '1rem' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>من {maxPts}</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Teacher Notes Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px' }}>
                ملاحظات وتوجيهات المستر للطالب (تظهر له داخل كارت النتيجة):
              </label>
              <textarea
                value={gradingTeacherNotes}
                onChange={e => setGradingTeacherNotes(e.target.value)}
                placeholder="مثال: أحسنت في استخدام الروابط اللغوية، لكن انتبه لتصريف الأفعال الشاذة في السؤال الثاني..."
                className="input-control"
                style={{ height: '80px' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSubmitManualGrading}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, gap: '8px', fontWeight: 800 }}
              >
                <CheckCircle2 size={18} />
                <span>اعتماد الدرجة النهائية وفك قفل المحاضرة التالية 🏆</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGradingItem(null)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 11: PAUSE SINGLE STUDENT SUBSCRIPTION MODAL */}
      {/* ========================================================= */}
      {activePauseStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pause size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>إيقاف اشتراك الطالب مؤقتاً ⏸️</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الطالب: {activePauseStudent.studentName} ({activePauseStudent.targetTitle})</span>
                </div>
              </div>
              <button onClick={() => setActivePauseStudent(null)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400E', lineHeight: '1.6' }}>
              ⚠️ <strong>تنبيه الإيقاف المؤقت:</strong> سيتم حظر تشغيل فيديوهات المحاضرات وتنزيل ملفات الـ PDF للطالب فوراً، مع الحفاظ الكامل على تقدمه ودرجاته وسجلاته المالية.
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سبب الإيقاف المؤقت:</label>
              <input
                type="text"
                value={pauseReasonInput}
                onChange={e => setPauseReasonInput(e.target.value)}
                className="input-control"
                placeholder="مثال: تأخر في سداد القسط الثاني بالسنتر"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConfirmPauseSingle}
                className="btn btn-warning btn-lg"
                style={{ flex: 1, gap: '6px' }}
              >
                <Pause size={16} /> <span>تأكيد الإيقاف المؤقت</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePauseStudent(null)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 12: EXTEND SUBSCRIPTION MODAL */}
      {/* ========================================================= */}
      {activeExtendStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>تمديد مدة الاشتراك ⏳</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الطالب: {activeExtendStudent.studentName} ({activeExtendStudent.targetTitle})</span>
                </div>
              </div>
              <button onClick={() => setActiveExtendStudent(null)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                اختر عدد الأيام الإضافية أو حدد فترة مخصصة:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {[7, 15, 30, 60].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDaysInput(d)}
                    className={`btn btn-sm ${Number(extendDaysInput) === d ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    +{d} يوم
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عدد الأيام الإضافية:</label>
              <input
                type="number"
                min="1"
                max="365"
                value={extendDaysInput}
                onChange={e => setExtendDaysInput(e.target.value)}
                className="input-control"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConfirmExtendSingle}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, gap: '6px' }}
              >
                <Check size={16} /> <span>تأكيد تمديد الاشتراك</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveExtendStudent(null)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 13: BULK ACTION CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {isBulkModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>تنفيذ إجراء جماعي على الاشتراكات 👥</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    سيتم تطبيق الإجراء على ({selectedSubStudentIds.length}) طالب محدد
                  </span>
                </div>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            {bulkActionType === 'pause' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#92400E' }}>
                  ⚠️ سيتم إيقاف اشتراكات جميع الطلاب المحددين ({selectedSubStudentIds.length} طالب) مؤقتاً وحظر وصولهم للمحتوى حتى إعادة التفعيل.
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سبب الإيقاف المؤقت الجماعي:</label>
                  <input
                    type="text"
                    value={bulkActionReason}
                    onChange={e => setBulkActionReason(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>
              </div>
            )}

            {bulkActionType === 'resume' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#166534' }}>
                🟢 سيتم استئناف اشتراكات جميع الطلاب المحددين ({selectedSubStudentIds.length} طالب) فوراً وإعادة فتح المحاضرات والـ PDF لهم.
              </div>
            )}

            {bulkActionType === 'extend' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                  ⏳ سيتم تمديد تاريخ انتهاء اشتراك جميع الطلاب المحددين ({selectedSubStudentIds.length} طالب).
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عدد الأيام الإضافية:</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={bulkActionDays}
                    onChange={e => setBulkActionDays(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConfirmBulkAction}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, gap: '6px', fontWeight: 800 }}
              >
                <Check size={18} /> <span>تأكيد الإجراء الجماعي</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 14: SUBSCRIPTION AUDIT LOGS MODAL */}
      {/* ========================================================= */}
      {isAuditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          padding: '1.5rem'
        }}>
          <div className="card animate-fade-in" style={{
            maxWidth: '820px',
            width: '100%',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-surface)'
          }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>سجل تدقيق وتعديلات الاشتراكات 📋</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>توثيق كامل لكافة عمليات الإيقاف، التمديد، والتفعيل</span>
                </div>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="btn btn-ghost btn-sm"><X size={20} /></button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1.5px solid var(--border-subtle)' }}>
                    <th style={{ padding: '10px' }}>التاريخ والوقت</th>
                    <th style={{ padding: '10px' }}>نوع العملية</th>
                    <th style={{ padding: '10px' }}>معرف الطالب</th>
                    <th style={{ padding: '10px' }}>الاشتراك المستهدف</th>
                    <th style={{ padding: '10px' }}>السبب / التفاصيل</th>
                    <th style={{ padding: '10px' }}>المسؤول</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscriptionAuditLogs || []).map((log, idx) => (
                    <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span className={
                          log.action === 'pause' ? 'badge badge-warning' :
                          log.action === 'resume' ? 'badge badge-success' :
                          log.action === 'extend' ? 'badge badge-primary' :
                          log.action === 'cancel' ? 'badge badge-danger' : 'badge badge-gold'
                        } style={{ fontSize: '0.72rem' }}>
                          {log.action === 'pause' ? 'إيقاف مؤقت ⏸️' :
                           log.action === 'resume' ? 'استئناف تفعيل ▶️' :
                           log.action === 'extend' ? 'تمديد اشتراك ⏳' :
                           log.action === 'cancel' ? 'إلغاء نهائي ❌' : 'تجميد الحساب 🧊'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>
                        {students.find(s => s.id === log.studentId)?.name || log.studentId}
                      </td>
                      <td style={{ padding: '10px' }}>{log.targetId}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                        {log.details?.reason || (log.details?.days ? `+${log.details.days} يوم` : '-')}
                      </td>
                      <td style={{ padding: '10px', fontSize: '0.78rem', color: 'var(--primary-700)', fontWeight: 700 }}>
                        {log.admin || 'المستر / الإدارة'}
                      </td>
                    </tr>
                  ))}
                  {(subscriptionAuditLogs || []).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        لا توجد سجلات تعديل اشتراكات مسجلة حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <button onClick={() => setIsAuditModalOpen(false)} className="btn btn-secondary">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 15: EXAM PREVIEW MODAL */}
      {/* ========================================================= */}
      {isPreviewModalOpen && previewExamPayload && (
        <EnglishExamModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          previewMode={true}
          previewExam={previewExamPayload}
        />
      )}

      {/* Hidden file inputs for Exam Builder images */}
      <input
        type="file"
        ref={examQImageInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => examQImageInputIdx !== null && handleUploadQuestionImage(e, examQImageInputIdx)}
      />
      <input
        type="file"
        ref={examOptImageInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleUploadOptionImage(e, activeOptUploadTarget.qIdx, activeOptUploadTarget.optIdx)}
      />
    </div>
  );
}

