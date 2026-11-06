import React, { useState } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  Bell, Send, Trash2, Megaphone, CheckCircle2, 
  Smartphone, Users, Calendar
} from 'lucide-react';
import { dispatchExternalNotification } from '../../../services/pushNotificationService';

export default function AnnouncementsSection() {
  const { announcements = [], postAnnouncement, deleteAnnouncement, stages = [], students = [], addToast } = useTeacher();
  const { activeStageId } = useAdminUI();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('all'); // all, stage, student
  const [targetStage, setTargetStage] = useState(activeStageId !== 'all' ? activeStageId : (stages[0]?.id || 'sec-3'));
  const [targetStudent, setTargetStudent] = useState('');
  const [sendPush, setSendPush] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      addToast('يرجى كتابة عنوان ونص التنبيه', 'error');
      return;
    }

    let audienceDetails = 'الكل';
    if (audience === 'stage') {
      const stg = stages.find(s => s.id === targetStage);
      audienceDetails = stg ? stg.name : 'مرحلة دراسية';
    } else if (audience === 'student') {
      const std = students.find(s => s.id === targetStudent);
      audienceDetails = std ? `طالب: ${std.name}` : 'طالب محدد';
    }

    const fullContent = audience === 'all' 
      ? content.trim() 
      : `[موجه إلى: ${audienceDetails}]\n${content.trim()}`;

    await postAnnouncement(title.trim(), fullContent);

    if (sendPush) {
      await dispatchExternalNotification({
        title: title.trim(),
        body: content.trim(),
        url: './',
        tag: `ms-ann-${Date.now()}`,
        targetAudience: audience
      });
      addToast('تم إرسال التنبيه ونشر الإشعار الخارجي (Push Notification) بنجاح 🔔📲', 'success');
    } else {
      addToast('تم نشر التنبيه بنجاح داخل المنصة 📢', 'success');
    }

    setTitle('');
    setContent('');
  };

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Broadcast Form */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
              إذاعة ونشر التنبيهات للطلاب (Broadcast Notifications) 📢
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
              إرسال إشعارات فورية داخل المنصة وإشعارات Push للهواتف الذكية للطلاب
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                عنوان التنبيه:
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: موعد المحاضرة القادمة وحل الواجب"
                className="admin-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                الجمهور المستهدف:
              </label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value="all">جميع طلاب المنصة (الكل)</option>
                <option value="stage">مرحلة دراسية محددة</option>
                <option value="student">طالب محدد بالاسم</option>
              </select>
            </div>

            {audience === 'stage' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  المرحلة المستهدفة:
                </label>
                <select
                  value={targetStage}
                  onChange={e => setTargetStage(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                >
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {audience === 'student' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
                  اختر الطالب:
                </label>
                <select
                  value={targetStudent}
                  onChange={e => setTargetStudent(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                >
                  <option value="">-- اضغط لاختيار الطالب --</option>
                  {students.map(std => (
                    <option key={std.id} value={std.id}>{std.name} ({std.phone || 'بدون هاتف'})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--admin-text)' }}>
              نص التنبيه والرسالة:
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="اكتب رسالتك وتوجيهاتك للطلاب هنا..."
              className="admin-input"
              style={{ width: '100%', minHeight: '90px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="sendPushNotif"
              checked={sendPush}
              onChange={e => setSendPush(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="sendPushNotif" style={{ fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', color: 'var(--admin-text)' }}>
              إرسال كإشعار خارجي لهواتف الطلاب (Web Push Notification) 📲
            </label>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ alignSelf: 'flex-start', minWidth: '180px', fontWeight: 900 }}
          >
            <Send size={16} /> <span>نشر التنبيه الآن 📢</span>
          </button>
        </form>
      </div>

      {/* Announcements Directory */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--admin-text)' }}>
          التنبيهات المنشورة ({announcements.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {announcements.map(ann => (
            <div
              key={ann.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '1.25rem',
                background: 'var(--admin-bg-subtle)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-md)',
                gap: '1rem'
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--admin-text)', display: 'block', marginBottom: '4px' }}>
                  {ann.title}
                </strong>
                <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--admin-text-muted)', whiteSpace: 'pre-wrap' }}>
                  {ann.content}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                  نُشر في: {ann.date || 'اليوم'} • الكاتب: {ann.author || 'المستر'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من حذف تنبيه "${ann.title}"؟`)) {
                    deleteAnnouncement(ann.id);
                  }
                }}
                className="admin-btn admin-btn-ghost admin-btn-sm"
                style={{ color: '#EF4444' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
