import React from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Stock } from '@/types/trading';

interface StockSymbolWrapperProps {
  stock: Stock;
  children: React.ReactNode;
  className?: string;
}

/**
 * A wrapper component that makes any stock symbol clickable to open the quick trade modal
 */
export default function StockSymbolWrapper({
  stock,
  children,
  className = ''
}: StockSymbolWrapperProps) {
  const { openQuickTradeModal } = useTrade();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickTradeModal(stock);
  };

  return (
    <span 
      className={`cursor-pointer hover:text-primary transition-colors ${className}`}
      onClick={handleClick}
    >
      {children}
    </span>
  );
}