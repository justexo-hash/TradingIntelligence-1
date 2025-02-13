import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase with error handling
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes for additional Google permissions if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export const signInWithGoogle = async () => {
  try {
    console.log("Attempting to sign in with Google...");
    console.log("Current authDomain:", firebaseConfig.authDomain);
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully signed in with Google");
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google: ", error);
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`Please add ${window.location.hostname} to Firebase Console's Authorized Domains list.`);
    }
    if (error.code === 'auth/configuration-not-found') {
      throw new Error("Firebase configuration error. Please check your Firebase setup and authorized domains.");
    }
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("Successfully signed out");
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

export { auth };