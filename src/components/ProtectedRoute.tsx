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
    user.app_metadata?.role === "ADMIN" ||
    localStorage.getItem('adminUser') === 'true' ||
    sessionStorage.getItem('adminUser') === 'true'
  );

  useEffect(() => {
    // Only handle protection logic if not already navigating
    // This prevents multiple redirects and navigation cancellations
    if (!isNavigating && !initializing) {
      const isPublicRoute = publicRoutes.includes(router.pathname);
      const isAdminRoute = adminRoutes.includes(router.pathname);
      
      // Special case for admin routes - simplified logic
      if (isAdminRoute) {
        // If trying to access admin login page, redirect to our static HTML version
        if (router.pathname === '/admin-login') {
          console.log('Redirecting to static admin login page');
          setIsNavigating(true);
          window.location.href = '/admin-auth.html';
          return;
        }
        
        // Check for admin flags in storage first - this is the most reliable method
        const adminUserFlag = localStorage.getItem('adminUser') === 'true' || sessionStorage.getItem('adminUser') === 'true';
        
        // If admin flag is set, allow access to admin pages and ensure flags are set in both storages
        if (adminUserFlag) {
          console.log('Admin flag detected in storage, allowing access');
          localStorage.setItem('adminUser', 'true');
          sessionStorage.setItem('adminUser', 'true');
          return;
        }
        
        // Check for recent admin login attempt with extended time window
        const adminLoginAttempt = sessionStorage.getItem('adminLoginAttempt') === 'true';
        const adminLoginTime = sessionStorage.getItem('adminLoginTime');
        const isRecentAdminLogin = adminLoginTime && (Date.now() - parseInt(adminLoginTime)) < 120000; // Within 2 minutes
        
        // If there was a recent admin login attempt, allow access temporarily
        if (adminLoginAttempt && isRecentAdminLogin) {
          console.log('Recent admin login detected, allowing access temporarily');
          // Set admin flag to ensure continued access
          localStorage.setItem('adminUser', 'true');
          sessionStorage.setItem('adminUser', 'true');
          return;
        }
        
        // Check if user is admin based on email or metadata
        if (user && (
          user.email === "admin@papertrader.app" || 
          user.email === "demo@papertrader.app" || 
          user.user_metadata?.role === "ADMIN" ||
          user.app_metadata?.role === "ADMIN"
        )) {
          console.log('Admin user detected, allowing access');
          // Set admin flag to ensure continued access
          localStorage.setItem('adminUser', 'true');
          sessionStorage.setItem('adminUser', 'true');
          return;
        }
        
        // If trying to access admin page but not admin, redirect to dashboard or login
        console.log('User not authorized for admin route, redirecting');
        setIsNavigating(true);
        
        if (user) {
          // If logged in but not admin, go to dashboard
          window.location.href = '/dashboard-india';
        } else {
          // If not logged in, go to admin login
          window.location.href = '/admin-login';
        }
        return;
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
  }, [user, initializing, router.pathname, isNavigating, isAdmin]);

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