import React, { useState } from 'react';
import { Bot, Sparkles, Send, Play, Terminal, CheckCircle2, Award, Zap } from 'lucide-react';

export default function AIInstructorPreview({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'sandbox'
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'أهلاً بك! أنا مساعد مدارك الذكي 🤖. كيف يمكنني مساعدتك في شرح مفاهيم البرمجة أو تصحيح الأكواد اليوم؟'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [sandboxCode, setSandboxCode] = useState(`// جرب تشغيل كود تفاعلي
function calculateGrowth(students, months) {
  const rate = 1.35; // 35% نمو شهري
  return Math.round(students * Math.pow(rate, months));
}

console.log("الطلاب المتوقعون بعد 6 أشهر:", calculateGrowth(500, 6));`);
  const [sandboxOutput, setSandboxOutput] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal;
    setInputVal('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    // Simulated Smart AI reply
    setTimeout(() => {
      let reply = 'سؤال رائع! في مسار الـ Full-Stack والـ GenAI نقوم بتطبيق هذا المفهوم عملياً باستخدام React 19 ونماذج اللغة، مع معالجة الأخطاء وبناء اختبارات تلقائية.';
      if (userText.includes('react') || userText.includes('رياكت')) {
        reply = 'React 19 أضاف ميزات ثورية مثل Server Actions والـ useActionState التي تغنيك عن كتابة boilerplate code لإرسال النماذج والتعامل مع حالات التحميل!';
      } else if (userText.includes('ذكاء') || userText.includes('ai')) {
        reply = 'الذكاء الاصطناعي التوليدي يعتمد على معمارية Transformer، وباستخدام RAG يمكنك ربط نماذج مثل Gemini بقواعد بياناتك الخاصة بدقة 99%.';
      }
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    }, 600);
  };

  const handleRunSandbox = () => {
    try {
      let logs = [];
      const customConsole = {
        log: (...args) => logs.push(args.join(' '))
      };
      // eslint-disable-next-line no-new-func
      const fn = new Function('console', sandboxCode);
      fn(customConsole);
      setSandboxOutput(logs.join('\n') || 'تم تنفيذ الكود بنجاح (بدون مخرجات console.log)');
    } catch (err) {
      setSandboxOutput(`خطأ برمجي: ${err.message}`);
    }
  };

  return (
    <section style={{
      padding: '5rem 0',
      background: 'linear-gradient(180deg, var(--bg-main) 0%, var(--bg-surface) 100%)',
      position: 'relative'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '3rem',
          alignItems: 'center'
        }}>
          {/* Right Info */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--primary-600)',
              fontWeight: 700,
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              <Zap size={15} />
              <span>مزايا تعليمية حصرية</span>
            </div>

            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: '1.3', marginBottom: '1rem' }}>
              معلمك الذكي ومحررك البرمجي <br />
              <span style={{ color: 'var(--primary-600)' }}>متاحان في كل درس</span>
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '1.75rem' }}>
              لا مزيد من التوقف عند مواجهة أخطاء برمجية أو مفاهيم صعبة. منصة مدارك تدمج مساعد ذكاء اصطناعي فوري ومحرر أكواد حي داخل قاعة الدراسة لكل دورة.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
              {[
                { title: 'شرح فوري وتلخيص الدروس', desc: 'اطلب من الذكاء الاصطناعي تبسيط أي نقطة أو تلخيص الدرس في نقاط رئيسية.' },
                { title: 'محرر أكواد حي دون مغادرة المتصفح', desc: 'طبق وافحص نتائج برمجتك للغات JavaScript و React فوراً.' },
                { title: 'بطاقات مراجعة ذكية (Flashcards)', desc: 'تثبيت المعلومات ومراجعتها السريعة قبل الاختبارات النهائية.' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 2px' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('classroom', { courseId: 'fullstack-react-nextjs' })}
              className="btn btn-primary btn-lg"
            >
              جرب قاعة الدراسة التفاعلية الآن
            </button>
          </div>

          {/* Left Interactive Playground Box */}
          <div className="card" style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Header Tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '4px'
            }}>
              <button
                onClick={() => setActiveTab('ai')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === 'ai' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'ai' ? 'var(--primary-600)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'ai' ? 'var(--shadow-xs)' : 'none'
                }}
              >
                <Bot size={18} />
                <span>المساعد الذكي (AI Tutor)</span>
              </button>
              <button
                onClick={() => setActiveTab('sandbox')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === 'sandbox' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'sandbox' ? 'var(--primary-600)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'sandbox' ? 'var(--shadow-xs)' : 'none'
                }}
              >
                <Terminal size={18} />
                <span>المحرر التفاعلي (Code Sandbox)</span>
              </button>
            </div>

            {/* Tab 1: AI Chat Assistant */}
            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                      }}
                    >
                      {m.role === 'ai' && (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--primary-gradient)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Sparkles size={14} />
                        </div>
                      )}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        lineHeight: '1.5',
                        background: m.role === 'user' ? 'var(--primary-600)' : 'var(--bg-subtle)',
                        color: m.role === 'user' ? 'white' : 'var(--text-primary)'
                      }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} style={{
                  padding: '0.75rem 1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '8px',
                  background: 'var(--bg-surface)'
                }}>
                  <input
                    type="text"
                    placeholder="اطرح سؤالاً على المساعد الذكي..."
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    className="input-control"
                    style={{ fontSize: '0.88rem' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Code Sandbox */}
            {activeTab === 'sandbox' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '360px' }}>
                <textarea
                  value={sandboxCode}
                  onChange={e => setSandboxCode(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#0F172A',
                    color: '#38BDF8',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '0.85rem',
                    padding: '1rem',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    direction: 'ltr',
                    textAlign: 'left'
                  }}
                />
                <div style={{
                  background: '#1E293B',
                  borderTop: '1px solid #334155',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    color: '#A5F3FC',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '0.8rem',
                    direction: 'ltr'
                  }}>
                    {sandboxOutput || 'اضغط على زر تشغيل لرؤية النتيجة...'}
                  </div>
                  <button
                    onClick={handleRunSandbox}
                    className="btn btn-success btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Play size={15} fill="currentColor" />
                    <span>تشغيل الكود</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
