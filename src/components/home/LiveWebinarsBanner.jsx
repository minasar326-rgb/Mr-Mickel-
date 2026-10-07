import React from 'react';
import { liveSessionsData } from '../../data/liveSessionsData';
import { Video, Calendar, Users, ArrowLeft, Radio } from 'lucide-react';

export default function LiveWebinarsBanner({ onNavigate }) {
  const currentLive = liveSessionsData[0];

  if (!currentLive) return null;

  return (
    <section style={{ padding: '3.5rem 0', background: 'var(--bg-main)' }}>
      <div className="container">
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Decorative Glow */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.25)',
            filter: 'blur(70px)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '2.5rem',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Right Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={14} className="pulse-glow" />
                  <span>بث مباشر تفاعلي</span>
                </span>
                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>مجاني لجميع الأعضاء</span>
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: '1.3', marginBottom: '0.75rem', color: '#FFFFFF' }}>
                {currentLive.title}
              </h2>

              <p style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: '1.6', marginBottom: '1.5rem', color: '#E0E7FF' }}>
                {currentLive.description}
              </p>

              {/* Instructor & Date Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={currentLive.instructor.avatar}
                    alt={currentLive.instructor.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #818CF8' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>{currentLive.instructor.name}</span>
                    <span style={{ fontSize: '0.78rem', color: '#C7D2FE' }}>{currentLive.instructor.title}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#E0E7FF' }}>
                  <Calendar size={16} color="#A5B4FC" />
                  <span>{currentLive.date}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#E0E7FF' }}>
                  <Users size={16} color="#A5B4FC" />
                  <span>{currentLive.attendeesCount} مسجل متواجد</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('live')}
                className="btn btn-primary btn-lg"
                style={{ background: '#FFFFFF', color: '#4F46E5', fontWeight: 800, gap: '8px' }}
              >
                <Video size={18} />
                <span>انضم إلى قاعة البث الحي الآن</span>
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Left Image Preview */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 15px 30px rgba(0,0,0,0.4)',
              border: '2px solid rgba(255, 255, 255, 0.15)'
            }}>
              <img
                src={currentLive.coverImage}
                alt={currentLive.title}
                style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
