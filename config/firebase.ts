import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// TODO: Replace with YOUR Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBudnCPGUyGEV1CBJtloM8m8-b9WYJh9B8",
  authDomain: "chainbazaar.firebaseapp.com",
  projectId: "chainbazaar",
  storageBucket: "chainbazaar.firebasestorage.app",
  messagingSenderId: "747375048804",
  appId: "1:747375048804:web:ce208ca30276eb74048771"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;