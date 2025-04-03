import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { FaUserCircle, FaQuestionCircle, FaSignOutAlt } from "react-icons/fa";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutModal(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Extract user name from Firebase auth
  const userName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Guest";

  return (
    <>
      <nav className="fixed top-0 w-full bg-purple-700 text-white p-4 flex justify-between items-center shadow-md">
        <Link to="/" className="text-lg font-bold">Karyatra</Link>

        <div className="flex items-center space-x-6">
          {user && <span>Hello, {userName}</span>}

          {/* Profile Icon */}
          {user && (
            <Link to="/profile">
              <FaUserCircle className="text-2xl cursor-pointer hover:text-gray-300 transition" title="Profile" />
            </Link>
          )}

          {/* Help Icon */}
          <Link to="/help">
            <FaQuestionCircle className="text-2xl cursor-pointer hover:text-gray-300 transition" title="Help" />
          </Link>

          {/* Logout Button */}
          {user && (
            <button onClick={() => setShowLogoutModal(true)} className="text-xl hover:text-gray-300 transition">
              <FaSignOutAlt title="Logout" />
            </button>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-lg font-bold mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-around">
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Yes, Logout
              </button>
              <button onClick={() => setShowLogoutModal(false)} className="bg-gray-400 px-4 py-2 rounded-lg hover:bg-gray-500">
                No, Stay Here
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
