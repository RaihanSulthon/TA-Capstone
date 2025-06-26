import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/Authcontexts";
import { useState, useEffect } from "react";
import Modal from "../Modal";
import {db} from "../../firebase-config";
import {doc, getDoc} from "firebase/firestore";
import NotificationsSystem from "../NotificationsSystem";

const NavbarAdmin = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  // Fetch user data name
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        //get from localStorage
        const cachedUserData = localStorage.getItem(`userData_${currentUser.uid}`);
        if (cachedUserData) {
          const parsedData = JSON.parse(cachedUserData);
          setUserData(parsedData);
        }

        // Fetch fresh data from Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const freshUserData = userDoc.data();
          setUserData(freshUserData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [currentUser]);

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

  const getDisplayName = () => {
    if (userData?.name) {
      return userData.name;
    }
    return currentUser?.displayName || currentUser?.email || "Admin";
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
          className="bg-red-500 text-white hover:bg-white hover:text-red-500 border border-red-500 transition-colors duration-200 px-4 py-2 rounded"
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
            <Link to="/admin/dashboard" className="flex items-center">
              <svg
                className="w-6 h-6 md:w-8 md:h-8 text-white mr-1 md:mr-2"
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
              <span className="text-md md:text-xl font-bold text-white">Admin Panel</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="flex items-center">
              <div className="hidden md:flex items-center">
                <span className="mr-4">
                  Hello, {getDisplayName()}
                </span>
                
                {/* Add NotificationSystem component */}
                <div className="mr-4">
                  <NotificationsSystem />
                </div>
                
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
                  to="/admin/tickets"
                  className="mr-4 text-white hover:text-red-200"
                >
                  Tickets
                </Link>
                {/* Add Contacts Menu */}
                <Link 
                  to="/admin/contacts"
                  className="mr-4 text-white hover:text-red-200"
                >
                  Contacts
                </Link>
                {/* Add FAQ Menu */}
                <Link 
                  to="/admin/faqs"
                  className="mr-4 text-white hover:text-red-200"
                >
                  FAQ
                </Link>
                <Link 
                  to="/app/dashboard" 
                  className="mr-4 text-white hover:text-red-200"
                >
                  User View
                </Link>
                <button
                  onClick={openLogoutModal}
                  className="bg-red-700 border-1 border-white hover:bg-white hover:text-red-700 px-5 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  Logout
                </button>
              </div>
              <div className="md:hidden flex items-center space-x-2">
                <NotificationsSystem />
                <span className="text-white text-sm mr-2">
                  {getDisplayName()}
                </span>
                <button
                  onClick={openLogoutModal}
                  className="bg-white text-red-700 px-3 py-1 rounded text-sm"
                >
                  Logout
                </button>
              </div>
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