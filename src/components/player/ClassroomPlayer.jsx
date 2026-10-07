import React, { useState, useRef, useEffect } from 'react';
import { useCourses } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { flashcardsData } from '../../data/flashcardsData';
import QuizRunner from './QuizRunner';
import CertificateModal from '../common/CertificateModal';
import { 
  Play, Pause, RotateCcw, FastForward, Volume2, VolumeX, Maximize, 
  CheckCircle2, ArrowRight, ArrowLeft, Bot, Sparkles, Terminal, FileText, 
  MessageSquare, Download, Award, ChevronDown, ChevronUp, Clock, HelpCircle, 
  Code2, Send, Trash2, ShieldCheck, Sun, Moon, CornerDownLeft, Zap
} from 'lucide-react';

export default function ClassroomPlayer({ courseId, onNavigate }) {
  const { courses, getCourseProgress, markLessonComplete, savedNotes, addNote, deleteNote, claimCertificate } = useCourses();
  const { currentUser, role } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { addToast } = useToast();

  const course = courses.find(c => c.id === courseId) || courses[0];
  const progress = getCourseProgress(course.id);

  // Flatten lessons to navigate easily
  const allLessons = course.modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })));
  
  const [activeLessonId, setActiveLessonId] = useState(() => {
    // Pick first non-completed lesson or lesson 0
    const nonCompleted = allLessons.find(l => !progress.completedLessons.includes(l.id));
    return nonCompleted ? nonCompleted.id : allLessons[0]?.id;
  });

  const activeLesson = allLessons.find(l => l.id === activeLessonId) || allLessons[0];
  const activeLessonIndex = allLessons.findIndex(l => l.id === activeLessonId);

  // Player States
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'sandbox' | 'notes' | 'flashcards' | 'qa' | 'resources'
  
  // AI Assistant states
  const [aiChat, setAiChat] = useState([
    {
      role: 'ai',
      text: `مرحباً ${currentUser?.name ? currentUser.name.split(' ')[0] : 'صديقي'}! أنا مساعدك الذكي في درس "${activeLesson.title}". اسألني أي سؤال تريده أو اطلب ملخصاً سريعاً! 🤖`
    }
  ]);
  const [aiInput, setAiInput] = useState('');

  // Code Sandbox states
  const [sandboxCode, setSandboxCode] = useState(
    activeLesson.codeChallenge?.initialCode || 
    `// كود تجريبي تفاعلي لدرس: ${activeLesson.title}\nfunction processLessonData() {\n  const keyConcept = "Server Components in React 19";\n  const isEfficient = true;\n  return { keyConcept, isEfficient, score: 100 };\n}\n\nconsole.log(processLessonData());`
  );
  const [sandboxOutput, setSandboxOutput] = useState('');

  // Notes state
  const [newNoteText, setNewNoteText] = useState('');

  // Flashcards state
  const flashcards = flashcardsData[course.id] || flashcardsData['fullstack-react-nextjs'] || [];
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Quiz Runner Modal
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeQuizData, setActiveQuizData] = useState(null);

  // Certificate Modal
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [generatedCert, setGeneratedCert] = useState(null);

  // Collapsed modules state in sidebar
  const [expandedModules, setExpandedModules] = useState({ 'mod-1': true, 'mod-2': true, 'mod-3': true });

  const toggleModuleExpand = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Video Time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCompleteCurrentLesson = () => {
    markLessonComplete(course.id, activeLesson.id);
    
    // Move to next lesson if available
    if (activeLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[activeLessonIndex + 1];
      setActiveLessonId(nextLesson.id);
    }
  };

  const handleSelectLesson = (lesson) => {
    setActiveLessonId(lesson.id);
    setIsPlaying(false);
    if (lesson.type === 'quiz' && lesson.quizData) {
      setActiveQuizData(lesson.quizData);
      setIsQuizModalOpen(true);
    }
  };

  const handleAddCurrentNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const timestampStr = formatTime(currentTime);
    addNote(course.id, activeLesson.id, activeLesson.title, timestampStr, newNoteText);
    setNewNoteText('');
  };

  const handleAiSend = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const q = aiInput;
    setAiInput('');
    setAiChat(prev => [...prev, { role: 'user', text: q }]);

    setTimeout(() => {
      let ans = `إجابة على سؤالك حول "${activeLesson.title}": الفكرة المحورية هي تطبيق أفضل الممارسات البرمجية وتجنب العمليات غير المتزامنة غير المعالجة.`;
      if (q.includes('لخص') || q.includes('ملخص')) {
        ans = `📌 **ملخص درس "${activeLesson.title}" في 3 نقاط:**\n1. فهم البنية الهيكلية وكيفية تدفق البيانات.\n2. تحسين الأداء وتجنب إعادة التصيير (Re-renders) غير الضرورية.\n3. تطبيق المعايير الأمنية وحماية المدخلات.`;
      } else if (q.includes('كود') || q.includes('خطأ')) {
        ans = `💡 لتفادي الأخطاء في هذا الكود: تأكد دائماً من تمرير الـ Dependencies الصحيحة في المصفوفة، واستخدام Try/Catch للتعامل مع الـ Promises.`;
      }
      setAiChat(prev => [...prev, { role: 'ai', text: ans }]);
    }, 500);
  };

  const handleRunSandbox = () => {
    try {
      let logs = [];
      const customConsole = { log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')) };
      // eslint-disable-next-line no-new-func
      const fn = new Function('console', sandboxCode);
      fn(customConsole);
      setSandboxOutput(logs.join('\n') || 'تم تنفيذ الكود بنجاح!');
      addToast('تم تنفيذ الكود بنجاح ⚡', 'success');
    } catch (err) {
      setSandboxOutput(`Error: ${err.message}`);
    }
  };

  const handleClaimCert = () => {
    const cert = claimCertificate(course.id);
    if (cert) {
      setGeneratedCert(cert);
      setIsCertModalOpen(true);
    }
  };

  const currentLessonNotes = savedNotes.filter(n => n.courseId === course.id && n.lessonId === activeLesson.id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Top Classroom Navigation Header */}
      <header className="glass" style={{
        padding: '0.6rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px'
      }}>
        {/* Right: Back button & Course info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <ArrowRight size={16} />
            <span>لوحة تحكمي</span>
          </button>

          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {course.title}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              الدرس الحالي: {activeLesson.title}
            </span>
          </div>
        </div>

        {/* Center: Progress Bar & Certificate CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-600)' }}>
              {progress.percentage}% مكتمل
            </span>
            <div style={{
              flex: 1,
              height: '8px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress.percentage}%`,
                height: '100%',
                background: 'var(--primary-gradient)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Certificate Claim Button */}
          <button
            onClick={handleClaimCert}
            disabled={progress.percentage < 100}
            className={`btn btn-sm ${progress.percentage >= 100 ? 'btn-success pulse-glow' : 'btn-secondary'}`}
            style={{
              gap: '6px',
              opacity: progress.percentage >= 100 ? 1 : 0.6,
              cursor: progress.percentage >= 100 ? 'pointer' : 'not-allowed'
            }}
            title={progress.percentage >= 100 ? 'انقر لاستلام شهادتك المعتمدة' : 'أكمل 100% من الدروس للحصول على الشهادة'}
          >
            <Award size={16} color={progress.percentage >= 100 ? '#FFFFFF' : '#F59E0B'} />
            <span>{progress.certificateEarned ? 'عرض الشهادة المعتمدة' : 'استلام الشهادة 🎓'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon-only"
            style={{ borderRadius: '50%' }}
          >
            {isDark ? <Sun size={18} color="#FBBF24" /> : <Moon size={18} color="#6366F1" />}
          </button>
        </div>
      </header>

      {/* Classroom Body Grid (Player & Tabs + Sidebar) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isCinemaMode ? '1fr' : '1fr 340px',
        flex: 1,
        transition: 'grid-template-columns 0.3s ease'
      }}>
        {/* Left Section: Video Player & Tabbed Workspace */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '1.25rem',
          borderLeft: '1px solid var(--border-subtle)'
        }}>
          {/* Custom Video Player Container */}
          <div style={{
            position: 'relative',
            background: '#000000',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            marginBottom: '1rem',
            aspectRatio: '16/9',
            maxHeight: '520px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {activeLesson.type === 'video' ? (
              <>
                <video
                  ref={videoRef}
                  src={(activeLesson.videoUrl && !activeLesson.videoUrl.startsWith('blob:') ? activeLesson.videoUrl : null) || course.promoVideo}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                />

                {/* Floating Big Play Button if paused */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    style={{
                      position: 'absolute',
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'rgba(79, 70, 229, 0.9)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 25px rgba(0,0,0,0.5)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Play size={32} fill="white" style={{ marginLeft: '-3px' }} />
                  </button>
                )}

                {/* Video Control Bar Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 100%)',
                  padding: '1.25rem 1rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  color: 'white',
                  direction: 'ltr'
                }}>
                  {/* Seek Bar */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    style={{
                      width: '100%',
                      accentColor: '#6366F1',
                      cursor: 'pointer',
                      height: '4px'
                    }}
                  />

                  {/* Buttons Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} fill="white" />}
                      </button>

                      <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="رجوع 10 ثوان">
                        <RotateCcw size={16} />
                      </button>

                      <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="تقديم 10 ثوان">
                        <FastForward size={16} />
                      </button>

                      <button onClick={() => { setIsMuted(!isMuted); if (videoRef.current) videoRef.current.muted = !isMuted; }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>

                      <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Playback Speed selector */}
                      {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          style={{
                            background: playbackSpeed === speed ? '#4F46E5' : 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {speed}x
                        </button>
                      ))}

                      {/* Cinema Mode Toggle */}
                      <button
                        onClick={() => setIsCinemaMode(!isCinemaMode)}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        title="وضع السينما العريض"
                      >
                        <Maximize size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : activeLesson.type === 'quiz' ? (
              <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                <HelpCircle size={56} color="#F59E0B" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{activeLesson.title}</h3>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>اختبار تفاعلي لقياس مدى استيعابك للمفاهيم السابقة.</p>
                <button
                  onClick={() => {
                    setActiveQuizData(activeLesson.quizData);
                    setIsQuizModalOpen(true);
                  }}
                  className="btn btn-primary btn-lg"
                >
                  بدء الاختبار التقييمي الآن ✍️
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                <Code2 size={56} color="#10B981" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{activeLesson.title}</h3>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>تحدٍ برمجي عملي يطبق في محرر الكود التفاعلي بالأسفل.</p>
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className="btn btn-success btn-lg"
                >
                  فتح محرر الأكواد والبدء 💻
                </button>
              </div>
            )}
          </div>

          {/* Lesson Action Header Bar */}
          <div className="card" style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            background: 'var(--bg-surface)'
          }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '4px' }}>{activeLesson.moduleTitle}</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{activeLesson.title}</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleCompleteCurrentLesson}
                className={`btn ${progress.completedLessons.includes(activeLesson.id) ? 'btn-secondary' : 'btn-primary'}`}
                style={{ gap: '6px' }}
              >
                <CheckCircle2 size={18} color={progress.completedLessons.includes(activeLesson.id) ? 'var(--success)' : 'currentColor'} />
                <span>{progress.completedLessons.includes(activeLesson.id) ? 'تم إكمال الدرس ✓' : 'تحديد كمكتمل (+25 XP)'}</span>
              </button>

              {activeLessonIndex < allLessons.length - 1 && (
                <button
                  onClick={() => setActiveLessonId(allLessons[activeLessonIndex + 1].id)}
                  className="btn btn-secondary btn-icon-only"
                  title="الدرس التالي"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Lesson Tabs Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-subtle)',
            gap: '1rem',
            marginBottom: '1.25rem',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}>
            {[
              { id: 'ai', label: 'المساعد الذكي (AI Tutor)', icon: Bot },
              { id: 'sandbox', label: 'محرر الكود (Sandbox)', icon: Terminal },
              { id: 'notes', label: `ملاحظاتي (${currentLessonNotes.length})`, icon: FileText },
              { id: 'flashcards', label: 'بطاقات المراجعة', icon: Sparkles },
              { id: 'resources', label: 'المرفقات والملفات', icon: Download }
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
                    padding: '0.65rem 0.5rem',
                    border: 'none',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab.id ? '3px solid var(--primary-600)' : '3px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: AI Assistant (Tutor) */}
          {activeTab === 'ai' && (
            <div className="card animate-fade-in" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '400px', background: 'var(--bg-surface)' }}>
              {/* Quick Prompt Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
                {['لخص لي الدرس في 3 نقاط', 'اشرح لي مفهوم الـ Server Actions', 'ما هي الأخطاء الشائعة في هذا الكود؟'].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAiInput(prompt);
                    }}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✨ {prompt}
                  </button>
                ))}
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {aiChat.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    {m.role === 'ai' && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--primary-gradient)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Bot size={15} />
                      </div>
                    )}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      background: m.role === 'user' ? 'var(--primary-600)' : 'var(--bg-subtle)',
                      color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                      whiteSpace: 'pre-line'
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Chat Input */}
              <form onSubmit={handleAiSend} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="اسأل المساعد الذكي عن هذا الدرس..."
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '0.88rem' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Code Sandbox */}
          {activeTab === 'sandbox' && (
            <div className="card animate-fade-in" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div style={{
                background: '#1E293B',
                padding: '0.6rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} color="#38BDF8" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>sandbox.js (Live Environment)</span>
                </div>
                <button
                  onClick={handleRunSandbox}
                  className="btn btn-success btn-sm"
                  style={{ gap: '6px', padding: '0.35rem 0.85rem' }}
                >
                  <Play size={14} fill="currentColor" />
                  <span>تنفيذ الكود (Run)</span>
                </button>
              </div>

              <textarea
                value={sandboxCode}
                onChange={e => setSandboxCode(e.target.value)}
                style={{
                  width: '100%',
                  height: '240px',
                  background: '#0F172A',
                  color: '#38BDF8',
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '0.85rem',
                  padding: '1rem',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  direction: 'ltr',
                  textAlign: 'left'
                }}
              />

              <div style={{
                background: '#0B0F19',
                borderTop: '1px solid #1E293B',
                padding: '0.75rem 1rem',
                minHeight: '80px',
                color: '#A5F3FC',
                fontFamily: '"Fira Code", monospace',
                fontSize: '0.8rem',
                direction: 'ltr',
                whiteSpace: 'pre-wrap'
              }}>
                <span style={{ color: '#64748B', display: 'block', marginBottom: '4px' }}>// المخرجات (Console Output):</span>
                {sandboxOutput || '> اضغط على زر تنفيذ الكود لعرض النتيجة هنا'}
              </div>
            </div>
          )}

          {/* Tab 3: Notes */}
          {activeTab === 'notes' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Add Note Form */}
              <form onSubmit={handleAddCurrentNote} className="card" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--primary-600)', fontWeight: 700 }}>
                  <Clock size={15} />
                  <span>إضافة ملاحظة عند التوقيت الحالي ({formatTime(currentTime)}):</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="اكتب ملاحظتك البرمجية هنا..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    className="input-control"
                    style={{ fontSize: '0.88rem' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    حفظ
                  </button>
                </div>
              </form>

              {/* Saved Notes for this lesson */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentLessonNotes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '1.5rem' }}>
                    لا توجد ملاحظات مسجلة لهذا الدرس بعد. أضف أول ملاحظة بالأعلى! ✍️
                  </p>
                ) : (
                  currentLessonNotes.map(note => (
                    <div key={note.id} className="card" style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface)' }}>
                      <div className="flex-between" style={{ marginBottom: '4px' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.75rem', gap: '4px' }}>
                          <Clock size={12} />
                          <span>{note.timestamp}</span>
                        </span>
                        <button
                          onClick={() => deleteNote(note.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '2px' }}
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {note.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Flashcards */}
          {activeTab === 'flashcards' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-gold" style={{ marginBottom: '4px' }}>
                  بطاقة {currentCardIdx + 1} من {flashcards.length}
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>انقر على البطاقة لقلبها ومعرفة الإجابة النموذجية</p>
              </div>

              {flashcards[currentCardIdx] && (
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="card card-interactive"
                  style={{
                    width: '100%',
                    maxWidth: '520px',
                    minHeight: '220px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    background: isCardFlipped ? 'var(--primary-gradient)' : 'var(--bg-surface)',
                    color: isCardFlipped ? 'white' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-xl)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                    opacity: isCardFlipped ? 0.9 : 0.6
                  }}>
                    {isCardFlipped ? 'الإجابة والحل:' : 'السؤال والمفهوم:'}
                  </span>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: '1.5', margin: 0 }}>
                    {isCardFlipped ? flashcards[currentCardIdx].answer : flashcards[currentCardIdx].question}
                  </h3>
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  disabled={currentCardIdx === 0}
                  onClick={() => {
                    setIsCardFlipped(false);
                    setCurrentCardIdx(prev => prev - 1);
                  }}
                  className="btn btn-secondary"
                  style={{ opacity: currentCardIdx === 0 ? 0.5 : 1 }}
                >
                  السابق
                </button>
                <button
                  disabled={currentCardIdx === flashcards.length - 1}
                  onClick={() => {
                    setIsCardFlipped(false);
                    setCurrentCardIdx(prev => prev + 1);
                  }}
                  className="btn btn-primary"
                  style={{ opacity: currentCardIdx === flashcards.length - 1 ? 0.5 : 1 }}
                >
                  التالي
                </button>
              </div>
            </div>
          )}

          {/* Tab 5: Resources */}
          {activeTab === 'resources' && (
            <div className="card animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>الملفات والمصادر المرفقة بالدرس</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { name: 'خارطة طريق تطوير الويب 2026 (PDF)', size: '2.4 MB' },
                  { name: 'الملف المصدري للمشروع (GitHub Repository)', size: 'رابط خارجي' },
                  { name: 'ملخص الأوامر والمكتبات المستخدمة (Cheatsheet)', size: '450 KB' }
                ].map((res, i) => (
                  <div key={i} className="flex-between" style={{ padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Download size={18} color="var(--primary-600)" />
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{res.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{res.size}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToast('جاري بدء تحميل الملف المرفق...', 'success')}
                      className="btn btn-secondary btn-sm"
                    >
                      تحميل
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Curriculum Lessons Sidebar */}
        {!isCinemaMode && (
          <aside style={{
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
            padding: '1rem'
          }}>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 4px' }}>منهج المسار</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {progress.completedLessons.length} من أصل {allLessons.length} درس مكتمل
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {course.modules?.map((mod, mIdx) => {
                const isExpanded = expandedModules[mod.id] !== false;

                return (
                  <div key={mod.id} className="card" style={{ overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleModuleExpand(mod.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      <span>الوحدة {mIdx + 1}: {mod.title}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0.25rem 0.5rem' }}>
                        {mod.lessons?.map(lesson => {
                          const isActive = lesson.id === activeLessonId;
                          const isDone = progress.completedLessons.includes(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.6rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                background: isActive ? 'var(--primary-50)' : 'transparent',
                                border: isActive ? '1px solid var(--primary-300)' : '1px solid transparent',
                                marginBottom: '2px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                {isDone ? (
                                  <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                                ) : lesson.type === 'quiz' ? (
                                  <HelpCircle size={16} color="#F59E0B" style={{ flexShrink: 0 }} />
                                ) : lesson.type === 'code' ? (
                                  <Code2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                                ) : (
                                  <Play size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                )}
                                <span style={{
                                  fontSize: '0.82rem',
                                  fontWeight: isActive ? 700 : 500,
                                  color: isActive ? 'var(--primary-700)' : 'var(--text-primary)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {lesson.title}
                                </span>
                              </div>

                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                {lesson.duration}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Interactive Quiz Runner Modal */}
      {isQuizModalOpen && activeQuizData && (
        <QuizRunner
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          courseId={course.id}
          lessonId={activeLesson.id}
          quizData={activeQuizData}
        />
      )}

      {/* Official Certificate Modal */}
      {isCertModalOpen && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificate={generatedCert || progress.certificateId}
        />
      )}
    </div>
  );
}
