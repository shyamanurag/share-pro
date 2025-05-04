import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { 
  Users, 
  BarChart3, 
  LineChart, 
  IndianRupee, 
  RefreshCw, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  User,
  Clock,
  Briefcase,
  Settings
} from "lucide-react";

// Types
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  balance: number;
  createdAt: string;
}

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
  user: UserProfile;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalTradingVolume: 0,
    activeUsers: 0
  });

  // Mock data for admin dashboard
  useEffect(() => {
    if (user) {
      // In a real implementation, these would be API calls to admin endpoints
      setIsLoading(true);
      
      // Mock users data
      const mockUsers: UserProfile[] = [
        {
          id: "1",
          email: "admin@tradepaper.com",
          name: "Admin User",
          avatarUrl: null,
          balance: 1000000,
          createdAt: new Date().toISOString()
        },
        {
          id: "2",
          email: "demo@tradepaper.com",
          name: "Demo User",
          avatarUrl: null,
          balance: 500000,
          createdAt: new Date().toISOString()
        },
        {
          id: "3",
          email: "user1@example.com",
          name: "Regular User",
          avatarUrl: null,
          balance: 250000,
          createdAt: new Date().toISOString()
        }
      ];
      
      // Fetch real stocks
      fetch('/api/stocks')
        .then(res => res.json())
        .then(data => {
          setStocks(data.stocks);
          
          // Generate mock transactions using real stocks
          const mockTransactions: Transaction[] = [];
          for (let i = 0; i < 20; i++) {
            const stock = data.stocks[Math.floor(Math.random() * data.stocks.length)];
            const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
            const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
            const quantity = Math.floor(Math.random() * 100) + 1;
            const price = stock.currentPrice;
            
            mockTransactions.push({
              id: `trans-${i}`,
              userId: user.id,
              stockId: stock.id,
              type,
              quantity,
              price,
              total: quantity * price,
              timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              stock,
              user
            });
          }
          
          setTransactions(mockTransactions);
          
          // Set stats
          setStats({
            totalUsers: mockUsers.length,
            totalTransactions: mockTransactions.length,
            totalTradingVolume: mockTransactions.reduce((sum, t) => sum + t.total, 0),
            activeUsers: mockUsers.length
          });
          
          setUsers(mockUsers);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error loading admin data:", err);
          setIsLoading(false);
        });
    }
  }, [user]);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if user is admin (in a real app, this would be a proper check)
  const isAdmin = user && user.email === "admin@tradepaper.com";

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
        <Button onClick={() => router.push('/dashboard-india')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | TradePaper India</title>
        <meta name="description" content="Admin dashboard for TradePaper India" />
      </Head>
      
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col bg-card border-r border-border p-4">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
          
          <nav className="space-y-2 flex-1">
            <Button 
              variant={activeTab === "overview" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button 
              variant={activeTab === "users" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
            <Button 
              variant={activeTab === "stocks" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("stocks")}
            >
              <LineChart className="mr-2 h-4 w-4" />
              Stocks
            </Button>
            <Button 
              variant={activeTab === "transactions" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("transactions")}
            >
              <Clock className="mr-2 h-4 w-4" />
              Transactions
            </Button>
            <Button 
              variant={activeTab === "settings" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </nav>
          
          <div className="pt-4 border-t border-border">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@tradepaper.com</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/dashboard-india')}
            >
              View App
            </Button>
            <Button 
              variant="ghost" 
              className="w-full mt-2"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-10 bg-background border-b border-border p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Admin</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard-india')}
            >
              View App
            </Button>
          </header>
          
          {/* Mobile Tabs */}
          <div className="md:hidden p-4 border-b border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="stocks">Stocks</TabsTrigger>
                <TabsTrigger value="transactions">History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <>
                <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        +2 from last week
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeUsers}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        100% active rate
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Transactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        +8 from yesterday
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Trading Volume
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {stats.totalTradingVolume.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        +12.5% from last week
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {transactions.slice(0, 5).map(transaction => (
                          <div key={transaction.id} className="flex justify-between items-center border-b border-border pb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={transaction.type === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                                  {transaction.type}
                                </Badge>
                                <span className="font-medium">{transaction.stock.symbol}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{transaction.user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium flex items-center">
                                <IndianRupee className="w-3 h-3 mr-0.5" />
                                {transaction.total.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Traded Stocks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stocks.slice(0, 5).map(stock => (
                          <div key={stock.id} className="flex justify-between items-center border-b border-border pb-2">
                            <div>
                              <p className="font-medium">{stock.symbol}</p>
                              <p className="text-xs text-muted-foreground">{stock.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium flex items-center justify-end">
                                <IndianRupee className="w-3 h-3 mr-0.5" />
                                {stock.currentPrice.toFixed(2)}
                              </p>
                              <div className={`flex items-center justify-end text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {stock.change >= 0 ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                )}
                                <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
            
            {activeTab === "users" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">User Management</h1>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
                
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 p-4 font-medium border-b">
                    <div>User</div>
                    <div>Email</div>
                    <div>Balance</div>
                    <div>Joined</div>
                    <div>Actions</div>
                  </div>
                  
                  {filteredUsers.map(user => (
                    <div key={user.id} className="grid grid-cols-5 p-4 border-b hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span>{user.name || "User"}</span>
                      </div>
                      <div className="flex items-center">{user.email}</div>
                      <div className="flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {user.balance.toFixed(2)}
                      </div>
                      <div className="flex items-center">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast({
                            title: "Coming Soon",
                            description: "User editing will be available soon!",
                          })}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => toast({
                            title: "Coming Soon",
                            description: "User deletion will be available soon!",
                          })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {activeTab === "stocks" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Stock Management</h1>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
                
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
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 p-4 font-medium border-b">
                    <div>Symbol</div>
                    <div>Name</div>
                    <div>Price</div>
                    <div>Change</div>
                    <div>Volume</div>
                    <div>Actions</div>
                  </div>
                  
                  {stocks.slice(0, 10).map(stock => (
                    <div key={stock.id} className="grid grid-cols-6 p-4 border-b hover:bg-muted/50">
                      <div className="flex items-center font-medium">{stock.symbol}</div>
                      <div className="flex items-center text-sm">{stock.name}</div>
                      <div className="flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {stock.currentPrice.toFixed(2)}
                      </div>
                      <div className={`flex items-center ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.change >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                        )}
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                      <div className="flex items-center">{stock.volume.toLocaleString()}</div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast({
                            title: "Coming Soon",
                            description: "Stock editing will be available soon!",
                          })}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => toast({
                            title: "Coming Soon",
                            description: "Stock deletion will be available soon!",
                          })}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {activeTab === "transactions" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Transaction History</h1>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 p-4 font-medium border-b">
                    <div>User</div>
                    <div>Stock</div>
                    <div>Type</div>
                    <div>Quantity</div>
                    <div>Total</div>
                    <div>Date</div>
                  </div>
                  
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="grid grid-cols-6 p-4 border-b hover:bg-muted/50">
                      <div className="flex items-center text-sm">{transaction.user.email}</div>
                      <div className="flex items-center font-medium">{transaction.stock.symbol}</div>
                      <div className="flex items-center">
                        <Badge variant={transaction.type === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                          {transaction.type}
                        </Badge>
                      </div>
                      <div className="flex items-center">{transaction.quantity}</div>
                      <div className="flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {transaction.total.toFixed(2)}
                      </div>
                      <div className="flex items-center text-sm">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {activeTab === "settings" && (
              <>
                <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
                
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Admin settings will be available in a future update. This will include options to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                      <li>Configure trading hours</li>
                      <li>Set platform fees</li>
                      <li>Manage user permissions</li>
                      <li>Configure stock data sources</li>
                      <li>Set up system notifications</li>
                    </ul>
                    <Button 
                      className="mt-6"
                      onClick={() => toast({
                        title: "Coming Soon",
                        description: "Admin settings will be available soon!",
                      })}
                    >
                      Save Settings
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}