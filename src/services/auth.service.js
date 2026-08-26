import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.config';
import { ROLES, COLLECTIONS } from '../utils/constants';

/**
 * Authentication Service
 * Handles Firebase Auth operations and user profile creation.
 * Following Single Responsibility Principle - all auth-related operations here.
 */

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Register a new client with email/password
 */
export const registerWithEmail = async ({ name, email, password, phone = '' }) => {
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

/**
 * Sign in with email/password
 */
export const signInWithEmail = async ({ email, password }) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign in with Google. If the user is new, create a client profile.
 */
export const signInWithGoogle = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
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
 * Sign out current user
 */
export const signOut = async () => {
  await firebaseSignOut(auth);
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Subscribe to auth state changes. Returns unsubscribe function.
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
