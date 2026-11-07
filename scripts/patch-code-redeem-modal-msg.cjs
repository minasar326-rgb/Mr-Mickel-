const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'student', 'CodeRedeemModal.jsx');
let code = fs.readFileSync(targetPath, 'utf8').replace(/\r\n/g, '\n');

const target = `            {/* Subscription details summary card */}
            <div style={{`;

const replacement = `            {/* Notice if code was already redeemed by this account */}
            {successResult.alreadyActive && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1.5px solid #3B82F6',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                textAlign: 'right',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                lineHeight: 1.6
              }}>
                <div style={{ fontWeight: 800, color: '#2563EB', marginBottom: '4px' }}>
                  ℹ️ تنبيه بشأن كود الشهر:
                </div>
                <div>
                  هذا الكود مخصص لـ <strong>{successResult.targetTitle || 'هذا الشهر'}</strong> فقط، وتم تسجيله وتفعيله بحسابك مسبقاً {successResult.startDate ? ('بتاريخ ' + successResult.startDate) : ''} واشتراكك فيه دائم ومحفوظ مدى الحياة. <strong>لا يمكن استخدام هذا الكود لفتح أي شهر آخر</strong>؛ لكل شهر كود شحن خاص به.
                </div>
              </div>
            )}

            {/* Subscription details summary card */}
            <div style={{`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('✅ Successfully updated CodeRedeemModal.jsx');
} else {
  console.log('❌ Target not found in CodeRedeemModal.jsx');
}
