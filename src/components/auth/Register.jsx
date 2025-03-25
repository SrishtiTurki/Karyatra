import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/additional-details'); // Redirect after signup
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already exists. Please try a different one or sign in.");
      } else {
        setError(err.message || "Failed to create an account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/additional-details'); // Redirect after Google signup
    } catch (err) {
      setError(err.message || "Google Sign-in failed");
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

