// src/components/LandingNavbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContexts";
import Button from "./forms/Button";

const LandingNavbar = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-md py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <svg
              className={`w-8 h-8 ${isScrolled ? "text-blue-600" : "text-white"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z"
                clipRule="evenodd"
              ></path>
            </svg>
            <span
              className={`ml-2 text-xl font-bold ${
                isScrolled ? "text-gray-800" : "text-white"
              }`}
            >
              My Capstone App
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium ${
                isScrolled ? "text-gray-600 hover:text-blue-600" : "text-white hover:text-blue-100"
              } transition-colors duration-300`}
            >
              Home
            </Link>
            <Link
              to="/features"
              className={`font-medium ${
                isScrolled ? "text-gray-600 hover:text-blue-600" : "text-white hover:text-blue-100"
              } transition-colors duration-300`}
            >
              Features
            </Link>
            <Link
              to="/about"
              className={`font-medium ${
                isScrolled ? "text-gray-600 hover:text-blue-600" : "text-white hover:text-blue-100"
              } transition-colors duration-300`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`font-medium ${
                isScrolled ? "text-gray-600 hover:text-blue-600" : "text-white hover:text-blue-100"
              } transition-colors duration-300`}
            >
              Contact
            </Link>
          </div>

          {/* Authentication Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate("/dashboard")}
                className={`px-5 py-2 rounded-lg transition-colors duration-300 ${
                  isScrolled
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate("/auth")}
                  className={`px-5 py-2 rounded-lg transition-colors duration-300 ${
                    isScrolled
                      ? "text-blue-600 hover:text-blue-700"
                      : "text-white hover:text-blue-100"
                  }`}
                >
                  Log In
                </Button>
                <Button
                  onClick={() => {
                    navigate("/auth");
                    // You can pass a state to set the initial tab to signup
                    // For example: navigate("/auth", { state: { initialTab: "signup" } });
                  }}
                  className={`px-5 py-2 rounded-lg transition-colors duration-300 ${
                    isScrolled
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-600"
          >
            <svg
              className={`w-6 h-6 ${isScrolled ? "text-gray-800" : "text-white"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg overflow-hidden">
            <Link
              to="/"
              className="block py-3 px-4 text-gray-800 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/features"
              className="block py-3 px-4 text-gray-800 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/about"
              className="block py-3 px-4 text-gray-800 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block py-3 px-4 text-gray-800 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="border-t border-gray-200 py-3 px-4">
              {isAuthenticated ? (
                <Button
                  onClick={() => {
                    navigate("/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Dashboard
                </Button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={() => {
                      navigate("/auth");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/auth");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;