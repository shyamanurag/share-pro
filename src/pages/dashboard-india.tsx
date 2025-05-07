import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTrade } from "@/contexts/TradeContext";
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
import StockSymbolWrapper from "@/components/StockSymbolWrapper";
import WatchlistStockCard from "@/components/WatchlistStockCard";
import StockCard from "@/components/StockCard";
import PortfolioItemCard from "@/components/PortfolioItemCard";
import TransactionCard from "@/components/TransactionCard";
import QuickTradeModal from "@/components/QuickTradeModal";
import ShareModal from "@/components/ShareModal";
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
  Zap,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Camera,
  Upload,
  X,
  Check,
  CreditCard,
  Smartphone
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
  const { openQuickTradeModal, isShareModalOpen, closeShareModal, selectedStock } = useTrade();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [allWatchlists, setAllWatchlists] = useState<any[]>([]);
  const [activeWatchlist, setActiveWatchlist] = useState<any>(null);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('');
  const [watchlistCounts, setWatchlistCounts] = useState<Record<string, number>>({});
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [activeTab, setActiveTab] = useState("market");
  const [activeSection, setActiveSection] = useState("home");
  const [isLoading, setIsLoading] = useState(false);
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
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
  
  // New state for profile photo upload
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  
  // New state for KYC document uploads
  const [documentFrontFile, setDocumentFrontFile] = useState<File | null>(null);
  const [documentFrontPreview, setDocumentFrontPreview] = useState<string | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [documentBackPreview, setDocumentBackPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

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
      setAllWatchlists(data.allWatchlists || []);
      setActiveWatchlist(data.watchlist);
      setActiveWatchlistId(data.watchlist?.id || '');
      
      // Calculate counts for each watchlist
      const counts: Record<string, number> = {};
      if (data.allWatchlists) {
        // Initialize all watchlists with 0 count
        data.allWatchlists.forEach((wl: any) => {
          counts[wl.id] = 0;
        });
        
        // Count items for the current watchlist
        if (data.items) {
          const currentWatchlistId = data.watchlist?.id;
          counts[currentWatchlistId] = data.items.length;
        }
      }
      setWatchlistCounts(counts);
      
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

  // Handle profile photo change
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle document front upload
  const handleDocumentFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFrontFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle document back upload
  const handleDocumentBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentBackFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle selfie upload
  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter stocks based on search query
  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get watchlist stock IDs
  const watchlistStockIds = watchlistItems.map(item => item.stockId);

  // Toggle watchlist
  const toggleWatchlist = async (stockId: string, watchlistId?: string) => {
    try {
      const targetWatchlistId = watchlistId || activeWatchlistId;
      
      if (watchlistStockIds.includes(stockId)) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist/${stockId}?watchlistId=${targetWatchlistId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to remove from watchlist');
        
        setWatchlistItems(watchlistItems.filter(item => item.stockId !== stockId));
        
        // Update counts
        if (targetWatchlistId && watchlistCounts[targetWatchlistId]) {
          setWatchlistCounts({
            ...watchlistCounts,
            [targetWatchlistId]: Math.max(0, watchlistCounts[targetWatchlistId] - 1)
          });
        }
        
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
          body: JSON.stringify({ 
            stockId,
            watchlistId: targetWatchlistId
          }),
        });
        
        if (!response.ok) throw new Error('Failed to add to watchlist');
        
        const data = await response.json();
        setWatchlistItems([...watchlistItems, data.watchlistItem]);
        
        // Update counts
        if (targetWatchlistId) {
          setWatchlistCounts({
            ...watchlistCounts,
            [targetWatchlistId]: (watchlistCounts[targetWatchlistId] || 0) + 1
          });
        }
        
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
    // Use the QuickTradeModal instead of the old trade dialog
    openQuickTradeModal(stock, type);
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
          {activeSection === "watchlist" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">Watchlists</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        New Watchlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Watchlist</DialogTitle>
                        <DialogDescription>
                          Enter a name for your new watchlist
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get('watchlistName') as string;
                        
                        if (!name.trim()) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Watchlist name cannot be empty",
                          });
                          return;
                        }
                        
                        try {
                          const response = await fetch('/api/watchlists', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ name }),
                          });
                          
                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || 'Failed to create watchlist');
                          }
                          
                          const data = await response.json();
                          
                          // Fetch all watchlists to update the dropdown
                          fetchWatchlist();
                          
                          toast({
                            title: "Watchlist Created",
                            description: `"${name}" watchlist has been created`,
                          });
                          
                          // Close the dialog
                          document.getElementById('closeWatchlistDialog')?.click();
                        } catch (error: any) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: error.message || "Failed to create watchlist",
                          });
                        }
                      }}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="watchlistName" className="text-right text-sm font-medium col-span-1">
                              Name
                            </label>
                            <Input
                              id="watchlistName"
                              name="watchlistName"
                              placeholder="My Tech Stocks"
                              className="col-span-3"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button id="closeWatchlistDialog" type="button" variant="outline" className="hidden">
                            Cancel
                          </Button>
                          <Button type="submit">Create Watchlist</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
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
              
              {/* Watchlist selector */}
              <div className="mb-6">
                <select 
                  className="w-full p-2 border rounded-md"
                  value={activeWatchlistId}
                  onChange={async (e) => {
                    const newWatchlistId = e.target.value;
                    setActiveWatchlistId(newWatchlistId);
                    
                    try {
                      const response = await fetch(`/api/watchlist?watchlistId=${newWatchlistId}`);
                      if (!response.ok) throw new Error('Failed to fetch watchlist');
                      
                      const data = await response.json();
                      setWatchlistItems(data.items);
                      setActiveWatchlist(data.watchlist);
                    } catch (error) {
                      console.error('Error fetching watchlist:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to load watchlist",
                      });
                    }
                  }}
                >
                  {allWatchlists.map(watchlist => (
                    <option key={watchlist.id} value={watchlist.id}>
                      {watchlist.name} ({watchlistCounts[watchlist.id] || 0} stocks)
                    </option>
                  ))}
                </select>
                
                {activeWatchlist && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs"
                          >
                            Rename
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Rename Watchlist</DialogTitle>
                            <DialogDescription>
                              Enter a new name for "{activeWatchlist.name}"
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const name = formData.get('newWatchlistName') as string;
                            
                            if (!name.trim()) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Watchlist name cannot be empty",
                              });
                              return;
                            }
                            
                            try {
                              const response = await fetch(`/api/watchlists/${activeWatchlist.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ name }),
                              });
                              
                              if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.error || 'Failed to rename watchlist');
                              }
                              
                              // Fetch all watchlists to update the dropdown
                              fetchWatchlist();
                              
                              toast({
                                title: "Watchlist Renamed",
                                description: `Watchlist has been renamed to "${name}"`,
                              });
                              
                              // Close the dialog
                              document.getElementById('closeRenameDialog')?.click();
                            } catch (error: any) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: error.message || "Failed to rename watchlist",
                              });
                            }
                          }}>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="newWatchlistName" className="text-right text-sm font-medium col-span-1">
                                  New Name
                                </label>
                                <Input
                                  id="newWatchlistName"
                                  name="newWatchlistName"
                                  defaultValue={activeWatchlist.name}
                                  className="col-span-3"
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button id="closeRenameDialog" type="button" variant="outline" className="hidden">
                                Cancel
                              </Button>
                              <Button type="submit">Rename Watchlist</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      {allWatchlists.length > 1 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Delete Watchlist</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{activeWatchlist.name}"? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-muted-foreground">
                                All stocks in this watchlist will be removed. This action is permanent.
                              </p>
                            </div>
                            <DialogFooter>
                              <Button 
                                id="closeDeleteDialog" 
                                type="button" 
                                variant="outline"
                                onClick={() => {
                                  document.getElementById('closeDeleteDialog')?.click();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/watchlists/${activeWatchlist.id}`, {
                                      method: 'DELETE',
                                    });
                                    
                                    if (!response.ok) {
                                      const error = await response.json();
                                      throw new Error(error.error || 'Failed to delete watchlist');
                                    }
                                    
                                    // Fetch all watchlists to update the dropdown
                                    fetchWatchlist();
                                    
                                    toast({
                                      title: "Watchlist Deleted",
                                      description: `"${activeWatchlist.name}" has been deleted`,
                                    });
                                    
                                    // Close the dialog
                                    document.getElementById('closeDeleteDialog')?.click();
                                  } catch (error: any) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: error.message || "Failed to delete watchlist",
                                    });
                                  }
                                }}
                              >
                                Delete Watchlist
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(activeWatchlist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search watchlist..."
                  className="pl-10 pr-4 py-2 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                      <WatchlistStockCard 
                        key={item.id}
                        item={item} 
                        toggleWatchlist={() => toggleWatchlist(item.stockId, activeWatchlistId)}
                        openTradeDialog={openTradeDialog}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-muted-foreground/20 rounded-lg">
                  <Star className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">This watchlist is empty</h3>
                  <p className="text-muted-foreground mb-4">Add stocks to your watchlist by clicking the star icon</p>
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
                        <StockCard
                          key={stock.id}
                          stock={stock}
                          isInWatchlist={watchlistStockIds.includes(stock.id)}
                          toggleWatchlist={() => toggleWatchlist(stock.id)}
                          openTradeDialog={openTradeDialog}
                        />
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
                                          <h3 className="font-bold text-blue-700 dark:text-blue-400">
                                            <StockSymbolWrapper stock={stock} className="text-blue-700 dark:text-blue-400">
                                              {stock.symbol}
                                            </StockSymbolWrapper> FUT
                                          </h3>
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
                                              <h3 className="font-bold text-purple-700 dark:text-purple-400">
                                                <StockSymbolWrapper stock={stock} className="text-purple-700 dark:text-purple-400">
                                                  {stock.symbol}
                                                </StockSymbolWrapper> {strikePrice} CE
                                              </h3>
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
                                              <h3 className="font-bold text-orange-700 dark:text-orange-400">
                                                <StockSymbolWrapper stock={stock} className="text-orange-700 dark:text-orange-400">
                                                  {stock.symbol}
                                                </StockSymbolWrapper> {strikePrice} PE
                                              </h3>
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
                    portfolioItems.map(item => (
                      <PortfolioItemCard
                        key={item.id}
                        item={item}
                        openTradeDialog={openTradeDialog}
                      />
                    ))
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
                    <TransactionCard 
                      key={transaction.id}
                      transaction={transaction}
                    />
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="roun" strokeLinejoin="round" className="lucide lucide-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
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
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4 relative group overflow-hidden">
                          {profilePhotoPreview || userProfile?.avatarUrl ? (
                            <img 
                              src={profilePhotoPreview || userProfile?.avatarUrl || ""} 
                              alt="Profile" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-12 h-12 text-muted-foreground" />
                          )}
                          <div 
                            className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            onClick={() => profilePhotoInputRef.current?.click()}
                          >
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                          <input 
                            type="file" 
                            ref={profilePhotoInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                          />
                        </div>
                        
                        {profilePhotoPreview && (
                          <div className="flex items-center gap-2 mb-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setProfilePhotoPreview(null);
                                setProfilePhotoFile(null);
                                if (profilePhotoInputRef.current) {
                                  profilePhotoInputRef.current.value = '';
                                }
                              }}
                            >
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                // Here we would upload the photo to the server
                                toast({
                                  title: "Profile photo updated",
                                  description: "Your profile photo has been updated successfully",
                                });
                              }}
                            >
                              <Check className="w-4 h-4 mr-1" /> Save Photo
                            </Button>
                          </div>
                        )}
                        
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
                
                <TabsContent value="add-money">
                  <Tabs defaultValue="amount" className="mb-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="amount" id="amount-tab-trigger">Amount</TabsTrigger>
                      <TabsTrigger value="upi" id="upi-tab-trigger">UPI</TabsTrigger>
                      <TabsTrigger value="card" id="card-tab-trigger">Card</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="amount">
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-lg">Add Money to Your Account</CardTitle>
                          <CardDescription>Add funds to your paper trading account</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form id="addMoneyForm" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const amount = formData.get('amount') as string;
                            const paymentMethod = formData.get('paymentMethod') as string;
                            
                            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                              toast({
                                variant: "destructive",
                                title: "Invalid amount",
                                description: "Please enter a valid amount greater than 0",
                              });
                              return;
                            }
                            
                            // Store amount in session storage to use in next steps
                            sessionStorage.setItem('addMoneyAmount', amount);
                            sessionStorage.setItem('addMoneyMethod', paymentMethod);
                            
                            // Move to next tab based on payment method
                            if (paymentMethod === 'UPI') {
                              document.getElementById('upi-tab-trigger')?.click();
                            } else if (paymentMethod === 'CARD') {
                              document.getElementById('card-tab-trigger')?.click();
                            }
                          }}>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label htmlFor="amount" className="text-sm font-medium">Amount (₹)</label>
                                <Input
                                  id="amount"
                                  name="amount"
                                  type="number"
                                  min="100"
                                  step="100"
                                  placeholder="Enter amount"
                                  required
                                  className="w-full"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</label>
                                <select
                                  id="paymentMethod"
                                  name="paymentMethod"
                                  className="w-full p-2 border rounded-md"
                                  required
                                >
                                  <option value="UPI">UPI</option>
                                  <option value="CARD">Credit/Debit Card</option>
                                </select>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mt-6">
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    const amountInput = document.getElementById('amount') as HTMLInputElement;
                                    if (amountInput) amountInput.value = "1000";
                                  }}
                                >
                                  ₹1,000
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    const amountInput = document.getElementById('amount') as HTMLInputElement;
                                    if (amountInput) amountInput.value = "5000";
                                  }}
                                >
                                  ₹5,000
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    const amountInput = document.getElementById('amount') as HTMLInputElement;
                                    if (amountInput) amountInput.value = "10000";
                                  }}
                                >
                                  ₹10,000
                                </Button>
                              </div>
                              
                              <Button 
                                type="submit" 
                                className="w-full bg-green-500 hover:bg-green-600 mt-4"
                              >
                                <span className="flex items-center">
                                  <IndianRupee className="w-4 h-4 mr-2" />
                                  Continue
                                </span>
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="upi" id="upi-tab">
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-lg">UPI Payment</CardTitle>
                          <CardDescription>Complete your payment using UPI</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            <div className="text-center">
                              <div className="bg-gray-100 p-4 rounded-lg mx-auto w-48 h-48 flex items-center justify-center mb-4">
                                <img src="/images/rect.png" alt="QR Code" className="w-full h-full object-contain" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">Scan QR code with any UPI app</p>
                              <p className="font-medium text-lg" id="upi-amount">
                                Amount: ₹<span id="display-upi-amount">0</span>
                              </p>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label htmlFor="upiId" className="text-sm font-medium">UPI ID</label>
                                <div className="flex">
                                  <Input
                                    id="upiId"
                                    name="upiId"
                                    placeholder="yourname@upi"
                                    className="rounded-r-none"
                                  />
                                  <Button className="rounded-l-none bg-green-500 hover:bg-green-600">
                                    Verify
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                <p className="text-sm font-medium">Or pay using</p>
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="bg-gray-100 p-2 rounded-md text-center cursor-pointer hover:bg-gray-200">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-white rounded-full flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><path d="M10 7v10"/><path d="M14 7v10"/></svg>
                                    </div>
                                    <p className="text-xs">PhonePe</p>
                                  </div>
                                  <div className="bg-gray-100 p-2 rounded-md text-center cursor-pointer hover:bg-gray-200">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-white rounded-full flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                                    </div>
                                    <p className="text-xs">GPay</p>
                                  </div>
                                  <div className="bg-gray-100 p-2 rounded-md text-center cursor-pointer hover:bg-gray-200">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-white rounded-full flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                                    </div>
                                    <p className="text-xs">Paytm</p>
                                  </div>
                                  <div className="bg-gray-100 p-2 rounded-md text-center cursor-pointer hover:bg-gray-200">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-white rounded-full flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                                    </div>
                                    <p className="text-xs">Amazon</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-4 mt-6">
                              <Button 
                                variant="outline" 
                                className="w-1/2"
                                onClick={() => {
                                  document.getElementById('amount-tab-trigger')?.click();
                                }}
                              >
                                Back
                              </Button>
                              <Button 
                                className="w-1/2 bg-green-500 hover:bg-green-600"
                                onClick={async () => {
                                  try {
                                    setIsLoading(true);
                                    const amount = sessionStorage.getItem('addMoneyAmount') || "0";
                                    
                                    const response = await fetch('/api/user/add-money', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        amount: parseFloat(amount),
                                        paymentMethod: 'UPI',
                                      }),
                                    });
                                    
                                    if (!response.ok) {
                                      const error = await response.json();
                                      throw new Error(error.error || 'Failed to add money');
                                    }
                                    
                                    const data = await response.json();
                                    
                                    // Update user profile with new balance
                                    setUserProfile(data.user);
                                    
                                    toast({
                                      title: "Money added successfully",
                                      description: data.message,
                                    });
                                    
                                    // Reset form and go back to amount tab
                                    document.getElementById('amount-tab-trigger')?.click();
                                    (document.getElementById('addMoneyForm') as HTMLFormElement)?.reset();
                                    sessionStorage.removeItem('addMoneyAmount');
                                    sessionStorage.removeItem('addMoneyMethod');
                                    
                                  } catch (error: any) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: error.message || "Failed to add money",
                                    });
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                              >
                                {isLoading ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </span>
                                ) : (
                                  <span>Pay Now</span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="card" id="card-tab">
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-lg">Card Payment</CardTitle>
                          <CardDescription>Complete your payment using Credit/Debit Card</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center mb-4">
                              <p className="font-medium text-lg" id="card-amount">
                                Amount: ₹<span id="display-card-amount">0</span>
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor="cardNumber" className="text-sm font-medium">Card Number</label>
                              <Input
                                id="cardNumber"
                                name="cardNumber"
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                className="w-full"
                                onChange={(e) => {
                                  // Format card number with spaces
                                  let value = e.target.value.replace(/\s/g, '');
                                  if (value.length > 0) {
                                    value = value.match(new RegExp('.{1,4}', 'g'))?.join(' ') || '';
                                  }
                                  e.target.value = value;
                                }}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label htmlFor="expiryDate" className="text-sm font-medium">Expiry Date</label>
                                <Input
                                  id="expiryDate"
                                  name="expiryDate"
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  className="w-full"
                                  onChange={(e) => {
                                    // Format expiry date
                                    let value = e.target.value.replace(/\D/g, '');
                                    if (value.length > 2) {
                                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                    }
                                    e.target.value = value;
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="cvv" className="text-sm font-medium">CVV</label>
                                <Input
                                  id="cvv"
                                  name="cvv"
                                  type="password"
                                  placeholder="123"
                                  maxLength={3}
                                  className="w-full"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor="nameOnCard" className="text-sm font-medium">Name on Card</label>
                              <Input
                                id="nameOnCard"
                                name="nameOnCard"
                                placeholder="John Doe"
                                className="w-full"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-4">
                              <input type="checkbox" id="saveCard" className="rounded" />
                              <label htmlFor="saveCard" className="text-sm">Save card for future payments</label>
                            </div>
                            
                            <div className="flex space-x-4 mt-6">
                              <Button 
                                variant="outline" 
                                className="w-1/2"
                                onClick={() => {
                                  document.getElementById('amount-tab-trigger')?.click();
                                }}
                              >
                                Back
                              </Button>
                              <Button 
                                className="w-1/2 bg-green-500 hover:bg-green-600"
                                onClick={async () => {
                                  try {
                                    setIsLoading(true);
                                    const amount = sessionStorage.getItem('addMoneyAmount') || "0";
                                    
                                    const response = await fetch('/api/user/add-money', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        amount: parseFloat(amount),
                                        paymentMethod: 'CARD',
                                      }),
                                    });
                                    
                                    if (!response.ok) {
                                      const error = await response.json();
                                      throw new Error(error.error || 'Failed to add money');
                                    }
                                    
                                    const data = await response.json();
                                    
                                    // Update user profile with new balance
                                    setUserProfile(data.user);
                                    
                                    toast({
                                      title: "Money added successfully",
                                      description: data.message,
                                    });
                                    
                                    // Reset form and go back to amount tab
                                    document.getElementById('amount-tab-trigger')?.click();
                                    (document.getElementById('addMoneyForm') as HTMLFormElement)?.reset();
                                    sessionStorage.removeItem('addMoneyAmount');
                                    sessionStorage.removeItem('addMoneyMethod');
                                    
                                  } catch (error: any) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: error.message || "Failed to add money",
                                    });
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                              >
                                {isLoading ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </span>
                                ) : (
                                  <span>Pay Now</span>
                                )}
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-center space-x-4 mt-4">
                              <div className="h-6 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div className="h-6 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div className="h-6 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div className="h-6 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <CreditCard className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {transactions.filter(t => t.type === 'ADD_MONEY').length > 0 ? (
                          transactions.filter(t => t.type === 'ADD_MONEY').slice(0,5).map((transaction, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                              <div>
                                <p className="font-medium">Added ₹{transaction.total.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">{new Date(transaction.timestamp).toLocaleString()}</p>
                              </div>
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Completed
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>No deposit transactions yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Add script to update amount display in UPI and Card tabs */}
                  <script dangerouslySetInnerHTML={{
                    __html: `
                      // Update amount display when tabs change
                      document.addEventListener('DOMContentLoaded', function() {
                        const updateAmountDisplays = function() {
                          const amount = sessionStorage.getItem('addMoneyAmount') || "0";
                          document.getElementById('display-upi-amount').textContent = amount;
                          document.getElementById('display-card-amount').textContent = amount;
                        };
                        
                        // Set up MutationObserver to detect tab changes
                        const tabsContainer = document.querySelector('[role="tablist"]');
                        if (tabsContainer) {
                          const observer = new MutationObserver(updateAmountDisplays);
                          observer.observe(tabsContainer, { attributes: true, subtree: true });
                        }
                        
                        // Initial update
                        updateAmountDisplays();
                      });
                    `
                  }} />
                </TabsContent>
                
                <TabsContent value="risk-profile">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Management Profile</CardTitle>
                      <CardDescription>Configure your trading risk parameters</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form 
                        id="riskProfileForm"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          
                          const riskProfile = {
                            maxPositionSize: parseFloat(formData.get('maxPositionSize') as string),
                            maxDrawdown: parseFloat(formData.get('maxDrawdown') as string),
                            riskPerTrade: parseFloat(formData.get('riskPerTrade') as string),
                            stopLossDefault: parseFloat(formData.get('stopLossDefault') as string),
                            takeProfitDefault: parseFloat(formData.get('takeProfitDefault') as string),
                          };
                          
                          try {
                            setIsLoading(true);
                            const response = await fetch('/api/risk-profile', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(riskProfile),
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || 'Failed to update risk profile');
                            }
                            
                            const data = await response.json();
                            
                            toast({
                              title: "Risk profile updated",
                              description: data.message,
                            });
                          } catch (error: any) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: error.message || "Failed to update risk profile",
                            });
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label htmlFor="maxPositionSize" className="text-sm font-medium">Max Position Size (%)</label>
                              <span className="text-xs text-muted-foreground">% of portfolio per position</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="maxPositionSize"
                                name="maxPositionSize"
                                type="number"
                                min="1"
                                max="100"
                                defaultValue="5"
                                required
                                className="w-full"
                              />
                              <span className="text-sm">%</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label htmlFor="maxDrawdown" className="text-sm font-medium">Max Drawdown (%)</label>
                              <span className="text-xs text-muted-foreground">Maximum allowed portfolio loss</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="maxDrawdown"
                                name="maxDrawdown"
                                type="number"
                                min="1"
                                max="100"
                                defaultValue="20"
                                required
                                className="w-full"
                              />
                              <span className="text-sm">%</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label htmlFor="riskPerTrade" className="text-sm font-medium">Risk Per Trade (%)</label>
                              <span className="text-xs text-muted-foreground">% of portfolio to risk per trade</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="riskPerTrade"
                                name="riskPerTrade"
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                defaultValue="1"
                                required
                                className="w-full"
                              />
                              <span className="text-sm">%</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="stopLossDefault" className="text-sm font-medium">Default Stop Loss (%)</label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  id="stopLossDefault"
                                  name="stopLossDefault"
                                  type="number"
                                  min="0.5"
                                  max="20"
                                  step="0.5"
                                  defaultValue="5"
                                  required
                                  className="w-full"
                                />
                                <span className="text-sm">%</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor="takeProfitDefault" className="text-sm font-medium">Default Take Profit (%)</label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  id="takeProfitDefault"
                                  name="takeProfitDefault"
                                  type="number"
                                  min="1"
                                  max="50"
                                  step="0.5"
                                  defaultValue="10"
                                  required
                                  className="w-full"
                                />
                                <span className="text-sm">%</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Updating...' : 'Save Risk Profile'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-md">
                          <h4 className="font-medium mb-2">Current Portfolio Risk</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Largest Position</span>
                              <span className="font-medium">
                                {portfolioItems.length > 0 ? (
                                  `${(portfolioItems.reduce((max, item) => {
                                    const value = item.quantity * item.stock.currentPrice;
                                    return value > max.value ? { stock: item.stock.symbol, value } : max;
                                  }, { stock: '', value: 0 }).stock)} (${(portfolioItems.reduce((max, item) => {
                                    const value = item.quantity * item.stock.currentPrice;
                                    return value > max ? value : max;
                                  }, 0) / portfolioValue * 100).toFixed(1)}%)`
                                ) : 'None'}
                              </span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Sector Concentration</span>
                              <span className="font-medium">
                                {portfolioItems.length > 0 ? (
                                  `${Object.entries(
                                    portfolioItems.reduce((sectors, item) => {
                                      const sector = item.stock.sector || 'Other';
                                      const value = item.quantity * item.stock.currentPrice;
                                      sectors[sector] = (sectors[sector] || 0) + value;
                                      return sectors;
                                    }, {} as Record<string, number>)
                                  ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'} (${(Object.entries(
                                    portfolioItems.reduce((sectors, item) => {
                                      const sector = item.stock.sector || 'Other';
                                      const value = item.quantity * item.stock.currentPrice;
                                      sectors[sector] = (sectors[sector] || 0) + value;
                                      return sectors;
                                    }, {} as Record<string, number>)
                                  ).sort((a, b) => b[1] - a[1])[0]?.[1] / portfolioValue * 100).toFixed(1)}%)`
                                ) : 'None'}
                              </span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span>Current Drawdown</span>
                              <span className={`font-medium ${
                                portfolioItems.reduce((total, item) => {
                                  const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                                  const costBasis = item.avgBuyPrice * item.quantity;
                                  return total + (profit / (costBasis || 1)) * 100;
                                }, 0) < 0 ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {portfolioItems.length > 0 ? (
                                  `${portfolioItems.reduce((total, item) => {
                                    const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                                    const costBasis = item.avgBuyPrice * item.quantity;
                                    return total + (profit / (costBasis || 1)) * 100;
                                  }, 0) < 0 ? portfolioItems.reduce((total, item) => {
                                    const profit = (item.stock.currentPrice - item.avgBuyPrice) * item.quantity;
                                    const costBasis = item.avgBuyPrice * item.quantity;
                                    return total + (profit / (costBasis || 1)) * 100;
                                  }, 0).toFixed(2) : '0.00'}%`
                                ) : '0.00%'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/30 rounded-md">
                          <h4 className="font-medium mb-2">Risk Recommendations</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                              <span>Diversify your portfolio across multiple sectors to reduce risk</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                              <span>Consider setting stop-loss orders for all positions to limit potential losses</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                              <span>Maintain a balanced ratio between equity and F&O positions</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="kyc">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">KYC Verification</CardTitle>
                      <CardDescription>Complete your KYC to unlock all trading features</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        
                        // Check if document uploads are provided
                        if (!documentFrontFile) {
                          toast({
                            variant: "destructive",
                            title: "Missing document",
                            description: "Please upload the front side of your ID document",
                          });
                          return;
                        }
                        
                        if (!selfieFile) {
                          toast({
                            variant: "destructive",
                            title: "Missing selfie",
                            description: "Please upload a selfie for verification",
                          });
                          return;
                        }
                        
                        toast({
                          title: "KYC submission received",
                          description: "Your KYC details have been submitted for verification. This usually takes 1-2 business days.",
                        });
                      }}>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="fullName" className="text-sm font-medium">Full Name (as per ID)</label>
                            <Input
                              id="fullName"
                              name="fullName"
                              placeholder="Enter your full name"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</label>
                            <Input
                              id="dateOfBirth"
                              name="dateOfBirth"
                              type="date"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="panNumber" className="text-sm font-medium">PAN Number</label>
                              <Input
                                id="panNumber"
                                name="panNumber"
                                placeholder="ABCDE1234F"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor="aadharNumber" className="text-sm font-medium">Aadhar Number</label>
                              <Input
                                id="aadharNumber"
                                name="aadharNumber"
                                placeholder="1234 5678 9012"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="address" className="text-sm font-medium">Address</label>
                            <Input
                              id="address"
                              name="address"
                              placeholder="Enter your address"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="city" className="text-sm font-medium">City</label>
                              <Input
                                id="city"
                                name="city"
                                placeholder="City"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor="state" className="text-sm font-medium">State</label>
                              <Input
                                id="state"
                                name="state"
                                placeholder="State"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="postalCode" className="text-sm font-medium">Postal Code</label>
                              <Input
                                id="postalCode"
                                name="postalCode"
                                placeholder="Postal Code"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor="country" className="text-sm font-medium">Country</label>
                              <Input
                                id="country"
                                name="country"
                                defaultValue="India"
                                readOnly
                                className="bg-muted/50"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="documentType" className="text-sm font-medium">ID Document Type</label>
                            <select
                              id="documentType"
                              name="documentType"
                              className="w-full p-2 border rounded-md"
                              required
                            >
                              <option value="">Select document type</option>
                              <option value="AADHAR">Aadhar Card</option>
                              <option value="PAN">PAN Card</option>
                              <option value="PASSPORT">Passport</option>
                              <option value="DRIVING_LICENSE">Driving License</option>
                            </select>
                          </div>
                          
                          {/* Document Front Upload with Preview */}
                          <div className="space-y-2">
                            <label htmlFor="documentFront" className="text-sm font-medium">Upload Document Front</label>
                            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-md border-gray-300 hover:border-gray-400 transition-colors">
                              {documentFrontPreview ? (
                                <div className="relative w-full">
                                  <img 
                                    src={documentFrontPreview} 
                                    alt="Document Front" 
                                    className="w-full h-40 object-contain mb-2"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-0 right-0"
                                    onClick={() => {
                                      setDocumentFrontPreview(null);
                                      setDocumentFrontFile(null);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-500 mb-1">Click to upload or drag and drop</p>
                                  <p className="text-xs text-gray-400">PNG, JPG or PDF (max. 5MB)</p>
                                  <Input
                                    id="documentFront"
                                    name="documentFront"
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={handleDocumentFrontChange}
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="mt-2"
                                    onClick={() => document.getElementById('documentFront')?.click()}
                                  >
                                    Select File
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Document Back Upload with Preview */}
                          <div className="space-y-2">
                            <label htmlFor="documentBack" className="text-sm font-medium">Upload Document Back (if applicable)</label>
                            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-md border-gray-300 hover:border-gray-400 transition-colors">
                              {documentBackPreview ? (
                                <div className="relative w-full">
                                  <img 
                                    src={documentBackPreview} 
                                    alt="Document Back" 
                                    className="w-full h-40 object-contain mb-2"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-0 right-0"
                                    onClick={() => {
                                      setDocumentBackPreview(null);
                                      setDocumentBackFile(null);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-500 mb-1">Click to upload or drag and drop</p>
                                  <p className="text-xs text-gray-400">PNG, JPG or PDF (max. 5MB)</p>
                                  <Input
                                    id="documentBack"
                                    name="documentBack"
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={handleDocumentBackChange}
                                  />
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="mt-2"
                                    onClick={() => document.getElementById('documentBack')?.click()}
                                  >
                                    Select File
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Selfie Upload with Preview */}
                          <div className="space-y-2">
                            <label htmlFor="selfie" className="text-sm font-medium">Upload Selfie</label>
                            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-md border-gray-300 hover:border-gray-400 transition-colors">
                              {selfiePreview ? (
                                <div className="relative w-full">
                                  <img 
                                    src={selfiePreview} 
                                    alt="Selfie" 
                                    className="w-full h-40 object-contain mb-2"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-0 right-0"
                                    onClick={() => {
                                      setSelfiePreview(null);
                                      setSelfieFile(null);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Camera className="w-10 h-10 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-500 mb-1">Take a clear selfie or upload one</p>
                                  <p className="text-xs text-gray-400">Make sure your face is clearly visible</p>
                                  <Input
                                    id="selfie"
                                    name="selfie"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleSelfieChange}
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <Button 
                                      type="button" 
                                      variant="outline"
                                      onClick={() => document.getElementById('selfie')?.click()}
                                    >
                                      Upload
                                    </Button>
                                    <Button 
                                      type="button"
                                      onClick={() => {
                                        // This would open the camera in a real implementation
                                        toast({
                                          title: "Camera access",
                                          description: "Camera access would be requested here in a real implementation",
                                        });
                                      }}
                                    >
                                      Take Photo
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2 mt-4">
                            <input
                              type="checkbox"
                              id="consent"
                              className="mt-1"
                              required
                            />
                            <label htmlFor="consent" className="text-sm">
                              I confirm that the information provided is accurate and I consent to the processing of my personal data for KYC verification purposes.
                            </label>
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full"
                          >
                            Submit KYC Details
                          </Button>
                        </div>
                      </form>
                      
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                        <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">KYC Verification Status</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Pending
                          </Badge>
                          <span className="text-sm text-muted-foreground">Your KYC verification is pending</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: This is a paper trading platform. KYC verification is simulated for educational purposes.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
        
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
          <div className="grid grid-cols-5 h-16">
            <Button 
              variant={activeSection === "home" ? "default" : "ghost"} 
              className={`flex flex-col items-center justify-center rounded-none h-full ${activeSection === "home" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "text-foreground hover:bg-green-500/5"}`}
              onClick={() => setActiveSection("home")}
            >
              <Home className={`h-5 w-5 ${activeSection === "home" ? "" : "text-muted-foreground"}`} />
              <span className={`text-xs mt-1 ${activeSection === "home" ? "" : "text-muted-foreground"}`}>Home</span>
            </Button>
            <Button 
              variant={activeSection === "watchlist" ? "default" : "ghost"} 
              className={`flex flex-col items-center justify-center rounded-none h-full ${activeSection === "watchlist" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "text-foreground hover:bg-green-500/5"}`}
              onClick={() => setActiveSection("watchlist")}
            >
              <Star className={`h-5 w-5 ${activeSection === "watchlist" ? "" : "text-muted-foreground"}`} />
              <span className={`text-xs mt-1 ${activeSection === "watchlist" ? "" : "text-muted-foreground"}`}>Watchlist</span>
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
              <span className={`text-xs mt-1 ${activeSection === "transactions" ? ""  : "text-muted-foreground"}`}>History</span>
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

        {/* Modals */}
        <QuickTradeModal />
        <ShareModal isOpen={isShareModalOpen} onClose={closeShareModal} stock={selectedStock} />
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