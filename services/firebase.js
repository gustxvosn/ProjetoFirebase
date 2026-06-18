import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJIuwrzmxp6xz8q70VU3NnDQb_ugSccwc",
  authDomain: "projetocrud-74bfc.firebaseapp.com",
  projectId: "projetocrud-74bfc",
  storageBucket: "projetocrud-74bfc.firebasestorage.app",
  messagingSenderId: "414525808080",
  appId: "1:414525808080:web:65bbf5f6e5a95859806dd5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;