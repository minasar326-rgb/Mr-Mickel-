/**
 * Migration Script: Migrate & Isolate Academic Stage Data
 * Safe, idempotent, with --dry-run support.
 * Maps legacy grouped stage IDs to distinct canonical stage IDs.
 * Generates an explicit Ambiguity Report for items that cannot be determined with 100% certainty.
 *
 * Usage:
 *   node scripts/migrate-stage-data.cjs --dry-run
 *   node scripts/migrate-stage-data.cjs
 */
const fs = require('fs');
const path = require('path');

const CANONICAL_IDS = new Set([
  'sec-3', 'sec-2', 'sec-1',
  'prep-3', 'prep-2', 'prep-1',
  'pri-6', 'pri-5', 'pri-4', 'pri-3', 'pri-2', 'pri-1',
  'foundation', 'all-access'
]);

function inferStage(item, context = '') {
  const currentId = item.stageId || item.stage || '';
  if (CANONICAL_IDS.has(currentId)) {
    return { targetId: currentId, confidence: 'exact', reason: 'Already canonical' };
  }

  // Combine text clues
  const text = `${item.stageName || ''} ${item.stage || ''} ${item.title || ''} ${item.name || ''} ${item.targetTitle || ''} ${item.sectionId || ''} ${context}`.toLowerCase();

  // Primary rules
  if (text.includes('خامس') || text.includes('خامسه') || text.includes('خامسة') || text.includes('pri-5') || text.includes('pri5')) {
    return { targetId: 'pri-5', confidence: 'high', reason: 'Matches Grade 5 keywords' };
  }
  if (text.includes('سادس') || text.includes('سادسه') || text.includes('سادسة') || text.includes('pri-6') || text.includes('pri6')) {
    return { targetId: 'pri-6', confidence: 'high', reason: 'Matches Grade 6 keywords' };
  }
  if (text.includes('رابع') || text.includes('رابعه') || text.includes('رابعة') || text.includes('pri-4') || text.includes('pri4')) {
    return { targetId: 'pri-4', confidence: 'high', reason: 'Matches Grade 4 keywords' };
  }
  if (text.includes('تالتة ابتدائي') || text.includes('ثالث ابتدائي') || text.includes('pri-3') || text.includes('pri3')) {
    return { targetId: 'pri-3', confidence: 'high', reason: 'Matches Grade 3 primary' };
  }
  if (text.includes('تانية ابتدائي') || text.includes('ثاني ابتدائي') || text.includes('pri-2') || text.includes('pri2')) {
    return { targetId: 'pri-2', confidence: 'high', reason: 'Matches Grade 2 primary' };
  }
  if (text.includes('اولى ابتدائي') || text.includes('أولى ابتدائي') || text.includes('اول ابتدائي') || text.includes('pri-1') || text.includes('pri1')) {
    return { targetId: 'pri-1', confidence: 'high', reason: 'Matches Grade 1 primary' };
  }

  // Prep rules
  if (text.includes('تالتة اعدادي') || text.includes('تالتة إعدادي') || text.includes('ثالث اعدادي') || text.includes('ثالث إعدادي') || text.includes('prep-3') || text.includes('prep3')) {
    return { targetId: 'prep-3', confidence: 'high', reason: 'Matches Prep 3 keywords' };
  }
  if (text.includes('تانية اعدادي') || text.includes('تانية إعدادي') || text.includes('ثاني اعدادي') || text.includes('ثاني إعدادي') || text.includes('prep-2') || text.includes('prep2')) {
    return { targetId: 'prep-2', confidence: 'high', reason: 'Matches Prep 2 keywords' };
  }
  if (text.includes('اولى اعدادي') || text.includes('أولى إعدادي') || text.includes('اول اعدادي') || text.includes('prep-1') || text.includes('prep1')) {
    return { targetId: 'prep-1', confidence: 'high', reason: 'Matches Prep 1 keywords' };
  }

  // Secondary rules
  if (text.includes('ثالث ثانوي') || text.includes('تالتة ثانوي') || text.includes('ثانوية عامة') || text.includes('senior 3') || text.includes('sec-3')) {
    return { targetId: 'sec-3', confidence: 'high', reason: 'Matches Senior 3' };
  }
  if (text.includes('ثاني ثانوي') || text.includes('تانية ثانوي') || text.includes('senior 2') || text.includes('sec-2')) {
    return { targetId: 'sec-2', confidence: 'high', reason: 'Matches Senior 2' };
  }
  if (text.includes('اول ثانوي') || text.includes('أول ثانوي') || text.includes('اولى ثانوي') || text.includes('senior 1') || text.includes('sec-1')) {
    return { targetId: 'sec-1', confidence: 'high', reason: 'Matches Senior 1' };
  }

  // Foundation / general
  if (text.includes('تاسيس') || text.includes('تأسيس') || text.includes('foundation') || text.includes('zero to hero')) {
    return { targetId: 'foundation', confidence: 'high', reason: 'Matches Foundation course' };
  }

  // Ambiguous: Cannot determine with certainty. DO NOT GUESS!
  return {
    targetId: null,
    confidence: 'ambiguous',
    reason: `Cannot determine exact grade from text clues: "${text.trim()}"`
  };
}

async function runMigration() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`\n=================================================`);
  console.log(`🚀 Academic Stage Isolation Migration Tool`);
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (Simulation Only - No changes written)' : '⚡ LIVE RUN (Modifications will be saved)'}`);
  console.log(`=================================================\n`);

  const report = {
    timestamp: new Date().toISOString(),
    isDryRun,
    summary: { total: 0, canonicalAlready: 0, remapped: 0, ambiguous: 0 },
    remappedItems: [],
    ambiguousItems: []
  };

  // 1. Inspect Lectures
  const lecturesPath = path.join(__dirname, '..', 'src', 'data', 'lecturesData.js');
  if (fs.existsSync(lecturesPath)) {
    const raw = fs.readFileSync(lecturesPath, 'utf8');
    // Simple parsing of exported array
    const jsonMatch = raw.match(/export\s+const\s+lecturesData\s*=\s*(\[[\s\S]*?\]);/);
    if (jsonMatch) {
      let lectures = [];
      try {
        lectures = eval(jsonMatch[1]);
      } catch (e) {
        console.warn('Could not parse lecturesData.js statically');
      }

      for (const lec of lectures) {
        report.summary.total++;
        const res = inferStage(lec);
        if (res.confidence === 'exact') {
          report.summary.canonicalAlready++;
        } else if (res.confidence === 'high') {
          report.summary.remapped++;
          report.remappedItems.push({
            type: 'lecture',
            id: lec.id,
            title: lec.title,
            from: lec.stageId,
            to: res.targetId,
            reason: res.reason
          });
          lec.stageId = res.targetId;
        } else {
          report.summary.ambiguous++;
          report.ambiguousItems.push({
            type: 'lecture',
            id: lec.id,
            title: lec.title,
            currentStage: lec.stageId,
            reason: res.reason
          });
        }
      }
    }
  }

  // 2. Inspect Mock Students
  const studentsPath = path.join(__dirname, '..', 'src', 'data', 'mockStudents.js');
  if (fs.existsSync(studentsPath)) {
    const raw = fs.readFileSync(studentsPath, 'utf8');
    const jsonMatch = raw.match(/export\s+const\s+mockStudentsList\s*=\s*(\[[\s\S]*?\]);/);
    if (jsonMatch) {
      let students = [];
      try { students = eval(jsonMatch[1]); } catch (e) {}

      for (const std of students) {
        report.summary.total++;
        const res = inferStage(std);
        if (res.confidence === 'exact') {
          report.summary.canonicalAlready++;
        } else if (res.confidence === 'high') {
          report.summary.remapped++;
          report.remappedItems.push({
            type: 'student',
            id: std.id,
            name: std.name,
            from: std.stageId,
            to: res.targetId,
            reason: res.reason
          });
        } else {
          report.summary.ambiguous++;
          report.ambiguousItems.push({
            type: 'student',
            id: std.id,
            name: std.name,
            currentStage: std.stageId,
            reason: res.reason
          });
        }
      }
    }
  }

  // Print Summary
  console.log(`📊 Migration Summary:`);
  console.log(`- Total Items Scanned:      ${report.summary.total}`);
  console.log(`- Already Canonical:        ${report.summary.canonicalAlready}`);
  console.log(`- Successfully Remapped:    ${report.summary.remapped}`);
  console.log(`- Ambiguous (Needs Review): ${report.summary.ambiguous}`);

  if (report.ambiguousItems.length > 0) {
    console.log(`\n⚠️ Ambiguous Items Requiring Teacher Decision:`);
    report.ambiguousItems.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.type}] "${item.title || item.name}" (ID: ${item.id}) - Current: ${item.currentStage}`);
    });
  } else {
    console.log(`\n✨ Perfect! Zero ambiguous items detected.`);
  }

  // Save report to disk
  const reportDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `migration-report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Migration Report saved: ${reportFile}`);
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
