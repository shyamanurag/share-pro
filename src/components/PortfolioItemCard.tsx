import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  ArrowUpRight
} from 'lucide-react';
import StockSymbolWrapper from './StockSymbolWrapper';
import { PortfolioItem, Stock } from '@/types/trading';

interface PortfolioItemCardProps {
  item: PortfolioItem;
  openTradeDialog: (stock: Stock, type: 'BUY' | 'SELL') => void;
}

export default function PortfolioItemCard({ 
  item, 
  openTradeDialog 
}: PortfolioItemCardProps) {
  const currentValue = item.quantity * item.stock.currentPrice;
  const costBasis = item.quantity * item.avgBuyPrice;
  const profit = currentValue - costBasis;
  const profitPercent = (profit / costBasis) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:border-green-500/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <StockSymbolWrapper stock={item.stock}>
                  <h3 className="font-bold">{item.stock.symbol}</h3>
                </StockSymbolWrapper>
                <Badge variant="outline" className="text-xs">
                  {item.quantity} shares
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {item.stock.sector || 'Other'}
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
                {profit >= 0 ?  (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                <span>{profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>Avg. Buy: ₹{item.avgBuyPrice.toFixed(2)}</div>
              <div>Current: ₹{item.stock.currentPrice.toFixed(2)}</div>
              <div>Day Change: {item.stock.changePercent.toFixed(2)}%</div>
            </div>
            <div className="mt-3 flex justify-between">
              <Button 
                size="sm"
                className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                onClick={() => openTradeDialog(item.stock, 'BUY')}
              >
                <ShoppingCart className="w-3 h-3 mr-1" /> Buy More
              </Button>
              <Button 
                size="sm"
                className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
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
}