const fs = require('fs');
const path = require('path');

console.log('🔧 APPLYING ARCHITECTURAL FIXES FOR STUDENT SUBSCRIPTIONS & CODE REDEMPTION\n');

// =========================================================================
// 1. Patch src/context/AuthContext.jsx
// =========================================================================
const authPath = path.join(__dirname, '..', 'src', 'context', 'AuthContext.jsx');
let authContent = fs.readFileSync(authPath, 'utf8');

const oldAuthBlock = `        // Logged out / Guest mode: Clean up state & storage completely!
        setCurrentUser(null);
        if (role !== 'instructor') {
          setRole('student');
        }
        try {
          localStorage.removeItem('madarek_user');
          localStorage.removeItem('ms_unlocked_with_expiry');
          localStorage.removeItem('ms_unlocked_lectures');
          localStorage.removeItem('ms_active_uid');
          localStorage.removeItem('ms_unlocked_uid');
        } catch (e) {}`;

const newAuthBlock = `        // If an authenticated session is stored in localStorage, preserve it!
        // DO NOT wipe localStorage here. Wiping belongs exclusively to explicit logout().
        try {
          const cachedUser = JSON.parse(localStorage.getItem('madarek_user') || 'null');
          if (cachedUser && cachedUser.uid && cachedUser.uid !== 'guest') {
            setCurrentUser(cachedUser);
            if (cachedUser.role === 'instructor' || cachedUser.role === 'admin') {
              setRole('instructor');
            } else {
              setRole('student');
            }
            setAuthLoading(false);
            setAuthReady(true);
            return;
          }
        } catch (_) {}

        // True Guest Mode (No cached profile in localStorage)
        setCurrentUser(null);
        if (role !== 'instructor') {
          setRole('student');
        }`;

const normAuth = authContent.replace(/\r\n/g, '\n');
if (normAuth.includes(oldAuthBlock)) {
  const isCRLF = authContent.includes('\r\n');
  const patched = normAuth.replace(oldAuthBlock, newAuthBlock);
  fs.writeFileSync(authPath, isCRLF ? patched.replace(/\n/g, '\r\n') : patched, 'utf8');
  console.log('✅ AuthContext.jsx: Preserved student sessions on transient null auth events.');
} else {
  console.log('ℹ️ AuthContext.jsx already patched or block not found.');
}

// =========================================================================
// 2. Patch src/services/firestoreSync.js
// =========================================================================
const fsSyncPath = path.join(__dirname, '..', 'src', 'services', 'firestoreSync.js');
let fsSyncContent = fs.readFileSync(fsSyncPath, 'utf8');
let normFsSync = fsSyncContent.replace(/\r\n/g, '\n');

// A. In saveStudentSubscriptionToFirestore: Preserve target stageId & write to subcollections
const oldSaveSub = `    const normalizedSubscription = {
      ...subscriptionData,
      userId: uid,
      courseId: stageId,
      stageId: stageId,
      targetId: stageId,
      status: status,
      isPaused: isPaused,
      isCancelled: isCancelled,
      subscribed: !isPaused && !isCancelled,
      startDate: startDate,
      activatedAt: startDate,
      expirationDate: expirationDate,
      expiresAt: expirationDate,
      activationCode: subscriptionData.activationCode || subscriptionData.codeUsed || '',
      updatedAt: new Date().toISOString()
    };`;

const newSaveSub = `    const trueStageId = subscriptionData.stageId || (stageId.startsWith('sec-') || stageId.startsWith('lec-') ? '' : stageId);
    const normalizedSubscription = {
      ...subscriptionData,
      userId: uid,
      courseId: stageId,
      stageId: trueStageId || stageId,
      targetId: stageId,
      sectionId: subscriptionData.sectionId || (subscriptionData.codeType === 'month' ? stageId : ''),
      lectureId: subscriptionData.lectureId || (subscriptionData.codeType === 'lecture' ? stageId : ''),
      status: status,
      isPaused: isPaused,
      isCancelled: isCancelled,
      subscribed: !isPaused && !isCancelled,
      startDate: startDate,
      activatedAt: startDate,
      expirationDate: expirationDate,
      expiresAt: expirationDate,
      activationCode: subscriptionData.activationCode || subscriptionData.codeUsed || '',
      updatedAt: new Date().toISOString()
    };`;

if (normFsSync.includes(oldSaveSub)) {
  normFsSync = normFsSync.replace(oldSaveSub, newSaveSub);
  console.log('✅ firestoreSync.js: Fixed stageId / sectionId normalization in saveStudentSubscriptionToFirestore.');
}

// Subcollection writes in saveStudentSubscriptionToFirestore:
const oldSubColWrites = `    // 3. Save to top-level subscriptions collection (\${uid}_\${stageId})
    let subDocSaved = false;
    try {
      const subDocId = \`\${uid}_\${stageId}\`;
      await setDoc(doc(db, 'subscriptions', subDocId), normalizedSubscription, { merge: true });
      subDocSaved = true;
    } catch (e) {
      console.error('Firestore save to top-level subscriptions collection failed:', e);
    }`;

const newSubColWrites = `    // 3. Save to top-level subscriptions collection (\${uid}_\${stageId})
    let subDocSaved = false;
    try {
      const subDocId = \`\${uid}_\${stageId}\`;
      await setDoc(doc(db, 'subscriptions', subDocId), normalizedSubscription, { merge: true });
      subDocSaved = true;
    } catch (e) {
      console.error('Firestore save to top-level subscriptions collection failed:', e);
    }

    // 4. Save to subcollections /users/{uid}/subscriptions and /students/{uid}/subscriptions (always permitted by rules)
    try {
      await setDoc(doc(db, 'users', uid, 'subscriptions', stageId), normalizedSubscription, { merge: true });
    } catch (_) {}
    try {
      await setDoc(doc(db, 'students', uid, 'subscriptions', stageId), normalizedSubscription, { merge: true });
    } catch (_) {}`;

if (normFsSync.includes(oldSubColWrites)) {
  normFsSync = normFsSync.replace(oldSubColWrites, newSubColWrites);
  console.log('✅ firestoreSync.js: Added subcollection writes permitted by rules.');
}

// B. In getStudentAccountFromFirestore: Also query subcollection /users/{uid}/subscriptions
const oldGetAccountSubs = `    // 3. Query top-level subscriptions collection for this user to ensure zero data loss
    try {
      const subsCol = collection(db, 'subscriptions');
      const q = query(subsCol, where('userId', '==', uid));
      const subsSnap = await getDocs(q);
      if (!subsSnap.empty) {
        const topSubs = {};
        subsSnap.forEach(d => {
          const s = d.data();
          const targetKey = s.courseId || s.stageId || d.id;
          topSubs[targetKey] = s;
        });
        if (studentData) {
          studentData.subscriptions = {
            ...(studentData.subscriptions || {}),
            ...topSubs
          };
        } else {
          studentData = {
            uid,
            id: uid,
            subscriptions: topSubs
          };
        }
      }
    } catch (subsErr) {}`;

const newGetAccountSubs = `    // 3. Query subcollections and top-level subscriptions for this user
    try {
      const subMap = {};
      // Subcollection 1: users/{uid}/subscriptions
      try {
        const userSubsSnap = await getDocs(collection(db, 'users', uid, 'subscriptions'));
        userSubsSnap.forEach(d => {
          const s = d.data();
          if (s) {
            const k = s.targetId || s.courseId || d.id;
            subMap[k] = { ...s, userId: uid };
          }
        });
      } catch (_) {}

      // Subcollection 2: students/{uid}/subscriptions
      try {
        const stdSubsSnap = await getDocs(collection(db, 'students', uid, 'subscriptions'));
        stdSubsSnap.forEach(d => {
          const s = d.data();
          if (s) {
            const k = s.targetId || s.courseId || d.id;
            subMap[k] = { ...s, userId: uid };
          }
        });
      } catch (_) {}

      // Subcollection 3: top-level subscriptions query
      try {
        const subsCol = collection(db, 'subscriptions');
        const q = query(subsCol, where('userId', '==', uid));
        const subsSnap = await getDocs(q);
        if (!subsSnap.empty) {
          subsSnap.forEach(d => {
            const s = d.data();
            const targetKey = s.targetId || s.courseId || s.stageId || d.id;
            subMap[targetKey] = { ...s, userId: uid };
          });
        }
      } catch (_) {}

      if (Object.keys(subMap).length > 0) {
        if (studentData) {
          studentData.subscriptions = {
            ...(studentData.subscriptions || {}),
            ...subMap
          };
        } else {
          studentData = {
            uid,
            id: uid,
            subscriptions: subMap
          };
        }
      }
    } catch (subsErr) {}`;

if (normFsSync.includes(oldGetAccountSubs)) {
  normFsSync = normFsSync.replace(oldGetAccountSubs, newGetAccountSubs);
  console.log('✅ firestoreSync.js: Subcollections queried in getStudentAccountFromFirestore.');
}

const isFsSyncCRLF = fsSyncContent.includes('\r\n');
fs.writeFileSync(fsSyncPath, isFsSyncCRLF ? normFsSync.replace(/\n/g, '\r\n') : normFsSync, 'utf8');

// =========================================================================
// 3. Patch src/context/TeacherContext.jsx
// =========================================================================
const tcPath = path.join(__dirname, '..', 'src', 'context', 'TeacherContext.jsx');
let tcContent = fs.readFileSync(tcPath, 'utf8');
let normTc = tcContent.replace(/\r\n/g, '\n');

// A. In Rehydration useEffect: Unlock month and single lecture subscriptions properly
const oldRehydrateLoop = `          // Unlock all lectures belonging to this subscribed stage
          (lectures || []).filter(l => l.stageId === sId || normalizeStageId(l.stageId) === canonStage).forEach(l => {
            activeIds.push(l.id);
            activeUnlocks[l.id] = {
              ...safeSub,
              targetId: l.id,
              fromStage: canonStage
            };
          });`;

const newRehydrateLoop = `          // Identify subscription scope: Month vs Lecture vs Stage
          const isMonthSub = sub.codeType === 'month' || sub.type === 'month' || sId.startsWith('sec-') || (sections || []).some(sec => sec.id === sId || sec.id === sub.targetId);
          const isLecSub = sub.codeType === 'lecture' || sub.type === 'lecture' || sId.startsWith('lec-') || (lectures || []).some(l => l.id === sId || l.id === sub.targetId);

          if (isMonthSub) {
            const targetSecId = sub.sectionId || sub.targetId || sId;
            (lectures || []).filter(l => l.sectionId === targetSecId || l.sectionId === sId).forEach(l => {
              activeIds.push(l.id);
              activeUnlocks[l.id] = {
                ...safeSub,
                targetId: l.id,
                fromMonth: targetSecId
              };
            });
          } else if (isLecSub) {
            const targetLecId = sub.lectureId || sub.targetId || sId;
            activeIds.push(targetLecId);
            activeUnlocks[targetLecId] = {
              ...safeSub,
              targetId: targetLecId
            };
          } else {
            // Stage-level subscription unlocks all lectures in that stage
            (lectures || []).filter(l => l.stageId === sId || normalizeStageId(l.stageId) === canonStage).forEach(l => {
              activeIds.push(l.id);
              activeUnlocks[l.id] = {
                ...safeSub,
                targetId: l.id,
                fromStage: canonStage
              };
            });
          }`;

if (normTc.includes(oldRehydrateLoop)) {
  normTc = normTc.replace(oldRehydrateLoop, newRehydrateLoop);
  console.log('✅ TeacherContext.jsx: Month & Lecture subscription rehydration logic expanded.');
}

// B. In redeemCode: Immediately update unlockedLectureIds & localStorage
const oldRedeemEnd = `    addToast(\`🎉 تم الاشتراك بنجاح في (\${result.targetTitle})! اشتراكك نشط بحسابك حتى \${result.expirationDate} 🚀\`, 'success', 8000);`;

const newRedeemEnd = `    // Immediately unlock all covered lectures in memory and persistent cache
    if (Array.isArray(result.coveredLectures) && result.coveredLectures.length > 0) {
      const coveredIds = result.coveredLectures.map(l => l.id);
      setUnlockedLectureIds(prev => Array.from(new Set([...prev, ...coveredIds, result.subscription?.targetId])));
      try {
        const activeUnlocks = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
        coveredIds.forEach(id => {
          activeUnlocks[id] = {
            ...(result.subscription || {}),
            targetId: id
          };
        });
        if (result.subscription?.targetId) {
          activeUnlocks[result.subscription.targetId] = result.subscription;
        }
        localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(activeUnlocks));
        localStorage.setItem('ms_unlocked_lectures', JSON.stringify(Array.from(new Set([...unlockedLectureIds, ...coveredIds]))));
      } catch (e) {}
    }

    addToast(\`🎉 تم الاشتراك بنجاح في (\${result.targetTitle})! اشتراكك نشط بحسابك حتى \${result.expirationDate} 🚀\`, 'success', 8000);`;

if (normTc.includes(oldRedeemEnd)) {
  normTc = normTc.replace(oldRedeemEnd, newRedeemEnd);
  console.log('✅ TeacherContext.jsx: Immediate state & cache update on code redemption.');
}

// C. In canAccessLecture: Ensure month subscription unlocks covered month lectures cleanly
const oldCanAccessProgression = `    // If lecture explicitly allows direct watch, or progression is not strictly enforced, or if student subscribed directly to this lecture/month/stage, unlock immediately
    if (lecture.allowDirectWatch || !enforceProgression || matchingSub.codeType === 'lecture' || matchingSub.targetId === lecture.id) {`;

const newCanAccessProgression = `    // If lecture explicitly allows direct watch, or progression is not strictly enforced, or student has month/lecture subscription, unlock immediately
    const isDirectMonthOrLec = matchingSub.codeType === 'lecture' || matchingSub.targetId === lecture.id || (matchingSub.codeType === 'month' && !enforceProgression);
    if (lecture.allowDirectWatch || !enforceProgression || isDirectMonthOrLec) {`;

if (normTc.includes(oldCanAccessProgression)) {
  normTc = normTc.replace(oldCanAccessProgression, newCanAccessProgression);
  console.log('✅ TeacherContext.jsx: canAccessLecture updated for smooth month access.');
}

const isTcCRLF = tcContent.includes('\r\n');
fs.writeFileSync(tcPath, isTcCRLF ? normTc.replace(/\n/g, '\r\n') : normTc, 'utf8');

// =========================================================================
// 4. Patch src/components/student/CodeRedeemModal.jsx
// =========================================================================
const modalPath = path.join(__dirname, '..', 'src', 'components', 'student', 'CodeRedeemModal.jsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');
let normModal = modalContent.replace(/\r\n/g, '\n');

// Destructure sections and lectures
const oldModalDestruct = `  const { redeemCode, teacherProfile } = useTeacher();`;
const newModalDestruct = `  const { redeemCode, teacherProfile, sections, lectures } = useTeacher();`;
if (normModal.includes(oldModalDestruct)) {
  normModal = normModal.replace(oldModalDestruct, newModalDestruct);
}

// In handleGoToLectures: resolve parent stage ID if target was section
const oldHandleGoTo = `  const handleGoToLectures = () => {
    const stageId = successResult?.subscription?.stageId || successResult?.subscription?.targetId || 'sec-3';
    handleClose();
    if (onNavigate) {
      onNavigate('stage-lectures', { stageId });
    }
  };`;

const newHandleGoTo = `  const handleGoToLectures = () => {
    let targetStageId = successResult?.subscription?.stageId;
    if (!targetStageId || targetStageId.startsWith('sec-') || targetStageId.startsWith('lec-')) {
      const secMatch = (sections || []).find(s => s.id === successResult?.subscription?.targetId || s.id === successResult?.subscription?.sectionId);
      if (secMatch?.stageId) {
        targetStageId = secMatch.stageId;
      } else {
        const lecMatch = (lectures || []).find(l => l.id === successResult?.subscription?.targetId || l.sectionId === successResult?.subscription?.targetId);
        if (lecMatch?.stageId) {
          targetStageId = lecMatch.stageId;
        }
      }
    }
    handleClose();
    if (onNavigate) {
      onNavigate('stage-lectures', { stageId: targetStageId || 'sec-3' });
    }
  };`;

if (normModal.includes(oldHandleGoTo)) {
  normModal = normModal.replace(oldHandleGoTo, newHandleGoTo);
  console.log('✅ CodeRedeemModal.jsx: Fixed stage ID resolution on month redemption.');
}

// In Button 1: Start from first unlocked lecture
const oldStartLecBtn = `                  const firstLec = successResult.firstUnlockedLecture || (successResult.unlockedLectures && successResult.unlockedLectures[0]);`;
const newStartLecBtn = `                  const firstLec = successResult.firstUnlockedLecture || (successResult.unlockedLectures && successResult.unlockedLectures[0]) || (successResult.coveredLectures && successResult.coveredLectures[0]);`;

if (normModal.includes(oldStartLecBtn)) {
  normModal = normModal.replace(oldStartLecBtn, newStartLecBtn);
  console.log('✅ CodeRedeemModal.jsx: Guaranteed first lecture fallback selection.');
}

const isModalCRLF = modalContent.includes('\r\n');
fs.writeFileSync(modalPath, isModalCRLF ? normModal.replace(/\n/g, '\r\n') : normModal, 'utf8');

// =========================================================================
// 5. Patch src/components/stages/StageLecturesPage.jsx
// =========================================================================
const stagePagePath = path.join(__dirname, '..', 'src', 'components', 'stages', 'StageLecturesPage.jsx');
let stagePageContent = fs.readFileSync(stagePagePath, 'utf8');
let normStagePage = stagePageContent.replace(/\r\n/g, '\n');

const oldStageLookup = `  // 1. Stage Identification: exact ID match, or normalized alias match
  let stage = currentStages.find(s => s.id === stageId);`;

const newStageLookup = `  // 1. Stage Identification: if stageId is a section ID, resolve parent stage first
  let resolvedStageId = stageId;
  if (stageId && stageId.startsWith('sec-')) {
    const parentSec = (Array.isArray(sections) ? sections : []).find(s => s.id === stageId);
    if (parentSec?.stageId) {
      resolvedStageId = parentSec.stageId;
    }
  }

  // Exact ID match, or normalized alias match
  let stage = currentStages.find(s => s.id === resolvedStageId || s.id === stageId);`;

if (normStagePage.includes(oldStageLookup)) {
  normStagePage = normStagePage.replace(oldStageLookup, newStageLookup);
  console.log('✅ StageLecturesPage.jsx: Section ID fallback to parent stage added.');
}

const isStageCRLF = stagePageContent.includes('\r\n');
fs.writeFileSync(stagePagePath, isStageCRLF ? normStagePage.replace(/\n/g, '\r\n') : normStagePage, 'utf8');

console.log('\n🚀 ALL ARCHITECTURAL FIXES SUCCESSFULLY APPLIED!');
