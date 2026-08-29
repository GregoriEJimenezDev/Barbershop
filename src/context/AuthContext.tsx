import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { subscribeToAuthChanges, getUserProfile, signOut as authSignOut } from '../services/auth.service';
import { ROLES } from '../utils/constants';

export interface AuthContextType {
  user: null | any;
  profile: null | any;
  loading: boolean;
  error: null | string;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isBarber: boolean;
  isClient: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null);

/**
 * AuthProvider
 * Centralizes authentication state and user profile (including role).
 * Tolerates unconfigured Firebase by rendering as logged-out.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null | any);
  const [profile, setProfile] = useState(null | any);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null | string);

  const refreshProfile = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null | any);
      return null | any;
    }
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
      return p;
    } catch (e) {
      setProfile(null | any);
      return null | any;
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const result = subscribeToAuthChanges(async (firebaseUser: any) => {
        try {
          setUser(firebaseUser);
          if (firebaseUser) {
            await refreshProfile(firebaseUser.uid);
          } else {
            setProfile(null | any);
          }
        } catch (e) {
          setError(e as string);
        } finally {
          setLoading(false);
        }
      });
      if (typeof result === 'function') {
        unsubscribe = result;
      }
    } catch (e) {
      setLoading(false);
      setError(e as string);
    }
    const timeout = setTimeout(() => setLoading(false), 2000);
    return () => {
      clearTimeout(timeout);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    try {
      await authSignOut();
    } catch (e) {
      // ignore
    }
    setUser(null | any);
    setProfile(null | any);
  }, []);

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: Boolean(user),
    isSuperAdmin: profile?.role === ROLES.SUPERADMIN,
    isBarber: profile?.role === ROLES.BARBER,
    isClient: profile?.role === ROLES.CLIENT,
    // Backward-compatible aliases
    isAdmin: profile?.role === ROLES.SUPERADMIN,
    refreshProfile: () => (user ? refreshProfile(user.uid) : Promise.resolve(null)),
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};