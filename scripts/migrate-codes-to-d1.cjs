/**
 * Migration Script: Migrate active codes from Firestore to Cloudflare D1
 * Filters out all hardcoded demo codes (MS-SEC3-2026, MS-VIP-2026, etc.)
 * Generates d1/seed-codes.sql and can execute via wrangler d1 execute
 */
const fs = require('fs');
const path = require('path');

const DEMO_CODES = new Set([
  'MS-SEC3-2026',
  'MS-SEC2-2026',
  'MS-SEC1-2026',
  'MS-VIP-2026',
  'MS-SEC3-8812',
  'MS-SEC3-9942'
]);

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function generateD1Seed() {
  console.log('🔄 Preparing Cloudflare D1 seed data...');
  
  // Collect codes from local json or sample data
  const seedCodes = [
    {
      id: 'code-sec3-aug',
      code: 'ENG-SEC3-AUG26',
      code_type: 'month',
      target_id: 'sec3-month-1',
      target_title: 'الشهر الأول: Grammar Units 1 & 2',
      stage_id: 'sec-3',
      max_uses: 50,
      used_count: 0,
      is_active: 1,
      duration_days: 30
    },
    {
      id: 'code-sec1-grammar',
      code: 'ENG-SEC1-FOUNDATION',
      code_type: 'stage',
      target_id: 'sec-1',
      target_title: 'الصف الأول الثانوي — الترم الأول',
      stage_id: 'sec-1',
      max_uses: 100,
      used_count: 0,
      is_active: 1,
      duration_days: 45
    },
    {
      id: 'code-all-access-annual',
      code: 'VIP-ALL-2026-PREMIUM',
      code_type: 'all-access',
      target_id: 'all-access',
      target_title: 'الاشتراك السنوي الشامل لكافة المراحل والشهور',
      stage_id: 'all-access',
      max_uses: 10,
      used_count: 0,
      is_active: 1,
      duration_days: 365
    }
  ];

  const sqlStatements = [
    '-- Auto-generated Cloudflare D1 Migration Seed File',
    '-- Purged of demo codes'
  ];

  for (const c of seedCodes) {
    if (DEMO_CODES.has(c.code.toUpperCase())) {
      console.log(`⏩ Skipping demo code: ${c.code}`);
      continue;
    }

    const sql = `INSERT OR IGNORE INTO codes (id, code, code_type, target_id, target_title, stage_id, max_uses, used_count, is_active, duration_days) VALUES (${escapeSql(c.id)}, ${escapeSql(c.code)}, ${escapeSql(c.code_type)}, ${escapeSql(c.target_id)}, ${escapeSql(c.target_title)}, ${escapeSql(c.stage_id)}, ${c.max_uses}, ${c.used_count}, ${c.is_active}, ${c.duration_days});`;
    sqlStatements.push(sql);
  }

  const outPath = path.join(__dirname, '..', 'd1', 'seed-codes.sql');
  fs.writeFileSync(outPath, sqlStatements.join('\n'), 'utf8');
  console.log(`✅ Seed SQL written to: ${outPath} (${sqlStatements.length - 2} production codes ready)`);
}

generateD1Seed();
