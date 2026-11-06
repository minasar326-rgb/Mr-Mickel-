import React, { useState } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  BookOpen, Plus, Trash2, Edit3, Eye, EyeOff, 
  ArrowRight, Check, AlertTriangle, Layers, DollarSign, Award
} from 'lucide-react';

export default function StagesSection() {
  const { stages, addStage, updateStage, deleteStage, lectures, sections, students, accessCodes } = useTeacher();
  const { setActiveStageId, setActiveTab } = useAdminUI();

  // Create Stage State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [pricePerMonth, setPricePerMonth] = useState('150 ج.م');
  const [badge, setBadge] = useState('دفعة 2026 🔥');
  const [description, setDescription] = useState('');
  const [isHidden, setIsHidden] = useState(false);

  // Edit Stage State
  const [editingStage, setEditingStage] = useState(null);

  // Delete / Migrate Modal State
  const [deletingStage, setDeletingStage] = useState(null);
  const [migrateTargetStageId, setMigrateTargetStageId] = useState('');

  const handleCreateStage = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addStage({
      name: name.trim(),
      slug: slug.trim() || name.trim().replace(/\s+/g, '-'),
      pricePerMonth: pricePerMonth.trim() || '150 ج.م',
      badge: badge.trim() || 'دفعة 2026',
      description: description.trim() || 'محتوى شامل ومنهج تدريبي متكامل.',
      isHidden,
      order: stages.length + 1
    });

    setName('');
    setSlug('');
    setDescription('');
    setIsHidden(false);
  };

  const handleUpdateStage = async (e) => {
    e.preventDefault();
    if (!editingStage || !editingStage.name.trim()) return;

    await updateStage(editingStage.id, {
      name: editingStage.name.trim(),
      pricePerMonth: editingStage.pricePerMonth,
      badge: editingStage.badge,
      description: editingStage.description,
      isHidden: editingStage.isHidden,
      order: Number(editingStage.order) || 1
    });

    setEditingStage(null);
  };

  const confirmDeleteStage = async () => {
    if (!deletingStage) return;
    await deleteStage(deletingStage.id, migrateTargetStageId || null);
    setDeletingStage(null);
    setMigrateTargetStageId('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={24} color="var(--adm-primary)" />
            <span>إدارة المراحل والصفوف الدراسية</span>
          </h2>
          <p style={{ margin: 0, color: 'var(--adm-text-muted)', fontSize: '0.88rem' }}>
            كل مرحلة كيان مستقل بذاته له معرّف فريد لا يتغير، وتفصل بينها المحاضرات والأشهر والأكواد والاشتراكات.
          </p>
        </div>
      </div>

      {/* Add Stage Card */}
      <div className="adm-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} color="var(--adm-primary)" />
          <span>إضافة مرحلة تعليمية أو صف جديد 🎓</span>
        </h3>

        <form onSubmit={handleCreateStage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم المرحلة أو الصف:</label>
              <input
                type="text"
                placeholder="مثال: الصف الخامس الابتدائي"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المعرّف الفريد (Slug / ID اختياري):</label>
              <input
                type="text"
                placeholder="مثال: pri-5 أو sec-2"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سعر الاشتراك الشهري:</label>
              <input
                type="text"
                placeholder="150 ج.م"
                value={pricePerMonth}
                onChange={e => setPricePerMonth(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>شارة المرحلة (Badge):</label>
              <input
                type="text"
                placeholder="الدفعة الذهبية 2026 🔥"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>وصف المنهج والمسار:</label>
            <input
              type="text"
              placeholder="وصف مختصر لمحتوى المرحلة يظهر للطلاب في الصفحة الرئيسية..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={isHidden}
                onChange={e => setIsHidden(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--adm-primary)' }}
              />
              <span>إخفاء المرحلة مؤقتاً عن واجهة الطلاب</span>
            </label>

            <button type="submit" className="adm-btn adm-btn-primary">
              <Plus size={16} />
              <span>إضافة وتثبيت المرحلة 🎓</span>
            </button>
          </div>
        </form>
      </div>

      {/* Stages Grid */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
          المراحل المسجلة حالياً بالمنصة ({stages.length})
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem'
        }}>
          {stages.map(stg => {
            const stageLecCount = lectures.filter(l => !l.isDeleted && l.stageId === stg.id).length;
            const stageSecCount = sections.filter(s => s.stageId === stg.id).length;
            const stageStdCount = students.filter(std => std.stageId === stg.id).length;

            return (
              <div 
                key={stg.id} 
                className="adm-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderTop: `4px solid ${stg.color || 'var(--adm-primary)'}`,
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--adm-text-primary)' }}>
                        {stg.name}
                      </h4>
                      <code style={{ fontSize: '0.75rem', color: 'var(--adm-text-muted)', background: 'var(--adm-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                        ID: {stg.id}
                      </code>
                    </div>

                    {stg.isHidden ? (
                      <span className="adm-badge adm-badge-warning">
                        <EyeOff size={12} /> <span>مخفية للطلاب</span>
                      </span>
                    ) : (
                      <span className="adm-badge adm-badge-success">
                        <Eye size={12} /> <span>نشطة وظاهرة</span>
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--adm-text-secondary)', lineHeight: 1.5 }}>
                    {stg.description || 'منهج تدريبي متكامل وشرح لكافة الوحدات والامتحانات.'}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                    textAlign: 'center',
                    padding: '8px',
                    background: 'var(--adm-bg)',
                    borderRadius: 'var(--adm-radius-md)',
                    border: '1px solid var(--adm-card-border)',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <span style={{ display: 'block', color: 'var(--adm-text-muted)' }}>المحاضرات</span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--adm-primary)' }}>{stageLecCount}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', color: 'var(--adm-text-muted)' }}>الشهور</span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--adm-text-primary)' }}>{stageSecCount}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', color: 'var(--adm-text-muted)' }}>الطلاب</span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--adm-text-primary)' }}>{stageStdCount}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--adm-card-border)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setActiveStageId(stg.id);
                      setActiveTab('lectures');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--adm-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>عرض محتوى المرحلة</span>
                    <ArrowRight size={14} />
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setEditingStage(stg)}
                      className="adm-btn adm-btn-secondary"
                      style={{ padding: '6px 10px', minHeight: '36px' }}
                      title="تعديل بيانات المرحلة"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeletingStage(stg)}
                      className="adm-btn adm-btn-danger"
                      style={{ padding: '6px 10px', minHeight: '36px', background: 'var(--adm-danger-light)', color: 'var(--adm-danger)', borderColor: 'var(--adm-danger-border)' }}
                      title="حذف المرحلة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Stage Modal */}
      {editingStage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="adm-card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 1rem' }}>
              تعديل المرحلة: {editingStage.name}
            </h3>

            <form onSubmit={handleUpdateStage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>اسم المرحلة:</label>
                <input
                  type="text"
                  value={editingStage.name}
                  onChange={e => setEditingStage({ ...editingStage, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سعر الشهر:</label>
                <input
                  type="text"
                  value={editingStage.pricePerMonth || ''}
                  onChange={e => setEditingStage({ ...editingStage, pricePerMonth: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الشارة:</label>
                <input
                  type="text"
                  value={editingStage.badge || ''}
                  onChange={e => setEditingStage({ ...editingStage, badge: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>الوصف:</label>
                <textarea
                  value={editingStage.description || ''}
                  onChange={e => setEditingStage({ ...editingStage, description: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', fontFamily: 'inherit' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={Boolean(editingStage.isHidden)}
                  onChange={e => setEditingStage({ ...editingStage, isHidden: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--adm-primary)' }}
                />
                <span>إخفاء المرحلة عن واجهة الطلاب</span>
              </label>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditingStage(null)} className="adm-btn adm-btn-secondary">
                  إلغاء
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Migration Modal */}
      {deletingStage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="adm-card" style={{ maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--adm-danger)', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--adm-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
                تأكيد حذف المرحلة: {deletingStage.name}
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              تحذير: تحتوي هذه المرحلة على{' '}
              <strong>{lectures.filter(l => l.stageId === deletingStage.id).length} محاضرات</strong> و{' '}
              <strong>{sections.filter(s => s.stageId === deletingStage.id).length} شهور وكورسات</strong>.
            </p>

            <div style={{ background: 'var(--adm-bg)', padding: '1rem', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, marginBottom: '6px' }}>
                خيار نقل المحتوى إلى مرحلة بديلة بدلاً من حذفه:
              </label>
              <select
                value={migrateTargetStageId}
                onChange={e => setMigrateTargetStageId(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: 'var(--adm-text-primary)' }}
              >
                <option value="">-- حذف المحتوى نهائياً دون نقل --</option>
                {stages.filter(s => s.id !== deletingStage.id).map(s => (
                  <option key={s.id} value={s.id}>
                    نقل كافة المحاضرات إلى: {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeletingStage(null)} className="adm-btn adm-btn-secondary">
                إلغاء التراجع
              </button>
              <button onClick={confirmDeleteStage} className="adm-btn adm-btn-danger">
                تأكيد الحذف {migrateTargetStageId ? 'مع النقل 🔄' : 'النهائي 🗑️'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
