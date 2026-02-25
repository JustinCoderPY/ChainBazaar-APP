import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, User } from '../types/index';

const PRODUCTS_KEY = '@chainbazaar_products';
const USER_KEY = '@chainbazaar_user';

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

/**
 * Saves the entire products array to AsyncStorage.
 * This is the low-level function — prefer addProduct/deleteProduct.
 *
 * @throws Error if AsyncStorage write fails
 */
export const saveProducts = async (products: Product[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('[Storage] Error saving products:', error);
    throw error; // Let callers handle this (show Alert, etc.)
  }
};

/**
 * Reads all products from AsyncStorage.
 * Returns an empty array if nothing is stored yet.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const data = await AsyncStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Storage] Error getting products:', error);
    return [];
  }
};

/**
 * Adds a single product to the beginning of the list.
 * Newest listings appear first.
 *
 * @param product - The complete Product object (id must be set by the caller)
 * @throws Error if save fails
 */
export const addProduct = async (product: Product): Promise<void> => {
  const products = await getProducts();
  products.unshift(product);
  await saveProducts(products); // throws on failure
};

/**
 * Returns all listings created by a specific user.
 * Filters by sellerId and returns in creation order (newest first).
 *
 * @param userId - The user ID to filter by
 * @returns Array of products belonging to this user
 */
export const getUserListings = async (userId: string): Promise<Product[]> => {
  const allProducts = await getProducts();
  return allProducts.filter(product => product.sellerId === userId);
};

/**
 * Deletes a product by ID.
 *
 * @param productId - The ID of the product to delete
 * @throws Error if save fails
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== productId);

  if (filtered.length === products.length) {
    console.warn(`[Storage] Product ${productId} not found in local storage`);
  }

  await saveProducts(filtered);
};

/**
 * Updates an existing product in place.
 * Finds the product by ID and replaces it entirely.
 *
 * @param updatedProduct - The full Product object with updated fields
 * @throws Error if save fails or product not found
 */
export const updateProduct = async (updatedProduct: Product): Promise<void> => {
  const products = await getProducts();
  const index = products.findIndex(p => p.id === updatedProduct.id);

  if (index === -1) {
    throw new Error(`Product ${updatedProduct.id} not found`);
  }

  products[index] = updatedProduct;
  await saveProducts(products);
};

// ═══════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════

export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('[Storage] Error saving user:', error);
    throw error;
  }
};

export const getUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Storage] Error getting user:', error);
    return null;
  }
};

export const clearUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('[Storage] Error clearing user:', error);
    throw error;
  }
};