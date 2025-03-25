import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  signOut
} from 'firebase/auth';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  // ✅ Prevent duplicate email sign-ups (Email & Password)
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      // 🔍 Step 1: Check if email already exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        alert("Email already exists. Please sign in instead.");
        setLoading(false);
        return;
      }

      // 🆕 Step 2: Create new account
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign-up successful!");
      navigate('/additional-details'); // ✅ Redirect only if successful
    } catch (err) {
      setError(err.message || "Failed to create an account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      console.log("⏳ Google Sign-in started...");
  
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
  
      // Step 1: Ask user to select Google account
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      console.log("✅ Google Sign-in successful:", user.email);
  
      // Step 2: Check if the email already exists in Firebase
      console.log("🔍 Checking existing sign-in methods for:", user.email);
      const signInMethods = await fetchSignInMethodsForEmail(auth, user.email);
      console.log("🧐 Existing Sign-in Methods:", signInMethods); // Logs sign-in methods for debugging
  
      if (signInMethods.length > 0) {
        console.warn("⚠️ Email already in use. Signing out...");
        await signOut(auth);
        setError("This email is already registered. Please sign in instead.");
        return;
      }
  
      // ✅ New user → Allow signup
      alert("🎉 Sign-up successful!");
      navigate('/additional-details');
  
    } catch (err) {
      console.error("❌ Google Sign-in Error:", err);
  
      // Handle specific Firebase errors
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Google Sign-in popup was closed. Please try again.");
      } else {
        setError("Google Sign-in failed. Please try again.");
      }
    }
  };
  
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#CDC1FF]">
      <div className="bg-white shadow-lg rounded-lg p-12 w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">Create an Account</h2>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <form onSubmit={handleEmailSignUp} className="space-y-6">
          <input
            type="email"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white text-lg py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-lg">or</p>
          <button
            onClick={handleGoogleSignUp}
            className="mt-4 flex items-center justify-center w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition duration-300"
          >
            <img src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" alt="Google Logo" className="w-5 h-5 mr-2" />
            Sign Up with Google
          </button>
        </div>

        <p className="text-center mt-6 text-lg">
          Already have an account? <a href="/login" className="text-blue-500 font-semibold">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default Register;













