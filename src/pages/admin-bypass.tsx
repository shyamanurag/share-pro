import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AdminBypass() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function setupAdminAccess() {
      try {
        console.log('Setting up admin bypass access');
        
        // Clear any existing state
        try {
          localStorage.clear();
          sessionStorage.clear();
          
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          }
          
          if ('caches' in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map(key => caches.delete(key)));
          }
          
          console.log('Browser state cleared');
        } catch (clearError) {
          console.error('Error clearing browser state:', clearError);
          // Continue anyway
        }
        
        // Set admin flags
        try {
          localStorage.setItem('adminUser', 'true');
          localStorage.setItem('adminLoginTime', Date.now().toString());
          
          sessionStorage.setItem('adminUser', 'true');
          sessionStorage.setItem('adminLoginAttempt', 'true');
          sessionStorage.setItem('adminLoginTime', Date.now().toString());
          
          console.log('Admin flags set successfully');
          setSuccess(true);
        } catch (storageError) {
          console.error('Error setting admin flags:', storageError);
          throw new Error('Failed to set admin access flags');
        }
        
        // Wait a moment to ensure flags are set
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Redirect to admin page
        window.location.href = '/admin';
      } catch (error) {
        console.error('Admin bypass error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setLoading(false);
      }
    }
    
    setupAdminAccess();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>Setting up emergency admin access</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {loading && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center text-muted-foreground">
                {success ? 'Admin access granted! Redirecting to admin panel...' : 'Setting up admin access...'}
              </p>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-500">
              <p className="font-semibold mb-2">Error</p>
              <p>{error}</p>
            </div>
          )}
        </CardContent>
        
        {error && (
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                setLoading(true);
                setError(null);
                window.location.href = '/admin';
              }}
            >
              Try Direct Access
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}