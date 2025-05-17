// src/pages/TicketDetailPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../contexts/AuthContexts";
import { db } from "../firebase-config";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs 
} from "firebase/firestore";
import Toast from "../components/Toast";
import Modal from "../components/Modal";
import Button from "../components/forms/Button";


const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [disposisiStaff, setDisposisiStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false); // Added missing state variable

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return "N/A";
    } catch (e) {
      console.error("Error formatting date:", e);
      return "N/A";
    }
  };

  // Status badge color & label
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

  // Get category label
  const getCategoryLabel = (kategori, subKategori) => {
    const kategoriMap = {
      akademik: "Akademik",
      fasilitas: "Fasilitas",
      organisasi: "Organisasi Mahasiswa",
      ukm: "UKM",
      keuangan: "Keuangan",
      umum: "Pertanyaan Umum",
      lainnya: "Lainnya"
    };
    
    const subKategoriMap = {
      // Akademik
      perkuliahan: "Perkuliahan",
      nilai: "Nilai",
      dosen: "Dosen",
      jadwal: "Jadwal Kuliah",
      kurikulum: "Kurikulum",
      akademik_lainnya: "Lainnya",
      
      // Fasilitas
      ruang_kelas: "Ruang Kelas",
      laboratorium: "Laboratorium",
      perpustakaan: "Perpustakaan",
      toilet: "Toilet",
      parkir: "Area Parkir",
      wifi: "Koneksi Internet/WiFi",
      fasilitas_lainnya: "Lainnya",
      
      // Organisasi
      bem: "Badan Eksekutif Mahasiswa (BEM)",
      hima: "Himpunan Mahasiswa",
      dpm: "Dewan Perwakilan Mahasiswa",
      organisasi_lainnya: "Lainnya",
      
      // UKM
      olahraga: "UKM Olahraga",
      seni: "UKM Seni",
      penalaran: "UKM Penalaran",
      keagamaan: "UKM Keagamaan",
      ukm_lainnya: "Lainnya",
      
      // Keuangan
      pembayaran: "Pembayaran SPP/UKT",
      beasiswa: "Beasiswa",
      keuangan_lainnya: "Lainnya",
      
      // Umum
      informasi: "Informasi Umum",
      layanan: "Layanan Kampus",
      umum_lainnya: "Lainnya",
      
      // Lainnya
      lainnya: "Lainnya"
    };
    
    return `${kategoriMap[kategori] || kategori} - ${subKategoriMap[subKategori] || subKategori}`;
  };

  // Check if user can view ticket
  const canViewTicket = () => {
    if (!ticket || !currentUser) return false;
    
    // Admin can always view tickets
    if (userRole === "admin") return true;
    
    // Disposisi can view if assigned to them
    if (userRole === "disposisi" && ticket.assignedTo === currentUser.uid) return true;
    
    // Student can view if they created the ticket
    if (userRole === "student" && ticket.userId === currentUser.uid) return true;
    
    return false;
  };

  // Fetch ticket data
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketRef = doc(db, "tickets", ticketId);
        
        // Use onSnapshot to keep the ticket data updated in real-time
        const unsubscribe = onSnapshot(ticketRef, (docSnap) => {
          if (docSnap.exists()) {
            setTicket({ id: docSnap.id, ...docSnap.data() });
            setLoading(false);
          } else {
            setError("Ticket not found");
            setLoading(false);
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching ticket:", error);
        setError("Error fetching ticket data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId]);

  // Fetch disposisi staff for assignment
  useEffect(() => {
    const fetchDisposisiStaff = async () => {
      if (userRole !== "admin") return;
      
      try {
        setLoadingStaff(true); // Add loading state
        
        // Fetch actual disposisi staff from Firestore
        const staffQuery = query(
          collection(db, "users"),
          where("role", "==", "disposisi")
        );
        
        const staffSnapshot = await getDocs(staffQuery);
        const staffData = staffSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "No Name",
          email: doc.data().email,
          ...doc.data()
        }));
        
        console.log("Fetched disposisi staff:", staffData);
        setDisposisiStaff(staffData);
      } catch (error) {
        console.error("Error fetching disposisi staff:", error);
        // Fallback to empty array if there's an error
        setDisposisiStaff([]);
      } finally {
        setLoadingStaff(false); // Set loading to false when done
      }
    };
    
    fetchDisposisiStaff();
  }, [userRole]);

  // Handle assign ticket to disposisi staff
  const handleAssignTicket = async () => {
    if (!selectedStaff) {
      setToast({
        message: "Silakan pilih staff disposisi terlebih dahulu",
        type: "error"
      });
      return;
    }
    
    try {
      // Import notificationService
      const { notifyTicketAssignment } = await import("../services/notificationService");
      
      // Update ticket in Firestore
      const ticketRef = doc(db, "tickets", ticketId);
      
      // Find selected disposisi staff data
      const staff = disposisiStaff.find(s => s.id === selectedStaff);
      
      await updateDoc(ticketRef, {
        assignedTo: selectedStaff,
        assignedToName: staff?.name || "Unknown",
        assignedToEmail: staff?.email || "Unknown",
        status: "in_progress",
        updatedAt: serverTimestamp(),
        // Add assignment to history
        history: arrayUnion({
          action: "assigned",
          assignedBy: currentUser.uid,
          assignedByName: currentUser.displayName || currentUser.email,
          assignedTo: selectedStaff,
          assignedToName: staff?.name || "Unknown",
          timestamp: new Date()
        })
      });
      
      // Send notification to assigned disposisi staff
      await notifyTicketAssignment(
        ticket,
        selectedStaff,
        staff?.name || "Unknown",
        currentUser.uid,
        currentUser.displayName || currentUser.email
      );
      
      setToast({
        message: "Tiket berhasil didisposisikan",
        type: "success"
      });
      
      // Close modal
      setIsAssignModalOpen(false);
      
    } catch (error) {
      console.error("Error assigning ticket:", error);
      setToast({
        message: "Gagal mendisposisikan tiket. Silakan coba lagi.",
        type: "error"
      });
    }
  };

  // Handle update ticket status
  const handleUpdateStatus = async (newStatus) => {
    if (!ticket) return;
    
    setIsUpdatingStatus(true);
    
    try {
      // Import notificationService
      const { notifyStatusChange } = await import("../services/notificationService");
      
      // Update ticket in Firestore
      const ticketRef = doc(db, "tickets", ticketId);
      
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        // Add status update to history
        history: arrayUnion({
          action: "status_update",
          updatedBy: currentUser.uid,
          updatedByName: currentUser.displayName || currentUser.email,
          oldStatus: ticket.status,
          newStatus: newStatus,
          timestamp: new Date()
        })
      });
      
      // Send notification
      await notifyStatusChange(
        ticket,
        ticket.status,
        newStatus,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        userRole
      );
      
      setToast({
        message: "Status tiket berhasil diperbarui",
        type: "success"
      });
      
    } catch (error) {
      console.error("Error updating ticket status:", error);
      setToast({
        message: "Gagal memperbarui status tiket. Silakan coba lagi.",
        type: "error"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle send feedback
  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      setToast({
        message: "Silakan masukkan feedback terlebih dahulu",
        type: "error"
      });
      return;
    }
    
    try {
      // Import notificationService
      const { notifyNewFeedback } = await import("../services/notificationService");
      
      // Create feedback data
      const feedbackData = {
        text: feedback,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
        createdByRole: userRole,
        timestamp: new Date()
      };
      
      // Update ticket in Firestore
      const ticketRef = doc(db, "tickets", ticketId);
      
      await updateDoc(ticketRef, {
        // Add feedback to array
        feedback: arrayUnion(feedbackData),
        updatedAt: serverTimestamp()
      });
      
      // Send notification
      await notifyNewFeedback(
        ticket,
        feedbackData,
        currentUser.uid,
        currentUser.displayName || currentUser.email,
        userRole
      );
      
      setToast({
        message: "Feedback berhasil dikirim",
        type: "success"
      });
      
      // Reset form and close modal
      setFeedback("");
      setIsFeedbackModalOpen(false);
      
    } catch (error) {
      console.error("Error sending feedback:", error);
      setToast({
        message: "Gagal mengirim feedback. Silakan coba lagi.",
        type: "error"
      });
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Button
          onClick={handleGoBack}
          className="mt-4"
        >
          Kembali
        </Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Tiket tidak ditemukan</p>
        </div>
        <Button
          onClick={handleGoBack}
          className="mt-4"
        >
          Kembali
        </Button>
      </div>
    );
  }

  // Check if user can view this ticket
  if (!canViewTicket()) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Anda tidak memiliki akses untuk melihat tiket ini</p>
        </div>
        <Button
          onClick={handleGoBack}
          className="mt-4"
        >
          Kembali
        </Button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(ticket.status);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Toast notification */}
      {toast.message && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      )}
      
      {/* Back button and title in one line */}
      <div className="flex items-center mb-6">
        <button 
          onClick={handleGoBack}
          className="mr-3 rounded-full w-10 h-10 flex items-center justify-center border border-blue-300 text-blue-500 hover:bg-blue-50 transition-all duration-300"
          aria-label="Back"
        >
          <svg 
            className="h-5 w-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">{ticket.judul}</h1>
      </div>

      {/* Ticket info line */}
      <div className="mb-6">
        <div className="flex items-center text-gray-600 text-sm">
          <span>Ticket #{ticket.id.substring(0, 8)}</span>
          <span className="mx-2">•</span>
          <span>Dibuat pada {formatDate(ticket.createdAt)}</span>
          <span className="mx-2">•</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          {/* Ticket info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Kategori</h3>
              <p className="mt-1 text-sm text-gray-900">{getCategoryLabel(ticket.kategori, ticket.subKategori)}</p>
            </div>
            
            {!ticket.anonymous && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Pengirim</h3>
                  <p className="mt-1 text-sm text-gray-900">{ticket.nama || "Anonymous"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-sm text-gray-900">{ticket.email || "N/A"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">NIM</h3>
                  <p className="mt-1 text-sm text-gray-900">{ticket.nim || "N/A"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Program Studi / Semester</h3>
                  <p className="mt-1 text-sm text-gray-900">{`${ticket.prodi || "N/A"} / Semester ${ticket.semester || "N/A"}`}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nomor HP</h3>
                  <p className="mt-1 text-sm text-gray-900">{ticket.noHp || "N/A"}</p>
                </div>
              </>
            )}
            
            {ticket.anonymous && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Pengirim</h3>
                <p className="mt-1 text-sm text-gray-900">Anonymous</p>
              </div>
            )}
            
            {ticket.assignedTo && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Didisposisikan Kepada</h3>
                <p className="mt-1 text-sm text-gray-900">{ticket.assignedToName || "Unknown"} ({ticket.assignedToEmail || "Unknown"})</p>
              </div>
            )}
          </div>
          
          {/* Ticket description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Deskripsi</h3>
            <div className="bg-gray-50 p-4 rounded-md text-gray-900 whitespace-pre-wrap">
              {ticket.deskripsi}
            </div>
          </div>
          
          {/* Attachment if exists */}
          {ticket.lampiranURL && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Lampiran</h3>
              <a 
                href={ticket.lampiranURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
                Lihat Lampiran
              </a>
            </div>
          )}
          
          {/* Feedback / Communication section */}
          {ticket.feedback && ticket.feedback.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Feedback</h3>
              <div className="border rounded-md">
                {ticket.feedback.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 ${index < ticket.feedback.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="flex items-start mb-2">
                      <div className="bg-gray-100 rounded-full p-2 mr-3">
                        <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{item.createdByName || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{formatDate(item.timestamp)}</p>
                        </div>
                        <p className="text-sm text-gray-600">{item.createdByRole === "admin" ? "Admin" : item.createdByRole === "disposisi" ? "Disposisi" : "Mahasiswa"}</p>
                      </div>
                    </div>
                    <div className="pl-9 text-sm text-gray-700">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="font-medium mb-4">Tindakan</h3>
          
          <div className="flex flex-wrap gap-3">
            {/* Admin can assign tickets to disposisi staff */}
            {userRole === "admin" && ticket.status === "new" && (
              <Button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Disposisi ke Staff
              </Button>
            )}
            
            {/* Admin and Disposisi can change status */}
            {(userRole === "admin" || (userRole === "disposisi" && ticket.assignedTo === currentUser.uid)) && (
              <>
                {ticket.status === "new" && (
                  <Button
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="bg-yellow-500 hover:bg-yellow-600"
                    disabled={isUpdatingStatus}
                  >
                    Tandai Diproses
                  </Button>
                )}
                
                {ticket.status === "in_progress" && (
                  <Button
                    onClick={() => handleUpdateStatus("done")}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isUpdatingStatus}
                  >
                    Tandai Selesai
                  </Button>
                )}
                
                {ticket.status === "done" && (
                  <Button
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="bg-yellow-500 hover:bg-yellow-600"
                    disabled={isUpdatingStatus}
                  >
                    Buka Kembali
                  </Button>
                )}
              </>
            )}
            
            {/* Admin and Disposisi can give feedback */}
            {(userRole === "admin" || (userRole === "disposisi" && ticket.assignedTo === currentUser.uid)) && (
              <Button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Berikan Feedback
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Assign Ticket Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Disposisi Tiket ke Staff"
        size="md"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Pilih Staff Disposisi
          </label>
          
          {loadingStaff ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            disposisiStaff.length > 0 ? (
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Staff Disposisi --</option>
                {disposisiStaff.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || staff.email} ({staff.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-2 text-yellow-600">
                Tidak ada staff disposisi yang tersedia. Silakan tambahkan pengguna dengan role disposisi terlebih dahulu.
              </div>
            )
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setIsAssignModalOpen(false)}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Batal
          </Button>
          <Button
            onClick={handleAssignTicket}
            disabled={!selectedStaff || loadingStaff}
          >
            Disposisi
          </Button>
        </div>
      </Modal>
      
      {/* Feedback Modal */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Berikan Feedback"
        size="md"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tulis feedback Anda di sini..."
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setIsFeedbackModalOpen(false)}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Batal
          </Button>
          <Button
            onClick={handleSendFeedback}
          >
            Kirim
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TicketDetailPage;