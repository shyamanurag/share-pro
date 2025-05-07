import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { createClient } from '@/util/supabase/component';
import { User, Provider } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/router';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  balance: number;
  role?: string;
  isActive?: boolean;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  createUser: (user: User) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializing: boolean;
  refreshUserProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAdmin: false,
  createUser: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithMagicLink: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  initializing: false,
  refreshUserProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  // Function to fetch user profile from database
  const refreshUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Log error but don't expose details to console
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user profile",
        });
        return;
      }

      setUserProfile(data);
      
      // Check if user is admin - ONLY use the role from database
      // Do not use email or metadata for admin determination
      const isAdminUser = data?.role === 'ADMIN';
      setIsAdmin(isAdminUser);
    } catch (error) {
      // Silent error handling to avoid leaking info
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh user profile",
      });
    }
  };

  React.useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await refreshUserProfile();
      }
      
      setInitializing(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // The setTimeout is necessary to allow Supabase functions to trigger inside onAuthStateChange
      setTimeout(async () => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        if (newUser) {
          await refreshUserProfile();
        } else {
          setUserProfile(null);
          setIsAdmin(false);
        }
        
        setInitializing(false);
      }, 0);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const createUser = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (!data) {
        const { error: insertError } = await supabase
          .from('User')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
            balance: 10000, // Default virtual money for paper trading
          });
        if (insertError) {
          throw insertError;
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user profile",
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    // Clear any existing auth state first
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker registrations and caches
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        }
      }
    }
    
    // First sign out to ensure a clean state
    try {
      await supabase.auth.signOut();
      
      // Wait a moment to ensure signout is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (signOutError) {
      // Continue anyway, but don't log the error
    }
    
    // Create a fresh Supabase client to avoid any cached state
    const freshSupabase = createClient();
    
    // If this is the demo user, ensure it exists first
    if (email === 'demo@papertrader.app') {
      try {
        const timestamp = new Date().getTime(); // Add timestamp to prevent caching
        const response = await fetch(`/api/demo/create-demo-user?t=${timestamp}`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to set up demo user');
        }
      } catch (demoError) {
        throw new Error('Failed to set up demo user: ' + (demoError instanceof Error ? demoError.message : 'Unknown error'));
      }
    } 
    
    // Now attempt to sign in with the fresh client
    let signInAttempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (signInAttempts < maxAttempts) {
      try {
        signInAttempts++;
        
        // Use a completely fresh client for each attempt
        const attemptSupabase = createClient();
        
        const { data, error } = await attemptSupabase.auth.signInWithPassword({ 
          email, 
          password
        });
        
        if (error) {
          lastError = error;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        } 
        
        if (data.user) {
          // Create or update user profile
          await createUser(data.user);
          
          // Refresh the user data after profile creation
          const { data: refreshedData } = await attemptSupabase.auth.getUser();
          
          toast({
            title: "Success",
            description: "You have successfully signed in",
          });
          
          // Return the refreshed user data
          return refreshedData?.user || data.user;
        } else {
          lastError = new Error("No user data returned from authentication");
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      } catch (unexpectedError) {
        lastError = unexpectedError;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If we get here, all attempts failed
    toast({
      variant: "destructive",
      title: "Error",
      description: lastError instanceof Error 
        ? lastError.message 
        : "Failed to sign in after multiple attempts",
    });
    throw lastError || new Error("Failed to sign in after multiple attempts");
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (data.user) {
      await createUser(data.user);
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Sign up successful! Please login to continue.",
      });
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (!error && data.user) {
      await createUser(data.user);
    }
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the login link",
      });
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      // Clear any stored data
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      toast({
        title: "Success",
        description: "You have successfully signed out",
      });
      router.push('/');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the password reset link",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAdmin,
      createUser,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      resetPassword,
      initializing,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);