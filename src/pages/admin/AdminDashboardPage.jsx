// src/pages/admin/AdminDashboardPage.jsx - Fixed to properly handle role
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/Authcontexts";
import { db } from "../../firebase-config";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { Link } from "react-router-dom";

const AdminDashboardPage = () => {
  const { currentUser } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    students: 0,
    admins: 0,
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
        let adminCount = 0;

        statsQuery.forEach((doc) => {
          const userData = doc.data();
          totalUsers++;

          if (userData.role === "student") {
            studentCount++;
          } else if (userData.role === "admin") {
            adminCount++;
          }
        });

        setUserStats({
          total: totalUsers,
          students: studentCount,
          admins: adminCount,
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
      if (typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

      if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
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
    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 overflow-x-hidden w-full">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Admin Info Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 text-blue-800 p-3 rounded-full mr-4">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {adminData?.name || "Administrator"}
            </h2>
            <p className="text-gray-600">Administrator Account</p>
          </div>
        </div>
      </div>

      {/* Admin Actions Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center p-4 bg-blue-50 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-blue-100 hover:shadow-xl">
            <div className="bg-blue-100 text-blue-800 p-3 rounded-full mr-4">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Analyze Ticket Statistics</h4>
              <p className="text-sm text-gray-600">View Ticket Statistics</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8 px-1">
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">
            Total Users
          </p>
          <p className="text-lg md:text-2xl font-bold text-blue-600">
            {userStats.total}
          </p>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">Students</p>
          <p className="text-lg md:text-2xl font-bold text-green-600">
            {userStats.students}
          </p>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">Admin</p>
          <p className="text-lg md:text-2xl font-bold text-red-600">
            {userStats.admins}
          </p>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 p-4 md:p-6 gap-3">
          <h3 className="text-lg md:text-xl font-semibold">User Overview</h3>
          <Link
            to="/admin/users"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium w-full sm:w-auto text-center sm:text-left">
            View All Users
          </Link>
        </div>

        {/* Mobile Card Layout */}
        <div className="block md:hidden">
          <div className="divide-y divide-gray-200">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 truncate flex-1 mr-2">
                      {user.name || "N/A"}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {user.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Registered: {formatDate(user.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No recent users found
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}>
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
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500">
                    No recent users found
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
