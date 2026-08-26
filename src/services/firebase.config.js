import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isValidConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('placeholder')
);

// Reuse existing app instance to avoid duplicate-app errors on HMR
const app = getApps().length
  ? getApps()[0]
  : isValidConfig
    ? initializeApp(firebaseConfig)
    : initializeApp({ apiKey: 'demo-key', projectId: 'demo' });

// Initialize services but tolerate invalid config so the UI can still render
// (a demo "app" is used when real credentials are missing)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export const isFirebaseConfigured = isValidConfig;

export default app;
