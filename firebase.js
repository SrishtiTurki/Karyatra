import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCUeXIgNunzcMXiDhvq5X62ANl8eJuWo_M",
  authDomain: "karyatra-d6b99.firebaseapp.com",
  projectId: "karyatra-d6b99",
  storageBucket: "karyatra-d6b99.firebasestorage.app",
  messagingSenderId: "975285705166",
  appId: "1:975285705166:web:971f4bfb09349fdb51b39f"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Authentication
const auth = getAuth(app);

// ✅ Initialize Firestore
const db = getFirestore(app);

// ✅ Export auth and db
export { auth, db, app };