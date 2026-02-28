import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../config/firebase';
import { User } from '../types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUser(u: FirebaseUser): User {
  return {
    id: u.uid, // ✅ THIS is what your firebaseService should use for creator/user matching
    name: u.displayName || (u.email ? u.email.split('@')[0] : 'User'),
    email: u.email || '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? mapFirebaseUser(u) : null);
      setLoading(false);

      // If a real user logs in, guest mode should turn off
      if (u) setGuestMode(false);
    });

    return unsub;
  }, []);

  const continueAsGuest = useCallback(() => {
    setUser(null);
    setGuestMode(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // user state is set by onAuthStateChanged
      return true;
    } catch (e) {
      console.error('[Auth] login error:', e);
      return false;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

    if (name?.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }

    // 🔥 Save user profile to Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      id: cred.user.uid,
      name: name?.trim() || cred.user.email?.split('@')[0],
      email: cred.user.email,
      createdAt: serverTimestamp(),
    });

    return true;
  } catch (e) {
    console.error('[Auth] signup error:', e);
    return false;
  }
}, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setGuestMode(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isGuest: guestMode || !user,
      login,
      signup,
      logout,
      continueAsGuest,
    }),
    [user, loading, guestMode, login, signup, logout, continueAsGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}