const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'context', 'AuthContext.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add verifyAdminSession to import
content = content.replace(
  `import { createAdminSession } from '../services/authSecurity';`,
  `import { createAdminSession, verifyAdminSession } from '../services/authSecurity';`
);

// 2. Harden initial role state
const oldRoleState = `  const [role, setRole] = useState(() => {
    return localStorage.getItem('madarek_role') || 'student';
  });`;

const newRoleState = `  const [role, setRole] = useState(() => {
    try {
      const saved = localStorage.getItem('madarek_role');
      if (saved === 'instructor' || saved === 'super_admin' || saved === 'admin') {
        const adminSession = verifyAdminSession();
        if (!adminSession?.isValid) {
          localStorage.setItem('madarek_role', 'student');
          return 'student';
        }
        return saved;
      }
    } catch (e) {}
    return 'student';
  });`;

content = content.replace(oldRoleState, newRoleState);

// 3. Harden switchRole
const oldSwitchRole = `  const switchRole = (newRole) => {
    setRole(newRole);
    // CRITICAL: We NEVER overwrite or erase currentUser with a fake teacher object!
    // currentUser remains the authenticated Google student profile at all times.
    // Teacher access is strictly controlled by \`role: 'instructor'\`.
    if (newRole === 'student') {
      if (!currentUser) {
        try {
          const saved = localStorage.getItem('madarek_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.uid || parsed.id) && parsed.uid !== 'teacher-admin') {
              setCurrentUser(parsed);
              return;
            }
          }
        } catch (e) {}
      }
    }
  };`;

const newSwitchRole = `  const switchRole = (newRole) => {
    if (newRole === 'instructor' || newRole === 'admin' || newRole === 'super_admin') {
      const adminSession = verifyAdminSession();
      if (!adminSession?.isValid) {
        setRole('student');
        try { localStorage.setItem('madarek_role', 'student'); } catch (e) {}
        return;
      }
    }
    setRole(newRole);
    try { localStorage.setItem('madarek_role', newRole); } catch (e) {}

    if (newRole === 'student') {
      if (!currentUser) {
        try {
          const saved = localStorage.getItem('madarek_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.uid || parsed.id) && parsed.uid !== 'teacher-admin') {
              setCurrentUser(parsed);
              return;
            }
          }
        } catch (e) {}
      }
    }
  };`;

content = content.replace(oldSwitchRole, newSwitchRole);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: AuthContext.jsx hardened against unauthorized instructor override!');
