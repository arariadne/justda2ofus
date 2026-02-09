import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Add this
import { getStorage } from "firebase/storage";   // Add this

const firebaseConfig = {
  apiKey: "AIzaSyDEpoMM_PhPvAjwXb4Tf1FQhVsuH2D4dt8",
  authDomain: "justda2ofus.firebaseapp.com",
  projectId: "justda2ofus",
  storageBucket: "justda2ofus.firebasestorage.app",
  messagingSenderId: "54167437317",
  appId: "1:54167437317:web:c6f132d0c57e54057b1c6c",
  measurementId: "G-V5CBVRX1ZL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export these so they can be used in App.jsx and Album.jsx
export const db = getFirestore(app);
export const storage = getStorage(app);