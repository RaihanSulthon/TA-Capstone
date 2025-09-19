import { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import Toast from "../../components/Toast";
import EnhancedAnalytics from "../../components/admin/EnhancedAnalytics";

const UserManagementPage = () => {
  // State declarations
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userTicketStats, setUserTicketStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6);

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
        const ticketsList = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTickets(ticketsList);

        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(usersList);

        const stats = {};

        // Initialize stats for all users
        usersList.forEach((user) => {
          stats[user.id] = {
            total: 0,
            new: 0,
            in_progress: 0,
            done: 0,
            lastSubmission: null,
          };
        });

        // Count tickets for each user
        ticketsSnapshot.docs.forEach((doc) => {
          const ticket = doc.data();
          const userId = ticket.userId;

          if (userId && userId !== "anonymous" && stats[userId]) {
            stats[userId].total++;

            // Count by status
            if (ticket.status === "new") stats[userId].new++;
            else if (ticket.status === "in_progress")
              stats[userId].in_progress++;
            else if (ticket.status === "done") stats[userId].done++;

            // Track last submission
            if (ticket.createdAt) {
              const ticketDate = ticket.createdAt.toDate
                ? ticket.createdAt.toDate()
                : new Date(ticket.createdAt);
              if (
                !stats[userId].lastSubmission ||
                ticketDate > stats[userId].lastSubmission
              ) {
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
          type: "error",
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  // Helper functions
  const truncateText = (text, maxLength = 25) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

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

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "student":
        return "Student";
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";
    }
  };

  const formatLastSubmission = (date) => {
    if (!date) return "Belum pernah";

    try {
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Data processing (IMPORTANT: Order matters here!)

  // 1. Filter users first
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesRole = filterRole === "all";

    if (filterRole === "student" || filterRole === "admin") {
      matchesRole = user.role === filterRole;
    }

    return matchesSearch && matchesRole;
  });

  // 2. Calculate user counts
  const userCounts = {
    students: users.filter((user) => user.role === "student").length,
    admins: users.filter((user) => user.role === "admin").length,
  };

  // 3. Pagination logic (must be after filteredUsers)
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 overflow-x-hidden w-full">
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
      <div className="bg-white p-3 md:p-6 rounded-lg shadow-md mb-4 md:mb-6 overflow-hidden w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 items-end">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="role-filter"
              className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              id="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Reset Button - Separate Row */}
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            onClick={resetFilters}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-semibold hover:scale-105 transition-all duration-300 hover:shadow-xl">
            Reset Filter
          </button>
        </div>
      </div>{" "}
      {/* Users Table - IMPROVED RESPONSIVE DESIGN */}
      <h1 className="text-2xl font-bold mb-6">User Statistics</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-full mb-4">
        {/* Mobile Card Layout */}
        <div className="block md:hidden">
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-4 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Tidak ada user yang ditemukan
              </div>
            ) : (
              currentUsers.map((user) => {
                const stats = userTicketStats[user.id] || {
                  total: 0,
                  new: 0,
                  in_progress: 0,
                  done: 0,
                  lastSubmission: null,
                };

                // Helper function untuk mendapatkan role badge
                const getRoleBadge = (role) => {
                  switch (role) {
                    case "admin":
                      return (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Admin
                        </span>
                      );
                    case "student":
                      return (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Student
                        </span>
                      );
                    default:
                      return (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {role}
                        </span>
                      );
                  }
                };

                // Helper function untuk status laporan
                const getStatusSummary = (stats) => {
                  if (stats.total === 0) {
                    return (
                      <span className="text-gray-500 text-sm">
                        Belum ada laporan
                      </span>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {stats.new > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs text-blue-600">
                            {stats.new} Baru
                          </span>
                        </div>
                      )}
                      {stats.in_progress > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs text-yellow-600">
                            {stats.in_progress} Proses
                          </span>
                        </div>
                      )}
                      {stats.done > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs text-green-600">
                            {stats.done} Selesai
                          </span>
                        </div>
                      )}
                    </div>
                  );
                };

                // Format tanggal terakhir submit
                const formatLastSubmission = (lastSubmission) => {
                  if (!lastSubmission) return "Belum pernah submit";

                  try {
                    const date = lastSubmission.toDate
                      ? lastSubmission.toDate()
                      : new Date(lastSubmission);
                    return date.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                  } catch (e) {
                    return "Tanggal tidak valid";
                  }
                };

                return (
                  <div key={user.id} className="p-3 hover:bg-gray-50">
                    {/* Header dengan nama dan email */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.name ||
                            user.email?.split("@")[0] ||
                            "Unknown User"}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {getRoleBadge(user.role)}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-600">
                          Total Laporan
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {stats.total}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-600">
                          Status Laporan
                        </div>
                        <div className="mt-1">{getStatusSummary(stats)}</div>
                      </div>
                    </div>

                    {/* Terakhir Submit */}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          Terakhir Submit:
                        </span>
                        <span className="text-xs text-gray-900 font-medium">
                          {formatLastSubmission(stats.lastSubmission)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
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
                  Total Laporan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Laporan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terakhir Submit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers && currentUsers.length > 0 ? (
                currentUsers.map((user) => {
                  const stats = userTicketStats[user.id] || {
                    total: 0,
                    new: 0,
                    in_progress: 0,
                    done: 0,
                    lastSubmission: null,
                  };

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name ||
                          user.email?.split("@")[0] ||
                          "Unknown User"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : user.role === "student"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                          {user.role === "admin"
                            ? "Admin"
                            : user.role === "student"
                            ? "Student"
                            : user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-bold text-blue-600">
                          {stats.total}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stats.total === 0 ? (
                          <span className="text-gray-400">
                            Belum ada laporan
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {stats.new > 0 && (
                              <div className="text-blue-600">
                                {stats.new} Baru
                              </div>
                            )}
                            {stats.in_progress > 0 && (
                              <div className="text-yellow-600">
                                {stats.in_progress} Proses
                              </div>
                            )}
                            {stats.done > 0 && (
                              <div className="text-green-600">
                                {stats.done} Selesai
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stats.lastSubmission ? (
                          (() => {
                            try {
                              const date = stats.lastSubmission.toDate
                                ? stats.lastSubmission.toDate()
                                : new Date(stats.lastSubmission);
                              return date.toLocaleDateString("id-ID");
                            } catch (e) {
                              return "Tanggal tidak valid";
                            }
                          })()
                        ) : (
                          <span className="text-gray-400">
                            Belum pernah submit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-3 md:px-6 py-3 border-t border-gray-200 overflow-hidden w-full">
            {/* Mobile Pagination */}
            <div className="flex md:hidden justify-between items-center">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden md:flex md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{indexOfFirstUser + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastUser, filteredUsers.length)}
                  </span>{" "}
                  out of <span className="font-medium">{filteredUsers.length}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;

                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else {
                      if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}>
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8 px-1">
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">
            Total Users
          </p>
          <p className="text-lg md:text-2xl font-bold text-blue-600">
            {users.length}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">Students</p>
          <p className="text-lg md:text-2xl font-bold text-green-600">
            {userCounts.students}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">Admins</p>
          <p className="text-lg md:text-2xl font-bold text-red-600">
            {userCounts.admins}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">
            Total Laporan
          </p>
          <p className="text-lg md:text-2xl font-bold text-indigo-600">
            {Object.values(userTicketStats).reduce(
              (total, stat) => total + stat.total,
              0
            )}
          </p>
        </div>
      </div>
      {/* Enhanced Analytics Charts Section */}
      <EnhancedAnalytics
        tickets={tickets}
        users={users}
        showExportButtons={true}
      />
      {/* Additional Information */}
      <div className="mt-4 md:mt-6 bg-white rounded-lg shadow-md p-4 md:p-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">
          Summary Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-gray-600">
              <span className="font-medium text-xs md:text-sm">
                Users with Activity:
              </span>
              <br className="sm:hidden" />
              <span className="text-green-600 font-semibold">
                {" "}
                {
                  filteredUsers.filter((user) => {
                    const stats = userTicketStats[user.id];
                    return stats && stats.total > 0;
                  }).length
                }
              </span>
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md sm:col-span-2 lg:col-span-1">
            <p className="text-gray-600">
              <span className="font-medium text-xs md:text-sm">
                Total System Tickets:
              </span>
              <br className="sm:hidden" />
              <span className="text-purple-600 font-semibold">
                {" "}
                {tickets.length}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
