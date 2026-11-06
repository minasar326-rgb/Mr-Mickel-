import React from 'react';
import { useAdminUI } from '../context/AdminUIContext';
import { useTeacher } from '../../../context/TeacherContext';
import { 
  Menu, Search, Moon, Sun, ChevronLeft, GraduationCap, 
  ExternalLink, Layers
} from 'lucide-react';

export default function AdminStickyHeader({ onExitToStudentView }) {
  const { 
    activeStageId, setActiveStageId, currentStage, 
    searchQuery, setSearchQuery, 
    isDarkMode, setIsDarkMode, 
    setIsMobileNavOpen, breadcrumbs 
  } = useAdminUI();

  const { stages } = useTeacher();

  return (
    <header className="admin-sticky-header">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Right side: Hamburger (Mobile) + Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="adm-btn adm-btn-secondary"
            style={{
              padding: '8px',
              minHeight: '40px',
              minWidth: '40px',
              display: 'inline-flex'
            }}
            title="القائمة"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || idx}>
                {idx > 0 && <ChevronLeft size={14} color="var(--adm-text-muted)" />}
                <button
                  onClick={crumb.onClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: idx === breadcrumbs.length - 1 ? 'var(--adm-text-primary)' : 'var(--adm-text-muted)',
                    fontWeight: idx === breadcrumbs.length - 1 ? 800 : 600,
                    cursor: crumb.onClick ? 'pointer' : 'default',
                    padding: '2px 4px'
                  }}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Center: Sticky Stage Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--adm-bg)',
          padding: '4px 8px',
          borderRadius: 'var(--adm-radius-md)',
          border: '1px solid var(--adm-card-border)'
        }}>
          <GraduationCap size={18} color="var(--adm-primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>
            المرحلة:
          </span>
          <select
            value={activeStageId}
            onChange={(e) => setActiveStageId(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: 'var(--adm-primary)',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <option value="all">جميع المراحل (عرض شامل)</option>
            {stages.map(stg => (
              <option key={stg.id} value={stg.id}>
                {stg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Left side: Quick Search + Dark Mode + Student Portal button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} color="var(--adm-text-muted)" style={{ position: 'absolute', right: '10px' }} />
            <input
              type="text"
              placeholder="بحث سريع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 32px 6px 12px',
                borderRadius: 'var(--adm-radius-md)',
                border: '1px solid var(--adm-card-border)',
                background: 'var(--adm-bg)',
                fontSize: '0.82rem',
                minHeight: '38px',
                width: '150px',
                fontFamily: 'inherit',
                color: 'var(--adm-text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            className="adm-btn adm-btn-secondary"
            style={{ padding: '8px', minHeight: '38px', minWidth: '38px' }}
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDarkMode ? <Sun size={17} color="#F59E0B" /> : <Moon size={17} color="#64748B" />}
          </button>

          {onExitToStudentView && (
            <button
              onClick={onExitToStudentView}
              className="adm-btn adm-btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.82rem', minHeight: '38px' }}
            >
              <ExternalLink size={15} />
              <span>واجهة الطالب</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
