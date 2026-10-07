import React from 'react';
import { useCourses } from '../../context/CourseContext';
import { Star, Clock, BookOpen, Heart, ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CourseCard({ course, onNavigate }) {
  const { wishlist, toggleWishlist, addToCart, isEnrolled, getCourseProgress } = useCourses();

  const isLiked = wishlist.includes(course.id);
  const enrolled = isEnrolled(course.id);
  const progress = enrolled ? getCourseProgress(course.id) : null;

  return (
    <div 
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
      }}
    >
      {/* Thumbnail Container */}
      <div 
        onClick={() => onNavigate('course-detail', { courseId: course.id })}
        style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}
      >
        <img
          src={course.thumbnail}
          alt={course.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* Badge */}
        {course.badge && (
          <span 
            className="badge badge-gold"
            style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, boxShadow: 'var(--shadow-sm)' }}
          >
            {course.badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(course.id);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title={isLiked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        >
          <Heart size={18} color={isLiked ? '#EC4899' : '#64748B'} fill={isLiked ? '#EC4899' : 'none'} />
        </button>
      </div>

      {/* Card Body */}
      <div style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        {/* Category & Level */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span className="badge badge-primary">{course.category}</span>
          <span style={{ color: 'var(--text-muted)' }}>{course.level}</span>
        </div>

        {/* Title */}
        <div onClick={() => onNavigate('course-detail', { courseId: course.id })} style={{ cursor: 'pointer' }}>
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            lineHeight: '1.4',
            margin: '0 0 6px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {course.title}
          </h3>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {course.subtitle}
          </p>
        </div>

        {/* Instructor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
          <img
            src={course.instructor?.avatar}
            alt={course.instructor?.name}
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {course.instructor?.name}
          </span>
        </div>

        {/* Rating & Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={15} fill="#F59E0B" color="#F59E0B" />
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{course.rating}</strong>
            <span>({course.reviewsCount})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              <span>{course.duration}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={14} />
              <span>{course.lessonsCount} درس</span>
            </div>
          </div>
        </div>

        {/* Enrolled Progress Bar OR Price Action */}
        {enrolled ? (
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            marginTop: '0.25rem'
          }}>
            <div className="flex-between" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>نسبة إنجازك:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{progress?.percentage || 0}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: 'var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div style={{
                width: `${progress?.percentage || 0}%`,
                height: '100%',
                background: 'var(--primary-gradient)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <button
              onClick={() => onNavigate('classroom', { courseId: course.id })}
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
            >
              متابعة التعلم في قاعة الدراسة
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                  {course.price} ر.س
                </span>
                {course.originalPrice && (
                  <span style={{ fontSize: '0.82rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    {course.originalPrice} ر.س
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(course.id);
                }}
                className="btn btn-secondary btn-sm"
                title="إضافة إلى السلة"
              >
                <ShoppingBag size={16} />
              </button>
              <button
                onClick={() => onNavigate('course-detail', { courseId: course.id })}
                className="btn btn-primary btn-sm"
              >
                التفاصيل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
