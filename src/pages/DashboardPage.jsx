import { useEffect, useState } from "react";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { getVisibleTickets } from "../services/ticketService";

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalTickets: 0,
    newTickets: 0, // Changed from pendingTickets
    inProgressTickets: 0, // Added
    resolvedTickets: 0,
    totalFAQs: 0,
    recentTickets: [],
    recentActivities: [],
  });

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 25) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const stats = {
        totalTickets: 0,
        newTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        totalFAQs: 0,
        recentTickets: [],
        recentActivities: [],
      };

      if (userData?.role === "admin") {
        // Admin stats - all tickets
        const ticketsRef = collection(db, "tickets");
        const ticketsSnapshot = await getDocs(ticketsRef);

        // Filter tickets like in TicketManagementPage
        const allTickets = ticketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        stats.totalTickets = allTickets.length;
        stats.newTickets = allTickets.filter(
          (ticket) => ticket.status === "new"
        ).length;
        stats.inProgressTickets = allTickets.filter(
          (ticket) => ticket.status === "in_progress"
        ).length;
        stats.resolvedTickets = allTickets.filter(
          (ticket) => ticket.status === "done"
        ).length;

        // Recent tickets for admin (same logic as TicketManagementPage)
        const recentTicketsQuery = query(
          ticketsRef,
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentTicketsSnapshot = await getDocs(recentTicketsQuery);
        stats.recentTickets = recentTicketsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // FAQ count for admin
        const faqsRef = collection(db, "faqs");
        const faqsSnapshot = await getDocs(faqsRef);
        stats.totalFAQs = faqsSnapshot.size;
      } else if (userData?.role === "student") {
        // Student stats - only their visible tickets (same as StudentTicketsPage)
        const ticketsRef = collection(db, "tickets");
        const userTicketsQuery = query(
          ticketsRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const userTicketsSnapshot = await getDocs(userTicketsQuery);

        // Use same filtering logic as StudentTicketsPage
        const visibleTickets = await getVisibleTickets(
          userTicketsSnapshot,
          currentUser.uid
        );

        stats.totalTickets = visibleTickets.length;
        stats.newTickets = visibleTickets.filter(
          (ticket) => ticket.status === "new"
        ).length;
        stats.inProgressTickets = visibleTickets.filter(
          (ticket) => ticket.status === "in_progress"
        ).length;
        stats.resolvedTickets = visibleTickets.filter(
          (ticket) => ticket.status === "done"
        ).length;

        // Recent tickets for student (only visible tickets)
        stats.recentTickets = visibleTickets.slice(0, 5);
      }

      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Coba ambil dari localStorage dulu
      const cachedUserData = localStorage.getItem(
        `userData_${currentUser.uid}`
      );
      if (cachedUserData) {
        try {
          const parsedData = JSON.parse(cachedUserData);
          setUserData(parsedData);

          if (
            parsedData.createdAt &&
            typeof parsedData.createdAt === "string"
          ) {
            parsedData.createdAt = {
              toDate: () => new Date(parsedData.createdAt),
            };
            setUserData(parsedData);
          }
        } catch (e) {
          console.error("Error parsing cached user data in Dashboard:", e);
        }
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const freshUserData = userDoc.data();
          setUserData(freshUserData);

          const userDataToCache = { ...freshUserData };
          if (
            userDataToCache.createdAt &&
            typeof userDataToCache.createdAt.toDate === "function"
          ) {
            userDataToCache.createdAt = userDataToCache.createdAt
              .toDate()
              .toISOString();
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

  // Fetch stats when userData is available
  useEffect(() => {
    if (userData) {
      fetchDashboardStats();
    }
  }, [userData]);

  // Existing functions remain the same
  const formatCreatedDate = () => {
    if (!userData?.createdAt) return "N/A";

    try {
      if (typeof userData.createdAt.toDate === "function") {
        return userData.createdAt.toDate().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

      if (typeof userData.createdAt === "string") {
        return new Date(userData.createdAt).toLocaleDateString("id-ID", {
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

  const getUserType = () => {
    if (!userData) return "Unknown";

    if (userData.role) {
      return userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
    }

    if (userData.email) {
      if (userData.email.endsWith("@student.telkomuniversity.ac.id")) {
        return "Student";
      } else if (userData.email.endsWith("@adminhelpdesk.ac.id")) {
        return "Admin";
      }
    }

    return "User";
  };

  // Format ticket status - Updated to match TicketManagementPage and StudentTicketsPage
  const getStatusBadge = (status) => {
    if (userData?.role === "admin") {
      // Admin view (same as TicketManagementPage)
      switch (status) {
        case "new":
          return {
            className: "bg-blue-100 text-blue-800",
            label: "Baru",
          };
        case "in_progress":
          return {
            className: "bg-yellow-100 text-yellow-800",
            label: "Diproses",
          };
        case "done":
          return {
            className: "bg-green-100 text-green-800",
            label: "Selesai",
          };
        default:
          return {
            className: "bg-gray-100 text-gray-800",
            label: "Tidak Diketahui",
          };
      }
    } else {
      // Student view (same as StudentTicketsPage)
      switch (status) {
        case "new":
          return {
            className: "bg-blue-100 text-blue-800",
            label: "Menunggu",
          };
        case "in_progress":
          return {
            className: "bg-yellow-100 text-yellow-800",
            label: "Diproses",
          };
        case "done":
          return {
            className: "bg-green-100 text-green-800",
            label: "Selesai",
          };
        default:
          return {
            className: "bg-gray-100 text-gray-800",
            label: "Tidak Diketahui",
          };
      }
    }
  };

  // Format date for tickets
  const formatTicketDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  // Get category label
  const getCategoryLabel = (kategori) => {
    const kategoriMap = {
      akademik: "Akademik",
      fasilitas: "Fasilitas",
      organisasi: "Organisasi Mahasiswa",
      ukm: "UKM",
      keuangan: "Keuangan",
      umum: "Pertanyaan Umum",
      lainnya: "Lainnya",
    };

    return kategoriMap[kategori] || kategori;
  };

  if (loading && !userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Role-specific sections remain the same but with improved styling */}
      {userData?.role === "student" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-500 rounded-lg mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900">
              Student Information
            </h3>
          </div>
          <p className="text-gray-700">
            Welcome to your student dashboard! Here you can create support
            tickets, track your submissions, and access helpful resources.
          </p>
        </div>
      )}

      {userData?.role === "admin" && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-red-500 rounded-lg mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-900">Admin Controls</h3>
          </div>
          <p className="text-gray-700">
            Welcome to the admin dashboard! You can manage support tickets,
            maintain FAQs, oversee user accounts, and monitor system
            performance.
          </p>
        </div>
      )}

      {/* Stats Cards - Updated with responsive grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${
          userData?.role === "admin" ? "xl:grid-cols-5" : "xl:grid-cols-5"
        } gap-4 lg:gap-6`}
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-lg font-bold mb-2">
                Total Tiket
              </p>
              <p className="text-4xl font-bold">
                {dashboardStats.totalTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-lg font-bold mb-2">
                {userData?.role === "admin" ? "Tiket Baru" : "Menunggu"}
              </p>
              <p className="text-4xl font-bold">{dashboardStats.newTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-lg font-bold mb-2">
                {userData?.role === "admin" ? "Sedang Diproses" : "Diproses"}
              </p>
              <p className="text-4xl font-bold">
                {dashboardStats.inProgressTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-lg font-bold mb-2">Selesai</p>
              <p className="text-4xl font-bold">
                {dashboardStats.resolvedTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-lg font-bold mb-2">
                Success Rate
              </p>
              <p className="text-4xl font-bold">
                {dashboardStats.totalTickets > 0
                  ? Math.round(
                      (dashboardStats.resolvedTickets /
                        dashboardStats.totalTickets) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full mr-4">
                <svg
                  className="h-8 w-8"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {userData?.name || "User"}
                </h2>
                <p className="text-gray-600">{getUserType()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Full Name</p>
                <p className="text-gray-900 font-semibold">
                  {userData?.name || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm font-medium">Email</p>
                <p
                  className="text-gray-900 font-semibold truncate"
                  title={
                    currentUser?.email || userData?.email || "Not available"
                  }
                >
                  {currentUser?.email || userData?.email || "Not available"}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Account Type
                </p>
                <span
                  className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    getUserType() === "Admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {getUserType()}
                </span>
              </div>

              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Registered On
                </p>
                <p className="text-gray-900 font-semibold">
                  {formatCreatedDate()}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Actions
              </h4>
              <div className="space-y-2">
                {userData?.role === "student" && (
                  <Link
                    to="/app/submit-ticket"
                    className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-white transition-all hover:scale-105 hover:text-blue-600 hover:border-blue-600 border duration-300"
                  >
                    Create New Ticket
                  </Link>
                )}
                {userData?.role === "admin" && (
                  <>
                    <Link
                      to="/admin/tickets"
                      className="block w-full hover:bg-white hover:text-blue-600 hover:scale-105 hover:border hover:border-blue-600 transition-all duration-300  text-center bg-blue-600 text-white py-2 px-4 rounded-lg"
                    >
                      Manage Tickets
                    </Link>
                    <Link
                      to="/admin/faq"
                      className="block w-full hover:bg-white hover:text-green-600 hover:scale-105 hover:border hover:border-green-600 transition-all duration-300  text-center bg-green-600 text-white py-2 px-4 rounded-lg"
                    >
                      Manage FAQs
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Recent Tickets
              </h3>
              <Link
                to={
                  userData?.role === "admin"
                    ? "/admin/tickets"
                    : "/app/my-tickets"
                }
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All →
              </Link>
            </div>

            {dashboardStats.recentTickets.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.recentTickets.map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.status);
                  return (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {ticket.judul || "No Subject"}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {getCategoryLabel(ticket.kategori)} •{" "}
                          {formatTicketDate(ticket.createdAt)}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tickets yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {userData?.role === "student"
                    ? "Get started by creating your first support ticket."
                    : "No tickets to manage at the moment."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
