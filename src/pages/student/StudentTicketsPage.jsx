import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../../contexts/Authcontexts";
import { db } from "../../firebase-config";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
} from "firebase/firestore";
import Button from "../../components/forms/Button";
import Toast from "../../components/Toast";
import Modal from "../../components/Modal";
import {
  softDeleteTicket,
  getVisibleTickets,
} from "../../services/ticketService";
import ReadStatusFilter from "../../components/ReadStatusFilter";

const StudentTicketsPage = () => {
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 25) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Get status badge
  const getStatusBadge = (status) => {
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
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return { date: "N/A", time: "" };

    try {
      let date;
      if (typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else {
        return { date: "N/A", time: "" };
      }

      // Format date and time separately
      const formattedDate = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const formattedTime = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        date: formattedDate,
        time: formattedTime,
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
      lainnya: "Lainnya",
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
        setTickets((prevTickets) =>
          prevTickets.filter((t) => t.id !== ticketToDelete.id)
        );

        setToast({
          message: result.message || "Tiket berhasil dihapus dari daftar Anda",
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Gagal menghapus tiket",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      setToast({
        message: "Gagal menghapus tiket. Silakan coba lagi nanti.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  // Fetch feedback counts for all tickets
  const fetchFeedbackCounts = async () => {
    try {
      if (tickets.length === 0) {
        setFeedbackCounts({});
        return;
      }

      const userTicketIds = tickets.map((ticket) => ticket.id);
      const counts = {};

      userTicketIds.forEach((ticketId) => {
        counts[ticketId] = {
          total: 0,
          unreadByStudent: 0,
        };
      });

      const feedbacksQuery = query(
        collection(db, "feedbacks"),
        where("ticketId", "in", userTicketIds.slice(0, 10)),
        orderBy("createdAt", "desc")
      );

      const feedbacsSnapshot = await getDocs(feedbacksQuery);

      feedbacsSnapshot.docs.forEach((doc) => {
        const feedback = doc.data();
        const ticketId = feedback.ticketId;

        if (counts[ticketId]) {
          counts[ticketId].total++;

          const readByStudent =
            feedback.readBy && feedback.readBy[currentUser?.uid];
          if (
            !readByStudent &&
            feedback.createdBy !== currentUser?.uid &&
            userRole === "student"
          ) {
            counts[ticketId].unreadByStudent++;
          }
        }
      });

      if (userTicketIds.length > 10) {
        for (let i = 10; i < userTicketIds.length; i += 10) {
          const batch = userTicketIds.slice(i, i + 10);
          const batchQuery = query(
            collection(db, "feedbacks"),
            where("ticketId", "in", batch),
            orderBy("createdAt", "desc")
          );

          const batchSnapshot = await getDocs(batchQuery);

          batchSnapshot.docs.forEach((doc) => {
            const feedback = doc.data();
            const ticketId = feedback.ticketId;

            if (counts[ticketId]) {
              counts[ticketId].total++;

              const readByStudent =
                feedback.readBy && feedback.readBy[currentUser?.uid];
              if (
                !readByStudent &&
                feedback.createdBy !== currentUser?.uid &&
                userRole === "student"
              ) {
                counts[ticketId].unreadByStudent++;
              }
            }
          });
        }
      }
      setFeedbackCounts(counts);
    } catch (error) {
      console.error("Error fetching feedback counts:", error);
    }
  };

  // Get feedback info for a ticket
  const getFeedbackInfo = (ticketId) => {
    const counts = feedbackCounts[ticketId] || { total: 0, unreadByStudent: 0 };
    return {
      total: counts.total,
      unread: counts.unreadByStudent,
    };
  };

  // Fetch feedback counts when component mounts and when tickets change
  useEffect(() => {
    if (currentUser && userRole === "student" && tickets.length > 0) {
      fetchFeedbackCounts();

      // Listen for real-time feedback updates hanya untuk tiket user
      const userTicketIds = tickets.map((ticket) => ticket.id);

      if (userTicketIds.length > 0) {
        // Karena onSnapshot juga punya batasan where-in 10 items, kita gunakan approach yang sama
        const feedbacksQuery = query(
          collection(db, "feedbacks"),
          where("ticketId", "in", userTicketIds.slice(0, 10)),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(feedbacksQuery, () => {
          fetchFeedbackCounts();
        });

        // Register the listener for cleanup
        addListener(unsubscribe);
      }
    }
  }, [currentUser, userRole, tickets, addListener]);

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
        const unsubscribe = onSnapshot(
          ticketsQuery,
          async (snapshot) => {
            // Use getVisibleTickets to filter out hidden tickets
            const ticketList = await getVisibleTickets(
              snapshot,
              currentUser.uid
            );

            setTickets(ticketList);
            setLoading(false);
          },
          (error) => {
            console.error("Error in tickets listener:", error);
            // Fall back to regular query if listener fails
            getDocs(ticketsQuery)
              .then(async (snapshot) => {
                const ticketList = await getVisibleTickets(
                  snapshot,
                  currentUser.uid
                );

                setTickets(ticketList);
                setLoading(false);
              })
              .catch((err) => {
                console.error("Fallback error:", err);
                setToast({
                  message:
                    "Gagal mengambil data tiket. Silakan coba lagi nanti.",
                  type: "error",
                });
                setLoading(false);
              });
          }
        );

        // Register the listener for cleanup
        addListener(unsubscribe);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        setToast({
          message: "Gagal mengambil data tiket. Silakan coba lagi nanti.",
          type: "error",
        });
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentUser, userRole, navigate, addListener]);

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Filter by status
    const matchesStatus =
      filterStatus === "all" || ticket.status === filterStatus;

    // Filter by category
    const matchesCategory =
      filterCategory === "all" || ticket.kategori === filterCategory;

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
      const ticketDate = ticket.createdAt?.toDate
        ? ticket.createdAt.toDate()
        : new Date(ticket.createdAt);

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

    return (
      matchesStatus &&
      matchesCategory &&
      matchesReadStatus &&
      matchesSearch &&
      matchesDateRange
    );
  });

  // Get ticket categories from data
  const categories = Array.from(
    new Set(tickets.map((ticket) => ticket.kategori))
  ).filter(Boolean);

  // Pagination logic
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
    new: tickets.filter((t) => t.status === "new").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    done: tickets.filter((t) => t.status === "done").length,
    unread: tickets.filter((t) => t.readByStudent !== true).length,
    withFeedback: Object.keys(feedbackCounts).filter(
      (ticketId) => feedbackCounts[ticketId].total > 0
    ).length,
    totalFeedbacks: Object.values(feedbackCounts).reduce(
      (total, count) => total + count.total,
      0
    ),
  };

  // Has unread feedback
  const hasUnreadFeedback = (ticket) => {
    if (!ticket.feedback || ticket.feedback.length === 0) return false;

    // If the ticket has feedback and the student hasn't read it
    // and if there is, check if the student has read it
    const hasNewFeedback = ticket.feedback.some(
      (f) => f.createdByRole === "admin" && !ticket.feedbackReadByStudent
    );

    return hasNewFeedback;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 overflow-x-hidden w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold truncate">Tiket Saya</h1>
        </div>

        <div className="flex-shrink-0">
          <Button
            onClick={() => navigate("/app/submit-ticket")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-white hover:text-blue-600 border-1 border-blue-600 px-4 py-2 text-sm hover:scale-105 hover:shadow-xl transition-all duration-300">
            Buat Tiket Baru
          </Button>
        </div>
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
      <div className="bg-white p-3 md:p-6 rounded-lg shadow-md mb-4 md:mb-6 overflow-hidden w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-4 items-end">
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">Semua Status</option>
              <option value="new">Menunggu</option>
              <option value="in_progress">Sedang Diproses</option>
              <option value="done">Selesai</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="category-filter"
              className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="start-date"
              className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="read-status-filter"
              className="block text-sm font-medium text-gray-700 mb-2">
              Status Dibaca
            </label>
            <select
              id="read-status-filter"
              value={filterReadStatus}
              onChange={(e) => setFilterReadStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="all">Semua Tiket</option>
              <option value="read">Sudah Dibaca</option>
              <option value="unread">Belum Dibaca</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2">
              Cari
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul atau ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Reset Button - Separate Row */}
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            onClick={resetFilters}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-all duration-300 hover:scale-105 hover:shadow-xl font-semibold">
            Reset Filter
          </button>
        </div>
      </div>

      {/* Enhanced Stats Summary with Feedback Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-6 md:mb-8 px-1">
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md min-w-0">
          <p className="text-xs md:text-sm text-gray-500 truncate">
            Total Tiket
          </p>
          <p className="text-lg md:text-2xl font-bold text-blue-600">
            {ticketStats.total}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
          <p className="text-xs md:text-sm text-gray-500">Menunggu</p>
          <p className="text-lg md:text-2xl font-bold text-blue-600">
            {ticketStats.new}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
          <p className="text-xs md:text-sm text-gray-500">Sedang Diproses</p>
          <p className="text-lg md:text-2xl font-bold text-yellow-600">
            {ticketStats.inProgress}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
          <p className="text-xs md:text-sm text-gray-500">Selesai</p>
          <p className="text-lg md:text-2xl font-bold text-green-600">
            {ticketStats.done}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
          <p className="text-xs md:text-sm text-gray-500">Belum Dibaca</p>
          <p className="text-lg md:text-2xl font-bold text-purple-600">
            {ticketStats.unread}
          </p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-md">
          <p className="text-xs md:text-sm text-gray-500">Total Feedback</p>
          <p className="text-lg md:text-2xl font-bold text-orange-600">
            {ticketStats.totalFeedbacks}
          </p>
        </div>
      </div>

      {tickets.length === 0 && !loading ? (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md text-center">
          <svg
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum Ada Tiket
          </h3>
          <p className="text-gray-600 mb-6">
            Anda belum memiliki tiket saat ini. Buat tiket baru untuk melaporkan
            masalah atau pertanyaan.
          </p>
          <Button
            onClick={() => navigate("/app/submit-ticket")}
            className="bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300">
            Buat Tiket Baru
          </Button>
        </div>
      ) : (
        /* Tickets Table */
        <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-full">
          {/* Mobile Card Layout */}
          <div className="block md:hidden">
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </div>
              ) : currentTickets.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada tiket yang ditemukan
                </div>
              ) : (
                currentTickets.map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.status);
                  const hasFeedback = hasUnreadFeedback(ticket);
                  const isUnread =
                    userRole === "student" ? !ticket.readByStudent : false;
                  const feedbackInfo = getFeedbackInfo(ticket.id);

                  return (
                    <div
                      key={ticket.id}
                      className={`p-3 ${
                        hasFeedback
                          ? "bg-purple-50"
                          : isUnread
                          ? "bg-blue-50"
                          : ""
                      } overflow-hidden`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center mb-1">
                            {isUnread && (
                              <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-600 mr-2"></span>
                            )}
                            <span className="text-xs text-gray-500 truncate">
                              #{ticket.id.substring(0, 8)}
                            </span>
                          </div>
                          <h3 className="font-medium text-gray-900 text-sm leading-tight break-words">
                            {ticket.judul}
                          </h3>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Kategori:</span>
                          <div
                            className="font-medium truncate"
                            title={getCategoryLabel(ticket.kategori)}>
                            {getCategoryLabel(ticket.kategori)}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-500 block">Tanggal:</span>
                          <div className="font-medium truncate">
                            {formatDate(ticket.createdAt).date}
                          </div>
                        </div>
                      </div>

                      {/* Feedback Info */}
                      {feedbackInfo.total > 0 && (
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              feedbackInfo.unread > 0
                                ? "bg-orange-100 text-orange-800"
                                : "bg-purple-100 text-purple-800"
                            }`}>
                            💬 {feedbackInfo.total} feedback
                            {feedbackInfo.unread > 0
                              ? ` (${feedbackInfo.unread} baru)`
                              : ""}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 w-full">
                        <Button
                          onClick={() => navigate(`/app/tickets/${ticket.id}`)}
                          className="flex-1 bg-blue-600 text-white hover:bg-blue-700 text-xs py-2 px-3 min-w-0 hover:scale-105 hover:shadow-xl transition-all duration-300">
                          Detail
                        </Button>
                        <Button
                          onClick={() => openDeleteModal(ticket)}
                          className="bg-red-600 text-white hover:bg-red-700 text-xs py-2 px-3 flex-shrink-0 hover:scale-105 hover:shadow-xl transition-all duration-300">
                          Hapus
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    ID & Judul
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Kategori
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Tanggal & Waktu
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Feedback
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                ) : currentTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500">
                      Tidak ada tiket yang ditemukan
                    </td>
                  </tr>
                ) : (
                  currentTickets.map((ticket) => {
                    const statusBadge = getStatusBadge(ticket.status);
                    const hasFeedback = hasUnreadFeedback(ticket);
                    const isUnread =
                      userRole === "student" ? !ticket.readByStudent : false;

                    return (
                      <tr
                        key={ticket.id}
                        className={`hover:bg-gray-50 ${
                          hasFeedback
                            ? "bg-purple-50"
                            : isUnread
                            ? "bg-blue-50"
                            : ""
                        }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-xs text-gray-500 mb-1">
                              #{ticket.id.substring(0, 8)}
                            </div>
                            <div className="flex items-center">
                              {isUnread && (
                                <span
                                  className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-600 mr-2"
                                  title="Belum dibaca"></span>
                              )}
                              <span
                                className="text-sm font-medium text-gray-900 truncate max-w-xs"
                                title={ticket.judul}>
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
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          {ticket.assignedToName && (
                            <div
                              className="text-xs text-gray-500 mt-1 truncate max-w-[120px]"
                              title={`Oleh: ${ticket.assignedToName}`}>
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
                          {(() => {
                            const feedbackInfo = getFeedbackInfo(ticket.id);
                            return feedbackInfo.total > 0 ? (
                              <div className="flex items-center">
                                <svg
                                  className={`h-5 w-5 ${
                                    feedbackInfo.unread > 0
                                      ? "text-orange-600"
                                      : "text-purple-600"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span
                                  className={`ml-1 text-sm ${
                                    feedbackInfo.unread > 0
                                      ? "font-medium text-orange-600"
                                      : "text-purple-600"
                                  }`}>
                                  {feedbackInfo.unread > 0
                                    ? `${feedbackInfo.unread} feedback baru`
                                    : `${feedbackInfo.total} feedback`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                Tidak ada
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() =>
                                navigate(`/app/tickets/${ticket.id}`)
                              }
                              className={(() => {
                                const feedbackInfo = getFeedbackInfo(ticket.id);
                                if (feedbackInfo.unread > 0) {
                                  return "bg-orange-600 hover:bg-orange-700 hover:scale-105 hover:shadow-xl transition-all duration-300";
                                } else if (isUnread) {
                                  return "bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300";
                                } else {
                                  return "hover:scale-105 hover:shadow-xl transition-all duration-300";
                                }
                              })()}>
                              {(() => {
                                const feedbackInfo = getFeedbackInfo(ticket.id);
                                if (feedbackInfo.unread > 0) {
                                  return "Feedback Baru";
                                } else if (isUnread) {
                                  return "Lihat Tiket Baru";
                                } else {
                                  return "Detail";
                                }
                              })()}
                            </Button>
                            <Button
                              onClick={() => openDeleteModal(ticket)}
                              className="bg-red-600 text-white hover:bg-red-700 hover:scale-105 hover:shadow-xl transition-all duration-300">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              {/* Mobile Pagination */}
              <div className="flex items-center justify-between md:hidden">
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
                    <span className="font-medium">
                      {indexOfFirstTicket + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastTicket, filteredTickets.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredTickets.length}
                    </span>{" "}
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
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}>
                          {pageNumber}
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
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true">
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
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Konfirmasi Hapus Tiket"
        size="sm">
        <div>
          <p className="text-gray-600 mb-4">
            Apakah Anda yakin ingin menghapus tiket ini dari daftar Anda?
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-medium">Judul:</span> {ticketToDelete?.judul}
          </p>
          <p className="text-blue-600 text-sm mb-6">
            <strong>Catatan:</strong> Tiket akan dihapus dari daftar Anda, namun
            masih dapat diakses oleh admin.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={isDeleting}>
              Batal
            </button>
            <button
              onClick={handleDeleteTicket}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded transition-colors"
              disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus dari Daftar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentTicketsPage;
