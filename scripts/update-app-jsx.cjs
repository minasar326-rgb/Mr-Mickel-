const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

const target1 = "const isAuthedAdmin = role === 'teacher' || role === 'instructor' || role === 'super_admin' || Boolean(verifyAdminSession()?.valid);";
const replace1 = "const isAuthedAdmin = Boolean(verifyAdminSession()?.valid || verifyAdminSession()?.isValid);";

if (!content.includes(target1)) {
  console.error('Target not found in App.jsx');
  process.exit(1);
}

// Replace both occurrences
content = content.split(target1).join(replace1);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Successfully updated App.jsx');
