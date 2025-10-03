import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, User, sendPasswordResetEmail, sendEmailVerification, Auth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, Firestore } from "firebase/firestore";

// Check if Firebase environment variables are configured
const hasFirebaseConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  import.meta.env.VITE_FIREBASE_APP_ID
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Only initialize Firebase if configuration is available
if (hasFirebaseConfig) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: "123456789012", // This can be placeholder for auth-only setup
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  
  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
}

// Export initialized services (will be null if not configured)
export { auth, db };

// Google Auth Provider (only initialize if Firebase is configured)
let googleProvider: GoogleAuthProvider | null = null;
if (hasFirebaseConfig) {
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

// Firebase Auth Functions
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const handleGoogleRedirectResult = async () => {
  if (!auth) {
    return null;
  }
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await createUserDocument(result.user);
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Google redirect result error:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(result.user, {
      displayName: fullName
    });
    
    // Create user document in Firestore
    await createUserDocument(result.user, { fullName });
    
    return result.user;
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
  }
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

// Firestore Functions
export const createUserDocument = async (user: User, additionalData: any = {}) => {
  if (!user || !db) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date();
    
    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt,
        isDriver: false,
        isVerified: true,
        authProvider: 'firebase',
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }
  
  return userRef;
};



// Send Email Verification
export const sendEmailVerificationToUser = async (user: User) => {
  try {
    await sendEmailVerification(user);
    console.log("Email verification sent to:", user.email);
  } catch (error) {
    console.error("Email verification error:", error);
    throw error;
  }
};

export const getUserDocument = async (uid: string) => {
  if (!db) return null;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
};

export default app;