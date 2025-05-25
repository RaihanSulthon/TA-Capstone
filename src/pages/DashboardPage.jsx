// Modified DashboardPage.jsx with truncated email addresses
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      // Coba ambil dari localStorage dulu untuk menghindari tampilan kosong saat loading
      const cachedUserData = localStorage.getItem(`userData_${currentUser.uid}`);
      if (cachedUserData) {
        try {
          const parsedData = JSON.parse(cachedUserData);
          setUserData(parsedData);
          
          // Konversi string ISO date kembali ke Date object untuk format tanggal
          if (parsedData.createdAt && typeof parsedData.createdAt === 'string') {
            parsedData.createdAt = {
              toDate: () => new Date(parsedData.createdAt)
            };
            setUserData(parsedData);
          }
          
          // Tidak set loading=false di sini agar tetap mengambil data segar
        } catch (e) {
          console.error("Error parsing cached user data in Dashboard:", e);
        }
      }

      try {
        // Ambil data segar dari Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const freshUserData = userDoc.data();
          setUserData(freshUserData);
          
          // Simpan ke localStorage untuk penggunaan selanjutnya
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
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fungsi untuk format tanggal dari userData
  const formatCreatedDate = () => {
    if (!userData?.createdAt) return "N/A";
    
    try {
      // Handle format dari Firestore Timestamp
      if (typeof userData.createdAt.toDate === 'function') {
        return userData.createdAt.toDate().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      // Handle format dari localStorage (string ISO)
      if (typeof userData.createdAt === 'string') {
        return new Date(userData.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      return "N/A";
    } catch (e) {
      console.error("Error formatting date:", e);
      return "N/A";
    }
  };

  // Get user type from email or role
  const getUserType = () => {
    if (!userData) return "Unknown";
    
    if (userData.role) {
      return userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
    }
    
    if (userData.email) {
      if (userData.email.endsWith("@student.telkomuniversity.ac.id")) {
        return "Student";
      } else if (userData.email.endsWith("@telkomuniversity.ac.id")) {
        return "Disposisi";
      } else if (userData.email.endsWith("@adminhelpdesk.ac.id")) {
        return "Administrator";
      }
    }
    
    return "User";
  };

  if (loading && !userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 text-blue-800 p-3 rounded-full mr-4">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{userData?.name || "User"}</h2>
            <p className="text-gray-600">{getUserType()}</p>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-4 text-lg">Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Full Name</p>
              <p className="font-medium">{userData?.name || "Not provided"}</p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <p className="font-medium truncate max-w-xs" title={currentUser?.email || userData?.email || "Not available"}>
                {currentUser?.email || userData?.email || "Not available"}
              </p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Account Type</p>
              <p className="font-medium">{getUserType()}</p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Registered On</p>
              <p className="font-medium">
                {formatCreatedDate()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional sections based on user role */}
        {userData?.role === "student" && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-4 text-lg">Student Information</h3>
            <p className="text-gray-600">Welcome to the student dashboard. Here you can access your courses and assignments.</p>
          </div>
        )}
        
        {userData?.role === "disposisi" && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-4 text-lg">Disposisi Information</h3>
            <p className="text-gray-600">Welcome to the disposisi dashboard. Here you can manage your courses and students.</p>
          </div>
        )}
        
        {userData?.role === "admin" && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-4 text-lg">Admin Controls</h3>
            <p className="text-gray-600">Welcome to the admin dashboard. Here you can manage users and system settings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;