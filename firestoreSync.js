import { 
  collection, doc, setDoc, getDoc, getDocs, onSnapshot, 
  addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as rtdbRef, set as rtdbSet, remove as rtdbRemove, onValue as rtdbOnValue, get as rtdbGet } from 'firebase/database';
import { db, storage, rtdb } from './firebase';

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
export async function deleteLectureFromFirestore(lectureId) {
  try {
    const docRef = doc(db, 'lectures', lectureId);
    await deleteDoc(docRef);

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
    await setDoc(doc(db, 'codes', code.code), { ...code, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {}
  return await saveToRtdb('codes/' + code.code, code);
}

export async function deleteCodeFromCloud(codeStr) {
  try {
    await deleteDoc(doc(db, 'codes', codeStr));
  } catch (e) {}
  return await removeFromRtdb('codes/' + codeStr);
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
 * Record student attendance log in Firestore
 */
export async function recordAttendanceToFirestore(attendanceRecord) {
  try {
    const colRef = collection(db, 'attendanceLogs');
    const docRes = await addDoc(colRef, {
      ...attendanceRecord,
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRes.id };
  } catch (error) {
    console.warn('Firebase sync warning (Attendance):', error.message);
    return { success: false, error: error.message };
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
 * Save or update student account profile in Firestore & RTDB
 */
export async function saveStudentAccountToFirestore(studentData) {
  if (!studentData?.uid) return { success: false, error: 'Missing UID' };
  try {
    const docRef = doc(db, 'students', studentData.uid);
    const dataToSave = {
      uid: studentData.uid,
      id: studentData.uid,
      name: studentData.name || 'طالب جديد',
      email: studentData.email || '',
      photoURL: studentData.photoURL || '',
      createdAt: studentData.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      subscriptions: studentData.subscriptions || {},
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, dataToSave, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'students/' + studentData.uid), dataToSave);
      } catch (e) {}
    }
    return { success: true, data: dataToSave };
  } catch (error) {
    console.warn('Firebase student account sync warning:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieve student account and subscriptions from Firestore
 */
export async function getStudentAccountFromFirestore(uid) {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'students', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('Firebase get student account error:', error.message);
  }
  return null;
}

/**
 * Save or update student subscription in Firestore & RTDB
 */
export async function saveStudentSubscriptionToFirestore(uid, stageId, subscriptionData) {
  if (!uid || !stageId) return { success: false, error: 'Missing parameters' };
  try {
    const docRef = doc(db, 'students', uid);
    const startDate = subscriptionData.startDate || subscriptionData.activatedAt || new Date().toISOString();
    const expirationDate = subscriptionData.expirationDate || subscriptionData.expiresAt;

    const normalizedSubscription = {
      ...subscriptionData,
      userId: uid,
      courseId: stageId,
      stageId: stageId,
      status: 'active',
      startDate: startDate,
      activatedAt: startDate,
      expirationDate: expirationDate,
      expiresAt: expirationDate,
      activationCode: subscriptionData.activationCode || subscriptionData.codeUsed || '',
      updatedAt: new Date().toISOString()
    };

    const updatePayload = {
      [`subscriptions.${stageId}`]: normalizedSubscription,
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, updatePayload, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, `students/${uid}/subscriptions/${stageId}`), normalizedSubscription);
      } catch (e) {}
    }
    return { success: true, subscription: normalizedSubscription };
  } catch (error) {
    console.warn('Firebase subscription save error:', error.message);
    return { success: false, error: error.message };
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
        callback(snapshot.data());
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
      callback(data);
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

  // 1. Try Firestore first
  try {
    const docRef = doc(db, 'codes', cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('Firestore code fetch notice:', e.message);
  }

  // 2. Try RTDB
  if (rtdb) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, 'codes/' + cleanCode));
      if (snap.exists()) {
        return snap.val();
      }
    } catch (e) {
      console.warn('RTDB code fetch notice:', e.message);
    }
  }

  return null;
}

/**
 * Mark activation code as used permanently in cloud database
 */
export async function markCodeAsUsedInCloud(cleanCode, updatedCodeData) {
  if (!cleanCode || !updatedCodeData) return false;
  try {
    await setDoc(doc(db, 'codes', cleanCode), {
      ...updatedCodeData,
      isUsed: true,
      status: 'used',
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (rtdb) {
      try {
        await rtdbSet(rtdbRef(rtdb, 'codes/' + cleanCode), {
          ...updatedCodeData,
          isUsed: true,
          status: 'used'
        });
      } catch (e) {}
    }
    return true;
  } catch (e) {
    console.warn('Error marking code as used in cloud:', e.message);
    return false;
  }
}

