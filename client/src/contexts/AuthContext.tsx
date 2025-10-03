import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, getUserDocument, handleGoogleRedirectResult } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  userDocument: any;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userDocument: null,
  loading: true,
  isAuthenticated: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDocument, setUserDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirectAndAuth = async () => {
      try {
        // Handle Google redirect result first
        await handleGoogleRedirectResult();
      } catch (error) {
        console.error("Redirect handling error:", error);
      }
    };

    handleRedirectAndAuth();

    // Only set up auth listener if Firebase is configured
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get additional user data from Firestore
        const userData = await getUserDocument(user.uid);
        setUserDocument(userData);
        
        // Store authentication state in localStorage
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("currentUser", JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));
      } else {
        setUserDocument(null);
        // Clear authentication state from localStorage
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("currentUser");
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userDocument,
    loading,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};