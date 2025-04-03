import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyB1Cn-QUt1Ojh9JZRLCRfj22Gi3AdVyDcc",
  authDomain: "job-tracker-d7e99.firebaseapp.com",
  projectId: "job-tracker-d7e99",
  storageBucket: "job-tracker-d7e99.firebasestorage.app",
  messagingSenderId: "708599483043",
  appId: "1:708599483043:web:a52b78d5e4f779e7cecd16",
  measurementId: "G-F9YX47D0YP"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Authentication
const auth = getAuth(app);

// ✅ Initialize Firestore
const db = getFirestore(app);

// ✅ Export auth and db
export { auth, db, app };