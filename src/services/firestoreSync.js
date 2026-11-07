import { normalize10DigitCode } from '../utils/codeNormalizer.js';
import { 
  collection, doc, setDoc, getDoc, getDocs, onSnapshot, 
  addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as rtdbRef, set as rtdbSet, remove as rtdbRemove, onValue as rtdbOnValue, get as rtdbGet } from 'firebase/database';
import { db, storage, rtdb } from './firebase.js';

/**
 * Save or update teacher profile in Firestore & Realtime Database
 */
export async function syncTeacherProfile(profileData) {
  try {
    const docRef = doc(db, 'settings', 'teacherProfile');
    await setDoc(docRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'teacherProfile'), profileData);
      } catch (e) {}
    }
    return { success: true };
  } catch (error) {
    console.warn('Firebase sync warning (Profile):', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Save or update student in Firestore & Realtime Database
 */
export async function saveStudentToFirestore(student) {
  try {
    const docRef = doc(db, 'students', student.id);
    await setDoc(docRef, {
      ...student,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'students/' + student.id), student);
      } catch (e) {}
    }
    return { success: true };
  } catch (error) {
    console.warn('Firebase sync warning (Student):', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Delete student from Firestore
 */
export async function deleteStudentFromFirestore(studentId) {
  try {
    const docRef = doc(db, 'students', studentId);
    await deleteDoc(docRef);
    if (rtdb) {
      try {
        await rtdbRemove(rtdbRef(rtdb, 'students/' + studentId));
      } catch (e) {}
    }
    return { success: true };
  } catch (error) {
    console.warn('Firebase sync warning (Delete Student):', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Save multiple students in batch
 */
export async function batchSyncStudents(studentsList) {
  try {
    for (const std of studentsList) {
      const docRef = doc(db, 'students', std.id);
      await setDoc(docRef, { ...std, updatedAt: serverTimestamp() }, { merge: true });
      if (rtdb) {
        try {
          await rtdbSet(rtdbRef(rtdb, 'students/' + std.id), std);
        } catch (e) {}
      }
    }
    return { success: true };
  } catch (error) {
    console.warn('Firebase batch sync warning:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Save or update lecture in Firestore & Realtime Database permanently
 */
export async function saveLectureToFirestore(lecture) {
  try {
    const docRef = doc(db, 'lectures', lecture.id);
    await setDoc(docRef, {
      ...lecture,
      isPermanent: true,
      lastSavedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Also mirror to courses/{courseId}/lectures/{lectureId}
    if (lecture.stageId) {
      try {
        const courseLecRef = doc(db, 'courses', lecture.stageId, 'lectures', lecture.id);
        await setDoc(courseLecRef, {
          ...lecture,
          isPermanent: true,
          lastSavedAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {}
    }

    if (rtdb) {
      try {
        // Strip large binary blobs if any exist on the object before RTDB set
        const { videoBlob, blob, ...rtdbLecture } = lecture;
        await rtdbSet(rtdbRef(rtdb, 'lectures/' + lecture.id), {
          ...rtdbLecture,
          isPermanent: true,
          lastSavedAt: new Date().toISOString()
        });
      } catch (e) {}
    }
    return { success: true };
  } catch (error) {
    console.warn('Firebase sync warning (Lecture):', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Delete lecture from Firestore & Realtime Database (only triggered when teacher explicitly deletes)
 */
export async function deleteLectureFromFirestore(lectureId, stageId) {
  try {
    const docRef = doc(db, 'lectures', lectureId);
    await deleteDoc(docRef);

    if (stageId) {
      try {
        const courseLecRef = doc(db, 'courses', stageId, 'lectures', lectureId);
        await deleteDoc(courseLecRef);
      } catch (e) {}
    }

    if (rtdb) {
      try {
        await rtdbRemove(rtdbRef(rtdb, 'lectures/' + lectureId));
      } catch (e) {}
    }
    return { success: true };
  } catch (error) {
    console.warn('Firebase sync warning (Delete Lecture):', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Real-time listener for lectures
 */
export function listenToLectures(callback) {
  try {
    const lecturesCol = collection(db, 'lectures');
    const unsub = onSnapshot(lecturesCol, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(docs);
    }, (err) => {
      console.warn('Firestore lectures listener notice:', err.message);
    });
    return unsub;
  } catch (e) {
    console.warn('Could not establish lectures listener:', e);
    return () => {};
  }
}

/**
 * Real-time listener for students
 */
export function listenToStudents(callback) {
  try {
    const studentsCol = collection(db, 'students');
    const unsub = onSnapshot(studentsCol, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(docs);
    }, (err) => {
      console.warn('Firestore students listener notice:', err.message);
    });
    return unsub;
  } catch (e) {
    console.warn('Could not establish students listener:', e);
    return () => {};
  }
}

/**
 * Real-time listener for Realtime Database node (Instant multi-device sync)
 */
export function listenToRtdbNode(nodePath, callback) {
  if (!rtdb) return () => {};
  try {
    const nodeRef = rtdbRef(rtdb, nodePath);
    const unsub = rtdbOnValue(nodeRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        callback({ exists: true, data: val });
      } else {
        callback({ exists: false, data: null });
      }
    }, (err) => {
      console.warn(`RTDB listener warning (${nodePath}):`, err.message);
    });
    return unsub;
  } catch (e) {
    console.warn(`Could not listen to RTDB (${nodePath}):`, e);
    return () => {};
  }
}

/**
 * Save data to Realtime Database node
 */
export async function saveToRtdb(nodePath, data) {
  if (!rtdb) return { success: false };
  try {
    await rtdbSet(rtdbRef(rtdb, nodePath), data);
    return { success: true };
  } catch (err) {
    console.warn(`RTDB save warning (${nodePath}):`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Remove Realtime Database node
 */
export async function removeFromRtdb(nodePath) {
  if (!rtdb) return { success: false };
  try {
    await rtdbRemove(rtdbRef(rtdb, nodePath));
    return { success: true };
  } catch (err) {
    console.warn(`RTDB remove warning (${nodePath}):`, err.message);
    return { success: false, error: err.message };
  }
}

export async function syncStagesToCloud(stages) {
  try {
    await setDoc(doc(db, 'settings', 'stages'), { list: stages, updatedAt: serverTimestamp() }, { merge: true });
    if (Array.isArray(stages)) {
      for (const stg of stages) {
        if (stg?.id) {
          await setDoc(doc(db, 'courses', stg.id), {
            ...stg,
            courseId: stg.id,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    }
  } catch (e) {}
  return await saveToRtdb('stages', stages);
}

export async function syncBookletToCloud(booklet) {
  try {
    await setDoc(doc(db, 'booklets', booklet.id), { ...booklet, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {}
  return await saveToRtdb('booklets/' + booklet.id, booklet);
}

export async function deleteBookletFromCloud(bookletId) {
  try {
    await deleteDoc(doc(db, 'booklets', bookletId));
  } catch (e) {}
  return await removeFromRtdb('booklets/' + bookletId);
}

export async function syncAchieverToCloud(achiever) {
  try {
    await setDoc(doc(db, 'achievers', achiever.id), { ...achiever, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {}
  return await saveToRtdb('achievers/' + achiever.id, achiever);
}

export async function deleteAchieverFromCloud(achieverId) {
  try {
    await deleteDoc(doc(db, 'achievers', achieverId));
  } catch (e) {}
  return await removeFromRtdb('achievers/' + achieverId);
}

export async function syncCodeToCloud(code) {
  try {
    const cleanCode = normalize10DigitCode(code.code);
    const firestoreData = { ...code, code: cleanCode, updatedAt: serverTimestamp() };
    const rtdbData = { ...code, code: cleanCode, updatedAt: new Date().toISOString() };
    
    if (db) {
      await setDoc(doc(db, 'codes', cleanCode), firestoreData, { merge: true }).catch(err => console.warn('Firestore code sync notice:', err.message));
      await setDoc(doc(db, 'subscriptionCodes', cleanCode), firestoreData, { merge: true }).catch(() => {});
    }
    if (rtdb) {
      await saveToRtdb('codes/' + cleanCode, rtdbData);
      await saveToRtdb('subscriptionCodes/' + cleanCode, rtdbData);
    }
  } catch (e) {
    console.warn('syncCodeToCloud notice:', e);
  }
  return true;
}

export async function deleteCodeFromCloud(codeStr) {
  try {
    const cleanCode = codeStr.trim().toUpperCase();
    await deleteDoc(doc(db, 'codes', cleanCode));
    await deleteDoc(doc(db, 'subscriptionCodes', cleanCode));
    if (rtdb) {
      await removeFromRtdb('codes/' + cleanCode);
      await removeFromRtdb('subscriptionCodes/' + cleanCode);
    }
  } catch (e) {}
  return true;
}

export async function syncAnnouncementToCloud(ann) {
  try {
    await setDoc(doc(db, 'announcements', ann.id), { ...ann, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {}
  return await saveToRtdb('announcements/' + ann.id, ann);
}

export async function deleteAnnouncementFromCloud(annId) {
  try {
    await deleteDoc(doc(db, 'announcements', annId));
  } catch (e) {}
  return await removeFromRtdb('announcements/' + annId);
}

export function listenToFirestoreCollection(colName, callback) {
  try {
    const colRef = collection(db, colName);
    const unsub = onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(docs);
    }, (err) => {
      console.warn(`Firestore listener warning (${colName}):`, err.message);
    });
    return unsub;
  } catch (e) {
    console.warn(`Could not listen to Firestore (${colName}):`, e);
    return () => {};
  }
}

export function listenToStages(callback) {
  try {
    const docRef = doc(db, 'settings', 'stages');
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          callback(data.list);
        }
      }
    }, (err) => {
      console.warn('Firestore stages listener warning:', err.message);
    });
    return unsub;
  } catch (e) {
    return () => {};
  }
}


/**
 * Upload file directly to Firebase Storage with detailed progress tracking
 */
export function uploadFileToFirebaseStorage(file, folderPath, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      // Clean filename and make unique
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${folderPath}/${Date.now()}_${cleanName}`;
      const fileRef = ref(storage, uniqueFileName);
      
      const uploadTask = uploadBytesResumable(fileRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          originalName: file.name,
          uploadedBy: 'Teacher Michael Shehata',
          uploadedAt: new Date().toISOString()
        }
      });

      // Safety timeout: If 0 bytes transferred after 6 seconds, abort so UI doesn't hang
      let hasStarted = false;
      const timeoutId = setTimeout(() => {
        if (!hasStarted) {
          try { uploadTask.cancel(); } catch (e) {}
          reject(new Error('Firebase Storage bucket not activated or unreachable'));
        }
      }, 6000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.bytesTransferred > 0) {
            hasStarted = true;
          }
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) || 0;
          const transferredMB = (snapshot.bytesTransferred / (1024 * 1024)).toFixed(1);
          const totalMB = (snapshot.totalBytes / (1024 * 1024)).toFixed(1);
          if (onProgress) {
            onProgress({
              percent: progress,
              transferredMB,
              totalMB,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state
            });
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('Firebase Storage upload notice:', error?.message || error);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              downloadUrl,
              storagePath: uniqueFileName,
              fileName: file.name,
              fileSize: file.size
            });
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Save or update student account profile in Firestore (users & students collections) & RTDB
 */
export async function saveStudentAccountToFirestore(studentData) {
  if (!studentData?.uid && !studentData?.id) return { success: false, error: 'Missing UID' };
  const uid = studentData.uid || studentData.id;
  try {
    const dataToSave = {
      uid,
      id: uid,
      name: studentData.name || 'طالب جديد',
      email: studentData.email || '',
      photoURL: studentData.photoURL || studentData.avatar || '',
      avatar: studentData.photoURL || studentData.avatar || '',
      createdAt: studentData.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      subscriptions: studentData.subscriptions || {},
      updatedAt: serverTimestamp()
    };

    // Save to both students and users collections for full compatibility
    await setDoc(doc(db, 'students', uid), dataToSave, { merge: true });
    await setDoc(doc(db, 'users', uid), dataToSave, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'students/' + uid), dataToSave);
        await rtdbSet(rtdbRef(rtdb, 'users/' + uid), dataToSave);
      } catch (e) {}
    }
    return { success: true, data: dataToSave };
  } catch (error) {
    console.warn('Firebase student account sync warning:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Normalize student data to support both nested subscriptions and legacy flat dotted keys
 */
export function normalizeStudentData(rawData) {
  if (!rawData || typeof rawData !== 'object') return rawData;
  const subscriptions = { ...(rawData.subscriptions || {}) };

  // Collect any flat keys saved with "subscriptions.xxx"
  Object.keys(rawData).forEach(key => {
    if (key.startsWith('subscriptions.') && rawData[key]) {
      const subKey = key.replace('subscriptions.', '');
      subscriptions[subKey] = rawData[key];
    }
  });

  return {
    ...rawData,
    subscriptions
  };
}

/**
 * Retrieve student account and subscriptions from Firestore (checking users, students, and top-level subscriptions)
 */
export async function getStudentAccountFromFirestore(uid) {
  if (!uid) return null;
  try {
    let studentData = null;

    // 1. Try users collection
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        studentData = normalizeStudentData(userSnap.data());
      }
    } catch (e) {}

    // 2. Try students collection if not found in users
    if (!studentData) {
      try {
        const studentSnap = await getDoc(doc(db, 'students', uid));
        if (studentSnap.exists()) {
          studentData = normalizeStudentData(studentSnap.data());
        }
      } catch (e) {}
    }

    // 3. Query subcollections and top-level subscriptions for this user
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
    } catch (subsErr) {}

    return studentData;
  } catch (error) {
    console.warn('Firebase get student account error:', error.message);
  }
  return null;
}

/**
 * Save or update student subscription in Firestore & RTDB (synchronized across students, users, and top-level subscriptions collection)
 */
export async function saveStudentSubscriptionToFirestore(uid, stageId, subscriptionData) {
  if (!uid || !stageId) return { success: false, error: 'Missing parameters' };
  try {
    const startDate = subscriptionData.startDate || subscriptionData.activatedAt || new Date().toISOString();
    const expirationDate = subscriptionData.expirationDate || subscriptionData.expiresAt;

    const status = subscriptionData.status || 'active';
    const isPaused = status === 'paused' || Boolean(subscriptionData.isPaused);
    const isCancelled = status === 'cancelled' || Boolean(subscriptionData.isCancelled);

    const trueStageId = subscriptionData.stageId || (stageId.startsWith('sec-') || stageId.startsWith('lec-') ? '' : stageId);
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
    };

    // 1. Save to students collection
    let studentsSaved = false;
    try {
      await setDoc(doc(db, 'students', uid), {
        subscriptions: {
          [stageId]: normalizedSubscription
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      studentsSaved = true;
    } catch (e) {
      console.error('Firestore save to students collection failed:', e);
    }

    // 2. Save to users collection
    let usersSaved = false;
    try {
      await setDoc(doc(db, 'users', uid), {
        subscriptions: {
          [stageId]: normalizedSubscription
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      usersSaved = true;
    } catch (e) {
      console.error('Firestore save to users collection failed:', e);
    }

    // 3. Save to top-level subscriptions collection (${uid}_${stageId})
    let subDocSaved = false;
    try {
      const subDocId = `${uid}_${stageId}`;
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
    } catch (_) {}

    // 4. Save to RTDB for instant multi-device sync
    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, `students/${uid}/subscriptions/${stageId}`), normalizedSubscription);
        await rtdbSet(rtdbRef(rtdb, `users/${uid}/subscriptions/${stageId}`), normalizedSubscription);
        await rtdbSet(rtdbRef(rtdb, `subscriptions/${uid}_${stageId}`), normalizedSubscription);
      } catch (e) {
        console.warn('RTDB subscription sync warning:', e);
      }
    }

    // Verification: At least one primary Firestore document must have succeeded
    if (!studentsSaved && !usersSaved && !subDocSaved) {
      throw new Error('فشل حفظ وتأكيد الاشتراك في قاعدة البيانات السحابية.');
    }

    return { success: true, subscription: normalizedSubscription };
  } catch (error) {
    console.error('Firebase subscription save critical error:', error);
    return { success: false, error: error.message || 'فشل حفظ الاشتراك سحابياً' };
  }
}

/**
 * Update student subscription status (e.g. paused, resumed, extended, cancelled) across all cloud collections
 */
export async function updateStudentSubscriptionStatusInCloud(uid, targetId, statusUpdate) {
  if (!uid || !targetId) return { success: false, error: 'Missing parameters' };
  try {
    const payload = {
      ...statusUpdate,
      updatedAt: new Date().toISOString()
    };

    // Update students document
    try {
      await setDoc(doc(db, 'students', uid), {
        subscriptions: {
          [targetId]: payload
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {}

    // Update users document
    try {
      await setDoc(doc(db, 'users', uid), {
        subscriptions: {
          [targetId]: payload
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {}

    // Update top-level subscriptions document
    try {
      const subDocId = `${uid}_${targetId}`;
      await setDoc(doc(db, 'subscriptions', subDocId), payload, { merge: true });
    } catch (e) {}

    // Update RTDB for instant push to active student clients
    if (rtdb) {
      try {
        const rtdbPaths = [
          `students/${uid}/subscriptions/${targetId}`,
          `users/${uid}/subscriptions/${targetId}`,
          `subscriptions/${uid}_${targetId}`
        ];
        for (const p of rtdbPaths) {
          const currentSnap = await rtdbGet(rtdbRef(rtdb, p));
          const existing = currentSnap.exists() ? currentSnap.val() : {};
          await rtdbSet(rtdbRef(rtdb, p), { ...existing, ...payload });
        }
      } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    console.warn('Firebase updateStudentSubscriptionStatusInCloud error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Record an audit log entry in Firestore & RTDB for subscription security
 */
export async function saveAuditLogToCloud(logEntry) {
  if (!logEntry) return;
  try {
    const logId = logEntry.id || `log-${Date.now()}`;
    await setDoc(doc(db, 'auditLogs', logId), {
      ...logEntry,
      createdAt: serverTimestamp()
    }, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, `auditLogs/${logId}`), logEntry);
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Audit log cloud save warning:', e.message);
  }
}

/**
 * Real-time listener for current student's account & subscriptions in Firestore and RTDB
 */
export function listenToStudentAccount(uid, callback) {
  if (!uid) return () => {};

  let isUnsubscribed = false;
  let unsubFirestore = () => {};

  try {
    const docRef = doc(db, 'students', uid);
    unsubFirestore = onSnapshot(docRef, (snapshot) => {
      if (isUnsubscribed) return;
      if (snapshot.exists()) {
        callback(normalizeStudentData(snapshot.data()));
      }
    }, (err) => {
      console.warn('Firestore student profile listener notice:', err.message);
    });
  } catch (e) {
    console.warn('Error establishing Firestore student listener:', e);
  }

  // Backup RTDB listener for instant multi-device sync
  const unsubRtdb = listenToRtdbNode(`students/${uid}`, ({ exists, data }) => {
    if (isUnsubscribed) return;
    if (exists && data) {
      callback(normalizeStudentData(data));
    }
  });

  return () => {
    isUnsubscribed = true;
    if (typeof unsubFirestore === 'function') unsubFirestore();
    if (typeof unsubRtdb === 'function') unsubRtdb();
  };
}

/**
 * Direct check for activation code from cloud database (Firestore + RTDB)
 */
export async function fetchCodeFromCloud(cleanCode) {
  if (!cleanCode) return null;
  const normalized = normalize10DigitCode(cleanCode);

  // 1. Try RTDB first (fastest across mobile networks in Egypt and unrestricted)
  if (rtdb) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, 'codes/' + normalized));
      if (snap.exists()) {
        return snap.val();
      }
      const subSnap = await rtdbGet(rtdbRef(rtdb, 'subscriptionCodes/' + normalized));
      if (subSnap.exists()) {
        return subSnap.val();
      }
    } catch (e) {
      console.warn('RTDB code fetch notice:', e.message);
    }
  }

  // 2. Try Firestore
  if (db) {
    try {
      const docRef = doc(db, 'codes', normalized);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      const subDocRef = doc(db, 'subscriptionCodes', normalized);
      const subSnap = await getDoc(subDocRef);
      if (subSnap.exists()) {
        return subSnap.data();
      }
    } catch (e) {
      console.warn('Firestore code fetch notice:', e.message);
    }
  }

  // 3. Try Global Cloud Manifest (Cloudflare R2 CDN, 100% reachable from any phone)
  try {
    if (typeof window !== 'undefined') {
      const manifestCodes = window.__MS_PLATFORM_MANIFEST__?.codes || [];
      const found = manifestCodes.find(c => normalize10DigitCode(c.code) === normalized);
      if (found) return found;
    }
  } catch (e) {}

  // 4. Try Local Storage
  try {
    if (typeof localStorage !== 'undefined') {
      const local = JSON.parse(localStorage.getItem('ms_codes') || '[]');
      const found = local.find(c => normalize10DigitCode(c.code) === normalized);
      if (found) return found;
    }
  } catch (e) {}

  return null;
}

/**
 * Mark activation code as used permanently in cloud database
 */
export async function markCodeAsUsedInCloud(cleanCode, updatedCodeData) {
  if (!cleanCode || !updatedCodeData) return false;
  const normalized = normalize10DigitCode(cleanCode);
  try {
    const maxUses = Number(updatedCodeData.maxUses) || 1;
    const usedCount = Number(updatedCodeData.usedCount) || (updatedCodeData.isUsed ? 1 : 0);
    const isFullyUsed = usedCount >= maxUses;
    const effectiveStatus = isFullyUsed ? 'used' : 'active';

    const firestoreData = {
      ...updatedCodeData,
      code: normalized,
      usedCount: usedCount,
      maxUses: maxUses,
      isUsed: isFullyUsed,
      status: effectiveStatus,
      updatedAt: serverTimestamp()
    };

    const rtdbData = {
      ...updatedCodeData,
      code: normalized,
      usedCount: usedCount,
      maxUses: maxUses,
      isUsed: isFullyUsed,
      status: effectiveStatus,
      updatedAt: new Date().toISOString()
    };

    if (db) {
      await setDoc(doc(db, 'codes', normalized), firestoreData, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'subscriptionCodes', normalized), firestoreData, { merge: true }).catch(() => {});
    }

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'codes/' + normalized), rtdbData);
        await rtdbSet(rtdbRef(rtdb, 'subscriptionCodes/' + normalized), rtdbData);
      } catch (e) {
        console.warn('RTDB code update notice:', e);
      }
    }
    return true;
  } catch (e) {
    console.error('Error marking code as used in cloud:', e);
    return false;
  }
}

/**
 * ===============================================================
 * Centralized Platform Management: Multi-Admin, RBAC, Audit & Backups
 * ===============================================================
 */

/**
 * Save or update an admin/staff user in Firestore & RTDB
 */
export async function saveAdminUserToCloud(adminUser) {
  if (!adminUser || !adminUser.id) return { success: false, error: 'Missing adminUser ID' };
  try {
    const adminData = {
      ...adminUser,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'adminUsers', adminUser.id), adminData, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'adminUsers/' + adminUser.id), {
          ...adminUser,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    console.warn('saveAdminUserToCloud warning:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete an admin user without affecting ANY lectures, exams, or platform assets
 */
export async function deleteAdminUserFromCloud(adminId) {
  if (!adminId) return { success: false };
  try {
    await deleteDoc(doc(db, 'adminUsers', adminId));
    if (rtdb) {
      try {
        await rtdbRemove(rtdbRef(rtdb, 'adminUsers/' + adminId));
      } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    console.warn('deleteAdminUserFromCloud warning:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Real-time listener for admin users
 */
export function listenToAdminUsers(callback) {
  try {
    const col = collection(db, 'adminUsers');
    const unsub = onSnapshot(col, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    }, (err) => {
      console.warn('listenToAdminUsers notice:', err.message);
    });
    return unsub;
  } catch (e) {
    console.warn('Could not establish adminUsers listener:', e);
    return () => {};
  }
}

/**
 * Log platform audit trail action
 */
export async function logPlatformAuditAction(auditData) {
  try {
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullLog = {
      id: logId,
      ...auditData,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    };

    // Save to Firestore auditLogs collection
    try {
      await setDoc(doc(db, 'auditLogs', logId), fullLog);
    } catch (e) {}

    // Save to RTDB auditLogs node for instant reactivity
    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'auditLogs/' + logId), fullLog);
      } catch (e) {}
    }
    return { success: true, logId };
  } catch (err) {
    console.warn('logPlatformAuditAction notice:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Real-time listener for audit logs
 */
export function listenToAuditLogs(callback) {
  try {
    const col = collection(db, 'auditLogs');
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(list);
    }, (err) => {
      // Fallback to unordered if index is pending
      const unsubFallback = onSnapshot(col, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        callback(list);
      }, () => {});
      return unsubFallback;
    });
    return unsub;
  } catch (e) {
    return () => {};
  }
}

