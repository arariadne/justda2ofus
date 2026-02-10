import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Add this
import { getStorage } from "firebase/storage";   // Add this

// WARNING: Do not expose sensitive keys in public repos or client code.
// For production, use environment variables and server-side logic.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDEpoMM_PhPvAjwXb4Tf1FQhVsuH2D4dt8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "justda2ofus.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "justda2ofus",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "justda2ofus.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "54167437317",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:54167437317:web:c6f132d0c57e54057b1c6c",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-V5CBVRX1ZL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export these so they can be used in App.jsx and Album.jsx
export const db = getFirestore(app);
export const storage = getStorage(app);