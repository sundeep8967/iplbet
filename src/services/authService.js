import { auth, googleProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

/** Sign in via Google popup */
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

/** Sign out the current user */
export const logoutUser = () => signOut(auth);

/**
 * Subscribe to auth state changes.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export const onAuthChanged = (callback) => onAuthStateChanged(auth, callback);
