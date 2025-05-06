import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, IndianRupee, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ReplaceStocksNow() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleReplaceStocks = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/trigger-stock-replacement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to replace stocks');
      }

      const data = await response.json();
      setIsComplete(true);
      
      toast({
        title: 'Success',
        description: 'All stocks have been replaced with Indian NSE stocks',
      });
    } catch (error: any) {
      console.error('Error replacing stocks:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to replace stocks',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Replace Stocks | TradePaper India</title>
      </Head>
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <IndianRupee className="w-6 h-6 mr-2 text-green-600" />
              Replace Stocks with Indian NSE Stocks
            </CardTitle>
            <CardDescription>
              This action will replace all existing stocks with Indian NSE stocks. This will affect all users' portfolios and watchlists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isComplete ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                      Stock Replacement Complete
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-500">
                      <p>All stocks have been successfully replaced with Indian NSE stocks.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-400">
                      Warning: This is a destructive action
                    </h3>
                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-500">
                      <p>This action will replace all existing stock data with Indian NSE stocks. This cannot be undone.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              The replacement process will:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground mb-4">
              <li>Remove all existing stocks from the database</li>
              <li>Add 30+ Indian NSE stocks with realistic data</li>
              <li>Update all related watchlists and portfolios</li>
              <li>This process may take a few seconds to complete</li>
            </ul>
          </CardContent>
          <CardFooter>
            {isComplete ? (
              <Button 
                onClick={() => router.push('/dashboard-india')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button 
                onClick={handleReplaceStocks} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Replacing Stocks...
                  </>
                ) : (
                  'Replace All Stocks with Indian NSE Stocks'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
}