// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLjfqWYT02rZ7KSsKD7mm5o1d9KKuNBdY",
  authDomain: "languagelearningarcade.firebaseapp.com",
  projectId: "languagelearningarcade",
  storageBucket: "languagelearningarcade.appspot.com",
  messagingSenderId: "198729393087",
  appId: "1:198729393087:web:e3fe739e954272431bf70a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

// Optional: Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("IndexedDB persistence error:", err.code);
});

export { auth, googleProvider, db };
