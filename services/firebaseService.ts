import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {auth, db, storage } from '../config/firebase';
import { Product } from '../types';

type FirebaseLikeError = {
  code?: string;
};

const isPermissionDeniedError = (error: unknown): boolean => {
  const firebaseError = error as FirebaseLikeError | null;
  return firebaseError?.code === 'permission-denied';
};

const normalizeAndSortProducts = (docs: Array<{ id: string; data: () => unknown }>): Product[] => {
  const products = docs.map((snapshot) => ({
    id: snapshot.id,
    ...(snapshot.data() as Omit<Product, 'id'>),
  }));

  products.sort((a, b) => {
    const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bCreatedAt - aCreatedAt;
  });

  return products;
};

const getUserListingsByField = async (userId: string, ownerField: 'sellerId' | 'creatorId' | 'userId') => {
  const userQuery = query(collection(db, 'products'), where(ownerField, '==', userId));
  const querySnapshot = await getDocs(userQuery);
  return querySnapshot.docs;
};


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
    const ownerId = productData.sellerId;
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      // Backward-compatible owner fields for existing rules/data models
      creatorId: ownerId,
      userId: ownerId,
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
    
    return normalizeAndSortProducts(querySnapshot.docs);
  } catch (error) {
    if (!isPermissionDeniedError(error)) {
      console.error('Error getting listings:', error);
    }

    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      return [];
    }

    // Fallback for projects with restrictive rules that only allow users to read their own listings
    return getUserListings(currentUserId);
  }
};

// Get user's listings
export const getUserListings = async (userId: string): Promise<Product[]> => {
  const ownerFields: Array<'sellerId' | 'creatorId' | 'userId'> = ['sellerId', 'creatorId', 'userId'];
  let lastUnexpectedError: unknown = null;

  for (const ownerField of ownerFields) {
    try {
      const docs = await getUserListingsByField(userId, ownerField);
      if (docs.length > 0) {
        return normalizeAndSortProducts(docs);
      }
    } catch (error) {
      if (!isPermissionDeniedError(error)) {
        lastUnexpectedError = error;
      }
    }
  }

  if (lastUnexpectedError) {
    console.error('Error getting user listings:', lastUnexpectedError);
  }

  return [];
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