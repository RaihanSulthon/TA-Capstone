import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContexts";
import { useState, useEffect } from "react";
import { db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import Modal from "./Modal";

const Navbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      
      // Coba ambil dari localStorage dulu untuk mengurangi flickering
      const cachedUserData = localStorage.getItem(`userData_${currentUser.uid}`);
      if (cachedUserData) {
        try {
          const parsedData = JSON.parse(cachedUserData);
          setUserData(parsedData);
          // Tetap set isLoading=false agar UI responsif
          setIsLoading(false);
        } catch (e) {
          console.error("Error parsing cached user data:", e);
        }
      }

      try {
        // Tetap ambil data segar dari Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const freshUserData = userDoc.data();
          setUserData(freshUserData);
          
          // Simpan ke localStorage untuk penggunaan selanjutnya
          // Konversi tanggal jika ada
          const userDataToCache = { ...freshUserData };
          if (userDataToCache.createdAt && typeof userDataToCache.createdAt.toDate === 'function') {
            userDataToCache.createdAt = userDataToCache.createdAt.toDate().toISOString();
          }
          
          localStorage.setItem(
            `userData_${currentUser.uid}`, 
            JSON.stringify(userDataToCache)
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    
    // Cleanup function untuk kasus unmount
    return () => {
      // Bisa ditambahkan cleanup jika diperlukan
    };
  }, [currentUser]);

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLogout = async () => {
    // Hapus userData dari localStorage saat logout
    if (currentUser?.uid) {
      localStorage.removeItem(`userData_${currentUser.uid}`);
    }
    
    await logout();
    navigate("/");
    closeLogoutModal();
  };

  const getUserDisplayName = () => {
    // Fungsi ini dibuat lebih robust
    // Prioritas: userData dari state -> localStorage -> currentUser properties
    
    if (userData?.name) {
      return userData.name;
    }
    
    // Jika userData tidak ada di state, coba dari localStorage
    if (currentUser?.uid) {
      try {
        const cachedData = localStorage.getItem(`userData_${currentUser.uid}`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed?.name) {
            return parsed.name;
          }
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }
    }
    
    // Fallback ke properti currentUser
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.fullName) return currentUser.fullName;
    
    // Jika masih tidak ada, gunakan email atau placeholder
    return currentUser?.email?.split('@')[0] || "User";
  };

  // Content modal logout
  const logoutModalContent = (
    <>
      <p className="text-gray-600 mb-6">
        Apakah Anda yakin ingin keluar dari aplikasi?
      </p>
      
      <div className="flex justify-end space-x-3">
        <button
          onClick={closeLogoutModal}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Batal
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
              Helpdesk MVP App
            </Link>
            
            <div className="flex items-center">
              {isAuthenticated ? (
                <>
                  <span className="mr-4 text-gray-700">
                    Hello, {isLoading ? (
                      // Skeleton loader selama loading
                      <span className="inline-block w-20 h-4 bg-gray-200 animate-pulse rounded"></span>
                    ) : (
                      getUserDisplayName()
                    )}
                  </span>
                  <Link 
                    to="/app/dashboard" 
                    className="mr-4 text-gray-700 hover:text-blue-600"
                  >
                    Dashboard
                  </Link>
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
                    to={{
                      pathname: "/auth",
                      state: { initialTab: "signup" }
                    }}
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
        title="Konfirmasi Logout"
        size="sm"
        position="center"
      >
        {logoutModalContent}
      </Modal>
    </>
  );
};

export default Navbar;