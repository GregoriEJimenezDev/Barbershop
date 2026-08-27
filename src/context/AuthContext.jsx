import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { subscribeToAuthChanges, getUserProfile, signOut as authSignOut } from '../services/auth.service';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Centralizes authentication state and user profile (including role).
 * Tolerates unconfigured Firebase by rendering as logged-out.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null);
      return null;
    }
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
      return p;
    } catch (e) {
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const result = subscribeToAuthChanges(async (firebaseUser) => {
        try {
          setUser(firebaseUser);
          if (firebaseUser) {
            await refreshProfile(firebaseUser.uid);
          } else {
            setProfile(null);
          }
        } catch (e) {
          setError(e);
        } finally {
          setLoading(false);
        }
      });
      if (typeof result === 'function') {
        unsubscribe = result;
      }
    } catch (e) {
      setLoading(false);
      setError(e);
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
    setUser(null);
    setProfile(null);
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
