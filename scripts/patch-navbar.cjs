const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'common', 'Navbar.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetBlock = `          {/* Quick Role Switcher Pill for instant demo & evaluation */}
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
          </div>`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  const updated = normContent.replace(normTarget, '');
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('SUCCESS: Removed dev role switcher from Navbar.jsx');
} else {
  console.warn('WARNING: targetBlock not found in Navbar.jsx');
}
