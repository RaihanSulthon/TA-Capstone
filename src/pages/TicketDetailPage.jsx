import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../contexts/Authcontexts";
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
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import Toast from "../components/Toast";
import Modal from "../components/Modal";
import Button from "../components/forms/Button";
import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from "../config/emailConfig";

const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const { addListener } = useFirestoreListeners();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [loadingAttachment, setLoadingAttachment] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: "",
    additionalMessage: ""
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

  // Token reveal states
  const [showToken, setShowToken] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenTimer, setTokenTimer] = useState(null);

  // Cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (tokenTimer) {
        clearTimeout(tokenTimer);
      }
    };
  }, [tokenTimer]);

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

  // Function to get display email based on user role and anonymous status
  const getDisplayEmail = () => {
    if (!ticket) return "N/A";
    
    // Admin can always see the email (from userEmail field)
    if (userRole === "admin") {
      return ticket.userEmail || ticket.email || "N/A";
    }
    
    // Student sees email only if not anonymous
    if (userRole === "student") {
      return ticket.anonymous ? "Tersembunyi (Mode Anonim)" : (ticket.email || "N/A");
    }
    
    return "N/A";
  };

  // Function to get display name based on user role and anonymous status
  const getDisplayName = () => {
    if (!ticket) return "N/A";
    
    // If anonymous, show different text based on user role
    if (ticket.anonymous) {
      if (userRole === "admin") {
        return "Anonymous User";
      } else {
        return "Anonim";
      }
    }
    
    // If not anonymous, show the name
    return ticket.nama || "N/A";
  };

  // Check if user can view ticket
  const canViewTicket = () => {
    if (!ticket || !currentUser) return false;
    
    // Admin can always view tickets
    if (userRole === "admin") return true;
    
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

  // Fetch feedback count for this ticket
  const fetchFeedbackCount = async () => {
    try {
      const feedbacksQuery = query(
        collection(db, "feedbacks"),
        where("ticketId", "==", ticketId)
      );
      
      const feedbacksSnapshot = await getDocs(feedbacksQuery);
      const totalCount = feedbacksSnapshot.size;
      
      // Count unread feedbacks for current user
      let unreadCount = 0;
      feedbacksSnapshot.docs.forEach(doc => {
        const feedback = doc.data();
        const readByCurrentUser = feedback.readBy && feedback.readBy[currentUser.uid];
        if (!readByCurrentUser && feedback.createdBy !== currentUser.uid) {
          unreadCount++;
        }
      });
      
      setFeedbackCount(totalCount);
      setUnreadFeedbackCount(unreadCount);
    } catch (error) {
      console.error("Error fetching feedback count:", error);
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
        
        // Register listener untuk cleanup
        addListener(unsubscribe);
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching ticket:", error);
        setError("Error fetching ticket data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId, addListener]);

  // Fetch feedback count when component mounts and when ticket changes
  useEffect(() => {
    if (ticketId && currentUser) {
      fetchFeedbackCount();
      
      // Listen for real-time feedback updates
      const feedbacksQuery = query(
        collection(db, "feedbacks"),
        where("ticketId", "==", ticketId)
      );
      
      const unsubscribe = onSnapshot(feedbacksQuery, () => {
        fetchFeedbackCount();
      });
      
      return () => unsubscribe();
    }
  }, [ticketId, currentUser]);

  const markTicketAsRead = async (ticketData) =>{
    if(!currentUser) return;

    try{
      const ticketRef = doc(db, "tickets", ticketData.id);
      let updateField = {};

      if(userRole === "admin"){
        if(!ticketData.readByAdmin){
          updateField = {readByAdmin: true};
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

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail.trim()) {
      setToast({
        message: "Silakan masukkan alamat email penerima",
        type: "error"
      });
      return;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.recipientEmail)) {
      setToast({
        message: "Format email tidak valid",
        type: "error"
      });
      return;
    }
    
    setIsSendingEmail(true);
    
    try {
      // Prepare email template parameters
      const templateParams = {
        to_email: emailData.recipientEmail,
        ticket_id: ticket.id.substring(0, 8),
        ticket_title: ticket.judul,
        category: getCategoryLabel(ticket.kategori, ticket.subKategori),
        sender_name: getDisplayName(),
        sender_email: getDisplayEmail(),
        status_label: getStatusBadge(ticket.status).label,
        status_class: getStatusClass(ticket.status),
        created_date: formatDate(ticket.createdAt),
        description: ticket.deskripsi,
        additional_message: emailData.additionalMessage || "Tidak ada pesan tambahan dari admin.",
        assigned_to: ticket.assignedToName || "Belum ditugaskan",
        
        // ATTACHMENT TANPA BASE64
        has_attachment: !!(ticket.lampiranBase64 || ticket.lampiranURL),
        attachment_name: ticket.lampiran || "Lampiran",
        attachment_url: ticket.lampiranURL || "",
        attachment_type: ticket.lampiranType?.includes('image') ? 'image' : ticket.lampiranType?.includes('pdf') ? 'pdf' : 'default',
        
        // SYSTEM LINKS
        ticket_detail_url: `${window.location.origin}/app/tickets/${ticket.id}`,
        system_url: window.location.origin
      };
      
      // Send email using EmailJS
      await emailjs.send(
        'service_2jo7enz', // Ganti dengan Service ID dari EmailJS
        'template_zvywepm', // Template ID
        templateParams,
        'YaROFPye1dmERQTS9' // Ganti dengan Public Key dari EmailJS
      );
      
      setToast({
        message: "Email berhasil dikirim",
        type: "success"
      });
      
      // Reset form and close modal
      setEmailData({ recipientEmail: "", additionalMessage: "" });
      setIsEmailModalOpen(false);
      
    } catch (error) {
      console.error("Error sending email:", error);
      setToast({
        message: "Gagal mengirim email. Silakan coba lagi.",
        type: "error"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Helper function untuk status class
  const getStatusClass = (status) => {
    switch (status) {
      case "new": return "status-new";
      case "in_progress": return "status-progress";
      case "done": return "status-done";
      default: return "status-new";
    }
  };

  // Handle go back
  const handleGoBack = () => {
    if (userRole === "admin") {
      // Admin should go back to ticket management
      navigate("/admin/tickets");
    } else if (userRole === "student") {
      // Student should go back to their tickets
      navigate("/app/my-tickets");
    } else {
      // Fallback to browser history
      navigate(-1);
    }
  };

  // Navigate to feedback page
  const handleViewFeedback = () => {
    navigate(`/app/tickets/${ticketId}/feedback`);
  };

  // Token reveal component
  const TokenRevealComponent = ({ ticket }) => {
    const passwordInputRef = useRef(null);

    useEffect(() => {
      if (showPasswordModal && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, [showPasswordModal]);
  
    const handleRevealToken = async () => {
    if (!password.trim()) {
      setToast({
        message: "Masukkan password Anda",
        type: "error"
      });
      return;
    }

    setIsVerifying(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      setShowToken(true);
      setShowPasswordModal(false);
      setPassword("");

      await updateDoc(doc(db, "tickets", ticket.id), {
        tokenViewCount: (ticket.tokenViewCount || 0) + 1,
        tokenLastViewed: serverTimestamp()
      });

      const timer = setTimeout(() => {
        setShowToken(false);
      }, 10000);
      setTokenTimer(timer);

      setToast({
        message: "Token berhasil ditampilkan. Token akan hilang dalam 10 detik.",
        type: "success"
      });
    } catch (error) {
      setToast({
        message: "Password salah. Silakan coba lagi.",
        type: "error"
      });
    }
    setIsVerifying(false);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(ticket.secretToken);
    setToast({
      message: "Token berhasil disalin. Jangan bagikan ke orang lain!",
      type: "success"
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-purple-800 mb-1">Token Rahasia</h4>
          <p className="text-xs text-purple-600 mb-2">
            Token ini diperlukan jika Anda ingin verifikasi tiket secara langsung dengan admin
          </p>
          <div className="flex items-center space-x-2">
            <code className="bg-white px-3 py-1 rounded border text-sm">
              {showToken ? ticket.secretToken : "********"}
            </code>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-purple-600 hover:text-purple-800 transition-colors"
              title="Lihat Token"
            >
              👁️
            </button>
            {showToken && (
              <button
                onClick={copyToken}
                className="text-purple-600 hover:text-purple-800 transition-colors text-sm"
                title="Salin Token"
              >
                📋
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassword("");
        }}
        title="Verifikasi Password"
        size="sm"
      >
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Masukkan password akun Anda untuk melihat token rahasia
          </p>
          <input
            ref={passwordInputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password akun Anda"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRevealToken();
            }}
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPassword("");
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              onClick={handleRevealToken}
              disabled={isVerifying}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isVerifying ? "Memverifikasi..." : "Tampilkan Token"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
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
  // Perbaiki perhitungan fileType - prioritaskan dari nama file
  const fileType = ticket.lampiran ? 
    getFileType(ticket.lampiran) : 
    (ticket.lampiranURL ? getFileType(ticket.lampiranURL) : 'unknown');

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
        {ticket.anonymous && (
          <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
            Laporan Anonim
          </span>
        )}
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
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pengirim</h3>
              <p className="mt-1 text-sm text-gray-900">{getDisplayName()}</p>
              {ticket.anonymous && userRole === "admin" && (
                <p className="text-xs text-purple-600 italic"></p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-sm text-gray-900">{getDisplayEmail()}</p>
              {ticket.anonymous && userRole === "admin" && (
                <p className="text-xs text-purple-600 italic"></p>
              )}
            </div>
            
            {/* Conditional fields - only show if not anonymous OR user is admin */}
            {(!ticket.anonymous || userRole === "admin") && (
              <>
                {ticket.nim && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">NIM</h3>
                    <p className="mt-1 text-sm text-gray-900">{ticket.nim}</p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic"></p>
                    )}
                  </div>
                )}
                
                {(ticket.prodi || ticket.semester) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Program Studi / Semester</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {`${ticket.prodi || "N/A"} / Semester ${ticket.semester || "N/A"}`}
                    </p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic"></p>
                    )}
                  </div>
                )}
                
                {ticket.noHp && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nomor HP</h3>
                    <p className="mt-1 text-sm text-gray-900">{ticket.noHp}</p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic"></p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Token Section for Admin - Anonymous Tickets */}
          {ticket.anonymous && ticket.secretToken && userRole === "admin" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Token Rahasia</h3>
                <div className="mt-1">
                  <code className="bg-yellow-100 px-2 py-1 rounded text-sm font-mono">
                    {ticket.secretToken}
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Untuk verifikasi ownership tiket anonymous
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Guide for Admin - Anonymous Tickets */}
          {ticket.anonymous && userRole === "admin" && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                📋 Panduan Verifikasi Tiket Anonymous
              </h4>
              <p className="text-sm text-yellow-700 mb-2">
                Jika mahasiswa datang untuk verifikasi tiket ini, minta mereka menyebutkan:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li><strong>ID Tiket:</strong> {ticket.id}</li>
                <li><strong>Judul:</strong> {ticket.judul}</li>
                <li><strong>NIM:</strong> {ticket.nim || "N/A"}</li>
                <li><strong>Token Rahasia:</strong> {ticket.secretToken}</li>
              </ul>
              <p className="text-xs text-yellow-600 mt-2">
                Semua data harus sesuai untuk memverifikasi ownership tiket
              </p>
            </div>
          )}
          
          {/* Show anonymous notice for students */}
          {ticket.anonymous && userRole === "student" && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-purple-800 text-sm">
                  <strong>Laporan Anonim:</strong> Identitas Anda tidak ditampilkan dalam laporan ini untuk menjaga privasi.
                </p>
              </div>
              
              {/* Token Section for Anonymous Tickets */}
              <div className="mt-4 pt-4 border-t border-purple-200">
                <TokenRevealComponent ticket={ticket} />
              </div>
            </div>
          )}
          
          {/* Ticket description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Deskripsi</h3>
            <div className="bg-gray-50 p-4 rounded-md text-gray-900 whitespace-pre-wrap">
              {ticket.deskripsi}
            </div>
          </div>
          
          {/* Lampiran preview */}
          {(ticket.lampiran && (ticket.lampiranBase64 || ticket.lampiranURL || ticket.lampiranStoragePath || loadingAttachment)) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Lampiran</h3>
              
              {loadingAttachment ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  <span>Memuat lampiran...</span>
                </div>
              ) : (ticket.lampiranBase64 || ticket.lampiranURL) ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  {fileType === 'image' ? (
                    <div>
                      <img 
                        src={ticket.lampiranBase64 || ticket.lampiranURL} 
                        alt="Lampiran" 
                        className="max-w-full h-64 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImagePreview(ticket.lampiranBase64 || ticket.lampiranURL)}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">{ticket.lampiran}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openImagePreview(ticket.lampiranBase64 || ticket.lampiranURL)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            👁️ Preview
                          </button>
                          <a 
                            href={ticket.lampiranBase64 || ticket.lampiranURL} 
                            download={ticket.lampiran}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                          >
                            📥 Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                      <div className="flex-shrink-0">
                        {fileType === 'pdf' ? (
                          <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 18h12V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        ) : (
                          <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{ticket.lampiran}</p>
                        <p className="text-xs text-gray-500">Klik untuk download</p>
                      </div>
                      <a 
                        href={ticket.lampiranBase64 || ticket.lampiranURL} 
                        download={ticket.lampiran}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                      >
                        📥 Download
                      </a>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="font-medium mb-4">Tindakan</h3>
          
          <div className="flex flex-wrap gap-3">
            {/* Feedback Button - Available for both admin and student */}
            <Button
              onClick={handleViewFeedback}
              className={`${
                unreadFeedbackCount > 0 
                  ? "bg-orange-600 text-white hover:bg-white hover:text-orange-600 border border-orange-600" 
                  : "bg-purple-600 text-white hover:bg-white hover:text-purple-600 border border-purple-600"
              } transition-colors duration-200`}
            >
              <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadFeedbackCount > 0 
                ? `Feedback Baru (${unreadFeedbackCount}/${feedbackCount})` 
                : `Lihat Feedback (${feedbackCount})`
              }
            </Button>

            {/* Admin-only actions */}
            {userRole === "admin" && (
              <>
                {/* POSISI 1 (KIRI): Button Tandai Diproses/Buka Kembali */}
                {ticket.status === "new" && (
                  <Button
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="bg-yellow-600 text-white hover:bg-white hover:text-yellow-600 border border-yellow-600 transition-colors duration-200"
                    disabled={isUpdatingStatus}
                  >
                    Tandai Diproses
                  </Button>
                )}
                
                {ticket.status === "done" && (
                  <Button
                    onClick={() => handleUpdateStatus("in_progress")}
                    className="bg-yellow-600 text-white hover:bg-white hover:text-yellow-600 border border-yellow-600 transition-colors duration-200"
                    disabled={isUpdatingStatus}
                  >
                    Buka Kembali
                  </Button>
                )}

                {/* POSISI 2 (TENGAH): Button Selesai */}
                {ticket.status !== "done" && (
                  <Button
                    onClick={() => handleUpdateStatus("done")}
                    className="bg-green-600 text-white hover:bg-white hover:text-green-600 border border-green-600 transition-colors duration-200"
                    disabled={isUpdatingStatus}
                  >
                    Selesai
                  </Button>
                )}

                {/* POSISI 3 (KANAN): Button Kirim Email */}
                <Button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="bg-indigo-600 text-white hover:bg-white hover:text-indigo-600 border border-indigo-600 transition-colors duration-200"
                >
                  <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Kirim Email
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Kirim Detail Tiket via Email"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Penerima <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={emailData.recipientEmail}
              onChange={(e) => setEmailData({...emailData, recipientEmail: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contoh@gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Pesan Tambahan (Opsional)
            </label>
            <textarea
              value={emailData.additionalMessage}
              onChange={(e) => setEmailData({...emailData, additionalMessage: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tambahkan pesan khusus untuk penerima email..."
            ></textarea>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-800 text-sm font-medium">Info:</p>
                <p className="text-blue-700 text-sm">
                  Email akan berisi detail lengkap tiket dengan format yang rapi seperti yang Anda lihat di sistem ini.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setIsEmailModalOpen(false)}
            className="bg-red-600 text-white hover:bg-white hover:text-red-600 border border-red-600 transition-colors duration-200"
            disabled={isSendingEmail}
          >
            Batal
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className={isSendingEmail ? "bg-gray-400 cursor-not-allowed" : ""}
          >
            {isSendingEmail ? "Mengirim..." : "Kirim Email"}
          </Button>
        </div>
      </Modal>
      
      {/* Image Preview Modal */}
      <Modal
        isOpen={isImagePreviewOpen}
        onClose={closeImagePreview}
        title="Preview Gambar"
        size="full"
      >
        <div className="flex flex-col items-center max-w-full">
          {/* Image Container with better sizing */}
          <div className="w-full bg-gray-100 rounded-lg p-4 mb-6">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-auto max-h-[60vh] object-contain rounded-lg shadow-lg mx-auto"
              style={{ minHeight: '300px' }}
            />
          </div>
          
          {/* File Info */}
          <div className="text-center mb-4">
            <p className="text-gray-600 text-sm">
              {ticket?.lampiran || "Gambar Lampiran"}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <a 
              href={previewUrl} 
              download={ticket?.lampiran || "image"}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
              </svg>
              Download Gambar
            </a>
            <button
              onClick={() => {
                // FIXED: Open image in new window/tab with proper HTML content
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                  newWindow.document.write(`
                    <html>
                      <head>
                        <title>${ticket?.lampiran || 'Preview Gambar'}</title>
                        <style>
                          body { 
                            margin: 0; 
                            padding: 20px;
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            background-color: #f3f4f6;
                            font-family: system-ui, -apple-system, sans-serif;
                          }
                          .container {
                            text-align: center;
                            max-width: 90vw;
                            max-height: 90vh;
                          }
                          img { 
                            max-width: 100%; 
                            max-height: 80vh; 
                            object-fit: contain;
                            border-radius: 8px;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                          }
                          .filename {
                            margin-top: 16px;
                            padding: 8px 16px;
                            background: white;
                            border-radius: 6px;
                            color: #374151;
                            font-size: 14px;
                            display: inline-block;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <img src="${previewUrl}" alt="${ticket?.lampiran || 'Preview'}" />
                          <div class="filename">${ticket?.lampiran || 'Gambar Lampiran'}</div>
                        </div>
                      </body>
                    </html>
                  `);
                  newWindow.document.close();
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Buka di Tab Baru
            </button>
            <button
              onClick={closeImagePreview}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-white hover:text-red-600 border border-red-600 transition-colors font-medium text-sm"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg> 
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketDetailPage;