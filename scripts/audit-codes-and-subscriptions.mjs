import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import curriculum entities
const stagesFile = path.join(rootDir, 'src', 'data', 'teacherData.js');
const lecturesFile = path.join(rootDir, 'src', 'data', 'lecturesData.js');
const studentsFile = path.join(rootDir, 'src', 'data', 'mockStudents.js');
const backupFile = path.join(rootDir, 'backups', 'backup-2026-11-06T01-55-02-631Z.json');

async function runDryRunAudit() {
  console.log('=============================================================');
  console.log('🔍 DRY-RUN AUDIT: CODES & SUBSCRIPTIONS SECURITY INSPECTION');
  console.log('Mode: READ-ONLY (Zero mutations executed)');
  console.log('Time:', new Date().toISOString());
  console.log('=============================================================\n');

  // Load Curriculum
  let stages = [];
  let sections = [];
  try {
    const tdContent = fs.readFileSync(stagesFile, 'utf8');
    const stagesMatch = tdContent.match(/export const initialStages = (\[[\s\S]*?\]);/);
    if (stagesMatch) stages = eval(stagesMatch[1]);
    const sectionsMatch = tdContent.match(/export const initialSections = (\[[\s\S]*?\]);/);
    if (sectionsMatch) sections = eval(sectionsMatch[1]);
  } catch (e) {
    console.warn('Could not parse teacherData:', e.message);
  }

  let lectures = [];
  try {
    const lecContent = fs.readFileSync(lecturesFile, 'utf8');
    const lecMatch = lecContent.match(/export const initialLecturesData = (\[[\s\S]*?\]);/);
    if (lecMatch) lectures = eval(lecMatch[1]);
  } catch (e) {
    console.warn('Could not parse lecturesData:', e.message);
  }

  let students = [];
  try {
    const stdContent = fs.readFileSync(studentsFile, 'utf8');
    const stdMatch = stdContent.match(/export const mockStudents = (\[[\s\S]*?\]);/);
    if (stdMatch) students = eval(stdMatch[1]);
  } catch (e) {
    console.warn('Could not parse mockStudents:', e.message);
  }

  // Load Backup Data
  let backupData = {};
  if (fs.existsSync(backupFile)) {
    try {
      backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    } catch (e) {}
  }

  // Audit Results Accumulator
  const auditResults = {
    check1_missingOrMismatchedTarget: [],
    check2_invalidTypesAndCounts: [],
    check3_testAndKnownCodes: [],
    check4_duplicatesAndWeakCodes: [],
    check5_orphanOrSuspiciousSubscriptions: [],
    check6_overusedCodes: []
  };

  const knownTestCodes = [
    'MS-SEC3-2026', 'MS-SEC2-2026', 'MS-SEC1-2026', 
    'MS-VIP-2026', 'MS-SEC3-8812', 'MS-SEC3-9942'
  ];

  // 1. Scan Codebase Source Files for Known Test Codes
  function scanSourceForCodes(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git', 'backups', 'audit-screenshots'].includes(entry.name)) {
          scanSourceForCodes(fullPath);
        }
      } else if (/\.(jsx?|tsx?|json)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const testCode of knownTestCodes) {
          if (content.includes(testCode)) {
            const relPath = path.relative(rootDir, fullPath);
            auditResults.check3_testAndKnownCodes.push({
              source: relPath,
              code: testCode,
              type: 'hardcoded_in_source'
            });
          }
        }
      }
    }
  }
  scanSourceForCodes(path.join(rootDir, 'src'));

  // 2. Scan Mock & Seed Codes
  const allCodesToAudit = [];

  // Add backup codes if any
  if (Array.isArray(backupData.codes)) {
    allCodesToAudit.push(...backupData.codes);
  }

  // Add sample/mock codes found in mock students
  students.forEach(std => {
    if (std.subscriptions) {
      Object.entries(std.subscriptions).forEach(([key, sub]) => {
        if (sub.activationCode) {
          allCodesToAudit.push({
            code: sub.activationCode,
            codeType: sub.type || sub.codeType || 'month',
            targetId: sub.targetId || key,
            targetTitle: sub.targetTitle || '',
            stageId: sub.stageId || '',
            maxUses: 1,
            usedCount: 1,
            isUsed: true,
            status: sub.status || 'active',
            expiryDate: sub.expirationDate || sub.expiresAt || '',
            source: `mock_student_${std.id}`
          });
        }
      });
    }
  });

  // Evaluate Codes
  const seenCodeStrings = new Map();

  allCodesToAudit.forEach(c => {
    const codeStr = (c.code || '').trim().toUpperCase();

    // Check 1: TargetId validity
    if (!c.targetId || !c.targetId.trim()) {
      auditResults.check1_missingOrMismatchedTarget.push({
        code: codeStr,
        issue: 'missing_target_id',
        details: 'Code has empty or missing targetId'
      });
    } else {
      const tid = c.targetId.trim();
      const isAllAccess = tid === 'all-access' || c.codeType === 'all-access';
      const stageMatch = stages.find(s => s.id === tid);
      const sectionMatch = sections.find(s => s.id === tid);
      const lectureMatch = lectures.find(l => l.id === tid);

      if (!isAllAccess && !stageMatch && !sectionMatch && !lectureMatch && !tid.startsWith('bundle-')) {
        auditResults.check1_missingOrMismatchedTarget.push({
          code: codeStr,
          targetId: tid,
          issue: 'target_not_found',
          details: 'targetId does not exist in stages, sections, or lectures'
        });
      } else if (sectionMatch) {
        // Check if section is empty (has 0 lectures)
        const secLectures = lectures.filter(l => l.sectionId === tid && !l.isDeleted);
        if (secLectures.length === 0) {
          auditResults.check1_missingOrMismatchedTarget.push({
            code: codeStr,
            targetId: tid,
            issue: 'empty_month_target',
            details: `Target month "${sectionMatch.title}" (${tid}) has 0 lectures`
          });
        }
        // Stage mismatch check
        if (c.stageId && sectionMatch.stageId && c.stageId !== sectionMatch.stageId) {
          auditResults.check1_missingOrMismatchedTarget.push({
            code: codeStr,
            targetId: tid,
            codeStage: c.stageId,
            sectionStage: sectionMatch.stageId,
            issue: 'stage_mismatch',
            details: `Code stage (${c.stageId}) does not match month stage (${sectionMatch.stageId})`
          });
        }
      }
    }

    // Check 2: Invalid Types & Counts
    const maxUses = Number(c.maxUses) || 1;
    const usedCount = Number(c.usedCount) || 0;
    if (usedCount > maxUses) {
      auditResults.check2_invalidTypesAndCounts.push({
        code: codeStr,
        maxUses,
        usedCount,
        issue: 'usedCount_exceeds_maxUses'
      });
    }
    if (c.isUsed && usedCount === 0) {
      auditResults.check2_invalidTypesAndCounts.push({
        code: codeStr,
        isUsed: c.isUsed,
        usedCount,
        issue: 'isUsed_true_with_zero_usedCount'
      });
    }
    if (c.expiryDate) {
      const expTime = new Date(c.expiryDate).getTime();
      if (!isNaN(expTime) && expTime < Date.now() && c.status === 'active') {
        auditResults.check2_invalidTypesAndCounts.push({
          code: codeStr,
          expiryDate: c.expiryDate,
          status: c.status,
          issue: 'expired_but_marked_active'
        });
      }
    }

    // Check 4: Duplicates & Weak Generation
    if (seenCodeStrings.has(codeStr)) {
      auditResults.check4_duplicatesAndWeakCodes.push({
        code: codeStr,
        issue: 'duplicate_code'
      });
    } else {
      seenCodeStrings.set(codeStr, true);
    }

    // Weak code check: shorter than 10 chars or ends with simple 4 digits
    if (codeStr.length < 10 || /-[0-9]{4}$/.test(codeStr)) {
      auditResults.check4_duplicatesAndWeakCodes.push({
        code: codeStr,
        issue: 'weak_entropy_guessable',
        details: 'Code uses weak 4-digit random suffix or is under 10 chars'
      });
    }

    // Check 6: Overused Codes
    if (usedCount > maxUses) {
      auditResults.check6_overusedCodes.push({
        code: codeStr,
        maxUses,
        usedCount
      });
    }
  });

  // Check 5: Student Subscriptions Audit
  students.forEach(std => {
    const subs = std.subscriptions || {};
    Object.entries(subs).forEach(([subKey, sub]) => {
      const targetId = sub.targetId || subKey;
      const subStage = sub.stageId || '';
      const expStr = sub.expirationDate || sub.expiresAt;
      const isExpired = expStr && new Date(expStr).getTime() < Date.now();

      // Check if expired but marked active
      if (isExpired && sub.status === 'active') {
        auditResults.check5_orphanOrSuspiciousSubscriptions.push({
          studentId: std.id,
          studentName: std.name,
          subscriptionKey: subKey,
          targetId,
          expirationDate: expStr,
          issue: 'expired_subscription_active',
          details: 'Subscription expiration date has passed but status is still "active"'
        });
      }

      // Check if subscription covers ANY lecture
      const coveredLecs = lectures.filter(l => {
        if (l.isDeleted) return false;
        if (targetId === 'all-access') return true;
        if (targetId === l.id) return true;
        if (targetId === l.sectionId) return true;
        if (subStage && l.stageId === subStage && (sub.type === 'stage' || sub.codeType === 'stage')) return true;
        return false;
      });

      if (coveredLecs.length === 0) {
        auditResults.check5_orphanOrSuspiciousSubscriptions.push({
          studentId: std.id,
          studentName: std.name,
          subscriptionKey: subKey,
          targetId,
          issue: 'orphan_subscription',
          details: 'Subscription does not cover any active lecture in the curriculum'
        });
      }
    });
  });

  // Display Report
  console.log('--- 1. Missing or Mismatched targetId ---');
  console.log(`Found ${auditResults.check1_missingOrMismatchedTarget.length} anomalies:`);
  console.log(JSON.stringify(auditResults.check1_missingOrMismatchedTarget, null, 2));

  console.log('\n--- 2. Invalid Types, Expiry & Count Sanity ---');
  console.log(`Found ${auditResults.check2_invalidTypesAndCounts.length} anomalies:`);
  console.log(JSON.stringify(auditResults.check2_invalidTypesAndCounts, null, 2));

  console.log('\n--- 3. Known / Test Codes in DB or Code ---');
  console.log(`Found ${auditResults.check3_testAndKnownCodes.length} occurrences:`);
  console.log(JSON.stringify(auditResults.check3_testAndKnownCodes, null, 2));

  console.log('\n--- 4. Duplicate or Weak Guessable Codes ---');
  console.log(`Found ${auditResults.check4_duplicatesAndWeakCodes.length} anomalies:`);
  console.log(JSON.stringify(auditResults.check4_duplicatesAndWeakCodes, null, 2));

  console.log('\n--- 5. Orphan, Expired-Active, or Suspicious Subscriptions ---');
  console.log(`Found ${auditResults.check5_orphanOrSuspiciousSubscriptions.length} anomalies:`);
  console.log(JSON.stringify(auditResults.check5_orphanOrSuspiciousSubscriptions, null, 2));

  console.log('\n--- 6. Overused Codes (usedCount > maxUses) ---');
  console.log(`Found ${auditResults.check6_overusedCodes.length} anomalies:`);
  console.log(JSON.stringify(auditResults.check6_overusedCodes, null, 2));

  console.log('\n=============================================================');
  console.log('✅ DRY-RUN AUDIT COMPLETE (Zero data was modified)');
  console.log('=============================================================');

  // Save full audit report artifact
  const outPath = path.join(rootDir, 'backups', 'codes-subscriptions-audit-report.json');
  fs.writeFileSync(outPath, JSON.stringify(auditResults, null, 2), 'utf8');
  console.log(`📄 Detailed Audit Report saved to: ${outPath}`);
}

runDryRunAudit().catch(console.error);
