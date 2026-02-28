import axios from 'axios';
import { CoinGeckoSimplePriceResponse, CryptoPrices } from '../types';

// ─── Configuration ──────────────────────────────────────────
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT = 8000;       // 8 seconds — generous for mobile networks

// CoinGecko free tier: 5-15 calls/min without key, 30 calls/min with Demo key.
// We cache for 60 seconds. The header polls every 60s. Pull-to-refresh
// can bypass the cache. This means at MOST 1 real API call per minute
// during normal use — well within any tier.
const CACHE_TTL = 60 * 1000;        // 60 seconds — fresh enough for a marketplace

// ─── Default / Fallback Prices ──────────────────────────────
// Used when: first launch with no network, CoinGecko is down, rate-limited
// These are ONLY shown if zero cache exists and the API call fails.
const DEFAULT_PRICES: CryptoPrices = {
  btcPrice: 97000,
  ethPrice: 2700,
  btcChange24h: 0,
  ethChange24h: 0,
  lastUpdated: 0,   // 0 = "never fetched" — UI can show a stale indicator
};

// ─── Module-level Cache ─────────────────────────────────────
// This lives for the lifetime of the JS bundle (until app is killed).
// Shared across every caller of getCryptoPrices().
let cache: CryptoPrices | null = null;
let lastFetchTimestamp = 0;
let fetchInProgress: Promise<CryptoPrices> | null = null; // dedup guard

// ─── Main Fetch Function ────────────────────────────────────
/**
 * Fetches BTC and ETH prices from CoinGecko.
 *
 * @param forceRefresh - If true, bypasses the cache TTL (used by pull-to-refresh).
 *                       Still deduplicates concurrent calls.
 * @returns CryptoPrices — never returns null. Falls back to cache, then to defaults.
 */
export async function getCryptoPrices(forceRefresh = false): Promise<CryptoPrices> {
  const now = Date.now();

  // ── Return cache if valid and not force-refreshing ────────
  if (!forceRefresh && cache && (now - lastFetchTimestamp) < CACHE_TTL) {
    return cache;
  }

  // ── Deduplicate concurrent calls ──────────────────────────
  // If HomeScreen and CryptoHeader both mount at the same time and both
  // call getCryptoPrices(), we only make ONE network request.
  // The second caller awaits the same promise as the first.
  if (fetchInProgress) {
    return fetchInProgress;
  }

  // ── Make the request ──────────────────────────────────────
  fetchInProgress = fetchFromCoinGecko();

  try {
    const result = await fetchInProgress;
    return result;
  } finally {
    fetchInProgress = null; // Clear regardless of success/failure
  }
}

// ─── Internal: Actual Network Call ──────────────────────────
async function fetchFromCoinGecko(): Promise<CryptoPrices> {
  try {
    const response = await axios.get<CoinGeckoSimplePriceResponse>(
      `${COINGECKO_API}/simple/price`,
      {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
        timeout: REQUEST_TIMEOUT,
      }
    );

    const data = response.data;

    // ── Validate response shape ─────────────────────────────
    // CoinGecko can return 200 with an empty object if IDs are wrong
    if (!data?.bitcoin?.usd || !data?.ethereum?.usd) {
      console.warn('[CryptoService] Unexpected API response shape:', data);
      return getCachedOrDefault();
    }

    // ── Build the CryptoPrices object ───────────────────────
    const prices: CryptoPrices = {
      btcPrice: data.bitcoin.usd,
      ethPrice: data.ethereum.usd,
      btcChange24h: data.bitcoin.usd_24h_change ?? 0,
      ethChange24h: data.ethereum.usd_24h_change ?? 0,
      lastUpdated: Date.now(),
    };

    // ── Update cache ──────���─────────────────────────────────
    cache = prices;
    lastFetchTimestamp = Date.now();

    return prices;
  } catch (error: any) {
    // ── Handle rate limiting specifically ────────────────────
    if (error.response?.status === 429) {
      console.warn(
        '[CryptoService] Rate limited by CoinGecko (429). ' +
        'Consider registering a free Demo API key at coingecko.com/api.'
      );
      // Don't clear the cache — stale data is better than no data
      return getCachedOrDefault();
    }

    // ── Handle network errors (offline, DNS failure, timeout) ─
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.warn('[CryptoService] Network error:', error.message);
      return getCachedOrDefault();
    }

    // ── Handle other HTTP errors (500, 503, etc.) ────────────
    console.warn(
      `[CryptoService] API error ${error.response?.status}:`,
      error.message
    );
    return getCachedOrDefault();
  }
}

// ─── Internal: Cache-or-Default Fallback ────────────────────
function getCachedOrDefault(): CryptoPrices {
  if (cache) {
    // Stale cache is still better than hardcoded defaults
    return cache;
  }
  return { ...DEFAULT_PRICES };
}

// ═══════════════════════════════════════════════════════════════
// CONVERSION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Converts a USD amount to a crypto amount string.
 *
 * @param usdAmount  - The price in USD (e.g., 499.99)
 * @param cryptoPrice - The current price of 1 unit of crypto in USD (e.g., 97000)
 * @param maxDecimals - Max decimal places to show (default: 6)
 * @returns A formatted string like "0.005154" — never returns NaN or Infinity
 *
 * @example
 * convertUsdToCrypto(500, 97000)     // "0.005155"
 * convertUsdToCrypto(500, 2700)      // "0.185185"
 * convertUsdToCrypto(500, 97000, 8)  // "0.00515464"
 */
export function convertUsdToCrypto(
  usdAmount: number,
  cryptoPrice: number,
  maxDecimals: number = 6
): string {
  // Guard against division by zero or garbage input
  if (!cryptoPrice || cryptoPrice <= 0 || !isFinite(usdAmount)) {
    return '0.000000';
  }

  const result = usdAmount / cryptoPrice;

  // For very large crypto prices (BTC), the result is a small number
  // and we want more decimal places. For cheaper coins, fewer is fine.
  return result.toFixed(maxDecimals);
}

/**
 * Formats a crypto amount for display in a compact way.
 * Adapts precision based on the magnitude of the amount.
 *
 * @example
 * formatCryptoAmount(0.00515464)  // "0.005155"  (BTC — small number, 6 decimals)
 * formatCryptoAmount(0.185185)    // "0.1852"    (ETH — larger, 4 decimals)
 * formatCryptoAmount(1234.5678)   // "1,234.57"  (some cheap coin — 2 decimals)
 */
export function formatCryptoAmount(amount: number): string {
  if (!isFinite(amount)) return '0';

  if (amount < 0.001) return amount.toFixed(8);
  if (amount < 1) return amount.toFixed(6);
  if (amount < 100) return amount.toFixed(4);
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Formats a 24h percentage change for display.
 *
 * @example
 * formatPercentChange(2.543)   // "+2.54%"
 * formatPercentChange(-1.2)    // "-1.20%"
 * formatPercentChange(0)       // "0.00%"
 */
export function formatPercentChange(change: number): string {
  if (!isFinite(change)) return '0.00%';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Formats a USD price for display in the header ticker.
 *
 * @example
 * formatUsdPrice(97123.45)  // "$97,123"
 * formatUsdPrice(2734.89)   // "$2,735"
 */
export function formatUsdPrice(price: number): string {
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// ─── Force-clear cache (for testing/debugging) ──────────────
export function clearPriceCache(): void {
  cache = null;
  lastFetchTimestamp = 0;
  fetchInProgress = null;
}