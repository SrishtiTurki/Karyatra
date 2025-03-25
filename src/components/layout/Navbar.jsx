import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full bg-violet-600 text-white p-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-lg font-bold">
        Job Tracker
      </Link>
      {currentUser && (
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline-block">Hello, {currentUser.email}</span>
          <button
            onClick={logout}
            className="bg-red-500 px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

