import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { createClient } from '@/util/supabase/component';
import { User, Provider } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  createUser: (user: User) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializing: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  createUser: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithMagicLink: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  initializing: false
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setInitializing(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // The setTimeout is necessary to allow Supabase functions to trigger inside onAuthStateChange
      setTimeout(async () => {
        setUser(session?.user ?? null);
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
      console.log('Clearing auth state before sign in');
      localStorage.clear(); // Clear all localStorage
      sessionStorage.clear(); // Clear all sessionStorage
      
      // Also clear any service worker registrations for admin login
      if ('serviceWorker' in navigator && email.includes('admin')) {
        console.log('Unregistering service workers for admin login');
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        // Also clear caches
        if ('caches' in window) {
          console.log('Clearing caches for admin login');
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
        }
      }
    }
    
    console.log(`Attempting to sign in with email: ${email}`);
    
    // First try to sign out to ensure a clean state
    try {
      await supabase.auth.signOut();
      console.log('Successfully signed out before new sign in');
    } catch (signOutError) {
      console.error('Error during pre-signin signout:', signOutError);
      // Continue anyway
    }
    
    // Now attempt to sign in
    console.log('Calling supabase.auth.signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: {
        // Don't use redirectTo for admin users, we'll handle that manually
        redirectTo: email.includes('admin') ? undefined : `${window.location.origin}/dashboard-india`
      }
    });
    
    if (error) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } 
    
    if (data.user) {
      console.log('Sign in successful, user data:', data.user);
      
      // For admin users, check if they have the admin role in user_metadata
      if (email.includes('admin')) {
        console.log('Admin user detected, checking metadata');
        if (!data.user.user_metadata?.role || data.user.user_metadata.role !== 'ADMIN') {
          console.log('Setting admin role in user metadata');
          // Update user metadata to include admin role
          await supabase.auth.updateUser({
            data: { role: 'ADMIN' }
          });
        }
      }
      
      console.log('Creating/updating user profile');
      await createUser(data.user);
      
      toast({
        title: "Success",
        description: "You have successfully signed in",
      });
      
      // Return the user for additional processing
      return data.user;
    } else {
      console.error('Sign in returned no user data');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Authentication succeeded but no user data was returned",
      });
      throw new Error("No user data returned from authentication");
    }
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
      createUser,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      resetPassword,
      initializing,

    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);