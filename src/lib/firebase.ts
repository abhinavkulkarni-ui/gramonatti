import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAm9P_jmJgMrW_4B4IO3rKqeSMA3rslu0c",
  authDomain: "gramonatti.firebaseapp.com",
  projectId: "gramonatti",
  storageBucket: "gramonatti.firebasestorage.app",
  messagingSenderId: "686462599211",
  appId: "1:686462599211:web:af58cb58ba1bf79ce76a6e",
  measurementId: "G-7M6J2340SX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
