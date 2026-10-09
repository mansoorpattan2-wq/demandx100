import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../services/firebase';

export interface UserProfile {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  setCustomUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  setUserRole: () => { },
  setCustomUser: () => { },
  isLoading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('demandx_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [userRole, setUserRoleState] = useState<string | null>(() => localStorage.getItem('demandx_user_role'));
  const [isLoading, setIsLoading] = useState(true);

  const setCustomUser = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('demandx_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('demandx_current_user');
    }
  };

  const setUserRole = (role: string | null) => {
    setUserRoleState(role);
    if (role) {
      localStorage.setItem('demandx_user_role', role);
    } else {
      localStorage.removeItem('demandx_user_role');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const profile: UserProfile = {
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          photoURL: user.photoURL,
        };
        setCustomUser(profile);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore firebase sign out error if offline
    }
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('demandx_current_user');
    localStorage.removeItem('demandx_user_role');
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, setUserRole, setCustomUser, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
