import React, { createContext, useContext, useState } from 'react';
import { Stock } from '@/types/trading';

interface TradeContextType {
  isQuickTradeModalOpen: boolean;
  selectedStock: Stock | null;
  initialTradeType: 'BUY' | 'SELL';
  openQuickTradeModal: (stock: Stock, tradeType?: 'BUY' | 'SELL') => void;
  closeQuickTradeModal: () => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [isQuickTradeModalOpen, setIsQuickTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [initialTradeType, setInitialTradeType] = useState<'BUY' | 'SELL'>('BUY');

  const openQuickTradeModal = (stock: Stock, tradeType: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedStock(stock);
    setInitialTradeType(tradeType);
    setIsQuickTradeModalOpen(true);
  };

  const closeQuickTradeModal = () => {
    setIsQuickTradeModalOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      setSelectedStock(null);
    }, 300);
  };

  return (
    <TradeContext.Provider
      value={{
        isQuickTradeModalOpen,
        selectedStock,
        initialTradeType,
        openQuickTradeModal,
        closeQuickTradeModal
      }}
    >
      {children}
    </TradeContext.Provider>
  );
}

export function useTrade() {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
}