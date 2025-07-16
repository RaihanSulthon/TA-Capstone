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

  // Content modal logout
  const logoutModalContent = (
    <>
      <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>

      <div className="flex justify-end space-x-3">
        <button
          onClick={closeLogoutModal}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-gray-100 hover:bg-white hover:text-gray-700 transition-colors duration-200">
          Cancel
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white hover:bg-white hover:text-red-500 border border-red-500 transition-colors duration-200 px-4 py-2 rounded">
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Updated Logo and App Name with better positioning */}
            <Link to="/" className="flex items-center">
              <div className="hidden sm:block">
                <img src={applogo} alt="App Logo" className="h-8 w-auto ml-4" />
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
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeStyle()}`}>
                          {formatRoleDisplay()}
                        </span>
                      )}
                    </div>

                    <div className="mr-6">
                      <NotificationsSystem />
                    </div>

                    <Link
                      to="/app/dashboard"
                      className="mr-4 text-gray-700 hover:text-blue-600">
                      Dashboard
                    </Link>

                    {userRole === "student" && (
                      <Link
                        to="/app/my-tickets"
                        className="mr-4 text-gray-700 hover:text-blue-600">
                        Tiket Saya
                      </Link>
                    )}

                    {isAdmin() && (
                      <Link
                        to="/admin/dashboard"
                        className="mr-4 text-gray-700 hover:text-blue-600">
                        Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={openLogoutModal}
                      className="bg-red-500 text-white hover:bg-white hover:text-red-500 border border-red-500 transition-colors duration-200 px-4 py-2 rounded">
                      Logout
                    </button>
                  </div>

                  {/* Mobile Menu */}
                  <div className="md:hidden flex items-center space-x-2">
                    <NotificationsSystem />
                    <div className="flex items-center">
                      {/* <span className="text-gray-700 text-sm mr-2">
                        {getUserDisplayName()}
                      </span> */}
                      <button
                        onClick={openLogoutModal}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm">
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
                      className="text-gray-700 hover:text-blue-600 px-4 py-2">
                      Login
                    </Link>
                    <Link
                      to="/auth"
                      state={{ initialTab: "signup" }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                      Sign Up
                    </Link>
                  </div>

                  {/* Mobile Auth Menu */}
                  <div className="md:hidden flex items-center space-x-2">
                    <Link
                      to="/auth"
                      className="text-gray-700 hover:text-blue-600 px-2 py-1 text-sm">
                      Login
                    </Link>
                    <Link
                      to="/auth"
                      state={{ initialTab: "signup" }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modal Konfirmasi Logout */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        title="Confirm Logout"
        size="sm"
        position="center">
        {logoutModalContent}
      </Modal>
    </>
  );
};

export default Navbar;
