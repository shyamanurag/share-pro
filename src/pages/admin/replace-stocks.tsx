import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function ReplaceStocks() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleReplaceStocks = async () => {
    try {
      setIsLoading(true);
      setResult(null);

      const response = await fetch('/api/stocks/replace-with-indian', {
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
      setResult(JSON.stringify(data, null, 2));
      
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
        <title>Replace Stocks | Admin</title>
      </Head>
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Replace Stocks with Indian NSE Stocks</CardTitle>
            <CardDescription>
              This action will replace all existing stocks with Indian NSE stocks. This will affect all users' portfolios and watchlists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Warning: This is a destructive action that cannot be undone. All existing stock data will be replaced.
            </p>
            {result && (
              <div className="mt-4 p-4 bg-muted rounded-md overflow-auto max-h-60">
                <pre className="text-xs">{result}</pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
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
          </CardFooter>
        </Card>
      </div>
    </>
  );
}