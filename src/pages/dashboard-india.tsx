import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  Info
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
      fetchStocks();
      fetchWatchlist();
      fetchPortfolio();
      fetchTransactions();
      fetchUserProfile();
    }
  }, [user]);

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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
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
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={() => toggleWatchlist(stock.id)}
                                    >
                                      {watchlistStockIds.includes(stock.id) ? (
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                      ) : (
                                        <Star className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
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
                                    variant="outline" 
                                    size="sm"
                                    className="w-[48%]"
                                    onClick={() => openTradeDialog(stock, 'BUY')}
                                  >
                                    <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="w-[48%]"
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
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => toggleWatchlist(item.stockId)}
                                      >
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                      </Button>
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
                                      variant="outline" 
                                      size="sm"
                                      className="w-[48%]"
                                      onClick={() => openTradeDialog(item.stock, 'BUY')}
                                    >
                                      <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="w-[48%]"
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
                                    variant="outline" 
                                    size="sm"
                                    className="w-[48%]"
                                    onClick={() => openTradeDialog(item.stock, 'BUY')}
                                  >
                                    <ShoppingCart className="w-3 h-3 mr-1" /> Buy More
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="w-[48%]"
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
            </>
          )}
        </main>
        
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
          <div className="grid grid-cols-4 h-16">
            <Button 
              variant={activeSection === "home" ? "default" : "ghost"} 
              className="flex flex-col items-center justify-center rounded-none h-full"
              onClick={() => setActiveSection("home")}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Button>
            <Button 
              variant={activeSection === "portfolio" ? "default" : "ghost"} 
              className="flex flex-col items-center justify-center rounded-none h-full"
              onClick={() => setActiveSection("portfolio")}
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-xs mt-1">Portfolio</span>
            </Button>
            <Button 
              variant={activeSection === "transactions" ? "default" : "ghost"} 
              className="flex flex-col items-center justify-center rounded-none h-full"
              onClick={() => setActiveSection("transactions")}
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs mt-1">History</span>
            </Button>
            <Button 
              variant={activeSection === "profile" ? "default" : "ghost"} 
              className="flex flex-col items-center justify-center rounded-none h-full"
              onClick={() => setActiveSection("profile")}
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
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