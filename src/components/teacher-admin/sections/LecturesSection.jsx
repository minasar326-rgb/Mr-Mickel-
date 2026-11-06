import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Upload, Film, Plus, Trash2, Edit, Eye, CheckCircle2, 
  AlertCircle, Cloud, HelpCircle, FileText, Check, ChevronDown,
  Layers, Search, Filter, ArrowUpDown, X, Sparkles
} from 'lucide-react';
import { uploadFileToR2 } from '../../../services/r2Storage';
import { saveMediaFilePermanently, updateMediaCloudUrl } from '../../../services/persistentStorage';
import { validateUploadedFile } from '../../../services/securityValidator';

export default function LecturesSection({ onNavigate }) {
  const { 
    stages = [], 
    sections = [], 
    lectures = [], 
    examsData = {},
    uploadNewLecture, 
    updateLecture, 
    deleteLecture, 
    moveLectureToSection, 
    addToast 
  } = useTeacher();

  const { activeStageId, setActiveStageId, searchQuery } = useAdminUI();

  // -------------------------------------------------------------
  // Form State: Lecture Details
  // -------------------------------------------------------------
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState(activeStageId !== 'all' ? activeStageId : (stages[0]?.id || 'sec-3'));
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [unitNumber, setUnitNumber] = useState('Unit 1');
  const [duration, setDuration] = useState('1:30:00');
  const [isFreeLecture, setIsFreeLecture] = useState(false);
  const [lecturePrice, setLecturePrice] = useState('70 ج.م');
  
  // Video Management
  const [videoMode, setVideoMode] = useState('file'); // 'file' or 'url'
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [videoFileSize, setVideoFileSize] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [localMediaKey, setLocalMediaKey] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDetails, setUploadDetails] = useState({
    percent: 0,
    transferredMB: '0',
    totalMB: '0',
    isCloudReady: false,
    cloudNotice: false
  });

  // Thumbnail
  const [thumbnailPreview, setThumbnailPreview] = useState('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80');

  // PDF Booklet
  const [pdfTitle, setPdfTitle] = useState('مذكرة The Master الشاملة.pdf');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState('');

  // Inline Exam Studio State
  const [hasLectureExam, setHasLectureExam] = useState(false);
  const [bldExamTitle, setBldExamTitle] = useState('');
  const [bldExamDuration, setBldExamDuration] = useState(25);
  const [bldExamPassMarks, setBldExamPassMarks] = useState(10);
  const [bldExamTotalMarks, setBldExamTotalMarks] = useState(20);
  const [bldExamMaxAttempts, setBldExamMaxAttempts] = useState(2);
  const [bldExamShowResult, setBldExamShowResult] = useState(true);
  const [bldExamShowCorrectAnswers, setBldExamShowCorrectAnswers] = useState(true);
  const [bldExamIsDraft, setBldExamIsDraft] = useState(false);
  const [bldExamQuestions, setBldExamQuestions] = useState([]);
  const [isPreviewExamOpen, setIsPreviewExamOpen] = useState(false);

  // Filter & Bulk State
  const [lectureFilterSection, setLectureFilterSection] = useState('all');
  const [selectedLectureIds, setSelectedLectureIds] = useState([]);
  const [batchTargetSection, setBatchTargetSection] = useState('');

  const videoFileInputRef = useRef(null);
  const pdfFileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const formTopRef = useRef(null);

  // Sync selectedStageId when activeStageId changes from sticky header
  useEffect(() => {
    if (activeStageId && activeStageId !== 'all') {
      setSelectedStageId(activeStageId);
    }
  }, [activeStageId]);

  // -------------------------------------------------------------
  // Filter Sections for chosen stage
  // -------------------------------------------------------------
  const stageSections = useMemo(() => {
    return sections.filter(s => s.stageId === selectedStageId);
  }, [sections, selectedStageId]);

  // -------------------------------------------------------------
  // Filtered Lectures List
  // -------------------------------------------------------------
  const filteredLectures = useMemo(() => {
    return (lectures || [])
      .filter(l => !l.isDeleted)
      .filter(l => {
        if (activeStageId !== 'all' && l.stageId !== activeStageId) return false;
        if (lectureFilterSection !== 'all' && l.sectionId !== lectureFilterSection) return false;
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (l.title || '').toLowerCase().includes(q);
          const matchUnit = (l.unitNumber || '').toLowerCase().includes(q);
          return matchTitle || matchUnit;
        }
        return true;
      });
  }, [lectures, activeStageId, lectureFilterSection, searchQuery]);

  // -------------------------------------------------------------
  // Video File Upload Handler
  // -------------------------------------------------------------
  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = await validateUploadedFile(file, 'video');
    if (!validation.valid) {
      addToast(validation.error || 'تم رفض ملف الفيديو لأسباب أمنية', 'error');
      return;
    }

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
      cloudNotice: false
    });

    // 1. Immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    // Read duration
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

    // 2. Permanent Local IndexedDB Cache (enables instant publishing!)
    const mediaKey = `media_video_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    setLocalMediaKey(mediaKey);
    try {
      await saveMediaFilePermanently(mediaKey, file, { name: file.name });
      setVideoUrl(mediaKey); // Allows instant publishing without blocking
      addToast('💾 تم حفظ الفيديو محلياً بنجاح، يمكنك الضغط على نشر المحاضرة فوراً!', 'success', 4000);
    } catch (err) {
      console.warn('Local permanent store notice:', err);
    }

    // 3. High-Speed Upload to Cloudflare R2
    const r2Folder = selectedStageId ? `stages/${selectedStageId}/lectures/videos` : 'lectures/videos';
    uploadFileToR2(file, r2Folder, (prog) => {
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
        setUploadDetails(prev => ({ ...prev, percent: 100, isCloudReady: true, cloudNotice: false }));
        await updateMediaCloudUrl(mediaKey, res.downloadUrl);
        addToast('✅ تم اكتمال رفع الفيديو سحابياً على Cloudflare R2 بنجاح!', 'success', 5000);
      }
    }).catch((r2Err) => {
      console.warn('R2 upload notice:', r2Err);
      setIsUploading(false);
      // Still ready via IndexedDB localMediaKey
      setUploadDetails(prev => ({ ...prev, isCloudReady: false, cloudNotice: true }));
    });
  };

  // -------------------------------------------------------------
  // PDF Upload Handler
  // -------------------------------------------------------------
  const handlePdfFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPdfFile(file);
    setPdfTitle(file.name);
    addToast(`تم تجهيز مذكرة "${file.name}" للرفع 📄`, 'info');

    try {
      const res = await uploadFileToR2(file, 'booklets', null, 'pdf');
      if (res && res.downloadUrl) {
        setPdfDownloadUrl(res.downloadUrl);
        addToast('✅ تم رفع مذكرة المحاضرة سحابياً بنجاح!', 'success');
      }
    } catch (err) {
      console.warn('PDF upload warning:', err);
    }
  };

  // -------------------------------------------------------------
  // Thumbnail File Change
  // -------------------------------------------------------------
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailPreview(event.target.result);
      addToast('تم تحديث غلاف المحاضرة 🖼️', 'success');
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // Exam Questions Modifiers
  // -------------------------------------------------------------
  const handleAddQuestion = (type) => {
    const newQ = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      questionText: '',
      points: 1,
      options: type === 'tf' 
        ? ['صحيح (True)', 'خطأ (False)']
        : (type === 'essay' || type === 'short_answer') ? [] : ['', '', '', ''],
      correctAnswer: type === 'tf' ? 'صحيح (True)' : (type === 'essay' || type === 'short_answer') ? '' : 0,
      explanation: ''
    };
    setBldExamQuestions(prev => [...prev, newQ]);
  };

  const handleUpdateQuestion = (qId, field, value) => {
    setBldExamQuestions(prev => prev.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const handleDeleteQuestion = (qId) => {
    setBldExamQuestions(prev => prev.filter(q => q.id !== qId));
  };

  // -------------------------------------------------------------
  // Edit Lecture Handler
  // -------------------------------------------------------------
  const handleStartEditLecture = (lec) => {
    setEditingLectureId(lec.id);
    setSelectedStageId(lec.stageId || stages[0]?.id || 'sec-3');
    setSelectedSectionId(lec.sectionId || '');
    setTitle(lec.title || '');
    setSubtitle(lec.subtitle || '');
    setUnitNumber(lec.unitNumber || 'Unit 1');
    setDuration(lec.duration || '1:30:00');
    setIsFreeLecture(Boolean(lec.isFree));
    setLecturePrice(lec.price || '70 ج.م');
    setVideoUrl(lec.videoUrl || '');
    setVideoPreviewUrl(lec.videoUrl || '');
    setThumbnailPreview(lec.thumbnail || '');
    setLocalMediaKey(lec.localMediaKey || null);

    if (lec.pdfBooklet) {
      setPdfTitle(lec.pdfBooklet.title || 'مذكرة The Master الشاملة.pdf');
      setPdfDownloadUrl(lec.pdfBooklet.url || lec.pdfBooklet.downloadUrl || '');
    }

    const ex = lec.exam || examsData[lec.id];
    if (ex) {
      setHasLectureExam(true);
      setBldExamTitle(ex.title || '');
      setBldExamDuration(ex.timeMinutes || 25);
      setBldExamPassMarks(ex.passingMarks || 10);
      setBldExamTotalMarks(ex.totalMarks || 20);
      setBldExamMaxAttempts(ex.maxAttempts || 2);
      setBldExamShowResult(ex.showResult !== false);
      setBldExamShowCorrectAnswers(ex.showCorrectAnswers !== false);
      setBldExamIsDraft(ex.status === 'draft');
      setBldExamQuestions(ex.questions || []);
    } else {
      setHasLectureExam(false);
      setBldExamQuestions([]);
    }

    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    addToast(`تم تحميل بيانات محاضرة "${lec.title}" للتعديل ✏️`, 'info');
  };

  const handleCancelEdit = () => {
    setEditingLectureId(null);
    setTitle('');
    setSubtitle('');
    setSelectedSectionId('');
    setVideoUrl('');
    setVideoPreviewUrl('');
    setVideoFileName('');
    setLocalMediaKey(null);
    setPdfDownloadUrl('');
    setHasLectureExam(false);
    setBldExamQuestions([]);
    addToast('تم إلغاء التعديل والعودة للوضع الطبيعي', 'info');
  };

  // -------------------------------------------------------------
  // Submit Publish Lecture
  // -------------------------------------------------------------
  const handleSubmitLecture = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (isSubmitting) return;

    if (!title || !title.trim()) {
      addToast('⚠️ يرجى كتابة عنوان المحاضرة لنشرها للطلاب', 'error', 4000);
      return;
    }

    setIsSubmitting(true);

    const targetStage = stages.find(s => s.id === selectedStageId) || stages[0];
    const cleanVideoUrl = videoUrl || localMediaKey || '';

    // Build Exam Payload
    let examPayload = null;
    if (hasLectureExam) {
      if (bldExamQuestions.length === 0) {
        addToast('يرجى إضافة سؤال واحد على الأقل داخل امتحان المحاضرة', 'error');
        return;
      }

      // Rule: Objective questions first, subjective questions second
      const objectiveQuestions = bldExamQuestions.filter(q => q.type === 'mcq' || q.type === 'multi' || q.type === 'tf');
      const subjectiveQuestions = bldExamQuestions.filter(q => q.type === 'essay' || q.type === 'short_answer');
      const orderedQuestions = [...objectiveQuestions, ...subjectiveQuestions];
      const calculatedTotal = orderedQuestions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);

      examPayload = {
        id: editingLectureId ? (lectures.find(l => l.id === editingLectureId)?.exam?.id || `exam-${editingLectureId}`) : `exam-${Date.now()}`,
        lectureId: editingLectureId || null,
        title: (bldExamTitle || `امتحان: ${title}`).trim(),
        timeMinutes: Number(bldExamDuration) || 25,
        totalMarks: Number(bldExamTotalMarks) || calculatedTotal,
        passingMarks: Number(bldExamPassMarks) || Math.ceil((Number(bldExamTotalMarks) || calculatedTotal) * 0.5),
        maxAttempts: Number(bldExamMaxAttempts) || 2,
        showResult: bldExamShowResult,
        showCorrectAnswers: bldExamShowCorrectAnswers,
        status: bldExamIsDraft ? 'draft' : 'published',
        questions: orderedQuestions,
        createdAt: new Date().toISOString(),
        hasManualQuestions: subjectiveQuestions.length > 0
      };
    }

    const lecturePayload = {
      stageId: targetStage?.id || selectedStageId,
      stageName: targetStage?.name || 'المرحلة الدراسية',
      sectionId: selectedSectionId || '',
      unitNumber,
      title: title.trim(),
      subtitle: subtitle.trim() || 'شرح تفصيلي ومكثف للوحدة وحل أسئلة الامتحانات.',
      duration: duration || '1:30:00',
      videoUrl: cleanVideoUrl,
      videoStatus: cleanVideoUrl ? 'ready' : (isUploading ? 'uploading' : 'none'),
      localMediaKey,
      videoFileName: videoFileName || 'lecture_video.mp4',
      videoFileSize: videoFileSize || '',
      thumbnail: thumbnailPreview,
      isFree: Boolean(isFreeLecture),
      price: isFreeLecture ? 'مجاناً' : (lecturePrice || '70 ج.م'),
      isLocked: !isFreeLecture,
      homeworkRequired: true,
      examRequired: Boolean(hasLectureExam),
      exam: examPayload,
      pdfBooklet: {
        title: pdfTitle,
        size: pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(1)} MB` : '5.2 MB',
        pages: 30,
        url: pdfDownloadUrl || '',
        downloadUrl: pdfDownloadUrl || ''
      }
    };

    try {
      if (editingLectureId) {
        await updateLecture(editingLectureId, lecturePayload);
        addToast('✅ تم حفظ وتحديث بيانات المحاضرة بنجاح!', 'success');
        setEditingLectureId(null);
      } else {
        await uploadNewLecture(lecturePayload);
        addToast('🎉 تم نشر المحاضرة وتثبيتها بنجاح لجميع طلاب المرحلة!', 'success');
      }

      // Reset Form
      setTitle('');
      setSubtitle('');
      setSelectedSectionId('');
      setVideoUrl('');
      setVideoPreviewUrl('');
      setVideoFileName('');
      setVideoFileSize('');
      setLocalMediaKey(null);
      setPdfDownloadUrl('');
      setHasLectureExam(false);
      setBldExamQuestions([]);
      setUploadProgress(0);
    } catch (err) {
      console.error('Failed to save lecture:', err);
      addToast(`❌ تعذر حفظ المحاضرة: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Bulk Actions
  // -------------------------------------------------------------
  const handleToggleSelectAll = () => {
    if (selectedLectureIds.length === filteredLectures.length) {
      setSelectedLectureIds([]);
    } else {
      setSelectedLectureIds(filteredLectures.map(l => l.id));
    }
  };

  const handleToggleLectureSelect = (lecId) => {
    setSelectedLectureIds(prev => 
      prev.includes(lecId) ? prev.filter(id => id !== lecId) : [...prev, lecId]
    );
  };

  const handleBatchMove = async () => {
    if (!batchTargetSection) {
      addToast('يرجى اختيار الشهر أو الكورس المستهدف للنقل', 'error');
      return;
    }
    for (const id of selectedLectureIds) {
      await moveLectureToSection(id, batchTargetSection);
    }
    addToast(`تم نقل ${selectedLectureIds.length} محاضرات إلى القسم الجديد بنجاح 🚚`, 'success');
    setSelectedLectureIds([]);
    setBatchTargetSection('');
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedLectureIds.length} محاضرات محددة؟`)) return;
    for (const id of selectedLectureIds) {
      await deleteLecture(id, true);
    }
    addToast(`تم حذف ${selectedLectureIds.length} محاضرات 🗑️`, 'info');
    setSelectedLectureIds([]);
  };

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ========================================================= */}
      {/* 1. LECTURE UPLOAD & EDIT STUDIO */}
      {/* ========================================================= */}
      <div 
        ref={formTopRef}
        className="admin-card" 
        style={{ 
          padding: '2rem', 
          border: editingLectureId ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)',
          background: 'var(--admin-bg-surface)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Film size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                {editingLectureId ? 'تعديل المحاضرة والامتحان ✏️' : 'استوديو رفع ونشر محاضرة جديدة 🎬'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                ارفع الفيديو، أضف مذكرة PDF، وأنشئ امتحاناً تقييمياً للطلاب
              </p>
            </div>
          </div>

          {editingLectureId && (
            <button 
              type="button"
              onClick={handleCancelEdit}
              className="admin-btn admin-btn-ghost"
              style={{ fontSize: '0.85rem' }}
            >
              إلغاء التعديل ✖
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitLecture} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Stage & Section Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                المرحلة الدراسية:
              </label>
              <select
                value={selectedStageId}
                onChange={e => {
                  setSelectedStageId(e.target.value);
                  setSelectedSectionId('');
                }}
                className="admin-input"
                style={{ width: '100%' }}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                الشهر أو الكورس (القسم):
              </label>
              <select
                value={selectedSectionId}
                onChange={e => setSelectedSectionId(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value="">(محاضرة عامة - بدون شهر)</option>
                {stageSections.map(s => (
                  <option key={s.id} value={s.id}>{s.type === 'course' ? '📁 كورس: ' : '📅 شهر: '}{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                رقم الوحدة (Unit):
              </label>
              <input
                type="text"
                placeholder="مثال: Unit 1"
                value={unitNumber}
                onChange={e => setUnitNumber(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                مدة المحاضرة:
              </label>
              <input
                type="text"
                placeholder="مثال: 1:30:00"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                عنوان المحاضرة الرئيسي:
              </label>
              <input
                type="text"
                placeholder="مثال: Past Simple vs Present Perfect + حل أسئلة التميز"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="admin-input"
                style={{ width: '100%', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                الوصف ونقاط المحاضرة:
              </label>
              <input
                type="text"
                placeholder="وصف مختصر لمحتوى المحاضرة وما سيتعلمه الطالب"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Video Upload & Mode Selection */}
          <div style={{ background: 'var(--admin-bg-subtle)', padding: '1.25rem', borderRadius: 'var(--admin-radius-lg)', border: '1px solid var(--admin-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Film size={18} color="var(--admin-primary)" />
                <span>فيديو المحاضرة التعليمي:</span>
              </label>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setVideoMode('file')}
                  className={`admin-btn admin-btn-sm ${videoMode === 'file' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                >
                  رفع ملف فيديو من جهازي (MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('url')}
                  className={`admin-btn admin-btn-sm ${videoMode === 'url' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                >
                  رابط فيديو خارجي (YouTube / Direct)
                </button>
              </div>
            </div>

            {videoMode === 'file' ? (
              <div>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*,.mp4,.mkv,.webm"
                  style={{ display: 'none' }}
                  onChange={handleVideoFileChange}
                />
                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="admin-btn admin-btn-secondary"
                  style={{ width: '100%', padding: '1.5rem', border: '2px dashed var(--admin-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={28} />
                  <span style={{ fontWeight: 800 }}>اضغط لاختيار ملف الفيديو من جهازك</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>يدعم ملفات MP4 و MKV بحجم غير محدود مع رفع سحابي مباشر وسريع</span>
                </button>

                {videoFileName && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="admin-badge admin-badge-primary">🎬 {videoFileName} ({videoFileSize})</span>
                      {uploadDetails.isCloudReady ? (
                        <span className="admin-badge admin-badge-success">✅ سحابي نشط (Cloudflare R2)</span>
                      ) : localMediaKey ? (
                        <span className="admin-badge admin-badge-warning">⚡ محفوظ محلياً بجهازك (جاهز للنشر فوراً!)</span>
                      ) : null}
                    </div>

                    {isUploading && (
                      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span>جاري الرفع السحابي...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--admin-border)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--admin-primary)', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="ضع رابط الفيديو هنا (https://...)"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              />
            )}
          </div>

          {/* Pricing & Free Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="isFreeLecture"
                checked={isFreeLecture}
                onChange={e => setIsFreeLecture(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="isFreeLecture" style={{ fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', color: 'var(--admin-text)' }}>
                محاضرة تجريبية مجانية (مفتوحة لجميع الطلاب) 🎁
              </label>
            </div>

            {!isFreeLecture && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  سعر المحاضرة المنفردة:
                </label>
                <input
                  type="text"
                  placeholder="مثال: 70 ج.م"
                  value={lecturePrice}
                  onChange={e => setLecturePrice(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* PDF Booklet & Thumbnail */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                مذكرة الشرح (PDF):
              </label>
              <input
                ref={pdfFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={handlePdfFileChange}
              />
              <button
                type="button"
                onClick={() => pdfFileInputRef.current?.click()}
                className="admin-btn admin-btn-secondary"
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
              >
                <FileText size={18} />
                <span>{pdfTitle ? `📄 ${pdfTitle}` : 'اختر ملف PDF من جهازك'}</span>
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                صورة الغلاف (Thumbnail):
              </label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleThumbnailChange}
              />
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <img src={thumbnailPreview} alt="Thumbnail" style={{ width: '60px', height: '42px', borderRadius: '6px', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="admin-btn admin-btn-ghost"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                >
                  تغيير صورة الغلاف 🖼️
                </button>
              </div>
            </div>
          </div>

          {/* Inline Exam Studio Toggle */}
          <div style={{ border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-lg)', padding: '1.25rem', background: 'var(--admin-bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="hasLectureExam"
                  checked={hasLectureExam}
                  onChange={e => setHasLectureExam(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="hasLectureExam" style={{ fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', color: 'var(--admin-text)' }}>
                  تفعيل امتحان إلكتروني خاص بهذه المحاضرة 📝
                </label>
              </div>

              {hasLectureExam && (
                <span className="admin-badge admin-badge-primary">
                  {bldExamQuestions.length} أسئلة مضافة
                </span>
              )}
            </div>

            {hasLectureExam && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
                
                {/* 5-Metric Exam Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>مدة الامتحان (بالدقائق):</label>
                    <input
                      type="number"
                      value={bldExamDuration}
                      onChange={e => setBldExamDuration(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>الدرجة الكلية:</label>
                    <input
                      type="number"
                      value={bldExamTotalMarks}
                      onChange={e => setBldExamTotalMarks(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>درجة النجاح:</label>
                    <input
                      type="number"
                      value={bldExamPassMarks}
                      onChange={e => setBldExamPassMarks(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>أقصى محاولات:</label>
                    <input
                      type="number"
                      value={bldExamMaxAttempts}
                      onChange={e => setBldExamMaxAttempts(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-muted)' }}>عرض النتيجة فوراً:</label>
                    <select
                      value={bldExamShowResult ? 'yes' : 'no'}
                      onChange={e => setBldExamShowResult(e.target.value === 'yes')}
                      className="admin-input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="yes">نعم، عرض النتيجة</option>
                      <option value="no">إخفاء حتى اعتماد المستر</option>
                    </select>
                  </div>
                </div>

                {/* Questions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bldExamQuestions.map((q, idx) => (
                    <div 
                      key={q.id}
                      style={{ 
                        background: 'var(--admin-bg-subtle)', 
                        border: '1px solid var(--admin-border)', 
                        borderRadius: 'var(--admin-radius-md)', 
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--admin-text)' }}>
                          سؤال {idx + 1} ({q.type === 'mcq' ? 'اختيار من متعدد' : q.type === 'tf' ? 'صح أو خطأ' : q.type === 'essay' ? 'سؤال مقالي' : 'إجابة قصيرة'})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="نص السؤال..."
                        value={q.questionText}
                        onChange={e => handleUpdateQuestion(q.id, 'questionText', e.target.value)}
                        className="admin-input"
                        style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700 }}
                      />

                      {/* MCQ Options */}
                      {q.type === 'mcq' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctAnswer === oIdx}
                                onChange={() => handleUpdateQuestion(q.id, 'correctAnswer', oIdx)}
                                title="تحديد كإجابة صحيحة"
                              />
                              <input
                                type="text"
                                placeholder={`اختيار ${oIdx + 1}`}
                                value={opt}
                                onChange={e => {
                                  const newOpts = [...q.options];
                                  newOpts[oIdx] = e.target.value;
                                  handleUpdateQuestion(q.id, 'options', newOpts);
                                }}
                                className="admin-input"
                                style={{ width: '100%', fontSize: '0.82rem' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Questions Toolbar at Bottom */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px dashed var(--admin-border)' }}>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('mcq')}
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                  >
                    <Plus size={14} /> <span>+ اختيار من متعدد (MCQ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('tf')}
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                  >
                    <Plus size={14} /> <span>+ صح أو خطأ (True/False)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('essay')}
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                  >
                    <Plus size={14} /> <span>+ سؤال مقالي (تصحيح يدوي)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion('short_answer')}
                    className="admin-btn admin-btn-sm admin-btn-secondary"
                  >
                    <Plus size={14} /> <span>+ إجابة قصيرة</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Action Submit Button */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem' }}>
            <button
              id="publish-lecture-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="admin-btn admin-btn-primary admin-btn-lg"
              style={{ flex: 1, padding: '1rem', fontSize: '1.05rem', fontWeight: 900, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'wait' : 'pointer' }}
            >
              <Upload size={20} />
              <span>
                {isSubmitting
                  ? '⏳ جاري نشر وتثبيت المحاضرة...'
                  : (editingLectureId 
                    ? '💾 حفظ وتثبيت تعديلات المحاضرة والامتحان' 
                    : (hasLectureExam ? '🚀 نشر المحاضرة والامتحان الآن لجميع الطلاب' : '🚀 نشر المحاضرة والفيديو الآن لجميع الطلاب'))}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================= */}
      {/* 2. PUBLISHED LECTURES DIRECTORY & MANAGEMENT */}
      {/* ========================================================= */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        
        {/* Header & Section Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
              المحاضرات المنشورة ({filteredLectures.length})
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
              {activeStageId !== 'all' ? `معروض لمرحلة: ${stages.find(s => s.id === activeStageId)?.name || activeStageId}` : 'معروض لجميع المراحل'}
            </p>
          </div>

          {/* Filter by Month / Section */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={16} color="var(--admin-text-muted)" />
            <select
              value={lectureFilterSection}
              onChange={e => setLectureFilterSection(e.target.value)}
              className="admin-input"
              style={{ fontSize: '0.85rem', padding: '6px 12px' }}
            >
              <option value="all">جميع الشهور والكورسات</option>
              {sections
                .filter(s => activeStageId === 'all' || s.stageId === activeStageId)
                .map(s => (
                  <option key={s.id} value={s.id}>{s.type === 'course' ? '📁 كورس: ' : '📅 شهر: '}{s.title}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedLectureIds.length > 0 && (
          <div style={{ 
            background: 'var(--admin-primary)', 
            color: 'white', 
            padding: '10px 16px', 
            borderRadius: 'var(--admin-radius-md)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
              تم تحديد {selectedLectureIds.length} محاضرات
            </span>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={batchTargetSection}
                onChange={e => setBatchTargetSection(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <option value="">نقل إلى شهر...</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBatchMove}
                className="admin-btn admin-btn-sm"
                style={{ background: 'white', color: 'var(--admin-primary)' }}
              >
                نقل المحددة
              </button>

              <button
                type="button"
                onClick={handleBatchDelete}
                className="admin-btn admin-btn-sm"
                style={{ background: '#EF4444', color: 'white' }}
              >
                حذف المحددة
              </button>
            </div>
          </div>
        )}

        {/* Select All Toggle */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={filteredLectures.length > 0 && selectedLectureIds.length === filteredLectures.length}
            onChange={handleToggleSelectAll}
            id="selectAllLectures"
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="selectAllLectures" style={{ fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', color: 'var(--admin-text-muted)' }}>
            تحديد كل المحاضرات المعروضة
          </label>
        </div>

        {/* Lecture Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLectures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
              <Film size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, margin: 0 }}>لا توجد محاضرات منشورة تطابق الفلتر الحالي</p>
            </div>
          ) : (
            filteredLectures.map(lec => {
              const sec = sections.find(s => s.id === lec.sectionId);
              const stage = stages.find(s => s.id === lec.stageId);
              const hasVideo = Boolean(lec.videoUrl || lec.localMediaKey);
              const isCloudVideo = lec.videoUrl && (lec.videoUrl.startsWith('https://') || lec.videoUrl.startsWith('http://'));
              const isSelected = selectedLectureIds.includes(lec.id);

              return (
                <div
                  key={lec.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: isSelected ? 'var(--admin-border-subtle)' : 'var(--admin-bg-subtle)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-lg)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleLectureSelect(lec.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <img 
                      src={lec.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80'} 
                      alt={lec.title} 
                      style={{ width: '70px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} 
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span className="admin-badge admin-badge-primary">{lec.unitNumber || 'الوحدة'}</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)' }}>{lec.title}</strong>
                        
                        {sec ? (
                          <span className={sec.type === 'course' ? 'admin-badge admin-badge-gold' : 'admin-badge admin-badge-success'}>
                            {sec.type === 'course' ? '📁 ' : '📅 '}{sec.title}
                          </span>
                        ) : (
                          <span className="admin-badge" style={{ background: '#E2E8F0', color: '#475569' }}>محاضرة عامة</span>
                        )}

                        {isCloudVideo ? (
                          <span className="admin-badge admin-badge-success">🟢 فيديو سحابي R2</span>
                        ) : lec.localMediaKey ? (
                          <span className="admin-badge admin-badge-warning">💾 فيديو محلي متاح</span>
                        ) : (
                          <span className="admin-badge" style={{ background: '#FEF2F2', color: '#DC2626' }}>⚠️ يحتاج فيديو</span>
                        )}

                        {lec.exam && (
                          <span className="admin-badge admin-badge-accent">📝 امتحان مدمج</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                        <span>المرحلة: {stage?.name || lec.stageId}</span>
                        <span>•</span>
                        <span>⏱️ {lec.duration}</span>
                        <span>•</span>
                        <span>{lec.isFree ? '🎁 مجانية' : `💰 ${lec.price}`}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleStartEditLecture(lec)}
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                    >
                      <Edit size={14} /> <span>تعديل ✏️</span>
                    </button>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('lecture-room', { lectureId: lec.id })}
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                      >
                        <Eye size={14} /> <span>معاينة كطالب</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف محاضرة "${lec.title}" نهائياً؟`)) {
                          deleteLecture(lec.id, true);
                        }
                      }}
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} /> <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
