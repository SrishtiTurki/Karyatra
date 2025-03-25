import React, { createContext, useState, useContext, useEffect } from "react";
import { auth } from "../firebase"; // Ensure Firebase auth is correctly imported
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  async function googleSignIn() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account", // ✅ Ensures account selection every time
    });

    try {
      // First attempt sign-in with popup
      return await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        console.warn("Popup blocked. Using redirect...");
        return signInWithRedirect(auth, provider);
      } else {
        throw error; // Handle other errors normally
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = { currentUser, signup, login, logout, googleSignIn };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
