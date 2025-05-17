// src/components/NavbarAdmin.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContexts";
import { useState } from "react";
import Modal from "../Modal";

const NavbarAdmin = () => {
  const { currentUser, logout, isAdmin } = useAuth();
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

  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      <nav className="bg-red-700 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin/dashboard" className="text-xl font-bold text-white">
              Admin Panel
            </Link>
            
            <div className="flex items-center">
              <span className="mr-4">
                {currentUser?.email || "Admin"}
              </span>
              <Link 
                to="/admin/dashboard" 
                className="mr-4 text-white hover:text-red-200"
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/users" 
                className="mr-4 text-white hover:text-red-200"
              >
                Users
              </Link>
              <Link 
                to="/app/dashboard" 
                className="mr-4 text-white hover:text-red-200"
              >
                User View
              </Link>
              <button
                onClick={openLogoutModal}
                className="bg-white text-red-700 hover:bg-red-100 px-4 py-2 rounded"
              >
                Logout
              </button>
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

export default NavbarAdmin;