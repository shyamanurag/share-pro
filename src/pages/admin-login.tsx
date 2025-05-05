import { useFormik } from 'formik';
import React, { useContext, useState, useEffect, useCallback } from 'react';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Logo from '@/components/Logo';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useIsIFrame } from '@/hooks/useIsIFrame';

const AdminLoginPage = () => {
  const router = useRouter();
  const { initializing, signIn } = useContext(AuthContext);
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isIframe } = useIsIFrame();
  const { toast } = useToast();
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Function to clear cache and service workers
  const clearCacheAndServiceWorkers = useCallback(async () => {
    setIsClearingCache(true);
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Clear caches
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      
      toast({
        title: "Cache Cleared",
        description: "Browser cache has been cleared. Please try logging in again.",
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear cache. Please try refreshing the page.",
      });
    } finally {
      setIsClearingCache(false);
    }
  }, [toast]);

  // Clear any existing auth state on component mount
  useEffect(() => {
    const clearAuthState = async () => {
      try {
        // Clear any cached credentials from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
          
          // Clear service worker cache if possible
          if ('caches' in window) {
            try {
              const cacheKeys = await caches.keys();
              for (const key of cacheKeys) {
                await caches.delete(key);
              }
              console.log('Cache cleared successfully');
            } catch (cacheError) {
              console.error('Error clearing cache:', cacheError);
            }
          }
        }
      } catch (error) {
        console.error('Error clearing auth state:', error);
      }
    };
    
    clearAuthState();
  }, []);

  // Ensure admin user exists in the database
  useEffect(() => {
    const setupAdmin = async () => {
      setIsLoading(true);
      try {
        console.log('Setting up admin account...');
        const response = await fetch('/api/demo/create-admin-user', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Error setting up admin account:', data);
          toast({
            variant: "destructive",
            title: "Setup Error",
            description: data.error || "There was an error setting up the admin account. Please try again.",
          });
        } else {
          console.log('Admin account setup successful:', data);
        }
      } catch (error) {
        console.error('Error setting up admin account:', error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Could not connect to the server. Please check your connection and try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    setupAdmin();
  }, [toast]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { email, password } = formik.values;
      
      console.log('Attempting admin login with:', email);
      
      // First ensure the admin user exists with no-cache headers
      const setupResponse = await fetch('/api/demo/create-admin-user', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      const setupData = await setupResponse.json();
      
      if (!setupResponse.ok) {
        console.error('Error setting up admin account before login:', setupData);
        throw new Error(setupData.error || 'Failed to setup admin account');
      }
      
      console.log('Admin setup successful, proceeding to sign in');
      
      // Then attempt to sign in
      await signIn(email, password);
      console.log('Sign in successful, redirecting to admin page');
      router.push('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error 
          ? error.message 
          : "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const validationSchema = Yup.object().shape({
    email: Yup.string().required("Email is required").email("Email is invalid"),
    password: Yup.string()
      .required("Password is required")
      .min(4, "Must be at least 4 characters")
      .max(40, "Must not exceed 40 characters"),
  });

  const formik = useFormik({
    initialValues: {
      email: 'admin@tradepaper.com',
      password: 'demo1234',
    },
    validationSchema,
    onSubmit: handleLogin,
  });

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin(e);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-background">
      <div className="flex flex-col gap-5 h-auto">
        <div className="w-full flex justify-center cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>

        <Card className="w-full md:w-[440px]" onKeyDown={handleKeyPress}>
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6">
                  <p className="text-center text-sm text-muted-foreground">Enter admin credentials</p>
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
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || initializing || !formik.values.email || !formik.values.password || !formik.isValid}
                  onClick={handleLogin}
                >
                  {isLoading ? "Logging in..." : "Login as Admin"}
                </Button>
                
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs text-muted-foreground"
                    onClick={clearCacheAndServiceWorkers}
                    disabled={isClearingCache}
                  >
                    {isClearingCache ? "Clearing cache..." : "Having trouble? Clear browser cache"}
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;