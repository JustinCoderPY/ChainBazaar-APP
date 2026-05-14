import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Platform } from 'react-native';
import { auth, db, storage } from '../config/firebase';
import { Product } from '../types';


type FirebaseLikeError = {
  code?: string;
  message?: string;
  name?: string;
  serverResponse?: string;
};

type WebUploadFile = Blob & {
  name?: string;
  type: string;
  size: number;
};

type AuthWithReady = typeof auth & {
  authStateReady?: () => Promise<void>;
};

type FirestoreDocLike = {
  id: string;
  data: () => unknown;
};

type ProductOwnerField = 'sellerId' | 'creatorId' | 'userId';

const PRODUCT_OWNER_FIELDS: ProductOwnerField[] = ['sellerId', 'creatorId', 'userId'];

const isPermissionDeniedError = (error: unknown): boolean => {
  const firebaseError = error as FirebaseLikeError | null;
  return firebaseError?.code === 'permission-denied' || firebaseError?.code === 'firestore/permission-denied';
};

const createdAtToMillis = (createdAt: unknown): number => {
  if (!createdAt) {
    return 0;
  }

  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    const millis = new Date(createdAt).getTime();
    return Number.isFinite(millis) ? millis : 0;
  }

  if (typeof createdAt === 'object' && createdAt !== null) {
    const timestampLike = createdAt as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof timestampLike.toMillis === 'function') {
      return timestampLike.toMillis();
    }

    if (typeof timestampLike.seconds === 'number') {
      return timestampLike.seconds * 1000 + Math.floor((timestampLike.nanoseconds ?? 0) / 1_000_000);
    }
  }

  return 0;
};

const normalizeProduct = (snapshot: FirestoreDocLike): Product => {
  const raw = snapshot.data() as Partial<Product> & {
    creatorId?: string;
    userId?: string;
    ownerId?: string;
    createdAt?: unknown;
  };

  const ownerId = raw.sellerId || raw.creatorId || raw.userId || raw.ownerId || '';
  const createdAtMillis = createdAtToMillis(raw.createdAt);

  return {
    id: snapshot.id,
    title: raw.title || '',
    description: raw.description || '',
    price: Number(raw.price || 0),
    category: raw.category || '',
    imageUrls: Array.isArray(raw.imageUrls) ? raw.imageUrls : [],
    sellerId: ownerId,
    sellerName: raw.sellerName || '',
    // Keep Product shape consistent in app state while accepting Timestamp/string in Firestore.
    createdAt: createdAtMillis > 0 ? new Date(createdAtMillis).toISOString() : new Date(0).toISOString(),
  };
};

const normalizeAndSortProducts = (docs: FirestoreDocLike[]): Product[] => {
  const products = docs.map((snapshot) => normalizeProduct(snapshot));

  products.sort((a, b) => {
    const aCreatedAt = createdAtToMillis(a.createdAt);
    const bCreatedAt = createdAtToMillis(b.createdAt);
    return bCreatedAt - aCreatedAt;
  });

  return products;
};

const getUserListingsByField = async (userId: string, ownerField: ProductOwnerField) => {
  const userQuery = query(collection(db, 'products'), where(ownerField, '==', userId));
  const querySnapshot = await getDocs(userQuery);
  return querySnapshot.docs;
};

const logFirebaseStorageError = (error: unknown) => {
  const firebaseError = error as FirebaseLikeError | null;
  console.error('[Storage] uploadBytes failed:', error);
  console.error('[Storage] Firebase error code:', firebaseError?.code ?? 'unknown');
  console.error('[Storage] Firebase error message:', firebaseError?.message ?? 'unknown');
  if (firebaseError?.name) {
    console.error('[Storage] Firebase error name:', firebaseError.name);
  }
  if (firebaseError?.serverResponse) {
    console.error('[Storage] Firebase server response:', firebaseError.serverResponse);
  }
};

const fetchImageBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  console.log('[Storage] fetch response status:', response.status);

  if (!response.ok) {
    throw new Error(`Image fetch failed with status ${response.status}`);
  }

  const blob = await response.blob();
  console.log('[Storage] blob type:', blob.type || 'unknown');
  console.log('[Storage] blob size:', blob.size);
  return blob;
};

const ensureFirebaseAuthUser = async () => {
  if (!auth.currentUser) {
    await (auth as AuthWithReady).authStateReady?.();
  }

  if (!auth.currentUser) {
    throw new Error('Firebase Auth currentUser is null. Cannot upload listing image.');
  }

  return auth.currentUser;
};

// Upload image to Firebase Storage
export const uploadImage = async (
  uri: string,
  filename: string,
  webFile?: WebUploadFile,
): Promise<string> => {
  const storagePath = `listings/${filename}`;
  console.log('[Storage] uri received:', uri);
  console.log('[Storage] storage path:', storagePath);

  try {
    const firebaseUser = await ensureFirebaseAuthUser();
    const storageRef = ref(storage, storagePath);
    const uploadData =
      Platform.OS === 'web' && webFile
        ? webFile
        : await fetchImageBlob(uri);

    console.log('[Storage] auth.currentUser uid:', firebaseUser.uid);
    console.log('[Storage] auth.currentUser email:', firebaseUser.email);
    console.log('[Storage] blob type:', uploadData.type || 'unknown');
    console.log('[Storage] blob size:', uploadData.size);
    console.log('[Storage] storage fullPath:', storageRef.fullPath);

    try {
      await uploadBytes(storageRef, uploadData, {
        contentType: uploadData.type || 'image/jpeg',
      });
    } catch (error) {
      logFirebaseStorageError(error);
      throw error;
    }

    const downloadURL = await getDownloadURL(storageRef);
    console.log('[Storage] download URL created:', downloadURL);
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
      // Canonical owner field going forward.
      sellerId: productData.sellerId,
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
      return [];
    }

    console.warn('[Listings] Global products query blocked by Firestore rules. Falling back to current user listings.');

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
  let lastUnexpectedError: unknown = null;

  for (const ownerField of PRODUCT_OWNER_FIELDS) {
    try {
      const docs = await getUserListingsByField(userId, ownerField);
      if (docs.length > 0) {
        return normalizeAndSortProducts(docs);
      }
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        // If rules only permit `sellerId` queries, avoid spamming extra denied queries.
        if (ownerField === 'sellerId') {
          console.warn('[Listings] User listings query denied on canonical sellerId field.');
          return [];
        }

        continue;
      }

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
