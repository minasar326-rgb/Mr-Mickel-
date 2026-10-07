import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "عبدالعزيز السالم",
      role: "Senior Frontend Engineer في شركة تقنية كبرى",
      company: "STC Solutions",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      content: "أفضل استثمار قمت به في مسيرتي المهنية. التطبيقات العملية في مسار Next.js و React 19 كانت مطابقة تماماً للمشاريع التي نعمل عليها في الشركة، والشرح عميق ومبسط جداً.",
      rating: 5
    },
    {
      name: "سارة الزهراني",
      role: "Lead UI/UX Designer",
      company: "Aramco Digital",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      content: "ماستركلاس Figma وأنظمة التصميم رفع جودة ملف أعمالي بشكل ملحوظ. بعد أسبوعين من إتمام الدورة تلقيت 3 عروض عمل في وظائف عن بعد برواتب ممتازة.",
      rating: 5
    },
    {
      name: "م. ماجد الحربي",
      role: "AI Solutions Architect",
      company: "Elm Technologies",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      content: "دورة الـ GenAI و RAG نقلتني من مجرد مستخدم لـ ChatGPT إلى مهندس يبني وكلاء ذكاء اصطناعي ذاتيين يحلون مشاكل أعمال حقيقية. شكراً لمنصة مدارك!",
      rating: 5
    }
  ];

  return (
    <section style={{ padding: '4.5rem 0', background: 'var(--bg-surface)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
          <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>قصص نجاح خريجينا</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            ماذا يقول الطلاب عن تجربتهم معنا؟
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            انضم للآلاف ممن طوروا مسارهم المهني وبنوا مشاريعهم التقنية عبر منصة مدارك
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.75rem'
        }}>
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                position: 'relative'
              }}
            >
              <Quote size={32} color="var(--primary-300)" style={{ opacity: 0.4, position: 'absolute', top: '20px', left: '20px' }} />

              <div>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '1rem' }}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={17} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>

                <p style={{ fontSize: '0.92rem', lineHeight: '1.7', color: 'var(--text-primary)', margin: 0 }}>
                  "{item.content}"
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '1rem'
              }}>
                <img
                  src={item.avatar}
                  alt={item.name}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{item.name}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.role}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)', display: 'block', fontWeight: 600 }}>{item.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
