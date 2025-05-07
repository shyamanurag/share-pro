import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  Share2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Stock } from '@/types/trading';

export default function SharePage() {
  const router = useRouter();
  const [stock, setStock] = useState<Partial<Stock> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const { symbol, name, price, change, changePercent } = router.query;
      
      if (symbol && name && price) {
        setStock({
          symbol: symbol as string,
          name: name as string,
          currentPrice: parseFloat(price as string),
          change: change ? parseFloat(change as string) : 0,
          changePercent: changePercent ? parseFloat(changePercent as string) : 0
        });
      }
      
      setLoading(false);
    }
  }, [router.isReady, router.query]);

  const shareAgain = async () => {
    if (!navigator.share || !stock) {
      toast({
        variant: "destructive",
        title: "Sharing not supported",
        description: "Web Share API is not supported in your browser",
      });
      return;
    }

    try {
      await navigator.share({
        title: `${stock.symbol} - Stock Information`,
        text: `Check out ${stock.name} (${stock.symbol}) trading at ₹${stock.currentPrice?.toFixed(2)}`,
        url: window.location.href,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const goToApp = () => {
    router.push('/dashboard-india');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Invalid Share Link</h1>
        <p className="text-muted-foreground mb-6">This share link is invalid or has expired.</p>
        <Button onClick={goToApp}>Go to Trading App</Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{stock.symbol} - Stock Information</title>
        <meta name="description" content={`${stock.name} (${stock.symbol}) stock information`} />
        <meta property="og:title" content={`${stock.symbol} - Stock Information`} />
        <meta property="og:description" content={`${stock.name} (${stock.symbol}) trading at ₹${stock.currentPrice?.toFixed(2)}`} />
        <meta property="og:type" content="website" />
      </Head>
      
      <div className="container max-w-md mx-auto p-4 min-h-screen flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Stock Information</h1>
        </div>
        
        <Card className="mb-6 flex-grow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {stock.symbol}
                  <Badge variant="outline" className="ml-2">
                    NSE
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{stock.name}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold flex items-center justify-end">
                  <IndianRupee className="w-4 h-4 mr-0.5" />
                  {stock.currentPrice?.toFixed(2)}
                </div>
                {stock.change !== undefined && (
                  <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    <span>
                      {stock.change >= 0 ? '+' : ''}
                      {stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}
                      {stock.changePercent?.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="text-center p-6">
              <p className="text-muted-foreground mb-4">
                This stock information was shared with you from the Indian Stock Trading App.
              </p>
              <p className="text-sm text-muted-foreground">
                Open the app to see more details and trade this stock.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3">
            <Button 
              className="w-full" 
              onClick={goToApp}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Open Trading App
            </Button>
            
            {navigator.share && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={shareAgain}
              >
                <Share2 className="w-4 h-4 mr-2" /> Share Again
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <footer className="text-center text-xs text-muted-foreground py-4">
          &copy; {new Date().getFullYear()} Indian Stock Trading App. All rights reserved.
        </footer>
      </div>
    </>
  );
}