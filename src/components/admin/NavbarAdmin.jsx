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

  // Content modal logout - Updated design
  const logoutModalContent = (
    <div className="bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 rounded-2xl p-8">
      <div className="text-center mb-8">
        {/* Admin Logout Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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
          🔐 Admin Logout
        </h3>
        <p className="text-base text-gray-600">
          Apakah Anda yakin ingin keluar dari panel admin?
        </p>
      </div>

      {/* Admin Info Section */}
      <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm mb-6">
        <div className="flex items-start">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            <svg
              className="w-4 h-4 text-red-600"
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
              Informasi Admin Session
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Setelah logout, Anda akan diarahkan ke halaman utama dan perlu
              login kembali untuk mengakses panel admin.
            </p>

            {/* Admin User Info */}
            <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                <span className="ml-3 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex-shrink-0">
                  Admin
                </span>
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
          🔒 Pastikan semua pekerjaan admin telah disimpan sebelum logout
        </p>
      </div>
    </div>
  );

  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      <nav className="bg-red-700 text-white shadow-md">
        <div className="w-full px-4 md:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/admin/dashboard" className="flex items-center">
              <div className="hidden sm:block">
                <img
                  src={applogo}
                  alt="App Logo"
                  className="h-8 w-auto hover:scale-105 transition-all duration-300"
                />
              </div>
              <span className="text-md md:text-xl font-bold text-white md:ml-4">
                Admin Panel
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="flex items-center">
              <div className="hidden md:flex items-center gap-x-1">
                <span className="mr-4">Hello, {getDisplayName()}</span>

                {/* Add NotificationSystem component */}
                <div className="mr-4">
                  <NotificationsSystem />
                </div>

                <button
                  onClick={openLogoutModal}
                  className="bg-red-700 border-1 border-white hover:bg-white hover:text-red-700 px-5 py-2 rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-xl duration-300"
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
                  className="bg-white text-red-700 px-3 py-1 rounded text-sm hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  Logout
                </button>
              </div>
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

export default NavbarAdmin;
