export interface User {
  id: string;
  fid: number;
  basename: string;
  avatar: string;
  username: string;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  value: number;
  change24h: number;
}

export interface Transaction {
  id: string;
  token: string;
  type: 'buy' | 'sell';
  amount: number;
  value: number;
  timestamp: Date;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  txCount: number;
  volume: number;
  change24h: number;
}

export interface HeatmapData {
  symbol: string;
  volume: number;
  change24h: number;
  size: number;
  color: string;
  txCount?: number;
}

export interface UserStats {
  tokensTradedThisMonth: number;
  totalVolume: number;
  favoriteCoin: string;
  tradingAura: number;
  totalTxCount: number;
  pnl: number;
}
