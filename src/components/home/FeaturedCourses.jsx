import React, { useState } from 'react';
import { useCourses } from '../../context/CourseContext';
import CourseCard from '../courses/CourseCard';
import { Sparkles, ArrowLeft, Filter } from 'lucide-react';

export default function FeaturedCourses({ onNavigate }) {
  const { courses } = useCourses();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'جميع المسارات المميزة' },
    { id: 'web-development', label: 'تطوير الويب & Next.js' },
    { id: 'ai-machine-learning', label: 'الذكاء الاصطناعي & LLMs' },
    { id: 'ui-ux-design', label: 'تصميم UI/UX & Figma' },
    { id: 'cybersecurity', label: 'الأمن السيبراني' },
    { id: 'mobile-development', label: 'تطبيقات الجوال' }
  ];

  const filteredCourses = selectedFilter === 'all'
    ? courses
    : courses.filter(c => c.category === selectedFilter);

  return (
    <section style={{ padding: '4rem 0', background: 'var(--bg-surface)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={14} color="var(--primary-600)" />
            <span>مكتبة المسارات الأكثر طلباً</span>
          </div>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            دورات تطبيقية بمشاريع لسوق العمل
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6' }}>
            محتوى تم تصميمه بعناية فائقة وفقاً لأحدث الممارسات التقنية مع تدريب عملي خطوة بخطوة
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '2.5rem'
        }}>
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className="btn btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                background: selectedFilter === tab.id ? 'var(--primary-gradient)' : 'var(--bg-subtle)',
                color: selectedFilter === tab.id ? 'white' : 'var(--text-secondary)',
                border: selectedFilter === tab.id ? '1px solid transparent' : '1px solid var(--border-subtle)',
                padding: '0.5rem 1.1rem',
                fontWeight: 600
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.75rem',
          marginBottom: '3rem'
        }}>
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} onNavigate={onNavigate} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => onNavigate('courses')}
            className="btn btn-primary btn-lg"
            style={{ gap: '10px' }}
          >
            <span>استعراض كافة الدورات والمسارات (+120 دورة)</span>
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
