
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDFVi5V6bL29IxN_Ix_84HOEK2F-uNu-8",
  authDomain: "capstone-a1019.firebaseapp.com",
  projectId: "capstone-a1019",
  storageBucket: "capstone-a1019.firebasestorage.app",
  messagingSenderId: "60293545995",
  appId: "1:60293545995:web:337c4b6a41d4b36a8e070e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export { storage };