import { User, Token, Transaction, LeaderboardEntry, HeatmapData, UserStats } from '@/types';

export const mockUser: User = {
  id: '1',
  fid: 12345,
  basename: 'base.john.eth',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  username: 'john'
};

export const mockTokens: Token[] = [
  {
    id: '1',
    symbol: 'ETH',
    name: 'Ethereum',
    icon: undefined,
    balance: 2.5,
    value: 6500,
    change24h: 3.2
  },
  {
    id: '2',
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: undefined,
    balance: 0.15,
    value: 10500,
    change24h: -1.8
  },
  {
    id: '3',
    symbol: 'SOL',
    name: 'Solana',
    icon: undefined,
    balance: 25,
    value: 3750,
    change24h: 5.7
  },
  {
    id: '4',
    symbol: 'USDC',
    name: 'USD Coin',
    icon: undefined,
    balance: 5000,
    value: 5000,
    change24h: 0.1
  },
  {
    id: '5',
    symbol: 'BNB',
    name: 'BNB',
    icon: undefined,
    balance: 15,
    value: 9000,
    change24h: 2.1
  },
  {
    id: '6',
    symbol: 'ADA',
    name: 'Cardano',
    icon: undefined,
    balance: 1000,
    value: 450,
    change24h: -0.8
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    token: 'ETH',
    type: 'buy',
    amount: 0.5,
    value: 1300,
    timestamp: new Date('2024-01-15')
  },
  {
    id: '2',
    token: 'BTC',
    type: 'sell',
    amount: 0.1,
    value: 7000,
    timestamp: new Date('2024-01-14')
  },
  {
    id: '3',
    token: 'SOL',
    type: 'buy',
    amount: 10,
    value: 1500,
    timestamp: new Date('2024-01-13')
  }
];

export const mockLeaderboard: LeaderboardEntry[] = Array.from({ length: 50 }, (_, i) => ({
  rank: i + 1,
  user: {
    id: `user-${i + 1}`,
    fid: 10000 + i,
    basename: `base.user${i + 1}.eth`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
    username: `user${i + 1}`
  },
  txCount: Math.floor(Math.random() * 1000) + 50,
  volume: Math.floor(Math.random() * 1000000) + 10000,
  change24h: (Math.random() - 0.5) * 20
}));

export const mockHeatmapData: HeatmapData[] = [
  // Major cryptocurrencies - Large volumes (Muted dark colors)
  { symbol: 'BTC', volume: 45000000, change24h: 2.3, size: 100, color: '#475569', txCount: 125000 },
  { symbol: 'ETH', volume: 32000000, change24h: -1.2, size: 85, color: '#4c1d95', txCount: 98000 },
  { symbol: 'SOL', volume: 18000000, change24h: 5.7, size: 70, color: '#065f46', txCount: 75000 },
  { symbol: 'BNB', volume: 12000000, change24h: 1.8, size: 60, color: '#92400e', txCount: 65000 },
  
  // Mid-tier cryptocurrencies - Medium volumes
  { symbol: 'XRP', volume: 8000000, change24h: -0.5, size: 50, color: '#3730a3', txCount: 45000 },
  { symbol: 'ADA', volume: 6500000, change24h: 3.2, size: 45, color: '#b45309', txCount: 38000 },
  { symbol: 'DOGE', volume: 5500000, change24h: -2.1, size: 40, color: '#991b1b', txCount: 32000 },
  { symbol: 'AVAX', volume: 4800000, change24h: 0.8, size: 38, color: '#be185d', txCount: 28000 },
  { symbol: 'DOT', volume: 4200000, change24h: -1.5, size: 35, color: '#166534', txCount: 25000 },
  { symbol: 'MATIC', volume: 3800000, change24h: 2.1, size: 32, color: '#c2410c', txCount: 22000 },
  
  // Smaller but significant - Medium-small volumes
  { symbol: 'LINK', volume: 3200000, change24h: 1.2, size: 28, color: '#0f766e', txCount: 18000 },
  { symbol: 'UNI', volume: 2800000, change24h: -0.8, size: 25, color: '#7c2d12', txCount: 15000 },
  { symbol: 'LTC', volume: 2400000, change24h: 0.5, size: 22, color: '#374151', txCount: 12000 },
  { symbol: 'ATOM', volume: 2000000, change24h: 1.8, size: 20, color: '#1e40af', txCount: 10000 },
  { symbol: 'BCH', volume: 1800000, change24h: -1.2, size: 18, color: '#1e3a8a', txCount: 8500 }
];

export const mockUserStats: UserStats = {
  tokensTradedThisMonth: 15,
  totalVolume: 125000,
  favoriteCoin: 'ETH',
  tradingAura: 87,
  totalTxCount: 156,
  pnl: 12.5
};

// Add current user to leaderboard at position 25
export const leaderboardWithUser = [
  ...mockLeaderboard.slice(0, 24),
  {
    rank: 25,
    user: mockUser,
    txCount: 156,
    volume: 125000,
    change24h: 12.5
  },
  ...mockLeaderboard.slice(24)
];
