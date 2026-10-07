import React, { useState, useMemo } from 'react';
import { useCourses } from '../../context/CourseContext';
import { categoriesData } from '../../data/categoriesData';
import CourseCard from './CourseCard';
import { 
  Search, Filter, SlidersHorizontal, Grid, List, 
  X, Star, BookOpen, Clock, ChevronDown, Sparkles 
} from 'lucide-react';

export default function CourseCatalogPage({ initialCategory, initialQuery, onNavigate }) {
  const { courses } = useCourses();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'free' | 'paid'
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'rating' | 'newest' | 'price-low' | 'price-high'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filteredAndSortedCourses = useMemo(() => {
    return courses
      .filter(course => {
        // Category filter
        if (selectedCategory !== 'all' && course.category !== selectedCategory) return false;

        // Level filter
        if (selectedLevel !== 'all' && !course.level.includes(selectedLevel)) return false;

        // Rating filter
        if (selectedRating === '4.8' && course.rating < 4.8) return false;
        if (selectedRating === '4.5' && course.rating < 4.5) return false;

        // Price filter
        if (priceFilter === 'paid' && course.price === 0) return false;
        if (priceFilter === 'free' && course.price > 0) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = course.title.toLowerCase().includes(q);
          const matchSub = course.subtitle?.toLowerCase().includes(q);
          const matchInst = course.instructor?.name.toLowerCase().includes(q);
          const matchCat = course.category.toLowerCase().includes(q);
          if (!matchTitle && !matchSub && !matchInst && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return (b.studentsCount || 0) - (a.studentsCount || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'newest') return (b.lessonsCount || 0) - (a.lessonsCount || 0);
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return 0;
      });
  }, [courses, selectedCategory, selectedLevel, selectedRating, priceFilter, searchQuery, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedRating('all');
    setPriceFilter('all');
    setSearchQuery('');
    setSortBy('popular');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedLevel !== 'all' || selectedRating !== 'all' || priceFilter !== 'all' || searchQuery !== '';

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)' }}>
      <div className="container">
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            الرئيسية / استكشاف الدورات التدريبية
          </span>
          <div className="flex-between" style={{ marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2.1rem', fontWeight: 800 }}>مكتبة الدورات والمسارات</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                اكتشف {courses.length} مسار تدريبي متاح الآن بمعايير عالمية
              </p>
            </div>

            {/* Sort & Quick Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الترتيب حسب:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="popular">الأكثر شعبية وتسجيلاً</option>
                  <option value="rating">الأعلى تقييماً ⭐</option>
                  <option value="price-low">السعر: من الأقل للأعلى</option>
                  <option value="price-high">السعر: من الأعلى للأقل</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout (Sidebar Filters + Courses Grid) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '2rem',
          alignItems: 'flex-start'
        }}>
          {/* Right Filters Sidebar */}
          <aside className="card" style={{
            padding: '1.5rem',
            position: 'sticky',
            top: '90px',
            background: 'var(--bg-surface)'
          }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} color="var(--primary-600)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>تصفية النتائج</h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  مسح الكل
                </button>
              )}
            </div>

            {/* Search within Catalog */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>بحث بالكلمة:</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-control"
                  style={{ paddingRight: '32px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>التخصص والمجال:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cat"
                    checked={selectedCategory === 'all'}
                    onChange={() => setSelectedCategory('all')}
                  />
                  <span>جميع التخصصات</span>
                </label>
                {categoriesData.map(cat => (
                  <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="cat"
                      checked={selectedCategory === cat.id}
                      onChange={() => setSelectedCategory(cat.id)}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>المستوى التدريبي:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { id: 'all', label: 'كافة المستويات' },
                  { id: 'مبتدئ', label: 'مبتدئ' },
                  { id: 'متوسط', label: 'متوسط' },
                  { id: 'متقدم', label: 'متقدم وخبير' }
                ].map(lvl => (
                  <label key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="lvl"
                      checked={selectedLevel === lvl.id}
                      onChange={() => setSelectedLevel(lvl.id)}
                    />
                    <span>{lvl.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>التقييم:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rat"
                    checked={selectedRating === 'all'}
                    onChange={() => setSelectedRating('all')}
                  />
                  <span>الكل</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rat"
                    checked={selectedRating === '4.8'}
                    onChange={() => setSelectedRating('4.8')}
                  />
                  <span>4.8 نجوم فأعلى ⭐</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rat"
                    checked={selectedRating === '4.5'}
                    onChange={() => setSelectedRating('4.5')}
                  />
                  <span>4.5 نجوم فأعلى</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Left: Courses Grid */}
          <div>
            {/* Active filter summary pill */}
            <div className="flex-between" style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                تم العثور على <strong>{filteredAndSortedCourses.length}</strong> دورة تدريبية
              </span>
            </div>

            {filteredAndSortedCourses.length === 0 ? (
              <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <BookOpen size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>لم نجد نتائج مطابقة لخيارات البحث</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  جرب تغيير كلمات البحث أو إعادة تعيين الفلاتر لتصفح جميع الدورات المتاحة.
                </p>
                <button onClick={clearAllFilters} className="btn btn-primary">
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredAndSortedCourses.map(course => (
                  <CourseCard key={course.id} course={course} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
