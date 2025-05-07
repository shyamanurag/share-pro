import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/magic-link-login', '/reset-password', '/auth/callback', '/share'];
const adminRoutes = ['/admin', '/admin-login', '/admin/replace-stocks'];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Skip protection logic during initialization or navigation
    if (isNavigating || initializing) return;

    const isPublicRoute = publicRoutes.includes(router.pathname);
    const isAdminRoute = adminRoutes.includes(router.pathname);
    
    // Allow access to public routes without authentication
    if (isPublicRoute) return;
    
    // Handle admin routes separately
    if (isAdminRoute) {
      // Special case for admin login page
      if (router.pathname === '/admin-login') {
        setIsNavigating(true);
        window.location.href = '/admin-auth.html';
        return;
      }
      
      // Check for admin access
      const hasAdminAccess = 
        localStorage.getItem('adminUser') === 'true' || 
        sessionStorage.getItem('adminUser') === 'true';
      
      if (hasAdminAccess) {
        // Ensure admin flags are set in both storages
        localStorage.setItem('adminUser', 'true');
        sessionStorage.setItem('adminUser', 'true');
        return;
      }
      
      // Redirect non-admin users
      setIsNavigating(true);
      if (user) {
        router.push('/dashboard-india');
      } else {
        router.push('/login');
      }
      return;
    }
    
    // Handle protected routes (non-public, non-admin)
    if (!user) {
      // Redirect to login if not authenticated
      setIsNavigating(true);
      router.push('/login').finally(() => {
        setTimeout(() => setIsNavigating(false), 500);
      });
      return;
    }
    
    // Redirect authenticated users away from login/signup
    if (router.pathname === '/login' || router.pathname === '/signup') {
      setIsNavigating(true);
      router.push('/dashboard-india').finally(() => {
        setTimeout(() => setIsNavigating(false), 500);
      });
    }
  }, [user, initializing, router.pathname, isNavigating]);

  // Show loading spinner during initialization
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show loading for protected routes without authentication
  if (!user && !publicRoutes.includes(router.pathname) && !adminRoutes.includes(router.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Render children for public routes, authenticated protected routes, or admin routes with access
  return <>{children}</>;
};

export default ProtectedRoute;