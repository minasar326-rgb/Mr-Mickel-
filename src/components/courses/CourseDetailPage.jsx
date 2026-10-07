import React, { useState } from 'react';
import { useCourses } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Star, Clock, BookOpen, Award, CheckCircle2, Play, 
  ChevronDown, ChevronUp, Heart, ShoppingBag, ArrowLeft, 
  Share2, Shield, Users, Globe, Video, FileText, Code2, HelpCircle, Sparkles
} from 'lucide-react';

export default function CourseDetailPage({ courseId, onNavigate, onOpenCart }) {
  const { courses, isEnrolled, enrollInCourse, toggleWishlist, wishlist, addToCart, getCourseProgress } = useCourses();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const course = courses.find(c => c.id === courseId) || courses[0];
  const enrolled = isEnrolled(course.id);
  const isLiked = wishlist.includes(course.id);
  const progress = enrolled ? getCourseProgress(course.id) : null;

  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum' | 'overview' | 'instructor' | 'reviews' | 'faq'
  const [expandedModules, setExpandedModules] = useState({ 'mod-1': true, 'mod-2': true });
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleEnrollDirect = () => {
    if (!enrolled) {
      enrollInCourse(course.id);
    }
    onNavigate('classroom', { courseId: course.id });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('تم نسخ رابط الدورة بنجاح! 🔗', 'success');
    }
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)', paddingTop: 0 }}>
      {/* Hero Header Section */}
      <div style={{
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-main) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '2.5rem 0 3.5rem'
      }}>
        <div className="container">
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            <span onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>الرئيسية</span>
            <span>/</span>
            <span onClick={() => onNavigate('courses')} style={{ cursor: 'pointer' }}>الدورات</span>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{course.title}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '3rem',
            alignItems: 'flex-start'
          }}>
            {/* Left Course Intro Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{course.category}</span>
                {course.badge && <span className="badge badge-gold">{course.badge}</span>}
                <span className="badge badge-subtle">{course.level}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>آخر تحديث: {course.lastUpdated}</span>
              </div>

              <h1 style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                fontWeight: 900,
                lineHeight: '1.25',
                marginBottom: '1rem'
              }}>
                {course.title}
              </h1>

              <p style={{
                fontSize: '1.05rem',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem'
              }}>
                {course.subtitle}
              </p>

              {/* Rating & Social Proof */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={18} fill="#F59E0B" color="#F59E0B" />
                  <strong style={{ fontSize: '1.05rem' }}>{course.rating}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>({course.reviewsCount} تقييم)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Users size={18} />
                  <span>{course.studentsCount?.toLocaleString()} طالب مسجل</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Clock size={18} />
                  <span>{course.duration}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <Globe size={18} />
                  <span>اللغة: {course.language}</span>
                </div>
              </div>

              {/* Instructor Mini Preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.85rem 1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}>
                <img
                  src={course.instructor?.avatar}
                  alt={course.instructor?.name}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>إعداد وتقديم المدرب:</span>
                  <strong style={{ fontSize: '0.95rem' }}>{course.instructor?.name}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>{course.instructor?.title}</span>
                </div>
              </div>
            </div>

            {/* Right Sticky Enrollment Card */}
            <div className="card" style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
              position: 'sticky',
              top: '90px'
            }}>
              {/* Preview Thumbnail with Video trigger */}
              <div 
                onClick={() => setIsVideoModalOpen(true)}
                style={{ position: 'relative', height: '210px', cursor: 'pointer', overflow: 'hidden' }}
              >
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '8px',
                  color: 'white'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s'
                  }}>
                    <Play size={26} fill="currentColor" style={{ marginLeft: '-2px' }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                    مشاهدة المقطع الترويجي
                  </span>
                </div>
              </div>

              {/* Price & CTA Body */}
              <div style={{ padding: '1.5rem' }}>
                {enrolled ? (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="badge badge-success" style={{ marginBottom: '8px' }}>
                      ✓ أنت مسجل في هذا المسار
                    </div>
                    <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span>نسبة الإنجاز الحالية:</span>
                      <strong>{progress?.percentage || 0}%</strong>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: `${progress?.percentage || 0}%`,
                        height: '100%',
                        background: 'var(--primary-gradient)',
                        borderRadius: 'var(--radius-full)'
                      }} />
                    </div>
                    <button
                      onClick={() => onNavigate('classroom', { courseId: course.id })}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                    >
                      متابعة التعلم في قاعة الدراسة
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Price display */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-600)' }}>
                        {course.price} ر.س
                      </span>
                      {course.originalPrice && (
                        <>
                          <span style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            {course.originalPrice} ر.س
                          </span>
                          <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
                            وفر {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <button
                        onClick={handleEnrollDirect}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', gap: '8px' }}
                      >
                        <span>التسجيل الفوري والبدء</span>
                        <ArrowLeft size={18} />
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            addToCart(course.id);
                            onOpenCart();
                          }}
                          className="btn btn-secondary"
                          style={{ flex: 1, gap: '6px' }}
                        >
                          <ShoppingBag size={18} />
                          <span>إضافة للسلة</span>
                        </button>

                        <button
                          onClick={() => toggleWishlist(course.id)}
                          className="btn btn-secondary btn-icon-only"
                          title="المفضلة"
                        >
                          <Heart size={18} color={isLiked ? '#EC4899' : 'currentColor'} fill={isLiked ? '#EC4899' : 'none'} />
                        </button>

                        <button
                          onClick={handleShare}
                          className="btn btn-secondary btn-icon-only"
                          title="مشاركة"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Guarantees & Inclusions */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Award size={16} color="#F59E0B" />
                    <span>شهادة إتمام معتمدة وموثقة برقم تسلسلي</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Sparkles size={16} color="var(--primary-600)" />
                    <span>مساعد ذكاء اصطناعي تفاعلي 24/7 داخل الدروس</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Code2 size={16} color="var(--success)" />
                    <span>تحديات برمجية واختبارات تقييم فورية</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <Shield size={16} color="var(--primary-600)" />
                    <span>ضمان استرداد الأموال لمدة 30 يوماً</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Details Section */}
      <div className="container" style={{ marginTop: '2.5rem' }}>
        <div style={{ maxWidth: '820px' }}>
          {/* Tabs Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-subtle)',
            gap: '1.5rem',
            marginBottom: '2rem',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}>
            {[
              { id: 'curriculum', label: 'المنهج الدراسي والدروس' },
              { id: 'overview', label: 'عن المسار والمخرجات' },
              { id: 'instructor', label: 'عن المدرب' },
              { id: 'reviews', label: 'التقييمات والآراء' },
              { id: 'faq', label: 'الأسئلة الشائعة' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 0.5rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--primary-600)' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Curriculum */}
          {activeTab === 'curriculum' && (
            <div className="animate-fade-in">
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>محتويات المسار التدريبي</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {course.modules?.length} وحدات • {course.lessonsCount} درس • {course.duration} إجمالي الوقت
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {course.modules?.map((module, mIdx) => {
                  const isExpanded = expandedModules[module.id] !== false;

                  return (
                    <div key={module.id} className="card" style={{ overflow: 'hidden' }}>
                      {/* Module Header Bar */}
                      <div
                        onClick={() => toggleModule(module.id)}
                        style={{
                          padding: '1.1rem 1.25rem',
                          background: 'var(--bg-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: 'var(--bg-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700
                          }}>
                            {mIdx + 1}
                          </span>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{module.title}</h4>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {module.lessons?.length} دروس ({module.duration})
                          </span>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Module Lessons List */}
                      {isExpanded && (
                        <div style={{ padding: '0.5rem 1rem' }}>
                          {module.lessons?.map((lesson, lIdx) => (
                            <div
                              key={lesson.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem 0.5rem',
                                borderBottom: lIdx === module.lessons.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                                fontSize: '0.88rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {lesson.type === 'video' ? (
                                  <Video size={16} color="var(--primary-500)" />
                                ) : lesson.type === 'quiz' ? (
                                  <HelpCircle size={16} color="#F59E0B" />
                                ) : (
                                  <Code2 size={16} color="var(--success)" />
                                )}
                                <span style={{ fontWeight: 600 }}>{lesson.title}</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lesson.duration}</span>
                                {lesson.type === 'quiz' && <span className="badge badge-warning">اختبار تقييمي</span>}
                                {lesson.type === 'code' && <span className="badge badge-success">تحدي برمجي</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Overview */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Learning Objectives */}
              <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem' }}>ماذا ستتعلم في هذا المسار؟</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {course.learningObjectives?.map((obj, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>المتطلبات المسبقة</h3>
                <ul style={{ paddingRight: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                  {course.requirements?.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              {/* Target Audience */}
              <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>لمن هذا المسار؟</h3>
                <ul style={{ paddingRight: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                  {course.targetAudience?.map((aud, i) => (
                    <li key={i}>{aud}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Instructor */}
          {activeTab === 'instructor' && (
            <div className="card animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <img
                  src={course.instructor?.avatar}
                  alt={course.instructor?.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-200)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px' }}>{course.instructor?.name}</h3>
                  <p style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 8px' }}>
                    {course.instructor?.title}
                  </p>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>⭐ {course.instructor?.rating} تقييم المدرب</span>
                    <span>👥 {course.instructor?.studentsCount?.toLocaleString()} طالب</span>
                    <span>📚 {course.instructor?.coursesCount} دورات منشورة</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--text-secondary)', margin: 0 }}>
                {course.instructor?.bio}
              </p>
            </div>
          )}

          {/* Tab 4: Reviews */}
          {activeTab === 'reviews' && (
            <div className="card animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-600)', lineHeight: '1' }}>{course.rating}</div>
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '6px 0' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>متوسط التقييم العام</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { stars: '5 نجوم', pct: 88 },
                    { stars: '4 نجوم', pct: 9 },
                    { stars: '3 نجوم', pct: 2 },
                    { stars: 'نجمتان', pct: 1 },
                    { stars: 'نجمة واحدة', pct: 0 }
                  ].map((bar, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                      <span style={{ width: '60px', color: 'var(--text-muted)' }}>{bar.stars}</span>
                      <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${bar.pct}%`, height: '100%', background: '#F59E0B' }} />
                      </div>
                      <span style={{ width: '35px', textAlign: 'left', fontWeight: 600 }}>{bar.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Reviews */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { name: 'محمد المطيري', date: 'منذ أسبوع', rating: 5, text: 'دورة ممتازة وشاملة جداً! كل تفصيلة مشروحة بأمثلة واقعية، واستفدت كثيراً من قسم الذكاء الاصطناعي.' },
                  { name: 'هدى الغامدي', date: 'منذ أسبوعين', rating: 5, text: 'أجمل ما في المنصة هو المساعد الذكي الذي يشرح لك فوراً عند تعثرك في أي كود.' }
                ].map((rev, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.92rem' }}>{rev.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rev.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: FAQ */}
          {activeTab === 'faq' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { q: 'هل سأحصل على شهادة معتمدة بعد إنهاء المسار؟', a: 'نعم بالتأكيد! فور إكمال 100% من الدروس والاختبارات ستحصل على شهادة إتمام رسمية برقم تسلسلي يمكن التحقق منه عبر المنصة ومشاركته على LinkedIn.' },
                { q: 'هل المحتوى متاح مدى الحياة؟', a: 'نعم، بمجرد التسجيل في المسار ستتمكن من الوصول لجميع الدروس والمشاريع والتحديثات المستقبلية في أي وقت.' },
                { q: 'ماذا لو واجهت صعوبة في فهم أحد الأكواد؟', a: 'تحتوي قاعة الدراسة على مساعد الذكاء الاصطناعي التفاعلي المتاح 24/7 للإجابة الفورية، بالإضافة إلى منتدى المناقشات المباشر مع المدرب.' }
              ].map((item, idx) => (
                <div key={idx} className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    ❓ {item.q}
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Preview Modal */}
      {isVideoModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: '1.5rem'
        }}>
          <div style={{ maxWidth: '800px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setIsVideoModalOpen(false)}
              style={{
                position: 'absolute',
                top: '-35px',
                left: 0,
                color: 'white',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              إغلاق ✕
            </button>
            <video
              src={course.promoVideo || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
              controls
              autoPlay
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
