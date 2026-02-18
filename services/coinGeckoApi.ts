import axios from 'axios';
import { CryptoPrice } from '../types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In-memory cache
let cachedPrices: CryptoPrice | null = null;
let lastFetchTime = 0;

export const getCryptoPrices = async (): Promise<CryptoPrice | null> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedPrices && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('Using cached crypto prices');
    return cachedPrices;
  }

  try {
    const response = await axios.get(
      `${COINGECKO_API}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd`,
      { timeout: 5000 } // 5 second timeout
    );
    
    cachedPrices = response.data;
    lastFetchTime = now;
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.log('Rate limited by CoinGecko - using cached or default prices');
      // Return cached data even if expired, or defaults
      if (cachedPrices) return cachedPrices;
      
      // Return default prices if no cache
      return {
        bitcoin: { usd: 67000 },
        ethereum: { usd: 1950 },
      };
    }
    
    console.log('Error fetching crypto prices:', error.message);
    
    // Return cached or defaults on any error
    if (cachedPrices) return cachedPrices;
    return {
      bitcoin: { usd: 67000 },
      ethereum: { usd: 1950 },
    };
  }
};

export const convertUSDToCrypto = (
  usdAmount: number,
  cryptoPrice: number
): string => {
  const cryptoAmount = usdAmount / cryptoPrice;
  return cryptoAmount.toFixed(8);
};