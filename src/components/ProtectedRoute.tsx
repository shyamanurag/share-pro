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
    
    // Allow access to public routes without authentication
    if (isPublicRoute) return;
    
    // Handle protected routes (non-public)
    if (!user && !isPublicRoute) {
      // Only redirect to login for non-admin routes
      if (!adminRoutes.includes(router.pathname)) {
        setIsNavigating(true);
        router.push('/login').finally(() => {
          setTimeout(() => setIsNavigating(false), 500);
        });
      }
      return;
    }
    
    // Redirect authenticated users away from login/signup
    if (user && (router.pathname === '/login' || router.pathname === '/signup')) {
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

  // Always render children - we'll handle redirects in the useEffect
  return <>{children}</>;
};

export default ProtectedRoute;