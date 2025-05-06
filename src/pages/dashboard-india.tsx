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
  const [isFuturesTradeDialogOpen, setIsFuturesTradeDialogOpen] = useState(false);
  const [showMarketInfo, setShowMarketInfo] = useState(false);
  const [futuresQuantity, setFuturesQuantity] = useState(1);
  const [futuresTradeType, setFuturesTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedFuturesStock, setSelectedFuturesStock] = useState<Stock | null>(null);
  const [futuresContracts, setFuturesContracts] = useState<any[]>([]);
  const [selectedFuturesContract, setSelectedFuturesContract] = useState<any>(null);
  const [isOptionsTradeDialogOpen, setIsOptionsTradeDialogOpen] = useState(false);
  const [optionsQuantity, setOptionsQuantity] = useState(1);
  const [optionsTradeType, setOptionsTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedOptionsStock, setSelectedOptionsStock] = useState<Stock | null>(null);
  const [optionsContracts, setOptionsContracts] = useState<any[]>([]);
  const [selectedOptionsContract, setSelectedOptionsContract] = useState<any>(null);
  const [optionsType, setOptionsType] = useState<'CALL' | 'PUT'>('CALL');

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

  // Open futures trade dialog
  const openFuturesTradeDialog = async (stock: Stock, type: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedFuturesStock(stock);
    setFuturesTradeType(type);
    setFuturesQuantity(1);
    
    try {
      setIsLoading(true);
      
      // Fetch futures contracts for this stock
      const response = await fetch(`/api/fno/futures?stockId=${stock.id}`);
      if (!response.ok) throw new Error('Failed to fetch futures contracts');
      
      const data = await response.json();
      setFuturesContracts(data.futuresContracts);
      
      if (data.futuresContracts.length > 0) {
        setSelectedFuturesContract(data.futuresContracts[0]);
      }
      
      setIsFuturesTradeDialogOpen(true);
    } catch (error) {
      console.error('Error fetching futures contracts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch futures contracts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open options trade dialog
  const openOptionsTradeDialog = async (stock: Stock, type: 'BUY' | 'SELL' = 'BUY', optType: 'CALL' | 'PUT' = 'CALL') => {
    setSelectedOptionsStock(stock);
    setOptionsTradeType(type);
    setOptionsQuantity(1);
    setOptionsType(optType);
    
    try {
      setIsLoading(true);
      
      // Fetch options contracts for this stock and type (CALL or PUT)
      const response = await fetch(`/api/fno/options?stockId=${stock.id}&type=${optType}`);
      if (!response.ok) throw new Error('Failed to fetch options contracts');
      
      const data = await response.json();
      setOptionsContracts(data.optionsContracts);
      
      if (data.optionsContracts.length > 0) {
        setSelectedOptionsContract(data.optionsContracts[0]);
      }
      
      setIsOptionsTradeDialogOpen(true);
    } catch (error) {
      console.error('Error fetching options contracts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch options contracts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute futures trade
  const executeFuturesTrade = async () => {
    if (!selectedFuturesContract) return;
    
    try {
      const response = await fetch('/api/fno/futures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          futuresContractId: selectedFuturesContract.id,
          quantity: futuresQuantity,
          type: futuresTradeType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute futures trade');
      }
      
      const data = await response.json();
      
      // Refresh user profile to get updated balance
      fetchUserProfile();
      
      setIsFuturesTradeDialogOpen(false);
      
      toast({
        title: `Futures ${futuresTradeType === 'BUY' ? 'Purchase' : 'Sale'} Successful`,
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error executing futures trade:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute futures trade",
      });
    }
  };

  // Calculate futures trade value
  const calculateFuturesTradeValue = () => {
    if (!selectedFuturesContract) return 0;
    return selectedFuturesContract.contractPrice * selectedFuturesContract.lotSize * futuresQuantity;
  };

  // Calculate margin required for futures trade
  const calculateMarginRequired = () => {
    if (!selectedFuturesContract) return 0;
    return selectedFuturesContract.marginRequired * futuresQuantity;
  };

  // Execute options trade
  const executeOptionsTrade = async () => {
    if (!selectedOptionsContract) return;
    
    try {
      const response = await fetch('/api/fno/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionsContractId: selectedOptionsContract.id,
          quantity: optionsQuantity,
          type: optionsTradeType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute options trade');
      }
      
      const data = await response.json();
      
      // Refresh user profile to get updated balance
      fetchUserProfile();
      
      setIsOptionsTradeDialogOpen(false);
      
      toast({
        title: `Options ${optionsTradeType === 'BUY' ? 'Purchase' : 'Sale'} Successful`,
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error executing options trade:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute options trade",
      });
    }
  };

  // Calculate options trade value
  const calculateOptionsTradeValue = () => {
    if (!selectedOptionsContract) return 0;
    return selectedOptionsContract.premiumPrice * selectedOptionsContract.lotSize * optionsQuantity;
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
                                        onClick={() => openFuturesTradeDialog(stock, 'BUY')}
                                      >
                                        <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                      </Button>
                                      <Button 
                                        size="sm"
                                        className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                        onClick={() => openFuturesTradeDialog(stock, 'SELL')}
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
                                            onClick={() => openOptionsTradeDialog(stock, 'BUY', 'CALL')}
                                          >
                                            <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                          </Button>
                                          <Button 
                                            size="sm"
                                            className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                            onClick={() => openOptionsTradeDialog(stock, 'SELL', 'CALL')}
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
                                            onClick={() => openOptionsTradeDialog(stock, 'BUY', 'PUT')}
                                          >
                                            <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                          </Button>
                                          <Button 
                                            size="sm"
                                            className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                                            onClick={() => openOptionsTradeDialog(stock, 'SELL', 'PUT')}
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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Create CSV content
                      if (portfolioItems.length === 0) {
                        toast({
                          title: "No data to export",
                          description: "Your portfolio is empty",
                        });
                        return;
                      }
                      
                      const headers = ["Symbol", "Name", "Quantity", "Avg Buy Price", "Current Price", "Current Value", "P&L", "P&L %"];
                      const rows = portfolioItems.map(item => {
                        const currentValue = item.quantity * item.stock.currentPrice;
                        const costBasis = item.quantity * item.avgBuyPrice;
                        const profit = currentValue - costBasis;
                        const profitPercent = (profit / costBasis) * 100;
                        
                        return [
                          item.stock.symbol,
                          item.stock.name,
                          item.quantity,
                          item.avgBuyPrice.toFixed(2),
                          item.stock.currentPrice.toFixed(2),
                          currentValue.toFixed(2),
                          profit.toFixed(2),
                          profitPercent.toFixed(2) + "%"
                        ];
                      });
                      
                      const csvContent = [
                        headers.join(","),
                        ...rows.map(row => row.join(","))
                      ].join("\n");
                      
                      // Create download link
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', `portfolio_${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast({
                        title: "Portfolio exported",
                        description: "Your portfolio data has been exported to CSV",
                      });
                    }}
                    className="flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export
                  </Button>
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
              </div>

              {/* Portfolio Summary */}
              <Card className="mb-6 bg-gradient-to-r from-orange-500/10 to-green-500/10">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                  
                  {/* Portfolio Performance */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-card p-2 rounded-md">
                      <p className="text-xs text-muted-foreground">Today's P&L</p>
                      <p className={`text-sm font-bold ${Math.random() > 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.random() > 0.5 ? '+' : '-'}₹{(Math.random() * 500).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-card p-2 rounded-md">
                      <p className="text-xs text-muted-foreground">Overall P&L</p>
                      <p className={`text-sm font-bold ${portfolioItems.reduce((total, item) => {
                        const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                        return total + profit;
                      }, 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {portfolioItems.reduce((total, item) => {
                          const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                          return total + profit;
                        }, 0) >= 0 ? '+' : ''}
                        ₹{portfolioItems.reduce((total, item) => {
                          const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                          return total + profit;
                        }, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-card p-2 rounded-md">
                      <p className="text-xs text-muted-foreground">Return %</p>
                      <p className={`text-sm font-bold ${portfolioItems.reduce((total, item) => {
                        const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                        return total + profit;
                      }, 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {portfolioItems.reduce((total, item) => {
                          const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                          const costBasis = item.avgBuyPrice * item.quantity;
                          return total + (profit / (costBasis || 1)) * 100;
                        }, 0).toFixed(2)}%
                      </p>
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

              {/* Portfolio Allocation */}
              {portfolioItems.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sector Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Group portfolio items by sector and calculate allocation */}
                      {Object.entries(
                        portfolioItems.reduce((sectors, item) => {
                          const sector = item.stock.sector || 'Other';
                          const value = item.quantity * item.stock.currentPrice;
                          sectors[sector] = (sectors[sector] || 0) + value;
                          return sectors;
                        }, {} as Record<string, number>)
                      ).map(([sector, value]) => {
                        const percentage = (value / portfolioValue) * 100;
                        return (
                          <div key={sector}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{sector}</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Portfolio Holdings */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Holdings</h3>
                {portfolioItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select 
                      className="text-xs p-1 border rounded"
                      onChange={(e) => {
                        const sortedItems = [...portfolioItems];
                        switch(e.target.value) {
                          case 'value-high':
                            sortedItems.sort((a, b) => 
                              (b.quantity * b.stock.currentPrice) - (a.quantity * a.stock.currentPrice)
                            );
                            break;
                          case 'value-low':
                            sortedItems.sort((a, b) => 
                              (a.quantity * a.stock.currentPrice) - (b.quantity * b.stock.currentPrice)
                            );
                            break;
                          case 'profit-high':
                            sortedItems.sort((a, b) => {
                              const profitA = (a.stock.currentPrice - a.avgBuyPrice) * a.quantity;
                              const profitB = (b.stock.currentPrice - b.avgBuyPrice) * b.quantity;
                              return profitB - profitA;
                            });
                            break;
                          case 'profit-low':
                            sortedItems.sort((a, b) => {
                              const profitA = (a.stock.currentPrice - a.avgBuyPrice) * a.quantity;
                              const profitB = (b.stock.currentPrice - b.avgBuyPrice) * b.quantity;
                              return profitA - profitB;
                            });
                            break;
                          case 'alpha':
                            sortedItems.sort((a, b) => 
                              a.stock.symbol.localeCompare(b.stock.symbol)
                            );
                            break;
                        }
                        setPortfolioItems(sortedItems);
                      }}
                    >
                      <option value="">Sort by</option>
                      <option value="value-high">Value (High to Low)</option>
                      <option value="value-low">Value (Low to High)</option>
                      <option value="profit-high">Profit (High to Low)</option>
                      <option value="profit-low">Profit (Low to High)</option>
                      <option value="alpha">Alphabetical</option>
                    </select>
                  </div>
                )}
              </div>
              
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
                                    <Badge variant="secondary" className="text-xs">
                                      {item.stock.sector || 'Other'}
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
                                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                  <div>Avg. Buy: ₹{item.avgBuyPrice.toFixed(2)}</div>
                                  <div>Current: ₹{item.stock.currentPrice.toFixed(2)}</div>
                                  <div>Day Change: {item.stock.changePercent.toFixed(2)}%</div>
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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      // Create CSV content
                      if (transactions.length === 0) {
                        toast({
                          title: "No data to export",
                          description: "You have no transactions to export",
                        });
                        return;
                      }
                      
                      const headers = ["Date", "Type", "Symbol", "Name", "Quantity", "Price", "Total"];
                      const rows = transactions.map(transaction => {
                        return [
                          new Date(transaction.timestamp).toLocaleString(),
                          transaction.type,
                          transaction.stock.symbol,
                          transaction.stock.name,
                          transaction.quantity,
                          transaction.price.toFixed(2),
                          transaction.total.toFixed(2)
                        ];
                      });
                      
                      const csvContent = [
                        headers.join(","),
                        ...rows.map(row => row.join(","))
                      ].join("\n");
                      
                      // Create download link
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.setAttribute('href', url);
                      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast({
                        title: "Transactions exported",
                        description: "Your transaction history has been exported to CSV",
                      });
                    }}
                    className="flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Transaction Statistics */}
              {transactions.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Transaction Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-card p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Total Transactions</p>
                        <p className="text-lg font-bold">{transactions.length}</p>
                      </div>
                      <div className="bg-card p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Buy Orders</p>
                        <p className="text-lg font-bold text-green-500">
                          {transactions.filter(t => t.type === 'BUY').length}
                        </p>
                      </div>
                      <div className="bg-card p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Sell Orders</p>
                        <p className="text-lg font-bold text-red-500">
                          {transactions.filter(t => t.type === 'SELL').length}
                        </p>
                      </div>
                      <div className="bg-card p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Total Value</p>
                        <p className="text-lg font-bold flex items-center">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                          {transactions.reduce((sum, t) => sum + t.total, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Tax Report Summary */}
                    <div className="mt-4 p-3 bg-muted/30 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Tax Report Summary</h4>
                        <Badge variant="outline" className="text-xs">FY 2024-25</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Realized Profit/Loss</p>
                          <p className={`font-medium ${
                            transactions.filter(t => t.type === 'SELL').reduce((sum, t) => {
                              // Find buy transaction for this stock to calculate profit/loss
                              const buyPrice = transactions.find(bt => 
                                bt.type === 'BUY' && bt.stockId === t.stockId
                              )?.price || 0;
                              return sum + ((t.price - buyPrice) * t.quantity);
                            }, 0) > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {transactions.filter(t => t.type === 'SELL').reduce((sum, t) => {
                              // Find buy transaction for this stock to calculate profit/loss
                              const buyPrice = transactions.find(bt => 
                                bt.type === 'BUY' && bt.stockId === t.stockId
                              )?.price || 0;
                              return sum + ((t.price - buyPrice) * t.quantity);
                            }, 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Estimated Tax (15%)</p>
                          <p className="font-medium">
                            {Math.max(0, transactions.filter(t => t.type === 'SELL').reduce((sum, t) => {
                              // Find buy transaction for this stock to calculate profit/loss
                              const buyPrice = transactions.find(bt => 
                                bt.type === 'BUY' && bt.stockId === t.stockId
                              )?.price || 0;
                              const profit = (t.price - buyPrice) * t.quantity;
                              return sum + (profit > 0 ? profit * 0.15 : 0);
                            }, 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Filters */}
              {transactions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <select 
                    className="text-xs p-1 border rounded"
                    onChange={(e) => {
                      const value = e.target.value;
                      // This would filter transactions in a real implementation
                      // For now, we'll just show a toast
                      if (value) {
                        toast({
                          title: "Filter applied",
                          description: `Filtered by ${value}`,
                        });
                      }
                    }}
                  >
                    <option value="">Filter by Type</option>
                    <option value="BUY">Buy Orders</option>
                    <option value="SELL">Sell Orders</option>
                  </select>
                  
                  <select 
                    className="text-xs p-1 border rounded"
                    onChange={(e) => {
                      const value = e.target.value;
                      // This would filter transactions in a real implementation
                      if (value) {
                        toast({
                          title: "Filter applied",
                          description: `Filtered by ${value}`,
                        });
                      }
                    }}
                  >
                    <option value="">Filter by Date</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                  
                  <Input
                    type="text"
                    placeholder="Search by symbol..."
                    className="text-xs p-1 h-7 w-32"
                    onChange={(e) => {
                      const value = e.target.value;
                      // This would filter transactions in a real implementation
                      if (value.length > 2) {
                        toast({
                          title: "Search applied",
                          description: `Searching for "${value}"`,
                        });
                      }
                    }}
                  />
                </div>
              )}
              
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden hover:border-blue-500/30 transition-colors">
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
                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                              <div>Price: ₹{transaction.price.toFixed(2)}</div>
                              <div>Total: ₹{transaction.total.toFixed(2)}</div>
                              <div>Order Type: Market</div>
                            </div>
                            
                            {/* Current value comparison (for BUY orders) */}
                            {transaction.type === 'BUY' && (
                              <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-center">
                                <span className="text-xs">Current Value:</span>
                                <div className="flex items-center">
                                  <span className="text-xs font-medium mr-2">
                                    ₹{(transaction.stock.currentPrice * transaction.quantity).toFixed(2)}
                                  </span>
                                  <Badge 
                                    variant={transaction.stock.currentPrice > transaction.price ? "success" : "destructive"} 
                                    className="text-[10px] h-4"
                                  >
                                    {transaction.stock.currentPrice > transaction.price ? '+' : ''}
                                    {(((transaction.stock.currentPrice - transaction.price) / transaction.price) * 100).toFixed(2)}%
                                  </Badge>
                                </div>
                              </div>
                            )}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    toast({
                      title: "Profile updated",
                      description: "Your profile information has been saved",
                    });
                  }}
                  className="flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  Save
                </Button>
              </div>
              
              <Tabs defaultValue="profile" className="mb-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="add-money">Add Money</TabsTrigger>
                  <TabsTrigger value="risk-profile">Risk Profile</TabsTrigger>
                  <TabsTrigger value="kyc">KYC</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-4">
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 relative group">
                          {userProfile?.avatarUrl ? (
                            <img 
                              src={userProfile.avatarUrl} 
                              alt="Profile" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-10 h-10 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                          </div>
                        </div>
                        <div className="space-y-2 w-full max-w-xs">
                          <div className="space-y-1">
                            <label htmlFor="name" className="text-sm font-medium">Name</label>
                            <Input 
                              id="name" 
                              defaultValue={userProfile?.name || ""} 
                              placeholder="Enter your name"
                            />
                          </div>
                          <div className="space-y-1">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <Input 
                              id="email" 
                              value={userProfile?.email || ""} 
                              disabled
                              className="bg-muted/50"
                            />
                          </div>
                        </div>
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
                      
                      {/* Account Activity */}
                      <div className="mt-6 pt-6 border-t border-border">
                        <h4 className="text-sm font-medium mb-3">Recent Account Activity</h4>
                        <div className="space-y-2">
                          {[
                            { action: "Login", time: "Today, 09:45 AM", device: "Chrome on Windows" },
                            { action: "Added ₹5,000", time: "Yesterday, 02:30 PM", device: "Mobile App" },
                            { action: "Password Changed", time: "May 2, 2024", device: "Chrome on Windows" },
                          ].map((activity, index) => (
                            <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/30">
                              <div>
                                <p className="font-medium">{activity.action}</p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                              </div>
                              <div className="text-xs text-muted-foreground">{activity.device}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Change password email sent",
                          description: "Check your email for instructions to change your password",
                        });
                      }}
                    >
                      Change Password
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={signOut}
                    >
                      Sign Out
                    </Button>
                  </div>
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
                
                <TabsContent value="risk-profile" className="mt-4">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Risk Management Profile</CardTitle>
                      <CardDescription>
                        Configure your risk parameters for safer trading
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label htmlFor="max-position" className="text-sm font-medium">Maximum Position Size (% of Portfolio)</label>
                            <span className="text-sm text-muted-foreground">10%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">1%</span>
                            <input 
                              type="range" 
                              id="max-position" 
                              min="1" 
                              max="25" 
                              defaultValue="10"
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs">25%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Limits the size of any single position to reduce concentration risk</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label htmlFor="max-drawdown" className="text-sm font-medium">Maximum Drawdown Tolerance</label>
                            <span className="text-sm text-muted-foreground">15%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">5%</span>
                            <input 
                              type="range" 
                              id="max-drawdown" 
                              min="5" 
                              max="30" 
                              defaultValue="15"
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs">30%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Maximum portfolio decline you're comfortable with</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <label htmlFor="risk-per-trade" className="text-sm font-medium">Risk Per Trade (% of Capital)</label>
                            <span className="text-sm text-muted-foreground">2%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">0.5%</span>
                            <input 
                              type="range" 
                              id="risk-per-trade" 
                              min="0.5" 
                              max="5" 
                              step="0.5"
                              defaultValue="2"
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs">5%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Maximum amount to risk on any single trade</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="stop-loss" className="text-sm font-medium">Default Stop Loss (%)</label>
                            <Input 
                              id="stop-loss" 
                              type="number" 
                              defaultValue="5" 
                              min="1" 
                              max="15"
                              step="0.5"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="take-profit" className="text-sm font-medium">Default Take Profit (%)</label>
                            <Input 
                              id="take-profit" 
                              type="number" 
                              defaultValue="10" 
                              min="1" 
                              max="30"
                              step="0.5"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Risk Alerts</label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="alert-position" defaultChecked className="rounded" />
                              <label htmlFor="alert-position" className="text-sm">Alert when position exceeds maximum size</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="alert-drawdown" defaultChecked className="rounded" />
                              <label htmlFor="alert-drawdown" className="text-sm">Alert when portfolio drawdown exceeds limit</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="alert-volatility" defaultChecked className="rounded" />
                              <label htmlFor="alert-volatility" className="text-sm">Alert for high volatility stocks</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Risk profile updated",
                            description: "Your risk management settings have been saved",
                          });
                        }}
                      >
                        Save Risk Profile
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="kyc" className="mt-4">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>KYC Verification</CardTitle>
                      <CardDescription>
                        Complete your KYC to unlock all trading features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                        <div className="flex items-start gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-500">KYC Status: Pending</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Complete your KYC verification to unlock all trading features. This is a simulated process for demo purposes.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label htmlFor="full-name" className="text-sm font-medium">Full Name (as per ID)</label>
                          <Input 
                            id="full-name" 
                            placeholder="Enter your full name"
                            defaultValue={userProfile?.name || ""}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="dob" className="text-sm font-medium">Date of Birth</label>
                            <Input 
                              id="dob" 
                              type="date" 
                              placeholder="DD/MM/YYYY"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="pan" className="text-sm font-medium">PAN Number</label>
                            <Input 
                              id="pan" 
                              placeholder="ABCDE1234F"
                              maxLength={10}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="address" className="text-sm font-medium">Address</label>
                          <Input 
                            id="address" 
                            placeholder="Enter your address"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="city" className="text-sm font-medium">City</label>
                            <Input 
                              id="city" 
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="pincode" className="text-sm font-medium">PIN Code</label>
                            <Input 
                              id="pincode" 
                              placeholder="PIN Code"
                              maxLength={6}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Document Type</label>
                          <select className="w-full p-2 border rounded-md">
                            <option value="aadhar">Aadhar Card</option>
                            <option value="pan">PAN Card</option>
                            <option value="passport">Passport</option>
                            <option value="driving">Driving License</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Upload Front Side</label>
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <p className="text-xs text-muted-foreground">Click to upload or drag and drop</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Upload Back Side</label>
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <p className="text-xs text-muted-foreground">Click to upload or drag and drop</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Upload Selfie</label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <p className="text-xs text-muted-foreground">Click to upload or drag and drop</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "KYC submitted successfully",
                            description: "Your KYC details have been submitted for verification",
                          });
                        }}
                      >
                        Submit KYC Details
                      </Button>
                    </CardFooter>
                  </Card>
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

        {/* Futures Trade Dialog */}
        <Dialog open={isFuturesTradeDialogOpen} onOpenChange={setIsFuturesTradeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {futuresTradeType === 'BUY' ? 'Buy' : 'Sell'} {selectedFuturesStock?.symbol} Futures
              </DialogTitle>
              <DialogDescription>
                {selectedFuturesStock?.name} Futures Contract
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
              
              {futuresContracts.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Contract</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedFuturesContract?.id || ""}
                      onChange={(e) => {
                        const contract = futuresContracts.find(c => c.id === e.target.value);
                        if (contract) setSelectedFuturesContract(contract);
                      }}
                    >
                      {futuresContracts.map(contract => (
                        <option key={contract.id} value={contract.id}>
                          {selectedFuturesStock?.symbol} - Expiry: {new Date(contract.expiryDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedFuturesContract && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Contract Price</p>
                          <p className="font-semibold flex items-center">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {selectedFuturesContract.contractPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Lot Size</p>
                          <p className="font-semibold">{selectedFuturesContract.lotSize} shares</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity (Lots)</label>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFuturesQuantity(Math.max(1, futuresQuantity - 1))}
                            disabled={futuresQuantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={futuresQuantity}
                            onChange={(e) => setFuturesQuantity(parseInt(e.target.value) || 1)}
                            className="mx-2 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFuturesQuantity(futuresQuantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Contract Value</p>
                          <p className="font-semibold flex items-center">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {calculateFuturesTradeValue().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md">
                          <p className="text-xs text-muted-foreground">Margin Required</p>
                          <p className="font-semibold flex items-center">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {calculateMarginRequired().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                      
                      {calculateMarginRequired() > (userProfile?.balance || 0) && (
                        <div className="text-red-500 text-sm">
                          Insufficient balance for margin requirement
                        </div>
                      )}
                    </>
                  )}
                  
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsFuturesTradeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={executeFuturesTrade}
                      disabled={
                        !selectedFuturesContract || 
                        calculateMarginRequired() > (userProfile?.balance || 0)
                      }
                      className={futuresTradeType === 'BUY' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                    >
                      {futuresTradeType === 'BUY' ? 'Buy' : 'Sell'} Futures
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No futures contracts available for this stock.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsFuturesTradeDialogOpen(false)}
                    className="mx-auto"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Options Trade Dialog */}
        <Dialog open={isOptionsTradeDialogOpen} onOpenChange={setIsOptionsTradeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {optionsTradeType === 'BUY' ? 'Buy' : 'Sell'} {selectedOptionsStock?.symbol} {optionsType} Option
              </DialogTitle>
              <DialogDescription>
                {selectedOptionsStock?.name} {optionsType === 'CALL' ? 'Call' : 'Put'} Option
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
              
              {optionsContracts.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Contract</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedOptionsContract?.id || ""}
                      onChange={(e) => {
                        const contract = optionsContracts.find(c => c.id === e.target.value);
                        if (contract) setSelectedOptionsContract(contract);
                      }}
                    >
                      {optionsContracts.map(contract => (
                        <option key={contract.id} value={contract.id}>
                          {selectedOptionsStock?.symbol} {contract.strikePrice} {optionsType === 'CALL' ? 'CE' : 'PE'} - Exp: {new Date(contract.expiryDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedOptionsContract && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`${optionsType === 'CALL' ? 'bg-purple-50 dark:bg-purple-950/30' : 'bg-orange-50 dark:bg-orange-950/30'} p-2 rounded-md`}>
                          <p className="text-xs text-muted-foreground">Strike Price</p>
                          <p className="font-semibold flex items-center">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {selectedOptionsContract.strikePrice.toFixed(2)}
                          </p>
                        </div>
                        <div className={`${optionsType === 'CALL' ? 'bg-purple-50 dark:bg-purple-950/30' : 'bg-orange-50 dark:bg-orange-950/30'} p-2 rounded-md`}>
                          <p className="text-xs text-muted-foreground">Premium</p>
                          <p className="font-semibold flex items-center">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {selectedOptionsContract.premiumPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`${optionsType === 'CALL' ? 'bg-purple-50 dark:bg-purple-950/30' : 'bg-orange-50 dark:bg-orange-950/30'} p-2 rounded-md`}>
                          <p className="text-xs text-muted-foreground">Lot Size</p>
                          <p className="font-semibold">{selectedOptionsContract.lotSize} shares</p>
                        </div>
                        <div className={`${optionsType === 'CALL' ? 'bg-purple-50 dark:bg-purple-950/30' : 'bg-orange-50 dark:bg-orange-950/30'} p-2 rounded-md`}>
                          <p className="text-xs text-muted-foreground">Expiry</p>
                          <p className="font-semibold">{new Date(selectedOptionsContract.expiryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity (Lots)</label>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOptionsQuantity(Math.max(1, optionsQuantity - 1))}
                            disabled={optionsQuantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={optionsQuantity}
                            onChange={(e) => setOptionsQuantity(parseInt(e.target.value) || 1)}
                            className="mx-2 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOptionsQuantity(optionsQuantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-sm font-medium">Total Premium:</p>
                        <p className="text-lg font-bold flex items-center">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {calculateOptionsTradeValue().toFixed(2)}
                        </p>
                      </div>
                      
                      {optionsTradeType === 'BUY' && calculateOptionsTradeValue() > (userProfile?.balance || 0) && (
                        <div className="text-red-500 text-sm">
                          Insufficient balance for this transaction
                        </div>
                      )}
                    </>
                  )}
                  
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsOptionsTradeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={executeOptionsTrade}
                      disabled={
                        !selectedOptionsContract || 
                        (optionsTradeType === 'BUY' && calculateOptionsTradeValue() > (userProfile?.balance || 0))
                      }
                      className={optionsTradeType === 'BUY' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                    >
                      {optionsTradeType === 'BUY' ? 'Buy' : 'Sell'} {optionsType} Option
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No options contracts available for this stock.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsOptionsTradeDialogOpen(false)}
                    className="mx-auto"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add custom animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </>
  );
}