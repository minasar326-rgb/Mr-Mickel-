import React, { useState } from 'react';
import { communityDiscussions as initialPosts } from '../../data/communityData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Users, MessageSquare, ThumbsUp, CheckCircle2, Search, 
  PlusCircle, Sparkles, Tag, ArrowLeft, Send 
} from 'lucide-react';

export default function CommunityHub() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [posts, setPosts] = useState(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('تطوير الويب');

  const allTags = ['all', 'React', 'Zustand', 'RAG', 'Python', 'Vector DB', 'System Design', 'Frontend'];

  const filteredPosts = posts.filter(post => {
    if (selectedTag !== 'all' && !post.tags?.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  const handleUpvote = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, upvotes: p.upvotes + 1 };
      }
      return p;
    }));
    addToast('تم التصويت للمنشور 👍', 'success');
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost = {
      id: `post-${Date.now()}`,
      author: {
        name: currentUser?.name || 'مستخدم جديد',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: 'طالب'
      },
      title: newTitle,
      content: newContent,
      category: newCategory,
      upvotes: 1,
      answersCount: 0,
      createdAt: 'الآن',
      isSolved: false,
      tags: [newCategory, 'سؤال جديد']
    };

    setPosts(prev => [newPost, ...prev]);
    setIsNewPostOpen(false);
    setNewTitle('');
    setNewContent('');
    addToast('تم نشر سؤالك في مجتمع مدارك بنجاح! 🚀', 'success');
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-main)' }}>
      <div className="container">
        {/* Header */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem'
        }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Users size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>
                  مجتمع ونقاشات مَدَارِك التقنية
                </h1>
                <p style={{ color: '#C7D2FE', fontSize: '0.9rem', margin: '4px 0 0' }}>
                  اطرح استفساراتك، تبادل الخبرات البرمجية، وتفاعل مع زملائك والمدربين المعتمدين.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsNewPostOpen(true)}
              className="btn btn-primary"
              style={{ background: '#FFFFFF', color: '#4F46E5', fontWeight: 700, gap: '8px' }}
            >
              <PlusCircle size={18} />
              <span>طرح سؤال جديد</span>
            </button>
          </div>
        </div>

        {/* Search & Tags Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: selectedTag === tag ? '1px solid transparent' : '1px solid var(--border-subtle)',
                  background: selectedTag === tag ? 'var(--primary-gradient)' : 'var(--bg-surface)',
                  color: selectedTag === tag ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {tag === 'all' ? 'جميع المواضيع' : `#${tag}`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="ابحث في المناقشات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-control"
              style={{ paddingRight: '36px', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Discussions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredPosts.map(post => (
            <div key={post.id} className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                {/* Upvote Button */}
                <button
                  onClick={() => handleUpvote(post.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    minWidth: '52px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-500)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <ThumbsUp size={16} color="var(--primary-600)" />
                  <strong style={{ fontSize: '0.95rem' }}>{post.upvotes}</strong>
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{post.category}</span>
                    {post.isSolved && (
                      <span className="badge badge-success" style={{ gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        <span>تمت الإجابة والحل</span>
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      بواسطة {post.author?.name} • {post.createdAt}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px', lineHeight: '1.4' }}>
                    {post.title}
                  </h3>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 1rem' }}>
                    {post.content}
                  </p>

                  {/* Accepted Answer box if present */}
                  {post.topAnswer && (
                    <div style={{
                      background: 'var(--success-bg)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <img
                          src={post.topAnswer.author.avatar}
                          alt={post.topAnswer.author.name}
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                        <strong style={{ fontSize: '0.85rem' }}>{post.topAnswer.author.name}</strong>
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{post.topAnswer.author.badge}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {post.topAnswer.content}
                      </p>
                    </div>
                  )}

                  {/* Tags & Comments count footer */}
                  <div className="flex-between">
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {post.tags?.map(t => (
                        <span key={t} className="badge badge-subtle" style={{ fontSize: '0.75rem' }}>
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <MessageSquare size={15} />
                      <span>{post.answersCount || 0} إجابات</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal: New Question */}
        {isNewPostOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            padding: '1.5rem'
          }}>
            <form onSubmit={handleCreatePost} className="card animate-fade-in" style={{
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>طرح سؤال تقني جديد</h3>
                <button type="button" onClick={() => setIsNewPostOpen(false)} className="btn btn-ghost btn-sm">إلغاء</button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>عنوان السؤال:</label>
                <input
                  type="text"
                  placeholder="مثال: كيف أربط Next.js 15 مع Supabase بأمان؟"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="input-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>المجال:</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="input-control"
                >
                  <option value="تطوير الويب">تطوير الويب</option>
                  <option value="الذكاء الاصطناعي">الذكاء الاصطناعي</option>
                  <option value="تصميم الواجهات">تصميم الواجهات</option>
                  <option value="الأمن السيبراني">الأمن السيبراني</option>
                  <option value="التوظيف والمهنة">التوظيف والمهنة</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>التفاصيل والأكواد:</label>
                <textarea
                  placeholder="اشرح المشكلة بالتفصيل واذكر ما جربته حتى الآن..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="input-control"
                  style={{ height: '120px' }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ gap: '8px' }}>
                <Send size={18} />
                <span>نشر السؤال في المجتمع</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
