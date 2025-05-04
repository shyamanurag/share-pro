import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Bell, 
  Home, 
  LineChart, 
  Briefcase, 
  Settings, 
  Plus,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  RefreshCw
} from "lucide-react";
import prisma from "@/lib/prisma";

// Mock data for stocks
const mockStocks = [
  { id: "1", symbol: "AAPL", name: "Apple Inc.", currentPrice: 182.52, previousClose: 178.72, change: 3.8, changePercent: 2.13, volume: 64829541, marketCap: 2850000000000, sector: "Technology" },
  { id: "2", symbol: "MSFT", name: "Microsoft Corporation", currentPrice: 417.88, previousClose: 415.32, change: 2.56, changePercent: 0.62, volume: 22331456, marketCap: 3100000000000, sector: "Technology" },
  { id: "3", symbol: "GOOGL", name: "Alphabet Inc.", currentPrice: 172.95, previousClose: 171.48, change: 1.47, changePercent: 0.86, volume: 18234567, marketCap: 2160000000000, sector: "Technology" },
  { id: "4", symbol: "AMZN", name: "Amazon.com Inc.", currentPrice: 178.75, previousClose: 180.95, change: -2.2, changePercent: -1.22, volume: 32567890, marketCap: 1850000000000, sector: "Consumer Cyclical" },
  { id: "5", symbol: "TSLA", name: "Tesla, Inc.", currentPrice: 172.63, previousClose: 177.29, change: -4.66, changePercent: -2.63, volume: 87654321, marketCap: 548000000000, sector: "Automotive" },
  { id: "6", symbol: "META", name: "Meta Platforms, Inc.", currentPrice: 474.36, previousClose: 468.06, change: 6.3, changePercent: 1.35, volume: 15678901, marketCap: 1210000000000, sector: "Technology" },
  { id: "7", symbol: "NFLX", name: "Netflix, Inc.", currentPrice: 628.78, previousClose: 622.83, change: 5.95, changePercent: 0.96, volume: 5432109, marketCap: 273000000000, sector: "Entertainment" },
  { id: "8", symbol: "NVDA", name: "NVIDIA Corporation", currentPrice: 950.02, previousClose: 938.88, change: 11.14, changePercent: 1.19, volume: 43210987, marketCap: 2340000000000, sector: "Technology" },
];

// Mock data for market indices
const marketIndices = [
  { name: "S&P 500", value: "5,232.93", change: "+0.58%" },
  { name: "NASDAQ", value: "16,429.51", change: "+0.81%" },
  { name: "DOW", value: "38,686.32", change: "+0.35%" },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState(mockStocks);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("market");
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading stocks
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter stocks based on search query
  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter watchlist stocks
  const watchlistStocks = stocks.filter(stock => watchlist.includes(stock.id));

  // Toggle watchlist
  const toggleWatchlist = (stockId: string) => {
    if (watchlist.includes(stockId)) {
      setWatchlist(watchlist.filter(id => id !== stockId));
    } else {
      setWatchlist([...watchlist, stockId]);
    }
  };

  // Refresh stock data
  const refreshStocks = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate updating stock prices with small random changes
      const updatedStocks = stocks.map(stock => {
        const randomChange = (Math.random() * 2 - 1) * (stock.currentPrice * 0.01);
        const newPrice = stock.currentPrice + randomChange;
        const newChange = newPrice - stock.previousClose;
        const newChangePercent = (newChange / stock.previousClose) * 100;
        
        return {
          ...stock,
          currentPrice: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(newChange.toFixed(2)),
          changePercent: parseFloat(newChangePercent.toFixed(2))
        };
      });
      
      setStocks(updatedStocks);
      setIsLoading(false);
    }, 1000);
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Dashboard | TradePaper</title>
        <meta name="description" content="Your paper trading dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div className="flex flex-col min-h-screen bg-background">
        {/* Top Navigation */}
        <header className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="white" 
                  className="w-5 h-5"
                >
                  <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                </svg>
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">TradePaper</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="text-sm"
              >
                Log Out
              </Button>
            </div>
          </div>
          
          {/* Market Indices Ticker */}
          <div className="bg-muted/50 p-2 overflow-hidden">
            <div className="flex space-x-6 animate-marquee">
              {[...marketIndices, ...marketIndices].map((index, i) => (
                <div key={i} className="flex items-center space-x-2 whitespace-nowrap">
                  <span className="font-medium text-sm">{index.name}</span>
                  <span className="text-sm">{index.value}</span>
                  <span className={`text-xs ${index.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {index.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 pb-20">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search stocks..."
              className="pl-10 pr-4 py-2 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="market" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Market Overview</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshStocks}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeleton
                  Array(5).fill(0).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <div className="h-5 w-16 bg-muted rounded"></div>
                            <div className="h-4 w-32 bg-muted rounded"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-5 w-20 bg-muted rounded"></div>
                            <div className="h-4 w-16 bg-muted rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  filteredStocks.map(stock => (
                    <motion.div
                      key={stock.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden hover:border-green-500/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold">{stock.symbol}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {stock.sector}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => toggleWatchlist(stock.id)}
                                >
                                  {watchlist.includes(stock.id) ? (
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                  ) : (
                                    <Star className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">{stock.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">${stock.currentPrice.toFixed(2)}</p>
                              <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stock.change >= 0 ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                )}
                                <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>Volume: {stock.volume.toLocaleString()}</div>
                              <div>Market Cap: ${(stock.marketCap / 1000000000).toFixed(2)}B</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
                
                {!isLoading && filteredStocks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No stocks found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="watchlist" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Watchlist</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshStocks}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {watchlistStocks.length > 0 ? (
                <div className="space-y-4">
                  {isLoading ? (
                    // Loading skeleton
                    Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex justify-between">
                            <div className="space-y-2">
                              <div className="h-5 w-16 bg-muted rounded"></div>
                              <div className="h-4 w-32 bg-muted rounded"></div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-5 w-20 bg-muted rounded"></div>
                              <div className="h-4 w-16 bg-muted rounded"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    watchlistStocks.map(stock => (
                      <motion.div
                        key={stock.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="overflow-hidden hover:border-green-500/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-bold">{stock.symbol}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {stock.sector}
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => toggleWatchlist(stock.id)}
                                  >
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">{stock.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">${stock.currentPrice.toFixed(2)}</p>
                                <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {stock.change >= 0 ? (
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                  )}
                                  <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>Volume: {stock.volume.toLocaleString()}</div>
                                <div>Market Cap: ${(stock.marketCap / 1000000000).toFixed(2)}B</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-muted-foreground/20 rounded-lg">
                  <Star className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Your watchlist is empty</h3>
                  <p className="text-muted-foreground mb-4">Add stocks to your watchlist by clicking the star icon</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("market")}
                    className="mx-auto"
                  >
                    Browse Market
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
        
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
          <div className="grid grid-cols-4 h-16">
            <Button variant="ghost" className="flex flex-col items-center justify-center rounded-none h-full">
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center justify-center rounded-none h-full">
              <LineChart className="h-5 w-5" />
              <span className="text-xs mt-1">Markets</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center justify-center rounded-none h-full">
              <Briefcase className="h-5 w-5" />
              <span className="text-xs mt-1">Portfolio</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center justify-center rounded-none h-full">
              <Settings className="h-5 w-5" />
              <span className="text-xs mt-1">Settings</span>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}

// Add custom animation
const styles = `
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 20s linear infinite;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}