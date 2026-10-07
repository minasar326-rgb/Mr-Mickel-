import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { 
  saveStudentAccountToFirestore, 
  getStudentAccountFromFirestore, 
  saveStudentSubscriptionToFirestore,
  listenToStudentAccount
} from '../services/firestoreSync';
import { trackLogin, trackSignUp } from '../services/analytics';

function normalizeStageId(targetId, stageName = '') {
  if (!targetId && !stageName) return 'sec-3';
  const combined = `${targetId || ''} ${stageName || ''}`.toLowerCase().trim();
  if (combined.includes('all-access') || combined.includes('vip') || combined.includes('bundle') || combined.includes('شامل') || combined.includes('كافة') || combined.includes('جميع')) {
    return 'all-access';
  }
  if (combined.includes('sec-3') || combined.includes('sec3') || combined.includes('ثالث') || combined.includes('thanaweya')) {
    return 'sec-3';
  }
  if (combined.includes('sec-2') || combined.includes('sec2') || combined.includes('ثان') || combined.includes('senior 2')) {
    return 'sec-2';
  }
  if (combined.includes('sec-1') || combined.includes('sec1') || combined.includes('أول') || combined.includes('اول') || combined.includes('senior 1')) {
    return 'sec-1';
  }
  if (combined.includes('foundation') || combined.includes('fnd') || combined.includes('تأسيس') || combined.includes('محادثة')) {
    return 'foundation';
  }
  return targetId || 'sec-3';
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Current user state (null for unauthenticated visitors/guests)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const activeUid = localStorage.getItem('ms_active_uid');
      const saved = localStorage.getItem('madarek_user');
      if (saved && activeUid) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.uid === activeUid || parsed.id === activeUid) && parsed.uid !== 'teacher-admin') {
          // Strictly keep only subscriptions belonging to THIS activeUid
          const userSubs = {};
          if (parsed.subscriptions && typeof parsed.subscriptions === 'object') {
            Object.keys(parsed.subscriptions).forEach(k => {
              const s = parsed.subscriptions[k];
              if (!s.userId || s.userId === activeUid) {
                userSubs[k] = { ...s, userId: activeUid };
              }
            });
          }
          return {
            ...parsed,
            subscriptions: userSubs
          };
        }
      }
    } catch (e) {}
    return null;
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem('madarek_role') || 'student';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);

  // Sync state to localStorage safely with UID validation
  useEffect(() => {
    if (currentUser && currentUser.uid && currentUser.uid !== 'teacher-admin') {
      try {
        localStorage.setItem('ms_active_uid', currentUser.uid);
        localStorage.setItem('madarek_user', JSON.stringify(currentUser));
      } catch (e) {}
    }
    localStorage.setItem('madarek_role', role);
  }, [currentUser, role]);

  // Listen to Firebase Auth state changes with real-time multi-device subscription sync
  useEffect(() => {
    if (!auth) return;

    let unsubStudentProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Unsubscribe any previous student listener
      if (typeof unsubStudentProfile === 'function') {
        unsubStudentProfile();
        unsubStudentProfile = () => {};
      }

      if (firebaseUser) {
        const newUid = firebaseUser.uid;
        const lastActiveUid = localStorage.getItem('ms_active_uid');

        // If a different user is logging in, purge old user's caches immediately
        if (lastActiveUid && lastActiveUid !== newUid) {
          try {
            localStorage.removeItem('madarek_user');
            localStorage.removeItem('ms_unlocked_with_expiry');
            localStorage.removeItem('ms_unlocked_lectures');
            localStorage.removeItem('ms_unlocked_uid');
          } catch (e) {}
        }
        try {
          localStorage.setItem('ms_active_uid', newUid);
        } catch (e) {}

        try {
          // 1. Fetch persistent student account & subscriptions strictly for newUid from Firestore
          let profile = await getStudentAccountFromFirestore(newUid);

          if (!profile) {
            // First time login: create clean new student record with NO leaked subscriptions
            profile = {
              uid: newUid,
              id: newUid,
              name: firebaseUser.displayName || 'طالب جديد',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              subscriptions: {}, // strictly empty! No leaking from other accounts
              role: 'student'
            };
            await saveStudentAccountToFirestore(profile);
          } else {
            // Existing user
            if (firebaseUser.displayName && firebaseUser.displayName !== profile.name) {
              profile.name = firebaseUser.displayName;
            }
            if (firebaseUser.photoURL && firebaseUser.photoURL !== profile.photoURL) {
              profile.photoURL = firebaseUser.photoURL;
              profile.avatar = firebaseUser.photoURL;
            }
            profile.uid = newUid;
            profile.id = newUid;

            // Strictly filter subscriptions to only those belonging to newUid
            const validSubs = {};
            if (profile.subscriptions && typeof profile.subscriptions === 'object') {
              Object.keys(profile.subscriptions).forEach(k => {
                const s = profile.subscriptions[k];
                if (!s.userId || s.userId === newUid) {
                  validSubs[k] = { ...s, userId: newUid };
                }
              });
            }
            profile.subscriptions = validSubs;
          }

          setCurrentUser(profile);
          if (role !== 'instructor') {
            setRole('student');
          }

          // 2. Real-time multi-device listener for THIS student UID only
          unsubStudentProfile = listenToStudentAccount(newUid, (cloudStudent) => {
            if (!cloudStudent) return;
            setCurrentUser(prev => {
              if (!prev || (prev.uid !== newUid && prev.id !== newUid)) return prev;
              const validSubs = {};
              if (cloudStudent.subscriptions && typeof cloudStudent.subscriptions === 'object') {
                Object.keys(cloudStudent.subscriptions).forEach(k => {
                  const s = cloudStudent.subscriptions[k];
                  if (!s.userId || s.userId === newUid) {
                    validSubs[k] = { ...s, userId: newUid };
                  }
                });
              }
              const updated = {
                ...prev,
                ...cloudStudent,
                uid: newUid,
                id: newUid,
                subscriptions: validSubs
              };
              try {
                localStorage.setItem('madarek_user', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          });

        } catch (err) {
          console.warn('Error fetching student profile from Firestore:', err);
          // Offline fallback: ONLY use cached profile if UID matches newUid exactly
          let cachedProfile = null;
          try {
            const saved = JSON.parse(localStorage.getItem('madarek_user') || 'null');
            if (saved && (saved.uid === newUid || saved.id === newUid)) {
              cachedProfile = saved;
            }
          } catch (e) {}

          setCurrentUser(cachedProfile || {
            uid: newUid,
            id: newUid,
            name: firebaseUser.displayName || 'طالب المنصة',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
            subscriptions: {},
            role: 'student'
          });
        }
      } else {
        // Logged out / Guest mode: Clean up state & storage completely!
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
        } catch (e) {}
      }
    });

    return () => {
      unsubscribeAuth();
      if (typeof unsubStudentProfile === 'function') {
        unsubStudentProfile();
      }
    };
  }, [role]);

  // Handle redirect result if returning from a Google redirect sign-in
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const user = result.user;
          let profile = await getStudentAccountFromFirestore(user.uid);
          if (!profile) {
            profile = {
              uid: user.uid,
              id: user.uid,
              name: user.displayName || 'طالب جديد',
              email: user.email || '',
              photoURL: user.photoURL || '',
              avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              createdAt: user.metadata?.creationTime || new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              subscriptions: {},
              role: 'student'
            };
            await saveStudentAccountToFirestore(profile);
          }
          setCurrentUser(profile);
          setIsAuthModalOpen(false);
        }
      })
      .catch((err) => {
        if (err.code !== 'auth/popup-closed-by-user') {
          console.warn('Redirect sign-in notice:', err);
        }
      });
  }, []);

  // Google Sign-In with Firebase Auth (Supports both Popup & Redirect to bypass COOP / browser popup blockers)
  const loginWithGoogle = async (forceRedirect = false) => {
    setAuthLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // If forceRedirect or mobile device, directly redirect without popup
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (forceRedirect || isMobile) {
      try {
        await signInWithRedirect(auth, provider);
        return { success: true, redirecting: true };
      } catch (err) {
        console.warn('signInWithRedirect error:', err);
      }
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Fetch or create student document in Firestore
      let studentDoc = await getStudentAccountFromFirestore(user.uid);
      if (!studentDoc) {
        studentDoc = {
          uid: user.uid,
          id: user.uid,
          name: user.displayName || 'طالب جديد',
          email: user.email || '',
          photoURL: user.photoURL || '',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          createdAt: user.metadata?.creationTime || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          subscriptions: {},
          role: 'student'
        };
        await saveStudentAccountToFirestore(studentDoc);
        trackSignUp('google');
      } else {
        studentDoc.uid = user.uid;
        studentDoc.id = user.uid;
        studentDoc.lastLoginAt = new Date().toISOString();
        if (user.displayName) studentDoc.name = user.displayName;
        if (user.photoURL) {
          studentDoc.photoURL = user.photoURL;
          studentDoc.avatar = user.photoURL;
        }
        await saveStudentAccountToFirestore(studentDoc);
        trackLogin('google');
      }

      setCurrentUser(studentDoc);
      setRole('student');
      setIsAuthModalOpen(false);
      return { success: true, user: studentDoc };
    } catch (error) {
      // If popup was blocked or failed due to COOP / closed popup:
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/cancelled-popup-request' ||
        (error.message && error.message.includes('Cross-Origin-Opener-Policy'))
      ) {
        try {
          console.log('Switching to redirect sign-in to bypass popup / COOP policy...');
          await signInWithRedirect(auth, provider);
          return { success: true, redirecting: true };
        } catch (redirectErr) {
          console.error('Redirect fallback failed:', redirectErr);
        }
      }

      console.warn('Google Sign-In notice:', error.code || error.message);
      let errorMsg = 'حدث خطأ أثناء تسجيل الدخول بحساب Google';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'تم إغلاق نافذة تسجيل الدخول. يمكنك المحاولة مجدداً أو النقر على "الدخول المباشر".';
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = 'تم حظر النافذة المنبثقة من قِبل المتصفح. يمكنك استخدام زر "الدخول المباشر".';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = 'النطاق الحالي (pub-cdb447f627b54ae6a3027d3552574cd5.r2.dev) غير مضاف في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'تسجيل الدخول عبر Google غير مفعّل في لوحة Firebase Console. يرجى تفعيل Google في صفحة Sign-in method.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'تعذر الاتصال بخوادم Google. يرجى التحقق من اتصالك بالإنترنت.';
      }
      return { success: false, error: errorMsg, code: error.code };
    } finally {
      setAuthLoading(false);
    }
  };

  // Switch role (used by teacher admin PIN system)
  const switchRole = (newRole) => {
    setRole(newRole);
    // CRITICAL: We NEVER overwrite or erase currentUser with a fake teacher object!
    // currentUser remains the authenticated Google student profile at all times.
    // Teacher access is strictly controlled by `role: 'instructor'`.
    if (newRole === 'student') {
      if (!currentUser) {
        try {
          const saved = localStorage.getItem('madarek_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.uid || parsed.id) && parsed.uid !== 'teacher-admin') {
              setCurrentUser(parsed);
              return;
            }
          }
        } catch (e) {}
      }
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setCurrentUser(null);
    setRole('student');
    try {
      localStorage.removeItem('madarek_user');
      localStorage.removeItem('ms_unlocked_with_expiry');
      localStorage.removeItem('ms_unlocked_lectures');
      localStorage.removeItem('ms_active_uid');
      localStorage.removeItem('ms_unlocked_uid');
    } catch (e) {}
  };

  // Google Play Compliance: Delete Student Account and all stored data
  const deleteAccount = async () => {
    const uid = currentUser?.uid || currentUser?.id;
    if (!uid) return { success: false, error: 'لا يوجد حساب مسجل حالياً' };

    try {
      // 1. Delete student profile from Firestore
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      if (db) {
        try { await deleteDoc(doc(db, 'students', uid)); } catch (_) {}
        try { await deleteDoc(doc(db, 'users', uid)); } catch (_) {}
      }

      // 2. Delete student profile from Realtime Database
      const { ref, remove } = await import('firebase/database');
      const { rtdb } = await import('../services/firebase');
      if (rtdb) {
        try { await remove(ref(rtdb, `students/${uid}`)); } catch (_) {}
        try { await remove(ref(rtdb, `users/${uid}`)); } catch (_) {}
      }

      // 3. Delete Firebase Auth user if authenticated
      if (auth && auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (_) {}
      }

      // 4. Logout and clear everything
      await logout();
      return { success: true };
    } catch (err) {
      console.warn('Account deletion handled:', err);
      await logout();
      return { success: true };
    }
  };

  // Add subscription to student in Firestore, RTDB, and LocalStorage
  const addSubscriptionToUser = async (stageId, subscriptionData) => {
    const studentUid = currentUser?.uid || currentUser?.id;
    if (!studentUid) return false;

    const canonStage = normalizeStageId(stageId);
    const safeSub = {
      ...subscriptionData,
      userId: studentUid
    };

    const updatedSubs = {
      ...(currentUser?.subscriptions || {}),
      [stageId]: safeSub,
      [canonStage]: safeSub
    };

    const updatedUser = {
      ...(currentUser || {}),
      uid: studentUid,
      id: studentUid,
      subscriptions: updatedSubs
    };

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('madarek_user', JSON.stringify(updatedUser));
      localStorage.setItem('ms_unlocked_uid', studentUid);
      // Also update ms_unlocked_with_expiry directly
      const expiryDict = JSON.parse(localStorage.getItem('ms_unlocked_with_expiry') || '{}');
      expiryDict[stageId] = safeSub;
      expiryDict[canonStage] = safeSub;
      localStorage.setItem('ms_unlocked_with_expiry', JSON.stringify(expiryDict));
    } catch (e) {}

    await saveStudentSubscriptionToFirestore(studentUid, stageId, safeSub);
    if (canonStage !== stageId) {
      await saveStudentSubscriptionToFirestore(studentUid, canonStage, safeSub);
    }
    return true;
  };

  const addXP = (points) => {
    if (!currentUser) return;
    setCurrentUser(prev => ({
      ...prev,
      xpPoints: (prev?.xpPoints || 0) + points
    }));
  };

  const updateProfile = (data) => {
    setCurrentUser(prev => ({ ...prev, ...data }));
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        authLoading,
        isAuthModalOpen,
        authModalMode,
        loginWithGoogle,
        logout,
        deleteAccount,
        switchRole,
        addSubscriptionToUser,
        addXP,
        updateProfile,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

