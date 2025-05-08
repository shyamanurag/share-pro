import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  BarChart2,
  Share2
} from 'lucide-react';
import { useTrade } from '@/contexts/TradeContext';
import StockSymbolWrapper from './StockSymbolWrapper';
import { Stock } from '@/types/trading';

interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockId: string;
  addedAt: string;
  stock: Stock;
}

interface WatchlistStockCardProps {
  item: WatchlistItem;
  toggleWatchlist: () => void;
  openTradeDialog: (stock: Stock, type: 'BUY' | 'SELL') => void;
}

export default function WatchlistStockCard({ 
  item, 
  toggleWatchlist, 
  openTradeDialog 
}: WatchlistStockCardProps) {
  const { openShareModal } = useTrade();
  const [expanded, setExpanded] = useState(false);
  
  // Simulate additional stock data that's not in our model
  const openingPrice = item.stock.previousClose * (1 + (Math.random() * 0.02 - 0.01));
  const dayHigh = Math.max(item.stock.currentPrice, item.stock.previousClose) * (1 + Math.random() * 0.015);
  const dayLow = Math.min(item.stock.currentPrice, item.stock.previousClose) * (1 - Math.random() * 0.015);
  const avgTradePrice = (openingPrice + item.stock.currentPrice) / 2;
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 ${expanded ? 'border-green-500/70 shadow-md' : 'hover:border-green-500/30'}`}>
      <CardContent className="p-0">
        {/* Main card content - always visible */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <StockSymbolWrapper stock={item.stock}>
                  <h3 className="font-bold">{item.stock.symbol}</h3>
                </StockSymbolWrapper>
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist();
                    }}
                  >
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </Button>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                    Remove from watchlist
                  </div>
                </div>
                {expanded ? 
                  <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
              <p className="text-sm text-muted-foreground">{item.stock.name}</p>
            </div>
            <div className="text-right">
              <p className="font-bold flex items-center justify-end">
                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                {item.stock.currentPrice.toFixed(2)}
              </p>
              <div className={`flex items-center justify-end text-sm ${item.stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.stock.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                <span>{item.stock.change >= 0 ? '+' : ''}{item.stock.change.toFixed(2)} ({item.stock.change >= 0 ? '+' : ''}{item.stock.changePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
          
          {/* Price metrics - always visible */}
          <div className="mt-3 grid grid-cols-5 gap-1 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
              <p className="text-muted-foreground mb-1">Open</p>
              <p className="font-medium">₹{openingPrice.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
              <p className="text-muted-foreground mb-1">Current</p>
              <p className="font-medium">₹{item.stock.currentPrice.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
              <p className="text-muted-foreground mb-1">High</p>
              <p className="font-medium text-green-600">₹{dayHigh.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
              <p className="text-muted-foreground mb-1">Low</p>
              <p className="font-medium text-red-600">₹{dayLow.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
              <p className="text-muted-foreground mb-1">Avg</p>
              <p className="font-medium">₹{avgTradePrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        {/* Expanded content - only visible when expanded */}
        {expanded && (
          <div className="p-4 pt-0 mt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Volume: {item.stock.volume.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2 justify-end">
                <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Market Cap: {item.stock.marketCap ? (item.stock.marketCap / 10000000).toFixed(2) + " Cr" : "N/A"}
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTradeDialog(item.stock, 'BUY');
                  }}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" /> Buy
                </Button>
                <Button 
                  size="sm"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTradeDialog(item.stock, 'SELL');
                  }}
                >
                  <ArrowUpRight className="w-3 h-3 mr-1" /> Sell
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    openShareModal(item.stock);
                  }}
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}