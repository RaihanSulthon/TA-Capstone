import { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import Toast from "../../components/Toast";
import EnhancedAnalytics from "../../components/admin/EnhancedAnalytics";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userTicketStats, setUserTicketStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [tickets, setTickets] = useState([]);

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Fetch all users and tickets
  useEffect(() => {
    const fetchUsersAndStats = async () => {
      try {
        // Fetch users
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        
        // Fetch tickets for analytics
        const ticketsCollection = collection(db, "tickets");
        const ticketsSnapshot = await getDocs(ticketsCollection);
        const ticketsList = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTickets(ticketsList);

        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersList);
        
        const stats = {};
        
        // Initialize stats for all users
        usersList.forEach(user => {
          stats[user.id] = {
            total: 0,
            new: 0,
            in_progress: 0,
            done: 0,
            lastSubmission: null
          };
        });
        
        // Count tickets for each user
        ticketsSnapshot.docs.forEach(doc => {
          const ticket = doc.data();
          const userId = ticket.userId;
          
          if (userId && userId !== "anonymous" && stats[userId]) {
            stats[userId].total++;
            
            // Count by status
            if (ticket.status === "new") stats[userId].new++;
            else if (ticket.status === "in_progress") stats[userId].in_progress++;
            else if (ticket.status === "done") stats[userId].done++;
            
            // Track last submission
            if (ticket.createdAt) {
              const ticketDate = ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
              if (!stats[userId].lastSubmission || ticketDate > stats[userId].lastSubmission) {
                stats[userId].lastSubmission = ticketDate;
              }
            }
          }
        });
        
        setUserTicketStats(stats);
        
      } catch (error) {
        console.error("Error fetching users and stats:", error);
        setToast({
          message: "Failed to load users. Please try again.",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsersAndStats();
  }, []);

  // Clear toast after timeout
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: "", type: "success" });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter users based on search term - no need to exclude dosen_public anymore
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter logic to handle only student and admin
    let matchesRole = filterRole === "all";
    
    if (filterRole === "student" || filterRole === "admin") {
      matchesRole = user.role === filterRole;
    }
    
    return matchesSearch && matchesRole;
  });

  // Reset search and filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
  };

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

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'student': return 'Student';
      default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    }
  };

  // Format last submission date
  const formatLastSubmission = (date) => {
    if (!date) return "Belum pernah";
    
    try {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return "N/A";
    }
  };

  // Get user count by role
  const getUserCounts = () => {
    const studentCount = users.filter(user => user.role === 'student').length;
    const adminCount = users.filter(user => user.role === 'admin').length;
    
    return {
      students: studentCount,
      admins: adminCount
    };
  };

  // Get user counts for display
  const userCounts = getUserCounts();

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Ticket Statistics</h1>
      
      {/* Toast notification */}
      {toast.message && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      )}
      
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email"
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                id="role-filter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-blue-600">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Students</p>
          <p className="text-2xl font-bold text-green-600">
            {userCounts.students}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Active Students</p>
          <p className="text-2xl font-bold text-purple-600">
            {Object.values(userTicketStats).filter(stat => stat.total > 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Laporan</p>
          <p className="text-2xl font-bold text-indigo-600">
            {Object.values(userTicketStats).reduce((total, stat) => total + stat.total, 0)}
          </p>
        </div>
      </div>

      {/* Enhanced Analytics Charts Section */}
      <EnhancedAnalytics tickets={tickets} users={users} />
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  Total Laporan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Laporan
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terakhir Submit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const stats = userTicketStats[user.id] || { 
                    total: 0, 
                    new: 0, 
                    in_progress: 0, 
                    done: 0, 
                    lastSubmission: null 
                  };
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="text-sm text-gray-500 truncate max-w-xs" 
                          title={user.email}
                        >
                          {truncateText(user.email, 30)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                            user.role === 'dosen_public' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {stats.total}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stats.total > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {stats.new > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {stats.new} Baru
                              </span>
                            )}
                            {stats.in_progress > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                {stats.in_progress} Proses
                              </span>
                            )}
                            {stats.done > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {stats.done} Selesai
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastSubmission(stats.lastSubmission)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      "No users found"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Total Users Displayed:</span> {filteredUsers.length}
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Users with Activity:</span> {
                filteredUsers.filter(user => {
                  const stats = userTicketStats[user.id];
                  return stats && stats.total > 0;
                }).length
              }
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Total System Tickets:</span> {tickets.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;