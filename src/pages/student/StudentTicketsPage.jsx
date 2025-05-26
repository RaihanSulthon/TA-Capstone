// Apply the same truncation to StudentTicketsPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../../contexts/Authcontexts";
import { db } from "../../firebase-config";
import { collection, getDocs, query, orderBy, where, onSnapshot } from "firebase/firestore";
import Button from "../../components/forms/Button";
import Toast from "../../components/Toast";
import Modal from "../../components/Modal";
import { softDeleteTicket, getVisibleTickets } from "../../services/ticketService";
import ReadStatusFilter from "../../components/ReadStatusFilter";

const StudentTicketsPage = () => {
  const { currentUser, userRole } = useAuth();
  const { addListener } = useFirestoreListeners();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterReadStatus, setFilterReadStatus] = useState("all"); // New state for read/unread filter
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return { 
          className: "bg-blue-100 text-blue-800",
          label: "Menunggu" 
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
        // Remove the ticket from the local state
        setTickets(prevTickets => 
          prevTickets.filter(t => t.id !== ticketToDelete.id)
        );
        
        setToast({
          message: result.message || "Tiket berhasil dihapus",
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
  
  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (userRole !== "student" || !currentUser) {
        navigate("/access-denied");
        return;
      }
      
      try {
        // Fetch tickets created by this student
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        
        // Use onSnapshot instead of getDocs for real-time updates
        const unsubscribe = onSnapshot(ticketsQuery, async (snapshot) => {
          // Use getVisibleTickets to filter out hidden tickets
          const ticketList = await getVisibleTickets(snapshot, currentUser.uid);
          
          setTickets(ticketList);
          setLoading(false);
        }, (error) => {
          console.error("Error in tickets listener:", error);
          // Fall back to regular query if listener fails
          getDocs(ticketsQuery).then(async (snapshot) => {
            const ticketList = await getVisibleTickets(snapshot, currentUser.uid);
            
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
        
        // Register the listener for cleanup
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
  
  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    // Filter by status
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    
    // Filter by category
    const matchesCategory = filterCategory === "all" || ticket.kategori === filterCategory;
    
    // Filter by read status - this is the new filter
    let matchesReadStatus = true;
    if (filterReadStatus === "read") {
      matchesReadStatus = ticket.readByStudent === true;
    } else if (filterReadStatus === "unread") {
      matchesReadStatus = ticket.readByStudent !== true;
    }
    
    // Filter by search term
    const matchesSearch = 
      ticket.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesReadStatus && matchesSearch;
  });
    
  // Get ticket categories from data
  const categories = Array.from(new Set(tickets.map(ticket => ticket.kategori))).filter(Boolean);

  // Reset filters
  const resetFilters = () => {
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterReadStatus("all"); // Reset read status filter too
    setSearchTerm("");
  };
  
  // Get ticket statistics
  const ticketStats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === "new").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    done: tickets.filter(t => t.status === "done").length,
    unread: tickets.filter(t => t.readByStudent !== true).length // Add unread count
  };

  // Has unread feedback
  const hasUnreadFeedback = (ticket) => {
    if (!ticket.feedback || ticket.feedback.length === 0) return false;
    
    // If the ticket has feedback and the student hasn't read it
    // Check if there's any feedback from admin or disposisi
    // and if there is, check if the student has read it
    const hasNewFeedback = ticket.feedback.some(f => 
      (f.createdByRole === "admin" || f.createdByRole === "disposisi") && 
      !ticket.feedbackReadByStudent
    );
    
    return hasNewFeedback;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tiket Saya</h1>
        
        <Button
          onClick={() => navigate("/app/submit-ticket")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Buat Tiket Baru
        </Button>
      </div>
      
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
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-40 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Semua Status</option>
                <option value="new">Menunggu</option>
                <option value="in_progress">Diproses</option>
                <option value="done">Selesai</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                id="category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Add Read Status Filter */}
            <ReadStatusFilter 
              readStatus={filterReadStatus}
              setReadStatus={setFilterReadStatus}
              userRole={userRole}
            />
            
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Cari
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul atau deskripsi"
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats Summary with Unread count */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Tiket</p>
          <p className="text-2xl font-bold text-blue-600">{ticketStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Menunggu</p>
          <p className="text-2xl font-bold text-blue-600">{ticketStats.new}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Sedang Diproses</p>
          <p className="text-2xl font-bold text-yellow-600">{ticketStats.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Selesai</p>
          <p className="text-2xl font-bold text-green-600">{ticketStats.done}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Belum Dibaca</p>
          <p className="text-2xl font-bold text-purple-600">{ticketStats.unread}</p>
        </div>
      </div>
      
      {tickets.length === 0 && !loading ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Tiket</h3>
          <p className="text-gray-600 mb-6">
            Anda belum memiliki tiket saat ini. Buat tiket baru untuk melaporkan masalah atau pertanyaan.
          </p>
          <Button
            onClick={() => navigate("/app/submit-ticket")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Buat Tiket Baru
          </Button>
        </div>
      ) : (
        /* Tickets Table */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    ID & Judul
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Kategori
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Tanggal & Waktu
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Feedback
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Tidak ada tiket yang ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const statusBadge = getStatusBadge(ticket.status);
                    const hasFeedback = hasUnreadFeedback(ticket);
                    const isUnread = userRole === "student" ? !ticket.readByStudent : false;
                    
                    return (
                      <tr key={ticket.id} className={`hover:bg-gray-50 ${hasFeedback ? "bg-purple-50" : isUnread ? "bg-blue-50" : ""}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-xs text-gray-500 mb-1">#{ticket.id.substring(0, 8)}</div>
                            <div className="flex items-center">
                              {isUnread && (
                                <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-600 mr-2" 
                                      title="Belum dibaca"></span>
                              )}
                              <span className="text-sm font-medium text-gray-900 truncate max-w-xs" title={ticket.judul}>
                                {truncateText(ticket.judul, 30)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getCategoryLabel(ticket.kategori)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          {ticket.assignedToName && (
                            <div className="text-xs text-gray-500 mt-1 truncate max-w-[120px]" title={`Oleh: ${ticket.assignedToName}`}>
                              Oleh: {truncateText(ticket.assignedToName, 12)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm text-gray-900">
                              {formatDate(ticket.createdAt).date}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(ticket.createdAt).time}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ticket.feedback && ticket.feedback.length > 0 ? (
                            <div className="flex items-center">
                              <svg
                                className={`h-5 w-5 ${hasFeedback ? "text-purple-600" : "text-gray-400"}`}
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                              </svg>
                              <span className={`ml-1 text-sm ${hasFeedback ? "font-medium text-purple-600" : "text-gray-500"}`}>
                                {hasFeedback ? "Feedback baru" : `${ticket.feedback.length} feedback`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Belum ada</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => navigate(`/app/tickets/${ticket.id}`)}
                              className={hasFeedback ? "bg-purple-600 hover:bg-purple-700" : ""}
                            >
                              {hasFeedback ? "Lihat Feedback" : "Detail"}
                            </Button>
                            
                            <Button
                              onClick={() => openDeleteModal(ticket)}
                              className="bg-red-600 hover:bg-red-700"
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
      )}
      
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
          <p className="text-gray-600 mb-6">
            <span className="font-medium">Judul:</span> {ticketToDelete?.judul}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-red-600 rounded text-white bg-red-600 hover:bg-white hover:text-red-600 transition-colors duration-200"
              disabled={isDeleting}
            >
              Batal
            </button>
            <button
              onClick={handleDeleteTicket}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus Tiket"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentTicketsPage;