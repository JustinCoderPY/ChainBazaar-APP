import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBudnCPGUyGEV1CBJtloM8m8-b9WYJh9B8",
  authDomain: "chainbazaar.firebaseapp.com",
  projectId: "chainbazaar",
  storageBucket: "chainbazaar.firebasestorage.app",
  messagingSenderId: "747375048804",
  appId: "1:747375048804:web:ce208ca30276eb74048771",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;