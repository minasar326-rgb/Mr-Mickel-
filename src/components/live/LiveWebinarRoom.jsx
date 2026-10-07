import React, { useState, useEffect, useRef } from 'react';
import { liveSessionsData } from '../../data/liveSessionsData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Radio, Users, MessageSquare, Send, Heart, Flame, 
  Sparkles, HelpCircle, ArrowRight, Share2, Volume2, Maximize 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LiveWebinarRoom({ onNavigate }) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const session = liveSessionsData[0];
  const [messages, setMessages] = useState(session.chatMessages || []);
  const [inputMsg, setInputMsg] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(session.attendeesCount || 380);
  const [reactions, setReactions] = useState({ heart: 124, flame: 98, clap: 85, light: 62 });
  const chatEndRef = useRef(null);

  // Poll state
  const [selectedPollOption, setSelectedPollOption] = useState(null);
  const [pollResults, setPollResults] = useState([
    { text: 'LangChain & Agent Frameworks', votes: 45 },
    { text: 'RAG & Vector Databases', votes: 38 },
    { text: 'Fine-Tuning Local LLMs', votes: 17 }
  ]);

  // Simulate incoming live messages occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      const simulatedSenders = ['سارة الزهراني', 'فيصل القحطاني', 'عمر الدوسري', 'نورة السبيعي', 'خالد الغامدي'];
      const sampleTexts = [
        'معلومة رهيبة جداً عن الـ Function Calling! 🔥',
        'الصوت واضح تماماً شكراً دكتورة',
        'هل الكود سيكون متاحاً على GitHub بعد الورشة؟',
        'شرح مبهر وسلس جداً 👏',
        'أول مرة أفهم الـ Embeddings بهذه البساطة!'
      ];

      const randomSender = simulatedSenders[Math.floor(Math.random() * simulatedSenders.length)];
      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;

      setMessages(prev => [
        ...prev,
        { id: `cm-${Date.now()}`, user: randomSender, text: randomText, time: timeStr }
      ]);
      setAttendeesCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
    const newMsg = {
      id: `cm-${Date.now()}`,
      user: currentUser?.name || 'أنا (المشارك)',
      text: inputMsg,
      time: timeStr,
      isMe: true
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMsg('');
  };

  const handleReaction = (type) => {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    try {
      confetti({
        particleCount: 15,
        spread: 40,
        origin: { y: 0.8, x: 0.2 }
      });
    } catch (e) {}
  };

  const handleVotePoll = (idx) => {
    if (selectedPollOption !== null) return;
    setSelectedPollOption(idx);
    setPollResults(prev => prev.map((p, i) => i === idx ? { ...p, votes: p.votes + 1 } : p));
    addToast('تم تسجيل صوتك في الاستطلاع المباشر! 📊', 'success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0B0F19', color: '#F8FAFC' }}>
      {/* Top Bar */}
      <header style={{
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#111827'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => onNavigate('home')} className="btn btn-secondary btn-sm" style={{ background: '#1E293B', color: '#FFFFFF', gap: '6px' }}>
            <ArrowRight size={16} />
            <span>الرئيسية</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} className="pulse-glow" />
              <span>مباشر LIVE</span>
            </span>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'white' }}>{session.title}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A5B4FC' }}>
            <Users size={16} />
            <span>{attendeesCount} متواجد الآن</span>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href); addToast('تم نسخ رابط البث! 🔗', 'success'); }} className="btn btn-ghost btn-sm" style={{ color: 'white' }}>
            <Share2 size={16} />
          </button>
        </div>
      </header>

      {/* Main Grid: Stream + Chat */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left: Video Stream & Live Interactions */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto' }}>
          <div style={{
            position: 'relative',
            aspectRatio: '16/9',
            background: '#000000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            marginBottom: '1rem'
          }}>
            <video
              src={session.streamUrl}
              autoPlay
              muted
              loop
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {/* Live Pill Overlay */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
              <span>بث عالي الدقة HD 1080p</span>
            </div>
          </div>

          {/* Stream Footer Info & Live Poll */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
            {/* Instructor Card */}
            <div className="card" style={{ padding: '1.25rem', background: '#111827', border: '1px solid #1E293B', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <img
                  src={session.instructor.avatar}
                  alt={session.instructor.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #818CF8' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{session.instructor.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{session.instructor.title}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#CBD5E1', margin: 0, lineHeight: '1.5' }}>
                {session.description}
              </p>
            </div>

            {/* Live Poll Widget */}
            <div className="card" style={{ padding: '1.25rem', background: '#111827', border: '1px solid #1E293B', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#FBBF24', fontSize: '0.85rem', fontWeight: 700 }}>
                <Sparkles size={16} />
                <span>استطلاع رأي حي مباشر:</span>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 10px' }}>ما هي التقنية التي تفضل التركيز عليها في الورشة القادمة؟</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pollResults.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleVotePoll(idx)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: selectedPollOption === idx ? '1px solid #818CF8' : '1px solid #334155',
                      background: selectedPollOption === idx ? 'rgba(99, 102, 241, 0.2)' : '#1E293B',
                      color: 'white',
                      fontSize: '0.8rem',
                      textAlign: 'right',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt.text}</span>
                    <strong style={{ color: '#818CF8' }}>{opt.votes}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Chat Box */}
        <div style={{
          background: '#111827',
          borderRight: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 58px)'
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid #1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#818CF8" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>المحادثة المباشرة</h3>
            </div>

            {/* Floating Quick Reaction Emojis */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleReaction('heart')} style={{ background: '#1E293B', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.8rem' }} title="إعجاب">
                ❤️ {reactions.heart}
              </button>
              <button onClick={() => handleReaction('flame')} style={{ background: '#1E293B', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.8rem' }} title="حماس">
                🔥 {reactions.flame}
              </button>
              <button onClick={() => handleReaction('clap')} style={{ background: '#1E293B', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', fontSize: '0.8rem' }} title="تصفيق">
                👏 {reactions.clap}
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                background: msg.isMe ? 'rgba(99, 102, 241, 0.25)' : '#1E293B',
                border: msg.isMe ? '1px solid #6366F1' : '1px solid #334155',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.85rem'
              }}>
                <div className="flex-between" style={{ marginBottom: '2px' }}>
                  <strong style={{ color: msg.isMe ? '#A5B4FC' : '#F8FAFC', fontSize: '0.82rem' }}>
                    {msg.user}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{msg.time}</span>
                </div>
                <p style={{ margin: 0, color: '#E2E8F0', lineHeight: '1.4' }}>{msg.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1E293B', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="اكتب رسالتك للمدرب والزملاء..."
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              style={{
                flex: 1,
                background: '#1E293B',
                border: '1px solid #334155',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.5rem 0.9rem' }}>
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
