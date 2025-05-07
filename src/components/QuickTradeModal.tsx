import React, { useState, useEffect } from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  ArrowUpRight,
  RefreshCw,
  LineChart,
  Clock,
  AlertTriangle,
  Check,
  X,
  Share2
} from 'lucide-react';

export default function QuickTradeModal() {
  const { isQuickTradeModalOpen, selectedStock, initialTradeType, closeQuickTradeModal, openShareModal } = useTrade();
  const { user } = useAuth();
  
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [stopPrice, setStopPrice] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [sharesOwned, setSharesOwned] = useState(0);
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [technicalIndicators, setTechnicalIndicators] = useState<any>({
    rsi: { value: 0, signal: '' },
    macd: { value: 0, signal: '' },
    ema: { value: 0, signal: '' },
    bollingerBands: { upper: 0, middle: 0, lower: 0, signal: '' }
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isQuickTradeModalOpen && selectedStock) {
      setTradeType(initialTradeType);
      setQuantity(1);
      setOrderType('MARKET');
      setLimitPrice(selectedStock.currentPrice);
      setStopPrice(tradeType === 'BUY' 
        ? selectedStock.currentPrice * 1.02 
        : selectedStock.currentPrice * 0.98);
      
      // Fetch user balance and shares owned
      fetchUserData();
      
      // Generate simulated technical indicators
      generateTechnicalIndicators();
    }
  }, [isQuickTradeModalOpen, selectedStock, initialTradeType]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user profile for balance
      const profileResponse = await fetch('/api/user/profile');
      if (!profileResponse.ok) throw new Error('Failed to fetch user profile');
      const profileData = await profileResponse.json();
      setUserBalance(profileData.user.balance || 0);
      
      // Fetch portfolio to check if user owns this stock
      if (selectedStock) {
        const portfolioResponse = await fetch('/api/portfolio');
        if (!portfolioResponse.ok) throw new Error('Failed to fetch portfolio');
        const portfolioData = await portfolioResponse.json();
        
        const stockHolding = portfolioData.items.find(
          (item: any) => item.stockId === selectedStock.id
        );
        
        setSharesOwned(stockHolding ? stockHolding.quantity : 0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTechnicalIndicators = () => {
    if (!selectedStock) return;
    
    // Generate random but somewhat realistic technical indicators
    const price = selectedStock.currentPrice;
    const change = selectedStock.change;
    
    // RSI (0-100)
    const rsiValue = Math.min(100, Math.max(0, 50 + (change > 0 ? 20 : -20) + (Math.random() * 20 - 10)));
    const rsiSignal = rsiValue > 70 ? 'SELL' : rsiValue < 30 ? 'BUY' : 'NEUTRAL';
    
    // MACD
    const macdValue = change * (0.5 + Math.random() * 0.5);
    const macdSignal = macdValue > 0.5 ? 'BUY' : macdValue < -0.5 ? 'SELL' : 'NEUTRAL';
    
    // EMA (20-day)
    const emaValue = price * (1 - (Math.random() * 0.02 - 0.01));
    const emaSignal = price > emaValue ? 'BUY' : price < emaValue ? 'SELL' : 'NEUTRAL';
    
    // Bollinger Bands
    const middleBand = price * (1 - (Math.random() * 0.01 - 0.005));
    const bandWidth = price * (0.02 + Math.random() * 0.02);
    const upperBand = middleBand + bandWidth;
    const lowerBand = middleBand - bandWidth;
    
    let bbSignal = 'NEUTRAL';
    if (price > upperBand) bbSignal = 'SELL';
    else if (price < lowerBand) bbSignal = 'BUY';
    
    setTechnicalIndicators({
      rsi: { value: rsiValue, signal: rsiSignal },
      macd: { value: macdValue, signal: macdSignal },
      ema: { value: emaValue, signal: emaSignal },
      bollingerBands: { 
        upper: upperBand, 
        middle: middleBand, 
        lower: lowerBand, 
        signal: bbSignal 
      }
    });
  };

  const calculateTotalValue = () => {
    if (!selectedStock) return 0;
    
    if (orderType === 'MARKET') {
      return selectedStock.currentPrice * quantity;
    } else if (orderType === 'LIMIT' && limitPrice) {
      return limitPrice * quantity;
    } else if (orderType === 'STOP' && stopPrice) {
      return stopPrice * quantity;
    }
    
    return 0;
  };

  const executeTrade = async () => {
    if (!selectedStock) return;
    
    try {
      setIsExecuting(true);
      
      // Prepare order details
      const orderDetails = {
        stockId: selectedStock.id,
        type: tradeType,
        quantity,
        orderType,
        ...(orderType === 'LIMIT' && { limitPrice }),
        ...(orderType === 'STOP' && { stopPrice })
      };
      
      // Execute the trade
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDetails),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute trade');
      }
      
      const data = await response.json();
      
      // Show success message
      toast({
        title: `${tradeType === 'BUY' ? 'Purchase' : 'Sale'} Successful`,
        description: `${tradeType === 'BUY' ? 'Bought' : 'Sold'} ${quantity} shares of ${selectedStock.symbol} at ₹${selectedStock.currentPrice.toFixed(2)}`,
      });
      
      // Close the modal
      closeQuickTradeModal();
    } catch (error: any) {
      console.error('Error executing trade:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Check if user has enough balance for BUY or enough shares for SELL
  const canExecuteTrade = () => {
    if (!selectedStock) return false;
    
    if (tradeType === 'BUY') {
      return calculateTotalValue() <= userBalance;
    } else {
      return quantity <= sharesOwned;
    }
  };

  // Get error message if trade cannot be executed
  const getTradeErrorMessage = () => {
    if (!selectedStock) return '';
    
    if (tradeType === 'BUY' && calculateTotalValue() > userBalance) {
      return 'Insufficient balance for this transaction';
    } else if (tradeType === 'SELL' && quantity > sharesOwned) {
      return 'You don\'t own enough shares for this transaction';
    }
    
    return '';
  };

  // Get signal indicator component
  const getSignalIndicator = (signal: string) => {
    if (signal === 'BUY') {
      return <Badge className="bg-green-500 text-white">BUY</Badge>;
    } else if (signal === 'SELL') {
      return <Badge className="bg-red-500 text-white">SELL</Badge>;
    } else {
      return <Badge variant="outline">NEUTRAL</Badge>;
    }
  };

  if (!selectedStock) return null;

  return (
    <Dialog open={isQuickTradeModalOpen} onOpenChange={closeQuickTradeModal}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <AnimatePresence>
          {isQuickTradeModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`p-1 ${tradeType === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}>
                <div className="bg-background p-5">
                  <DialogHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <DialogTitle className="text-xl flex items-center gap-2">
                          {selectedStock.symbol}
                          <Badge variant="outline" className="ml-2">
                            NSE
                          </Badge>
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                          {selectedStock.name}
                        </DialogDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold flex items-center justify-end">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {selectedStock.currentPrice.toFixed(2)}
                        </div>
                        <div className={`flex items-center justify-end text-sm ${selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {selectedStock.change >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          <span>
                            {selectedStock.change >= 0 ? '+' : ''}
                            {selectedStock.change.toFixed(2)} ({selectedStock.change >= 0 ? '+' : ''}
                            {selectedStock.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="mt-4">
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="mt-4 space-y-4">
                        {/* User Balance & Shares Owned */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/30 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground">Available Balance</p>
                            <p className="font-bold flex items-center">
                              <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                              {userBalance.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground">Shares Owned</p>
                            <p className="font-bold">{sharesOwned}</p>
                          </div>
                        </div>
                        
                        {/* Trade Type Selection */}
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            type="button"
                            variant={tradeType === 'BUY' ? 'default' : 'outline'}
                            className={tradeType === 'BUY' ? 'bg-green-500 hover:bg-green-600' : ''}
                            onClick={() => setTradeType('BUY')}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" /> Buy
                          </Button>
                          <Button
                            type="button"
                            variant={tradeType === 'SELL' ? 'default' : 'outline'}
                            className={tradeType === 'SELL' ? 'bg-red-500 hover:bg-red-600' : ''}
                            onClick={() => setTradeType('SELL')}
                          >
                            <ArrowUpRight className="w-4 h-4 mr-2" /> Sell
                          </Button>
                        </div>
                        
                        {/* Quantity Selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Quantity</label>
                          <div className="flex items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              className="mx-2 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quick Quantity Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                          {[5, 10, 25, 50].map((qty) => (
                            <Button
                              key={qty}
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(qty)}
                            >
                              {qty}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Total Value */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <p className="text-sm font-medium">Total Value:</p>
                          <p className="text-lg font-bold flex items-center">
                            <IndianRupee className="w-4 h-4 mr-0.5" />
                            {calculateTotalValue().toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Error Message */}
                        {getTradeErrorMessage() && (
                          <div className="text-red-500 text-sm flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {getTradeErrorMessage()}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="advanced" className="mt-4 space-y-4">
                        {/* Order Type Selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Order Type</label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              type="button"
                              variant={orderType === 'MARKET' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setOrderType('MARKET')}
                            >
                              Market
                            </Button>
                            <Button
                              type="button"
                              variant={orderType === 'LIMIT' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setOrderType('LIMIT')}
                            >
                              Limit
                            </Button>
                            <Button
                              type="button"
                              variant={orderType === 'STOP' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setOrderType('STOP')}
                            >
                              Stop
                            </Button>
                          </div>
                        </div>
                        
                        {/* Limit Price (if Limit order) */}
                        {orderType === 'LIMIT' && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Limit Price</label>
                            <div className="flex items-center">
                              <IndianRupee className="w-4 h-4 mr-1 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={limitPrice || ''}
                                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || null)}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Stop Price (if Stop order) */}
                        {orderType === 'STOP' && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Stop Price</label>
                            <div className="flex items-center">
                              <IndianRupee className="w-4 h-4 mr-1 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={stopPrice || ''}
                                onChange={(e) => setStopPrice(parseFloat(e.target.value) || null)}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Technical Indicators */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Technical Indicators</label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={generateTechnicalIndicators}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-md space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs">RSI (14)</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{technicalIndicators.rsi.value.toFixed(2)}</span>
                                {getSignalIndicator(technicalIndicators.rsi.signal)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs">MACD</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{technicalIndicators.macd.value.toFixed(2)}</span>
                                {getSignalIndicator(technicalIndicators.macd.signal)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs">EMA (20)</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">₹{technicalIndicators.ema.value.toFixed(2)}</span>
                                {getSignalIndicator(technicalIndicators.ema.signal)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs">Bollinger Bands</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">
                                  ₹{technicalIndicators.bollingerBands.middle.toFixed(2)}
                                </span>
                                {getSignalIndicator(technicalIndicators.bollingerBands.signal)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Overall Signal */}
                        <div className="bg-muted/30 p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Overall Signal</span>
                            {(() => {
                              // Count signals
                              const signals = [
                                technicalIndicators.rsi.signal,
                                technicalIndicators.macd.signal,
                                technicalIndicators.ema.signal,
                                technicalIndicators.bollingerBands.signal
                              ];
                              
                              const buyCount = signals.filter(s => s === 'BUY').length;
                              const sellCount = signals.filter(s => s === 'SELL').length;
                              
                              let overallSignal = 'NEUTRAL';
                              if (buyCount >= 3) overallSignal = 'STRONG BUY';
                              else if (buyCount >= 2) overallSignal = 'BUY';
                              else if (sellCount >= 3) overallSignal = 'STRONG SELL';
                              else if (sellCount >= 2) overallSignal = 'SELL';
                              
                              let badgeColor = 'bg-gray-500';
                              if (overallSignal === 'STRONG BUY') badgeColor = 'bg-green-600';
                              else if (overallSignal === 'BUY') badgeColor = 'bg-green-500';
                              else if (overallSignal === 'STRONG SELL') badgeColor = 'bg-red-600';
                              else if (overallSignal === 'SELL') badgeColor = 'bg-red-500';
                              
                              return (
                                <Badge className={`${badgeColor} text-white`}>
                                  {overallSignal}
                                </Badge>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {/* Quantity Selection */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Quantity</label>
                          <div className="flex items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              className="mx-2 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        
                        {/* Total Value */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <p className="text-sm font-medium">Total Value:</p>
                          <p className="text-lg font-bold flex items-center">
                            <IndianRupee className="w-4 h-4 mr-0.5" />
                            {calculateTotalValue().toFixed(2)}
                          </p>
                        </div>
                        
                        {/* Error Message */}
                        {getTradeErrorMessage() && (
                          <div className="text-red-500 text-sm flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {getTradeErrorMessage()}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>

                  <DialogFooter className="mt-6 flex flex-col gap-2">
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="outline" 
                        onClick={closeQuickTradeModal}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                      <Button 
                        onClick={executeTrade}
                        disabled={!canExecuteTrade() || isExecuting}
                        className={`flex-1 ${tradeType === 'BUY' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        {isExecuting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" /> 
                            Confirm {tradeType === 'BUY' ? 'Purchase' : 'Sale'}
                          </>
                        )}
                      </Button>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => {
                        closeQuickTradeModal();
                        if (selectedStock) {
                          openShareModal(selectedStock);
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" /> Share Stock
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}