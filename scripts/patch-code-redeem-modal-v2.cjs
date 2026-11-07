const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'student', 'CodeRedeemModal.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('normalize10DigitCode')) {
  content = `import { normalize10DigitCode } from '../../utils/codeNormalizer.js';\n` + content;
}

// 2. Normalize on submit
content = content.replace(
  `    // Sanitize code input: uppercase, remove dangerous symbols
    const cleanCode = codeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');`,
  `    // Sanitize code input: normalize Arabic numerals to standard digits
    const cleanCode = normalize10DigitCode(codeInput);`
);

// 3. Normalize on change so student sees standard numbers instantly
content = content.replace(
  `                    onChange={e => {
                      setCodeInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}`,
  `                    onChange={e => {
                      const val = normalize10DigitCode(e.target.value);
                      setCodeInput(val);
                      if (errorMsg) setErrorMsg('');
                    }}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: CodeRedeemModal.jsx patched with mobile digit normalization');
