import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { 
  ArrowLeft,
  Calculator,
  TrendingUp,
  BarChart4,
  Layers,
  Percent,
  RefreshCw,
  IndianRupee,
  Clock,
  AlertTriangle,
  ChevronRight,
  LineChart,
  Zap,
  Target,
  Shuffle,
  Repeat,
  Gauge,
  ArrowUpDown,
  Sparkles,
  Lightbulb,
  Rocket,
  Cpu
} from "lucide-react";

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

interface AlgoTemplate {
  id: string;
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    default: number;
    description: string;
  }[];
}

export default function AdvancedTrading() {
  const { user } = useAuth();
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("position-calculator");
  const [algoTemplates, setAlgoTemplates] = useState<AlgoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AlgoTemplate | null>(null);

  // Position Calculator state
  const [posCalcState, setPosCalcState] = useState({
    riskAmount: 1000,
    riskPercentage: 1,
    stopLossPercentage: 5,
    stopLossPrice: 0,
    entryPrice: 0,
    useFixedRisk: true,
    usePercentageStopLoss: true,
  });

  // Trailing Stop state
  const [trailingStopState, setTrailingStopState] = useState({
    type: "BUY",
    quantity: 10,
    trailingAmount: 0,
    trailingPercent: 2,
    activationPrice: 0,
    usePercentage: true,
  });

  // OCO Order state
  const [ocoState, setOcoState] = useState({
    type: "BUY",
    quantity: 10,
    limitPrice: 0,
    stopPrice: 0,
  });

  // Algo Trading state
  const [algoState, setAlgoState] = useState({
    templateId: "",
    parameters: {} as Record<string, number>,
  });

  // Backtest state
  const [backtestState, setBacktestState] = useState({
    strategy: "moving-average-crossover",
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    initialCapital: 100000,
    parameters: {
      shortPeriod: 10,
      longPeriod: 50,
    },
  });

  // Margin Trading state
  const [marginState, setMarginState] = useState({
    type: "BUY",
    quantity: 10,
    leverage: 2,
  });

  // Futures Trading state
  const [futuresState, setFuturesState] = useState({
    type: "BUY",
    quantity: 1,
    selectedContractId: "",
  });

  // Options Trading state
  const [optionsState, setOptionsState] = useState({
    type: "BUY",
    quantity: 1,
    selectedContractId: "",
    optionType: "CALL", // "CALL" or "PUT"
    strikePrice: 0,
    expiryDate: "",
  });

  // Available contracts
  const [futuresContracts, setFuturesContracts] = useState<any[]>([]);
  const [optionsContracts, setOptionsContracts] = useState<any[]>([]);

  // Calculation results
  const [positionCalcResult, setPositionCalcResult] = useState<any>(null);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [marginInfo, setMarginInfo] = useState<any>(null);

  // Fetch stocks
  const fetchStocks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stocks');
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const data = await response.json();
      setStocks(data.stocks);
      
      // Set default selected stock
      if (data.stocks.length > 0) {
        const stock = data.stocks[0];
        setSelectedStock(stock);
        
        // Update state with stock price
        setPosCalcState(prev => ({
          ...prev,
          entryPrice: stock.currentPrice,
          stopLossPrice: stock.currentPrice * 0.95,
        }));
        
        setTrailingStopState(prev => ({
          ...prev,
          activationPrice: stock.currentPrice,
          trailingAmount: stock.currentPrice * 0.02,
        }));
        
        setOcoState(prev => ({
          ...prev,
          limitPrice: stock.currentPrice * 1.05,
          stopPrice: stock.currentPrice * 0.95,
        }));
      }
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

  // Fetch algo templates
  const fetchAlgoTemplates = async () => {
    try {
      const response = await fetch('/api/trading/algo-templates');
      if (!response.ok) throw new Error('Failed to fetch algo templates');
      const data = await response.json();
      setAlgoTemplates(data.templates);
      
      // Set default selected template
      if (data.templates.length > 0) {
        setSelectedTemplate(data.templates[0]);
        setAlgoState(prev => ({
          ...prev,
          templateId: data.templates[0].id,
          parameters: data.templates[0].parameters.reduce((acc: Record<string, number>, param: any) => {
            acc[param.name] = param.default;
            return acc;
          }, {}),
        }));
      }
    } catch (error) {
      console.error('Error fetching algo templates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch algo templates",
      });
    }
  };

  // Fetch margin info
  const fetchMarginInfo = async () => {
    try {
      const response = await fetch('/api/trading/margin');
      if (!response.ok) throw new Error('Failed to fetch margin info');
      const data = await response.json();
      setMarginInfo(data.marginInfo);
    } catch (error) {
      console.error('Error fetching margin info:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch margin info",
      });
    }
  };

  // Fetch futures contracts
  const fetchFuturesContracts = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/fno/futures?stockId=${selectedStock.id}`);
      if (!response.ok) throw new Error('Failed to fetch futures contracts');
      const data = await response.json();
      setFuturesContracts(data.futuresContracts);
      
      // Set default selected contract if available
      if (data.futuresContracts.length > 0) {
        setFuturesState(prev => ({
          ...prev,
          selectedContractId: data.futuresContracts[0].id,
        }));
      }
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

  // Fetch options contracts
  const fetchOptionsContracts = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/fno/options?stockId=${selectedStock.id}&type=${optionsState.optionType}`);
      if (!response.ok) throw new Error('Failed to fetch options contracts');
      const data = await response.json();
      setOptionsContracts(data.optionsContracts);
      
      // Set default selected contract if available
      if (data.optionsContracts.length > 0) {
        setOptionsState(prev => ({
          ...prev,
          selectedContractId: data.optionsContracts[0].id,
          strikePrice: data.optionsContracts[0].strikePrice,
          expiryDate: data.optionsContracts[0].expiryDate,
        }));
      }
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
    if (!selectedStock || !futuresState.selectedContractId) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/fno/futures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          futuresContractId: futuresState.selectedContractId,
          quantity: futuresState.quantity,
          type: futuresState.type,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute futures trade');
      }
      
      const data = await response.json();
      
      toast({
        title: "Futures Trade Executed",
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error executing futures trade:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute futures trade",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute options trade
  const executeOptionsTrade = async () => {
    if (!selectedStock || !optionsState.selectedContractId) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/fno/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionsContractId: optionsState.selectedContractId,
          quantity: optionsState.quantity,
          type: optionsState.type,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute options trade');
      }
      
      const data = await response.json();
      
      toast({
        title: "Options Trade Executed",
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error executing options trade:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute options trade",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      fetchStocks();
      fetchAlgoTemplates();
      fetchMarginInfo();
    }
  }, [user]);

  // Fetch futures and options contracts when stock changes
  useEffect(() => {
    if (selectedStock) {
      fetchFuturesContracts();
      fetchOptionsContracts();
    }
  }, [selectedStock]);

  // Fetch options contracts when option type changes
  useEffect(() => {
    if (selectedStock) {
      fetchOptionsContracts();
    }
  }, [optionsState.optionType]);

  // Update stop loss price when entry price or percentage changes
  useEffect(() => {
    if (posCalcState.usePercentageStopLoss && posCalcState.entryPrice > 0) {
      const newStopLossPrice = posCalcState.entryPrice * (1 - posCalcState.stopLossPercentage / 100);
      setPosCalcState(prev => ({ ...prev, stopLossPrice: newStopLossPrice }));
    }
  }, [posCalcState.entryPrice, posCalcState.stopLossPercentage, posCalcState.usePercentageStopLoss]);

  // Update stop loss percentage when price changes
  useEffect(() => {
    if (!posCalcState.usePercentageStopLoss && posCalcState.entryPrice > 0 && posCalcState.stopLossPrice > 0) {
      const newStopLossPercentage = ((posCalcState.entryPrice - posCalcState.stopLossPrice) / posCalcState.entryPrice) * 100;
      setPosCalcState(prev => ({ ...prev, stopLossPercentage: newStopLossPercentage }));
    }
  }, [posCalcState.entryPrice, posCalcState.stopLossPrice, posCalcState.usePercentageStopLoss]);

  // Update OCO prices when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      setOcoState(prev => ({
        ...prev,
        limitPrice: ocoState.type === 'BUY' ? selectedStock.currentPrice * 1.05 : selectedStock.currentPrice * 0.95,
        stopPrice: ocoState.type === 'BUY' ? selectedStock.currentPrice * 0.95 : selectedStock.currentPrice * 1.05,
      }));
    }
  }, [selectedStock, ocoState.type]);

  // Handle stock selection
  const handleStockSelect = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    if (stock) {
      setSelectedStock(stock);
      
      // Update position calculator state
      setPosCalcState(prev => ({
        ...prev,
        entryPrice: stock.currentPrice,
        stopLossPrice: stock.currentPrice * 0.95,
      }));
      
      // Update trailing stop state
      setTrailingStopState(prev => ({
        ...prev,
        activationPrice: stock.currentPrice,
        trailingAmount: stock.currentPrice * 0.02,
      }));
      
      // Update OCO state
      setOcoState(prev => ({
        ...prev,
        limitPrice: prev.type === 'BUY' ? stock.currentPrice * 1.05 : stock.currentPrice * 0.95,
        stopPrice: prev.type === 'BUY' ? stock.currentPrice * 0.95 : stock.currentPrice * 1.05,
      }));
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = algoTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setAlgoState(prev => ({
        ...prev,
        templateId,
        parameters: template.parameters.reduce((acc: Record<string, number>, param: any) => {
          acc[param.name] = param.default;
          return acc;
        }, {}),
      }));
    }
  };

  // Calculate position size
  const calculatePosition = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/trading/position-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: selectedStock.id,
          riskAmount: posCalcState.useFixedRisk ? posCalcState.riskAmount : undefined,
          riskPercentage: !posCalcState.useFixedRisk ? posCalcState.riskPercentage : undefined,
          stopLossPercentage: posCalcState.usePercentageStopLoss ? posCalcState.stopLossPercentage : undefined,
          stopLossPrice: !posCalcState.usePercentageStopLoss ? posCalcState.stopLossPrice : undefined,
          entryPrice: posCalcState.entryPrice,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate position size');
      }
      
      const data = await response.json();
      setPositionCalcResult(data.calculation);
      
      toast({
        title: "Position Calculated",
        description: `Recommended position: ${data.calculation.shares} shares (₹${data.calculation.positionSize.toFixed(2)})`,
      });
    } catch (error: any) {
      console.error('Error calculating position:', error);
      toast({
        variant: "destructive",
        title: "Calculation Failed",
        description: error.message || "Failed to calculate position size",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Place trailing stop order
  const placeTrailingStop = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/orders/trailing-stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: selectedStock.id,
          type: trailingStopState.type,
          quantity: trailingStopState.quantity,
          trailingAmount: !trailingStopState.usePercentage ? trailingStopState.trailingAmount : undefined,
          trailingPercent: trailingStopState.usePercentage ? trailingStopState.trailingPercent : undefined,
          activationPrice: trailingStopState.activationPrice,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place trailing stop order');
      }
      
      const data = await response.json();
      
      toast({
        title: "Order Placed",
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error placing trailing stop order:', error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to place trailing stop order",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Place OCO order
  const placeOcoOrder = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/orders/oco', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: selectedStock.id,
          type: ocoState.type,
          quantity: ocoState.quantity,
          limitPrice: ocoState.limitPrice,
          stopPrice: ocoState.stopPrice,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place OCO order');
      }
      
      const data = await response.json();
      
      toast({
        title: "Order Placed",
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error placing OCO order:', error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to place OCO order",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute algo template
  const executeAlgoTemplate = async () => {
    if (!selectedStock || !selectedTemplate) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/trading/algo-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: algoState.templateId,
          stockId: selectedStock.id,
          parameters: algoState.parameters,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute algo template');
      }
      
      const data = await response.json();
      
      toast({
        title: "Algorithm Executed",
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error executing algo template:', error);
      toast({
        variant: "destructive",
        title: "Execution Failed",
        description: error.message || "Failed to execute algo template",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Run backtest
  const runBacktest = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/trading/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: selectedStock.id,
          strategy: backtestState.strategy,
          parameters: backtestState.parameters,
          startDate: backtestState.startDate,
          endDate: backtestState.endDate,
          initialCapital: backtestState.initialCapital,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run backtest');
      }
      
      const data = await response.json();
      setBacktestResult(data.backtestResults);
      
      toast({
        title: "Backtest Complete",
        description: `Total return: ${data.backtestResults.performance.totalReturn.toFixed(2)}%`,
      });
    } catch (error: any) {
      console.error('Error running backtest:', error);
      toast({
        variant: "destructive",
        title: "Backtest Failed",
        description: error.message || "Failed to run backtest",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute margin trade
  const executeMarginTrade = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/trading/margin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: selectedStock.id,
          type: marginState.type,
          quantity: marginState.quantity,
          leverage: marginState.leverage,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute margin trade');
      }
      
      const data = await response.json();
      
      // Refresh margin info
      fetchMarginInfo();
      
      toast({
        title: "Margin Trade Executed",
        description: data.message,
      });
    } catch (error: any) {
      console.error('Error executing margin trade:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute margin trade",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Advanced Trading | TradePaper India</title>
        <meta name="description" content="Advanced trading tools for paper trading" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div className="flex flex-col min-h-screen bg-background">
        {/* Top Navigation */}
        <header className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/dashboard-india')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <span className="text-xl font-bold">Advanced Trading</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 pb-20">
          {/* Stock Selection */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <Label htmlFor="stock-select">Select Stock</Label>
                  <Select 
                    value={selectedStock?.id || ""} 
                    onValueChange={handleStockSelect}
                  >
                    <SelectTrigger id="stock-select">
                      <SelectValue placeholder="Select a stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {stocks.map(stock => (
                        <SelectItem key={stock.id} value={stock.id}>
                          {stock.symbol} - {stock.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedStock && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{selectedStock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold flex items-center justify-end">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                          {selectedStock.currentPrice.toFixed(2)}
                        </p>
                        <div className={`flex items-center justify-end text-sm ${selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {selectedStock.change >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          )}
                          <span>{selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Advanced Trading Tools */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="position-calculator">Position Sizing</TabsTrigger>
              <TabsTrigger value="order-types">Advanced Orders</TabsTrigger>
              <TabsTrigger value="algo-trading">Algo Trading</TabsTrigger>
            </TabsList>
            
            <TabsContent value="position-calculator">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Position Size Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate optimal position size based on your risk parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Risk Amount/Percentage Toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="risk-toggle">Risk Type</Label>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="risk-toggle" className={!posCalcState.useFixedRisk ? "font-bold" : ""}>Percentage</Label>
                        <Switch 
                          id="risk-toggle" 
                          checked={posCalcState.useFixedRisk}
                          onCheckedChange={(checked) => setPosCalcState(prev => ({ ...prev, useFixedRisk: checked }))}
                        />
                        <Label htmlFor="risk-toggle" className={posCalcState.useFixedRisk ? "font-bold" : ""}>Fixed Amount</Label>
                      </div>
                    </div>
                    
                    {/* Risk Amount or Percentage */}
                    {posCalcState.useFixedRisk ? (
                      <div className="space-y-2">
                        <Label htmlFor="risk-amount">Risk Amount (₹)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="risk-amount"
                            type="number"
                            className="pl-10"
                            value={posCalcState.riskAmount}
                            onChange={(e) => setPosCalcState(prev => ({ ...prev, riskAmount: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="risk-percentage">Risk Percentage</Label>
                          <span className="text-sm text-muted-foreground">{posCalcState.riskPercentage}%</span>
                        </div>
                        <Slider
                          id="risk-percentage"
                          min={0.1}
                          max={5}
                          step={0.1}
                          value={[posCalcState.riskPercentage]}
                          onValueChange={(value) => setPosCalcState(prev => ({ ...prev, riskPercentage: value[0] }))}
                        />
                      </div>
                    )}
                    
                    {/* Entry Price */}
                    <div className="space-y-2">
                      <Label htmlFor="entry-price">Entry Price (₹)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="entry-price"
                          type="number"
                          className="pl-10"
                          value={posCalcState.entryPrice}
                          onChange={(e) => setPosCalcState(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    
                    {/* Stop Loss Type Toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stop-loss-toggle">Stop Loss Type</Label>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="stop-loss-toggle" className={!posCalcState.usePercentageStopLoss ? "font-bold" : ""}>Price</Label>
                        <Switch 
                          id="stop-loss-toggle" 
                          checked={posCalcState.usePercentageStopLoss}
                          onCheckedChange={(checked) => setPosCalcState(prev => ({ ...prev, usePercentageStopLoss: checked }))}
                        />
                        <Label htmlFor="stop-loss-toggle" className={posCalcState.usePercentageStopLoss ? "font-bold" : ""}>Percentage</Label>
                      </div>
                    </div>
                    
                    {/* Stop Loss Percentage or Price */}
                    {posCalcState.usePercentageStopLoss ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="stop-loss-percentage">Stop Loss Percentage</Label>
                          <span className="text-sm text-muted-foreground">{posCalcState.stopLossPercentage.toFixed(1)}%</span>
                        </div>
                        <Slider
                          id="stop-loss-percentage"
                          min={0.5}
                          max={20}
                          step={0.5}
                          value={[posCalcState.stopLossPercentage]}
                          onValueChange={(value) => setPosCalcState(prev => ({ ...prev, stopLossPercentage: value[0] }))}
                        />
                        <div className="text-sm text-muted-foreground">
                          Stop Loss Price: ₹{posCalcState.stopLossPrice.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="stop-loss-price">Stop Loss Price (₹)</Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="stop-loss-price"
                            type="number"
                            className="pl-10"
                            value={posCalcState.stopLossPrice}
                            onChange={(e) => setPosCalcState(prev => ({ ...prev, stopLossPrice: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Stop Loss Percentage: {posCalcState.stopLossPercentage.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Results */}
                  {positionCalcResult && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Calculation Results</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Recommended Shares</p>
                          <p className="font-bold">{positionCalcResult.shares}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Position Size</p>
                          <p className="font-bold flex items-center">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {positionCalcResult.positionSize.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Risk Amount</p>
                          <p className="font-bold flex items-center">
                            <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                            {positionCalcResult.riskAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Risk-Reward Ratio</p>
                          <p className="font-bold">{positionCalcResult.riskRewardRatio.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">% of Account</p>
                          <p className="font-bold">{positionCalcResult.percentOfAccount.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Margin of Safety</p>
                          <p className="font-bold">{positionCalcResult.marginOfSafety.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={calculatePosition}
                    disabled={isLoading || !selectedStock}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate Position Size
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="order-types">
              <Tabs defaultValue="trailing-stop">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="trailing-stop">Trailing Stop</TabsTrigger>
                  <TabsTrigger value="oco">OCO Orders</TabsTrigger>
                  <TabsTrigger value="margin">Margin Trading</TabsTrigger>
                  <TabsTrigger value="futures">Futures</TabsTrigger>
                  <TabsTrigger value="options">Options</TabsTrigger>
                </TabsList>
                
                <TabsContent value="trailing-stop">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Trailing Stop Orders
                      </CardTitle>
                      <CardDescription>
                        Automatically adjust your stop loss as the price moves in your favor
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Type */}
                        <div className="space-y-2">
                          <Label>Order Type</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={trailingStopState.type === "BUY" ? "default" : "outline"}
                              className={trailingStopState.type === "BUY" ? "w-1/2 bg-green-500 hover:bg-green-600" : "w-1/2"}
                              onClick={() => setTrailingStopState(prev => ({ ...prev, type: "BUY" }))}
                            >
                              Buy
                            </Button>
                            <Button
                              variant={trailingStopState.type === "SELL" ? "default" : "outline"}
                              className={trailingStopState.type === "SELL" ? "w-1/2 bg-red-500 hover:bg-red-600" : "w-1/2"}
                              onClick={() => setTrailingStopState(prev => ({ ...prev, type: "SELL" }))}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label htmlFor="trailing-quantity">Quantity</Label>
                          <Input
                            id="trailing-quantity"
                            type="number"
                            min="1"
                            value={trailingStopState.quantity}
                            onChange={(e) => setTrailingStopState(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        
                        {/* Trailing Type Toggle */}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="trailing-toggle">Trailing Type</Label>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="trailing-toggle" className={!trailingStopState.usePercentage ? "font-bold" : ""}>Amount</Label>
                            <Switch 
                              id="trailing-toggle" 
                              checked={trailingStopState.usePercentage}
                              onCheckedChange={(checked) => setTrailingStopState(prev => ({ ...prev, usePercentage: checked }))}
                            />
                            <Label htmlFor="trailing-toggle" className={trailingStopState.usePercentage ? "font-bold" : ""}>Percentage</Label>
                          </div>
                        </div>
                        
                        {/* Trailing Amount or Percentage */}
                        {trailingStopState.usePercentage ? (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="trailing-percent">Trailing Percentage</Label>
                              <span className="text-sm text-muted-foreground">{trailingStopState.trailingPercent}%</span>
                            </div>
                            <Slider
                              id="trailing-percent"
                              min={0.5}
                              max={10}
                              step={0.5}
                              value={[trailingStopState.trailingPercent]}
                              onValueChange={(value) => setTrailingStopState(prev => ({ ...prev, trailingPercent: value[0] }))}
                            />
                            <div className="text-sm text-muted-foreground">
                              Trailing Amount: ₹{(selectedStock?.currentPrice * trailingStopState.trailingPercent / 100).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="trailing-amount">Trailing Amount (₹)</Label>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                              <Input
                                id="trailing-amount"
                                type="number"
                                className="pl-10"
                                value={trailingStopState.trailingAmount}
                                onChange={(e) => setTrailingStopState(prev => ({ ...prev, trailingAmount: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            {selectedStock && (
                              <div className="text-sm text-muted-foreground">
                                Trailing Percentage: {((trailingStopState.trailingAmount / selectedStock.currentPrice) * 100).toFixed(2)}%
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Activation Price */}
                        <div className="space-y-2">
                          <Label htmlFor="activation-price">Activation Price (₹)</Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="activation-price"
                              type="number"
                              className="pl-10"
                              value={trailingStopState.activationPrice}
                              onChange={(e) => setTrailingStopState(prev => ({ ...prev, activationPrice: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Leave at current price to activate immediately
                          </div>
                        </div>
                        
                        {/* Explanation */}
                        <div className="p-3 bg-muted rounded-md text-sm">
                          <p className="font-medium mb-1">How Trailing Stops Work:</p>
                          <p>
                            {trailingStopState.type === "BUY" ? (
                              <>
                                Your buy order will execute when the price rises to {trailingStopState.activationPrice} and then falls by {trailingStopState.usePercentage ? `${trailingStopState.trailingPercent}%` : `₹${trailingStopState.trailingAmount}`}.
                              </>
                            ) : (
                              <>
                                Your sell order will execute when the price falls to {trailingStopState.activationPrice} and then rises by {trailingStopState.usePercentage ? `${trailingStopState.trailingPercent}%` : `₹${trailingStopState.trailingAmount}`}.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={placeTrailingStop}
                        disabled={isLoading || !selectedStock}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <Target className="mr-2 h-4 w-4" />
                            Place Trailing Stop Order
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="oco">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shuffle className="w-5 h-5 mr-2" />
                        OCO (One-Cancels-Other) Orders
                      </CardTitle>
                      <CardDescription>
                        Place two orders simultaneously - when one executes, the other is automatically canceled
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Order Type */}
                        <div className="space-y-2">
                          <Label>Order Type</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={ocoState.type === "BUY" ? "default" : "outline"}
                              className={ocoState.type === "BUY" ? "w-1/2 bg-green-500 hover:bg-green-600" : "w-1/2"}
                              onClick={() => {
                                setOcoState(prev => ({ 
                                  ...prev, 
                                  type: "BUY",
                                  limitPrice: selectedStock ? selectedStock.currentPrice * 1.05 : 0,
                                  stopPrice: selectedStock ? selectedStock.currentPrice * 0.95 : 0,
                                }));
                              }}
                            >
                              Buy
                            </Button>
                            <Button
                              variant={ocoState.type === "SELL" ? "default" : "outline"}
                              className={ocoState.type === "SELL" ? "w-1/2 bg-red-500 hover:bg-red-600" : "w-1/2"}
                              onClick={() => {
                                setOcoState(prev => ({ 
                                  ...prev, 
                                  type: "SELL",
                                  limitPrice: selectedStock ? selectedStock.currentPrice * 0.95 : 0,
                                  stopPrice: selectedStock ? selectedStock.currentPrice * 1.05 : 0,
                                }));
                              }}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label htmlFor="oco-quantity">Quantity</Label>
                          <Input
                            id="oco-quantity"
                            type="number"
                            min="1"
                            value={ocoState.quantity}
                            onChange={(e) => setOcoState(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        
                        {/* Limit Price */}
                        <div className="space-y-2">
                          <Label htmlFor="limit-price">
                            {ocoState.type === "BUY" ? "Take Profit Price (₹)" : "Limit Sell Price (₹)"}
                          </Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="limit-price"
                              type="number"
                              className="pl-10"
                              value={ocoState.limitPrice}
                              onChange={(e) => setOcoState(prev => ({ ...prev, limitPrice: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          {selectedStock && (
                            <div className="text-sm text-muted-foreground">
                              {ocoState.type === "BUY" ? (
                                <>Target: {((ocoState.limitPrice / selectedStock.currentPrice - 1) * 100).toFixed(2)}% above current price</>
                              ) : (
                                <>Target: {((1 - ocoState.limitPrice / selectedStock.currentPrice) * 100).toFixed(2)}% below current price</>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Stop Price */}
                        <div className="space-y-2">
                          <Label htmlFor="stop-price">
                            {ocoState.type === "BUY" ? "Stop Buy Price (₹)" : "Stop Loss Price (₹)"}
                          </Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="stop-price"
                              type="number"
                              className="pl-10"
                              value={ocoState.stopPrice}
                              onChange={(e) => setOcoState(prev => ({ ...prev, stopPrice: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          {selectedStock && (
                            <div className="text-sm text-muted-foreground">
                              {ocoState.type === "BUY" ? (
                                <>Stop: {((ocoState.stopPrice / selectedStock.currentPrice - 1) * 100).toFixed(2)}% above current price</>
                              ) : (
                                <>Stop: {((1 - ocoState.stopPrice / selectedStock.currentPrice) * 100).toFixed(2)}% below current price</>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Explanation */}
                        <div className="p-3 bg-muted rounded-md text-sm">
                          <p className="font-medium mb-1">How OCO Orders Work:</p>
                          <p>
                            {ocoState.type === "BUY" ? (
                              <>
                                Your buy order will execute either when the price rises to ₹{ocoState.stopPrice} (breakout) or falls to ₹{ocoState.limitPrice} (dip buying). When one order executes, the other is automatically canceled.
                              </>
                            ) : (
                              <>
                                Your sell order will execute either when the price falls to ₹{ocoState.limitPrice} (take profit) or falls to ₹{ocoState.stopPrice} (stop loss). When one order executes, the other is automatically canceled.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={placeOcoOrder}
                        disabled={isLoading || !selectedStock}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <Shuffle className="mr-2 h-4 w-4" />
                            Place OCO Order
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="margin">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Gauge className="w-5 h-5 mr-2" />
                        Margin Trading
                      </CardTitle>
                      <CardDescription>
                        Trade with leverage to amplify your potential returns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {marginInfo && (
                        <div className="mb-4 p-3 bg-muted rounded-md">
                          <h3 className="font-semibold mb-2">Margin Account Summary</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Account Balance</p>
                              <p className="font-bold flex items-center">
                                <IndianRupee className="w-3 h-3 mr-0.5" />
                                {marginInfo.accountBalance.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Portfolio Value</p>
                              <p className="font-bold flex items-center">
                                <IndianRupee className="w-3 h-3 mr-0.5" />
                                {marginInfo.portfolioValue.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Margin Available</p>
                              <p className="font-bold flex items-center">
                                <IndianRupee className="w-3 h-3 mr-0.5" />
                                {marginInfo.marginAvailable.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Margin Used</p>
                              <p className="font-bold flex items-center">
                                <IndianRupee className="w-3 h-3 mr-0.5" />
                                {marginInfo.marginUsed.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Interest Rate: {marginInfo.marginInterestRate}% per annum
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {/* Order Type */}
                        <div className="space-y-2">
                          <Label>Order Type</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={marginState.type === "BUY" ? "default" : "outline"}
                              className={marginState.type === "BUY" ? "w-1/2 bg-green-500 hover:bg-green-600" : "w-1/2"}
                              onClick={() => setMarginState(prev => ({ ...prev, type: "BUY" }))}
                            >
                              Buy
                            </Button>
                            <Button
                              variant={marginState.type === "SELL" ? "default" : "outline"}
                              className={marginState.type === "SELL" ? "w-1/2 bg-red-500 hover:bg-red-600" : "w-1/2"}
                              onClick={() => setMarginState(prev => ({ ...prev, type: "SELL" }))}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label htmlFor="margin-quantity">Quantity</Label>
                          <Input
                            id="margin-quantity"
                            type="number"
                            min="1"
                            value={marginState.quantity}
                            onChange={(e) => setMarginState(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        
                        {/* Leverage */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="leverage">Leverage</Label>
                            <span className="text-sm text-muted-foreground">{marginState.leverage}x</span>
                          </div>
                          <Slider
                            id="leverage"
                            min={1}
                            max={5}
                            step={1}
                            value={[marginState.leverage]}
                            onValueChange={(value) => setMarginState(prev => ({ ...prev, leverage: value[0] }))}
                          />
                        </div>
                        
                        {/* Trade Summary */}
                        {selectedStock && (
                          <div className="p-3 bg-muted rounded-md">
                            <h3 className="font-semibold mb-2">Trade Summary</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Total Value:</span>
                                <span className="font-bold flex items-center">
                                  <IndianRupee className="w-3 h-3 mr-0.5" />
                                  {(selectedStock.currentPrice * marginState.quantity).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Margin Required:</span>
                                <span className="font-bold flex items-center">
                                  <IndianRupee className="w-3 h-3 mr-0.5" />
                                  {((selectedStock.currentPrice * marginState.quantity) / marginState.leverage).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Effective Buying Power:</span>
                                <span className="font-bold flex items-center">
                                  <IndianRupee className="w-3 h-3 mr-0.5" />
                                  {(marginInfo?.accountBalance * marginState.leverage || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Risk Warning */}
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md text-sm text-red-600 dark:text-red-400">
                          <div className="flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium mb-1">Margin Trading Risk Warning:</p>
                              <p>
                                Trading on margin involves higher risk. Losses can exceed your initial investment. A {marginState.leverage}x leverage means your potential losses are also amplified {marginState.leverage}x.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={executeMarginTrade}
                        disabled={isLoading || !selectedStock}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Executing Trade...
                          </>
                        ) : (
                          <>
                            <Gauge className="mr-2 h-4 w-4" />
                            Execute Margin Trade
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="futures">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ArrowUpDown className="w-5 h-5 mr-2" />
                        Futures Trading
                      </CardTitle>
                      <CardDescription>
                        Trade futures contracts with leverage and settlement at a future date
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Contract Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="futures-contract">Select Futures Contract</Label>
                          <Select 
                            value={futuresState.selectedContractId} 
                            onValueChange={(value) => setFuturesState(prev => ({ ...prev, selectedContractId: value }))}
                          >
                            <SelectTrigger id="futures-contract">
                              <SelectValue placeholder="Select a futures contract" />
                            </SelectTrigger>
                            <SelectContent>
                              {futuresContracts.map(contract => (
                                <SelectItem key={contract.id} value={contract.id}>
                                  {contract.stock.symbol} - {new Date(contract.expiryDate).toLocaleDateString()} - ₹{contract.contractPrice.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Selected Contract Details */}
                        {futuresState.selectedContractId && futuresContracts.length > 0 && (
                          <div className="p-3 bg-muted rounded-md">
                            <h3 className="font-semibold mb-2">Contract Details</h3>
                            {(() => {
                              const contract = futuresContracts.find(c => c.id === futuresState.selectedContractId);
                              if (!contract) return null;
                              
                              return (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Stock</p>
                                    <p className="font-bold">{contract.stock.symbol}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Expiry Date</p>
                                    <p className="font-bold">{new Date(contract.expiryDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Contract Price</p>
                                    <p className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {contract.contractPrice.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Lot Size</p>
                                    <p className="font-bold">{contract.lotSize}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Margin Required</p>
                                    <p className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {contract.marginRequired.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Premium/Discount</p>
                                    <p className={`font-bold ${contract.contractPrice > contract.stock.currentPrice ? 'text-green-500' : 'text-red-500'}`}>
                                      {contract.contractPrice > contract.stock.currentPrice ? '+' : ''}
                                      {((contract.contractPrice / contract.stock.currentPrice - 1) * 100).toFixed(2)}%
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Order Type */}
                        <div className="space-y-2">
                          <Label>Order Type</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={futuresState.type === "BUY" ? "default" : "outline"}
                              className={futuresState.type === "BUY" ? "w-1/2 bg-green-500 hover:bg-green-600" : "w-1/2"}
                              onClick={() => setFuturesState(prev => ({ ...prev, type: "BUY" }))}
                            >
                              Buy
                            </Button>
                            <Button
                              variant={futuresState.type === "SELL" ? "default" : "outline"}
                              className={futuresState.type === "SELL" ? "w-1/2 bg-red-500 hover:bg-red-600" : "w-1/2"}
                              onClick={() => setFuturesState(prev => ({ ...prev, type: "SELL" }))}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quantity (in lots) */}
                        <div className="space-y-2">
                          <Label htmlFor="futures-quantity">Quantity (Lots)</Label>
                          <Input
                            id="futures-quantity"
                            type="number"
                            min="1"
                            value={futuresState.quantity}
                            onChange={(e) => setFuturesState(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        
                        {/* Trade Summary */}
                        {futuresState.selectedContractId && futuresContracts.length > 0 && (
                          <div className="p-3 bg-muted rounded-md">
                            <h3 className="font-semibold mb-2">Trade Summary</h3>
                            {(() => {
                              const contract = futuresContracts.find(c => c.id === futuresState.selectedContractId);
                              if (!contract) return null;
                              
                              const totalValue = contract.contractPrice * contract.lotSize * futuresState.quantity;
                              const marginRequired = contract.marginRequired * futuresState.quantity;
                              const leverage = totalValue / marginRequired;
                              
                              return (
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Total Contract Value:</span>
                                    <span className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {totalValue.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Margin Required:</span>
                                    <span className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {marginRequired.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Effective Leverage:</span>
                                    <span className="font-bold">{leverage.toFixed(2)}x</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Shares Exposure:</span>
                                    <span className="font-bold">{contract.lotSize * futuresState.quantity}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Risk Warning */}
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md text-sm text-red-600 dark:text-red-400">
                          <div className="flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium mb-1">Futures Trading Risk Warning:</p>
                              <p>
                                Futures trading involves substantial risk and leverage. You are trading with borrowed money and small market movements can have a large impact on your position. Make sure you understand the risks before trading.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={executeFuturesTrade}
                        disabled={isLoading || !selectedStock || !futuresState.selectedContractId}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Executing Trade...
                          </>
                        ) : (
                          <>
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Execute Futures Trade
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="options">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Layers className="w-5 h-5 mr-2" />
                        Options Trading
                      </CardTitle>
                      <CardDescription>
                        Trade options contracts with the right to buy or sell at a specific price
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Option Type Selection */}
                        <div className="space-y-2">
                          <Label>Option Type</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={optionsState.optionType === "CALL" ? "default" : "outline"}
                              className={optionsState.optionType === "CALL" ? "w-1/2 bg-green-500 hover:bg-green-600" : "w-1/2"}
                              onClick={() => setOptionsState(prev => ({ ...prev, optionType: "CALL" }))}
                            >
                              Call Options
                            </Button>
                            <Button
                              variant={optionsState.optionType === "PUT" ? "default" : "outline"}
                              className={optionsState.optionType === "PUT" ? "w-1/2 bg-red-500 hover:bg-red-600" : "w-1/2"}
                              onClick={() => setOptionsState(prev => ({ ...prev, optionType: "PUT" }))}
                            >
                              Put Options
                            </Button>
                          </div>
                        </div>
                        
                        {/* Contract Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="options-contract">Select Options Contract</Label>
                          <Select 
                            value={optionsState.selectedContractId} 
                            onValueChange={(value) => {
                              const contract = optionsContracts.find(c => c.id === value);
                              if (contract) {
                                setOptionsState(prev => ({ 
                                  ...prev, 
                                  selectedContractId: value,
                                  strikePrice: contract.strikePrice,
                                  expiryDate: contract.expiryDate
                                }));
                              }
                            }}
                          >
                            <SelectTrigger id="options-contract">
                              <SelectValue placeholder="Select an options contract" />
                            </SelectTrigger>
                            <SelectContent>
                              {optionsContracts.map(contract => (
                                <SelectItem key={contract.id} value={contract.id}>
                                  {contract.stock.symbol} {contract.type} {contract.strikePrice} - {new Date(contract.expiryDate).toLocaleDateString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Selected Contract Details */}
                        {optionsState.selectedContractId && optionsContracts.length > 0 && (
                          <div className="p-3 bg-muted rounded-md">
                            <h3 className="font-semibold mb-2">Contract Details</h3>
                            {(() => {
                              const contract = optionsContracts.find(c => c.id === optionsState.selectedContractId);
                              if (!contract) return null;
                              
                              // Calculate intrinsic value
                              let intrinsicValue = 0;
                              if (contract.type === 'CALL') {
                                intrinsicValue = Math.max(0, contract.stock.currentPrice - contract.strikePrice);
                              } else {
                                intrinsicValue = Math.max(0, contract.strikePrice - contract.stock.currentPrice);
                              }
                              
                              // Calculate time value
                              const timeValue = contract.premiumPrice - intrinsicValue;
                              
                              return (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Stock</p>
                                    <p className="font-bold">{contract.stock.symbol}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Option Type</p>
                                    <p className="font-bold">{contract.type}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Strike Price</p>
                                    <p className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {contract.strikePrice.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Premium</p>
                                    <p className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {contract.premiumPrice.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Expiry Date</p>
                                    <p className="font-bold">{new Date(contract.expiryDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Lot Size</p>
                                    <p className="font-bold">{contract.lotSize}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Intrinsic Value</p>
                                    <p className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {intrinsicValue.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Time Value</p>
                                    <p className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {timeValue.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Order Type */}
                        <div className="space-y-2">
                          <Label>Order Type</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant={optionsState.type === "BUY" ? "default" : "outline"}
                              className={optionsState.type === "BUY" ? "w-1/2 bg-green-500 hover:bg-green-600" : "w-1/2"}
                              onClick={() => setOptionsState(prev => ({ ...prev, type: "BUY" }))}
                            >
                              Buy
                            </Button>
                            <Button
                              variant={optionsState.type === "SELL" ? "default" : "outline"}
                              className={optionsState.type === "SELL" ? "w-1/2 bg-red-500 hover:bg-red-600" : "w-1/2"}
                              onClick={() => setOptionsState(prev => ({ ...prev, type: "SELL" }))}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quantity (in lots) */}
                        <div className="space-y-2">
                          <Label htmlFor="options-quantity">Quantity (Lots)</Label>
                          <Input
                            id="options-quantity"
                            type="number"
                            min="1"
                            value={optionsState.quantity}
                            onChange={(e) => setOptionsState(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        
                        {/* Trade Summary */}
                        {optionsState.selectedContractId && optionsContracts.length > 0 && (
                          <div className="p-3 bg-muted rounded-md">
                            <h3 className="font-semibold mb-2">Trade Summary</h3>
                            {(() => {
                              const contract = optionsContracts.find(c => c.id === optionsState.selectedContractId);
                              if (!contract) return null;
                              
                              const totalPremium = contract.premiumPrice * contract.lotSize * optionsState.quantity;
                              const maxProfit = optionsState.type === "BUY" 
                                ? (contract.type === "CALL" 
                                  ? "Unlimited" 
                                  : `₹${((contract.strikePrice - contract.stock.currentPrice) * contract.lotSize * optionsState.quantity).toFixed(2)}`)
                                : `₹${totalPremium.toFixed(2)}`;
                              
                              const maxLoss = optionsState.type === "BUY" 
                                ? `₹${totalPremium.toFixed(2)}` 
                                : (contract.type === "CALL" 
                                  ? "Unlimited" 
                                  : `₹${((contract.strikePrice - contract.stock.currentPrice) * contract.lotSize * optionsState.quantity).toFixed(2)}`);
                              
                              return (
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Total Premium:</span>
                                    <span className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {totalPremium.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Total Shares Exposure:</span>
                                    <span className="font-bold">{contract.lotSize * optionsState.quantity}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Maximum Profit:</span>
                                    <span className="font-bold text-green-500">{maxProfit}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Maximum Loss:</span>
                                    <span className="font-bold text-red-500">{maxLoss}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Break-even Price:</span>
                                    <span className="font-bold flex items-center">
                                      <IndianRupee className="w-3 h-3 mr-0.5" />
                                      {contract.type === "CALL" 
                                        ? (contract.strikePrice + contract.premiumPrice).toFixed(2)
                                        : (contract.strikePrice - contract.premiumPrice).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Risk Warning */}
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md text-sm text-red-600 dark:text-red-400">
                          <div className="flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium mb-1">Options Trading Risk Warning:</p>
                              <p>
                                Options trading involves significant risk and is not suitable for all investors. Options can be highly volatile and buyers can lose their entire investment. Options sellers may face unlimited risk. Understand the risks before trading.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={executeOptionsTrade}
                        disabled={isLoading || !selectedStock || !optionsState.selectedContractId}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Executing Trade...
                          </>
                        ) : (
                          <>
                            <Layers className="mr-2 h-4 w-4" />
                            Execute Options Trade
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="algo-trading">
              <Tabs defaultValue="templates">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="templates">Algo Templates</TabsTrigger>
                  <TabsTrigger value="backtest">Backtesting</TabsTrigger>
                </TabsList>
                
                <TabsContent value="templates">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Cpu className="w-5 h-5 mr-2" />
                        Algorithmic Trading Templates
                      </CardTitle>
                      <CardDescription>
                        Use pre-built algorithmic trading strategies
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Template Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="template-select">Select Strategy</Label>
                          <Select 
                            value={algoState.templateId} 
                            onValueChange={handleTemplateSelect}
                          >
                            <SelectTrigger id="template-select">
                              <SelectValue placeholder="Select a strategy" />
                            </SelectTrigger>
                            <SelectContent>
                              {algoTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Template Description */}
                        {selectedTemplate && (
                          <div className="p-3 bg-muted rounded-md text-sm">
                            <p>{selectedTemplate.description}</p>
                          </div>
                        )}
                        
                        {/* Parameters */}
                        {selectedTemplate && (
                          <div className="space-y-4">
                            <h3 className="font-semibold">Strategy Parameters</h3>
                            {selectedTemplate.parameters.map(param => (
                              <div key={param.name} className="space-y-2">
                                <div className="flex justify-between">
                                  <Label htmlFor={`param-${param.name}`}>{param.description}</Label>
                                  <span className="text-sm text-muted-foreground">
                                    {algoState.parameters[param.name] || param.default}
                                  </span>
                                </div>
                                {param.type === 'number' && (
                                  <Slider
                                    id={`param-${param.name}`}
                                    min={param.name.includes('Period') ? 2 : 1}
                                    max={param.name.includes('Period') ? 200 : 100}
                                    step={1}
                                    value={[algoState.parameters[param.name] || param.default]}
                                    onValueChange={(value) => setAlgoState(prev => ({
                                      ...prev,
                                      parameters: {
                                        ...prev.parameters,
                                        [param.name]: value[0],
                                      }
                                    }))}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* How It Works */}
                        <div className="mt-4 space-y-2">
                          <h3 className="font-semibold">How Algorithmic Trading Works</h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-start">
                              <div className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                                <Zap className="w-3 h-3 text-primary" />
                              </div>
                              <p>Algorithms analyze market data and execute trades based on predefined rules</p>
                            </div>
                            <div className="flex items-start">
                              <div className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                                <Sparkles className="w-3 h-3 text-primary" />
                              </div>
                              <p>Remove emotional bias from trading decisions</p>
                            </div>
                            <div className="flex items-start">
                              <div className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                                <Lightbulb className="w-3 h-3 text-primary" />
                              </div>
                              <p>Backtest strategies on historical data before trading with real money</p>
                            </div>
                            <div className="flex items-start">
                              <div className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                                <Rocket className="w-3 h-3 text-primary" />
                              </div>
                              <p>Execute trades faster and more efficiently than manual trading</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={executeAlgoTemplate}
                        disabled={isLoading || !selectedStock || !selectedTemplate}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Executing Algorithm...
                          </>
                        ) : (
                          <>
                            <Cpu className="mr-2 h-4 w-4" />
                            Execute Algorithm
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="backtest">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart4 className="w-5 h-5 mr-2" />
                        Backtesting Simulator
                      </CardTitle>
                      <CardDescription>
                        Test trading strategies on historical data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Strategy Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="backtest-strategy">Select Strategy</Label>
                          <Select 
                            value={backtestState.strategy} 
                            onValueChange={(value) => setBacktestState(prev => ({ ...prev, strategy: value }))}
                          >
                            <SelectTrigger id="backtest-strategy">
                              <SelectValue placeholder="Select a strategy" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="moving-average-crossover">Moving Average Crossover</SelectItem>
                              <SelectItem value="rsi-overbought-oversold">RSI Overbought/Oversold</SelectItem>
                              <SelectItem value="bollinger-band-bounce">Bollinger Band Bounce</SelectItem>
                              <SelectItem value="vwap-reversion">VWAP Reversion</SelectItem>
                              <SelectItem value="momentum-strategy">Momentum Strategy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                              id="start-date"
                              type="date"
                              value={backtestState.startDate}
                              onChange={(e) => setBacktestState(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                              id="end-date"
                              type="date"
                              value={backtestState.endDate}
                              onChange={(e) => setBacktestState(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        {/* Initial Capital */}
                        <div className="space-y-2">
                          <Label htmlFor="initial-capital">Initial Capital (₹)</Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id="initial-capital"
                              type="number"
                              className="pl-10"
                              value={backtestState.initialCapital}
                              onChange={(e) => setBacktestState(prev => ({ ...prev, initialCapital: parseFloat(e.target.value) || 100000 }))}
                            />
                          </div>
                        </div>
                        
                        {/* Strategy Parameters */}
                        <div className="space-y-2">
                          <h3 className="font-semibold">Strategy Parameters</h3>
                          {backtestState.strategy === 'moving-average-crossover' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <Label htmlFor="short-period">Short MA Period</Label>
                                  <span className="text-sm text-muted-foreground">{backtestState.parameters.shortPeriod}</span>
                                </div>
                                <Slider
                                  id="short-period"
                                  min={2}
                                  max={50}
                                  step={1}
                                  value={[backtestState.parameters.shortPeriod]}
                                  onValueChange={(value) => setBacktestState(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      shortPeriod: value[0],
                                    }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <Label htmlFor="long-period">Long MA Period</Label>
                                  <span className="text-sm text-muted-foreground">{backtestState.parameters.longPeriod}</span>
                                </div>
                                <Slider
                                  id="long-period"
                                  min={10}
                                  max={200}
                                  step={5}
                                  value={[backtestState.parameters.longPeriod]}
                                  onValueChange={(value) => setBacktestState(prev => ({
                                    ...prev,
                                    parameters: {
                                      ...prev.parameters,
                                      longPeriod: value[0],
                                    }
                                  }))}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Add parameters for other strategies as needed */}
                        </div>
                        
                        {/* Backtest Results */}
                        {backtestResult && (
                          <div className="mt-6 p-4 bg-muted rounded-lg">
                            <h3 className="font-semibold mb-3">Backtest Results</h3>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Return</p>
                                  <p className={`font-bold ${backtestResult.performance.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {backtestResult.performance.totalReturn >= 0 ? '+' : ''}
                                    {backtestResult.performance.totalReturn.toFixed(2)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Final Equity</p>
                                  <p className="font-bold flex items-center">
                                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                    {backtestResult.performance.finalEquity.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Win Rate</p>
                                  <p className="font-bold">{backtestResult.performance.winRate.toFixed(2)}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                                  <p className="font-bold text-red-500">-{backtestResult.performance.maxDrawdown.toFixed(2)}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Profit Factor</p>
                                  <p className="font-bold">{backtestResult.performance.profitFactor.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Trades</p>
                                  <p className="font-bold">{backtestResult.performance.totalTrades}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Recent Trades</h4>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                  {backtestResult.trades.slice(0, 5).map((trade: any, index: number) => (
                                    <div key={index} className="text-xs p-2 bg-background rounded border border-border">
                                      <div className="flex justify-between">
                                        <span className={`font-medium ${trade.action === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                          {trade.action}
                                        </span>
                                        <span>Day {trade.day}</span>
                                      </div>
                                      <div className="flex justify-between mt-1">
                                        <span>Price: ₹{trade.price.toFixed(2)}</span>
                                        {trade.profit !== undefined && (
                                          <span className={trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {trade.profit >= 0 ? '+' : ''}₹{trade.profit.toFixed(2)} ({trade.profitPct.toFixed(2)}%)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={runBacktest}
                        disabled={isLoading || !selectedStock}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Running Backtest...
                          </>
                        ) : (
                          <>
                            <BarChart4 className="mr-2 h-4 w-4" />
                            Run Backtest
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}