import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CourseContext';
import { useToast } from '../../context/ToastContext';
import { categoriesData } from '../../data/categoriesData';
import { 
  PlusCircle, BarChart3, BookOpen, Users, DollarSign, 
  Star, Edit, Trash2, Video, CheckCircle2, ArrowLeft, 
  TrendingUp, Sparkles, MessageSquare, HelpCircle, Save 
} from 'lucide-react';

export default function InstructorDashboard({ initialTab, onNavigate }) {
  const { currentUser } = useAuth();
  const { courses, addCourse } = useCourses();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab || 'analytics'); // 'analytics' | 'courses' | 'new-course' | 'reviews'

  // New Course Builder Form State
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubtitle, setCourseSubtitle] = useState('');
  const [category, setCategory] = useState('web-development');
  const [level, setLevel] = useState('جميع المستويات');
  const [price, setPrice] = useState('299');
  const [originalPrice, setOriginalPrice] = useState('599');
  const [duration, setDuration] = useState('24 ساعة');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80');
  const [promoVideo, setPromoVideo] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [objectives, setObjectives] = useState('إتقان أحدث التقنيات البرمجية\nبناء مشاريع حقيقية لسوق العمل\nالحصول على شهادة معتمدة');
  
  // Custom Modules builder
  const [modules, setModules] = useState([
    {
      id: 'mod-new-1',
      title: 'الوحدة 1: الأساسيات والمفاهيم الجوهرية',
      duration: '4 ساعات',
      lessons: [
        { id: 'l1', title: 'مقدمة المسار وبيئة العمل', duration: '15:00', type: 'video' },
        { id: 'l2', title: 'اختبار تقييمي سريع', duration: '10 دقائق', type: 'quiz' }
      ]
    }
  ]);

  const handleAddModule = () => {
    setModules(prev => [
      ...prev,
      {
        id: `mod-new-${Date.now()}`,
        title: `الوحدة ${prev.length + 1}: موضوع متقدم جديد`,
        duration: '3 ساعات',
        lessons: [
          { id: `l-${Date.now()}`, title: 'شرح وتطبيق عملي', duration: '20:00', type: 'video' }
        ]
      }
    ]);
  };

  const handlePublishCourse = (e) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      addToast('يرجى إدخال عنوان الدورة التدريبية', 'error');
      return;
    }

    const newCourseObj = {
      title: courseTitle,
      slug: courseTitle.toLowerCase().replace(/\s+/g, '-'),
      subtitle: courseSubtitle || 'مسار تعليمي متقدم لإتقان المهارات التقنية الحديثة',
      category,
      level,
      price: Number(price),
      originalPrice: Number(originalPrice),
      duration,
      lessonsCount: modules.reduce((acc, m) => acc + m.lessons.length, 0),
      thumbnail,
      promoVideo,
      learningObjectives: objectives.split('\n').filter(Boolean),
      requirements: ['حاسوب متصل بالإنترنت', 'الرغبة في التعلم'],
      targetAudience: ['المطورون والمهتمون بالمجال'],
      modules
    };

    addCourse(newCourseObj);
    setActiveTab('courses');
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)' }}>
      <div className="container">
        {/* Header with Instructor Overview */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem'
        }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser?.name}
                style={{ width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #818CF8', objectFit: 'cover' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>
                    استوديو المدرب: {currentUser?.name || 'م. طارق العتيبي'} 👨‍🏫
                  </h1>
                  <span className="badge badge-success">مدرب معتمد</span>
                </div>
                <p style={{ color: '#C7D2FE', fontSize: '0.9rem', margin: '4px 0 0' }}>
                  لوحة إدارة ونشر المسارات التعليمية ومتابعة أداء ومبيعات الطلاب.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('new-course')}
              className="btn btn-primary"
              style={{ background: '#FFFFFF', color: '#4F46E5', fontWeight: 700, gap: '8px' }}
            >
              <PlusCircle size={18} />
              <span>إنشاء دورة جديدة</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-subtle)',
          gap: '1.5rem',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {[
            { id: 'analytics', label: 'التحليلات والمبيعات', icon: BarChart3 },
            { id: 'courses', label: `دوراتي المنشورة (${courses.length})`, icon: BookOpen },
            { id: 'new-course', label: '➕ استوديو إنشاء دورة', icon: PlusCircle },
            { id: 'reviews', label: 'استفسارات ومراجعات الطلاب', icon: MessageSquare }
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
                  padding: '0.75rem 0.5rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.id ? '3px solid var(--primary-600)' : '3px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Analytics */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* 4 Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الأرباح والإيرادات:</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-600)', margin: '4px 0' }}>84,350 ر.س</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>+18% نمو مقارنة بالشهر السابق</span>
              </div>

              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الطلاب المسجلين:</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>32,000 طالب</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>عبر كافة المسارات المنشورة</span>
              </div>

              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>متوسط تقييم المدرب:</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', margin: '4px 0' }}>4.95 ⭐</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>من أصل 1,850 تقييم موثق</span>
              </div>

              <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>معدل إكمال الدورات:</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', margin: '4px 0' }}>86%</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>أعلى من متوسط المنصة</span>
              </div>
            </div>

            {/* Monthly Earnings Chart Simulator */}
            <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem' }}>مخطط الإيرادات الشهرية (2026)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '200px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                {[
                  { month: 'يناير', val: 9800 },
                  { month: 'فبراير', val: 11200 },
                  { month: 'مارس', val: 12500 },
                  { month: 'أبريل', val: 10400 },
                  { month: 'مايو', val: 14200 },
                  { month: 'يونيو', val: 15600 },
                  { month: 'يوليو', val: 17800 },
                  { month: 'أغسطس', val: 18850 }
                ].map((item, idx) => {
                  const heightPct = Math.round((item.val / 20000) * 100);
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)' }}>{(item.val / 1000).toFixed(1)}k</span>
                      <div style={{
                        width: '100%',
                        maxWidth: '40px',
                        height: `${heightPct}%`,
                        background: 'var(--primary-gradient)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.3s ease'
                      }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: My Published Courses */}
        {activeTab === 'courses' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {courses.map(course => (
              <div key={course.id} className="card" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
                <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '160px', borderRadius: '8px', objectFit: 'cover', marginBottom: '10px' }} />
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <span className="badge badge-primary">{course.category}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary-600)' }}>{course.price} ر.س</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px', lineHeight: '1.4' }}>{course.title}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <span>⭐ {course.rating}</span>
                  <span>👥 {course.studentsCount?.toLocaleString()} طالب</span>
                  <span>📚 {course.lessonsCount} درس</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => onNavigate('course-detail', { courseId: course.id })} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    معاينة الصفحة
                  </button>
                  <button onClick={() => onNavigate('classroom', { courseId: course.id })} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    قاعة الدراسة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Create Course Studio */}
        {activeTab === 'new-course' && (
          <form onSubmit={handlePublishCourse} className="card animate-fade-in" style={{ padding: '2rem', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px' }}>إنشاء ونشر دورة جديدة (Course Studio)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                أدخل تفاصيل الدورة، السعر، الفصول والدروس لنشرها فوراً على المنصة.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان الدورة التدريبية:</label>
                <input
                  type="text"
                  placeholder="مثال: المسار الاحترافي لبناء تطبيقات الويب بالذكاء الاصطناعي"
                  value={courseTitle}
                  onChange={e => setCourseTitle(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المجال والتخصص:</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input-control"
                >
                  {categoriesData.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الوصف المختصر والمشوق:</label>
              <textarea
                placeholder="اكتب نبذة مختصرة عن الدورة والقيمة التي سيكتسبها الطالب..."
                value={courseSubtitle}
                onChange={e => setCourseSubtitle(e.target.value)}
                className="input-control"
                style={{ height: '80px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سعر البيع (ر.س):</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="input-control"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>السعر قبل الخصم (ر.س):</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={e => setOriginalPrice(e.target.value)}
                  className="input-control"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>إجمالي الساعات التقديرية:</label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="input-control"
                />
              </div>
            </div>

            {/* Modules Builder */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>هيكل المنهج الدراسي والوحدات:</h4>
                <button type="button" onClick={handleAddModule} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
                  <PlusCircle size={15} />
                  <span>إضافة وحدة جديدة</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {modules.map((mod, idx) => (
                  <div key={mod.id} className="card" style={{ padding: '1rem', background: 'var(--bg-subtle)' }}>
                    <div className="flex-between" style={{ marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{mod.title}</strong>
                      <span className="badge badge-primary">{mod.lessons.length} دروس</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {mod.lessons.map(l => `• ${l.title} (${l.duration})`).join(' | ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '8px', alignSelf: 'flex-start', minWidth: '220px' }}>
              <Save size={18} />
              <span>نشر الدورة رسمياً على المنصة 🚀</span>
            </button>
          </form>
        )}

        {/* Tab 4: Student Reviews */}
        {activeTab === 'reviews' && (
          <div className="card animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>أحدث مراجعات وتقييمات الطلاب</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { student: 'عبدالله الشمري', course: 'Full-Stack React & Next.js 15', rating: 5, comment: 'دورة ممتازة جداً، الأفضل في المحتوى العربي بلا منازع.', time: 'اليوم' },
                { student: 'منى التميمي', course: 'Full-Stack React & Next.js 15', rating: 5, comment: 'طريقة تطبيق الذكاء الاصطناعي مع Next.js كانت واضحة جداً وسهلة التطبيق.', time: 'أمس' }
              ].map((rev, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{rev.student}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rev.time}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary-600)', display: 'block', marginBottom: '6px' }}>{rev.course}</span>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
