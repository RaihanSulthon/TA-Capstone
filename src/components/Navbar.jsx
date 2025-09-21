import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Authcontexts";
import { useState } from "react";
import Modal from "./Modal";
import NotificationsSystem from "./NotificationsSystem";
import applogo from "../assets/applogo.png";

const Navbar = () => {
  const { currentUser, logout, isAuthenticated, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    closeLogoutModal();
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) {
      return currentUser.email.split("@")[0];
    }
    return "User";
  };

  // Role Badge Styling
  const getRoleBadgeStyle = () => {
    switch (userRole) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "student":
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Format role display
  const formatRoleDisplay = () => {
    if (!userRole) return "";
    return userRole.charAt(0).toUpperCase() + userRole.slice(1);
  };

  // Content modal logout - Updated design
  const logoutModalContent = (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8">
      <div className="text-center mb-8">
        {/* Logout Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          🚪 Konfirmasi Logout
        </h3>
        <p className="text-base text-gray-600">
          Apakah Anda yakin ingin keluar dari akun Anda?
        </p>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm mb-6">
        <div className="flex items-start">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-gray-800 mb-2">
              Informasi Logout
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Setelah logout, Anda perlu masuk kembali untuk mengakses dashboard
              dan fitur-fitur lainnya.
            </p>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                {userRole && (
                  <span
                    className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${getRoleBadgeStyle()}`}
                  >
                    {formatRoleDisplay()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={closeLogoutModal}
          className="w-full py-4 px-6 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-gray-50 hover:border-gray-400 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <div className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Batal
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <div className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Ya, Logout
          </div>
        </button>
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          💡 Sesi Anda akan berakhir dan data yang belum disimpan akan hilang
        </p>
      </div>
    </div>
  );

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Updated Logo and App Name with better positioning */}
            <Link to="/" className="flex items-center">
              <div className="hidden sm:block ">
                <img
                  src={applogo}
                  alt="App Logo"
                  className="h-8 w-auto ml-4 hover:scale-105 transition-all duration-300"
                />
              </div>
              <span className="text-md ml-2 md:text-xl font-bold text-blue-600">
                Tell-Us
              </span>
            </Link>

            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  {/* Desktop Menu */}
                  <div className="hidden md:flex items-center">
                    <div className="mr-4 flex items-center">
                      <span className="text-gray-700 mr-2">
                        Hello, {getUserDisplayName()}
                      </span>
                      {userRole && (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeStyle()}`}
                        >
                          {formatRoleDisplay()}
                        </span>
                      )}
                    </div>

                    <div className="mr-6">
                      <NotificationsSystem />
                    </div>

                    <Link
                      to="/app/dashboard"
                      className="mr-4 text-gray-700 hover:text-blue-600 hover:scale-105 duration-300 transition-all"
                    >
                      Dashboard
                    </Link>

                    {userRole === "student" && (
                      <Link
                        to="/app/my-tickets"
                        className="mr-4 text-gray-700 hover:text-blue-600 hover:scale-105 duration-300 transition-all"
                      >
                        Tiket Saya
                      </Link>
                    )}

                    {isAdmin() && (
                      <Link
                        to="/admin/dashboard"
                        className="mr-4 text-gray-700 hover:text-blue-600 hover:scale-105 duration-300 transition-all"
                      >
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={openLogoutModal}
                      className="bg-red-500 text-white hover:bg-white hover:text-red-500 border border-red-500 transition-all hover:scale-105 shadow-lg duration-300 px-4 py-2 rounded"
                    >
                      Logout
                    </button>
                  </div>

                  {/* Mobile Menu */}
                  <div className="md:hidden flex items-center space-x-2">
                    <NotificationsSystem />
                    <div className="flex items-center">
                      <button
                        onClick={openLogoutModal}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Desktop Auth Menu */}
                  <div className="hidden md:flex items-center">
                    <Link
                      to="/auth"
                      className="text-gray-700 hover:text-blue-600 px-4 py-2"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth"
                      state={{ initialTab: "signup" }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Sign Up
                    </Link>
                  </div>

                  {/* Mobile Auth Menu */}
                  <div className="md:hidden flex items-center space-x-2">
                    <Link
                      to="/auth"
                      className="text-gray-700 hover:text-blue-600 px-2 py-1 text-sm"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth"
                      state={{ initialTab: "signup" }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal Konfirmasi Logout - Updated size to xl */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        title=""
        size="xl"
        position="center"
      >
        {logoutModalContent}
      </Modal>
    </>
  );
};

export default Navbar;
