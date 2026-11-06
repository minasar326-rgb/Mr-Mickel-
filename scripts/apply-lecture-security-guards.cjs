const fs = require('fs');
const path = require('path');

const contextPath = path.resolve(__dirname, '../src/context/TeacherContext.jsx');
let code = fs.readFileSync(contextPath, 'utf8');

// 1. mergeLectures: Anti-stale suppression for active lectures
const targetMerge = 'const incomingIds = new Set(incomingList.map(l => l.id).filter(Boolean));';
const replacementMerge = [
  'const incomingIds = new Set(incomingList.map(l => l.id).filter(Boolean));',
  '    const cloudDeletedSet = new Set(incomingDeletedIds || []);',
  '',
  '    // Safety: If incomingList has active lectures not in cloudDeletedSet,',
  '    // they were NEVER deleted by the teacher! Clear any stale local deletedIds.',
  '    incomingList.forEach(l => {',
  '      if (l && l.id && !l.isDeleted && !cloudDeletedSet.has(l.id)) {',
  '        if (deletedIds.has(l.id)) {',
  '          deletedIds.delete(l.id);',
  '        }',
  '      }',
  '    });'
].join('\r\n');

if (!code.includes('const cloudDeletedSet = new Set(incomingDeletedIds || []);')) {
  if (code.includes(targetMerge)) {
    code = code.replace(targetMerge, replacementMerge);
    console.log('1. mergeLectures anti-stale protection applied');
  } else {
    console.warn('1. targetMerge not found');
  }
} else {
  console.log('1. mergeLectures already protected');
}

// 2. applyCloudManifest: Clear localDeleted for active lectures from cloud
const targetApply = 'if (incomingLectures.length > 0 || deletedChanged) {';
const replacementApply = [
  'const cloudDeletedSet = new Set(incomingDeletedIds);',
  '    // Safety: If cloud manifest delivers active lectures not present in cloudDeletedSet,',
  '    // clear them from localDeleted immediately so they are never suppressed',
  '    incomingLectures.forEach(l => {',
  '      if (l && l.id && !l.isDeleted && !cloudDeletedSet.has(l.id) && localDeleted.has(l.id)) {',
  '        localDeleted.delete(l.id);',
  '        deletedChanged = true;',
  '      }',
  '    });',
  '    if (deletedChanged) {',
  '      try {',
  '        localStorage.setItem(\'ms_deleted_lectures\', JSON.stringify(Array.from(localDeleted)));',
  '      } catch (e) {}',
  '    }',
  '',
  '    if (incomingLectures.length > 0 || deletedChanged) {'
].join('\r\n');

if (!code.includes('// Safety: If cloud manifest delivers active lectures not present in cloudDeletedSet,')) {
  if (code.includes(targetApply)) {
    code = code.replace(targetApply, replacementApply);
    console.log('2. applyCloudManifest anti-stale protection applied');
  } else {
    console.warn('2. targetApply not found');
  }
} else {
  console.log('2. applyCloudManifest already protected');
}

// 3. deleteLecture: Strict Authorization Guard
const targetDelete = '    // Strict Owner-Only Hard Deletion Guard';
const replacementDelete = [
  '    // Strict Instructor/Teacher-Only Deletion Guard:',
  '    // NO ONE except the teacher or an authorized staff admin can EVER delete ANY lecture!',
  '    const isAuthorizedTeacher = (',
  '      role === \'instructor\' ||',
  '      currentUser?.role === \'super_admin\' || ',
  '      currentAdminUser?.role === \'super_admin\' || ',
  '      currentUser?.email === \'mrmichaelshehata@gmail.com\' ||',
  '      currentUser?.email === \'sareanymina@gmail.com\' ||',
  '      currentUser?.uid === \'teacher-admin\' ||',
  '      Boolean(verifyAdminSession()?.isValid) ||',
  '      Boolean(hasPermission(\'canManageLectures\'))',
  '    );',
  '',
  '    if (!isAuthorizedTeacher) {',
  '      console.error(\'[Security Alert] Unauthorized lecture deletion attempt blocked:\', lectureId);',
  '      addToast(\'عذراً! لا يمكن حذف المحاضرة أبداً إلا بواسطة المستر أو المدرس المصرح له فقط 🛡️\', \'error\', 6000);',
  '      return;',
  '    }',
  '',
  '    // Strict Owner-Only Hard Deletion Guard'
].join('\r\n');

if (!code.includes('// Strict Instructor/Teacher-Only Deletion Guard:')) {
  if (code.includes(targetDelete)) {
    code = code.replace(targetDelete, replacementDelete);
    console.log('3. deleteLecture authorization guard applied');
  } else {
    console.warn('3. targetDelete not found');
  }
} else {
  console.log('3. deleteLecture already guarded');
}

// 4. restoreLecture: Strict Authorization Guard
const targetRestore = '  const restoreLecture = async (lectureId) => {';
const replacementRestore = [
  '  const restoreLecture = async (lectureId) => {',
  '    const targetLecture = lectures.find(l => l.id === lectureId);',
  '    if (!targetLecture) return;',
  '    const modifierUid = currentUser?.uid || currentUser?.id || \'teacher-admin\';',
  '    const modifierName = currentUser?.name || teacherProfile.name || \'مستر مايكل شحاته\';',
  '',
  '    // Strict Instructor/Teacher-Only Restore Guard',
  '    const isAuthorizedTeacher = (',
  '      role === \'instructor\' ||',
  '      currentUser?.role === \'super_admin\' || ',
  '      currentAdminUser?.role === \'super_admin\' || ',
  '      currentUser?.email === \'mrmichaelshehata@gmail.com\' ||',
  '      currentUser?.email === \'sareanymina@gmail.com\' ||',
  '      currentUser?.uid === \'teacher-admin\' ||',
  '      Boolean(verifyAdminSession()?.isValid) ||',
  '      Boolean(hasPermission(\'canManageLectures\'))',
  '    );',
  '',
  '    if (!isAuthorizedTeacher) {',
  '      console.error(\'[Security Alert] Unauthorized lecture restore attempt blocked:\', lectureId);',
  '      addToast(\'عذراً! لا يمكن استعادة المحاضرات إلا بواسطة المستر أو المدرس المصرح له فقط 🛡️\', \'error\', 6000);',
  '      return;',
  '    }'
].join('\r\n');

const fullTargetRestore = [
  '  const restoreLecture = async (lectureId) => {',
  '    const targetLecture = lectures.find(l => l.id === lectureId);',
  '    if (!targetLecture) return;',
  '    const modifierUid = currentUser?.uid || currentUser?.id || \'teacher-admin\';',
  '    const modifierName = currentUser?.name || teacherProfile.name || \'مستر مايكل شحاته\';'
].join('\r\n');

if (!code.includes('// Strict Instructor/Teacher-Only Restore Guard')) {
  if (code.includes(fullTargetRestore)) {
    code = code.replace(fullTargetRestore, replacementRestore);
    console.log('4. restoreLecture authorization guard applied');
  } else {
    console.warn('4. fullTargetRestore not found');
  }
} else {
  console.log('4. restoreLecture already guarded');
}

// 5. Explicit deletedLectureIds in restoreLecture sync
const targetRestoreSync = 'syncLecturesManifestToR2(updated, { stages, sections }).catch(() => {});';
const replacementRestoreSync = 'syncLecturesManifestToR2(updated, { stages, sections, deletedLectureIds: Array.from(deletedIds) }).catch(() => {});';
if (code.includes(targetRestoreSync)) {
  code = code.replace(targetRestoreSync, replacementRestoreSync);
  console.log('5. restoreLecture sync updated');
}

fs.writeFileSync(contextPath, code, 'utf8');
console.log('Successfully saved TeacherContext.jsx');

// Now update vite.config.js
const vitePath = path.resolve(__dirname, '../vite.config.js');
let viteCode = fs.readFileSync(vitePath, 'utf8');

const targetVite = `              const safeDeletedIds = Array.from(new Set([
                ...(Array.isArray(parsed?.deletedLectureIds) ? parsed.deletedLectureIds : []),
                ...(Array.isArray(existingManifest?.deletedLectureIds) ? existingManifest.deletedLectureIds : [])
              ])).filter(Boolean);
              const deletedSet = new Set(safeDeletedIds);`;

const replacementVite = `              const incomingRaw = Array.isArray(parsed) ? parsed : (parsed?.lectures || []);
              const activeIncomingIds = new Set(
                incomingRaw.filter(l => l && l.id && !l.isDeleted).map(l => l.id)
              );

              const safeDeletedIds = Array.from(new Set([
                ...(Array.isArray(parsed?.deletedLectureIds) ? parsed.deletedLectureIds : []),
                ...(Array.isArray(existingManifest?.deletedLectureIds) ? existingManifest.deletedLectureIds : [])
              ])).filter(id => id && !activeIncomingIds.has(id));
              const deletedSet = new Set(safeDeletedIds);`;

if (!viteCode.includes('const activeIncomingIds = new Set(')) {
  if (viteCode.includes(targetVite)) {
    viteCode = viteCode.replace(targetVite, replacementVite);
    fs.writeFileSync(vitePath, viteCode, 'utf8');
    console.log('6. vite.config.js activeIncomingIds protection applied');
  } else {
    // Try with \r\n normalized
    const normalizedTarget = targetVite.replace(/\n/g, '\r\n');
    const normalizedReplacement = replacementVite.replace(/\n/g, '\r\n');
    if (viteCode.includes(normalizedTarget)) {
      viteCode = viteCode.replace(normalizedTarget, normalizedReplacement);
      fs.writeFileSync(vitePath, viteCode, 'utf8');
      console.log('6. vite.config.js (CRLF) activeIncomingIds protection applied');
    } else {
      console.warn('6. targetVite not found in vite.config.js');
    }
  }
} else {
  console.log('6. vite.config.js already protected');
}
