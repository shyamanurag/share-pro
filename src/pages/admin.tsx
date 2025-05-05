import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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
  Settings,
  AlertTriangle,
  Activity,
  Database,
  Server,
  Shield,
  Bell,
  Calendar,
  FileText,
  HelpCircle,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  Plus
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

                {/* System Health Dashboard */}
                <h2 className="text-xl font-semibold mb-4">System Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium text-green-800 dark:text-green-400">
                          System Status
                        </CardTitle>
                        <Server className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="text-lg font-bold text-green-800 dark:text-green-400">Operational</div>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                        All systems running normally
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          API Performance
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">245ms</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Average response time
                      </p>
                      <div className="w-full h-2 bg-muted mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[85%]"></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Error Rate
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">0.05%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last 24 hours
                      </p>
                      <div className="w-full h-2 bg-muted mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[3%]"></div>
                      </div>
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
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-1">
                          <UserPlus className="w-4 h-4" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New User</DialogTitle>
                          <DialogDescription>
                            Create a new user account with initial settings.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="Enter user's full name" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="user@example.com" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select defaultValue="USER">
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">Regular User</SelectItem>
                                <SelectItem value="ADMIN">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="balance">Initial Balance (₹)</Label>
                            <Input id="balance" type="number" defaultValue="10000" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="active" defaultChecked />
                            <Label htmlFor="active">Account Active</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>Cancel</Button>
                          <Button onClick={() => {
                            toast({
                              title: "User Created",
                              description: "New user account has been created successfully.",
                            });
                          }}>Create User</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between mb-6">
                  <div className="flex-1 mr-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Administrators</SelectItem>
                      <SelectItem value="user">Regular Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle>User Statistics</CardTitle>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" /> Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{users.length}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">New This Week</p>
                        <p className="text-2xl font-bold">2</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="rounded-md border">
                  <div className="grid grid-cols-7 p-4 font-medium border-b">
                    <div>User</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Balance</div>
                    <div>Joined</div>
                    <div>Actions</div>
                  </div>
                  
                  {filteredUsers.map(user => (
                    <div key={user.id} className="grid grid-cols-7 p-4 border-b hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span>{user.name || "User"}</span>
                      </div>
                      <div className="flex items-center">{user.email}</div>
                      <div className="flex items-center">
                        <Badge variant={user.email.includes('admin') ? "default" : "secondary"}>
                          {user.email.includes('admin') ? "Admin" : "User"}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          Active
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                        {user.balance.toFixed(2)}
                      </div>
                      <div className="flex items-center">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Update user information and settings.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input id="edit-name" defaultValue={user.name || ""} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" defaultValue={user.email} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select defaultValue={user.email.includes('admin') ? "ADMIN" : "USER"}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USER">Regular User</SelectItem>
                                    <SelectItem value="ADMIN">Administrator</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-balance">Balance (₹)</Label>
                                <Input id="edit-balance" type="number" defaultValue={user.balance} />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="edit-active" defaultChecked />
                                <Label htmlFor="edit-active">Account Active</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>Cancel</Button>
                              <Button onClick={() => {
                                toast({
                                  title: "User Updated",
                                  description: "User information has been updated successfully.",
                                });
                              }}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="bg-muted p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">{user.name || "User"}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>Cancel</Button>
                              <Button variant="destructive" onClick={() => {
                                toast({
                                  title: "User Deleted",
                                  description: "User has been deleted successfully.",
                                  variant: "destructive",
                                });
                              }}>Delete User</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>User Details</DialogTitle>
                              <DialogDescription>
                                Detailed information about the user.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold">{user.name || "User"}</h3>
                                  <p className="text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                              
                              <Tabs defaultValue="overview">
                                <TabsList className="mb-4">
                                  <TabsTrigger value="overview">Overview</TabsTrigger>
                                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="overview">
                                  <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Account Information</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">User ID:</span>
                                            <span className="font-mono text-xs">{user.id}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Created:</span>
                                            <span>{new Date(user.createdAt).toLocaleString()}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className="text-green-600">Active</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Role:</span>
                                            <span>{user.email.includes('admin') ? "Administrator" : "Regular User"}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Financial Summary</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Balance:</span>
                                            <span className="font-bold">₹{user.balance.toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Invested:</span>
                                            <span>₹{(user.balance * 0.4).toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Portfolio Value:</span>
                                            <span>₹{(user.balance * 0.6).toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total P&L:</span>
                                            <span className="text-green-600">+₹{(user.balance * 0.05).toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="transactions">
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Transaction history will be displayed here.</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                                
                                <TabsContent value="portfolio">
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Portfolio details will be displayed here.</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </TabsContent>
                              </Tabs>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {}}>Close</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
                <h1 className="text-2xl font-bold mb-6">System Settings</h1>
                
                <Tabs defaultValue="general" className="mb-6">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="trading">Trading</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>
                          Configure basic platform settings and appearance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Platform Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="platform-name">Platform Name</Label>
                              <Input id="platform-name" defaultValue="TradePaper India" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="support-email">Support Email</Label>
                              <Input id="support-email" defaultValue="support@tradepaper.com" />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Default User Settings</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="initial-balance">Initial Balance (₹)</Label>
                              <Input id="initial-balance" type="number" defaultValue="10000" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="default-role">Default User Role</Label>
                              <Select defaultValue="USER">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">Regular User</SelectItem>
                                  <SelectItem value="ADMIN">Administrator</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="auto-approve" defaultChecked />
                            <Label htmlFor="auto-approve">Auto-approve new user registrations</Label>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Appearance</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="theme">Default Theme</Label>
                              <Select defaultValue="system">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="light">Light</SelectItem>
                                  <SelectItem value="dark">Dark</SelectItem>
                                  <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="accent-color">Accent Color</Label>
                              <Select defaultValue="green">
                                <SelectTrigger>
                                  <SelectValue placeholder="Select accent color" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="green">Green</SelectItem>
                                  <SelectItem value="blue">Blue</SelectItem>
                                  <SelectItem value="purple">Purple</SelectItem>
                                  <SelectItem value="orange">Orange</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline">Reset to Defaults</Button>
                        <Button onClick={() => toast({
                          title: "Settings Saved",
                          description: "General settings have been updated successfully.",
                        })}>Save Changes</Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="trading" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Trading Settings</CardTitle>
                        <CardDescription>
                          Configure market hours, fees, and trading parameters
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Market Hours</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="market-open">Market Open Time</Label>
                              <Input id="market-open" defaultValue="09:15" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="market-close">Market Close Time</Label>
                              <Input id="market-close" defaultValue="15:30" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Trading Days</Label>
                            <div className="flex flex-wrap gap-2">
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Switch id={`day-${day}`} defaultChecked />
                                  <Label htmlFor={`day-${day}`}>{day}</Label>
                                </div>
                              ))}
                              {["Saturday", "Sunday"].map(day => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Switch id={`day-${day}`} />
                                  <Label htmlFor={`day-${day}`}>{day}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Trading Fees</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="brokerage-fee">Brokerage Fee (%)</Label>
                              <Input id="brokerage-fee" type="number" step="0.01" defaultValue="0.05" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="transaction-tax">Transaction Tax (%)</Label>
                              <Input id="transaction-tax" type="number" step="0.01" defaultValue="0.1" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="apply-fees" defaultChecked />
                            <Label htmlFor="apply-fees">Apply fees to paper trading</Label>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">F&O Settings</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="margin-multiplier">Margin Multiplier</Label>
                              <Input id="margin-multiplier" type="number" step="0.1" defaultValue="5.0" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max-leverage">Maximum Leverage</Label>
                              <Input id="max-leverage" type="number" defaultValue="10" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="enable-fno" defaultChecked />
                            <Label htmlFor="enable-fno">Enable F&O Trading</Label>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline">Reset to Defaults</Button>
                        <Button onClick={() => toast({
                          title: "Settings Saved",
                          description: "Trading settings have been updated successfully.",
                        })}>Save Changes</Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="security" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>
                          Configure security and authentication settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Authentication</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor="enable-2fa">Two-Factor Authentication</Label>
                              </div>
                              <Switch id="enable-2fa" defaultChecked />
                            </div>
                            <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor="password-policy">Strong Password Policy</Label>
                              </div>
                              <Switch id="password-policy" defaultChecked />
                            </div>
                            <p className="text-sm text-muted-foreground">Require complex passwords with minimum 8 characters</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Session Management</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                              <Input id="session-timeout" type="number" defaultValue="60" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max-sessions">Maximum Concurrent Sessions</Label>
                              <Input id="max-sessions" type="number" defaultValue="3" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="force-logout" />
                            <Label htmlFor="force-logout">Force logout on password change</Label>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">API Security</h3>
                          <div className="space-y-2">
                            <Label htmlFor="api-rate-limit">API Rate Limit (requests per minute)</Label>
                            <Input id="api-rate-limit" type="number" defaultValue="100" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="enable-cors" defaultChecked />
                            <Label htmlFor="enable-cors">Enable CORS protection</Label>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline">Reset to Defaults</Button>
                        <Button onClick={() => toast({
                          title: "Settings Saved",
                          description: "Security settings have been updated successfully.",
                        })}>Save Changes</Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="notifications" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>
                          Configure system and user notifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">System Notifications</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notify-user-signup">New User Registrations</Label>
                              <Switch id="notify-user-signup" defaultChecked />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notify-large-trades">Large Trades</Label>
                              <Switch id="notify-large-trades" defaultChecked />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notify-system-errors">System Errors</Label>
                              <Switch id="notify-system-errors" defaultChecked />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">User Notifications</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notify-price-alerts">Price Alerts</Label>
                              <Switch id="notify-price-alerts" defaultChecked />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notify-order-execution">Order Execution</Label>
                              <Switch id="notify-order-execution" defaultChecked />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="notify-account-changes">Account Changes</Label>
                              <Switch id="notify-account-changes" defaultChecked />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Notification Channels</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="channel-email">Email Notifications</Label>
                              <Switch id="channel-email" defaultChecked />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="channel-push">Push Notifications</Label>
                              <Switch id="channel-push" defaultChecked />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="channel-sms">SMS Notifications</Label>
                              <Switch id="channel-sms" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline">Reset to Defaults</Button>
                        <Button onClick={() => toast({
                          title: "Settings Saved",
                          description: "Notification settings have been updated successfully.",
                        })}>Save Changes</Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="maintenance" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Maintenance Settings</CardTitle>
                        <CardDescription>
                          Configure system maintenance and backup settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">System Maintenance</h3>
                          <div className="space-y-2">
                            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                            <div className="flex items-center space-x-2">
                              <Switch id="maintenance-mode" />
                              <span className="text-sm text-muted-foreground">System is currently online</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maintenance-message">Maintenance Message</Label>
                            <Textarea id="maintenance-message" placeholder="Enter message to display during maintenance" className="min-h-[100px]" defaultValue="We're currently performing scheduled maintenance. Please check back soon." />
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Data Management</h3>
                          <div className="space-y-2">
                            <Label htmlFor="data-retention">Data Retention Period (days)</Label>
                            <Input id="data-retention" type="number" defaultValue="365" />
                          </div>
                          <div className="space-y-2">
                            <Label>Database Backup</Label>
                            <div className="flex space-x-2">
                              <Button variant="outline" className="flex items-center">
                                <Download className="w-4 h-4 mr-2" />
                                Backup Now
                              </Button>
                              <Button variant="outline" className="flex items-center">
                                <Upload className="w-4 h-4 mr-2" />
                                Restore
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="auto-backup">Automatic Backup Schedule</Label>
                            <Select defaultValue="daily">
                              <SelectTrigger>
                                <SelectValue placeholder="Select schedule" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">System Logs</h3>
                          <div className="space-y-2">
                            <Label htmlFor="log-level">Log Level</Label>
                            <Select defaultValue="info">
                              <SelectTrigger>
                                <SelectValue placeholder="Select log level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="debug">Debug</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Log Management</Label>
                            <div className="flex space-x-2">
                              <Button variant="outline" className="flex items-center">
                                <Eye className="w-4 h-4 mr-2" />
                                View Logs
                              </Button>
                              <Button variant="outline" className="flex items-center">
                                <Download className="w-4 h-4 mr-2" />
                                Download Logs
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline">Reset to Defaults</Button>
                        <Button onClick={() => toast({
                          title: "Settings Saved",
                          description: "Maintenance settings have been updated successfully.",
                        })}>Save Changes</Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}