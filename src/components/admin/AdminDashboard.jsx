import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CourseContext';
import { useToast } from '../../context/ToastContext';
import { 
  ShieldCheck, Users, BookOpen, DollarSign, CheckCircle2, 
  XCircle, AlertTriangle, TrendingUp, Search, Eye, Filter 
} from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const { courses } = useCourses();
  const { addToast } = useToast();

  const [pendingCourses, setPendingCourses] = useState([
    {
      id: 'pending-1',
      title: 'بناء تطبيقات الـ Microservices بـ Go & Kubernetes',
      instructor: 'م. أحمد الحربي',
      category: 'الحوسبة السحابية',
      price: 349,
      submittedDate: 'اليوم، 10:30 صباحاً',
      lessonsCount: 48
    },
    {
      id: 'pending-2',
      title: 'إتقان التسويق الرقمي المعتمد على البيانات و Google Ads',
      instructor: 'أ. سارة المنصور',
      category: 'التسويق الرقمي',
      price: 199,
      submittedDate: 'أمس، 4:15 مساءً',
      lessonsCount: 32
    }
  ]);

  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'سعد القحطاني', email: 'saad@example.com', role: 'طالب', enrolledCount: 3, status: 'نشط' },
    { id: 'u2', name: 'م. طارق العتيبي', email: 'tariq@madarek.edu', role: 'مدرب', enrolledCount: 6, status: 'موثق' },
    { id: 'u3', name: 'ريم الحربي', email: 'reem@example.com', role: 'طالبة', enrolledCount: 2, status: 'نشط' },
    { id: 'u4', name: 'د. سارة المنصور', email: 'sara@madarek.edu', role: 'مدربة', enrolledCount: 4, status: 'موثق' }
  ]);

  const handleApprove = (id, title) => {
    setPendingCourses(prev => prev.filter(c => c.id !== id));
    addToast(`تمت الموافقة ونشر دورة "${title}" بنجاح 🚀`, 'success');
  };

  const handleReject = (id, title) => {
    setPendingCourses(prev => prev.filter(c => c.id !== id));
    addToast(`تم رفض اعتماد الدورة وإرسال الملاحظات للمدرب`, 'info');
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)' }}>
      <div className="container">
        {/* Header */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem'
        }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <ShieldCheck size={30} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>
                  مركز القيادة والإدارة العامة (Admin Center)
                </h1>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem', margin: '4px 0 0' }}>
                  مراقبة أداء المنصة، تدقيق المحتوى، واعتماد المسارات الجديدة.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-success">حالة الخوادم: متصلة 100% 🟢</span>
              <span className="badge badge-primary">إصدار النظام 2.6</span>
            </div>
          </div>
        </div>

        {/* 4 Analytics Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المبيعات والمدفوعات:</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary-600)', margin: '4px 0' }}>540,200 ر.س</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>+24% نمو ربع سنوي</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الطلاب المسجلين:</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>64,200 طالب</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>من 18 دولة عربية</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الدورات والمسارات:</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8B5CF6', margin: '4px 0' }}>{courses.length + 115} مسار</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>موزعة على 8 مجالات</span>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>طلبات الاعتماد المعلقة:</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F59E0B', margin: '4px 0' }}>{pendingCourses.length} دورات</h3>
            <span style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>تتطلب مراجعة المشرف</span>
          </div>
        </div>

        {/* Section 1: Pending Course Approvals */}
        <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)', marginBottom: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="var(--primary-600)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>طلبات نشر الدورات الجديدة</h3>
            </div>
            <span className="badge badge-warning">{pendingCourses.length} بانتظار الموافقة</span>
          </div>

          {pendingCourses.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              لا توجد طلبات اعتماد معلقة حالياً ✓
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingCourses.map(course => (
                <div key={course.id} className="card" style={{ padding: '1rem 1.25rem', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '4px' }}>{course.category}</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px' }}>{course.title}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>المدرب: <strong>{course.instructor}</strong></span>
                      <span>السعر: <strong>{course.price} ر.س</strong></span>
                      <span>الدروس: <strong>{course.lessonsCount} درس</strong></span>
                      <span>التاريخ: {course.submittedDate}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApprove(course.id, course.title)}
                      className="btn btn-success btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>اعتماد ونشر</span>
                    </button>

                    <button
                      onClick={() => handleReject(course.id, course.title)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', color: 'var(--error)' }}
                    >
                      <XCircle size={16} />
                      <span>رفض</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: User Management Table */}
        <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary-600)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>إدارة المستخدمين والأعضاء</h3>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>المستخدم</th>
                  <th style={{ padding: '10px' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '10px' }}>الدور</th>
                  <th style={{ padding: '10px' }}>الدورات</th>
                  <th style={{ padding: '10px' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700 }}>{u.name}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className={`badge ${u.role.includes('مدرب') ? 'badge-primary' : 'badge-subtle'}`}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>{u.enrolledCount}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-success">{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
