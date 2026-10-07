import React from 'react';
import { categoriesData } from '../../data/categoriesData';
import { 
  Code2, Sparkles, Palette, ShieldCheck, Smartphone, 
  TrendingUp, Database, Cloud, ArrowLeft, ArrowUpRight 
} from 'lucide-react';

const iconMap = {
  Code2: Code2,
  Sparkles: Sparkles,
  Palette: Palette,
  ShieldCheck: ShieldCheck,
  Smartphone: Smartphone,
  TrendingUp: TrendingUp,
  Database: Database,
  Cloud: Cloud
};

export default function CategoryGrid({ onNavigate }) {
  return (
    <section style={{ padding: '4rem 0', background: 'var(--bg-main)' }}>
      <div className="container">
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '6px' }}>المسارات والتخصصات</span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800 }}>استكشف مجالك المستقبلي</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              اختر التخصص الذي يلبي طموحك المهني وابدأ رحلة التعلم المنظم خطوة بخطوة
            </p>
          </div>

          <button
            onClick={() => onNavigate('courses')}
            className="btn btn-secondary"
            style={{ gap: '8px' }}
          >
            <span>عرض كل المجالات</span>
            <ArrowLeft size={16} />
          </button>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {categoriesData.map(cat => {
            const IconComponent = iconMap[cat.icon] || Code2;

            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('courses', { category: cat.id })}
                className="card card-interactive"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: cat.bgColor,
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease'
                  }}>
                    <IconComponent size={24} />
                  </div>
                  <span className="badge badge-subtle" style={{ fontSize: '0.75rem' }}>
                    {cat.coursesCount} دورة
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    {cat.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {cat.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--primary-600)',
                  marginTop: '0.5rem'
                }}>
                  <span>تصفح المسار</span>
                  <ArrowUpRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
