import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Load saved mock user session from sessionStorage
      const savedMockUser = sessionStorage.getItem('mockUser');
      if (savedMockUser) {
        setUser(JSON.parse(savedMockUser));
      }
      setLoading(false);
      return;
    }

    // Listen to Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Signup method
  const signup = (email, password) => {
    if (!isFirebaseConfigured) {
      const mockUser = { uid: 'mock-user-jane-doe', email, displayName: 'Jane Doe' };
      sessionStorage.setItem('mockUser', JSON.stringify(mockUser));
      setUser(mockUser);
      return Promise.resolve(mockUser);
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Login method
  const login = (email, password) => {
    if (!isFirebaseConfigured) {
      const mockUser = { uid: 'mock-user-jane-doe', email, displayName: 'Jane Doe' };
      sessionStorage.setItem('mockUser', JSON.stringify(mockUser));
      setUser(mockUser);
      return Promise.resolve(mockUser);
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google login method
  const loginWithGoogle = () => {
    if (!isFirebaseConfigured) {
      const mockUser = { uid: 'mock-user-jane-doe', email: 'jane.doe@example.com', displayName: 'Jane Doe' };
      sessionStorage.setItem('mockUser', JSON.stringify(mockUser));
      setUser(mockUser);
      return Promise.resolve(mockUser);
    }
    return signInWithPopup(auth, googleProvider);
  };

  // Logout method
  const logout = () => {
    if (!isFirebaseConfigured) {
      sessionStorage.removeItem('mockUser');
      setUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  // Custom authenticated fetch wrapper that injects the Firebase JWT token automatically
  const authFetch = async (url, options = {}) => {
    let headers = options.headers || {};
    
    // Ensure content type is JSON by default if sending body and it's not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (isFirebaseConfigured) {
      if (auth && auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken(true);
          headers = {
            ...headers,
            'Authorization': `Bearer ${token}`
          };
        } catch (err) {
          console.error('Failed to get Firebase token:', err);
        }
      }
    } else {
      // In mock developer mode, send a mock-token so backend verifyToken succeeds
      headers = {
        ...headers,
        'Authorization': 'Bearer mock-token'
      };
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
