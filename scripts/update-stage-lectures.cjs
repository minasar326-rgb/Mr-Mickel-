const fs = require('fs');
let content = fs.readFileSync('src/components/stages/StageLecturesPage.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Add import
const importTarget = "import { useAuth } from '../../context/AuthContext';";
const importReplace = "import { useAuth } from '../../context/AuthContext';\nimport { verifyAdminSession } from '../../services/authSecurity';";

if (!content.includes(importTarget)) {
  console.error('Import target not found in StageLecturesPage.jsx');
  process.exit(1);
}
content = content.replace(importTarget, importReplace);

// 2. Replace isTeacher
const isTeacherTarget = "const isTeacher = role === 'instructor' || role === 'super_admin';";
const isTeacherReplace = "const isTeacher = Boolean(verifyAdminSession()?.valid || verifyAdminSession()?.isValid);";

if (!content.includes(isTeacherTarget)) {
  console.error('isTeacher target not found in StageLecturesPage.jsx');
  process.exit(1);
}
content = content.replace(isTeacherTarget, isTeacherReplace);

fs.writeFileSync('src/components/stages/StageLecturesPage.jsx', content, 'utf8');
console.log('Successfully updated StageLecturesPage.jsx');
