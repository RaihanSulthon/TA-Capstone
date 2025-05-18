// src/pages/TicketDetailPage.jsx - Dengan fitur preview lampiran/gambar yang diupload
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../contexts/AuthContexts";
import { db, storage } from "../firebase-config";
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
import { ref, getDownloadURL } from "firebase/storage";
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
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [disposisiStaff, setDisposisiStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingAttachment, setLoadingAttachment] = useState(false);

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

  // Menentukan jenis file dari URL
  const getFileType = (url) => {
    if (!url) return 'unknown';
    
    const extension = url.split('.').pop().toLowerCase();
    
    // File gambar
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    
    // File PDF
    if (extension === 'pdf') {
      return 'pdf';
    }
    
    // File dokumen
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      return 'document';
    }
    
    return 'unknown';
  };

  // Buka preview gambar
  const openImagePreview = (url) => {
    setPreviewUrl(url);
    setIsImagePreviewOpen(true);
  };

  // Tutup preview gambar
  const closeImagePreview = () => {
    setIsImagePreviewOpen(false);
    setPreviewUrl("");
  };

  // Ambil lampiran dari Firebase Storage
  const getAttachment = async (storagePath) => {
    if (!storagePath) return;
    
    try {
      setLoadingAttachment(true);
      const fileRef = ref(storage, storagePath);
      const url = await getDownloadURL(fileRef);
      
      // Perbarui ticket dengan URL
      if (ticket && !ticket.lampiranURL) {
        const ticketRef = doc(db, "tickets", ticketId);
        await updateDoc(ticketRef, {
          lampiranURL: url
        });
      }
      
      return url;
    } catch (error) {
      console.error("Error getting attachment:", error);
      return null;
    } finally {
      setLoadingAttachment(false);
    }
  };

  const markRelatedNotificationAsRead = async (ticketId) => {
    if(!currentUser) return;

    try{
      let notificationsQuery;

      if (userRole === "admin"){
        notificationsQuery = query(
          collection(db, "notifications"),
          where("ticketId", "==", ticketId),
          where("recipientRoles", "array-contains", "admin"),
          where("read", "==", false)
        );
      }else{
        notificationsQuery = query(
          collection(db, "notifications"),
          where("ticketId", "==", ticketId),
          where("recipientId", "==", currentUser.uid),
          where("read", "==", false)
        );
      }

      const notificationSnapshot = await getDocs(notificationsQuery);

      const updatePromises = notificationSnapshot.docs.map(docSnap => {
        const notificationRef = doc(db, "notifications", docSnap.id);
        return updateDoc(notificationRef, {read:true});
      });

      if(updatePromises.length > 0){
        await Promise.all(updatePromises);
        console.log(`Marked ${updatePromises.length} notifications as read`);
      }
    }catch(error){
      console.error("Error marking notifications as read:", error);
    }
  }

  // Fetch ticket data
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketRef = doc(db, "tickets", ticketId);
        
        // Use onSnapshot to keep the ticket data updated in real-time
        const unsubscribe = onSnapshot(ticketRef, async (docSnap) => {
          if (docSnap.exists()) {
            const ticketData = { id: docSnap.id, ...docSnap.data() };
            
            // Jika ada storagePath tapi tidak ada lampiranURL, dapatkan URL
            if (ticketData.lampiranStoragePath && !ticketData.lampiranURL) {
              const attachmentUrl = await getAttachment(ticketData.lampiranStoragePath);
              if (attachmentUrl) {
                ticketData.lampiranURL = attachmentUrl;
              }
            }
            setTicket(ticketData);
            markTicketAsRead(ticketData);
            markRelatedNotificationAsRead(ticketData.id);
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

  const markTicketAsRead = async (ticketData) =>{
    if(!currentUser) return;

    try{
      const ticketRef = doc(db, "tickets", ticketData.id);
      let updateField = {};

      if(userRole === "admin"){
        if(!ticketData.readByAdmin){
          updateField = {readByAdmin: true};
        }
      }else if(userRole === "disposisi"){
        if (ticketData.assignedTo === currentUser.uid && !ticketData.readByDisposisi) {
          updateField = { readByDisposisi: true };
        }
      }else if (userRole === "student"){
        if (ticketData.userId === currentUser.uid && !ticketData.readByStudent) {
          updateField = { readByStudent: true };
        }
      }
      if(Object.keys(updateField).length > 0){
        await updateDoc(ticketRef, updateField);
        console.log("Marked ticket as read for:", userRole);
      }
    }catch(error){
      console.error("Error marking ticket as read:", error);
    }
  }

  // Fetch disposisi staff for assignment
  useEffect(() => {
    const fetchDisposisiStaff = async () => {
      if (userRole !== "admin") return;
      
      try {
        setLoadingStaff(true);
        
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
        setLoadingStaff(false);
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
  const fileType = ticket.lampiranURL ? getFileType(ticket.lampiranURL) : 'unknown';
  console.log("Ticket data:", ticket);
  console.log("Lampiran URL:", ticket.lampiranURL);
  console.log("Lampiran Path:", ticket.lampiranStoragePath);
  console.log("Loading Attachment:", loadingAttachment);

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
          className="mr-3 rounded-full w-10 h-10 flex items-center justify-center border border-blue-300 text-blue-500 bg-white hover:bg-blue-500 hover:text-white transition-all duration-300"
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
          
          {/* Lampiran preview improved */}
          {(ticket.lampiranBase64 || ticket.lampiranURL || ticket.lampiranStoragePath || loadingAttachment) && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Lampiran</h3>
            
            {loadingAttachment ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="animate-spin h-4 w-4 border--fulrder-blue-500 rounded-full border-t-transparent"></div>
                <span>Memuat lampiran...</span>
              </div>
            ) : ticket.lampiranBase64 ? (
              <div className="border rounded-md p-4 bg-gray-50">
                {ticket.lampiranType && ticket.lampiranType.startsWith('image/') ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full h-48 bg-gray-200 rounded-md mb-2 overflow-hidden relative">
                      <img 
                        src={ticket.lampiranBase64} 
                        alt="Lampiran"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => openImagePreview(ticket.lampiranBase64)}
                      />
                      <div className="absolute bottom-0 right-0 p-2 bg-black bg-opacity-50 text-white rounded-tl-md text-xs">
                        Klik untuk memperbesar
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a 
                        href={ticket.lampiranBase64} 
                        download={ticket.lampiran || "lampiran"}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
                        </svg>
                        Download
                      </a>
                      <button
                        onClick={() => openImagePreview(ticket.lampiranBase64)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        Preview
                      </button>
                    </div>
                  </div>
                ) : ticket.lampiranType === 'application/pdf' ? (
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112.414 3H16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Dokumen PDF</span>
                    </div>
                    <div>
                      <a 
                        href={ticket.lampiranBase64} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                        download={ticket.lampiran || "document.pdf"}
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{ticket.lampiran || "Lampiran"}</span>
                    </div>
                    <a 
                      href={ticket.lampiranBase64} 
                      download={ticket.lampiran || "file"}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            ) : ticket.lampiranURL ? (
              <div className="border rounded-md p-4 bg-gray-50">
                {getFileType(ticket.lampiranURL) === 'image' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full h-48 bg-gray-200 rounded-md mb-2 overflow-hidden relative">
                      <img 
                        src={ticket.lampiranURL} 
                        alt="Lampiran"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => openImagePreview(ticket.lampiranURL)}
                      />
                      <div className="absolute bottom-0 right-0 p-2 bg-black bg-opacity-50 text-white rounded-tl-md text-xs">
                        Klik untuk memperbesar
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a 
                        href={ticket.lampiranURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                        </svg>
                        Buka di Tab Baru
                      </a>
                      <button
                        onClick={() => openImagePreview(ticket.lampiranURL)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        Preview
                      </button>
                    </div>
                  </div>
                ) : getFileType(ticket.lampiranURL) === 'pdf' ? (
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112.414 3H16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Dokumen PDF</span>
                    </div>
                    <div className="embed-responsive relative w-full h-64 mb-3">
                      <iframe 
                        src={`${ticket.lampiranURL}#view=FitH`} 
                        className="embed-responsive-item absolute w-full h-full border rounded"
                        title="PDF Preview"
                        sandbox="allow-scripts allow-same-origin"
                      ></iframe>
                    </div>
                    <div>
                      <a 
                        href={ticket.lampiranURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{ticket.lampiran || "Lampiran"}</span>
                    </div>
                    <a 
                      href={ticket.lampiranURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            ) : ticket.lampiranStoragePath ? (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Lampiran tidak dapat diakses. Coba refresh halaman atau hubungi admin.</span>
              </div>
            ): null}
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
            
            {/* Only admin and disposisi can give feedback */}
            {(userRole === "admin" || 
            (userRole === "disposisi" && ticket.assignedTo === currentUser.uid)) && (
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
      
      {/* Image Preview Modal */}
      <Modal
        isOpen={isImagePreviewOpen}
        onClose={closeImagePreview}
        title="Preview Gambar"
        size="xl"
      >
        <div className="flex justify-center">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
        <div className="flex justify-end mt-4 space-x-3">
          <a 
            href={previewUrl} 
            download={ticket?.lampiran || "image"}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
            </svg>
            Download
          </a>
          <button
            onClick={closeImagePreview}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-white hover:text-red-600 border border-red-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TicketDetailPage;