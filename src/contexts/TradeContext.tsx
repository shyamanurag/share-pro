import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Stock, FuturesContract, OptionsContract, Transaction } from '@/types/trading';
import { toast } from '@/components/ui/use-toast';

interface TradeContextType {
  // Modal state
  isQuickTradeModalOpen: boolean;
  selectedStock: Stock | null;
  initialTradeType: 'BUY' | 'SELL';
  
  // Modal actions
  openQuickTradeModal: (stock: Stock, tradeType?: 'BUY' | 'SELL') => void;
  closeQuickTradeModal: () => void;
  
  // Share modal
  isShareModalOpen: boolean;
  openShareModal: (stock: Stock) => void;
  closeShareModal: () => void;
  
  // F&O Trading
  selectedFuturesContract: FuturesContract | null;
  selectedOptionsContract: OptionsContract | null;
  tradeMode: 'STOCK' | 'FUTURES' | 'OPTIONS';
  openFuturesTradeModal: (stock: Stock, contract: FuturesContract, tradeType?: 'BUY' | 'SELL') => void;
  openOptionsTradeModal: (stock: Stock, contract: OptionsContract, tradeType?: 'BUY' | 'SELL') => void;
  
  // Transaction history
  recentTransactions: Transaction[];
  refreshTransactions: () => Promise<void>;
  
  // Universal trading
  executeUniversalTrade: (
    stock: Stock, 
    quantity: number, 
    tradeType: 'BUY' | 'SELL', 
    orderType?: 'MARKET' | 'LIMIT' | 'STOP',
    limitPrice?: number,
    stopPrice?: number
  ) => Promise<boolean>;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  // Modal state
  const [isQuickTradeModalOpen, setIsQuickTradeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [initialTradeType, setInitialTradeType] = useState<'BUY' | 'SELL'>('BUY');
  
  // F&O state
  const [selectedFuturesContract, setSelectedFuturesContract] = useState<FuturesContract | null>(null);
  const [selectedOptionsContract, setSelectedOptionsContract] = useState<OptionsContract | null>(null);
  const [tradeMode, setTradeMode] = useState<'STOCK' | 'FUTURES' | 'OPTIONS'>('STOCK');
  
  // Transaction history
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  // Refresh transaction history
  const refreshTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      setRecentTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);
  
  // Initialize transaction history
  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // Open quick trade modal for stocks
  const openQuickTradeModal = useCallback((stock: Stock, tradeType: 'BUY' | 'SELL' = 'BUY') => {
    setSelectedStock(stock);
    setInitialTradeType(tradeType);
    setTradeMode('STOCK');
    setSelectedFuturesContract(null);
    setSelectedOptionsContract(null);
    setIsQuickTradeModalOpen(true);
  }, []);

  const closeQuickTradeModal = useCallback(() => {
    setIsQuickTradeModalOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      setSelectedStock(null);
    }, 300);
  }, []);
  
  const openShareModal = useCallback((stock: Stock) => {
    setSelectedStock(stock);
    setIsShareModalOpen(true);
  }, []);
  
  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      setSelectedStock(null);
    }, 300);
  }, []);

  const openFuturesTradeModal = useCallback((
    stock: Stock, 
    contract: FuturesContract, 
    tradeType: 'BUY' | 'SELL' = 'BUY'
  ) => {
    setSelectedStock(stock);
    setSelectedFuturesContract(contract);
    setSelectedOptionsContract(null);
    setInitialTradeType(tradeType);
    setTradeMode('FUTURES');
    setIsQuickTradeModalOpen(true);
  }, []);

  const openOptionsTradeModal = useCallback((
    stock: Stock, 
    contract: OptionsContract, 
    tradeType: 'BUY' | 'SELL' = 'BUY'
  ) => {
    setSelectedStock(stock);
    setSelectedOptionsContract(contract);
    setSelectedFuturesContract(null);
    setInitialTradeType(tradeType);
    setTradeMode('OPTIONS');
    setIsQuickTradeModalOpen(true);
  }, []);

  // Execute a trade directly without opening the modal
  const executeUniversalTrade = useCallback(async (
    stock: Stock,
    quantity: number,
    tradeType: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT' | 'STOP' = 'MARKET',
    limitPrice?: number,
    stopPrice?: number
  ): Promise<boolean> => {
    try {
      // Prepare order details
      const orderDetails = {
        stockId: stock.id,
        type: tradeType,
        quantity,
        orderType,
        ...(orderType === 'LIMIT' && limitPrice && { limitPrice }),
        ...(orderType === 'STOP' && stopPrice && { stopPrice })
      };
      
      // Execute the trade
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDetails),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute trade');
      }
      
      const data = await response.json();
      
      // Show success message
      toast({
        title: `${tradeType === 'BUY' ? 'Purchase' : 'Sale'} Successful`,
        description: `${tradeType === 'BUY' ? 'Bought' : 'Sold'} ${quantity} shares of ${stock.symbol} at ₹${stock.currentPrice.toFixed(2)}`,
      });
      
      // Refresh transactions
      refreshTransactions();
      
      return true;
    } catch (error: any) {
      console.error('Error executing trade:', error);
      
      // Show error message
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
      });
      
      return false;
    }
  }, [refreshTransactions]);

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
        openOptionsTradeModal,
        recentTransactions,
        refreshTransactions,
        executeUniversalTrade
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