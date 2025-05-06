import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';

const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/magic-link-login', '/reset-password', '/auth/callback'];
const adminRoutes = ['/admin', '/admin-login', '/admin/replace-stocks'];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if user has admin role
  const isAdmin = user && (
    user.email === "admin@papertrader.app" || 
    user.email === "demo@papertrader.app" || 
    user.user_metadata?.role === "ADMIN" ||
    user.app_metadata?.role === "ADMIN"
  );

  useEffect(() => {
    // Only handle protection logic if not already navigating
    // This prevents multiple redirects and navigation cancellations
    if (!isNavigating && !initializing) {
      const isPublicRoute = publicRoutes.includes(router.pathname);
      const isAdminRoute = adminRoutes.includes(router.pathname);
      
      // Special case for admin routes
      if (isAdminRoute) {
        // If trying to access admin login page, allow it
        if (router.pathname === '/admin-login') {
          return;
        }
        
        // Check for recent admin login attempt
        const adminLoginAttempt = sessionStorage.getItem('adminLoginAttempt');
        const adminLoginTime = sessionStorage.getItem('adminLoginTime');
        const isRecentAdminLogin = adminLoginAttempt === 'true' && 
          adminLoginTime && 
          (Date.now() - parseInt(adminLoginTime)) < 10000; // Within 10 seconds
        
        // If there was a recent admin login attempt, allow access temporarily
        if (isRecentAdminLogin && router.pathname === '/admin') {
          console.log('Recent admin login detected, allowing access temporarily');
          return;
        }
        
        // If trying to access admin page but not logged in
        if (!user) {
          console.log('User not authenticated for admin route, redirecting to admin login');
          setIsNavigating(true);
          // Use window.location for a hard redirect
          window.location.href = '/admin-login';
          return;
        }
        
        // If trying to access admin page but not admin
        if (user && !isAdmin && router.pathname !== '/admin-login') {
          console.log('User not admin, redirecting to dashboard');
          setIsNavigating(true);
          window.location.href = '/dashboard-india';
          return;
        }
        
        // If admin user is trying to access admin login, redirect to admin page
        if (user && isAdmin && router.pathname === '/admin-login') {
          console.log('Admin already authenticated, redirecting to admin page');
          setIsNavigating(true);
          window.location.href = '/admin';
          return;
        }
      }
      
      // If user is not logged in and trying to access protected route
      if (!user && !isPublicRoute && !isAdminRoute) {
        console.log('User not authenticated, redirecting to login');
        setIsNavigating(true);
        router.push('/login').finally(() => {
          // Reset navigation state after redirect completes or fails
          setTimeout(() => setIsNavigating(false), 500);
        });
      }
      
      // If user is logged in but trying to access login/signup pages
      if (user && (router.pathname === '/login' || router.pathname === '/signup')) {
        console.log('User already authenticated, redirecting to dashboard');
        setIsNavigating(true);
        router.push('/dashboard-india').finally(() => {
          setTimeout(() => setIsNavigating(false), 500);
        });
      }
    }
  }, [user, initializing, router.pathname, isNavigating]);

  // Show loading spinner while initializing auth
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render protected content if user is not authenticated
  // and the route is not public
  if (!user && !publicRoutes.includes(router.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;