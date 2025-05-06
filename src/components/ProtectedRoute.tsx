import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';

const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/magic-link-login', '/reset-password', '/auth/callback'];
const adminRoutes = ['/admin', '/admin-login', '/admin/replace-stocks'];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Only handle protection logic if not already navigating
    // This prevents multiple redirects and navigation cancellations
    if (!isNavigating && !initializing) {
      const isPublicRoute = publicRoutes.includes(router.pathname);
      const isAdminRoute = adminRoutes.includes(router.pathname);
      
      // If user is not logged in and trying to access protected route
      if (!user && !isPublicRoute) {
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