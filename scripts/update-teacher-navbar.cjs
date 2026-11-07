const fs = require('fs');
let content = fs.readFileSync('src/components/common/TeacherNavbar.jsx', 'utf8').replace(/\r\n/g, '\n');

const importTarget = "import { useTheme } from '../../context/ThemeContext';";
const importReplace = "import { useTheme } from '../../context/ThemeContext';\nimport { revokeAdminSession, verifyAdminSession } from '../../services/authSecurity';";

if (!content.includes(importTarget)) {
  console.error('Import target not found in TeacherNavbar.jsx');
  process.exit(1);
}
content = content.replace(importTarget, importReplace);

const logoutTarget = "  const handleTeacherLogout = () => {\n    switchRole('student');\n    onNavigate('home');\n  };";
const logoutReplace = "  const handleTeacherLogout = () => {\n    revokeAdminSession();\n    switchRole('student');\n    onNavigate('home');\n  };";

if (!content.includes(logoutTarget)) {
  console.error('Logout target not found in TeacherNavbar.jsx');
  process.exit(1);
}
content = content.replace(logoutTarget, logoutReplace);

fs.writeFileSync('src/components/common/TeacherNavbar.jsx', content, 'utf8');
console.log('Successfully updated TeacherNavbar.jsx');
