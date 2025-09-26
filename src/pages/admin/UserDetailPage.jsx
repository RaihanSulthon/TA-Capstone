import React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase-config";

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userDetail, setUserDetail] = useState(null);
  const [userTickets, setUserTickets] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    baru: 0,
    diproses: 0,
    selesai: 0,
    topCategory: "",
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchUserDetail();
    fetchUserTickets();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUserDetail({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
    }
  };

  const fetchUserTickets = async () => {
    try {
      const ticketsQuery = query(
        collection(db, "tickets"),
        where("userId", "==", userId)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const tickets = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserTickets(tickets);
      calculateStatistics(tickets);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (tickets) => {
    const stats = {
      total: tickets.length,
      baru: tickets.filter((t) => t.status === "new").length,
      diproses: tickets.filter((t) => t.status === "in_progress").length,
      selesai: tickets.filter((t) => t.status === "done").length,
      topCategory: "",
    };

    // Hitung kategori yang paling banyak
    const categoryCount = {};
    tickets.forEach((ticket) => {
      if (ticket.category) {
        categoryCount[ticket.category] =
          (categoryCount[ticket.category] || 0) + 1;
      }
    });

    if (Object.keys(categoryCount).length > 0) {
      stats.topCategory = Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b
      );
    }
    setStatistics(stats);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      new: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      done: "bg-green-100 text-green-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: "bg-red-100 text-red-800",
      student: "bg-blue-100 text-blue-800",
    };
    return roleColors[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: "Admin",
      student: "Student",
    };
    return roleNames[role] || "Student";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/users")}
            className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Detail Pengguna</h1>
        </div>

        {/* User Info Card */}
        {userDetail && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Informasi Pengguna</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Nama:</strong>{" "}
                  {userDetail.name || userDetail.displayName || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {userDetail.email}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <strong>Role:</strong>{" "}
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(
                      userDetail.role
                    )}`}
                  >
                    {getRoleDisplayName(userDetail.role)}
                  </span>
                </p>
                <p>
                  <strong>Tanggal Registrasi:</strong>{" "}
                  {userDetail.createdAt
                    ?.toDate()
                    ?.toLocaleDateString("id-ID") || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Total Tiket</h3>
            <p className="text-3xl font-bold">{statistics.total}</p>
          </div>
          <div className="bg-yellow-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Tiket Baru</h3>
            <p className="text-3xl font-bold">{statistics.baru}</p>
          </div>
          <div className="bg-orange-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Diproses</h3>
            <p className="text-3xl font-bold">{statistics.diproses}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold">Selesai</h3>
            <p className="text-3xl font-bold">{statistics.selesai}</p>
          </div>
        </div>

        {/* Top Category */}
        {statistics.topCategory && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">
              Kategori Paling Banyak
            </h2>
            <p className="text-lg text-blue-600 font-medium">
              {statistics.topCategory}
            </p>
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Daftar Tiket</h2>
          {userTickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Tiket
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Judul
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Pembuatan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{ticket.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.judul || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.kategori || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.createdAt
                          ?.toDate()
                          ?.toLocaleDateString("id-ID") || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            navigate(`/app/tickets/${ticket.id}`, {
                              state: {
                                from: location.pathname, // Kembali ke user detail page
                                userRole: "admin",
                              },
                            });
                          }}
                          className="hover:scale-105 transition-all hover:shadow-xl duration-300 bg-blue-600 hover:bg-white hover:text-blue-600 hover:border-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium border border-blue-500"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Tidak ada tiket ditemukan
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
