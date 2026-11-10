const fs = require('fs');

const filePath = 'src/components/student/ComprehensiveExamsPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
const normalize = s => isCRLF ? s.replace(/\r?\n/g, '\r\n') : s.replace(/\r?\n/g, '\n');

const oldLine = "            const essayCount = (exam.questions || []).filter(q => q.type === 'essay' || q.type === 'short_answer').length;";
const newLine = "            const essayCount = (exam.questions || []).filter(q => q.type === 'essay').length;";

if (content.includes(normalize(oldLine))) {
  content = content.replace(normalize(oldLine), normalize(newLine));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Successfully patched ComprehensiveExamsPage.jsx');
} else {
  console.log('Line not found');
}
