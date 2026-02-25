import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { User } from '../types';
import { getUser, saveUser, clearUser } from '../services/storage';

// ─── Types ───────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

// ─── Context Creation ────────────────────────────────────────────
// Default is undefined so useAuth() can detect if it's called outside the provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // TRUE by default — blocks navigation

  // ─── Session Restore (runs ONCE on mount) ────────────────────
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedUser = await getUser(); // reads @chainbazaar_user from AsyncStorage
        if (isMounted) {
          setUser(storedUser); // null if nothing stored, User object if found
        }
      } catch (error) {
        console.error('[Auth] Failed to restore session:', error);
        // If AsyncStorage fails, user stays null (guest mode) — safe fallback
      } finally {
        if (isMounted) {
          setLoading(false); // THIS unlocks the navigation tree
        }
      }
    };

    restoreSession();

    // Cleanup: if the component unmounts before AsyncStorage resolves,
    // don't try to set state on an unmounted component
    return () => {
      isMounted = false;
    };
  }, []); // Empty deps = runs exactly once. No loop possible.

  // ─── Login ────────────────────────────────────────────────────
  // useCallback: stable reference, won't cause child re-renders
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!email || password.length < 6) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      email: email,
    };

    await saveUser(newUser);  // Persist to AsyncStorage FIRST
    setUser(newUser);         // Then update React state
    return true;
  }, []);

  // ─── Signup ─────────────────────────────────────────────��─────
  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    if (!name || !email || password.length < 6) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: name,
      email: email,
    };

    await saveUser(newUser);  // Persist to AsyncStorage FIRST
    setUser(newUser);         // Then update React state
    return true;
  }, []);

  // ─── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await clearUser();        // Remove from AsyncStorage FIRST
    setUser(null);            // Then clear React state
  }, []);

  // ─── Memoized Context Value ───────────────────────────────────
  // Without useMemo, every render of AuthProvider creates a new object,
  // which triggers re-renders in EVERY useAuth() consumer.
  // useMemo ensures the object reference only changes when actual data changes.
  const value = useMemo<AuthContextType>(() => ({
    user,
    isGuest: !user,
    loading,
    login,
    signup,
    logout,
  }), [user, loading, login, signup, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      'useAuth() was called outside of <AuthProvider>. ' +
      'Make sure AuthProvider wraps your entire app in app/_layout.tsx'
    );
  }
  return context;
}