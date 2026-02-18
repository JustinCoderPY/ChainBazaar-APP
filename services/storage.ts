import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, User } from '../types/index';

const PRODUCTS_KEY = '@chainbazaar_products';
const USER_KEY = '@chainbazaar_user';

// Products
export const saveProducts = async (products: Product[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving products:', error);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const data = await AsyncStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const addProduct = async (product: Product): Promise<void> => {
  try {
    const products = await getProducts();
    products.unshift(product); // Add to beginning
    await saveProducts(products);
  } catch (error) {
    console.error('Error adding product:', error);
  }
};

// User
export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const getUser = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const clearUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing user:', error);
  }
};