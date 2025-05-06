import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the static HTML admin auth page
    window.location.href = '/admin-auth.html';
  }, []);

  return (
    <>
      <Head>
        <title>Redirecting to Admin Login</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Redirecting to Admin Login</h1>
        <p className="text-muted-foreground">Please wait...</p>
        <button 
          className="mt-8 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.href = '/admin-auth.html'}
        >
          Click here if not redirected
        </button>
      </div>
    </>
  );
}