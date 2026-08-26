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

export const signOut = async () => {
  if (!auth) return;
  const { signOut: fbSignOut } = await import('firebase/auth');
  try {
    await fbSignOut(auth);
  } catch (e) {
    // ignore
  }
};

export const getUserProfile = async (uid) => {
  if (!db) return null;
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  } catch (e) {
    return null;
  }
};

export const subscribeToAuthChanges = (callback) => {
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
          (err) => {
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
