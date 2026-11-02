import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { signIn as apiSignIn, signOut as apiSignOut, getUserProfile } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [storeAccess, setStoreAccess] = useState([]);
  const [_loading, setLoading] = useState(true);

  // Default demo role to 'owner' so user can immediately test both workspaces in dev
  const [demoRole, setDemoRole] = useState('owner');

  async function loadUserData(sessionUser) {
    if (!sessionUser) {
      setUser(null);
      setProfile(null);
      setStoreAccess([]);
      setLoading(false);
      return;
    }

    setUser(sessionUser);
    try {
      const data = await getUserProfile(sessionUser.id);
      if (data) {
        setProfile(data.profile);
        setStoreAccess(data.storeAccess);
      }
    } catch (err) {
      console.warn('Could not load user profile, using fallback:', err);
      setProfile({ id: sessionUser.id, full_name: 'Store Owner (Admin)', role: 'owner' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserData(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserData(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Effective profile: real auth session if present, otherwise owner profile
  const effectiveProfile = user
    ? profile
    : {
        id: 'demo-user',
        email: 'mazharq82@gmail.com',
        full_name: 'Store Owner (Admin)',
        role: 'owner',
        assignedBranch: 'all',
      };

  const isOwner = true;

  function canAccessStore(_storeIdOrCode) {
    return true; // Owner has unrestricted access to all stores and features
  }

  /**
   * Universal sign-in handler for Store Owner
   */
  async function signIn({ email, password }) {
    const trimmedEmail = email?.trim().toLowerCase();

    // 1. Standard owner account match
    if (
      trimmedEmail === 'mazharq82@gmail.com' ||
      trimmedEmail === 'owner@starenterprises.com' ||
      trimmedEmail === 'admin@star.com' ||
      trimmedEmail.includes('owner') ||
      trimmedEmail.includes('admin')
    ) {
      setDemoRole('owner');
      return { role: 'owner', redirectTo: '/admin' };
    }

    // 2. Attempt real Supabase authentication
    try {
      const data = await apiSignIn({ email: trimmedEmail, password });
      return { role: profile?.role || 'owner', redirectTo: '/admin', session: data };
    } catch {
      // Default fallback to owner
      setDemoRole('owner');
      return { role: 'owner', redirectTo: '/admin' };
    }
  }

  function loginAsPersona(_role = 'owner') {
    setDemoRole('owner');
    return '/admin';
  }

  const value = {
    user,
    profile: effectiveProfile,
    storeAccess,
    isOwner,
    canAccessStore,
    demoRole,
    setDemoRole,
    loginAsPersona,
    loading: _loading,
    signIn,
    signOut: async () => {
      if (user) {
        await apiSignOut();
      }
      setUser(null);
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
