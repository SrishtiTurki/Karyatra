import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("A password reset link has been sent to your email.");
      setTimeout(() => navigate("/login"), 5000); // Redirect to login after 5s
    } catch (err) {
      setError(err.message || "Failed to send password reset email.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#CDC1FF]">
      <div className="bg-white shadow-lg rounded-lg p-12 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
          Reset Password
        </h2>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {message && <div className="text-green-500 text-center mb-4">{message}</div>}

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <input
            type="email"
            required
            className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white text-lg py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center mt-6 text-lg">
          Remember your password?{" "}
          <a href="/login" className="text-blue-500 font-semibold">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
