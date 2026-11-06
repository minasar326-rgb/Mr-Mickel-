import React, { useState, useMemo } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  CreditCard, Search, Pause, Play, Clock, ShieldAlert, 
  Trash2, Plus, Calendar, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';

export default function SubscriptionsSection() {
  const { 
    students = [], 
    stages = [], 
    pauseStudentSubscription, 
    resumeStudentSubscription, 
    freezeStudentAccount, 
    extendStudentSubscription, 
    cancelStudentSubscription, 
    subscriptionAuditLogs = [],
    addToast 
  } = useTeacher();

  const { activeStageId, searchQuery } = useAdminUI();
  const [subStatusFilter, setSubStatusFilter] = useState('all'); // all, active, paused, expired, frozen
  const [localSearch, setLocalSearch] = useState('');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Flatten all subscriptions across students
  const allSubscriptionItems = useMemo(() => {
    const list = [];
    students.forEach(std => {
      if (std.subscriptions) {
        Object.entries(std.subscriptions).forEach(([key, sub]) => {
          list.push({
            studentId: std.id,
            studentName: std.name,
            studentPhone: std.phone,
            studentCode: std.code,
            studentStageId: std.stageId,
            subKey: key,
            ...sub
          });
        });
      }
    });
    return list;
  }, [students]);

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    const now = Date.now();
    return allSubscriptionItems.filter(sub => {
      // Stage filter
      if (activeStageId !== 'all') {
        const matchStage = sub.stageId === activeStageId || sub.studentStageId === activeStageId;
        if (!matchStage) return false;
      }

      // Status filter
      const expTime = sub.expirationDate || sub.expiresAt ? new Date(sub.expirationDate || sub.expiresAt).getTime() : Infinity;
      const isExpired = expTime < now;

      if (subStatusFilter === 'active' && (sub.isPaused || sub.isFrozen || isExpired)) return false;
      if (subStatusFilter === 'paused' && !sub.isPaused) return false;
      if (subStatusFilter === 'expired' && !isExpired) return false;
      if (subStatusFilter === 'frozen' && !sub.isFrozen) return false;

      // Search term
      const term = (localSearch || searchQuery || '').toLowerCase().trim();
      if (!term) return true;
      const matchName = (sub.studentName || '').toLowerCase().includes(term);
      const matchPhone = (sub.studentPhone || '').includes(term);
      const matchTarget = (sub.targetTitle || sub.targetId || '').toLowerCase().includes(term);
      const matchCode = (sub.activationCode || '').toLowerCase().includes(term);
      return matchName || matchPhone || matchTarget || matchCode;
    });
  }, [allSubscriptionItems, activeStageId, subStatusFilter, localSearch, searchQuery]);

  // Counts
  const activeCount = allSubscriptionItems.filter(s => !s.isPaused && !s.isFrozen && (!s.expirationDate || new Date(s.expirationDate).getTime() >= Date.now())).length;
  const pausedCount = allSubscriptionItems.filter(s => s.isPaused).length;
  const expiredCount = allSubscriptionItems.filter(s => s.expirationDate && new Date(s.expirationDate).getTime() < Date.now()).length;
  const frozenCount = allSubscriptionItems.filter(s => s.isFrozen).length;

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview & Metric Cards */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                التحكم الكامل في اشتراكات الطلاب 🎫
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                إيقاف مؤقت، تمديد، تجميد حساب، وتفعيل استثنائي مع سجل تدقيق أمني
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="admin-btn admin-btn-secondary"
            style={{ gap: '8px' }}
          >
            <FileText size={16} />
            <span>سجل العمليات والتدقيق ({subscriptionAuditLogs.length})</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.25rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', borderRight: '4px solid #10B981', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>اشتراكات نشطة سارية:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>
              {activeCount}
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', borderRight: '4px solid #F59E0B', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>موقوفة مؤقتاً (Paused):</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>
              {pausedCount}
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', borderRight: '4px solid #EF4444', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>منتهية الصلاحية:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', marginTop: '4px' }}>
              {expiredCount}
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', borderRight: '4px solid #6366F1', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>حسابات مجمدة بالكامل:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6366F1', marginTop: '4px' }}>
              {frozenCount}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setSubStatusFilter('all')}
            className={`admin-btn admin-btn-sm ${subStatusFilter === 'all' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
          >
            الكل ({allSubscriptionItems.length})
          </button>
          <button
            type="button"
            onClick={() => setSubStatusFilter('active')}
            className={`admin-btn admin-btn-sm ${subStatusFilter === 'active' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
          >
            نشطة ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setSubStatusFilter('paused')}
            className={`admin-btn admin-btn-sm ${subStatusFilter === 'paused' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
          >
            موقوفة ({pausedCount})
          </button>
          <button
            type="button"
            onClick={() => setSubStatusFilter('expired')}
            className={`admin-btn admin-btn-sm ${subStatusFilter === 'expired' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
          >
            منتهية ({expiredCount})
          </button>
          <button
            type="button"
            onClick={() => setSubStatusFilter('frozen')}
            className={`admin-btn admin-btn-sm ${subStatusFilter === 'frozen' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
          >
            مجمدة ({frozenCount})
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
          <input
            type="text"
            placeholder="بحث باسم الطالب، كود التفعيل، المحتوى..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="admin-input"
            style={{ width: '100%', paddingRight: '36px' }}
          />
        </div>

        {/* Subscriptions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredSubscriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
              <CreditCard size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>لا توجد اشتراكات تطابق هذا الفلتر</p>
            </div>
          ) : (
            filteredSubscriptions.map((sub, idx) => {
              const isPaused = Boolean(sub.isPaused);
              const isFrozen = Boolean(sub.isFrozen);
              const expTime = sub.expirationDate || sub.expiresAt ? new Date(sub.expirationDate || sub.expiresAt).getTime() : Infinity;
              const isExpired = expTime < Date.now();

              return (
                <div
                  key={`${sub.studentId}-${sub.subKey}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--admin-bg-subtle)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-md)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)' }}>{sub.studentName}</strong>
                      <span className="admin-badge admin-badge-primary">{sub.targetTitle || sub.targetId}</span>
                      {isFrozen ? (
                        <span className="admin-badge admin-badge-accent">🔒 مجمد</span>
                      ) : isPaused ? (
                        <span className="admin-badge admin-badge-warning">⏸️ موقوف</span>
                      ) : isExpired ? (
                        <span className="admin-badge" style={{ background: '#FEF2F2', color: '#EF4444' }}>⌛ منتهي</span>
                      ) : (
                        <span className="admin-badge admin-badge-success">🟢 سارٍ</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color: 'var(--admin-text-muted)', flexWrap: 'wrap' }}>
                      <span>هاتف: {sub.studentPhone || 'غير مسجل'}</span>
                      <span>•</span>
                      <span>كود التفعيل: {sub.activationCode || 'يدوي'}</span>
                      <span>•</span>
                      <span>ينتهي في: {sub.expirationDate ? new Date(sub.expirationDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {isPaused ? (
                      <button
                        type="button"
                        onClick={() => {
                          resumeStudentSubscription(sub.studentId, sub.subKey);
                          addToast(`تم استئناف اشتراك الطالب ${sub.studentName} بنجاح ▶️`, 'success');
                        }}
                        className="admin-btn admin-btn-sm admin-btn-secondary"
                        style={{ color: '#10B981' }}
                      >
                        <Play size={14} /> <span>استئناف</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          pauseStudentSubscription(sub.studentId, sub.subKey, 'إيقاف إداري من المستر');
                          addToast(`تم إيقاف اشتراك الطالب ${sub.studentName} مؤقتاً ⏸️`, 'info');
                        }}
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        style={{ color: '#F59E0B' }}
                      >
                        <Pause size={14} /> <span>إيقاف مؤقت</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        extendStudentSubscription(sub.studentId, sub.subKey, 30);
                        addToast(`تم تمديد صلاحية اشتراك ${sub.studentName} بـ 30 يوماً إضافية 📅`, 'success');
                      }}
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                    >
                      <Plus size={14} /> <span>تمديد (+30 يوم)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        freezeStudentAccount(sub.studentId, !isFrozen, 'تجميد إداري');
                        addToast(`تم ${isFrozen ? 'فك تجميد' : 'تجميد'} حساب الطالب 🛡️`, 'warning');
                      }}
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      style={{ color: isFrozen ? '#10B981' : '#6366F1' }}
                    >
                      <ShieldAlert size={14} /> <span>{isFrozen ? 'فك التجميد' : 'تجميد الحساب'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من إلغاء اشتراك "${sub.studentName}" نهائياً؟`)) {
                          cancelStudentSubscription(sub.studentId, sub.subKey, 'إلغاء نهائي');
                          addToast('تم إلغاء الاشتراك 🗑️', 'info');
                        }
                      }}
                      className="admin-btn admin-btn-sm admin-btn-ghost"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="admin-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', background: 'var(--admin-bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                سجل العمليات والتدقيق الأمني (Audit Log) 📜
              </h3>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="admin-btn admin-btn-ghost"
              >
                إغلاق ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subscriptionAuditLogs.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '2rem 0' }}>
                  لا توجد عمليات مسجلة في سجل التدقيق بعد
                </p>
              ) : (
                subscriptionAuditLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--admin-bg-subtle)',
                      borderRadius: '8px',
                      border: '1px solid var(--admin-border)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--admin-text)' }}>{log.action || 'عملية اشتراك'}</strong>
                      <span style={{ display: 'block', color: 'var(--admin-text-muted)', fontSize: '0.78rem' }}>{log.details || log.reason}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('ar-EG') : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
