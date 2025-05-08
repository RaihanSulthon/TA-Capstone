// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get user type from email
  const getUserType = () => {
    if (!userData) return "Unknown";
    
    if (userData.role) {
      return userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
    }
    
    if (userData.email.endsWith("@student.telkomuniversity.ac.id")) {
      return "Student";
    } else if (userData.email.endsWith("@telkomuniversity.ac.id")) {
      return "Lecturer";
    } else if (userData.email === "admin@capstone.ac.id") {
      return "Administrator";
    }
    
    return "User";
  };

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
              <p className="font-medium">{currentUser?.email}</p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Account Type</p>
              <p className="font-medium">{getUserType()}</p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Registered On</p>
              <p className="font-medium">
                {userData?.createdAt?.toDate().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
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
        
        {userData?.role === "lecturer" && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-4 text-lg">Lecturer Information</h3>
            <p className="text-gray-600">Welcome to the lecturer dashboard. Here you can manage your courses and students.</p>
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