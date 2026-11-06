import React, { useState } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Calendar, Plus, Edit3, Trash2, Eye, EyeOff, 
  ArrowRight, Check, AlertTriangle, Layers, BookOpen, 
  Clock, ShieldCheck, Image, FolderX, Video
} from 'lucide-react';

export default function MonthsSection() {
  const { 
    sections, addSection, updateSection, deleteSection, 
    stages, lectures 
  } = useTeacher();

  const { activeStageId, setActiveStageId, setActiveTab, currentStage } = useAdminUI();

  // Form State
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [stageId, setStageId] = useState(() => (activeStageId !== 'all' ? activeStageId : (stages[0]?.id || 'sec-3')));
  const [type, setType] = useState('month'); // 'month' | 'course'
  const [monthNumber, setMonthNumber] = useState('1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('180');
  const [cover, setCover] = useState('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80');
  const [isVisible, setIsVisible] = useState(true);
  const [enforceProgression, setEnforceProgression] = useState(true);
  const [requiredWatchPercent, setRequiredWatchPercent] = useState(50);

  // Deletion Modal
  const [deletingSection, setDeletingSection] = useState(null);

  // Filter sections by active stage
  const isAll = activeStageId === 'all';
  const filteredSections = isAll 
    ? sections 
    : sections.filter(s => s.stageId === activeStageId);

  const handleSaveSection = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      stageId,
      type,
      monthNumber: type === 'month' ? Number(monthNumber) || 1 : null,
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      cover,
      isVisible,
      enforceProgression,
      requiredWatchPercent: Number(requiredWatchPercent) || 50
    };

    if (editingSectionId) {
      updateSection(editingSectionId, payload);
      setEditingSectionId(null);
    } else {
      addSection(payload);
    }

    // Reset Form
    setTitle('');
    setDescription('');
    setMonthNumber('1');
  };

  const handleStartEdit = (sec) => {
    setEditingSectionId(sec.id);
    setStageId(sec.stageId || stages[0]?.id || 'sec-3');
    setType(sec.type || 'month');
    setMonthNumber(String(sec.monthNumber || 1));
    setTitle(sec.title || '');
    setDescription(sec.description || '');
    setPrice(String(sec.price || 180));
    setCover(sec.cover || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80');
    setIsVisible(sec.isVisible !== false);
    setEnforceProgression(sec.enforceProgression !== false);
    setRequiredWatchPercent(sec.requiredWatchPercent || 50);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setTitle('');
    setDescription('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} color="var(--adm-primary)" />
            <span>إدارة الشهور والكورسات الدراسية</span>
          </h2>
          <p style={{ margin: 0, color: 'var(--adm-text-muted)', fontSize: '0.88rem' }}>
            {isAll 
              ? 'عرض كافة الشهور لجميع المراحل الدراسية' 
              : `استعراض شهور مرحلة: ${currentStage?.name || activeStageId}`}
          </p>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      <div className="adm-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingSectionId ? <Edit3 size={18} color="var(--adm-primary)" /> : <Plus size={18} color="var(--adm-primary)" />}
          <span>{editingSectionId ? 'تعديل بيانات الشهر / الكورس' : 'إضافة شهر دراسي أو كورس جديد 📅'}</span>
        </h3>

        <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المرحلة التعليمية:</label>
              <select
                value={stageId}
                onChange={e => setStageId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', outline: 'none', fontWeight: 700 }}
              >
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>نوع القسم:</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)', outline: 'none', fontWeight: 700 }}
              >
                <option value="month">📅 شهر دراسي (Month)</option>
                <option value="course">📁 كورس تدريبي كامل (Course)</option>
              </select>
            </div>

            {type === 'month' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رقم الشهر:</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={monthNumber}
                  onChange={e => setMonthNumber(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>سعر الكارت / الاشتراك (ج.م):</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان الشهر أو الكورس:</label>
              <input
                type="text"
                placeholder="مثال: الشهر الأول: شرح Units 1 & 2 وبنك الأسئلة"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>وصف محتوى الشهر:</label>
              <input
                type="text"
                placeholder="تفاصيل ما يحتويه الشهر من قواعد وكلمات ومهارات..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--adm-radius-md)', border: '1px solid var(--adm-card-border)', background: 'var(--adm-bg)', color: 'var(--adm-text-primary)' }}
              />
            </div>
          </div>

          {/* Progression Gate Settings */}
          <div style={{
            background: 'var(--adm-bg)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--adm-radius-md)',
            border: '1px solid var(--adm-card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={enforceProgression}
                onChange={e => setEnforceProgression(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--adm-primary)' }}
              />
              <span>تفعيل التتابع الإجباري (يشترط إنهاء ومشاهدة المحاضرة السابقة لفتح التالية) 🔒</span>
            </label>

            {enforceProgression && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--adm-text-secondary)', fontWeight: 600 }}>نسبة المشاهدة المطلوبة:</span>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={requiredWatchPercent}
                  onChange={e => setRequiredWatchPercent(e.target.value)}
                  style={{ width: '70px', padding: '6px', textAlign: 'center', borderRadius: '6px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', fontWeight: 800 }}
                />
                <span style={{ fontWeight: 800 }}>%</span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={e => setIsVisible(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--adm-primary)' }}
              />
              <span>ظاهر ومتاح للطلاب (إذا كان يحتوي على محاضرات منشورة)</span>
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              {editingSectionId && (
                <button type="button" onClick={handleCancelEdit} className="adm-btn adm-btn-secondary">
                  إلغاء التعديل
                </button>
              )}
              <button type="submit" className="adm-btn adm-btn-primary">
                {editingSectionId ? '💾 حفظ التعديلات' : '🚀 إضافة الشهر / الكورس'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sections List */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
          الشهور والكورسات المسجلة ({filteredSections.length})
        </h3>

        {filteredSections.length === 0 ? (
          <div className="adm-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--adm-text-muted)' }}>
            <FolderX size={44} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--adm-text-primary)' }}>لا توجد شهور أو كورسات مضافة بعد</h4>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>استخدم النموذج أعلاه لإضافة أول شهر دراسي لهذه المرحلة.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredSections.map(sec => {
              const lecturesInSection = lectures.filter(l => !l.isDeleted && l.sectionId === sec.id);
              const isEmpty = lecturesInSection.length === 0;
              const stageName = stages.find(s => s.id === sec.stageId)?.name || sec.stageId;

              return (
                <div
                  key={sec.id}
                  className="adm-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    borderRight: isEmpty ? '4px solid var(--adm-warning)' : '4px solid var(--adm-success)',
                    background: isEmpty ? 'var(--adm-warning-light)' : 'var(--adm-card-bg)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--adm-primary)' }}>
                          🎓 {stageName}
                        </span>
                        <h4 style={{ margin: '4px 0 2px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--adm-text-primary)' }}>
                          {sec.title}
                        </h4>
                        <code style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>
                          ID: {sec.id}
                        </code>
                      </div>

                      {/* Empty vs Populated Status Badge */}
                      {isEmpty ? (
                        <span className="adm-badge adm-badge-warning" title="هذا الشهر لا يظهر للطلاب لعدم وجود محاضرات منشورة بداخله">
                          <FolderX size={13} />
                          <span>فاضي - مخفي عن الطلاب</span>
                        </span>
                      ) : (
                        <span className="adm-badge adm-badge-success">
                          <Video size={13} />
                          <span>{lecturesInSection.length} محاضرات منشورة</span>
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--adm-text-secondary)', lineHeight: 1.5 }}>
                      {sec.description || 'محتوى شامل وشرح تفصيلي للمنهج.'}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--adm-bg)',
                      borderRadius: 'var(--adm-radius-md)',
                      fontSize: '0.78rem'
                    }}>
                      <span style={{ color: 'var(--adm-text-muted)' }}>سعر الاشتراك:</span>
                      <strong style={{ color: 'var(--adm-primary)', fontSize: '0.92rem' }}>{sec.price || 180} ج.م</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--adm-card-border)', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() => {
                        setActiveStageId(sec.stageId);
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
                      <span>{isEmpty ? '+ إضافة محاضرة للشهر' : 'عرض المحاضرات'}</span>
                      <ArrowRight size={14} />
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleStartEdit(sec)}
                        className="adm-btn adm-btn-secondary"
                        style={{ padding: '6px 10px', minHeight: '36px' }}
                        title="تعديل بيانات الشهر"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingSection(sec)}
                        className="adm-btn adm-btn-danger"
                        style={{ padding: '6px 10px', minHeight: '36px', background: 'var(--adm-danger-light)', color: 'var(--adm-danger)', borderColor: 'var(--adm-danger-border)' }}
                        title="حذف الشهر"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Section Modal */}
      {deletingSection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="adm-card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 0.75rem', color: 'var(--adm-danger)' }}>
              تأكيد حذف الشهر: {deletingSection.title}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--adm-text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              سيتم حذف هذا القسم، وسيتم الحفاظ على أي محاضرات كانت بداخله بنقلها إلى المحاضرات العامة غير المحددة بقسم حتى لا تضيع أي بيانات.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeletingSection(null)} className="adm-btn adm-btn-secondary">
                إلغاء
              </button>
              <button 
                onClick={() => {
                  deleteSection(deletingSection.id);
                  setDeletingSection(null);
                }} 
                className="adm-btn adm-btn-danger"
              >
                تأكيد الحذف 🗑️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
