// src/components/Navbar.jsx (updated with notifications)
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContexts";
import { useState } from "react";
import Modal from "./Modal";
import NotificationsSystem from "./NotificationsSystem";

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
    // Logout and redirect to home page
    await logout();
    navigate("/");
    closeLogoutModal();
  };

  // Get the display name for user
  const getUserDisplayName = () => {
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) {
      // Extract name from email (part before @)
      return currentUser.email.split('@')[0];
    }
    return "User";
  };

  // Get role badge style
  const getRoleBadgeStyle = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'lecturer':
        return 'bg-purple-100 text-purple-800';
      case 'student':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Format role display
  const formatRoleDisplay = () => {
    if (!userRole) return '';
    return userRole.charAt(0).toUpperCase() + userRole.slice(1);
  };

  // Content modal logout
  const logoutModalContent = (
    <>
      <p className="text-gray-600 mb-6">
        Are you sure you want to log out?
      </p>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={closeLogoutModal}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
        >
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
            <Link to="/" className="text-xl font-bold text-blue-600">
              My Capstone App
            </Link>
            
            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  <div className="mr-4 flex items-center">
                    <span className="text-gray-700 mr-2">
                      Hello, {getUserDisplayName()}
                    </span>
                    {userRole && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeStyle()}`}>
                        {formatRoleDisplay()}
                      </span>
                    )}
                  </div>
                  
                  {/* Add Notifications System */}
                  <div className="mr-6">
                    <NotificationsSystem />
                  </div>
                  
                  <Link 
                    to="/app/dashboard" 
                    className="mr-4 text-gray-700 hover:text-blue-600"
                  >
                    Dashboard
                  </Link>
                  
                  {/* Role-specific Links */}
                  {userRole === 'student' && (
                    <Link 
                      to="/app/my-tickets" 
                      className="mr-4 text-gray-700 hover:text-blue-600"
                    >
                      Tiket Saya
                    </Link>
                  )}
                  
                  {userRole === 'lecturer' && (
                    <Link 
                      to="/app/lecturer-tickets" 
                      className="mr-4 text-gray-700 hover:text-blue-600"
                    >
                      Kelola Tiket
                    </Link>
                  )}
                  
                  {isAdmin() && (
                    <Link 
                      to="/admin/dashboard" 
                      className="mr-4 text-gray-700 hover:text-blue-600"
                    >
                      Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={openLogoutModal}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
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
        position="center"
      >
        {logoutModalContent}
      </Modal>
    </>
  );
};

export default Navbar;