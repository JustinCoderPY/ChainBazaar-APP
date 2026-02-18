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