import { useFormik } from 'formik';
import React, { useContext, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';
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

  // Ensure admin user exists in the database
  useEffect(() => {
    const setupAdmin = async () => {
      try {
        const response = await fetch('/api/demo/create-admin-user', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
        
        if (!response.ok) {
          const data = await response.json();
          console.error('Error setting up admin account:', data);
        }
      } catch (error) {
        console.error('Error setting up admin account:', error);
      }
    };
    
    setupAdmin();
  }, []);

  // Handle direct login with admin credentials
  const handleDirectAdminLogin = async () => {
    setIsLoading(true);
    try {
      // Clear any existing auth state
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Unregister service workers if they exist
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
      
      // Ensure admin user exists
      await fetch('/api/demo/create-admin-user', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
      
      // Sign in with admin credentials
      await signIn('admin@papertrader.app', 'admin1234');
      
      // Use direct location change for more reliable navigation
      window.location.href = '/admin';
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Admin login failed. Please try again or clear your browser cache.",
      });
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { email, password } = formik.values;
      
      // Clear any existing auth state
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Sign in with provided credentials
      await signIn(email, password);
      
      // Use direct location change for more reliable navigation
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
      // Clear localStorage and sessionStorage
      localStorage.clear();
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
              
              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-xs text-muted-foreground"
                  onClick={clearCache}
                  disabled={isLoading}
                >
                  Having trouble? Clear browser cache
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