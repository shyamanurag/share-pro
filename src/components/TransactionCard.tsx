import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';
import StockSymbolWrapper from './StockSymbolWrapper';
import { Transaction } from '@/types/trading';

interface TransactionCardProps {
  transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:border-blue-500/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <Badge variant={transaction.type === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                  {transaction.type}
                </Badge>
                <StockSymbolWrapper stock={transaction.stock}>
                  <h3 className="font-bold">{transaction.stock.symbol}</h3>
                </StockSymbolWrapper>
                <Badge variant="outline" className="text-xs">
                  {transaction.quantity} shares
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{transaction.stock.name}</p>
            </div>
            <div className="text-right">
              <p className="font-bold flex items-center justify-end">
                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                {transaction.total.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(transaction.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>Price: ₹{transaction.price.toFixed(2)}</div>
              <div>Total: ₹{transaction.total.toFixed(2)}</div>
              <div>Order Type: {transaction.orderType || 'Market'}</div>
            </div>
            
            {/* Current value comparison (for BUY orders) */}
            {transaction.type === 'BUY' && (
              <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-center">
                <span className="text-xs">Current Value:</span>
                <div className="flex items-center">
                  <span className="text-xs font-medium mr-2">
                    ₹{(transaction.stock.currentPrice * transaction.quantity).toFixed(2)}
                  </span>
                  <Badge 
                    variant={transaction.stock.currentPrice > transaction.price ? "success" : "destructive"} 
                    className="text-[10px] h-4"
                  >
                    {transaction.stock.currentPrice > transaction.price ? '+' : ''}
                    {(((transaction.stock.currentPrice - transaction.price) / transaction.price) * 100).toFixed(2)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}