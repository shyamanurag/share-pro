import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Stock, FuturesContract, OptionsContract } from '@/types/trading';

interface FnOSymbolWrapperProps {
  stock: Stock;
  contract: FuturesContract | OptionsContract;
  contractType: 'FUTURES' | 'OPTIONS';
  children: React.ReactNode;
  tradeType?: 'BUY' | 'SELL';
}

export default function FnOSymbolWrapper({
  stock,
  contract,
  contractType,
  children,
  tradeType = 'BUY'
}: FnOSymbolWrapperProps) {
  const { openFuturesTradeModal, openOptionsTradeModal } = useTrade();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (contractType === 'FUTURES') {
      openFuturesTradeModal(stock, contract as FuturesContract, tradeType);
    } else if (contractType === 'OPTIONS') {
      openOptionsTradeModal(stock, contract as OptionsContract, tradeType);
    }
  };

  return (
    <span 
      onClick={handleClick}
      className="cursor-pointer hover:text-primary transition-colors duration-200"
    >
      {children}
    </span>
  );
}