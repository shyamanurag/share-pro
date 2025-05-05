import { useFormik } from 'formik';
import React, { useContext, useState, useEffect, useCallback } from 'react';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import GoogleButton from '@/components/GoogleButton';
import Logo from '@/components/Logo';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useIsIFrame } from '@/hooks/useIsIFrame';

const LoginPage = () => {
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

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Clear any existing auth state first
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
      }
      
      const { email, password } = formik.values;
      console.log(`Attempting login with email: ${email}`);
      
      // First ensure the demo user exists if using demo credentials
      if (email === 'demo@papertrader.app') {
        try {
          console.log('Creating/verifying demo user before login');
          await fetch('/api/demo/create-demo-user', {
            method: 'POST',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
          });
        } catch (demoError) {
          console.error('Error setting up demo user:', demoError);
        }
      }
      
      // Attempt sign in
      await signIn(email, password);
      console.log('Login successful, redirecting to dashboard');
      
      // Use replace instead of push to avoid history issues
      router.replace('/dashboard-india');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
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
      email: '',
      password: '',
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
            <CardTitle className="text-center">Log in</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <GoogleButton />
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/magic-link-login');
                }}
                variant="outline"
              >
                Continue with Magic Link
              </Button>
              <Button
                onClick={async (e) => {
                  e.preventDefault();
                  setIsLoading(true);
                  
                  try {
                    // Ensure demo user exists
                    await fetch('/api/demo/create-demo-user', {
                      method: 'POST',
                    });
                    
                    // Set demo credentials
                    formik.setFieldValue('email', 'demo@papertrader.app');
                    formik.setFieldValue('password', 'demo1234');
                    
                    // Submit form after a short delay to allow field values to update
                    setTimeout(() => {
                      handleLogin(e);
                    }, 100);
                  } catch (error) {
                    console.error('Error setting up demo account:', error);
                    toast({
                      variant: "destructive",
                      title: "Demo login failed",
                      description: "Unable to set up demo account. Please try again.",
                    });
                    setIsLoading(false);
                  }
                }}
                variant="secondary"
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                Try Demo Account
              </Button>
            </div>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="flex items-center w-full">
                  <Separator className="flex-1" />
                  <span className="mx-4 text-muted-foreground text-sm font-semibold whitespace-nowrap">or</span>
                  <Separator className="flex-1" />
                </div>

                <div className="flex flex-col gap-6">
                  <p className="text-center text-sm text-muted-foreground">Enter your credentials</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
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
                          placeholder="Enter your password"
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

                    <div className="flex justify-between mt-2 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>Need an account?</span>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0"
                          onClick={() => router.push('/signup')}
                        >
                          Sign up
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0"
                        onClick={() => router.push('/forgot-password')}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <div className="flex justify-center mt-2 text-sm">
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 text-muted-foreground"
                        onClick={() => router.push('/admin-login')}
                      >
                        Admin Login
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || initializing || !formik.values.email || !formik.values.password || !formik.isValid}
                  onClick={handleLogin}
                >
                  {isLoading ? "Logging in..." : "Continue"}
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;