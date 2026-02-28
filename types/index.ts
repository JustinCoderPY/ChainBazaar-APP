export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // USD
  category: string;
  imageUrls: string[]; // CHANGED: Now array of images
  sellerId: string;
  sellerName: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CryptoPrice {
  bitcoin: {
    usd: number;
  };
  ethereum: {
    usd: number;
  };
}

// ─── CoinGecko Response Shape ────────────────────────────────
// Matches: GET /simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true
export interface CoinGeckoSimplePriceResponse {
  bitcoin: {
    usd: number;
    usd_24h_change?: number;
  };
  ethereum: {
    usd: number;
    usd_24h_change?: number;
  };
}

// ─── App-level Crypto Price State ────────────────────────────
export interface CryptoPrices {
  btcPrice: number;
  ethPrice: number;
  btcChange24h: number;   // percent, e.g. 2.5 means +2.5%
  ethChange24h: number;
  lastUpdated: number;    // Date.now() timestamp
}