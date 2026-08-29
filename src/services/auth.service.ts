import { ROLES, COLLECTIONS } from '../utils/constants';
import { auth, db, isFirebaseConfigured } from './firebase.config';

let _googleProvider = null;
const getGoogleProvider = async () => {
  if (!_googleProvider) {
    const { GoogleAuthProvider } = await import('firebase/auth');
    _googleProvider = new GoogleAuthProvider();
    _googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
  return _googleProvider;
};

const ensureFirebase = () => {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      'Firebase no está configurado. Edita el archivo .env con tus credenciales reales.'
    );
  }
};

/**
 * User profile interface
 */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'barber' | 'superadmin';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Register a new client with email/password
 */
export const registerWithEmail = async ({ name, email, password, phone = '' }) => {
  ensureFirebase();
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;

  await updateProfile(user, { displayName: name });

  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    uid: user.uid,
    name,
    email,
    phone,
    role: ROLES.CLIENT,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return user;
};

export const signInWithEmail = async ({ email, password }) => {
  ensureFirebase();
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signInWithGoogle = async () => {
  ensureFirebase();
  const { signInWithPopup } = await import('firebase/auth');
  const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');

  const userCredential = await signInWithPopup(auth, await getGoogleProvider());
  const { user } = userCredential;

  const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      name: user.displayName || 'Usuario',
      email: user.email,
      phone: user.phoneNumber || '',
      role: ROLES.CLIENT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  return user;
};

/**
 * Sign in with phone number using Firebase Phone Auth.
 * Sends a verification code to the user's phone via SMS.
 *
 * @param phone - Phone number in E.164 format (e.g., +15551234567)
 * @param verificationCode - The 6-digit code received via SMS
 */
export const signInWithPhone = async (phone: string, verificationCode: string) => {
  ensureFirebase();
  const { signInWithPhoneNumber, RecaptchaVerifier } = await import('firebase/auth');

  // RecaptchaVerifier is required for phone auth in browser environments
  // It's automatically rendered in the UI by the frontend component
  const actionCodeSettings = {
    // URL you want to redirect back to after phone sign-in succeeds
    url: window.location.origin,
    // This must be true
    handleCodeInApp: true
  };

  try {
    const verificationId = await signInWithPhoneNumber(
      auth,
      phone,
      actionCodeSettings,
      recaptchaContainerId
    );

    // Sign in with the verification code
    const userCredential = await signInWithPhoneNumber(auth, verificationCode, verificationId);
    return userCredential.user;
  } catch (e: any) {
    throw new Error(e.message || 'Error en la verificación telefónica');
  }
};

/**
 * Initialize the RecaptchaVerifier for phone auth.
 * This should be called on page load.
 *
 * @param containerId - DOM element ID where the reCAPTCHA will be rendered
 * @returns The RecaptchaVerifier instance
 */
export const initPhoneAuthProvider = (containerId: string = 'recaptcha-container') => {
  return new RecaptchaVerifier(containerId, {
    'sitekey': '6LfI9n8UAAAAAPRhYM1Y_BestXWfongzB0vTlcon', // Reemplazar con el sitekey real
    'callback': (response: string) => {
      // Callback function when the user completes the reCAPTCHA
    },
    'expired-callback': () => {
      // Callback function when the reCAPTCHA session expires
    }
  }, (err) => {
    // expiring the callback
  });
};

/**
 * Register a new client with phone number (verification via SMS)
 * This is useful for clients who don't have email or prefer phone registration
 */
export const registerWithPhone = async (phone: string, verificationCode: string, name: string) => {
  ensureFirebase();
  const { createUserWithEmailAndPassword } = await import('firebase/auth');

  // First sign in with the verification code
  const userCredential = await signInWithPhone(phone, verificationCode);
  const { user } = userCredential;

  // Update profile with display name
  await user.updateProfile({ displayName: name });

  // Create user profile in Firestore
  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    uid: user.uid,
    name,
    phone,
    role: ROLES.CLIENT,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return user;
};

export const signOut = async () => {
  if (!auth) return;
  const { signOut: fbSignOut } = await import('firebase/auth');
  try {
    await fbSignOut(auth);
  } catch (e) {
    // ignore
  }
};

export const getUserProfile = async (uid: string) => {
  if (!db) return null;
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() } as UserProfile;
  } catch (e) {
    return null;
  }
};

export const subscribeToAuthChanges = (callback: (firebaseUser: any) => void) => {
  if (!auth) {
    setTimeout(() => callback(null), 0);
    return () => {};
  }
  // Import dynamically so a Firebase init error never breaks module load
  import('firebase/auth')
    .then(({ onAuthStateChanged }) => {
      try {
        onAuthStateChanged(
          auth,
          callback,
          (err: any) => {
            // eslint-disable-next-line no-console
            console.warn('Auth listener error:', err);
            callback(null);
          }
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Auth listener setup failed:', e);
        setTimeout(() => callback(null), 0);
      }
    })
    .catch(() => setTimeout(() => callback(null), 0));
  return () => {};
};