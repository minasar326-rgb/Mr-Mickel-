import React from 'react';
import { useAdminUI } from '../context/AdminUIContext';
import { useTeacher } from '../../../context/TeacherContext';
import { 
  Users, CreditCard, Video, AlertTriangle, Calendar, DollarSign, 
  Upload, Key, Search, Clock, ShieldCheck, CheckCircle2, 
  ExternalLink, ArrowRight, Sparkles, FolderX, HelpCircle
} from 'lucide-react';

export default function DashboardSection() {
  const { activeStageId, setActiveTab, currentStage } = useAdminUI();
  const { 
    students, lectures, sections, accessCodes, 
    transactions, platformAuditLogs, totalCollectedRevenue 
  } = useTeacher();

  // 1. Filtered data by active stage (or all)
  const isAllStages = activeStageId === 'all';
  const stageLectures = isAllStages ? lectures : lectures.filter(l => l.stageId === activeStageId);
  const stageSections = isAllStages ? sections : sections.filter(s => s.stageId === activeStageId);
  const stageStudents = isAllStages ? students : students.filter(s => s.stageId === activeStageId);
  const stageCodes = isAllStages ? accessCodes : accessCodes.filter(c => c.stageId === activeStageId);

  // 2. Metrics calculation
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // A: New students last 7 days
  const newStudentsCount = stageStudents.filter(std => {
    return std.joinedDate && std.joinedDate >= sevenDaysAgo;
  }).length;

  // B: Expiring subscriptions (within 7 days)
  let expiringSubsCount = 0;
  stageStudents.forEach(std => {
    if (std.subscriptions) {
      Object.values(std.subscriptions).forEach(sub => {
        if (sub && sub.expirationDate) {
          const expTime = new Date(sub.expirationDate).getTime();
          const diffDays = (expTime - now) / (1000 * 60 * 60 * 24);
          if (diffDays >= 0 && diffDays <= 7) expiringSubsCount++;
        }
      });
    }
  });

  // C: Codes redeemed today
  const codesUsedTodayCount = transactions.filter(t => {
    return t.date && t.date.startsWith(todayStr) && t.paymentMethod === 'code';
  }).length;

  // D: Videos pending / failed / needing sync
  const pendingVideosCount = stageLectures.filter(l => {
    return !l.isDeleted && (!l.videoUrl || l.videoStatus === 'uploading' || l.videoStatus === 'failed');
  }).length;

  // E: Empty months/sections (0 published lectures)
  const emptySections = stageSections.filter(sec => {
    const count = stageLectures.filter(l => !l.isDeleted && l.sectionId === sec.id).length;
    return count === 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
        color: '#FFFFFF',
        borderRadius: 'var(--adm-radius-xl)',
        padding: '1.75rem 2rem',
        boxShadow: 'var(--adm-shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.65rem' }}>
            <Sparkles size={14} /> <span>لوحة القيادة المباشرة</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.4rem 0' }}>
            أهلاً بك يا مستر مايكل 🇬🇧
          </h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.92rem' }}>
            {isAllStages 
              ? 'متابعة شاملة لكافة المراحل التعليمية والمحاضرات والطلاب' 
              : `أنت الآن تستعرض بيانات: ${currentStage?.name || activeStageId}`}
          </p>
        </div>

        {/* Quick Launch Action Pills */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('lectures')} 
            className="adm-btn adm-btn-primary"
            style={{ fontSize: '0.86rem', padding: '0.6rem 1.1rem' }}
          >
            <Upload size={16} />
            <span>رفع محاضرة سريعة</span>
          </button>
          <button 
            onClick={() => setActiveTab('codes')} 
            className="adm-btn adm-btn-secondary"
            style={{ fontSize: '0.86rem', padding: '0.6rem 1.1rem', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Key size={16} />
            <span>توليد كروت شحن</span>
          </button>
        </div>
      </div>

      {/* 6 Key Operational Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* Metric 1: New Students */}
        <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>طلاب جدد (7 أيام)</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--adm-info-light)', color: 'var(--adm-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--adm-text-primary)' }}>
            {newStudentsCount}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
            من إجمالي {stageStudents.length} طالب
          </span>
        </div>

        {/* Metric 2: Expiring Subscriptions */}
        <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>اشتراكات تنتهي قريباً</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--adm-warning-light)', color: 'var(--adm-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: expiringSubsCount > 0 ? 'var(--adm-warning)' : 'var(--adm-text-primary)' }}>
            {expiringSubsCount}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
            تحتاج متابعة وتجديد هذا الأسبوع
          </span>
        </div>

        {/* Metric 3: Codes Used Today */}
        <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>كروت شحنت اليوم</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--adm-success-light)', color: 'var(--adm-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--adm-success)' }}>
            {codesUsedTodayCount}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
            تفعيل ناجح ومؤكد سحابياً
          </span>
        </div>

        {/* Metric 4: Videos Pending / Sync Notice */}
        <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>فيديوهات تتطلب فحص</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: pendingVideosCount > 0 ? 'var(--adm-danger-light)' : 'var(--adm-success-light)', color: pendingVideosCount > 0 ? 'var(--adm-danger)' : 'var(--adm-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pendingVideosCount > 0 ? <AlertTriangle size={18} /> : <Video size={18} />}
            </div>
          </div>
          <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingVideosCount > 0 ? 'var(--adm-danger)' : 'var(--adm-text-primary)' }}>
            {pendingVideosCount}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
            {pendingVideosCount === 0 ? 'جميع الفيديوهات جاهزة على R2' : 'بحاجة لاستكمال الرفع السحابي'}
          </span>
        </div>

        {/* Metric 5: Empty Months / Sections */}
        <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>أشهر فارغة (مخفية)</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--adm-purple-light)', color: 'var(--adm-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderX size={18} />
            </div>
          </div>
          <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--adm-text-primary)' }}>
            {emptySections.length}
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
            مخفية تلقائياً عن الطلاب
          </span>
        </div>

        {/* Metric 6: Total Collected Revenue */}
        <div className="adm-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>إجمالي الخزينة</span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--adm-primary-light)', color: 'var(--adm-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--adm-primary)' }}>
            {totalCollectedRevenue.toLocaleString()} ج.م
          </strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)' }}>
            إيراد محصل من كروت الشحن
          </span>
        </div>
      </div>

      {/* Empty Months Warning Section (If any exist) */}
      {emptySections.length > 0 && (
        <div className="adm-card" style={{ borderRight: '4px solid var(--adm-warning)', background: 'var(--adm-warning-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FolderX size={22} color="var(--adm-warning)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#92400E' }}>
                  تنبيه: يوجد {emptySections.length} شهور / كورسات فارغة مضافة بالنظام
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#78350F' }}>
                  هذه الشهور مخفية تماماً عن الطلاب لحين إضافة محاضرات منشورة بداخلها.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('sections')}
              className="adm-btn adm-btn-secondary"
              style={{ fontSize: '0.82rem', borderColor: 'var(--adm-warning-border)', background: '#FFFFFF' }}
            >
              <span>إدارة الشهور والكورسات</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Two-Column Grid: Quick Actions + Centralized Audit Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Quick Operations Panel */}
        <div className="adm-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--adm-primary)" />
            <span>إجراءات سريعة ومباشرة</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('lectures')}
              className="adm-btn adm-btn-secondary"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} color="var(--adm-primary)" />
                <span>رفع وإعداد محاضرة جديدة (فيديو + امتحان + مذكرة)</span>
              </div>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setActiveTab('codes')}
              className="adm-btn adm-btn-secondary"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={16} color="var(--adm-primary)" />
                <span>توليد دفعة كروت شحن جديدة (أشهر / كورسات / محاضرات)</span>
              </div>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className="adm-btn adm-btn-secondary"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--adm-primary)" />
                <span>البحث عن طالب وتسجيل اشتراك استثنائي</span>
              </div>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className="adm-btn adm-btn-secondary"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={16} color="var(--adm-primary)" />
                <span>قائمة تصحيح الامتحانات المقالية اليدوية</span>
              </div>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Centralized Audit Trail Preview */}
        <div className="adm-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--adm-success)" />
              <span>آخر العمليات وسجل الرقابة (Audit Log)</span>
            </h3>
            <button
              onClick={() => setActiveTab('backups')}
              style={{ background: 'none', border: 'none', color: 'var(--adm-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
            >
              عرض السجل كاملاً
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.isArray(platformAuditLogs) && platformAuditLogs.length > 0 ? (
              platformAuditLogs.slice(0, 5).map((log, idx) => (
                <div 
                  key={log.id || idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--adm-radius-md)',
                    background: 'var(--adm-bg)',
                    border: '1px solid var(--adm-card-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--adm-primary)' }} />
                    <span style={{ fontWeight: 700, color: 'var(--adm-text-primary)' }}>
                      {log.actionDescription || log.action || 'عملية إدارية'}
                    </span>
                  </div>
                  <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.74rem' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--adm-text-muted)', fontSize: '0.85rem' }}>
                لا توجد عمليات مسجلة حديثاً بالسجل.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
