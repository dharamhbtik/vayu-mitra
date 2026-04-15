import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLwDAFBFDG_wI-DGxLcIc7_6qXgdn0OV4",
  authDomain: "vayumitra-9cf8e.firebaseapp.com",
  projectId: "vayumitra-9cf8e",
  storageBucket: "vayumitra-9cf8e.firebasestorage.app",
  messagingSenderId: "636609513592",
  appId: "1:636609513592:web:141a4afc57d53be567458d",
  measurementId: "G-38SKH95N9K" // optional
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
