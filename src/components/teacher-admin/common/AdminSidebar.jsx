import React from 'react';
import { useAdminUI } from '../context/AdminUIContext';
import { useTeacher } from '../../../context/TeacherContext';
import { 
  LayoutDashboard, BookOpen, Calendar, Video, Film, FileText, 
  HelpCircle, Users, CreditCard, Key, Search, DollarSign, 
  Settings, ShieldCheck, UserCheck, Bell, Trash2, HardDrive, 
  X, ChevronLeft, Sparkles, ExternalLink
} from 'lucide-react';

export default function AdminSidebar({ onExitToStudentView }) {
  const { activeTab, setActiveTab, isMobileNavOpen, setIsMobileNavOpen } = useAdminUI();
  const { 
    lectures, sections, stages, booklets, accessCodes, 
    generalExams, staffAdmins, announcements, totalCollectedRevenue 
  } = useTeacher();

  const NAV_GROUPS = [
    {
      group: 'نظرة عامة',
      items: [
        { id: 'dashboard', label: 'الرئيسية والإحصائيات', icon: LayoutDashboard }
      ]
    },
    {
      group: 'إدارة المحتوى والمناهج',
      items: [
        { id: 'stages', label: 'المراحل الدراسية', icon: BookOpen, count: stages.length },
        { id: 'sections', label: 'الشهور والكورسات', icon: Calendar, count: sections.length },
        { id: 'lectures', label: 'المحاضرات والأستوديو', icon: Video, count: lectures.length },
        { id: 'videos', label: 'مستودع الفيديوهات R2', icon: Film },
        { id: 'booklets', label: 'المذكرات والكتب', icon: FileText, count: booklets.length },
        { id: 'exams', label: 'الامتحانات والتصحيح', icon: HelpCircle }
      ]
    },
    {
      group: 'الطلاب والاشتراكات',
      items: [
        { id: 'students', label: 'سجل وبيانات الطلاب', icon: Users },
        { id: 'subscriptions', label: 'إدارة الاشتراكات والمشتركين', icon: CreditCard }
      ]
    },
    {
      group: 'الأكواد وكروت الشحن',
      items: [
        { id: 'codes', label: 'كروت الشحن والأكواد', icon: Key, count: accessCodes.length },
        { id: 'general-codes', label: 'أكواد الامتحانات الشاملة', icon: Key }
      ]
    },
    {
      group: 'المالية والخزينة',
      items: [
        { id: 'finance', label: 'الخزينة والمعاملات', icon: DollarSign, badge: `${totalCollectedRevenue > 0 ? (totalCollectedRevenue / 1000).toFixed(1) + 'k' : '0'}` }
      ]
    },
    {
      group: 'الإعدادات والمنصة',
      items: [
        { id: 'profile', label: 'بيانات المستر والواجهة', icon: Settings },
        { id: 'staff', label: 'فريق العمل والصلاحيات', icon: UserCheck, count: staffAdmins?.length || 1 },
        { id: 'security', label: 'درع الحماية (Anti-Piracy)', icon: ShieldCheck },
        { id: 'broadcast', label: 'التنبيهات والإعلانات', icon: Bell, count: announcements.length },
        { id: 'backups', label: 'النسخ وسلة المهملات', icon: HardDrive }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 39,
            backdropFilter: 'blur(3px)'
          }}
        />
      )}

      <aside className={`admin-sidebar ${isMobileNavOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--adm-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                لوحة المستر
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
                الإدارة والتحكم الشامل 🇬🇧
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsMobileNavOpen(false)}
            className="mobile-only-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--adm-text-muted)',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {NAV_GROUPS.map((grp, idx) => (
            <div key={idx}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--adm-text-muted)',
                padding: '0 0.75rem 0.4rem',
                letterSpacing: '0.02em'
              }}>
                {grp.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grp.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.6rem 0.85rem',
                        minHeight: '44px',
                        borderRadius: 'var(--adm-radius-md)',
                        background: isActive ? 'var(--adm-primary-light)' : 'transparent',
                        color: isActive ? 'var(--adm-primary)' : 'var(--adm-text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.88rem',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Icon size={18} color={isActive ? 'var(--adm-primary)' : 'currentColor'} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: isActive ? '#FFFFFF' : 'var(--adm-bg)',
                          color: isActive ? 'var(--adm-primary)' : 'var(--adm-text-muted)',
                          border: '1px solid var(--adm-card-border)'
                        }}>
                          {item.count}
                        </span>
                      )}
                      {item.badge && (
                        <span className="adm-badge adm-badge-warning" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--adm-card-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {onExitToStudentView && (
            <button
              onClick={onExitToStudentView}
              className="adm-btn adm-btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', gap: '8px' }}
            >
              <ExternalLink size={16} />
              <span>معاينة واجهة الطالب 👁️</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
