import { initializeApp, getApps } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
  type User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
};

export const firebaseConfigured = Object.values(firebaseConfig).every(value =>
  typeof value === 'string' && value.trim().length > 0 && !/(replace-me|placeholder|your[-_ ]?)/i.test(value)
);
export const firebaseAuth = firebaseConfigured
  ? getAuth(getApps()[0] ?? initializeApp(firebaseConfig))
  : null;
let activePhoneVerifier: RecaptchaVerifier | undefined;

if (firebaseAuth) {
  void setPersistence(firebaseAuth, browserLocalPersistence);
}

export function observeFirebaseUser(callback: (user: User | null) => void): () => void {
  if (!firebaseAuth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(firebaseAuth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(firebaseAuth, provider);
  return result.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.');
  return (await signInWithEmailAndPassword(firebaseAuth, email, password)).user;
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.');
  await sendPasswordResetEmail(firebaseAuth, email);
}

export async function sendPhoneOtp(phoneNumber: string, containerId: string): Promise<ConfirmationResult> {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured.');
  activePhoneVerifier?.clear();
  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, { size: 'invisible' });
  activePhoneVerifier = verifier;
  try {
    return await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
  } catch (error) {
    verifier.clear();
    activePhoneVerifier = undefined;
    throw error;
  }
}

export async function verifyPhoneOtp(confirmation: ConfirmationResult, code: string): Promise<User> {
  try {
    return (await confirmation.confirm(code)).user;
  } finally {
    activePhoneVerifier?.clear();
    activePhoneVerifier = undefined;
  }
}

export async function signOutFirebase(): Promise<void> {
  if (firebaseAuth) await firebaseAuth.signOut();
}
