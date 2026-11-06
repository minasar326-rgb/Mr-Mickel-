import React, { useState, useRef } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Settings, User, Shield, Users, Database, 
  Trash2, Download, Upload, CheckCircle2, Phone, Save
} from 'lucide-react';
import { uploadTeacherAvatarToR2 } from '../../../services/r2Storage';

export default function SettingsSection() {
  const { 
    teacherProfile = {}, 
    updateTeacherProfile, 
    lectures = [], 
    students = [], 
    accessCodes = [], 
    stages = [], 
    sections = [],
    adminUsers = [],
    addAdminUser,
    removeAdminUser,
    restoreLecture,
    addToast 
  } = useTeacher();

  const [activeSubTab, setActiveSubTab] = useState('profile'); // profile, security, staff, backups

  // Profile Form State
  const [name, setName] = useState(teacherProfile.name || 'مستر مايكل شحاته');
  const [subject, setSubject] = useState(teacherProfile.subject || 'لغة إنجليزية');
  const [bio, setBio] = useState(teacherProfile.bio || 'خبير تدريس اللغة الإنجليزية للثانوية العامة والإعدادية');
  const [unifiedPhone, setUnifiedPhone] = useState(teacherProfile.unifiedPhone || '01012345678');
  const [whatsapp, setWhatsapp] = useState(teacherProfile.whatsapp || '01012345678');
  
  // Hero Dynamic Badges
  const [welcomeBadge, setWelcomeBadge] = useState(teacherProfile.welcomeBadge || 'The Master of English 🇬🇧');
  const [heroSlogan, setHeroSlogan] = useState(teacherProfile.heroSlogan || 'رحلتك للتفوق والدرجة النهائية تبدأ من هنا');
  const [heroDescription, setHeroDescription] = useState(teacherProfile.heroDescription || 'منصة تعليمية متكاملة لجميع المراحل التعليمية');
  const [statBadgeNumber, setStatBadgeNumber] = useState(teacherProfile.statBadgeNumber || '+15 سنة');
  const [supportBadgeTitle, setSupportBadgeTitle] = useState(teacherProfile.supportBadgeTitle || 'دعم ومتابعة مستمرة');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(teacherProfile.avatar || './teacher-avatar.jpg');
  const avatarInputRef = useRef(null);

  // Staff State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('assistant');

  // Deleted Lectures for Trash Recovery
  const deletedLectures = lectures.filter(l => l.isDeleted);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      setAvatarPreview(ev.target.result);
      addToast('جاري رفع صورة المعلم إلى السحابة... ⏳', 'info');
      try {
        const res = await uploadTeacherAvatarToR2(file);
        if (res && res.downloadUrl) {
          updateTeacherProfile({ avatar: res.downloadUrl });
          addToast('✅ تم تحديث ورفع صورة المعلم بنجاح!', 'success');
        }
      } catch (err) {
        console.warn('Avatar upload notice:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateTeacherProfile({
      name: name.trim(),
      subject: subject.trim(),
      bio: bio.trim(),
      unifiedPhone: unifiedPhone.trim(),
      whatsapp: whatsapp.trim(),
      welcomeBadge: welcomeBadge.trim(),
      heroSlogan: heroSlogan.trim(),
      heroDescription: heroDescription.trim(),
      statBadgeNumber: statBadgeNumber.trim(),
      supportBadgeTitle: supportBadgeTitle.trim()
    });
    addToast('✅ تم حفظ وتحديث بيانات المعلم والواجهة بنجاح!', 'success');
  };

  const handleExportBackup = () => {
    const fullBackup = {
      timestamp: new Date().toISOString(),
      platform: 'The Master LMS - Mr. Michael Shehata',
      teacherProfile,
      stages,
      sections,
      lectures,
      students,
      accessCodes
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-mnasa-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('تم تصدير وتنزيل النسخة الاحتياطية بنجاح 💾', 'success');
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!staffEmail.trim() || !staffName.trim()) return;

    if (addAdminUser) {
      addAdminUser({
        email: staffEmail.trim(),
        name: staffName.trim(),
        role: staffRole
      });
      addToast(`تمت إضافة المساعد "${staffName}" بنجاح 👤`, 'success');
    }
    setStaffEmail('');
    setStaffName('');
  };

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Sub-tab Navigation */}
      <div className="admin-card" style={{ padding: '1.25rem 2rem', background: 'var(--admin-bg-surface)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`admin-btn ${activeSubTab === 'profile' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
        >
          <User size={16} /> <span>بيانات المعلم والواجهة 👤</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('staff')}
          className={`admin-btn ${activeSubTab === 'staff' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
        >
          <Users size={16} /> <span>المساعدون والصلاحيات 👥</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('backups')}
          className={`admin-btn ${activeSubTab === 'backups' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
        >
          <Database size={16} /> <span>النسخ الاحتياطي وسلة المحذوفات 💾</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: TEACHER PROFILE & HERO CUSTOMIZATION */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'profile' && (
        <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--admin-text)' }}>
            تخصيص بيانات المعلم وشعار الواجهة (Teacher Profile & Branding) 🎨
          </h2>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Avatar & Basic Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <img
                src={avatarPreview}
                alt="Teacher Avatar"
                style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--admin-primary)' }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="admin-btn admin-btn-secondary"
              >
                تغيير الصورة الشخصية 📷
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  اسم المعلم:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  المادة التعليمية:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  رقم الهاتف الموحد / الخط الساخن:
                </label>
                <input
                  type="text"
                  value={unifiedPhone}
                  onChange={e => setUnifiedPhone(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  رقم الواتساب الرسمي للدعم:
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                نبذة عن المعلم (Bio):
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="admin-input"
                style={{ width: '100%', minHeight: '80px' }}
              />
            </div>

            {/* Dynamic Hero Badges */}
            <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--admin-text)' }}>
                نصوص وبطاقات الشاشة الرئيسية (Hero Section):
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                    شارة الترحيب العلوية:
                  </label>
                  <input
                    type="text"
                    value={welcomeBadge}
                    onChange={e => setWelcomeBadge(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                    الشعار الرئيسي (Slogan):
                  </label>
                  <input
                    type="text"
                    value={heroSlogan}
                    onChange={e => setHeroSlogan(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                    رقم شارة الإنجاز:
                  </label>
                  <input
                    type="text"
                    value={statBadgeNumber}
                    onChange={e => setStatBadgeNumber(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                    عنوان شارة الدعم:
                  </label>
                  <input
                    type="text"
                    value={supportBadgeTitle}
                    onChange={e => setSupportBadgeTitle(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="admin-btn admin-btn-primary admin-btn-lg"
              style={{ alignSelf: 'flex-start', minWidth: '200px', fontWeight: 900 }}
            >
              <Save size={18} /> <span>حفظ وتثبيت البيانات 💾</span>
            </button>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: STAFF & RBAC */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'staff' && (
        <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--admin-text)' }}>
            إدارة المساعدين وصلاحيات لوحة التحكم (Staff RBAC) 👥
          </h2>

          <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                اسم المساعد:
              </label>
              <input
                type="text"
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                placeholder="مثال: أ. أحمد (مشرف مرحلة)"
                className="admin-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                البريد الإلكتروني (Google):
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={e => setStaffEmail(e.target.value)}
                placeholder="assistant@gmail.com"
                className="admin-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                الدور / الصلاحية:
              </label>
              <select
                value={staffRole}
                onChange={e => setStaffRole(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value="assistant">مساعد (متابعة وتصحيح)</option>
                <option value="instructor">معلم مساعد (رفع محاضرات)</option>
                <option value="admin">مشرف إداري (كامل الصلاحيات)</option>
              </select>
            </div>

            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              style={{ fontWeight: 800 }}
            >
              إضافة المساعد 👤
            </button>
          </form>

          {/* Staff List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {adminUsers.map(u => (
              <div
                key={u.id || u.email}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--admin-bg-subtle)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--admin-radius-md)'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)' }}>{u.name || u.email}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>{u.email}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="admin-badge admin-badge-primary">
                    {u.role === 'super_admin' ? 'المالك الرئيسي' : u.role === 'admin' ? 'مشرف إداري' : 'مساعد'}
                  </span>
                  {u.role !== 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => removeAdminUser && removeAdminUser(u.id || u.email)}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: BACKUPS & TRASH RECOVERY */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'backups' && (
        <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--admin-text)' }}>
            النسخ الاحتياطي وسلة المحذوفات (Backup & Recovery) 💾
          </h2>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportBackup}
              className="admin-btn admin-btn-primary admin-btn-lg"
              style={{ fontWeight: 800 }}
            >
              <Download size={18} />
              <span>تصدير نسخة احتياطية كاملة (JSON Backup) 💾</span>
            </button>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--admin-text)' }}>
            سلة المحاضرات المحذوفة مؤقتاً ({deletedLectures.length}):
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deletedLectures.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                سلة المحذوفات فارغة حالياً
              </p>
            ) : (
              deletedLectures.map(lec => (
                <div
                  key={lec.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--admin-bg-subtle)',
                    border: '1px solid var(--admin-border)',
                    borderRadius: 'var(--admin-radius-md)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)' }}>{lec.title}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block' }}>
                      المرحلة: {stages.find(s => s.id === lec.stageId)?.name || lec.stageId}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (restoreLecture) restoreLecture(lec.id);
                      addToast(`تم استرجاع محاضرة "${lec.title}" بنجاح! 🔄`, 'success');
                    }}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    استرجاع للمنصة 🔄
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
