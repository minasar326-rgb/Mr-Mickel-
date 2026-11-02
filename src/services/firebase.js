import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// The Master Academy - Official Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBK43fujfiuROPkv_VPSWajlleNDfarqKI",
  authDomain: 'mr-mi-586d2.firebaseapp.com',
  databaseURL: "https://mr-mi-586d2-default-rtdb.firebaseio.com",
  projectId: "mr-mi-586d2",
  storageBucket: "mr-mi-586d2.firebasestorage.app",
  messagingSenderId: "574259708044",
  appId: "1:574259708044:web:432989a90a3a22a1cbfba9",
  measurementId: "G-840M4BY79F"
};

// Initialize Firebase App idempotently
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

// Initialize Analytics conditionally and safely
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
