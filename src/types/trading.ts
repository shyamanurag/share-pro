export interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
  sector: string | null;
  exchange?: string;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockId: string;
  addedAt: string;
  stock: Stock;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItem {
  id: string;
  portfolioId: string;
  stockId: string;
  quantity: number;
  avgBuyPrice: number;
  stock: Stock;
}

export interface Transaction {
  id: string;
  userId: string;
  stockId: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
  stock: Stock;
  orderType?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  balance: number;
  createdAt: string;
}

export interface FuturesContract {
  id: string;
  stockId: string;
  expiryDate: string;
  contractPrice: number;
  lotSize: number;
  marginRequired: number;
  openInterest: number;
}

export interface OptionsContract {
  id: string;
  stockId: string;
  type: 'CALL' | 'PUT';
  strikePrice: number;
  expiryDate: string;
  premiumPrice: number;
  lotSize: number;
  impliedVolatility: number;
  delta: number;
  theta: number;
}

export interface TechnicalIndicator {
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
}

export interface TechnicalIndicators {
  rsi: TechnicalIndicator;
  macd: TechnicalIndicator;
  ema: TechnicalIndicator;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
  };
}