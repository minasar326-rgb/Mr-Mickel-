import React, { useState, useMemo } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Users, Search, Plus, Phone, Calendar, CheckCircle2, 
  AlertCircle, ShieldAlert, Edit, Trash2, Smartphone, DollarSign
} from 'lucide-react';

export default function StudentsSection() {
  const { students = [], stages = [], addToast, updateStudentProfile } = useTeacher();
  const { activeStageId, searchQuery } = useAdminUI();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(std => {
      if (activeStageId !== 'all' && std.stageId && std.stageId !== activeStageId) return false;
      const term = (localSearch || searchQuery || '').toLowerCase().trim();
      if (!term) return true;
      const matchName = (std.name || '').toLowerCase().includes(term);
      const matchPhone = (std.phone || '').includes(term);
      const matchCode = (std.code || '').toLowerCase().includes(term);
      return matchName || matchPhone || matchCode;
    });
  }, [students, activeStageId, localSearch, searchQuery]);

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header & Stats */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                دليل وسجل الطلاب المسجلين ({filteredStudents.length}) 👨‍🎓
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                بيانات الطلاب، أرقام الهواتف، المرحلة الدراسية، وحالة النشاط
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)' }} />
            <input
              type="text"
              placeholder="بحث باسم الطالب أو الهاتف..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="admin-input"
              style={{ width: '100%', paddingRight: '36px' }}
            />
          </div>
        </div>

        {/* Student Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredStudents.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
              <Users size={40} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>لا يوجد طلاب يطابقون هذا الفلتر</p>
            </div>
          ) : (
            filteredStudents.map(std => {
              const stage = stages.find(s => s.id === std.stageId);
              const subCount = Object.keys(std.subscriptions || {}).length;

              return (
                <div
                  key={std.id}
                  style={{
                    padding: '1.25rem',
                    background: 'var(--admin-bg-subtle)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span className="admin-badge admin-badge-primary">
                        {stage?.name || std.stageName || 'المرحلة'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                        كود: {std.code || std.id}
                      </span>
                    </div>

                    <strong style={{ fontSize: '1.05rem', color: 'var(--admin-text)', display: 'block', marginBottom: '4px' }}>
                      {std.name}
                    </strong>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} />
                        <span>طالب: {std.phone || 'غير مسجل'}</span>
                      </div>
                      {std.parentPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} />
                          <span>ولي أمر: {std.parentPhone} ({std.parentName || 'ولي الأمر'})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="admin-badge admin-badge-success" style={{ fontSize: '0.75rem' }}>
                      {subCount} اشتراكات نشطة
                    </span>

                    {std.phone && (
                      <a
                        href={`https://wa.me/2${std.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn admin-btn-sm admin-btn-ghost"
                        style={{ color: '#10B981', gap: '4px' }}
                      >
                        <span>واتساب 💬</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
