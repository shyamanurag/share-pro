import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Star,
  ShoppingCart,
  ArrowUpRight,
  Share2
} from 'lucide-react';
import { useTrade } from '@/contexts/TradeContext';
import StockSymbolWrapper from './StockSymbolWrapper';
import { Stock } from '@/types/trading';

interface StockCardProps {
  stock: Stock;
  isInWatchlist: boolean;
  toggleWatchlist: () => void;
  openTradeDialog: (stock: Stock, type: 'BUY' | 'SELL') => void;
}

export default function StockCard({ 
  stock, 
  isInWatchlist, 
  toggleWatchlist, 
  openTradeDialog 
}: StockCardProps) {
  const { openShareModal } = useTrade();
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
                <StockSymbolWrapper stock={stock}>
                  <h3 className="font-bold">{stock.symbol}</h3>
                </StockSymbolWrapper>
                <Badge variant="outline" className="text-xs">
                  {stock.sector}
                </Badge>
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 relative"
                    onClick={toggleWatchlist}
                  >
                    {isInWatchlist ? (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <Star className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                    {isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="font-bold flex items-center justify-end">
                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                {stock.currentPrice.toFixed(2)}
              </p>
              <div className={`flex items-center justify-end text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stock.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                <span>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Volume: {stock.volume.toLocaleString()}</div>
              <div>Market Cap: ₹{(stock.marketCap ? (stock.marketCap / 10000000).toFixed(2) : "N/A")} Cr</div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <Button 
                  size="sm"
                  className="w-[48%] bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => openTradeDialog(stock, 'BUY')}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                </Button>
                <Button 
                  size="sm"
                  className="w-[48%] bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => openTradeDialog(stock, 'SELL')}
                >
                  <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => openShareModal(stock)}
              >
                <Share2 className="w-3 h-3 mr-1" /> Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}