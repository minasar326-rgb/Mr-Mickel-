import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourses } from '../../context/CourseContext';
import { useTheme } from '../../context/ThemeContext';
import { categoriesData } from '../../data/categoriesData';
import { 
  BookOpen, Search, ShoppingBag, Heart, Sun, Moon, 
  User, LogOut, LayoutDashboard, Video, Users, CheckCircle, 
  Sparkles, Layers, ChevronDown, Menu, X, Award, ShieldCheck, PlusCircle
} from 'lucide-react';

export default function Navbar({ onNavigate, currentPage, onOpenCart, onOpenVerifyCert }) {
  const { currentUser, role, switchRole, logout, openAuthModal } = useAuth();
  const { cart, wishlist, courses } = useCourses();
  const { isDark, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Filter courses for live search popup
  const searchResults = searchQuery.trim()
    ? courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (courseId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onNavigate('course-detail', { courseId });
  };

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.3s ease'
    }}>
      {/* Top Notification Announcement Bar */}
      <div style={{
        background: 'var(--primary-gradient)',
        color: 'white',
        padding: '0.4rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <Sparkles size={15} />
        <span>عروض الصيف التعليمية: استخدم الكود <strong>MADAREK50</strong> للحصول على خصم 50% على جميع المسارات!</span>
      </div>

      {/* Main Navbar */}
      <div className="container-wide" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
        gap: '1rem'
      }}>
        {/* Right Section: Logo & Categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-ghost btn-icon-only"
            style={{ display: 'none' }}
            id="mobile-toggle-btn"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <div 
            onClick={() => onNavigate('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
            }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                  مَدَارِك
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                  LMS 2.0
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '-4px' }}>
                منصة التعلم الذكي والمستقبل
              </span>
            </div>
          </div>

          {/* Categories Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="btn btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
            >
              <Layers size={17} />
              <span>المجالات التعليمية</span>
              <ChevronDown size={15} style={{ transform: isCatDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isCatDropdownOpen && (
              <div 
                className="card animate-fade-in"
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: '320px',
                  padding: '0.75rem',
                  zIndex: 200,
                  boxShadow: 'var(--shadow-xl)'
                }}
              >
                <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>استكشف حسب التخصص</span>
                </div>
                {categoriesData.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setIsCatDropdownOpen(false);
                      onNavigate('courses', { category: cat.id });
                    }}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cat.name}</span>
                    </div>
                    <span className="badge badge-subtle" style={{ fontSize: '0.75rem' }}>{cat.coursesCount} دورة</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button 
              onClick={() => onNavigate('courses')} 
              className={`btn ${currentPage === 'courses' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.9rem' }}
            >
              جميع الدورات
            </button>
            <button 
              onClick={() => onNavigate('live')} 
              className={`btn ${currentPage === 'live' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.9rem', position: 'relative' }}
            >
              <Video size={16} />
              <span>الورش الحية</span>
              <span style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 6px #EF4444'
              }} />
            </button>
            <button 
              onClick={() => onNavigate('community')} 
              className={`btn ${currentPage === 'community' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.9rem' }}
            >
              <Users size={16} />
              <span>المجتمع والأسئلة</span>
            </button>
          </nav>
        </div>

        {/* Center: Search Bar with Autocomplete */}
        <div ref={searchRef} style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '0.45rem 1rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <Search size={18} color="var(--text-muted)" style={{ marginLeft: '8px' }} />
            <input
              type="text"
              placeholder="ابحث عن دورة، مهارة، أو مدرب..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                color: 'var(--text-primary)',
                fontSize: '0.88rem'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown Results */}
          {isSearchOpen && searchResults.length > 0 && (
            <div 
              className="card animate-fade-in"
              style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                left: 0,
                zIndex: 200,
                padding: '0.5rem',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              {searchResults.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectSearchResult(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <img src={c.thumbnail} alt={c.title} style={{ width: '44px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.instructor?.name} • {c.price} ر.س
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Left Section: Controls, Role Switcher, Cart, Wishlist, User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Quick Role Switcher Pill for instant demo & evaluation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            fontWeight: 600
          }}>
            <button
              onClick={() => switchRole('student')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                background: role === 'student' ? 'var(--primary-gradient)' : 'transparent',
                color: role === 'student' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
              title="التبديل إلى حساب الطالب"
            >
              طالب
            </button>
            <button
              onClick={() => switchRole('instructor')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                background: role === 'instructor' ? 'var(--primary-gradient)' : 'transparent',
                color: role === 'instructor' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
              title="التبديل إلى حساب المعلم"
            >
              معلم
            </button>
            <button
              onClick={() => switchRole('admin')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                cursor: 'pointer',
                background: role === 'admin' ? 'var(--primary-gradient)' : 'transparent',
                color: role === 'admin' ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
              title="التبديل إلى حساب الإدارة"
            >
              إدارة
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon-only"
            title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الليلي'}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {isDark ? <Sun size={19} color="#FBBF24" /> : <Moon size={19} color="#6366F1" />}
          </button>

          {/* Verify Certificate Link Button */}
          <button
            onClick={onOpenVerifyCert}
            className="btn btn-ghost btn-icon-only"
            title="التحقق من صحة شهادة"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <ShieldCheck size={19} color="var(--primary-500)" />
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => onNavigate('dashboard', { tab: 'wishlist' })}
            className="btn btn-ghost btn-icon-only"
            style={{ position: 'relative', borderRadius: 'var(--radius-full)' }}
            title="قائمة الرغبات"
          >
            <Heart size={19} />
            {wishlist.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#EC4899',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="btn btn-ghost btn-icon-only"
            style={{ position: 'relative', borderRadius: 'var(--radius-full)' }}
            title="سلة المشتريات"
          >
            <ShoppingBag size={19} />
            {cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--primary-600)',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cart.length}
              </span>
            )}
          </button>

          {/* User Profile or Login */}
          {currentUser ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '3px 8px 3px 4px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="card animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: '115%',
                    left: 0,
                    width: '240px',
                    padding: '0.5rem',
                    zIndex: 200,
                    boxShadow: 'var(--shadow-xl)'
                  }}
                >
                  <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{currentUser.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{currentUser.email}</p>
                    <span className="badge badge-primary" style={{ marginTop: '6px', fontSize: '0.72rem' }}>
                      {role === 'instructor' ? 'مدرب معتمد' : role === 'admin' ? 'مدير المنصة' : 'طالب نشط'}
                    </span>
                  </div>

                  <div style={{ padding: '0.5rem 0' }}>
                    <div
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate(role === 'instructor' ? 'instructor-dashboard' : role === 'admin' ? 'admin-dashboard' : 'dashboard');
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LayoutDashboard size={16} />
                      <span>{role === 'instructor' ? 'استوديو المعلم' : role === 'admin' ? 'لوحة تحكم الإدارة' : 'لوحة تحكمي التعليمية'}</span>
                    </div>

                    {role === 'student' && (
                      <div
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('dashboard', { tab: 'certificates' });
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.88rem',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Award size={16} color="#F59E0B" />
                        <span>شهاداتي المكتسبة</span>
                      </div>
                    )}

                    {role === 'instructor' && (
                      <div
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('instructor-dashboard', { tab: 'new-course' });
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.88rem',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <PlusCircle size={16} color="var(--primary-500)" />
                        <span>إنشاء دورة جديدة</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                    <div
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.88rem',
                        color: 'var(--error)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--error-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={16} />
                      <span>تسجيل الخروج</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => openAuthModal('login')} className="btn btn-ghost btn-sm">
                دخول
              </button>
              <button onClick={() => openAuthModal('signup')} className="btn btn-primary btn-sm">
                حساب جديد
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
