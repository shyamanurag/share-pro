import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
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
  RefreshCw,
  IndianRupee,
  Clock,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Info,
  Zap
} from "lucide-react";
import prisma from "@/lib/prisma";

// Indian market indices data
const marketIndices = [
  { name: "NIFTY 50", value: "22,643.40", change: "+0.42%" },
  { name: "SENSEX", value: "74,671.28", change: "+0.35%" },
  { name: "NIFTY BANK", value: "48,324.80", change: "-0.18%" },
  { name: "NIFTY IT", value: "34,567.90", change: "+1.25%" },
];

// Market timing information for NSE
const marketTiming = {
  open: "9:15 AM",
  close: "3:30 PM",
  days: "Monday to Friday",
  timezone: "IST (UTC+5:30)"
};

// Types
interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
  sector: string | null;
}

interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockId: string;
  addedAt: string;
  stock: Stock;
}

interface PortfolioItem {
  id: string;
  portfolioId: string;
  stockId: string;
  quantity: number;
  avgBuyPrice: number;
  stock: Stock;
}

interface Transaction {
  id: string;
  userId: string;
  stockId: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  stock: Stock;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  balance: number;
  createdAt: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [activeTab, setActiveTab] = useState("market");
  const [activeSection, setActiveSection] = useState("home");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [showMarketInfo, setShowMarketInfo] = useState(false);

  // Fetch stocks
  const fetchStocks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stocks');
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const data = await response.json();
      setStocks(data.stocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch stocks",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch watchlist
  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (!response.ok) throw new Error('Failed to fetch watchlist');
      const data = await response.json();
      setWatchlistItems(data.items);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  // Fetch portfolio
  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio');
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data = await response.json();
      setPortfolioItems(data.items);
      setPortfolioValue(data.portfolioValue);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const data = await response.json();
      setUserProfile(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      // Check if user is admin and redirect to admin page
      if (user.email === "admin@tradepaper.com") {
        router.push('/admin');
        return;
      }
      
      fetchStocks();
      fetchWatchlist();
      fetchPortfolio();
      fetchTransactions();
      fetchUserProfile();
    }
  }, [user, router]);

  // Filter stocks based on search query
  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get watchlist stock IDs
  const watchlistStockIds = watchlistItems.map(item => item.stockId);

  // Toggle watchlist
  const toggleWatchlist = async (stockId: string) => {
    try {
      if (watchlistStockIds.includes(stockId)) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist/${stockId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to remove from watchlist');
        
        setWatchlistItems(watchlistItems.filter(item => item.stockId !== stockId));
        toast({
          title: "Removed from watchlist",
          description: "Stock removed from your watchlist",
        });
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stockId }),
        });
        
        if (!response.ok) throw new Error('Failed to add to watchlist');
        
        const data = await response.json();
        setWatchlistItems([...watchlistItems, data.watchlistItem]);
        toast({
          title: "Added to watchlist",
          description: "Stock added to your watchlist",
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update watchlist",
      });
    }
  };

  // Refresh stock data
  const refreshStocks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stocks/refresh', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to refresh stocks');
      
      const data = await response.json();
      setStocks(data.stocks);
      
      // Refresh portfolio and watchlist to get updated values
      fetchPortfolio();
      fetchWatchlist();
      
      toast({
        title: "Stocks refreshed",
        description: "Latest stock prices loaded",
      });
    } catch (error) {
      console.error('Error refreshing stocks:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh stocks",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open trade dialog
  const openTradeDialog = (stock: Stock, type: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedStock(stock);
    setTradeType(type);
    setTradeQuantity(1);
    setIsTradeDialogOpen(true);
  };

  // Execute trade
  const executeTrade = async () => {
    if (!selectedStock) return;
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: selectedStock.id,
          type: tradeType,
          quantity: tradeQuantity,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute trade');
      }
      
      const data = await response.json();
      
      // Update transactions list
      setTransactions([data.transaction, ...transactions]);
      
      // Refresh portfolio and user profile
      fetchPortfolio();
      fetchUserProfile();
      
      setIsTradeDialogOpen(false);
      
      toast({
        title: `${tradeType === 'BUY' ? 'Purchase' : 'Sale'} Successful`,
        description: `${tradeType === 'BUY' ? 'Bought' : 'Sold'} ${tradeQuantity} shares of ${selectedStock.symbol} at ₹${selectedStock.currentPrice.toFixed(2)}`,
      });
    } catch (error: any) {
      console.error('Error executing trade:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
      });
    }
  };

  // Calculate total trade value
  const calculateTradeValue = () => {
    if (!selectedStock) return 0;
    return selectedStock.currentPrice * tradeQuantity;
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Dashboard | TradePaper India</title>
        <meta name="description" content="Your Indian stock paper trading dashboard" />
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
                <IndianRupee className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">TradePaper India</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/advanced-trading')}
                className="flex items-center gap-1"
              >
                <Zap className="w-4 h-4" />
                Advanced Trading
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMarketInfo(!showMarketInfo)}
                className="relative"
              >
                <Info className="w-5 h-5 text-muted-foreground" />
              </Button>
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
          
          {/* Market Info Dialog */}
          {showMarketInfo && (
            <div className="absolute right-4 top-16 bg-card border border-border rounded-lg shadow-lg p-4 z-20 w-64">
              <h3 className="font-bold mb-2">NSE Market Hours</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open:</span>
                  <span>{marketTiming.open}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Close:</span>
                  <span>{marketTiming.close}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days:</span>
                  <span>{marketTiming.days}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span>{marketTiming.timezone}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => setShowMarketInfo(false)}
              >
                Close
              </Button>
            </div>
          )}
          
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
          {activeSection === "home" && (
            <>
              {/* User Balance Card */}
              <Card className="mb-6 bg-gradient-to-r from-orange-500/10 to-green-500/10">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <h2 className="text-2xl font-bold flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {userProfile?.balance?.toFixed(2) || "0.00"}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <h2 className="text-2xl font-bold flex items-center justify-end">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {portfolioValue.toFixed(2)}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Total Value</p>
                      <p className="text-lg font-bold flex items-center">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        {((userProfile?.balance || 0) + portfolioValue).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search NSE stocks..."
                  className="pl-10 pr-4 py-2 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
                  <TabsTrigger value="fno">F&O</TabsTrigger>
                </TabsList>
                
                <TabsContent value="market" className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">NSE Overview</h2>
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
                                    <div className="relative group">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 relative"
                                        onClick={() => toggleWatchlist(stock.id)}
                                      >
                                        {watchlistStockIds.includes(stock.id) ? (
                                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        ) : (
                                          <Star className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </Button>
                                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                                        {watchlistStockIds.includes(stock.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold flex items-center justify-end">
                                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                    {stock.currentPrice.toFixed(2)}
                                  </p>
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
                                  <div>Market Cap: ₹{(stock.marketCap ? (stock.marketCap / 10000000).toFixed(2) : "N/A")} Cr</div>
                                </div>
                                <div className="mt-3 flex justify-between">
                                  <Button 
                                    size="sm"
                                    className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => openTradeDialog(stock, 'BUY')}
                                  >
                                    <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                  </Button>
                                  <Button 
                                    size="sm"
                                    className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => openTradeDialog(stock, 'SELL')}
                                  >
                                    <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                                  </Button>
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
                
                <TabsContent value="fno" className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Futures & Options</h2>
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
                  
                  <div className="mb-6">
                    <Tabs defaultValue="futures">
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="futures">Futures</TabsTrigger>
                        <TabsTrigger value="options">Options</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="futures" className="mt-4">
                        <div className="space-y-4">
                          {filteredStocks.slice(0, 5).map(stock => {
                            const futurePrice = stock.currentPrice * 1.02;
                            const expiryDate = new Date();
                            expiryDate.setDate(expiryDate.getDate() + 28);
                            const lotSize = stock.currentPrice > 1000 ? 25 : 50;
                            const marginRequired = (futurePrice * lotSize) * 0.15;
                            const openInterest = Math.floor(stock.volume * 0.1);
                            
                            return (
                              <motion.div
                                key={`future-${stock.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Card className="overflow-hidden border-blue-500/20 hover:border-blue-500/70 transition-colors shadow-sm">
                                  <CardHeader className="p-4 pb-2 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="flex items-center space-x-2">
                                          <h3 className="font-bold text-blue-700 dark:text-blue-400">{stock.symbol} FUT</h3>
                                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                            {expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{stock.name} Futures</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold flex items-center justify-end text-lg">
                                          <IndianRupee className="w-4 h-4 mr-0.5" />
                                          {futurePrice.toFixed(2)}
                                        </p>
                                        <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                          {stock.change >= 0 ? (
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                          ) : (
                                            <TrendingDown className="w-3 h-3 mr-1" />
                                          )}
                                          <span>{stock.change >= 0 ? '+' : ''}{(stock.change * 1.1).toFixed(2)} ({stock.change >= 0 ? '+' : ''}{(stock.changePercent * 1.1).toFixed(2)}%)</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  
                                  <CardContent className="p-4 pt-2">
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                                        <p className="text-xs text-muted-foreground">Lot Size</p>
                                        <p className="font-semibold">{lotSize} shares</p>
                                      </div>
                                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                                        <p className="text-xs text-muted-foreground">Contract Value</p>
                                        <p className="font-semibold flex items-center">
                                          <IndianRupee className="w-3 h-3 mr-0.5" />
                                          {(futurePrice * lotSize).toLocaleString('en-IN')}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                                        <p className="text-xs text-muted-foreground">Margin Required</p>
                                        <p className="font-semibold flex items-center">
                                          <IndianRupee className="w-3 h-3 mr-0.5" />
                                          {marginRequired.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </p>
                                      </div>
                                      <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                                        <p className="text-xs text-muted-foreground">Open Interest</p>
                                        <p className="font-semibold">{openInterest.toLocaleString('en-IN')}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4 flex justify-between">
                                      <Button 
                                        size="sm"
                                        className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                                        onClick={() => toast({
                                          title: "Coming Soon",
                                          description: "Futures trading will be available soon!",
                                        })}
                                      >
                                        <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                      </Button>
                                      <Button 
                                        size="sm"
                                        className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                        onClick={() => toast({
                                          title: "Coming Soon",
                                          description: "Futures trading will be available soon!",
                                        })}
                                      >
                                        <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="options" className="mt-4">
                        <Tabs defaultValue="call" className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <TabsList className="grid grid-cols-2 w-48">
                              <TabsTrigger value="call">Call Options</TabsTrigger>
                              <TabsTrigger value="put">Put Options</TabsTrigger>
                            </TabsList>
                            <div className="text-sm text-muted-foreground">
                              Expiry: June 27, 2024
                            </div>
                          </div>
                          
                          <TabsContent value="call">
                            <div className="space-y-4">
                              {filteredStocks.slice(0, 5).map(stock => {
                                const strikePrice = Math.round(stock.currentPrice / 100) * 100;
                                const premiumPrice = stock.currentPrice * 0.05;
                                const lotSize = stock.currentPrice > 1000 ? 25 : 50;
                                const iv = 15 + Math.random() * 10;
                                const delta = 0.5 + Math.random() * 0.3;
                                const theta = -(Math.random() * 2).toFixed(2);
                                
                                return (
                                  <motion.div
                                    key={`option-${stock.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <Card className="overflow-hidden border-purple-500/20 hover:border-purple-500/70 transition-colors shadow-sm">
                                      <CardHeader className="p-4 pb-2 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              <h3 className="font-bold text-purple-700 dark:text-purple-400">{stock.symbol} {strikePrice} CE</h3>
                                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                                27 JUN
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Call Option • Lot: {lotSize}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-bold flex items-center justify-end text-lg">
                                              <IndianRupee className="w-4 h-4 mr-0.5" />
                                              {premiumPrice.toFixed(2)}
                                            </p>
                                            <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                              {stock.change >= 0 ? (
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                              ) : (
                                                <TrendingDown className="w-3 h-3 mr-1" />
                                              )}
                                              <span>{stock.change >= 0 ? '+' : ''}{(stock.change * 0.2).toFixed(2)} ({stock.change >= 0 ? '+' : ''}{(stock.changePercent * 2).toFixed(2)}%)</span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      
                                      <CardContent className="p-4 pt-2">
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Strike</p>
                                            <p className="font-semibold flex items-center">
                                              <IndianRupee className="w-3 h-3 mr-0.5" />
                                              {strikePrice}
                                            </p>
                                          </div>
                                          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Spot</p>
                                            <p className="font-semibold flex items-center">
                                              <IndianRupee className="w-3 h-3 mr-0.5" />
                                              {stock.currentPrice.toFixed(2)}
                                            </p>
                                          </div>
                                          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">IV</p>
                                            <p className="font-semibold">{iv.toFixed(2)}%</p>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Delta</p>
                                            <p className="font-semibold">{delta.toFixed(2)}</p>
                                          </div>
                                          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Theta</p>
                                            <p className="font-semibold">{theta}</p>
                                          </div>
                                          <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Total Value</p>
                                            <p className="font-semibold flex items-center">
                                              <IndianRupee className="w-3 h-3 mr-0.5" />
                                              {(premiumPrice * lotSize).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="mt-4 flex justify-between">
                                          <Button 
                                            size="sm"
                                            className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => toast({
                                              title: "Coming Soon",
                                              description: "Options trading will be available soon!",
                                            })}
                                          >
                                            <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                          </Button>
                                          <Button 
                                            size="sm"
                                            className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                            onClick={() => toast({
                                              title: "Coming Soon",
                                              description: "Options trading will be available soon!",
                                            })}
                                          >
                                            <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="put">
                            <div className="space-y-4">
                              {filteredStocks.slice(0, 5).map(stock => {
                                const strikePrice = Math.round(stock.currentPrice / 100) * 100;
                                const premiumPrice = stock.currentPrice * 0.03;
                                const lotSize = stock.currentPrice > 1000 ? 25 : 50;
                                const iv = 15 + Math.random() * 10;
                                const delta = -(0.5 + Math.random() * 0.3);
                                const theta = -(Math.random() * 2).toFixed(2);
                                
                                return (
                                  <motion.div
                                    key={`put-option-${stock.id}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <Card className="overflow-hidden border-orange-500/20 hover:border-orange-500/70 transition-colors shadow-sm">
                                      <CardHeader className="p-4 pb-2 bg-gradient-to-r from-orange-500/5 to-red-500/5">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              <h3 className="font-bold text-orange-700 dark:text-orange-400">{stock.symbol} {strikePrice} PE</h3>
                                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                                27 JUN
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Put Option • Lot: {lotSize}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-bold flex items-center justify-end text-lg">
                                              <IndianRupee className="w-4 h-4 mr-0.5" />
                                              {premiumPrice.toFixed(2)}
                                            </p>
                                            <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                              {stock.change >= 0 ? (
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                              ) : (
                                                <TrendingDown className="w-3 h-3 mr-1" />
                                              )}
                                              <span>{stock.change >= 0 ? '+' : ''}{(stock.change * 0.2).toFixed(2)} ({stock.change >= 0 ? '+' : ''}{(stock.changePercent * 2).toFixed(2)}%)</span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      
                                      <CardContent className="p-4 pt-2">
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Strike</p>
                                            <p className="font-semibold flex items-center">
                                              <IndianRupee className="w-3 h-3 mr-0.5" />
                                              {strikePrice}
                                            </p>
                                          </div>
                                          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Spot</p>
                                            <p className="font-semibold flex items-center">
                                              <IndianRupee className="w-3 h-3 mr-0.5" />
                                              {stock.currentPrice.toFixed(2)}
                                            </p>
                                          </div>
                                          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">IV</p>
                                            <p className="font-semibold">{iv.toFixed(2)}%</p>
                                          </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Delta</p>
                                            <p className="font-semibold">{delta.toFixed(2)}</p>
                                          </div>
                                          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Theta</p>
                                            <p className="font-semibold">{theta}</p>
                                          </div>
                                          <div className="bg-orange-50 dark:bg-orange-950/30 p-2 rounded-md">
                                            <p className="text-xs text-muted-foreground">Total Value</p>
                                            <p className="font-semibold flex items-center">
                                              <IndianRupee className="w-3 h-3 mr-0.5" />
                                              {(premiumPrice * lotSize).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="mt-4 flex justify-between">
                                          <Button 
                                            size="sm"
                                            className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => toast({
                                              title: "Coming Soon",
                                              description: "Options trading will be available soon!",
                                            })}
                                          >
                                            <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                          </Button>
                                          <Button 
                                            size="sm"
                                            className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                            onClick={() => toast({
                                              title: "Coming Soon",
                                              description: "Options trading will be available soon!",
                                            })}
                                          >
                                            <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>
                    </Tabs>
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
                  
                  {watchlistItems.length > 0 ? (
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
                        watchlistItems.map(item => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="overflow-hidden hover:border-green-500/50 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-bold">{item.stock.symbol}</h3>
                                      <Badge variant="outline" className="text-xs">
                                        {item.stock.sector}
                                      </Badge>
                                      <div className="relative group">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 relative"
                                          onClick={() => toggleWatchlist(item.stockId)}
                                        >
                                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        </Button>
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                                          Remove from watchlist
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{item.stock.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold flex items-center justify-end">
                                      <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                      {item.stock.currentPrice.toFixed(2)}
                                    </p>
                                    <div className={`flex items-center justify-end text-sm ${item.stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                      {item.stock.change >= 0 ? (
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                      ) : (
                                        <TrendingDown className="w-3 h-3 mr-1" />
                                      )}
                                      <span>{item.stock.change >= 0 ? '+' : ''}{item.stock.change.toFixed(2)} ({item.stock.change >= 0 ? '+' : ''}{item.stock.changePercent.toFixed(2)}%)</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>Volume: {item.stock.volume.toLocaleString()}</div>
                                    <div>Market Cap: ₹{(item.stock.marketCap ? (item.stock.marketCap / 10000000).toFixed(2) : "N/A")} Cr</div>
                                  </div>
                                  <div className="mt-3 flex justify-between">
                                    <Button 
                                      size="sm"
                                      className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                                      onClick={() => openTradeDialog(item.stock, 'BUY')}
                                    >
                                      <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                    </Button>
                                    <Button 
                                      size="sm"
                                      className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                      onClick={() => openTradeDialog(item.stock, 'SELL')}
                                    >
                                      <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                                    </Button>
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
            </>
          )}

          {activeSection === "portfolio" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">My Portfolio</h2>
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

              {/* Portfolio Summary */}
              <Card className="mb-6 bg-gradient-to-r from-orange-500/10 to-green-500/10">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <h2 className="text-2xl font-bold flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {userProfile?.balance?.toFixed(2) || "0.00"}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <h2 className="text-2xl font-bold flex items-center justify-end">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {portfolioValue.toFixed(2)}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Total Value</p>
                      <p className="text-lg font-bold flex items-center">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        {((userProfile?.balance || 0) + portfolioValue).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Holdings */}
              <h3 className="text-lg font-semibold mb-4">Holdings</h3>
              
              {portfolioItems.length > 0 ? (
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
                    portfolioItems.map(item => {
                      const currentValue = item.quantity * item.stock.currentPrice;
                      const costBasis = item.quantity * item.avgBuyPrice;
                      const profit = currentValue - costBasis;
                      const profitPercent = (profit / costBasis) * 100;
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="overflow-hidden hover:border-green-500/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-bold">{item.stock.symbol}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {item.quantity} shares
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{item.stock.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold flex items-center justify-end">
                                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                    {currentValue.toFixed(2)}
                                  </p>
                                  <div className={`flex items-center justify-end text-sm ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {profit >= 0 ? (
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3 mr-1" />
                                    )}
                                    <span>{profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div>Avg. Buy: ₹{item.avgBuyPrice.toFixed(2)}</div>
                                  <div>Current: ₹{item.stock.currentPrice.toFixed(2)}</div>
                                </div>
                                <div className="mt-3 flex justify-between">
                                  <Button 
                                    size="sm"
                                    className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => openTradeDialog(item.stock, 'BUY')}
                                  >
                                    <ShoppingCart className="w-3 h-3 mr-1" /> Buy More
                                  </Button>
                                  <Button 
                                    size="sm"
                                    className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => openTradeDialog(item.stock, 'SELL')}
                                  >
                                    <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-muted-foreground/20 rounded-lg">
                  <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Your portfolio is empty</h3>
                  <p className="text-muted-foreground mb-4">Start investing by buying stocks from the market</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSection("home")}
                    className="mx-auto"
                  >
                    Browse Market
                  </Button>
                </div>
              )}
            </>
          )}

          {activeSection === "transactions" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Transaction History</h2>
              </div>
              
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={transaction.type === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                                  {transaction.type}
                                </Badge>
                                <h3 className="font-bold">{transaction.stock.symbol}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.quantity} shares
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{transaction.stock.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold flex items-center justify-end">
                                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                {transaction.total.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>Price: ₹{transaction.price.toFixed(2)}</div>
                              <div>Total: ₹{transaction.total.toFixed(2)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-muted-foreground/20 rounded-lg">
                  <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground mb-4">Your transaction history will appear here</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveSection("home")}
                    className="mx-auto"
                  >
                    Start Trading
                  </Button>
                </div>
              )}
            </>
          )}

          {activeSection === "profile" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">My Profile</h2>
              </div>
              
              <Tabs defaultValue="profile" className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="add-money">Add Money</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-4">
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                          {userProfile?.avatarUrl ? (
                            <img 
                              src={userProfile.avatarUrl} 
                              alt="Profile" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-10 h-10 text-muted-foreground" />
                          )}
                        </div>
                        <h3 className="text-xl font-bold">{userProfile?.name || userProfile?.email}</h3>
                        <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="text-xl font-bold flex items-center justify-center">
                              <IndianRupee className="w-4 h-4 mr-1" />
                              {userProfile?.balance?.toFixed(2) || "0.00"}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Portfolio Value</p>
                            <p className="text-xl font-bold flex items-center justify-center">
                              <IndianRupee className="w-4 h-4 mr-1" />
                              {portfolioValue.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Total Value</p>
                          <p className="text-lg font-bold flex items-center">
                            <IndianRupee className="w-4 h-4 mr-1" />
                            {((userProfile?.balance || 0) + portfolioValue).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Transactions</p>
                          <p className="text-lg font-bold">{transactions.length}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">Joined</p>
                          <p className="text-sm">{userProfile ? new Date(userProfile.createdAt).toLocaleDateString() : ""}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={signOut}
                  >
                    Sign Out
                  </Button>
                </TabsContent>
                
                <TabsContent value="add-money" className="mt-4">
                  <Tabs defaultValue="upi">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upi">UPI</TabsTrigger>
                      <TabsTrigger value="card">Card</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upi" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Add Money via UPI</CardTitle>
                          <CardDescription>
                            Add funds to your trading account using UPI payment
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const amount = formData.get('amount') as string;
                            const upiId = formData.get('upiId') as string;
                            
                            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                              toast({
                                variant: "destructive",
                                title: "Invalid amount",
                                description: "Please enter a valid amount greater than 0",
                              });
                              return;
                            }
                            
                            if (!upiId || !upiId.includes('@')) {
                              toast({
                                variant: "destructive",
                                title: "Invalid UPI ID",
                                description: "Please enter a valid UPI ID (e.g., name@upi)",
                              });
                              return;
                            }
                            
                            setIsLoading(true);
                            
                            fetch('/api/user/add-money', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                amount: parseFloat(amount),
                                paymentMethod: 'UPI',
                                paymentDetails: { upiId }
                              }),
                            })
                              .then(response => response.json())
                              .then(data => {
                                if (data.error) {
                                  throw new Error(data.error);
                                }
                                
                                // Update user profile with new balance
                                setUserProfile(data.user);
                                
                                toast({
                                  title: "Money Added Successfully",
                                  description: data.message,
                                });
                                
                                // Reset form
                                e.currentTarget.reset();
                              })
                              .catch(error => {
                                console.error('Error adding money:', error);
                                toast({
                                  variant: "destructive",
                                  title: "Failed to add money",
                                  description: error.message || "An error occurred while adding money",
                                });
                              })
                              .finally(() => {
                                setIsLoading(false);
                              });
                          }}>
                            <div className="space-y-2">
                              <label htmlFor="amount" className="text-sm font-medium">
                                Amount (₹)
                              </label>
                              <Input
                                id="amount"
                                name="amount"
                                type="number"
                                placeholder="Enter amount"
                                min="100"
                                step="100"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor="upiId" className="text-sm font-medium">
                                UPI ID
                              </label>
                              <Input
                                id="upiId"
                                name="upiId"
                                type="text"
                                placeholder="yourname@upi"
                                required
                              />
                            </div>
                            
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                              <div className="flex justify-center mb-4">
                                <div className="w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="grid grid-cols-3 grid-rows-3 gap-1">
                                      {Array(9).fill(0).map((_, i) => (
                                        <div key={i} className="w-4 h-4 bg-black" />
                                      ))}
                                    </div>
                                    <p className="text-xs mt-2 text-black">Scan QR Code</p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-center text-muted-foreground">
                                Scan this QR code with your UPI app or enter your UPI ID above
                              </p>
                            </div>
                            
                            <div className="pt-4">
                              <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <IndianRupee className="mr-2 h-4 w-4" />
                                    Add Money
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            <div className="mt-4 text-xs text-muted-foreground">
                              <p className="mb-1">Note: This is a paper trading app. No real money will be charged.</p>
                              <p>In a real app, this would redirect to a UPI payment gateway.</p>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="card" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Add Money via Card</CardTitle>
                          <CardDescription>
                            Add funds to your trading account using Credit/Debit Card
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const amount = formData.get('amount') as string;
                            const cardNumber = formData.get('cardNumber') as string;
                            const cardName = formData.get('cardName') as string;
                            const expiryDate = formData.get('expiryDate') as string;
                            const cvv = formData.get('cvv') as string;
                            
                            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                              toast({
                                variant: "destructive",
                                title: "Invalid amount",
                                description: "Please enter a valid amount greater than 0",
                              });
                              return;
                            }
                            
                            // Basic validation for card details
                            if (!cardNumber || cardNumber.length < 16) {
                              toast({
                                variant: "destructive",
                                title: "Invalid card number",
                                description: "Please enter a valid card number",
                              });
                              return;
                            }
                            
                            setIsLoading(true);
                            
                            fetch('/api/user/add-money', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                amount: parseFloat(amount),
                                paymentMethod: 'CARD',
                                paymentDetails: { 
                                  cardNumber: cardNumber.replace(/\s/g, '').slice(-4), // Only store last 4 digits
                                  cardName
                                }
                              }),
                            })
                              .then(response => response.json())
                              .then(data => {
                                if (data.error) {
                                  throw new Error(data.error);
                                }
                                
                                // Update user profile with new balance
                                setUserProfile(data.user);
                                
                                toast({
                                  title: "Money Added Successfully",
                                  description: data.message,
                                });
                                
                                // Reset form
                                e.currentTarget.reset();
                              })
                              .catch(error => {
                                console.error('Error adding money:', error);
                                toast({
                                  variant: "destructive",
                                  title: "Failed to add money",
                                  description: error.message || "An error occurred while adding money",
                                });
                              })
                              .finally(() => {
                                setIsLoading(false);
                              });
                          }}>
                            <div className="space-y-2">
                              <label htmlFor="card-amount" className="text-sm font-medium">
                                Amount (₹)
                              </label>
                              <Input
                                id="card-amount"
                                name="amount"
                                type="number"
                                placeholder="Enter amount"
                                min="100"
                                step="100"
                                required
                              />
                            </div>
                            
                            <div className="p-4 border rounded-lg mt-4 bg-card">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label htmlFor="cardNumber" className="text-sm font-medium">
                                    Card Number
                                  </label>
                                  <Input
                                    id="cardNumber"
                                    name="cardNumber"
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    maxLength={19}
                                    required
                                    onChange={(e) => {
                                      // Format card number with spaces
                                      const value = e.target.value.replace(/\s/g, '');
                                      const formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
                                      e.target.value = formattedValue;
                                    }}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <label htmlFor="cardName" className="text-sm font-medium">
                                    Name on Card
                                  </label>
                                  <Input
                                    id="cardName"
                                    name="cardName"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label htmlFor="expiryDate" className="text-sm font-medium">
                                      Expiry Date
                                    </label>
                                    <Input
                                      id="expiryDate"
                                      name="expiryDate"
                                      type="text"
                                      placeholder="MM/YY"
                                      maxLength={5}
                                      required
                                      onChange={(e) => {
                                        // Format expiry date
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 2) {
                                          e.target.value = value;
                                        } else {
                                          e.target.value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
                                        }
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <label htmlFor="cvv" className="text-sm font-medium">
                                      CVV
                                    </label>
                                    <Input
                                      id="cvv"
                                      name="cvv"
                                      type="password"
                                      placeholder="123"
                                      maxLength={3}
                                      required
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-end mt-4 space-x-2">
                                <div className="w-10 h-6 bg-blue-600 rounded"></div>
                                <div className="w-10 h-6 bg-red-500 rounded-full"></div>
                                <div className="w-10 h-6 bg-yellow-400 rounded"></div>
                              </div>
                            </div>
                            
                            <div className="pt-4">
                              <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <IndianRupee className="mr-2 h-4 w-4" />
                                    Add Money
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            <div className="mt-4 text-xs text-muted-foreground">
                              <p className="mb-1">Note: This is a paper trading app. No real money will be charged.</p>
                              <p>In a real app, this would use a secure payment processor.</p>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
        
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
          <div className="grid grid-cols-4 h-16">
            <Button 
              variant={activeSection === "home" ? "default" : "ghost"} 
              className={`flex flex-col items-center justify-center rounded-none h-full ${activeSection === "home" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "text-foreground hover:bg-green-500/5"}`}
              onClick={() => setActiveSection("home")}
            >
              <Home className={`h-5 w-5 ${activeSection === "home" ? "" : "text-muted-foreground"}`} />
              <span className={`text-xs mt-1 ${activeSection === "home" ? "" : "text-muted-foreground"}`}>Home</span>
            </Button>
            <Button 
              variant={activeSection === "portfolio" ? "default" : "ghost"} 
              className={`flex flex-col items-center justify-center rounded-none h-full ${activeSection === "portfolio" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "text-foreground hover:bg-green-500/5"}`}
              onClick={() => setActiveSection("portfolio")}
            >
              <Briefcase className={`h-5 w-5 ${activeSection === "portfolio" ? "" : "text-muted-foreground"}`} />
              <span className={`text-xs mt-1 ${activeSection === "portfolio" ? "" : "text-muted-foreground"}`}>Portfolio</span>
            </Button>
            <Button 
              variant={activeSection === "transactions" ? "default" : "ghost"} 
              className={`flex flex-col items-center justify-center rounded-none h-full ${activeSection === "transactions" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "text-foreground hover:bg-green-500/5"}`}
              onClick={() => setActiveSection("transactions")}
            >
              <Clock className={`h-5 w-5 ${activeSection === "transactions" ? "" : "text-muted-foreground"}`} />
              <span className={`text-xs mt-1 ${activeSection === "transactions" ? "" : "text-muted-foreground"}`}>History</span>
            </Button>
            <Button 
              variant={activeSection === "profile" ? "default" : "ghost"} 
              className={`flex flex-col items-center justify-center rounded-none h-full ${activeSection === "profile" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "text-foreground hover:bg-green-500/5"}`}
              onClick={() => setActiveSection("profile")}
            >
              <User className={`h-5 w-5 ${activeSection === "profile" ? "" : "text-muted-foreground"}`} />
              <span className={`text-xs mt-1 ${activeSection === "profile" ? "" : "text-muted-foreground"}`}>Profile</span>
            </Button>
          </div>
        </nav>
        
        {/* Trade Dialog */}
        <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tradeType === 'BUY' ? 'Buy' : 'Sell'} {selectedStock?.symbol}
              </DialogTitle>
              <DialogDescription>
                {selectedStock?.name} - ₹{selectedStock?.currentPrice.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Available Balance:</p>
                <p className="text-sm font-bold flex items-center">
                  <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                  {userProfile?.balance?.toFixed(2) || "0.00"}
                </p>
              </div>
              
              {tradeType === 'SELL' && (
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Shares Owned:</p>
                  <p className="text-sm font-bold">
                    {portfolioItems.find(item => item.stockId === selectedStock?.id)?.quantity || 0}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}
                    disabled={tradeQuantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(parseInt(e.target.value) || 1)}
                    className="mx-2 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTradeQuantity(tradeQuantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm font-medium">Total Value:</p>
                <p className="text-lg font-bold flex items-center">
                  <IndianRupee className="w-4 h-4 mr-0.5" />
                  {calculateTradeValue().toFixed(2)}
                </p>
              </div>
              
              {tradeType === 'BUY' && calculateTradeValue() > (userProfile?.balance || 0) && (
                <div className="text-red-500 text-sm">
                  Insufficient balance for this transaction
                </div>
              )}
              
              {tradeType === 'SELL' && 
                tradeQuantity > (portfolioItems.find(item => item.stockId === selectedStock?.id)?.quantity || 0) && (
                <div className="text-red-500 text-sm">
                  You don't own enough shares for this transaction
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeTrade}
                disabled={
                  (tradeType === 'BUY' && calculateTradeValue() > (userProfile?.balance || 0)) ||
                  (tradeType === 'SELL' && tradeQuantity > (portfolioItems.find(item => item.stockId === selectedStock?.id)?.quantity || 0))
                }
              >
                Confirm {tradeType === 'BUY' ? 'Purchase' : 'Sale'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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