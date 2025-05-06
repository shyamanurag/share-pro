import { useFormik } from 'formik';
import React, { useContext, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';
import { createClient } from '@/util/supabase/component';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Logo from '@/components/Logo';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

const AdminLoginPage = () => {
  const router = useRouter();
  const { signIn } = useContext(AuthContext);
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle direct login with admin credentials - using AuthContext
  const handleDirectAdminLogin = async () => {
    setIsLoading(true);
    try {
      console.log('Starting one-click admin login process');
      
      // First, clear everything
      await clearBrowserState();
      
      // Ensure admin user exists first
      try {
        console.log('Creating/verifying admin user before login');
        const timestamp = new Date().getTime(); // Add timestamp to prevent caching
        const response = await fetch(`/api/demo/create-admin-user?t=${timestamp}`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
        
        const data = await response.json();
        console.log('Admin user setup response:', data);
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to set up admin user');
        }
      } catch (adminError) {
        console.error('Error setting up admin user:', adminError);
        throw new Error('Failed to set up admin user: ' + (adminError instanceof Error ? adminError.message : 'Unknown error'));
      }
      
      // Use AuthContext's signIn method which now handles admin user setup
      await signIn('admin@papertrader.app', 'admin1234');
      
      console.log('Admin sign in successful');
      
      // Store admin flags
      localStorage.setItem('adminUser', 'true');
      sessionStorage.setItem('adminUser', 'true');
      sessionStorage.setItem('adminLoginAttempt', 'true');
      sessionStorage.setItem('adminLoginTime', Date.now().toString());
      
      toast({
        title: "Admin Access",
        description: "Login successful. Redirecting to admin panel...",
      });
      
      // Wait a moment to ensure storage is set
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a hard redirect to the admin page
      window.location.href = '/admin';
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "Admin login failed. Please try again or clear your browser cache.",
      });
      setIsLoading(false);
    }
  };
  
  // Helper function to clear browser state - enhanced version
  const clearBrowserState = async () => {
    console.log('Clearing browser state...');
    
    // Sign out from any existing session first
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      console.log('Successfully signed out before new sign in');
    } catch (signOutError) {
      console.error('Error during pre-signin signout:', signOutError);
    }
    
    // Clear storage
    if (typeof window !== 'undefined') {
      console.log('Clearing local storage and session storage');
      
      // Clear specific auth-related items first
      const authItems = ['supabase.auth.token', 'adminUser', 'adminLoginAttempt', 'adminLoginTime'];
      authItems.forEach(item => {
        localStorage.removeItem(item);
        sessionStorage.removeItem(item);
      });
      
      // Then clear all Supabase-related items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          localStorage.removeItem(key);
        }
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          sessionStorage.removeItem(key);
        }
      }
    }
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      console.log('Unregistering service workers');
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Unregistered service worker:', registration.scope);
        }
      } catch (e) {
        console.error('Error unregistering service workers:', e);
      }
    }
    
    // Clear caches
    if ('caches' in window) {
      console.log('Clearing browser caches');
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        console.log('Cleared caches:', cacheKeys);
      } catch (e) {
        console.error('Error clearing caches:', e);
      }
    }
    
    // Wait a moment to ensure everything is cleared
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Browser state cleared');
    
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { email, password } = formik.values;
      
      console.log(`Starting admin login process with email: ${email}`);
      
      // Clear everything first
      await clearBrowserState();
      
      // Use AuthContext's signIn method which now handles admin user setup
      await signIn(email, password);
      
      console.log('Sign in successful');
      
      // Store admin flags in both localStorage and sessionStorage for redundancy
      localStorage.setItem('adminUser', 'true');
      sessionStorage.setItem('adminUser', 'true');
      sessionStorage.setItem('adminLoginAttempt', 'true');
      sessionStorage.setItem('adminLoginTime', Date.now().toString());
      
      toast({
        title: "Login Successful",
        description: "Redirecting to admin panel...",
      });
      
      // Wait to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use direct location change for more reliable navigation
      console.log('Redirecting to admin page');
      window.location.href = '/admin';
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "Please check your credentials and try again.",
      });
      setIsLoading(false);
    }
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().required("Email is required").email("Email is invalid"),
    password: Yup.string()
      .required("Password is required")
      .min(4, "Must be at least 4 characters")
      .max(40, "Must not exceed 40 characters"),
  });

  const formik = useFormik({
    initialValues: {
      email: 'admin@papertrader.app',
      password: 'admin1234',
    },
    validationSchema,
    onSubmit: handleLogin,
  });

  // Clear cache and service workers
  const clearCache = async () => {
    setIsLoading(true);
    try {
      await clearBrowserState();
      
      toast({
        title: "Cache Cleared",
        description: "Browser cache has been cleared. Please try logging in again.",
      });
      
      // Reload the page to ensure a fresh state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear cache. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-background">
      <div className="flex flex-col gap-5 h-auto">
        <div className="w-full flex justify-center cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>

        <Card className="w-full md:w-[440px]">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <Button
                onClick={handleDirectAdminLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "One-Click Admin Login"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or use credentials
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter admin email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.email && formik.errors.email && (
                      <p className="text-destructive text-xs">{formik.errors.email}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Enter admin password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPw(!showPw)}
                      >
                        {showPw
                          ? <FaEye className="text-muted-foreground" />
                          : <FaEyeSlash className="text-muted-foreground" />
                        }
                      </Button>
                    </div>
                    {formik.touched.password && formik.errors.password && (
                      <p className="text-destructive text-xs">{formik.errors.password}</p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={isLoading || !formik.values.email || !formik.values.password || !formik.isValid}
                  >
                    Login with Credentials
                  </Button>
                </div>
              </form>
              
              <div className="mt-4 space-y-2 text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-xs text-muted-foreground"
                  onClick={clearCache}
                  disabled={isLoading}
                >
                  Having trouble? Clear browser cache
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    // Display auth state for debugging
                    const authState = {
                      localStorage: {
                        adminUser: localStorage.getItem('adminUser'),
                        supabaseItems: Object.keys(localStorage).filter(key => 
                          key.includes('supabase') || key.includes('sb-'))
                      },
                      sessionStorage: {
                        adminUser: sessionStorage.getItem('adminUser'),
                        adminLoginAttempt: sessionStorage.getItem('adminLoginAttempt'),
                        adminLoginTime: sessionStorage.getItem('adminLoginTime'),
                        supabaseItems: Object.keys(sessionStorage).filter(key => 
                          key.includes('supabase') || key.includes('sb-'))
                      },
                      serviceWorkers: 'Checking...',
                      caches: 'Checking...'
                    };
                    
                    console.log('Auth Debug State:', authState);
                    
                    // Check service workers
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(registrations => {
                        console.log('Service Workers:', registrations.map(r => r.scope));
                      });
                    }
                    
                    // Check caches
                    if ('caches' in window) {
                      caches.keys().then(cacheKeys => {
                        console.log('Cache Keys:', cacheKeys);
                      });
                    }
                    
                    toast({
                      title: "Debug Info",
                      description: "Auth state logged to console. Please check browser console (F12).",
                    });
                  }}
                >
                  Debug Auth State
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="text-xs text-red-500"
                  onClick={async () => {
                    try {
                      // Clear everything first
                      await clearBrowserState();
                      
                      // Set admin flags directly without authentication
                      localStorage.setItem('adminUser', 'true');
                      sessionStorage.setItem('adminUser', 'true');
                      sessionStorage.setItem('adminLoginAttempt', 'true');
                      sessionStorage.setItem('adminLoginTime', Date.now().toString());
                      
                      toast({
                        title: "Emergency Admin Access",
                        description: "Admin flags set. Redirecting to admin page...",
                      });
                      
                      // Wait a moment then redirect
                      setTimeout(() => {
                        window.location.replace('/admin');
                      }, 1500);
                    } catch (error) {
                      console.error('Emergency access error:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to set admin access. Please try again.",
                      });
                    }
                  }}
                >
                  Emergency Admin Access
                </Button>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Back to Regular Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;