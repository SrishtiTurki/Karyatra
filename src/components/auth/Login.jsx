import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import jobImage from "../../assets/JOB.png"; // ✅ Corrected Image Import

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        await login(email, password);
        if (isMounted.current) navigate("/");
      } catch (error) {
        console.error("Login Error:", error);
        if (isMounted.current) setError(error.message || "Failed to sign in");
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [email, password, login, navigate]
  );

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await googleSignIn();
      if (isMounted.current) navigate("/");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      if (isMounted.current) setError(error.message || "Failed to sign in with Google");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [googleSignIn, navigate]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#CDC1FF]">
      <div className="flex max-w-4xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="w-1/2 p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome!</h2>
          <p className="text-lg text-gray-500 mb-6">Please enter your login details below</p>

          {error && <div className="text-red-500 text-center mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              required
              className="w-full p-4 text-lg border rounded-md"
              placeholder="Enter the email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              required
              className="w-full p-4 text-lg border rounded-md"
              placeholder="Enter the Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="text-right">
              <Link to="/forgot-password" className="text-violet-600 text-lg hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-violet-600 text-white text-lg py-4 rounded-md hover:bg-violet-700 transition disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center text-xl text-gray-500 mt-6">Or continue</div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-gray-200 text-gray-700 text-lg py-4 rounded-md hover:bg-gray-300 transition disabled:bg-gray-400 mt-4"
            disabled={loading}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google Logo"
              className="w-8 h-8"
            />
            <span>{loading ? "Signing in..." : "Log in with Google"}</span>
          </button>

          <p className="text-center text-xl text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link to="/register" className="text-violet-600 font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>

        {/* ✅ Fixed Image Section */}
        <div className="w-1/2 flex items-center justify-center p-4">
          <img
            src={jobImage}
            alt="Task Illustration"
            className="w-full h-full object-cover" // ✅ Ensures full image coverage
          />
        </div>
      </div>
    </div>
  );
};

export default Login; 