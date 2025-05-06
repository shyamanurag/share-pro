import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Stock } from '@/types/trading';
import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StockSymbolProps {
  stock: Stock;
  showPrice?: boolean;
  showChange?: boolean;
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function StockSymbol({
  stock,
  showPrice = true,
  showChange = false,
  showBadge = false,
  className = '',
  onClick
}: StockSymbolProps) {
  const { openQuickTradeModal } = useTrade();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else {
      openQuickTradeModal(stock);
    }
  };

  return (
    <span 
      className={`inline-flex items-center cursor-pointer hover:text-primary transition-colors ${className}`}
      onClick={handleClick}
    >
      <span className="font-medium">{stock.symbol}</span>
      
      {showBadge && (
        <Badge variant="outline" className="ml-1 text-xs">
          {stock.exchange || 'NSE'}
        </Badge>
      )}
      
      {showPrice && (
        <span className="ml-1.5 flex items-center text-sm">
          <IndianRupee className="w-3 h-3 mr-0.5" />
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
    </span>
  );
}