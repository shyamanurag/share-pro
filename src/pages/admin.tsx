import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Head from "next/head";
import AdminLoading from "@/components/AdminLoading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Plus,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FilePdf,
  FileJson,
  CreditCard,
  Wallet,
  CircleDollarSign,
  ClipboardCheck,
  UserCheck,
  UserX,
  PieChart,
  BarChart,
  Percent
} from "lucide-react";

// Types
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  balance: number;
  createdAt: string;
  role?: string;
  isActive?: boolean;
  lastLogin?: string;
}

interface KycDetail {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  panNumber?: string;
  aadharNumber?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  documentType: string;
  documentFront: string;
  documentBack?: string;
  selfie?: string;
  status: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface PaymentRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  paymentDetails?: string;
  status: string;
  transactionId?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface LoginHistory {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  status: string;
  timestamp: string;
}

interface RiskReport {
  id: string;
  reportDate: string;
  totalUsers: number;
  activeUsers: number;
  totalExposure: number;
  equityExposure: number;
  fnoExposure: number;
  marginUtilized: number;
  riskRatio: number;
  details?: string;
  createdBy: string;
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
  const [kycRequests, setKycRequests] = useState<KycDetail[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("PENDING");
  const [paymentFilter, setPaymentFilter] = useState("PENDING");
  const [exportFormat, setExportFormat] = useState("csv");
  const [selectedKyc, setSelectedKyc] = useState<KycDetail | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalTradingVolume: 0,
    activeUsers: 0,
    pendingKyc: 2,
    pendingPayments: 1,
    totalExposure: 750000
  });

  // Fetch admin dashboard data
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      // Admin user setup is now handled in AuthContext.signIn
      
      // Mock users data for demo
      const mockUsers: UserProfile[] = [
        {
          id: "1",
          email: "admin@papertrader.app",
          name: "Admin User",
          avatarUrl: null,
          balance: 1000000,
          createdAt: new Date().toISOString(),
          role: "ADMIN",
          isActive: true,
          lastLogin: new Date().toISOString()
        },
        {
          id: "2",
          email: "demo@tradepaper.com",
          name: "Demo User",
          avatarUrl: null,
          balance: 500000,
          createdAt: new Date().toISOString(),
          role: "USER",
          isActive: true,
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          email: "user1@example.com",
          name: "Regular User",
          avatarUrl: null,
          balance: 250000,
          createdAt: new Date().toISOString(),
          role: "USER",
          isActive: true,
          lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "4",
          email: "inactive@example.com",
          name: "Inactive User",
          avatarUrl: null,
          balance: 100000,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          role: "USER",
          isActive: false,
          lastLogin: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
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
          
          // Generate mock KYC requests
          const mockKycRequests: KycDetail[] = [
            {
              id: "kyc-1",
              userId: mockUsers[1].id,
              fullName: "Demo User",
              dateOfBirth: new Date(1990, 5, 15).toISOString(),
              panNumber: "ABCDE1234F",
              aadharNumber: "1234 5678 9012",
              address: "123 Main Street",
              city: "Mumbai",
              state: "Maharashtra",
              postalCode: "400001",
              country: "India",
              documentType: "AADHAR",
              documentFront: "https://example.com/document-front.jpg",
              documentBack: "https://example.com/document-back.jpg",
              selfie: "https://example.com/selfie.jpg",
              status: "PENDING",
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                id: mockUsers[1].id,
                email: mockUsers[1].email,
                name: mockUsers[1].name
              }
            },
            {
              id: "kyc-2",
              userId: mockUsers[2].id,
              fullName: "Regular User",
              dateOfBirth: new Date(1985, 8, 22).toISOString(),
              panNumber: "PQRST5678G",
              aadharNumber: "9876 5432 1098",
              address: "456 Park Avenue",
              city: "Delhi",
              state: "Delhi",
              postalCode: "110001",
              country: "India",
              documentType: "PAN",
              documentFront: "https://example.com/document-front-2.jpg",
              documentBack: null,
              selfie: "https://example.com/selfie-2.jpg",
              status: "APPROVED",
              verifiedBy: mockUsers[0].id,
              verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                id: mockUsers[2].id,
                email: mockUsers[2].email,
                name: mockUsers[2].name
              }
            },
            {
              id: "kyc-3",
              userId: mockUsers[3].id,
              fullName: "Inactive User",
              dateOfBirth: new Date(1992, 3, 10).toISOString(),
              panNumber: "LMNOP9876H",
              aadharNumber: "5678 1234 5678",
              address: "789 Lake View",
              city: "Bangalore",
              state: "Karnataka",
              postalCode: "560001",
              country: "India",
              documentType: "AADHAR",
              documentFront: "https://example.com/document-front-3.jpg",
              documentBack: "https://example.com/document-back-3.jpg",
              selfie: "https://example.com/selfie-3.jpg",
              status: "REJECTED",
              rejectionReason: "Document unclear, please resubmit with better quality",
              verifiedBy: mockUsers[0].id,
              verifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                id: mockUsers[3].id,
                email: mockUsers[3].email,
                name: mockUsers[3].name
              }
            }
          ];
          
          // Generate mock payment requests
          const mockPaymentRequests: PaymentRequest[] = [
            {
              id: "payment-1",
              userId: mockUsers[1].id,
              amount: 10000,
              paymentMethod: "UPI",
              paymentDetails: JSON.stringify({ upiId: "demo@upi" }),
              status: "PENDING",
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                id: mockUsers[1].id,
                email: mockUsers[1].email,
                name: mockUsers[1].name
              }
            },
            {
              id: "payment-2",
              userId: mockUsers[2].id,
              amount: 25000,
              paymentMethod: "CARD",
              paymentDetails: JSON.stringify({ cardNumber: "xxxx-xxxx-xxxx-1234" }),
              status: "APPROVED",
              transactionId: "TXN-123456789",
              approvedBy: mockUsers[0].id,
              approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                id: mockUsers[2].id,
                email: mockUsers[2].email,
                name: mockUsers[2].name
              }
            },
            {
              id: "payment-3",
              userId: mockUsers[3].id,
              amount: 5000,
              paymentMethod: "UPI",
              paymentDetails: JSON.stringify({ upiId: "inactive@upi" }),
              status: "REJECTED",
              rejectionReason: "Payment failed at gateway",
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                id: mockUsers[3].id,
                email: mockUsers[3].email,
                name: mockUsers[3].name
              }
            }
          ];
          
          // Generate mock login history
          const mockLoginHistory: LoginHistory[] = [
            {
              id: "login-1",
              userId: mockUsers[0].id,
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              deviceInfo: "Windows 10, Chrome 91.0.4472.124",
              location: "Mumbai, India",
              status: "SUCCESS",
              timestamp: new Date().toISOString()
            },
            {
              id: "login-2",
              userId: mockUsers[1].id,
              ipAddress: "192.168.1.2",
              userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
              deviceInfo: "iPhone, iOS 14.6, Safari",
              location: "Delhi, India",
              status: "SUCCESS",
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "login-3",
              userId: mockUsers[2].id,
              ipAddress: "192.168.1.3",
              userAgent: "Mozilla/5.0 (Linux; Android 11; SM-G998B)",
              deviceInfo: "Samsung Galaxy S21, Android 11, Chrome",
              location: "Bangalore, India",
              status: "SUCCESS",
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: "login-4",
              userId: mockUsers[3].id,
              ipAddress: "192.168.1.4",
              userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              deviceInfo: "Windows 10, Chrome 91.0.4472.124",
              location: "Chennai, India",
              status: "FAILED",
              timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
          
          // Generate mock risk report
          const mockRiskReport: RiskReport = {
            id: "risk-1",
            reportDate: new Date().toISOString(),
            totalUsers: mockUsers.length,
            activeUsers: mockUsers.filter(u => u.isActive).length,
            totalExposure: 750000,
            equityExposure: 500000,
            fnoExposure: 250000,
            marginUtilized: 125000,
            riskRatio: 0.42,
            details: JSON.stringify({
              userMetrics: {
                totalUsers: mockUsers.length,
                activeUsers: mockUsers.filter(u => u.isActive).length,
                inactiveUsers: mockUsers.filter(u => !u.isActive).length
              },
              exposureMetrics: {
                equityExposure: 500000,
                fnoExposure: 250000,
                totalExposure: 750000,
                marginUtilized: 125000
              },
              riskMetrics: {
                riskRatio: 0.42,
                totalUserBalances: mockUsers.reduce((sum, u) => sum + u.balance, 0),
                highRiskUsers: 1
              }
            }),
            createdBy: mockUsers[0].id,
            createdAt: new Date().toISOString()
          };
          
          // Set data
          setTransactions(mockTransactions);
          setUsers(mockUsers);
          setKycRequests(mockKycRequests);
          setPaymentRequests(mockPaymentRequests);
          setLoginHistory(mockLoginHistory);
          setRiskReport(mockRiskReport);
          
          // Set stats
          setStats({
            totalUsers: mockUsers.length,
            totalTransactions: mockTransactions.length,
            totalTradingVolume: mockTransactions.reduce((sum, t) => sum + t.total, 0),
            activeUsers: mockUsers.filter(u => u.isActive).length,
            pendingKyc: mockKycRequests.filter(k => k.status === 'PENDING').length,
            pendingPayments: mockPaymentRequests.filter(p => p.status === 'PENDING').length,
            totalExposure: mockRiskReport.totalExposure
          });
          
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error loading admin data:", err);
          setIsLoading(false);
        });
    }
  }, [user]);

  // Filter data based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredKycRequests = kycRequests.filter(kyc => 
    kyc.status === kycFilter || kycFilter === 'ALL'
  );
  
  const filteredPaymentRequests = paymentRequests.filter(payment => 
    payment.status === paymentFilter || paymentFilter === 'ALL'
  );
  
  // Handle KYC approval/rejection
  const handleKycAction = (kycId: string, action: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    setIsLoading(true);
    
    // In a real implementation, this would be an API call
    setTimeout(() => {
      const updatedKycRequests = kycRequests.map(kyc => {
        if (kyc.id === kycId) {
          return {
            ...kyc,
            status: action,
            rejectionReason: action === 'REJECTED' ? rejectionReason : undefined,
            verifiedBy: user?.id,
            verifiedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return kyc;
      });
      
      setKycRequests(updatedKycRequests);
      setStats({
        ...stats,
        pendingKyc: updatedKycRequests.filter(k => k.status === 'PENDING').length
      });
      
      toast({
        title: `KYC ${action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        description: `KYC request has been ${action.toLowerCase()} successfully.`,
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  // Handle payment approval/rejection
  const handlePaymentAction = (paymentId: string, action: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    setIsLoading(true);
    
    // In a real implementation, this would be an API call
    setTimeout(() => {
      const updatedPaymentRequests = paymentRequests.map(payment => {
        if (payment.id === paymentId) {
          return {
            ...payment,
            status: action,
            rejectionReason: action === 'REJECTED' ? rejectionReason : undefined,
            approvedBy: action === 'APPROVED' ? user?.id : undefined,
            approvedAt: action === 'APPROVED' ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return payment;
      });
      
      setPaymentRequests(updatedPaymentRequests);
      setStats({
        ...stats,
        pendingPayments: updatedPaymentRequests.filter(p => p.status === 'PENDING').length
      });
      
      toast({
        title: `Payment ${action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        description: `Payment request has been ${action.toLowerCase()} successfully.`,
      });
      
      setIsLoading(false);
    }, 1000);
  };
  
  // Handle report export
  const handleExportReport = (reportType: string) => {
    setIsLoading(true);
    
    // In a real implementation, this would be an API call
    setTimeout(() => {
      toast({
        title: "Report Generated",
        description: `${reportType} report has been generated in ${exportFormat.toUpperCase()} format.`,
      });
      
      setIsLoading(false);
    }, 1500);
  };

  const { initializing } = useAuth();
  
  // Check if user is admin - simplified check that treats demo user as admin
  const isAdmin = user && (
    user.email === "admin@papertrader.app" || 
    user.email === "demo@papertrader.app" || 
    user.user_metadata?.role === "ADMIN" ||
    user.app_metadata?.role === "ADMIN" ||
    localStorage.getItem('adminUser') === 'true' ||
    sessionStorage.getItem('adminUser') === 'true'
  );

  useEffect(() => {
    console.log('Admin check - User email:', user?.email);
    console.log('Admin check - User metadata:', user?.user_metadata);
    console.log('Admin check - App metadata:', user?.app_metadata);
    console.log('Admin check - Is admin:', isAdmin);
    console.log('Admin check - Session storage:', {
      adminUser: sessionStorage.getItem('adminUser'),
      adminLoginAttempt: sessionStorage.getItem('adminLoginAttempt'),
      adminLoginTime: sessionStorage.getItem('adminLoginTime')
    });
    console.log('Admin check - Local storage:', {
      adminUser: localStorage.getItem('adminUser')
    });
    
    // Simplified admin access check with fallbacks
    
    // 1. Check for admin flags in storage first (most reliable)
    const adminUserFlag = localStorage.getItem('adminUser') === 'true' || sessionStorage.getItem('adminUser') === 'true';
    
    // 2. If admin flag is set, ensure it stays set and grant access
    if (adminUserFlag) {
      console.log('Admin flag detected in storage, granting admin access');
      // Ensure both storage locations have the flag
      localStorage.setItem('adminUser', 'true');
      sessionStorage.setItem('adminUser', 'true');
      return;
    }
    
    // 3. If auth is still initializing, wait
    if (initializing) {
      console.log('Auth still initializing, waiting...');
      return;
    }
    
    // 4. Check for recent admin login attempt
    const adminLoginAttempt = sessionStorage.getItem('adminLoginAttempt') === 'true';
    const adminLoginTime = sessionStorage.getItem('adminLoginTime');
    const isRecentAdminLogin = adminLoginTime && (Date.now() - parseInt(adminLoginTime)) < 300000; // Extended to 5 minutes
    
    // 5. If there was a recent login attempt, grant temporary access
    if (adminLoginAttempt && isRecentAdminLogin) {
      console.log('Recent admin login detected, granting temporary access');
      // Set admin flag to ensure access
      localStorage.setItem('adminUser', 'true');
      sessionStorage.setItem('adminUser', 'true');
      return;
    }
    
    // 6. If we have a user, check if it's the demo user or has admin role
    if (user) {
      // Force demo@papertrader.app to be treated as admin regardless of metadata
      if (user.email === "demo@papertrader.app" || user.email === "admin@papertrader.app") {
        console.log('Demo/admin user detected, granting admin access');
        // Ensure admin flags are set
        localStorage.setItem('adminUser', 'true');
        sessionStorage.setItem('adminUser', 'true');
        return;
      }
      
      // Check for admin role in metadata
      if (user.user_metadata?.role === "ADMIN" || user.app_metadata?.role === "ADMIN") {
        console.log('Admin role detected in metadata, granting admin access');
        localStorage.setItem('adminUser', 'true');
        sessionStorage.setItem('adminUser', 'true');
        return;
      }
      
      // If user is not admin, redirect to dashboard
      console.log('User is not admin, redirecting to dashboard');
      window.location.href = '/dashboard-india';
      return;
    }
    
    // 7. If no user and no admin flags, redirect to our static admin login
    console.log('No user or admin flags found, redirecting to admin login');
    window.location.href = '/admin-auth.html';
    
  }, [user, isAdmin, initializing]);

  if (!user || initializing) {
    return <AdminLoading />;
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
              variant={activeTab === "kyc" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("kyc")}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              KYC Verification
              {stats.pendingKyc > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {stats.pendingKyc}
                </Badge>
              )}
            </Button>
            <Button 
              variant={activeTab === "payments" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("payments")}
            >
              <CircleDollarSign className="mr-2 h-4 w-4" />
              Payments
              {stats.pendingPayments > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {stats.pendingPayments}
                </Badge>
              )}
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
              variant={activeTab === "risk" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("risk")}
            >
              <PieChart className="mr-2 h-4 w-4" />
              Risk Management
            </Button>
            <Button 
              variant={activeTab === "reports" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("reports")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
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
                <p className="text-xs text-muted-foreground">admin@papertrader.app</p>
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
            
            {activeTab === "kyc" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">KYC Verification</h1>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between mb-6">
                  <div className="flex space-x-2">
                    <Button 
                      variant={kycFilter === "ALL" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setKycFilter("ALL")}
                    >
                      All
                    </Button>
                    <Button 
                      variant={kycFilter === "PENDING" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setKycFilter("PENDING")}
                      className="flex items-center"
                    >
                      Pending
                      {stats.pendingKyc > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {stats.pendingKyc}
                        </Badge>
                      )}
                    </Button>
                    <Button 
                      variant={kycFilter === "APPROVED" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setKycFilter("APPROVED")}
                    >
                      Approved
                    </Button>
                    <Button 
                      variant={kycFilter === "REJECTED" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setKycFilter("REJECTED")}
                    >
                      Rejected
                    </Button>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      className="pl-10 pr-4 py-2 w-full"
                    />
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKycRequests.map(kyc => (
                        <TableRow key={kyc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium">{kyc.fullName}</p>
                                <p className="text-xs text-muted-foreground">{kyc.user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{kyc.documentType}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(kyc.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {kyc.status === "PENDING" && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                                Pending
                              </Badge>
                            )}
                            {kyc.status === "APPROVED" && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                Approved
                              </Badge>
                            )}
                            {kyc.status === "REJECTED" && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>KYC Details</DialogTitle>
                                    <DialogDescription>
                                      Review KYC information and documents
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <div className="flex items-center gap-4 mb-6">
                                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                        <User className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-bold">{kyc.fullName}</h3>
                                        <p className="text-muted-foreground">{kyc.user.email}</p>
                                      </div>
                                      <div className="ml-auto">
                                        {kyc.status === "PENDING" && (
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                                            Pending
                                          </Badge>
                                        )}
                                        {kyc.status === "APPROVED" && (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                            Approved
                                          </Badge>
                                        )}
                                        {kyc.status === "REJECTED" && (
                                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                            Rejected
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="text-sm font-semibold mb-3">Personal Information</h4>
                                        <Card>
                                          <CardContent className="p-4">
                                            <div className="space-y-3">
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Full Name</p>
                                                  <p className="font-medium">{kyc.fullName}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                                                  <p className="font-medium">{new Date(kyc.dateOfBirth).toLocaleDateString()}</p>
                                                </div>
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <p className="text-xs text-muted-foreground">PAN Number</p>
                                                  <p className="font-medium">{kyc.panNumber || "N/A"}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Aadhar Number</p>
                                                  <p className="font-medium">{kyc.aadharNumber || "N/A"}</p>
                                                </div>
                                              </div>
                                              
                                              <div>
                                                <p className="text-xs text-muted-foreground">Address</p>
                                                <p className="font-medium">{kyc.address}</p>
                                                <p className="font-medium">{kyc.city}, {kyc.state} {kyc.postalCode}</p>
                                                <p className="font-medium">{kyc.country}</p>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                      
                                      <div>
                                        <h4 className="text-sm font-semibold mb-3">Document Information</h4>
                                        <Card>
                                          <CardContent className="p-4">
                                            <div className="space-y-3">
                                              <div>
                                                <p className="text-xs text-muted-foreground">Document Type</p>
                                                <p className="font-medium">{kyc.documentType}</p>
                                              </div>
                                              
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Document Front</p>
                                                  <div className="mt-1 h-32 bg-muted rounded-md flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                                  </div>
                                                </div>
                                                
                                                {kyc.documentBack && (
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Document Back</p>
                                                    <div className="mt-1 h-32 bg-muted rounded-md flex items-center justify-center">
                                                      <FileText className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                              
                                              {kyc.selfie && (
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Selfie</p>
                                                  <div className="mt-1 h-32 bg-muted rounded-md flex items-center justify-center">
                                                    <User className="h-8 w-8 text-muted-foreground" />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    </div>
                                    
                                    {kyc.status === "REJECTED" && (
                                      <div className="mt-6">
                                        <h4 className="text-sm font-semibold mb-3">Rejection Reason</h4>
                                        <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                                          <CardContent className="p-4">
                                            <p className="text-red-700 dark:text-red-400">{kyc.rejectionReason}</p>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    )}
                                    
                                    {kyc.status === "PENDING" && (
                                      <div className="mt-6 flex space-x-4">
                                        <Button 
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            handleKycAction(kyc.id, "APPROVED");
                                          }}
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Approve KYC
                                        </Button>
                                        
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="destructive" className="flex-1">
                                              <XCircle className="mr-2 h-4 w-4" />
                                              Reject KYC
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Reject KYC</DialogTitle>
                                              <DialogDescription>
                                                Please provide a reason for rejecting this KYC request.
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                              <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                              <Textarea 
                                                id="rejection-reason" 
                                                placeholder="Enter reason for rejection"
                                                className="mt-2"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                              />
                                            </div>
                                            <DialogFooter>
                                              <Button variant="outline">Cancel</Button>
                                              <Button 
                                                variant="destructive"
                                                onClick={() => {
                                                  if (rejectionReason.trim()) {
                                                    handleKycAction(kyc.id, "REJECTED", rejectionReason);
                                                    setRejectionReason("");
                                                  } else {
                                                    toast({
                                                      variant: "destructive",
                                                      title: "Rejection reason required",
                                                      description: "Please provide a reason for rejection.",
                                                    });
                                                  }
                                                }}
                                              >
                                                Confirm Rejection
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline">Close</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              {kyc.status === "PENDING" && (
                                <>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleKycAction(kyc.id, "APPROVED")}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <XCircle className="w-3.5 h-3.5" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject KYC</DialogTitle>
                                        <DialogDescription>
                                          Please provide a reason for rejecting this KYC request.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="py-4">
                                        <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                        <Textarea 
                                          id="rejection-reason" 
                                          placeholder="Enter reason for rejection"
                                          className="mt-2"
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline">Cancel</Button>
                                        <Button 
                                          variant="destructive"
                                          onClick={() => {
                                            if (rejectionReason.trim()) {
                                              handleKycAction(kyc.id, "REJECTED", rejectionReason);
                                              setRejectionReason("");
                                            } else {
                                              toast({
                                                variant: "destructive",
                                                title: "Rejection reason required",
                                                description: "Please provide a reason for rejection.",
                                              });
                                            }
                                          }}
                                        >
                                          Confirm Rejection
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {filteredKycRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <ClipboardCheck className="h-12 w-12 mb-4 opacity-50" />
                              <p>No KYC requests found with the selected filter.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            
            {activeTab === "payments" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Payment Requests</h1>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between mb-6">
                  <div className="flex space-x-2">
                    <Button 
                      variant={paymentFilter === "ALL" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setPaymentFilter("ALL")}
                    >
                      All
                    </Button>
                    <Button 
                      variant={paymentFilter === "PENDING" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setPaymentFilter("PENDING")}
                      className="flex items-center"
                    >
                      Pending
                      {stats.pendingPayments > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {stats.pendingPayments}
                        </Badge>
                      )}
                    </Button>
                    <Button 
                      variant={paymentFilter === "APPROVED" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setPaymentFilter("APPROVED")}
                    >
                      Approved
                    </Button>
                    <Button 
                      variant={paymentFilter === "REJECTED" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setPaymentFilter("REJECTED")}
                    >
                      Rejected
                    </Button>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      className="pl-10 pr-4 py-2 w-full"
                    />
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentRequests.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium">{payment.user.name || "User"}</p>
                                <p className="text-xs text-muted-foreground">{payment.user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium flex items-center">
                              <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                              {payment.amount.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.paymentMethod === "UPI" ? (
                                <div className="flex items-center">
                                  <Wallet className="w-3 h-3 mr-1" />
                                  UPI
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Card
                                </div>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {payment.status === "PENDING" && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                                Pending
                              </Badge>
                            )}
                            {payment.status === "APPROVED" && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                Approved
                              </Badge>
                            )}
                            {payment.status === "REJECTED" && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Payment Request Details</DialogTitle>
                                    <DialogDescription>
                                      Review payment request information
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <div className="flex items-center gap-4 mb-6">
                                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                        <User className="w-8 h-8 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-bold">{payment.user.name || "User"}</h3>
                                        <p className="text-muted-foreground">{payment.user.email}</p>
                                      </div>
                                      <div className="ml-auto">
                                        {payment.status === "PENDING" && (
                                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                                            Pending
                                          </Badge>
                                        )}
                                        {payment.status === "APPROVED" && (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                            Approved
                                          </Badge>
                                        )}
                                        {payment.status === "REJECTED" && (
                                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                            Rejected
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <Card>
                                      <CardContent className="p-4">
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Amount</p>
                                              <p className="text-xl font-bold flex items-center">
                                                <IndianRupee className="w-4 h-4 mr-0.5" />
                                                {payment.amount.toFixed(2)}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">Payment Method</p>
                                              <div className="flex items-center mt-1">
                                                {payment.paymentMethod === "UPI" ? (
                                                  <>
                                                    <Wallet className="w-4 h-4 mr-1 text-blue-500" />
                                                    <span className="font-medium">UPI</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <CreditCard className="w-4 h-4 mr-1 text-purple-500" />
                                                    <span className="font-medium">Credit/Debit Card</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Request Date</p>
                                              <p className="font-medium">
                                                {new Date(payment.createdAt).toLocaleString()}
                                              </p>
                                            </div>
                                            {payment.status === "APPROVED" && payment.approvedAt && (
                                              <div>
                                                <p className="text-xs text-muted-foreground">Approved Date</p>
                                                <p className="font-medium">
                                                  {new Date(payment.approvedAt).toLocaleString()}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {payment.paymentMethod === "UPI" && payment.paymentDetails && (
                                            <div>
                                              <p className="text-xs text-muted-foreground">UPI Details</p>
                                              <div className="mt-1 p-3 bg-muted rounded-md">
                                                <p className="font-mono text-sm">
                                                  UPI ID: {JSON.parse(payment.paymentDetails).upiId}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {payment.paymentMethod === "CARD" && payment.paymentDetails && (
                                            <div>
                                              <p className="text-xs text-muted-foreground">Card Details</p>
                                              <div className="mt-1 p-3 bg-muted rounded-md">
                                                <p className="font-mono text-sm">
                                                  Card: **** **** **** {JSON.parse(payment.paymentDetails).cardNumber}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {payment.status === "APPROVED" && payment.transactionId && (
                                            <div>
                                              <p className="text-xs text-muted-foreground">Transaction ID</p>
                                              <p className="font-mono text-sm mt-1">{payment.transactionId}</p>
                                            </div>
                                          )}
                                          
                                          {payment.status === "REJECTED" && payment.rejectionReason && (
                                            <div>
                                              <p className="text-xs text-muted-foreground">Rejection Reason</p>
                                              <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/10 rounded-md">
                                                <p className="text-red-700 dark:text-red-400">{payment.rejectionReason}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    {payment.status === "PENDING" && (
                                      <div className="mt-6 flex space-x-4">
                                        <Button 
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            handlePaymentAction(payment.id, "APPROVED");
                                          }}
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Approve Payment
                                        </Button>
                                        
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="destructive" className="flex-1">
                                              <XCircle className="mr-2 h-4 w-4" />
                                              Reject Payment
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Reject Payment</DialogTitle>
                                              <DialogDescription>
                                                Please provide a reason for rejecting this payment request.
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                              <Label htmlFor="payment-rejection-reason">Rejection Reason</Label>
                                              <Textarea 
                                                id="payment-rejection-reason" 
                                                placeholder="Enter reason for rejection"
                                                className="mt-2"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                              />
                                            </div>
                                            <DialogFooter>
                                              <Button variant="outline">Cancel</Button>
                                              <Button 
                                                variant="destructive"
                                                onClick={() => {
                                                  if (rejectionReason.trim()) {
                                                    handlePaymentAction(payment.id, "REJECTED", rejectionReason);
                                                    setRejectionReason("");
                                                  } else {
                                                    toast({
                                                      variant: "destructive",
                                                      title: "Rejection reason required",
                                                      description: "Please provide a reason for rejection.",
                                                    });
                                                  }
                                                }}
                                              >
                                                Confirm Rejection
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline">Close</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              {payment.status === "PENDING" && (
                                <>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handlePaymentAction(payment.id, "APPROVED")}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <XCircle className="w-3.5 h-3.5" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Reject Payment</DialogTitle>
                                        <DialogDescription>
                                          Please provide a reason for rejecting this payment request.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="py-4">
                                        <Label htmlFor="payment-rejection-reason">Rejection Reason</Label>
                                        <Textarea 
                                          id="payment-rejection-reason" 
                                          placeholder="Enter reason for rejection"
                                          className="mt-2"
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline">Cancel</Button>
                                        <Button 
                                          variant="destructive"
                                          onClick={() => {
                                            if (rejectionReason.trim()) {
                                              handlePaymentAction(payment.id, "REJECTED", rejectionReason);
                                              setRejectionReason("");
                                            } else {
                                              toast({
                                                variant: "destructive",
                                                title: "Rejection reason required",
                                                description: "Please provide a reason for rejection.",
                                              });
                                            }
                                          }}
                                        >
                                          Confirm Rejection
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {filteredPaymentRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <CircleDollarSign className="h-12 w-12 mb-4 opacity-50" />
                              <p>No payment requests found with the selected filter.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            
            {activeTab === "risk" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Risk Management</h1>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => {
                          toast({
                            title: "Risk Report Generated",
                            description: "New risk report has been generated successfully.",
                          });
                          setIsLoading(false);
                        }, 1500);
                      }}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Generate New Report
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleExportReport('risk')}
                    >
                      <Download className="w-4 h-4" />
                      Export Report
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">
                          Total Exposure
                        </CardTitle>
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-400 flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {riskReport?.totalExposure.toLocaleString()}
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                        Combined equity and F&O exposure
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Equity Exposure
                        </CardTitle>
                        <LineChart className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {riskReport?.equityExposure.toLocaleString()}
                      </div>
                      <div className="w-full h-2 bg-muted mt-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(riskReport?.equityExposure || 0) / (riskReport?.totalExposure || 1) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          F&O Exposure
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold flex items-center">
                        <IndianRupee className="w-5 h-5 mr-1" />
                        {riskReport?.fnoExposure.toLocaleString()}
                      </div>
                      <div className="w-full h-2 bg-muted mt-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500" 
                          style={{ width: `${(riskReport?.fnoExposure || 0) / (riskReport?.totalExposure || 1) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Risk Ratio
                        </CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(riskReport?.riskRatio || 0).toFixed(2)}
                      </div>
                      <div className="w-full h-2 bg-muted mt-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${(riskReport?.riskRatio || 0) > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${(riskReport?.riskRatio || 0) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Exposure Breakdown</CardTitle>
                      <CardDescription>
                        Distribution of exposure across different segments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-48 h-48 rounded-full border-8 border-muted relative">
                          <div 
                            className="absolute inset-0 bg-blue-500 rounded-full"
                            style={{ 
                              clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(2 * Math.PI * (riskReport?.equityExposure || 0) / (riskReport?.totalExposure || 1))}% ${50 + 50 * Math.sin(2 * Math.PI * (riskReport?.equityExposure || 0) / (riskReport?.totalExposure || 1))}%)` 
                            }}
                          ></div>
                          <div 
                            className="absolute inset-0 bg-purple-500 rounded-full"
                            style={{ 
                              clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(2 * Math.PI * (riskReport?.equityExposure || 0) / (riskReport?.totalExposure || 1))}% ${50 + 50 * Math.sin(2 * Math.PI * (riskReport?.equityExposure || 0) / (riskReport?.totalExposure || 1))}%, 100% 50%, 50% 100%, 0% 50%)` 
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-background rounded-full flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-bold flex items-center justify-center">
                                  <IndianRupee className="w-3 h-3 mr-0.5" />
                                  {riskReport?.totalExposure.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <div>
                            <p className="text-sm">Equity</p>
                            <p className="text-xs text-muted-foreground">
                              {((riskReport?.equityExposure || 0) / (riskReport?.totalExposure || 1) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                          <div>
                            <p className="text-sm">F&O</p>
                            <p className="text-xs text-muted-foreground">
                              {((riskReport?.fnoExposure || 0) / (riskReport?.totalExposure || 1) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Metrics</CardTitle>
                      <CardDescription>
                        Key risk indicators and metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <p className="text-sm font-medium">Margin Utilization</p>
                            <p className="text-sm font-medium">
                              {((riskReport?.marginUtilized || 0) / (riskReport?.fnoExposure || 1) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500" 
                              style={{ width: `${(riskReport?.marginUtilized || 0) / (riskReport?.fnoExposure || 1) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <p className="text-sm font-medium">Exposure to Balance Ratio</p>
                            <p className="text-sm font-medium">
                              {riskReport?.riskRatio.toFixed(2)}
                            </p>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${(riskReport?.riskRatio || 0) > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${(riskReport?.riskRatio || 0) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">Active Users</p>
                            <p className="text-xl font-bold">{riskReport?.activeUsers}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">High Risk Users</p>
                            <p className="text-xl font-bold">1</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Risk Report Details</CardTitle>
                        <CardDescription>
                          Generated on {riskReport ? new Date(riskReport.reportDate).toLocaleString() : new Date().toLocaleString()}
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        Download Full Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Exposure</TableCell>
                          <TableCell>₹{riskReport?.totalExposure.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                              Normal
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Equity Exposure</TableCell>
                          <TableCell>₹{riskReport?.equityExposure.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              Low Risk
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>F&O Exposure</TableCell>
                          <TableCell>₹{riskReport?.fnoExposure.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                              Medium Risk
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Margin Utilized</TableCell>
                          <TableCell>₹{riskReport?.marginUtilized.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                              Medium Risk
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Risk Ratio</TableCell>
                          <TableCell>{riskReport?.riskRatio.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                              Medium Risk
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
            
            {activeTab === "reports" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Reports</h1>
                  <div className="flex space-x-2">
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">
                          <div className="flex items-center">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            CSV
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <div className="flex items-center">
                            <FilePdf className="w-4 h-4 mr-2" />
                            PDF
                          </div>
                        </SelectItem>
                        <SelectItem value="json">
                          <div className="flex items-center">
                            <FileJson className="w-4 h-4 mr-2" />
                            JSON
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <Card className="hover:border-blue-500/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>User Reports</CardTitle>
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <CardDescription>
                        User registration, activity, and demographics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('users')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-blue-500" />
                              <span className="font-medium">User List</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Complete list of all users with details
                          </p>
                        </div>
                        
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('user-activity')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Activity className="w-4 h-4 mr-2 text-blue-500" />
                              <span className="font-medium">User Activity</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Login history and user actions
                          </p>
                        </div>
                        
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('kyc-status')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <ClipboardCheck className="w-4 h-4 mr-2 text-blue-500" />
                              <span className="font-medium">KYC Status</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            KYC verification status for all users
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:border-green-500/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Financial Reports</CardTitle>
                        <IndianRupee className="h-5 w-5 text-green-500" />
                      </div>
                      <CardDescription>
                        Transactions, payments, and financial metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('transactions')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <ArrowUpRight className="w-4 h-4 mr-2 text-green-500" />
                              <span className="font-medium">Transactions</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            All trading transactions with details
                          </p>
                        </div>
                        
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('payments')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Wallet className="w-4 h-4 mr-2 text-green-500" />
                              <span className="font-medium">Payment Requests</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            All payment requests and their status
                          </p>
                        </div>
                        
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('portfolio-summary')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Briefcase className="w-4 h-4 mr-2 text-green-500" />
                              <span className="font-medium">Portfolio Summary</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Summary of all user portfolios
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:border-purple-500/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Risk Reports</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-purple-500" />
                      </div>
                      <CardDescription>
                        Risk metrics, exposure, and compliance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('risk-exposure')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <PieChart className="w-4 h-4 mr-2 text-purple-500" />
                              <span className="font-medium">Risk Exposure</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Detailed breakdown of risk exposure
                          </p>
                        </div>
                        
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('fno-positions')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                              <span className="font-medium">F&O Positions</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            All futures and options positions
                          </p>
                        </div>
                        
                        <div 
                          className="p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleExportReport('margin-utilization')}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Percent className="w-4 h-4 mr-2 text-purple-500" />
                              <span className="font-medium">Margin Utilization</span>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Margin utilization by users and segments
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Report</CardTitle>
                    <CardDescription>
                      Generate a custom report with specific parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="report-type">Report Type</Label>
                            <Select defaultValue="transactions">
                              <SelectTrigger>
                                <SelectValue placeholder="Select report type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="users">Users</SelectItem>
                                <SelectItem value="transactions">Transactions</SelectItem>
                                <SelectItem value="kyc">KYC Verification</SelectItem>
                                <SelectItem value="payments">Payments</SelectItem>
                                <SelectItem value="risk">Risk Metrics</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="date-range">Date Range</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <Input type="date" placeholder="Start date" />
                              <Input type="date" placeholder="End date" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="format">Export Format</Label>
                            <RadioGroup defaultValue="csv" className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="csv" id="csv" />
                                <Label htmlFor="csv" className="flex items-center">
                                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                                  CSV
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pdf" id="pdf" />
                                <Label htmlFor="pdf" className="flex items-center">
                                  <FilePdf className="w-4 h-4 mr-1" />
                                  PDF
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="json" id="json" />
                                <Label htmlFor="json" className="flex items-center">
                                  <FileJson className="w-4 h-4 mr-1" />
                                  JSON
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Include Fields</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center space-x-2">
                                <Switch id="field-user" defaultChecked />
                                <Label htmlFor="field-user">User Information</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="field-amount" defaultChecked />
                                <Label htmlFor="field-amount">Amount/Value</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="field-date" defaultChecked />
                                <Label htmlFor="field-date">Date/Time</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="field-status" defaultChecked />
                                <Label htmlFor="field-status">Status</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="field-details" defaultChecked />
                                <Label htmlFor="field-details">Details</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="field-metrics" defaultChecked />
                                <Label htmlFor="field-metrics">Metrics</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="additional-filters">Additional Filters</Label>
                            <Textarea 
                              id="additional-filters" 
                              placeholder="Enter any additional filters or notes for the report"
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      className="flex items-center"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => {
                          toast({
                            title: "Custom Report Generated",
                            description: "Your custom report has been generated successfully.",
                          });
                          setIsLoading(false);
                        }, 1500);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Generate Report
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
            
            {activeTab === "stocks" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Stock Management</h1>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        setIsLoading(true);
                        fetch('/api/stocks/replace-with-indian', {
                          method: 'POST',
                        })
                          .then(response => response.json())
                          .then(data => {
                            setStocks(data.stocks);
                            toast({
                              title: "Stocks Replaced",
                              description: "All stocks have been replaced with Indian NSE stocks.",
                            });
                          })
                          .catch(error => {
                            console.error('Error replacing stocks:', error);
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to replace stocks with Indian stocks.",
                            });
                          })
                          .finally(() => {
                            setIsLoading(false);
                          });
                      }}
                    >
                      <IndianRupee className="w-4 h-4 mr-1" />
                      Replace with Indian Stocks
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => router.push('/admin/replace-stocks')}
                    >
                      <IndianRupee className="w-4 h-4 mr-1" />
                      Stock Replacement Page
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
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