import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

// Extremely simplified ProtectedRoute component
// Just shows a loading spinner during initialization
// and renders children in all cases
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initializing } = useContext(AuthContext);

  // Show loading spinner during initialization
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Always render children
  return <>{children}</>;
};

export default ProtectedRoute;