import React, { createContext, useContext, useState } from 'react';
import { Stock, FuturesContract, OptionsContract } from '@/types/trading';

interface TradeContextType {
  isQuickTradeModalOpen: boolean;
  selectedStock: Stock | null;
  initialTradeType: 'BUY' | 'SELL';
  openQuickTradeModal: (stock: Stock, tradeType?: 'BUY' | 'SELL') => void;
  closeQuickTradeModal: () => void;
  isShareModalOpen: boolean;
  openShareModal: (stock: Stock) => void;
  closeShareModal: () => void;
  // F&O Trading
  selectedFuturesContract: FuturesContract | null;
  selectedOptionsContract: OptionsContract | null;
  tradeMode: 'STOCK' | 'FUTURES' | 'OPTIONS';
  openFuturesTradeModal: (stock: Stock, contract: FuturesContract, tradeType?: 'BUY' | 'SELL') => void;
  openOptionsTradeModal: (stock: Stock, contract: OptionsContract, tradeType?: 'BUY' | 'SELL') => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [isQuickTradeModalOpen, setIsQuickTradeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [initialTradeType, setInitialTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedFuturesContract, setSelectedFuturesContract] = useState<FuturesContract | null>(null);
  const [selectedOptionsContract, setSelectedOptionsContract] = useState<OptionsContract | null>(null);
  const [tradeMode, setTradeMode] = useState<'STOCK' | 'FUTURES' | 'OPTIONS'>('STOCK');

  const openQuickTradeModal = (stock: Stock, tradeType: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedStock(stock);
    setInitialTradeType(tradeType);
    setTradeMode('STOCK');
    setSelectedFuturesContract(null);
    setSelectedOptionsContract(null);
    setIsQuickTradeModalOpen(true);
  };

  const closeQuickTradeModal = () => {
    setIsQuickTradeModalOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      setSelectedStock(null);
    }, 300);
  };
  
  const openShareModal = (stock: Stock) => {
    setSelectedStock(stock);
    setIsShareModalOpen(true);
  };
  
  const closeShareModal = () => {
    setIsShareModalOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      setSelectedStock(null);
    }, 300);
  };

  const openFuturesTradeModal = (stock: Stock, contract: FuturesContract, tradeType: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedStock(stock);
    setSelectedFuturesContract(contract);
    setSelectedOptionsContract(null);
    setInitialTradeType(tradeType);
    setTradeMode('FUTURES');
    setIsQuickTradeModalOpen(true);
  };

  const openOptionsTradeModal = (stock: Stock, contract: OptionsContract, tradeType: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedStock(stock);
    setSelectedOptionsContract(contract);
    setSelectedFuturesContract(null);
    setInitialTradeType(tradeType);
    setTradeMode('OPTIONS');
    setIsQuickTradeModalOpen(true);
  };

  return (
    <TradeContext.Provider
      value={{
        isQuickTradeModalOpen,
        selectedStock,
        initialTradeType,
        openQuickTradeModal,
        closeQuickTradeModal,
        isShareModalOpen,
        openShareModal,
        closeShareModal,
        selectedFuturesContract,
        selectedOptionsContract,
        tradeMode,
        openFuturesTradeModal,
        openOptionsTradeModal
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