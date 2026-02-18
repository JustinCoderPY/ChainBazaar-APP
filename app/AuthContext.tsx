import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import { getUser, saveUser, clearUser } from '../services/storage';

interface AuthContextType {
  user: User | null;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const storedUser = await getUser();
    setUser(storedUser);
    setLoading(false);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple mock authentication
    if (email && password.length >= 6) {
      const newUser: User = {
        id: Date.now().toString(),
        name: email.split('@')[0],
        email: email,
      };
      await saveUser(newUser);
      setUser(newUser);
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    if (name && email && password.length >= 6) {
      const newUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
      };
      await saveUser(newUser);
      setUser(newUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isGuest: !user, 
      login, 
      signup, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}