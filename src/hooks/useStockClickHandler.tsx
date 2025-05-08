import { useCallback } from 'react';
import { useTrade } from '@/contexts/TradeContext';
import { Stock, FuturesContract, OptionsContract } from '@/types/trading';

/**
 * Hook to provide a universal click handler for stocks across the application
 * This ensures consistent behavior when clicking on any stock symbol or reference
 */
export function useStockClickHandler() {
  const { 
    openQuickTradeModal, 
    openFuturesTradeModal, 
    openOptionsTradeModal 
  } = useTrade();

  /**
   * Universal handler for stock clicks
   * @param stock The stock to trade
   * @param tradeType Optional trade type (BUY/SELL)
   * @param event Optional event to prevent propagation
   */
  const handleStockClick = useCallback((
    stock: Stock, 
    tradeType: 'BUY' | 'SELL' = 'BUY',
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }
    openQuickTradeModal(stock, tradeType);
  }, [openQuickTradeModal]);

  /**
   * Universal handler for futures contract clicks
   * @param stock The underlying stock
   * @param contract The futures contract
   * @param tradeType Optional trade type (BUY/SELL)
   * @param event Optional event to prevent propagation
   */
  const handleFuturesClick = useCallback((
    stock: Stock,
    contract: FuturesContract,
    tradeType: 'BUY' | 'SELL' = 'BUY',
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }
    openFuturesTradeModal(stock, contract, tradeType);
  }, [openFuturesTradeModal]);

  /**
   * Universal handler for options contract clicks
   * @param stock The underlying stock
   * @param contract The options contract
   * @param tradeType Optional trade type (BUY/SELL)
   * @param event Optional event to prevent propagation
   */
  const handleOptionsClick = useCallback((
    stock: Stock,
    contract: OptionsContract,
    tradeType: 'BUY' | 'SELL' = 'BUY',
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }
    openOptionsTradeModal(stock, contract, tradeType);
  }, [openOptionsTradeModal]);

  return {
    handleStockClick,
    handleFuturesClick,
    handleOptionsClick
  };
}