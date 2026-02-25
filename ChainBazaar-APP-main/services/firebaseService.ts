import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Product } from '../types';

// Upload image to Firebase Storage
export const uploadImage = async (uri: string, filename: string): Promise<string> => {
  try {
    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const storageRef = ref(storage, `listings/${filename}`);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Create a new listing
export const createListing = async (productData: Omit<Product, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

// Get all listings
export const getAllListings = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      } as Product);
    });
    
    return products;
  } catch (error) {
    console.error('Error getting listings:', error);
    return [];
  }
};

// Get user's listings
export const getUserListings = async (userId: string): Promise<Product[]> => {
  try {
    // Remove orderBy to avoid needing an index
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      } as Product);
    });
    
    // Sort in JavaScript instead (client-side sorting)
    products.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return products;
  } catch (error) {
    console.error('Error getting user listings:', error);
    return [];
  }
};

// Delete a listing
export const deleteListing = async (productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};