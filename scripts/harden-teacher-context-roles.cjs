const fs = require('fs');
let content = fs.readFileSync('src/context/TeacherContext.jsx', 'utf8').replace(/\r\n/g, '\n');

// Replace naked role === 'instructor' checks in administrative guards
content = content.replace(
  "      role === 'instructor' ||\n      currentUser?.role === 'super_admin' ||",
  "      (Boolean(verifyAdminSession()?.valid) && role === 'instructor') ||\n      currentUser?.role === 'super_admin' ||"
);

content = content.replace(
  "      role === 'instructor' ||\n      currentUser?.role === 'super_admin' ||",
  "      (Boolean(verifyAdminSession()?.valid) && role === 'instructor') ||\n      currentUser?.role === 'super_admin' ||"
);

content = content.replace(
  "      role === 'instructor' ||\n      currentUser?.role === 'super_admin' ||",
  "      (Boolean(verifyAdminSession()?.valid) && role === 'instructor') ||\n      currentUser?.role === 'super_admin' ||"
);

content = content.replace(
  "      role === 'instructor' ||\n      currentUser?.role === 'super_admin' ||",
  "      (Boolean(verifyAdminSession()?.valid) && role === 'instructor') ||\n      currentUser?.role === 'super_admin' ||"
);

fs.writeFileSync('src/context/TeacherContext.jsx', content, 'utf8');
console.log('Successfully hardened role checks in TeacherContext.jsx');
