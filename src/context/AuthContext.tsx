import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextValue {
  user: User | null;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, isAuthReady: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthReady && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error('Anonymous sign-in failed:', error);
      });
    }
  }, [isAuthReady, user]);

  return <AuthContext.Provider value={{ user, isAuthReady }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
