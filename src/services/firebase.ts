import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyAjD0uwtHs2IgiDmb7obT8ODmfXcTOEwV0",
  authDomain: "demandx-9c910.firebaseapp.com",
  projectId: "demandx-9c910",
  storageBucket: "demandx-9c910.firebasestorage.app",
  messagingSenderId: "87839864425",
  appId: "1:87839864425:web:126c8ba4555a25228ad4f8",
  measurementId: "G-EHDFD0PEXX"
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore Database instance
export const db = getFirestore(app);

// Initialize Analytics conditionally (safely for SSR / browser environments)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics fallback ignored
  });
}
