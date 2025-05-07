import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface SharedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function SharePage() {
  const router = useRouter();
  const [stock, setStock] = useState<SharedStock | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    try {
      const { stock: stockParam, msg } = router.query;
      
      if (typeof stockParam === 'string') {
        const decodedStock = JSON.parse(decodeURIComponent(stockParam)) as SharedStock;
        setStock(decodedStock);
      }
      
      if (typeof msg === 'string') {
        setMessage(decodeURIComponent(msg));
      }
    } catch (err) {
      console.error('Error parsing shared stock data:', err);
      setError('Invalid share link. The data could not be parsed correctly.');
    } finally {
      setLoading(false);
    }
  }, [router.isReady, router.query]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Error Loading Shared Stock</h1>
        <p className="text-muted-foreground mb-6">{error || 'No stock data found in the share link.'}</p>
        <Button onClick={() => router.push('/')}>Go to Homepage</Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{stock.symbol} - Shared Stock | TradePaper India</title>
        <meta name="description" content={`Check out ${stock.symbol} stock on TradePaper India. Currently trading at ₹${stock.price.toFixed(2)}.`} />
        <meta property="og:title" content={`${stock.symbol} - ${stock.name}`} />
        <meta property="og:description" content={`Currently trading at ₹${stock.price.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 bg-background border-b border-border p-4">
          <div className="flex items-center space-x-2">
            <motion.div 
              className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IndianRupee className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">TradePaper India</span>
          </div>
        </header>

        <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Shared Stock</h1>
            {message && (
              <div className="mt-2 p-4 bg-muted rounded-lg italic">
                "{message}"
              </div>
            )}
          </div>

          <Card className="overflow-hidden border-green-500/20 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-500/5 to-blue-500/5">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {stock.symbol}
                    <Badge variant="outline" className="ml-2">
                      NSE
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {stock.name}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold flex items-center justify-end">
                    <IndianRupee className="w-5 h-5 mr-0.5" />
                    {stock.price.toFixed(2)}
                  </div>
                  <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    <span>
                      {stock.change >= 0 ? '+' : ''}
                      {stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-lg font-bold flex items-center">
                    <IndianRupee className="w-4 h-4 mr-0.5" />
                    {stock.price.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Change</p>
                  <p className={`text-lg font-bold ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? '+' : ''}
                    {stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                This stock was shared with you from TradePaper India, a paper trading platform for the Indian stock market.
              </p>
              
              <p className="text-sm mb-6">
                Sign up to track this stock, create watchlists, and practice trading with virtual money.
              </p>
            </CardContent>
            
            <CardFooter className="bg-muted/20 p-4 flex flex-col sm:flex-row gap-3">
              <Button 
                className="w-full sm:w-auto"
                onClick={() => router.push('/')}
              >
                Open in TradePaper
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => router.push('/signup')}
              >
                Sign Up
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>TradePaper India - Paper Trading Platform</p>
            <p className="mt-1">Practice trading without risking real money</p>
          </div>
        </main>
      </div>
    </>
  );
}