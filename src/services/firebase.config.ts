import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth as _getAuth, type FirebaseAuth } from 'firebase/auth';
import { getFirestore as _getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions as _getFunctions, type FirebaseFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  !String(firebaseConfig.apiKey).includes('placeholder') &&
  Boolean(firebaseConfig.projectId) &&
  firebaseConfig.projectId !== 'your-project-id';

// Initialize with whatever config we have. When invalid, Firebase creates
// an app instance that won't connect to any server but won't crash either.
const safeConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: 'demo-api-key',
      projectId: 'demo-project',
      authDomain: 'demo.firebaseapp.com',
      appId: '1:0:web:0'
    } as const;

let app: FirebaseApp;
try {
  app = getApps().length ? getApps()[0] : initializeApp(safeConfig);
} catch (e) {
  // Last-resort fallback
  app = { name: '[DEFAULT]', options: safeConfig } as FirebaseApp;
}

let _auth: FirebaseAuth | null;
let _db: Firestore | null;
let _functions: FirebaseFunctions | null;
let _analytics: any;
try { _auth = _getAuth(app); } catch (e) { /* ignored */ }
try { _db = _getFirestore(app); } catch (e) { /* ignored */ }
try { _functions = _getFunctions(app); } catch (e) { /* ignored */ }
try { _analytics = getAnalytics(app); } catch (e) { /* ignored */ }

export const auth = _auth;
export const db = _db;
export const functions = _functions;
export const analytics = _analytics;

export default app;