// Token logo utilities for CDN integration

export interface TokenLogoConfig {
  id: string;
  symbol: string;
  name: string;
  coingeckoId?: string;
  logoUrl?: string;
}

// Popular tokens with their CoinGecko direct URLs
export const TOKEN_LOGOS: Record<string, TokenLogoConfig> = {
  'BTC': {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    logoUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  'ETH': {
    id: '279',
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    logoUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
  },
  'USDT': {
    id: '325',
    symbol: 'USDT',
    name: 'Tether',
    coingeckoId: 'tether',
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png'
  },
  'BNB': {
    id: '825',
    symbol: 'BNB',
    name: 'BNB',
    coingeckoId: 'binancecoin',
    logoUrl: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
  },
  'SOL': {
    id: '4128',
    symbol: 'SOL',
    name: 'Solana',
    coingeckoId: 'solana',
    logoUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
  },
  'USDC': {
    id: '6319',
    symbol: 'USDC',
    name: 'USD Coin',
    coingeckoId: 'usd-coin',
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'
  },
  'XRP': {
    id: '44',
    symbol: 'XRP',
    name: 'XRP',
    coingeckoId: 'ripple',
    logoUrl: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png'
  },
  'ADA': {
    id: '975',
    symbol: 'ADA',
    name: 'Cardano',
    coingeckoId: 'cardano',
    logoUrl: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
  },
  'DOGE': {
    id: '5',
    symbol: 'DOGE',
    name: 'Dogecoin',
    coingeckoId: 'dogecoin',
    logoUrl: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png'
  },
  'AVAX': {
    id: '12559',
    symbol: 'AVAX',
    name: 'Avalanche',
    coingeckoId: 'avalanche-2',
    logoUrl: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png'
  },
  'MATIC': {
    id: '4713',
    symbol: 'MATIC',
    name: 'Polygon',
    coingeckoId: 'matic-network',
    logoUrl: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png'
  },
  'DOT': {
    id: '12171',
    symbol: 'DOT',
    name: 'Polkadot',
    coingeckoId: 'polkadot',
    logoUrl: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'
  },
  'LINK': {
    id: '877',
    symbol: 'LINK',
    name: 'Chainlink',
    coingeckoId: 'chainlink',
    logoUrl: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png'
  },
  'UNI': {
    id: '12504',
    symbol: 'UNI',
    name: 'Uniswap',
    coingeckoId: 'uniswap',
    logoUrl: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-v2.png'
  },
  'LTC': {
    id: '2',
    symbol: 'LTC',
    name: 'Litecoin',
    coingeckoId: 'litecoin',
    logoUrl: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png'
  },
  'ATOM': {
    id: '1481',
    symbol: 'ATOM',
    name: 'Cosmos',
    coingeckoId: 'cosmos',
    logoUrl: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png'
  },
  'BCH': {
    id: '780',
    symbol: 'BCH',
    name: 'Bitcoin Cash',
    coingeckoId: 'bitcoin-cash',
    logoUrl: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash.png'
  },
  'XLM': {
    id: '100',
    symbol: 'XLM',
    name: 'Stellar',
    coingeckoId: 'stellar',
    logoUrl: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png'
  },
  'EOS': {
    id: '738',
    symbol: 'EOS',
    name: 'EOS',
    coingeckoId: 'eos',
    logoUrl: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png'
  },
  'TRX': {
    id: '1094',
    symbol: 'TRX',
    name: 'TRON',
    coingeckoId: 'tron',
    logoUrl: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png'
  },
  'NEO': {
    id: '480',
    symbol: 'NEO',
    name: 'NEO',
    coingeckoId: 'neo',
    logoUrl: 'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png'
  },
  'VET': {
    id: '307',
    symbol: 'VET',
    name: 'VeChain',
    coingeckoId: 'vechain',
    logoUrl: 'https://assets.coingecko.com/coins/images/307/large/vechain.png'
  },
  'FIL': {
    id: '12817',
    symbol: 'FIL',
    name: 'Filecoin',
    coingeckoId: 'filecoin',
    logoUrl: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png'
  }
};

// CoinGecko CDN URL generator
export function getTokenLogoUrl(
  symbol: string, 
  size: 'small' | 'large' = 'small'
): string {
  const token = TOKEN_LOGOS[symbol.toUpperCase()];
  
  if (!token) {
    // Fallback to a generic crypto icon
    return `https://via.placeholder.com/32x32/1f2937/ffffff?text=${symbol.charAt(0)}`;
  }
  
  // Use direct logoUrl if available, otherwise fallback to old format
  if (token.logoUrl) {
    return token.logoUrl;
  }
  
  return `https://assets.coingecko.com/coins/images/${token.id}/${size}.png`;
}

// Alternative CDN sources
export function getTokenLogoUrlAlternative(
  symbol: string,
  size: 'small' | 'large' = 'small'
): string {
  const token = TOKEN_LOGOS[symbol.toUpperCase()];
  
  if (!token) {
    return `https://via.placeholder.com/32x32/1f2937/ffffff?text=${symbol.charAt(0)}`;
  }
  
  // Using cryptologos.cc as alternative
  const sizeParam = size === 'large' ? '200' : '32';
  return `https://cryptologos.cc/logos/${token.coingeckoId}-${token.symbol.toLowerCase()}-logo.png?v=${sizeParam}`;
}

// Get token info by symbol
export function getTokenInfo(symbol: string): TokenLogoConfig | null {
  return TOKEN_LOGOS[symbol.toUpperCase()] || null;
}

// Get all available tokens
export function getAllTokens(): TokenLogoConfig[] {
  return Object.values(TOKEN_LOGOS);
}
