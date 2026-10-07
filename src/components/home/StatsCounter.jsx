import React from 'react';
import { Users, BookOpen, Award, Star, Video, CheckCircle2 } from 'lucide-react';

export default function StatsCounter() {
  const stats = [
    { value: "+64,000", label: "متعلم نشط وخريج", icon: Users, color: "#6366F1" },
    { value: "+120", label: "مسار ودورة تدريبية", icon: BookOpen, color: "#8B5CF6" },
    { value: "+45,000", label: "شهادة معتمدة تم إصدارها", icon: Award, color: "#F59E0B" },
    { value: "4.92 / 5", label: "متوسط تقييم الدورات", icon: Star, color: "#10B981" }
  ];

  return (
    <section style={{
      padding: '3rem 0',
      background: 'var(--bg-main)',
      borderTop: '1px solid var(--border-subtle)',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem'
        }}>
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: `${item.color}15`,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, lineHeight: '1.2' }}>
                    {item.value}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
