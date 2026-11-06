const assert = require('assert');

// Dynamic import of stages.js
async function runTests() {
  const { normalizeStageId, CANONICAL_STAGES, getStageTitle } = await import('../src/utils/stages.js');

  console.log('🧪 RUNNING STAGE NORMALIZATION UNIT TESTS');

  const testCases = [
    // CRITICAL: The exact bug reported by user
    { input: ['الصف الأول الثانوي'], expected: 'sec-1' },
    { input: ['الصف الاول الثانوي'], expected: 'sec-1' },
    { input: ['أولى ثانوي'], expected: 'sec-1' },
    { input: ['1 ثانوي'], expected: 'sec-1' },
    { input: ['senior 1'], expected: 'sec-1' },
    { input: ['sec-1'], expected: 'sec-1' },
    { input: ['sec1'], expected: 'sec-1' },

    // Second secondary
    { input: ['الصف الثاني الثانوي'], expected: 'sec-2' },
    { input: ['تانية ثانوي'], expected: 'sec-2' },
    { input: ['2 ثانوي'], expected: 'sec-2' },
    { input: ['senior 2'], expected: 'sec-2' },
    { input: ['sec-2'], expected: 'sec-2' },
    { input: ['sec2'], expected: 'sec-2' },

    // Third secondary
    { input: ['الصف الثالث الثانوي'], expected: 'sec-3' },
    { input: ['تالتة ثانوي'], expected: 'sec-3' },
    { input: ['ثانوية عامة'], expected: 'sec-3' },
    { input: ['senior 3'], expected: 'sec-3' },
    { input: ['sec-3'], expected: 'sec-3' },

    // Prep
    { input: ['المرحلة الإعدادية'], expected: 'prep' },
    { input: ['إعدادي'], expected: 'prep' },
    { input: ['الصف الثالث الإعدادي'], expected: 'prep' },

    // Primary
    { input: ['المرحلة الابتدائية'], expected: 'pri' },
    { input: ['ابتدائي'], expected: 'pri' },

    // Foundation
    { input: ['كورس التأسيس الشامل'], expected: 'foundation' },
    { input: ['تأسيس'], expected: 'foundation' },

    // All-access
    { input: ['all-access'], expected: 'all-access' },
    { input: ['جميع المراحل'], expected: 'all-access' },
    { input: ['شامل جميع المراحل'], expected: 'all-access' },
    { input: ['vip-all-access'], expected: 'all-access' }
  ];

  let passed = 0;
  for (const { input, expected } of testCases) {
    const result = normalizeStageId(...input);
    assert.strictEqual(result, expected, `FAILED for ${input}: got ${result}, expected ${expected}`);
    passed++;
  }

  console.log(`✅ All ${passed}/${testCases.length} Stage Normalization tests PASSED!`);
}

runTests().catch(err => {
  console.error('❌ Stage tests failed:', err);
  process.exit(1);
});
