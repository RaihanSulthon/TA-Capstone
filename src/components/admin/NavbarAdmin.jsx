import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/Authcontexts";
import { useState, useEffect } from "react";
import Modal from "../Modal";
import { db } from "../../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import NotificationsSystem from "../NotificationsSystem";
import applogo from "../../assets/applogo.png";

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
        const cachedUserData = localStorage.getItem(
          `userData_${currentUser.uid}`
        );
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
      <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>

      <div className="flex justify-end space-x-3">
        <button
          onClick={closeLogoutModal}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors">
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

  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      <nav className="bg-red-700 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin/dashboard" className="flex items-center">
              <div className="hidden sm:block">
                <img src={applogo} alt="App Logo" className="h-8 w-auto" />
              </div>
              <span className="text-md md:text-xl font-bold text-white md:ml-4">
                Admin Panel
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="flex items-center">
              <div className="hidden md:flex items-center">
                <span className="mr-4">Hello, {getDisplayName()}</span>

                {/* Add NotificationSystem component */}
                <div className="mr-4">
                  <NotificationsSystem />
                </div>

                <Link
                  to="/admin/dashboard"
                  className="mr-4 text-white hover:text-red-200">
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className="mr-4 text-white hover:text-red-200">
                  Users
                </Link>
                <Link
                  to="/admin/tickets"
                  className="mr-4 text-white hover:text-red-200">
                  Tickets
                </Link>
                {/* Add Contacts Menu */}
                <Link
                  to="/admin/contacts"
                  className="mr-4 text-white hover:text-red-200">
                  Contacts
                </Link>
                {/* Add FAQ Menu */}
                <Link
                  to="/admin/faqs"
                  className="mr-4 text-white hover:text-red-200">
                  FAQ
                </Link>
                <Link
                  to="/app/dashboard"
                  className="mr-4 text-white hover:text-red-200">
                  User View
                </Link>
                <button
                  onClick={openLogoutModal}
                  className="bg-red-700 border-1 border-white hover:bg-white hover:text-red-700 px-5 py-2 rounded-lg font-semibold transition-colors duration-300">
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
                  className="bg-white text-red-700 px-3 py-1 rounded text-sm">
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
        position="center">
        {logoutModalContent}
      </Modal>
    </>
  );
};

export default NavbarAdmin;
