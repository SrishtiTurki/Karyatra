import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from "./components/Profile";
import Help from "./components/Help";
import AdditionalDetails from './components/auth/AdditionalDetails';
import Dashboard from './components/dashboard/Dashboard';
import PrivateRoute from './components/auth/PrivateRoute';
import Navbar from './components/layout/Navbar';
import { initializeApp } from 'firebase/app';  // Firebase
import { getAuth } from 'firebase/auth';
import ForgotPassword from './components/auth/ForgotPassword'; // ✅ Import ForgotPassword





// Firebase configuration - replace with your config
const firebaseConfig = {

  apiKey: "AIzaSyB1Cn-QUt1Ojh9JZRLCRfj22Gi3AdVyDcc",

  authDomain: "job-tracker-d7e99.firebaseapp.com",

  projectId: "job-tracker-d7e99",

  storageBucket: "job-tracker-d7e99.firebasestorage.app",

  messagingSenderId: "708599483043",

  appId: "1:708599483043:web:a52b78d5e4f779e7cecd16",

  measurementId: "G-F9YX47D0YP"

};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            <Route path="/additional-details" element={<AdditionalDetails />} />
            <Route path="/forgot-password" element={<ForgotPassword />} /> {/* ✅ Added this route */}
            
            {/* 🔹 Add this route to fix the issue */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            {/* Default route redirects to dashboard if logged in */}
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;