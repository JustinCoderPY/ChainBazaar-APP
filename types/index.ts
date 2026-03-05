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
  btcChange24h: number;
  ethChange24h: number;
  lastUpdated: number;
}

// ═══════════════════════════════════════════════════════════════
// MESSAGING TYPES
// ═══════════════════════════════════════════════════════════════

/** Firestore document shape for a conversation */
export interface Conversation {
  id: string;
  /** Both user IDs — always sorted alphabetically for deterministic lookup */
  participants: [string, string];
  /** Map of userId → display name (avoids secondary user reads) */
  participantNames: Record<string, string>;
  /** Denormalized for the conversation list preview */
  lastMessage: string;
  lastMessageSenderId: string;
  lastUpdated: any; // Firestore Timestamp
  /** The product that initiated this conversation */
  productId: string;
  productTitle: string;
}

/** Firestore document shape for a message (subcollection of conversation) */
export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: any; // Firestore Timestamp
  read: boolean;
}