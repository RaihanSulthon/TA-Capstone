import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../../contexts/Authcontexts";
import { db } from "../../firebase-config";
import { collection, getDocs, query, orderBy, where, onSnapshot } from "firebase/firestore";
import Button from "../../components/forms/Button";
import Toast from "../../components/Toast";
import Modal from "../../components/Modal";
import { softDeleteTicket } from "../../services/ticketService";
import ReadStatusFilter from "../../components/ReadStatusFilter";

const TicketManagementPage = () => {
  const { currentUser, userRole } = useAuth();
  const { addListener } = useFirestoreListeners();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterReadStatus, setFilterReadStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackCounts, setFeedbackCounts] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return { 
          className: "bg-blue-100 text-blue-800",
          label: "Baru" 
        };
      case "in_progress":
        return { 
          className: "bg-yellow-100 text-yellow-800",
          label: "Diproses" 
        };
      case "done":
        return { 
          className: "bg-green-100 text-green-800",
          label: "Selesai" 
        };
      default:
        return { 
          className: "bg-gray-100 text-gray-800",
          label: "Tidak Diketahui" 
        };
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return { date: "N/A", time: "" };
    
    try {
      let date;
      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return { date: "N/A", time: "" };
      }
      
      // Format date and time separately
      const formattedDate = date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const formattedTime = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return {
        date: formattedDate,
        time: formattedTime
      };
    } catch (e) {
      console.error("Error formatting date:", e);
      return { date: "N/A", time: "" };
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
      lainnya: "Lainnya"
    };
    
    return kategoriMap[kategori] || kategori;
  };

  // Fetch feedback counts for all tickets
  const fetchFeedbackCounts = async () => {
    try {
      const feedbacksQuery = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const feedbacksSnapshot = await getDocs(feedbacksQuery);
      
      const counts = {};
      
      feedbacksSnapshot.docs.forEach(doc => {
        const feedback = doc.data();
        const ticketId = feedback.ticketId;
        
        if (!counts[ticketId]) {
          counts[ticketId] = {
            total: 0,
            unreadByAdmin: 0,
            unreadByStudent: 0
          };
        }
        
        counts[ticketId].total++;
        
        // Count unread for admin
        const readByAdmin = feedback.readBy && feedback.readBy[currentUser?.uid];
        if (!readByAdmin && feedback.createdBy !== currentUser?.uid && userRole === "admin") {
          counts[ticketId].unreadByAdmin++;
        }
      });
      
      setFeedbackCounts(counts);
    } catch (error) {
      console.error("Error fetching feedback counts:", error);
    }
  };

  // Get feedback info for a ticket
  const getFeedbackInfo = (ticketId) => {
    const counts = feedbackCounts[ticketId] || { total: 0, unreadByAdmin: 0, unreadByStudent: 0 };
    return {
      total: counts.total,
      unread: userRole === "admin" ? counts.unreadByAdmin : counts.unreadByStudent
    };
  };
  
  // Delete ticket handlers
  const openDeleteModal = (ticket) => {
    setTicketToDelete(ticket);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTicketToDelete(null);
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete || !currentUser) return;
    
    try {
      setIsDeleting(true);
      
      const result = await softDeleteTicket(
        ticketToDelete.id, 
        currentUser.uid,
        userRole
      );
      
      if (result.success) {
        setTickets(prevTickets => 
          prevTickets.filter(t => t.id !== ticketToDelete.id)
        );
        
        setToast({
          message: result.message || "Tiket berhasil dihapus secara permanen",
          type: "success"
        });
      } else {
        setToast({
          message: result.error || "Gagal menghapus tiket",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      setToast({
        message: "Gagal menghapus tiket. Silakan coba lagi nanti.",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };
  
  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (userRole !== "admin") {
        navigate("/access-denied");
        return;
      }
      
      try {
        let ticketsQuery;
        
        ticketsQuery = query(
          collection(db, "tickets"),
          orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(ticketsQuery, async (snapshot) => {
          const ticketList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setTickets(ticketList);
          setLoading(false);
        }, (error) => {
          console.error("Error in tickets listener:", error);
          getDocs(ticketsQuery).then((querySnapshot) => {
            const ticketList = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setTickets(ticketList);
            setLoading(false);
          }).catch(err => {
            console.error("Fallback error:", err);
            setToast({
              message: "Gagal mengambil data tiket. Silakan coba lagi nanti.",
              type: "error"
            });
            setLoading(false);
          });
        });
        
        addListener(unsubscribe);
        
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setToast({
          message: "Gagal mengambil data tiket. Silakan coba lagi nanti.",
          type: "error"
        });
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, [currentUser, userRole, navigate, addListener]);

  // Fetch feedback counts when component mounts and when tickets change
  useEffect(() => {
    if (currentUser && userRole === "admin") {
      fetchFeedbackCounts();
      
      const feedbacksQuery = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(feedbacksQuery, () => {
        fetchFeedbackCounts();
      });
      
      addListener(unsubscribe);
    }
  }, [currentUser, userRole, addListener]);
  
  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    // Filter by status
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    
    // Filter by category
    const matchesCategory = filterCategory === "all" || ticket.kategori === filterCategory;
    
    // Filter by read status
    let matchesReadStatus = true;
    if (filterReadStatus === "read") {
      matchesReadStatus = ticket.readByStudent === true;
    } else if (filterReadStatus === "unread") {
      matchesReadStatus = ticket.readByStudent !== true;
    }
    
    // Filter by date range
    let matchesDateRange = true;
    if (startDate || endDate) {
      const ticketDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && ticketDate >= start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && ticketDate <= end;
      }
    }
    
    // Filter by search term
    const matchesSearch = 
    ticket.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesReadStatus && matchesSearch && matchesDateRange;
  });
  
  // Get ticket categories from data
  const categories = Array.from(new Set(tickets.map(ticket => ticket.kategori))).filter(Boolean);

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterReadStatus("all");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };
  
  // Get ticket statistics
  const ticketStats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === "new").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    done: tickets.filter(t => t.status === "done").length,
    unread: tickets.filter(t => t.readByAdmin !== true).length,
    withFeedback: Object.keys(feedbackCounts).length,
    totalFeedbacks: Object.values(feedbackCounts).reduce((total, count) => total + count.total, 0)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Ticket Management</h1>
      
      {/* Toast notification */}
      {toast.message && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      )}
      
      {/* Filters and Search - IMPROVED LAYOUT */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="new">Baru</option>
              <option value="in_progress">Diproses</option>
              <option value="done">Selesai</option>
            </select>
          </div>

          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="read-status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status Dibaca
            </label>
            <select
              id="read-status-filter"
              value={filterReadStatus}
              onChange={(e) => setFilterReadStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Tiket</option>
              <option value="read">Sudah Dibaca</option>
              <option value="unread">Belum Dibaca</option>
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Cari
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul, ID, atau nama"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Reset Button - Separate Row */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            Reset Filter
          </button>
        </div>
      </div>
      
      {/* Enhanced Stats Summary - IMPROVED GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-xs text-gray-500 mb-1">Total Tiket</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{ticketStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-xs text-gray-500 mb-1">Tiket Baru</p>
          <p className="text-xl md:text-2xl font-bold text-blue-600">{ticketStats.new}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-xs text-gray-500 mb-1">Sedang Diproses</p>
          <p className="text-xl md:text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-xs text-gray-500 mb-1">Selesai</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">{ticketStats.done}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-xs text-gray-500 mb-1">Belum Dibaca</p>
          <p className="text-xl md:text-2xl font-bold text-purple-600">{ticketStats.unread}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-xs text-gray-500 mb-1">Tiket Dengan Feedback</p>
          <p className="text-xl md:text-2xl font-bold text-indigo-600">{ticketStats.withFeedback}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-xs text-gray-500 mb-1">Total Feedback</p>
          <p className="text-xl md:text-2xl font-bold text-indigo-600">{ticketStats.totalFeedbacks}</p>
        </div>
      </div>
      
      {/* Tickets Table - IMPROVED RESPONSIVE DESIGN */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID & Judul
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengirim
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    Tidak ada tiket yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.status);
                  const isUnread = userRole === "admin" && !ticket.readByAdmin;
                  const feedbackInfo = getFeedbackInfo(ticket.id);
                  
                  return (
                    <tr key={ticket.id} className={`hover:bg-gray-50 transition-colors ${isUnread ? "bg-blue-50" : ""}`}>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 font-mono">#{ticket.id.substring(0, 8)}</span>
                            {isUnread && (
                              <span className="inline-block h-2 w-2 rounded-full bg-blue-600" title="Belum dibaca"></span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 leading-tight" title={ticket.judul}>
                            {truncateText(ticket.judul, 40)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900" title={ticket.anonymous ? "Anonymous" : ticket.nama || "Unknown"}>
                          {ticket.anonymous ? "Anonymous" : truncateText(ticket.nama || "Unknown", 20)}
                        </div>
                        {((userRole === "admin" && (ticket.userEmail || ticket.email)) || 
                          (!ticket.anonymous && ticket.email)) && (
                          <div className="text-xs text-gray-500 truncate" style={{maxWidth: '150px'}} title={userRole === "admin" ? (ticket.userEmail || ticket.email) : ticket.email}>
                            {truncateText(userRole === "admin" ? (ticket.userEmail || ticket.email) : ticket.email, 25)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {getCategoryLabel(ticket.kategori)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        {ticket.assignedToName && (
                          <div className="text-xs text-gray-500 mt-1" title={`Staff: ${ticket.assignedToName}`}>
                            Staff: {truncateText(ticket.assignedToName, 15)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(ticket.createdAt).date}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(ticket.createdAt).time}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {feedbackInfo.total > 0 ? (
                          <div className="flex items-center gap-1">
                            <svg
                              className={`h-4 w-4 ${feedbackInfo.unread > 0 ? "text-orange-600" : "text-purple-600"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className={`text-xs whitespace-nowrap ${feedbackInfo.unread > 0 ? "font-medium text-orange-600" : "text-purple-600"}`}>
                              {feedbackInfo.unread > 0 
                                ? `${feedbackInfo.unread} Feedback` 
                                : `${feedbackInfo.total} Feedback`
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Tidak ada</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                        <Button
                          onClick={() => navigate(`/app/tickets/${ticket.id}`)}
                          className={isUnread ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 transition-colors duration-200"}
                        >
                          {isUnread ? "Lihat Tiket Baru" : "Detail"}
                        </Button>
                          
                        <Button
                          onClick={() => openDeleteModal(ticket)}
                          className="bg-red-600 text-white hover:bg-white hover:text-red-600 border border-red-600 transition-colors duration-200"
                        >
                          Hapus
                        </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Konfirmasi Hapus Tiket"
        size="sm"
      >
        <div>
          <p className="text-gray-600 mb-4">
            Apakah Anda yakin ingin menghapus tiket ini?
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-medium">Judul:</span> {ticketToDelete?.judul}
          </p>
          <p className="text-red-600 text-sm mb-6">
            <strong>Perhatian:</strong> Tindakan ini akan menghapus tiket secara permanen bagi semua pengguna termasuk mahasiswa.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={isDeleting}
            >
              Batal
            </button>
            <button
              onClick={handleDeleteTicket}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus Permanen"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketManagementPage;