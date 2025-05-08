import React from 'react';
import { Stock } from '@/types/trading';
import { useStockClickHandler } from '@/hooks/useStockClickHandler';
import { IndianRupee, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UniversalStockSymbolProps {
  stock: Stock;
  showPrice?: boolean;
  showChange?: boolean;
  showBadge?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: (stock: Stock, event: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  tradeType?: 'BUY' | 'SELL';
}

/**
 * A universal stock symbol component that can be used anywhere in the application
 * Clicking on this component will open the quick trade modal
 */
export function UniversalStockSymbol({
  stock,
  showPrice = true,
  showChange = true,
  showBadge = true,
  showTooltip = true,
  className = '',
  onClick,
  size = 'md',
  variant = 'default',
  tradeType = 'BUY'
}: UniversalStockSymbolProps) {
  const { handleStockClick } = useStockClickHandler();

  // Size-based classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Handle click event
  const onClickHandler = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(stock, e);
    } else {
      handleStockClick(stock, tradeType, e);
    }
  };

  // Render the stock symbol based on the variant
  const renderStockSymbol = () => {
    switch (variant) {
      case 'compact':
        return (
          <span className={`inline-flex items-center cursor-pointer hover:text-primary transition-colors ${sizeClasses[size]} ${className}`}>
            <span className="font-medium">{stock.symbol}</span>
            {showPrice && (
              <span className="ml-1 flex items-center">
                <IndianRupee className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} mr-0.5`} />
                {stock.currentPrice.toFixed(2)}
              </span>
            )}
          </span>
        );
      
      case 'detailed':
        return (
          <div className={`flex flex-col cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors ${className}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <span className={`font-medium ${sizeClasses[size]}`}>{stock.symbol}</span>
                {showBadge && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    {stock.exchange || 'NSE'}
                  </Badge>
                )}
              </div>
              {showPrice && (
                <div className="flex flex-col items-end">
                  <span className="flex items-center font-medium">
                    <IndianRupee className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} mr-0.5`} />
                    {stock.currentPrice.toFixed(2)}
                  </span>
                  {showChange && (
                    <span className={`flex items-center text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stock.change >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-0.5" />
                      )}
                      <span>
                        {stock.change >= 0 ? '+' : ''}
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1 truncate">{stock.name}</div>
          </div>
        );
      
      default: // 'default'
        return (
          <span className={`inline-flex items-center cursor-pointer hover:text-primary transition-colors ${sizeClasses[size]} ${className}`}>
            <span className="font-medium">{stock.symbol}</span>
            
            {showBadge && (
              <Badge variant="outline" className="ml-1 text-xs">
                {stock.exchange || 'NSE'}
              </Badge>
            )}
            
            {showPrice && (
              <span className="ml-1.5 flex items-center">
                <IndianRupee className={`${size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} mr-0.5`} />
                {stock.currentPrice.toFixed(2)}
              </span>
            )}
            
            {showChange && (
              <span className={`ml-1.5 flex items-center text-xs ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stock.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                <span>
                  {stock.change >= 0 ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%
                </span>
              </span>
            )}
            
            <ExternalLink className="ml-1 w-3 h-3 text-muted-foreground" />
          </span>
        );
    }
  };

  // Wrap with tooltip if needed
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span onClick={onClickHandler}>
              {renderStockSymbol()}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-xs">
              <div className="font-medium">{stock.name}</div>
              <div className="flex justify-between mt-1">
                <span>Current Price:</span>
                <span className="ml-2 font-medium">₹{stock.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span className={`ml-2 ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-center mt-1 text-muted-foreground">Click to trade</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Without tooltip
  return (
    <span onClick={onClickHandler}>
      {renderStockSymbol()}
    </span>
  );
}

// Default export for backward compatibility
export default UniversalStockSymbol;