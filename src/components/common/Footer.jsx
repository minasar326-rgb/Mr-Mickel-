import React from 'react';
import { BookOpen, Heart, Shield, Award, Sparkles, Send, Globe, Phone, Mail } from 'lucide-react';
import { categoriesData } from '../../data/categoriesData';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      paddingTop: '4rem',
      paddingBottom: '2rem',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Col 1: Platform Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <BookOpen size={20} />
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>مَدَارِك</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              المنصة العربية الرائدة للتعلم الذكي وصناعة الكفاءات التقنية للمستقبل. دورات تطبيقية ومشاريع حقيقية وشهادات معتمدة.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-success">✓ شهادات معتمدة</span>
              <span className="badge badge-primary">✓ دعم ذكي 24/7</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>المسارات التعليمية</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {categoriesData.slice(0, 5).map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNavigate('courses', { category: cat.id })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'right'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-600)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>روابط سريعة</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>
                <button onClick={() => onNavigate('courses')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer' }}>
                  كتالوج الدورات
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('live')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer' }}>
                  الورش التفاعلية الحية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('community')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer' }}>
                  مجتمع النقاشات والأسئلة
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('instructor-dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer' }}>
                  انضم كمدرب في مدارك
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>النشرة البريدية التقنية</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              احصل على ملخصات أسبوعية، مقالات برمجية حصرية، وكوبونات خصم مباشرة في بريدك.
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="email"
                placeholder="أدخل بريدك الإلكتروني..."
                className="input-control"
                style={{ fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
              />
              <button className="btn btn-primary" style={{ padding: '0.55rem 0.9rem' }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © 2026 منصة مَدَارِك التعليمية (Madarek LMS). جميع الحقوق محفوظة.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>🔒 دفع إلكتروني آمن 100% (مدى، فيزا، Apple Pay)</span>
            <span>🇸🇦 فخر الصناعة الرقمية العربية</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
