import React, { useState } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import { Trophy, Award, Star, CheckCircle2, Sparkles, Filter, GraduationCap } from 'lucide-react';

export default function AchieversLeaderboard() {
  const { teacherProfile, topAchievers, stages } = useTeacher();
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');

  const currentStages = Array.isArray(stages) && stages.length > 0 ? stages : (teacherProfile?.stages || []);

  const filteredAchievers = (Array.isArray(topAchievers) ? topAchievers : []).filter(student => {
    if (selectedStageFilter === 'all') return true;
    return student.stageId === selectedStageFilter;
  });

  return (
    <section style={{ padding: '4.5rem 0', background: 'var(--bg-main)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            background: '#FEF3C7',
            color: '#92400E',
            fontSize: '0.85rem',
            fontWeight: 800,
            marginBottom: '0.75rem'
          }}>
            <Trophy size={16} color="#D97706" />
            <span>لوحة الشرف وتكريم المتفوقين</span>
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.75rem' }}>
            أوائل {teacherProfile?.name || 'مستر مايكل شحاته'} في اللغة الإنجليزية 🏆
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem' }}>
            فخورون بأبنائنا وبناتنا الذين حصدوا أعلى الدرجات وأثبتوا أن الإصرار والتدريب المتقن هو طريق القمة
          </p>

          {/* Stage Filter Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '6px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: 'fit-content',
            margin: '0 auto'
          }}>
            <button
              onClick={() => setSelectedStageFilter('all')}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.88rem',
                transition: 'all 0.2s',
                background: selectedStageFilter === 'all' ? 'var(--primary-gradient)' : 'transparent',
                color: selectedStageFilter === 'all' ? 'white' : 'var(--text-secondary)',
                boxShadow: selectedStageFilter === 'all' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
              }}
            >
              🌟 جميع المراحل ({Array.isArray(topAchievers) ? topAchievers.length : 0})
            </button>

            {(Array.isArray(currentStages) ? currentStages : []).map(s => {
              const count = (Array.isArray(topAchievers) ? topAchievers : []).filter(a => a && a.stageId === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStageFilter(s.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    transition: 'all 0.2s',
                    background: selectedStageFilter === s.id ? 'var(--primary-gradient)' : 'transparent',
                    color: selectedStageFilter === s.id ? 'white' : 'var(--text-secondary)',
                    boxShadow: selectedStageFilter === s.id ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
                  }}
                >
                  🎓 {s.name} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievers Grid */}
        {filteredAchievers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed var(--border-subtle)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <GraduationCap size={48} color="var(--primary-400)" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              لا يوجد أوائل مسجلين في هذه المرحلة حتى الآن
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              يمكن للمستر إضافة أوائل هذه المرحلة من خلال لوحة التحكم والإدارة.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem',
            marginBottom: '2.5rem'
          }}>
            {filteredAchievers.map((student, idx) => {
              const stageObj = currentStages.find(s => s.id === student.stageId);
              const stageLabel = student.stageName || stageObj?.name || 'الصف الثالث الثانوي';

              return (
                <div
                  key={student.id || idx}
                  className="card"
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    position: 'relative',
                    border: idx === 0 ? '2px solid #F59E0B' : '1px solid var(--border-subtle)',
                    boxShadow: idx === 0 ? '0 15px 35px rgba(245, 158, 11, 0.2)' : 'var(--shadow-md)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Top Badges Row: Honor Badge + Stage Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '1.25rem' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}>
                      {student.badge || `المركز رقم #${idx + 1}`}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(79, 70, 229, 0.1)',
                      color: 'var(--primary-600)',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      border: '1px solid rgba(79, 70, 229, 0.2)'
                    }}>
                      <GraduationCap size={13} />
                      <span>{stageLabel}</span>
                    </span>
                  </div>

                  {/* Avatar */}
                  <div style={{ position: 'relative', width: '88px', height: '88px', margin: '0 auto 1rem' }}>
                    <img
                      src={student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={student.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: idx === 0 ? '4px solid #F59E0B' : '3px solid #CBD5E1',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#F59E0B' : '#64748B',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      #{student.rank || (idx + 1)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px' }}>
                    {student.name}
                  </h3>

                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1.25rem' }}>
                    🏫 {student.school || 'ثانوية عامة'}
                  </span>

                  <div style={{
                    background: 'var(--bg-subtle)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    display: 'inline-block',
                    width: '100%',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      الدرجة النهائية في اللغة الإنجليزية:
                    </span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--success)', fontWeight: 900 }}>
                      {student.score}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
