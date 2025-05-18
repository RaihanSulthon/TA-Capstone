// src/pages/admin/TicketManagementPage.jsx - Updated with listener cleanup
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../../contexts/AuthContexts";
import { db } from "../../firebase-config";
import { collection, getDocs, query, orderBy, where, onSnapshot } from "firebase/firestore";
import Button from "../../components/forms/Button";
import Toast from "../../components/Toast";

const TicketManagementPage = () => {
  const { currentUser, userRole } = useAuth();
  const { addListener } = useFirestoreListeners();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  
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
        minute: '2-digit',
        second: '2-digit'
      });
      
      return {
        date: formattedDate,
        time: `Pukul ${formattedTime}`
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
  
  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (userRole !== "admin") {
        navigate("/access-denied");
        return;
      }
      
      try {
        let ticketsQuery;
        
        // Admin can see all tickets
        ticketsQuery = query(
          collection(db, "tickets"),
          orderBy("createdAt", "desc")
        );
        
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
          const ticketList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setTickets(ticketList);
          setLoading(false);
        }, (error) => {
          console.error("Error in tickets listener:", error);
          // Fallback to one-time get if listener fails
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
    
    // Filter by search term
    const matchesSearch = 
      ticket.judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.nama && ticket.nama.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesCategory && matchesSearch;
  });
  
  // Get ticket categories from data
  const categories = Array.from(new Set(tickets.map(ticket => ticket.kategori))).filter(Boolean);

  // Reset filters
  const resetFilters = () => {
    setFilterStatus("all");
    setFilterCategory("all");
    setSearchTerm("");
  };
  
  // Get ticket statistics
  const ticketStats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === "new").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    done: tickets.filter(t => t.status === "done").length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Manajemen Tiket</h1>
      
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
                <option value="new">Baru</option>
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
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Tiket</p>
          <p className="text-2xl font-bold text-blue-600">{ticketStats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Tiket Baru</p>
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
      </div>
      
      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID & Judul
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengirim
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal & Waktu
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
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-xs text-gray-500 mb-1">#{ticket.id.substring(0, 8)}</div>
                          <div className="text-sm font-medium text-gray-900">{ticket.judul}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ticket.anonymous ? "Anonymous" : ticket.nama || "Unknown"}
                        </div>
                        {!ticket.anonymous && ticket.email && (
                          <div className="text-xs text-gray-500">{ticket.email}</div>
                        )}
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
                          <div className="text-xs text-gray-500 mt-1">
                            Staff: {ticket.assignedToName}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => navigate(`/app/tickets/${ticket.id}`)}
                          className="mr-2"
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TicketManagementPage;