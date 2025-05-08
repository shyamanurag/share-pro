import React, { useState } from 'react';
import { Stock } from '@/types/trading';
import { useStockClickHandler } from '@/hooks/useStockClickHandler';
import { useTrade } from '@/contexts/TradeContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { 
  ShoppingCart, 
  ArrowUpRight, 
  MoreHorizontal, 
  Share2, 
  TrendingUp, 
  TrendingDown,
  IndianRupee,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

interface QuickTradeButtonProps {
  stock: Stock;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
  defaultTradeType?: 'BUY' | 'SELL';
  showQuickOptions?: boolean;
}

/**
 * A button component that provides quick access to trading functionality
 * Can be used anywhere in the application to enable universal trading
 */
export default function QuickTradeButton({
  stock,
  variant = 'default',
  size = 'default',
  showLabel = true,
  showIcon = true,
  className = '',
  defaultTradeType = 'BUY',
  showQuickOptions = true
}: QuickTradeButtonProps) {
  const { handleStockClick } = useStockClickHandler();
  const { openQuickTradeModal, openShareModal, executeUniversalTrade } = useTrade();
  
  // Quick trade dialog state
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>(defaultTradeType);
  const [quantity, setQuantity] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Handle button click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickTradeModal(stock, defaultTradeType);
  };
  
  // Handle quick buy
  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradeType('BUY');
    setIsQuickTradeOpen(true);
  };
  
  // Handle quick sell
  const handleQuickSell = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradeType('SELL');
    setIsQuickTradeOpen(true);
  };
  
  // Handle share
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    openShareModal(stock);
  };
  
  // Execute quick trade
  const executeQuickTrade = async () => {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      toast({
        variant: "destructive",
        title: "Invalid Quantity",
        description: "Quantity must be a positive integer",
      });
      return;
    }
    
    setIsExecuting(true);
    
    try {
      const success = await executeUniversalTrade(stock, quantity, tradeType);
      
      if (success) {
        setIsQuickTradeOpen(false);
        setQuantity(1);
      }
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Render the button based on configuration
  if (showQuickOptions) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
            >
              {showIcon && (
                tradeType === 'BUY' 
                  ? <ShoppingCart className={`${size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'}`} /> 
                  : <ArrowUpRight className={`${size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'}`} />
              )}
              {showLabel && (tradeType === 'BUY' ? 'Trade' : 'Trade')}
              {!showLabel && !showIcon && <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleQuickBuy}>
              <ShoppingCart className="h-4 w-4 mr-2 text-green-500" />
              <span>Quick Buy</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleQuickSell}>
              <ArrowUpRight className="h-4 w-4 mr-2 text-red-500" />
              <span>Quick Sell</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClick}>
              <TrendingUp className="h-4 w-4 mr-2" />
              <span>Advanced Trade</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2 text-blue-500" />
              <span>Share</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Quick Trade Dialog */}
        <Dialog open={isQuickTradeOpen} onOpenChange={setIsQuickTradeOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {tradeType === 'BUY' ? 'Buy' : 'Sell'} {stock.symbol}
              </DialogTitle>
              <DialogDescription>
                <div className="flex justify-between items-center mt-2">
                  <span>{stock.name}</span>
                  <span className="flex items-center font-medium">
                    <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                    {stock.currentPrice.toFixed(2)}
                    <span className={`ml-2 text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stock.change >= 0 ? (
                        <TrendingUp className="inline h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="inline h-3 w-3 mr-0.5" />
                      )}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
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
                    id="quantity"
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
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Total Value:</span>
                <span className="text-lg font-bold flex items-center">
                  <IndianRupee className="w-4 h-4 mr-0.5" />
                  {(stock.currentPrice * quantity).toFixed(2)}
                </span>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuickTradeOpen(false)}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button 
                onClick={executeQuickTrade}
                disabled={isExecuting}
                className={tradeType === 'BUY' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Simple button without dropdown
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      {showIcon && (
        defaultTradeType === 'BUY' 
          ? <ShoppingCart className={`${size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'}`} /> 
          : <ArrowUpRight className={`${size === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'}`} />
      )}
      {showLabel && (defaultTradeType === 'BUY' ? 'Trade' : 'Trade')}
    </Button>
  );
}