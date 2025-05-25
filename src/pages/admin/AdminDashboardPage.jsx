// src/pages/admin/AdminDashboardPage.jsx - Fixed to properly handle disposisi role
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/Authcontexts";
import { db } from "../../firebase-config";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Link } from "react-router-dom";

const AdminDashboardPage = () => {
  const { currentUser } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    students: 0,
    disposisi: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch admin user data
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAdminData(userData);
        }
        
        // Fetch recent users
        const usersQuery = query(
          collection(db, "users"), 
          orderBy("createdAt", "desc"), 
          limit(5)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = [];
        
        usersSnapshot.forEach((doc) => {
          usersData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        
        setRecentUsers(usersData);
        
        // Calculate user statistics
        const statsQuery = await getDocs(collection(db, "users"));
        let totalUsers = 0;
        let studentCount = 0;
        let disposisiCount = 0;
        
        statsQuery.forEach((doc) => {
          const userData = doc.data();
          totalUsers++;
          
          if (userData.role === "student") {
            studentCount++;
          } else if (userData.role === "disposisi") {
            // Count only disposisi role
            disposisiCount++;
          }
        });
        
        setUserStats({
          total: totalUsers,
          students: studentCount,
          disposisi: disposisiCount
        });
        
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser]);

  // Format date helper function
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('id-ID', {
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

  // Get proper role display name
  const getRoleDisplayName = (role) => {
    if (role === "disposisi") return "Disposisi";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Admin Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 text-blue-800 p-3 rounded-full mr-4">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{adminData?.name || "Administrator"}</h2>
            <p className="text-gray-600">Administrator Account</p>
          </div>
        </div>
      </div>
      
      {/* Admin Actions Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/admin/users"
            className="flex items-center p-4 bg-blue-50 rounded-lg transition-colors hover:bg-blue-100"
          >
            <div className="bg-blue-100 text-blue-800 p-3 rounded-full mr-4">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Manage Users</h4>
              <p className="text-sm text-gray-600">View, edit and delete user accounts</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{userStats.total}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Students</h3>
          <p className="text-3xl font-bold text-green-600">{userStats.students}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Disposisi</h3>
          <p className="text-3xl font-bold text-purple-600">{userStats.disposisi}</p>
        </div>
      </div>
      
      {/* Recent Users */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Recent Users</h3>
          <Link 
            to="/admin/users" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Users
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                          user.role === 'disposisi' ? 'bg-purple-100 text-purple-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;