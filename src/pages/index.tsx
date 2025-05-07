import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard-india');
    }
  }, [user, router]);

  // Handle direct navigation
  const handleEnterApp = () => {
    // If user is logged in, go to dashboard, otherwise go to login
    if (user) {
      router.push('/dashboard-india');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Head>
        <title>TradePaper India - Paper Trading Platform</title>
        <meta name="description" content="Paper stock trading platform for the Indian market (NSE)" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <IndianRupee className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
            TradePaper India
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Paper Trading Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Welcome to TradePaper India, your platform for paper trading on the Indian stock market (NSE).
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            onClick={handleEnterApp}
          >
            Enter Trading App
          </Button>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={() => router.push('/login')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}