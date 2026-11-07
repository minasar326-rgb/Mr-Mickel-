const fs = require('fs');
let content = fs.readFileSync('src/components/student/CodeRedeemModal.jsx', 'utf8').replace(/\r\n/g, '\n');

const submitTarget = `    // Sanitize code input: uppercase, remove dangerous symbols
    const cleanCode = codeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode || isSubmitting) return;`;

const submitReplace = `    // Sanitize code input: normalizes Arabic/Persian digits (٠-٩) to 0-9 and removes symbols
    const cleanCode = normalize10DigitCode(codeInput);
    if (!cleanCode || cleanCode.length !== 10) {
      setErrorMsg('يرجى التأكد من كتابة كود التفعيل المكون من 10 أرقام بدقة.');
      return;
    }
    if (isSubmitting) return;`;

if (!content.includes(submitTarget)) {
  console.error('submitTarget not found');
  process.exit(1);
}
content = content.replace(submitTarget, submitReplace);

const inputTarget = `                    onChange={e => {
                      setCodeInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}`;

const inputReplace = `                    onChange={e => {
                      const normalized = normalize10DigitCode(e.target.value);
                      setCodeInput(normalized);
                      if (errorMsg) setErrorMsg('');
                    }}`;

if (!content.includes(inputTarget)) {
  console.error('inputTarget not found');
  process.exit(1);
}
content = content.replace(inputTarget, inputReplace);

fs.writeFileSync('src/components/student/CodeRedeemModal.jsx', content, 'utf8');
console.log('Successfully updated CodeRedeemModal.jsx');
