import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
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

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Current user state (null for unauthenticated visitors/guests)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('madarek_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.uid || parsed.id)) return parsed;
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

  // Sync state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('madarek_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('madarek_user');
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
        try {
          // 1. Fetch persistent student account & subscriptions from Firestore
          let profile = await getStudentAccountFromFirestore(firebaseUser.uid);

          if (!profile) {
            // First time login: create persistent record
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
            await saveStudentAccountToFirestore(profile);
          } else {
            // Existing user: ensure updated photo & name if changed in Google
            if (firebaseUser.displayName && firebaseUser.displayName !== profile.name) {
              profile.name = firebaseUser.displayName;
            }
            if (firebaseUser.photoURL && firebaseUser.photoURL !== profile.photoURL) {
              profile.photoURL = firebaseUser.photoURL;
              profile.avatar = firebaseUser.photoURL;
            }
            profile.uid = firebaseUser.uid;
            profile.id = firebaseUser.uid;
          }

          setCurrentUser(profile);
          if (role !== 'instructor') {
            setRole('student');
          }

          // 2. Real-time multi-device listener for subscription updates
          unsubStudentProfile = listenToStudentAccount(firebaseUser.uid, (cloudStudent) => {
            if (!cloudStudent) return;
            setCurrentUser(prev => {
              if (!prev || prev.uid !== firebaseUser.uid) return prev;
              return {
                ...prev,
                ...cloudStudent,
                subscriptions: cloudStudent.subscriptions || prev.subscriptions || {}
              };
            });
          });

        } catch (err) {
          console.warn('Error fetching student profile from Firestore:', err);
          // Fallback to basic Firebase user if offline
          setCurrentUser({
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
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
        // Logged out / Guest mode
        if (role !== 'instructor') {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (typeof unsubStudentProfile === 'function') {
        unsubStudentProfile();
      }
    };
  }, [role]);

  // Google Sign-In with Firebase Auth
  const loginWithGoogle = async () => {
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

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
      }

      setCurrentUser(studentDoc);
      setRole('student');
      setIsAuthModalOpen(false);
      return { success: true, user: studentDoc };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      let errorMsg = 'حدث خطأ أثناء تسجيل الدخول بحساب Google';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'تم إغلاق نافذة تسجيل الدخول قبل اكتمال العملية.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = 'تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مجدداً.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = 'النطاق الحالي (pub-cdb447f627b54ae6a3027d3552574cd5.r2.dev) غير مضاف في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console. يرجى إضافته من إعدادات Authentication ليعمل تسجيل الدخول.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'تسجيل الدخول عبر Google غير مفعّل في لوحة Firebase Console. يرجى تفعيل Google في صفحة Sign-in method.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'تعذر الاتصال بخوادم Google. يرجى التحقق من اتصالك بالإنترنت.';
      }
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  };

  // Switch role (used by teacher admin PIN system)
  const switchRole = (newRole) => {
    setRole(newRole);
    if (newRole === 'instructor') {
      setCurrentUser(prev => ({
        ...(prev || {}),
        uid: 'teacher-admin',
        id: 'teacher-admin',
        name: 'مستر مايكل شحاته (The Master)',
        role: 'instructor'
      }));
    } else if (newRole === 'student') {
      if (auth.currentUser) {
        // Re-read Google student profile
        getStudentAccountFromFirestore(auth.currentUser.uid).then(p => {
          if (p) setCurrentUser(p);
        });
      } else {
        setCurrentUser(null);
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
    localStorage.removeItem('madarek_user');
    localStorage.removeItem('ms_unlocked_with_expiry');
    localStorage.removeItem('ms_unlocked_lectures');
  };

  // Add subscription to student in Firestore
  const addSubscriptionToUser = async (stageId, subscriptionData) => {
    if (!currentUser?.uid) return false;

    const updatedSubs = {
      ...(currentUser.subscriptions || {}),
      [stageId]: subscriptionData
    };

    const updatedUser = {
      ...currentUser,
      subscriptions: updatedSubs
    };

    setCurrentUser(updatedUser);
    await saveStudentSubscriptionToFirestore(currentUser.uid, stageId, subscriptionData);
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

