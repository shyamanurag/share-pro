import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndianRupee, Calendar, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { useTrade } from '@/contexts/TradeContext';
import FnOSymbolWrapper from './FnOSymbolWrapper';

interface FnOPositionCardProps {
  position: any;
  type: 'FUTURES' | 'OPTIONS';
}

export default function FnOPositionCard({ position, type }: FnOPositionCardProps) {
  const { openFuturesTradeModal, openOptionsTradeModal } = useTrade();

  const handleSquareOff = () => {
    if (type === 'FUTURES') {
      openFuturesTradeModal(position.contract.stock, position.contract, 'SELL');
    } else if (type === 'OPTIONS') {
      openOptionsTradeModal(position.contract.stock, position.contract, 'SELL');
    }
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-1">
              <FnOSymbolWrapper 
                stock={position.contract.stock} 
                contract={position.contract}
                contractType={type}
              >
                <span className="font-bold text-lg">{position.contract.stock.symbol}</span>
              </FnOSymbolWrapper>
              
              <Badge variant="outline" className="ml-1">
                {type}
              </Badge>
              
              {type === 'OPTIONS' && (
                <Badge className={position.contract.type === 'CALL' ? 'bg-green-500' : 'bg-red-500'}>
                  {position.contract.type}
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mt-1">
              {type === 'FUTURES' ? (
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Expiry: {new Date(position.contract.expiryDate).toLocaleDateString()}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Strike: ₹{position.contract.strikePrice} | Expiry: {new Date(position.contract.expiryDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold flex items-center justify-end">
              <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
              {type === 'FUTURES' 
                ? position.contract.contractPrice.toFixed(2)
                : position.contract.premiumPrice.toFixed(2)
              }
            </div>
            <div className={`flex items-center justify-end text-sm ${getPnlColor(position.pnl)}`}>
              {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)} 
              ({position.pnl >= 0 ? '+' : ''}
              {((position.pnl / (position.entryPrice * position.quantity * (type === 'FUTURES' ? position.contract.lotSize : position.contract.lotSize))) * 100).toFixed(2)}%)
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
          <div>
            <p className="text-xs text-muted-foreground">Quantity (Lots)</p>
            <p className="font-medium">{position.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entry Price</p>
            <p className="font-medium flex items-center">
              <IndianRupee className="w-3 h-3 mr-0.5" />
              {position.entryPrice.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="font-medium flex items-center">
              <IndianRupee className="w-3 h-3 mr-0.5" />
              {position.currentPrice.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="font-medium flex items-center">
              <IndianRupee className="w-3 h-3 mr-0.5" />
              {(position.currentPrice * position.quantity * (type === 'FUTURES' ? position.contract.lotSize : position.contract.lotSize)).toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex justify-end">
          <Button 
            size="sm" 
            variant="outline"
            className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleSquareOff}
          >
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Square Off
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}