const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'student', 'CodeRedeemModal.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Title and Subtitle
content = content.replace(
  `<h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>شحن وتفعيل كود المرحلة</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  أدخل كود التفعيل المستلم لفتح المرحلة وربطها بحساب Google الخاص بك
                </p>`,
  `<h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>تفعيل كود الاشتراك والدروس 🔑</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  أدخل كود التفعيل المكون من 10 أرقام المستلم من المستر لفتح المحتوى وربطه بحسابك بشكل دائم
                </p>`
);

// 2. Update Input Field Placeholder & Labels
content = content.replace(
  `<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رمز كود التفعيل (Activation Code):</label>
                  <input
                    type="text"
                    placeholder={lockoutRemaining > 0 ? \`تم القفل المؤقت: انتظر \${lockoutRemaining} ثانية\` : "مثال: ABC123 أو MS-SEC3-8812"}`,
  `<label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>رمز كود التفعيل (10 أرقام):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={lockoutRemaining > 0 ? \`تم القفل المؤقت: انتظر \${lockoutRemaining} ثانية\` : "أدخل كود التفعيل (10 أرقام مثل: 8492019384)"}`
);

// 3. Update Success Expiration Label to permanent
content = content.replace(
  `<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>تاريخ الانتهاء:</span>
                <strong style={{ fontSize: '0.88rem', color: '#059669' }}>{successResult.expirationDate || successResult.expiresAtFormatted}</strong>`,
  `<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>مدة الصلاحية:</span>
                <strong style={{ fontSize: '0.88rem', color: '#059669' }}>دائم ومستمر لحسابك مدى الحياة ♾️</strong>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: CodeRedeemModal.jsx updated!');
