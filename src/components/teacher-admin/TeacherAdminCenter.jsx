import React, { useState, useRef } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { useToast } from '../../context/ToastContext';
import CertificateModal from '../student/CertificateModal';
import { 
  Upload, Key, Users, BookOpen, Video, FileText, CheckCircle2, 
  Send, MessageCircle, Plus, Copy, Sparkles, Bell, Trophy, Shield, 
  Trash2, Edit, Settings, RotateCcw, UserCheck, Eye, HelpCircle, 
  DollarSign, CreditCard, AlertCircle, Phone, Search, Filter, Printer, 
  QrCode, Lock, Unlock, ArrowUpRight, Check, X, Image, Film, FileUp,
  Award, ScanLine, ShieldCheck, ShieldAlert, Activity, Flame, Cloud,
  Database, HardDrive, RefreshCw, KeyRound
} from 'lucide-react';
import { uploadFileToFirebaseStorage } from '../../services/firestoreSync';
import { uploadFileToR2, uploadTeacherAvatarToR2 } from '../../services/r2Storage';
import { saveMediaFilePermanently, updateMediaCloudUrl } from '../../services/persistentStorage';
import ChangePasswordModal from './ChangePasswordModal';
import TeacherAvatar3D from '../common/TeacherAvatar3D';

export default function TeacherAdminCenter({ onNavigate }) {
  const { 
    teacherProfile, stages, lectures, booklets, topAchievers, accessCodes, students, announcements,
    addStudent, updateStudent, deleteStudent, toggleStudentStatus, recordPayment,
    generatePaymentReminderWhatsApp, generateStudentReceiptWhatsApp, generateParentWhatsAppReport,
    updateTeacherProfile, uploadNewLecture, deleteLecture,
    addStage, deleteStage,
    addBooklet, deleteBooklet,
    addAchiever, deleteAchiever,
    generateNewCode, deleteCode,
    postAnnouncement, deleteAnnouncement,
    resetToFactoryDefaults,
    syncAllToFirebase,
    changeTeacherPassword
  } = useTeacher();
  const { addToast } = useToast();

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('lectures'); 
  // 'attendance' | 'security' | 'students' | 'finance' | 'lectures' | 'profile' | 'stages' | 'booklets' | 'achievers' | 'codes' | 'broadcast'

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

  // Attendance QR / Barcode Scanner State
  const [scannerInput, setScannerInput] = useState('');
  const [scannedStudentResult, setScannedStudentResult] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState([
    { time: '04:15 م', name: 'سعد القحطاني', code: 'MS-SEC3-101', stage: 'الصف الثالث الثانوي', status: 'مسدد بالكامل ✓' },
    { time: '04:18 م', name: 'سارة الزهراني', code: 'MS-SEC3-102', stage: 'الصف الثالث الثانوي', status: 'مسدد بالكامل ✓' }
  ]);

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

  // Lecture Form State
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

  // Code Generator State
  const [genStage, setGenStage] = useState(stages[0]?.name || 'الصف الثالث الثانوي');
  const [genTitle, setGenTitle] = useState('محاضرة لغة إنجليزية جديدة');
  const [genPrice, setGenPrice] = useState('70 ج.م');
  const [genCodeDuration, setGenCodeDuration] = useState('30'); // '7' | '15' | '30' | '60' | '120' | '365'
  const [genCodeTargetType, setGenCodeTargetType] = useState('lecture'); // 'lecture' | 'stage' | 'all'
  const [genCodeTargetId, setGenCodeTargetId] = useState('');

  // Broadcast State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

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
        addToast(`✅ تم رفع وحفظ الفيديو بنجاح على سحابة Cloudflare R2 فائقة السرعة! ☁️🎬`, 'success', 6000);
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

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfTitle(file.name);
      addToast(`تم اختيار ملف المذكرة (${file.name}) من جهازك 📄`, 'success');
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
    addToast(`جاري رفع ملف المذكرة (${file.name}) إلى سحابة Cloudflare... 📄☁️`, 'info');

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
  // QR Attendance Scanner Logic
  // -------------------------------------------------------------
  const handleScanAttendance = (codeToScan) => {
    const query = (codeToScan || scannerInput).trim().toUpperCase();
    if (!query) return;

    const matched = students.find(s => 
      s.code?.toUpperCase() === query || 
      s.phone?.includes(query) || 
      s.name?.includes(query)
    );

    if (matched) {
      setScannedStudentResult(matched);
      const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      setAttendanceLog(prev => [
        {
          time: currentTime,
          name: matched.name,
          code: matched.code,
          stage: matched.stageName,
          status: matched.finance?.paymentStatus === 'paid' ? 'مسدد بالكامل ✓' : `متبقي ${matched.finance?.dueAmount || 0} ج.م ⚠️`
        },
        ...prev
      ]);
      addToast(`✅ تم رصد الطالب (${matched.name}) وتسجيل حضوره بنجاح!`, 'success');
      setScannerInput('');
    } else {
      addToast('❌ لم يتم العثور على طالب بهذا الكود، تأكد من كود الطالب أو الباركود', 'error');
    }
  };

  // -------------------------------------------------------------
  // Financial Computations
  // -------------------------------------------------------------
  const totalCollectedRevenue = students.reduce((sum, s) => sum + (Number(s.finance?.paidAmount) || 0), 0);
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

    // Upload avatar to permanent Cloudflare URL so WhatsApp and social previews update automatically
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
    }

    updateTeacherProfile({
      name: profileName,
      title: profileTitle,
      subtitle: profileSubtitle,
      aboutBio: profileBio,
      whatsappNumber: profileWhatsapp,
      avatar: finalAvatar,
      totalStudents: Number(profileStudents)
    });
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

    await uploadNewLecture({
      stageId: targetStage?.id || stageId,
      stageName: targetStage?.name || 'المرحلة الدراسية',
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
      examRequired: true,
      pdfBooklet: { title: pdfTitle, size: '5.2 MB', pages: 30 },
      vocabList: [{ word: 'Extraordinary', ipa: '/ɪkˈstrɔː.dɪn.ər.i/', arabic: 'استثنائي / خارق للعادة', example: 'She showed extraordinary commitment.' }],
      grammarRules: [{ title: 'قاعدة الوحدة الجديدة', rule: 'تطبيق عملي لأهم نقاط الجرامر.', example: 'Hard work leads to success.' }]
    });

    setTitle('');
    setSubtitle('');
    setVideoPreviewUrl('');
    setVideoFileName('');
    setVideoFileSize('');
    setLocalMediaKey(null);
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

  const handleGenerateCode = (e) => {
    e.preventDefault();
    const targetStageObj = stages.find(s => s.name === genStage) || stages[0];
    const targetLectureObj = lectures.find(l => l.id === genCodeTargetId) || lectures[0];
    
    let targetTitle = genTitle;
    let targetId = genCodeTargetId || targetLectureObj?.id || 'lec-s3-01';

    if (genCodeTargetType === 'stage') {
      targetTitle = `اشتراك مرحلة: ${targetStageObj?.name || genStage}`;
      targetId = targetStageObj?.id || 'sec-3';
    } else if (genCodeTargetType === 'all') {
      targetTitle = 'اشتراك المنصة الشامل (كافة المراحل)';
      targetId = 'all-access';
    } else {
      targetTitle = targetLectureObj ? targetLectureObj.title : genTitle;
    }

    generateNewCode(
      targetStageObj?.name || genStage,
      targetTitle,
      targetId,
      genPrice,
      genCodeTargetType,
      Number(genCodeDuration) || 30
    );

    setGenTitle('');
  };

  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    postAnnouncement(annTitle, annContent);
    setAnnTitle('');
    setAnnContent('');
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container-wide">
        {/* Top Control Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: 'white',
          padding: '2rem 2.5rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-gold">لوحة الإدارة والدرع الأمني الشامل 🛡️</span>
              <span style={{ fontSize: '0.85rem', color: '#A5B4FC' }}>The Master Studio 🇬🇧</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 4px', color: 'white' }}>
              استوديو إدارة منصة {teacherProfile.name}
            </h1>
            <p style={{ color: '#C7D2FE', fontSize: '0.92rem', margin: 0 }}>
              رفع الفيديوهات من جهازك، ماسح حضور السنتر QR، درع حماية المحتوى، إدارة الخزينة والمصروفات
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

        {/* Firebase Cloud Connection Card */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '2px solid #F59E0B',
          borderRadius: 'var(--radius-lg)',
          padding: '1.1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(217, 119, 6, 0.3)' }}>
              <Flame size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <strong style={{ fontSize: '1.05rem', color: '#92400E' }}>سحابة Google Firebase مهيأة ومتصلة بنجاح 🔥</strong>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>مشروع: mr-mi-586d2</span>
                <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>Cloud Firestore Live</span>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#78350F' }}>
                Cloud Firestore Database (Active) • Storage Bucket (mr-mi-586d2.firebasestorage.app) • مزامنة تلقائية فورية
              </span>
            </div>
          </div>

          <button
            onClick={syncAllToFirebase}
            className="btn btn-warning"
            style={{ gap: '8px', fontWeight: 800, padding: '0.75rem 1.4rem', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)' }}
          >
            <Cloud size={18} />
            <span>⚡ مزامنة كاملة للبيانات سحابياً مع Firebase</span>
          </button>
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
            { id: 'attendance', label: '📷 ماسح حضور السنتر (QR Scanner)', icon: QrCode },
            { id: 'security', label: '🛡️ درع الحماية والأمان (Anti-Piracy)', icon: ShieldCheck },
            { id: 'students', label: `👥 سجل ومتابعة الطلاب (${students.length})`, icon: Users },
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

              <form onSubmit={handleUploadLecture} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                        المرحلة المستهدفة (أين ستضاف هذه المحاضرة؟):
                      </label>
                      <select 
                        value={stageId} 
                        onChange={e => setStageId(e.target.value)} 
                        className="input-control"
                        style={{ fontWeight: 800, borderColor: 'var(--primary-400)', background: 'var(--bg-subtle)' }}
                      >
                        {stages.map(s => (
                          <option key={s.id} value={s.id}>🎓 {s.name} ({s.badge || 'دفعة 2026'})</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.74rem', color: 'var(--primary-600)', display: 'block', marginTop: '4px', fontWeight: 700 }}>
                        📌 ستنشر هذه المحاضرة مباشرة داخل قسم: <strong>{stages.find(s => s.id === stageId)?.name || 'المرحلة المختارة'}</strong>
                      </span>
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
                                <div style={{ width: `${Math.max(uploadProgress, 20)}%`, height: '100%', background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)', transition: 'width 0.3s ease' }} />
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
                                    padding: '6px 14px', background: '#EEF2FF', color: '#3730A3', 
                                    borderRadius: '20px', fontSize: '0.84rem', fontWeight: 800, border: '1px solid #C7D2FE' 
                                  }}>
                                    <Cloud size={16} color="#4F46E5" /> ☁️ تم الرفع والحفظ في سحابة Firebase
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

                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', gap: '8px', marginTop: 'auto' }}>
                    <Upload size={18} />
                    <span>نشر المحاضرة والفيديو الآن لجميع الطلاب 🚀</span>
                  </button>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span className="badge badge-primary">{lec.unitNumber}</span>
                          <strong style={{ fontSize: '0.95rem' }}>{lec.title}</strong>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          المرحلة: {stages.find(s => s.id === lec.stageId)?.name || lec.stageId} • ⏱️ {lec.duration}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
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
        {/* TAB 2: QR & BARCODE ATTENDANCE SCANNER FOR CENTERS */}
        {/* ========================================================= */}
        {activeTab === 'attendance' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)', border: '2px solid var(--primary-500)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0 }}>
                    ماسح حضور الطلاب بالسنتر (QR & Barcode Attendance Scanner) 📷
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    مرر جهاز قارئ الباركود أو اكتب كود الطالب للتحقق الفوري من حالة الاشتراك وتسجيل الحضور بالسنتر!
                  </p>
                </div>
              </div>

              {/* Barcode/QR Input Bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <ScanLine size={20} color="var(--primary-600)" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="امسح الباركود أو اكتب كود الطالب (مثال: MS-SEC3-101)..."
                    value={scannerInput}
                    onChange={e => setScannerInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleScanAttendance(); }}
                    className="input-control"
                    style={{ paddingRight: '44px', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => handleScanAttendance()}
                  className="btn btn-primary btn-lg"
                  style={{ gap: '8px', minWidth: '160px' }}
                >
                  <ScanLine size={20} />
                  <span>تسجيل الحضور</span>
                </button>
              </div>

              {/* Preset Quick Scan Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>أكواد طلاب سريعة للتجربة:</span>
                {students.slice(0, 4).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleScanAttendance(s.code)}
                    className="btn btn-ghost btn-sm"
                    style={{ border: '1px dashed var(--primary-400)', color: 'var(--primary-700)', fontSize: '0.78rem' }}
                  >
                    📷 {s.name} ({s.code})
                  </button>
                ))}
              </div>

              {/* Scanned Student Visual Card */}
              {scannedStudentResult && (
                <div style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                  border: '2px solid #6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={scannedStudentResult.avatar}
                      alt={scannedStudentResult.name}
                      style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #4F46E5', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E1B4B', margin: 0 }}>
                          {scannedStudentResult.name}
                        </h4>
                        <span className="badge badge-primary">{scannedStudentResult.stageName}</span>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4F46E5', fontSize: '0.95rem' }}>
                        كود: {scannedStudentResult.code} • 📱 {scannedStudentResult.phone}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                        السنتر: {scannedStudentResult.centerName || 'سنتر النخبة'} • طوارئ: {scannedStudentResult.parentPhone}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {scannedStudentResult.finance?.paymentStatus === 'paid' ? (
                      <span className="badge badge-success" style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
                        ✓ مصاريف الشهر مسددة بالكامل
                      </span>
                    ) : (
                      <span className="badge badge-error" style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
                        ⚠️ متبقي عليه: {scannedStudentResult.finance?.dueAmount} ج.م
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700 }}>
                      ✅ تم تدوين الدخول في سجل الحضور الآن
                    </span>
                  </div>
                </div>
              )}

              {/* Attendance Log Table */}
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem' }}>
                  📋 سجل الطلاب الحاضرين في السنتر اليوم ({attendanceLog.length})
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>وقت التسجيل</th>
                        <th style={{ padding: '0.75rem' }}>اسم الطالب</th>
                        <th style={{ padding: '0.75rem' }}>كود الطالب</th>
                        <th style={{ padding: '0.75rem' }}>المرحلة</th>
                        <th style={{ padding: '0.75rem' }}>حالة المصاريف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceLog.map((log, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>{log.time}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>{log.name}</td>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.code}</td>
                          <td style={{ padding: '0.75rem' }}>{log.stage}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={log.status.includes('✓') ? 'badge badge-success' : 'badge badge-error'}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #4F46E5' }}>
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

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #EC4899' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1rem' }}>4. علامة مائية متحركة عشوائية</strong>
                    <span className="badge badge-success">نشط 100%</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    ظهور اسم ورقم هاتف وكود الطالب متقلباً في زوايا عشوائية لمنع التصوير بكاميرا موبايل خارجية.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-subtle)', borderRight: '4px solid #6366F1' }}>
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
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
                border: '2px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}>
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
                  style={{ gap: '8px', fontWeight: 800, boxShadow: '0 4px 20px rgba(79, 70, 229, 0.35)', padding: '0.75rem 1.4rem' }}
                >
                  <KeyRound size={18} />
                  <span>تغيير كلمة المرور الآن 🔑</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: STUDENTS MANAGEMENT & FINANCE */}
        {/* ========================================================= */}
        {activeTab === 'students' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="بحث باسم الطالب، كود الطالب، أو الهاتف..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="input-control"
                    style={{ paddingRight: '38px' }}
                  />
                </div>
                <div>
                  <select value={selectedStageFilter} onChange={e => setSelectedStageFilter(e.target.value)} className="input-control">
                    <option value="all">كل الصفوف والمراحل</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <select value={selectedPayFilter} onChange={e => setSelectedPayFilter(e.target.value)} className="input-control">
                    <option value="all">كل حالات السداد</option>
                    <option value="paid">مسدد بالكامل ✓</option>
                    <option value="partial">مسدد جزء / متبقي</option>
                    <option value="unpaid">لم يسدد / متأخرات ⚠️</option>
                  </select>
                </div>
                <div>
                  <select value={selectedGroupFilter} onChange={e => setSelectedGroupFilter(e.target.value)} className="input-control">
                    <option value="all">كل المجموعات (سنتر وأونلاين)</option>
                    <option value="center">طلاب السنتر 🏢</option>
                    <option value="online">طلاب الأونلاين 💻</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>سجل الطلاب والاشتراكات</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>المعروض: {filteredStudents.length} من {students.length} طالب</span>
                </div>
                <button onClick={() => setIsAddStudentModalOpen(true)} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                  <Plus size={16} />
                  <span>إضافة طالب جديد</span>
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>بيانات الطالب</th>
                      <th style={{ padding: '0.75rem' }}>المرحلة والمجموعة</th>
                      <th style={{ padding: '0.75rem' }}>المصاريف والفلوس</th>
                      <th style={{ padding: '0.75rem' }}>الحضور والواجب</th>
                      <th style={{ padding: '0.75rem' }}>الحالة</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>إجراءات المتابعة والشهادة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(std => {
                      const pay = std.finance || { paidAmount: 0, dueAmount: 250, paymentStatus: 'unpaid' };
                      const hw = std.homeworkStatus?.['lec-s3-01'];

                      return (
                        <tr key={std.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={std.avatar} alt={std.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{std.name}</strong>
                                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--primary-600)', fontWeight: 700 }}>{std.code}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>📱 {std.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem' }}>
                            {(() => {
                              const subs = std.subscriptions ? Object.values(std.subscriptions) : [];
                              const primarySub = subs[0] || std.subscription || null;
                              const startDate = primarySub?.startDate || std.startDate;
                              const expiresAt = primarySub?.expiresAt || primarySub?.expirationDate || std.expiresAt || std.expirationDate;
                              const isSubActive = expiresAt ? new Date(expiresAt).getTime() > Date.now() : (std.subscriptionStatus === 'active' || std.isActive);
                              const startDateFormatted = startDate ? new Date(startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
                              const expiresAtFormatted = expiresAt ? new Date(expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

                              return (
                                <div>
                                  <span style={{ fontWeight: 800, display: 'block', color: 'var(--text-primary)' }}>{std.stageName || primarySub?.targetTitle || 'المرحلة الدراسية'}</span>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                                    {std.groupType === 'center' ? `🏢 ${std.centerName}` : '💻 أونلاين VIP'}
                                  </span>
                                  {expiresAt ? (
                                    <div style={{ marginTop: '4px', fontSize: '0.74rem', lineHeight: '1.4' }}>
                                      <span style={{ 
                                        display: 'inline-block',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        background: isSubActive ? '#DCFCE7' : '#FEE2E2',
                                        color: isSubActive ? '#166534' : '#991B1B',
                                        marginBottom: '2px'
                                      }}>
                                        {isSubActive ? '✓ اشتراك نشط' : '⚠️ اشتراك منتهي'}
                                      </span>
                                      {startDateFormatted && <span style={{ color: 'var(--text-muted)', display: 'block' }}>بدأ: {startDateFormatted}</span>}
                                      <span style={{ color: isSubActive ? 'var(--primary-700)' : '#EF4444', fontWeight: 700, display: 'block' }}>ينتهي: {expiresAtFormatted}</span>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>🔒 بدون اشتراك نشط</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '0.85rem' }}>
                            <div style={{ marginBottom: '4px' }}>
                              {pay.paymentStatus === 'paid' ? <span className="badge badge-success">✓ مسدد {pay.paidAmount} ج.م</span> : <span className="badge badge-error">⚠️ متبقي {pay.dueAmount} ج.م</span>}
                            </div>
                            <button onClick={() => { setActivePaymentStudent(std); setPayAmountInput(String(pay.dueAmount || 250)); }} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '2px 6px', color: 'var(--primary-600)' }}>
                              💵 سداد دفعة
                            </button>
                          </td>
                          <td style={{ padding: '0.85rem' }}>
                            <span style={{ fontSize: '0.8rem', display: 'block' }}>حضور: <strong>{std.attendanceRate}</strong></span>
                            <span style={{ fontSize: '0.75rem', color: hw?.status === 'submitted' ? 'var(--success)' : 'var(--error)' }}>{hw?.status === 'submitted' ? '✓ تم الواجب' : '⚠️ لم يسلم'}</span>
                          </td>
                          <td style={{ padding: '0.85rem' }}>
                            <button onClick={() => toggleStudentStatus(std.id)} className={`btn btn-sm ${std.isActive ? 'btn-ghost' : 'btn-secondary'}`} style={{ fontSize: '0.72rem', padding: '2px 8px', color: std.isActive ? 'var(--success)' : 'var(--error)' }}>
                              {std.isActive ? 'نشط ✓' : '🔒 مجمد'}
                            </button>
                          </td>
                          <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button onClick={() => setActiveCertificateStudent(std)} className="btn btn-ghost btn-sm" title="إصدار شهادة تقدير معتمدة"><Award size={16} color="#D97706" /></button>
                              <button onClick={() => setActiveCardStudent(std)} className="btn btn-ghost btn-sm" title="كارنيه الطالب QR"><QrCode size={16} color="var(--primary-600)" /></button>
                              <button onClick={() => setActiveProfileStudent(std)} className="btn btn-ghost btn-sm" title="ملف الطالب 360"><Eye size={16} /></button>
                              <button onClick={() => setActiveReportStudent(std)} className="btn btn-ghost btn-sm" title="تقرير أداء واتساب"><MessageCircle size={16} color="#059669" /></button>
                              {pay.dueAmount > 0 && <button onClick={() => setActiveReminderStudent(std)} className="btn btn-ghost btn-sm" title="تذكير بالمصاريف"><DollarSign size={16} color="#D97706" /></button>}
                              <button onClick={() => { if (window.confirm(`حذف الطالب "${std.name}"؟`)) deleteStudent(std.id); }} className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: FINANCE & DUES DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'finance' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '4px solid var(--success)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي المحصل</span>
                <strong style={{ fontSize: '2rem', color: 'var(--success)', display: 'block' }}>{totalCollectedRevenue.toLocaleString()} ج.م</strong>
              </div>
              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '4px solid #EF4444' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي المتأخرات</span>
                <strong style={{ fontSize: '2rem', color: '#EF4444', display: 'block' }}>{totalPendingDues.toLocaleString()} ج.م</strong>
              </div>
              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '4px solid var(--primary-600)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الإيراد المتوقع</span>
                <strong style={{ fontSize: '2rem', color: 'var(--primary-600)', display: 'block' }}>{totalExpectedRevenue.toLocaleString()} ج.م</strong>
              </div>
              <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)', borderRight: '4px solid #F59E0B' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>نسبة التحصيل</span>
                <strong style={{ fontSize: '2rem', color: '#F59E0B', display: 'block' }}>{collectionRate}%</strong>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem', color: '#EF4444' }}>⚠️ الطلاب المتأخرين عن سداد المصاريف</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {students.filter(s => (s.finance?.dueAmount || 0) > 0).map(std => (
                  <div key={std.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
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
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(124, 58, 237, 0.06) 100%)',
                border: '1.5px dashed rgba(79, 70, 229, 0.35)',
                textAlign: 'center',
                margin: '0.5rem 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Sparkles size={18} color="#4F46E5" />
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

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نبذة المستر:</label>
                <textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="input-control" style={{ height: '100px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>

            {/* Teacher Password Settings Card */}
            <div style={{
              marginTop: '1.75rem',
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(245, 158, 11, 0.06) 100%)',
              border: '2px solid rgba(79, 70, 229, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}>
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
                        {isUploadingBk ? 'جاري الرفع لـ Cloudflare... ⏳' : newBkFile ? `ملف: ${newBkFile.name} (${newBkFileSize})` : 'اختر ملف PDF من جهازك'}
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
                    <span>تم رفع وتجهيز المذكرة سحابياً بنجاح على Cloudflare! جاهزة للتحميل من قِبل الطلاب.</span>
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

        {activeTab === 'codes' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>توليد كود شحن ذكي بمحددات زمنية 🎟️</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    كود مشفر وصالح للاستخدام <strong>مرة واحدة فقط</strong> لطالب واحد، ويفتح المحتوى للمدة التي تحددها ثم يقفل تلقائياً!
                  </p>
                </div>
              </div>

              <form onSubmit={handleGenerateCode} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المرحلة الدراسية:</label>
                  <select 
                    value={genStage} 
                    onChange={e => {
                      setGenStage(e.target.value);
                      const stg = stages.find(s => s.name === e.target.value);
                      const lecs = lectures.filter(l => l.stageId === stg?.id);
                      if (lecs.length > 0) setGenCodeTargetId(lecs[0].id);
                    }} 
                    className="input-control"
                  >
                    {stages.map(s => <option key={s.id} value={s.name}>🎓 {s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نوع المحتوى المفتوح:</label>
                  <select 
                    value={genCodeTargetType} 
                    onChange={e => setGenCodeTargetType(e.target.value)} 
                    className="input-control"
                    style={{ fontWeight: 800 }}
                  >
                    <option value="lecture">محاضرة واحدة محددة 🎬</option>
                    <option value="stage">اشتراك المرحلة بالكامل 🎓</option>
                    <option value="all">اشتراك المنصة الشامل VIP ⭐</option>
                  </select>
                </div>

                {genCodeTargetType === 'lecture' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المحاضرة المستهدفة:</label>
                    <select 
                      value={genCodeTargetId} 
                      onChange={e => setGenCodeTargetId(e.target.value)} 
                      className="input-control"
                    >
                      {lectures
                        .filter(l => {
                          const stg = stages.find(s => s.name === genStage);
                          return !stg || l.stageId === stg.id;
                        })
                        .map(l => (
                          <option key={l.id} value={l.id}>{l.unitNumber}: {l.title.slice(0, 30)}...</option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                    ⏳ مدة فتح الاشتراك (صلاحية الكود):
                  </label>
                  <select 
                    value={genCodeDuration} 
                    onChange={e => setGenCodeDuration(e.target.value)} 
                    className="input-control"
                    style={{ fontWeight: 800, borderColor: 'var(--primary-500)', background: 'var(--bg-subtle)' }}
                  >
                    <option value="7">⚡ 7 أيام (أسبوع مكثف)</option>
                    <option value="15">📅 15 يوم (نصف شهر)</option>
                    <option value="30">🌟 شهر كامل (30 يوم) - الموصى به</option>
                    <option value="60">🔥 شهرين (60 يوم)</option>
                    <option value="120">📚 تيرم دراسي كامل (4 شهور)</option>
                    <option value="365">🎓 سنة دراسية كاملة (365 يوم)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سعر الكود:</label>
                  <input type="text" value={genPrice} onChange={e => setGenPrice(e.target.value)} placeholder="مثال: 70 ج.م" className="input-control" />
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '44px', fontWeight: 800, gap: '6px' }}>
                  <Plus size={18} />
                  <span>توليد كود الشحن</span>
                </button>
              </form>
            </div>

            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  سجل أكواد الشحن الصادرة ({accessCodes.length} كود)
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  🔒 جميع الأكواد مشفرة وتعمل لمرة واحدة فقط
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {accessCodes.map((codeObj, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '1rem 1.25rem', 
                    background: codeObj.isUsed ? 'rgba(0,0,0,0.02)' : 'var(--bg-subtle)', 
                    borderRadius: '12px',
                    border: codeObj.isUsed ? '1px solid var(--border-subtle)' : '1px solid var(--primary-300)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '6px 12px',
                        background: codeObj.isUsed ? '#E2E8F0' : 'var(--primary-50)',
                        color: codeObj.isUsed ? '#64748B' : 'var(--primary-700)',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '1rem',
                        letterSpacing: '1px'
                      }}>
                        {codeObj.code}
                      </div>

                      <div>
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>{codeObj.targetTitle}</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span>المرحلة: {codeObj.stage}</span>
                          <span>•</span>
                          <span>المدة: <strong style={{ color: 'var(--primary-600)' }}>{codeObj.durationLabel || `${codeObj.durationDays || 30} يوم`}</strong></span>
                          <span>•</span>
                          <span>السعر: {codeObj.price}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {codeObj.isUsed ? (
                        <span style={{ 
                          padding: '4px 10px', 
                          background: '#FEE2E2', 
                          color: '#991B1B', 
                          borderRadius: '20px', 
                          fontSize: '0.78rem', 
                          fontWeight: 800 
                        }}>
                          🔒 تم الاستخدام ({codeObj.usedBy || 'طالب'})
                          {codeObj.expiresAt && ` • ينتهي: ${new Date(codeObj.expiresAt).toLocaleDateString('ar-EG')}`}
                        </span>
                      ) : (
                        <span style={{ 
                          padding: '4px 10px', 
                          background: '#DCFCE7', 
                          color: '#166534', 
                          borderRadius: '20px', 
                          fontSize: '0.78rem', 
                          fontWeight: 800 
                        }}>
                          🟢 متاح وصالح لمرة واحدة
                        </span>
                      )}

                      <button onClick={() => { navigator.clipboard.writeText(codeObj.code); addToast(`تم نسخ الكود: ${codeObj.code}`, 'success'); }} className="btn btn-secondary btn-sm" title="نسخ الكود">
                        <Copy size={14} />
                        <span>نسخ</span>
                      </button>

                      <button onClick={() => deleteCode(codeObj.code)} className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} title="حذف الكود">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>إرسال تنبيه عاجل لجميع الطلاب 📢</h3>
              <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان التنبيه:</label>
                  <input type="text" value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="input-control" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نص الرسالة:</label>
                  <textarea value={annContent} onChange={e => setAnnContent(e.target.value)} className="input-control" style={{ height: '100px' }} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '8px' }}>
                  <Send size={18} />
                  <span>إرسال التنبيه فوراً</span>
                </button>
              </form>
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
            <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', color: 'white', padding: '1.25rem', textAlign: 'center', position: 'relative' }}>
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
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid #4F46E5', margin: '0 auto 10px', objectFit: 'cover' }}
              />
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px', color: '#1E1B4B' }}>{activeCardStudent.name}</h4>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '4px 12px', marginBottom: '1rem' }}>{activeCardStudent.stageName}</span>

              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem', textAlign: 'right', fontSize: '0.82rem' }}>
                <div className="flex-between" style={{ marginBottom: '4px' }}><span style={{ color: '#64748B' }}>كود الطالب:</span><strong style={{ fontFamily: 'monospace', color: '#4F46E5' }}>{activeCardStudent.code}</strong></div>
                <div className="flex-between" style={{ marginBottom: '4px' }}><span style={{ color: '#64748B' }}>هاتف الطالب:</span><strong>{activeCardStudent.phone}</strong></div>
                <div className="flex-between"><span style={{ color: '#64748B' }}>طوارئ ولي الأمر:</span><strong>{activeCardStudent.parentPhone}</strong></div>
              </div>

              <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <QrCode size={64} color="#1E1B4B" />
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>ملف متابعة الطالب: {activeProfileStudent.name}</h3>
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
    </div>
  );
}
