import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  linkWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { 
  saveStudentAccountToFirestore, 
  getStudentAccountFromFirestore, 
  saveStudentSubscriptionToFirestore,
  listenToStudentAccount
} from '../services/firestoreSync';
import { trackLogin, trackSignUp, trackAuthError } from '../services/analytics';
import { normalizeStageId, CANONICAL_STAGES } from '../utils/stages';
import { createAdminSession, verifyAdminSession } from '../services/authSecurity';

const pendingStudentProfiles = new Map();

async function ensureStudentProfile(firebaseUser) {
  if (!firebaseUser?.uid) return null;
  if (pendingStudentProfiles.has(firebaseUser.uid)) {
    return pendingStudentProfiles.get(firebaseUser.uid);
  }

  const promise = (async () => {
    let profile = null;
    try {
      // Fast fetch with 2.5s timeout to prevent hanging on offline / slow mobile connections
      const fetchPromise = getStudentAccountFromFirestore(firebaseUser.uid);
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 2500));
      profile = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      console.warn('Could not read existing profile from Firestore:', e);
    }

    if (!profile) {
      profile = {
        uid: firebaseUser.uid,
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'طالب جديد',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        subscriptions: {},
        role: 'student'
      };
    } else {
      profile.uid = firebaseUser.uid;
      profile.id = firebaseUser.uid;
      profile.lastLoginAt = new Date().toISOString();
      if (firebaseUser.displayName) profile.name = firebaseUser.displayName;
      if (firebaseUser.photoURL) {
        profile.photoURL = firebaseUser.photoURL;
        profile.avatar = firebaseUser.photoURL;
      }

      const validSubs = {};
      if (profile.subscriptions && typeof profile.subscriptions === 'object') {
        Object.keys(profile.subscriptions).forEach((key) => {
          const subscription = profile.subscriptions[key];
          if (!subscription.userId || subscription.userId === firebaseUser.uid) {
            validSubs[key] = { ...subscription, userId: firebaseUser.uid };
          }
        });
      }
      profile.subscriptions = validSubs;
    }

    // Always guarantee active profile is saved locally first
    try {
      localStorage.setItem('ms_active_uid', firebaseUser.uid);
      localStorage.setItem('madarek_user', JSON.stringify(profile));
    } catch (_) {}

    // Asynchronously synchronize with Cloud Firestore & RTDB in the background
    // (Crucial: never throw an error here to prevent blocking valid Google logins!)
    saveStudentAccountToFirestore(profile).catch(err => {
      console.warn('Background student account Firestore sync notice:', err?.message || err);
    });

    return profile;
  })();

  pendingStudentProfiles.set(firebaseUser.uid, promise);
  try {
    return await promise;
  } finally {
    pendingStudentProfiles.delete(firebaseUser.uid);
  }
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
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

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
          // Idempotent student bootstrap: popup, redirect, and auth state all converge here.
          const profile = await ensureStudentProfile(firebaseUser);

          setCurrentUser(profile);
          setIsAuthModalOpen(false);
          setAuthError('');
          try {
            localStorage.setItem('ms_active_uid', firebaseUser.uid);
            localStorage.setItem('madarek_user', JSON.stringify(profile));
          } catch (_) {}
          const userEmail = (firebaseUser.email || '').toLowerCase().trim();
          const isTeacherAccount = (
            userEmail === 'mrmichaelshehata@gmail.com' ||
            userEmail === 'onm591589@gmail.com' ||
            (() => {
              try {
                const staff = JSON.parse(localStorage.getItem('ms_staff_admins') || '[]');
                return Array.isArray(staff) && staff.some(s => s.email?.toLowerCase().trim() === userEmail);
              } catch (_) { return false; }
            })()
          );

          if (isTeacherAccount) {
            setRole('instructor');
            createAdminSession({
              role: 'super_admin',
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'مستر مايكل شحاته'
            });
          } else if (role !== 'instructor') {
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
          let cachedProfile = null;
          try {
            const saved = JSON.parse(localStorage.getItem('madarek_user') || 'null');
            if (saved && (saved.uid === newUid || saved.id === newUid)) {
              cachedProfile = saved;
            }
          } catch (e) {}

          const fallbackProfile = cachedProfile || {
            uid: newUid,
            id: newUid,
            name: firebaseUser.displayName || 'طالب المنصة',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
            createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
            subscriptions: {},
            role: 'student'
          };
          setCurrentUser(fallbackProfile);
          setIsAuthModalOpen(false);
          setAuthError('');
          try {
            localStorage.setItem('ms_active_uid', newUid);
            localStorage.setItem('madarek_user', JSON.stringify(fallbackProfile));
          } catch (_) {}
        }
      } else {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          try {
            const e2eMock = sessionStorage.getItem('__ms_e2e_mock_user');
            if (e2eMock) {
              const parsed = JSON.parse(e2eMock);
              if (parsed && parsed.uid) {
                setCurrentUser(parsed);
                setAuthLoading(false);
                setAuthReady(true);
                return;
              }
            }
          } catch (_) {}
        }
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
      setAuthLoading(false);
      setAuthReady(true);
    });

    return () => {
      unsubscribeAuth();
      if (typeof unsubStudentProfile === 'function') {
        unsubStudentProfile();
      }
    };
  }, []);

  const getBrowserType = () => {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/Instagram/i.test(ua)) return 'instagram-in-app';
    if (/FBAN|FBAV/i.test(ua)) return 'facebook-in-app';
    if (/TikTok/i.test(ua)) return 'tiktok-in-app';
    if (/Line\//i.test(ua)) return 'line-in-app';
    if (/WhatsApp/i.test(ua)) return 'whatsapp-in-app';
    if (/Twitter/i.test(ua)) return 'twitter-in-app';
    if (/Messenger/i.test(ua)) return 'messenger-in-app';
    if (/Android/i.test(ua)) return 'android-browser';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios-browser';
    return 'desktop-browser';
  };

  const getAuthErrorMessage = (error) => {
    const messages = {
      'auth/popup-closed-by-user': 'تم إغلاق نافذة Google. حاول مرة أخرى.',
      'auth/popup-blocked': 'حظر المتصفح النافذة المنبثقة.',
      'auth/unauthorized-domain': 'النطاق غير مصرح به في إعدادات Firebase.',
      'auth/operation-not-allowed': 'طريقة تسجيل الدخول غير مفعلة.',
      'auth/network-request-failed': 'تعذر الاتصال بخوادم Google. تحقق من الإنترنت.',
      'auth/account-exists-with-different-credential': 'الحساب موجود بطريقة دخول مختلفة. استخدم الربط من صفحة الحساب.',
      'auth/invalid-credential': 'بيانات الدخول غير صحيحة.',
      'auth/user-not-found': 'لا يوجد حساب بهذا البريد.',
      'auth/wrong-password': 'كلمة المرور غير صحيحة.',
      'auth/too-many-requests': 'محاولات كثيرة. حاول لاحقاً.',
      'auth/email-already-in-use': 'البريد مستخدم بالفعل. سجّل دخولاً ثم اربط Google.'
    };
    return `${messages[error?.code] || 'حدث خطأ أثناء تسجيل الدخول.'} (${error?.code || 'unknown'})`;
  };

  useEffect(() => {
    if (!auth) return;
    let handled = false;
    const finishRedirect = async () => {
      if (handled) return;
      handled = true;
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const profile = await ensureStudentProfile(result.user);
          setCurrentUser(profile);
          trackLogin('google');
          setIsAuthModalOpen(false);
        }
      } catch (error) {
        trackAuthError(error?.code || 'unknown', getBrowserType());
        console.warn('Redirect sign-in notice:', error?.code || error?.message);
      }
    };
    finishRedirect();
  }, []);

  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setAuthError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // Use signInWithPopup across ALL platforms (Desktop, iPhone, Android, Tablet)
      // This preserves page state, prevents disruptive full-page reloads, and avoids
      // third-party cookie blocking / partitioned storage failure on GitHub Pages / static hosting.
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        const profile = await ensureStudentProfile(result.user);
        setCurrentUser(profile);
        setRole('student');
        try {
          localStorage.setItem('ms_active_uid', result.user.uid);
          localStorage.setItem('madarek_user', JSON.stringify(profile));
        } catch (_) {}
        setIsAuthModalOpen(false);
        trackLogin('google');
        return { success: true, user: profile };
      }
      return { success: false, error: 'تعذر الحصول على بيانات المستخدم من Google.' };
    } catch (error) {
      trackAuthError(error?.code || 'unknown', getBrowserType());
      console.warn('Google sign-in error:', error?.code, error?.message);

      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        const message = 'تم إغلاق نافذة تسجيل الدخول. يمكنك الضغط والمحاولة مرة أخرى.';
        setAuthError(message);
        return { success: false, error: message, code: error?.code };
      }

      if (error?.code === 'auth/popup-blocked') {
        const message = 'قام المتصفح بحظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة (Popups) من إعدادات المتصفح ثم المحاولة مجدداً.';
        setAuthError(message);
        return { success: false, error: message, code: error?.code };
      }

      const message = getAuthErrorMessage(error);
      setAuthError(message);
      return { success: false, error: message, code: error?.code };
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithEmail = async (email, password) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const profile = await ensureStudentProfile(result.user);
      setCurrentUser(profile);
      setRole('student');
      setIsAuthModalOpen(false);
      trackLogin('email');
      return { success: true, user: profile };
    } catch (error) {
      trackAuthError(error?.code || 'unknown', getBrowserType());
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      return { success: false, error: message, code: error?.code };
    } finally {
      setAuthLoading(false);
    }
  };

  const registerWithEmail = async (email, password, displayName) => {
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && result.user) await updateProfile(result.user, { displayName });
      const profile = await ensureStudentProfile(result.user);
      setCurrentUser(profile);
      setRole('student');
      setIsAuthModalOpen(false);
      trackSignUp('email');
      return { success: true, user: profile };
    } catch (error) {
      trackAuthError(error?.code || 'unknown', getBrowserType());
      return { success: false, error: getAuthErrorMessage(error), code: error?.code };
    } finally {
      setAuthLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      trackAuthError(error?.code || 'unknown', getBrowserType());
      return { success: false, error: getAuthErrorMessage(error), code: error?.code };
    }
  };

  const linkGoogleAccount = async () => {
    if (!auth.currentUser) return { success: false, error: 'يجب تسجيل الدخول أولاً. (auth/no-current-user)' };
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await linkWithPopup(auth.currentUser, provider);
      return { success: true };
    } catch (error) {
      trackAuthError(error?.code || 'unknown', getBrowserType());
      return { success: false, error: getAuthErrorMessage(error), code: error?.code };
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

    const res1 = await saveStudentSubscriptionToFirestore(studentUid, stageId, safeSub);
    let res2 = { success: true };
    if (canonStage !== stageId) {
      res2 = await saveStudentSubscriptionToFirestore(studentUid, canonStage, safeSub);
    }
    const isOk = res1.success !== false && res2.success !== false;
    return { ok: isOk, success: isOk, error: res1.error || res2.error };
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
        authReady,
        authLoading,
        authError,
        isAuthModalOpen,
        authModalMode,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        linkGoogleAccount,
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
