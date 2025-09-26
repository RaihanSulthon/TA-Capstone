import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  getDocs,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import Toast from "../components/Toast";
import Modal from "../components/Modal";
import Button from "../components/forms/Button";
import emailjs from "@emailjs/browser";
import { EMAIL_CONFIG } from "../config/emailConfig";
import { notifyStatusChange } from "../services/notificationService";

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
    additionalMessage: "",
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

  // Token reveal states (untuk mahasiswa)
  const [showToken, setShowToken] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenTimer, setTokenTimer] = useState(null);
  const location = useLocation();

  // Helper functions
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";

    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Unknown";

    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (kategori, subKategori) => {
    const kategoriMap = {
      akademik: "Akademik",
      fasilitas: "Fasilitas",
      organisasi: "Organisasi Mahasiswa",
      ukm: "UKM",
      keuangan: "Keuangan",
      umum: "Pertanyaan Umum",
      lainnya: "Lainnya",
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
      lainnya: "Lainnya",
    };

    return `${kategoriMap[kategori] || kategori} - ${
      subKategoriMap[subKategori] || subKategori
    }`;
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

  // Function to get display email based on user role and anonymous status
  const getDisplayEmail = () => {
    if (!ticket) return "N/A";

    // Always show email regardless of anonymous status
    return ticket.userEmail || ticket.email || "N/A";
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      new: {
        label: "Baru",
        className: "bg-blue-100 text-blue-800",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
      },
      in_progress: {
        label: "Sedang Diproses",
        className: "bg-yellow-100 text-yellow-800",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
      },
      done: {
        label: "Selesai",
        className: "bg-green-100 text-green-800",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
      },
    };
    return statusMap[status] || statusMap["new"];
  };

  const getFileType = (filename) => {
    if (!filename) return "unknown";
    const extension = filename.split(".").pop()?.toLowerCase();

    const imageTypes = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const docTypes = ["pdf", "doc", "docx"];
    const spreadsheetTypes = ["xls", "xlsx"];
    const textTypes = ["txt"];

    if (imageTypes.includes(extension)) return "image";
    if (docTypes.includes(extension)) return "document";
    if (spreadsheetTypes.includes(extension)) return "spreadsheet";
    if (textTypes.includes(extension)) return "text";

    return "unknown";
  };

  const getAttachment = async (storagePath) => {
    try {
      setLoadingAttachment(true);
      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);
      setLoadingAttachment(false);
      return url;
    } catch (error) {
      console.error("Error getting attachment:", error);
      setLoadingAttachment(false);
      return null;
    }
  };

  const handleGoBack = () => {

    // 1. Prioritas pertama: gunakan state 'from' jika ada
    if (location.state?.from) {
      console.log("Navigating to state.from:", location.state.from);
      navigate(location.state.from);
      return;
    }

    // 2. Cek document referrer untuk menentukan asal halaman
    const referrer = document.referrer;
    console.log("Document referrer:", referrer);

    // 3. Logika berdasarkan user role dan context
    if (userRole === "admin") {
      // Admin selalu ke ticket management, kecuali ada context khusus
      if (
        referrer.includes("/admin/users") ||
        referrer.includes("/admin/user-detail")
      ) {
        // Jika dari user management/detail, kembali ke users
        navigate("/admin/users");
      } else {
        // Default admin ke ticket management
        navigate("/admin/tickets");
      }
    } else if (userRole === "student") {
      // Student ke halaman tiket mereka
      navigate("/app/my-tickets");
    } else {
      // Fallback ke dashboard
      navigate("/app/dashboard");
    }
  };

  const handleImagePreview = () => {
    const imageUrl = ticket.lampiranBase64 || ticket.lampiranURL;
    if (imageUrl) {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${ticket?.lampiran || "Preview Gambar"}</title>
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
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <img src="${imageUrl}" alt="${ticket?.lampiran || "Preview"}" />
                <div class="filename">${ticket?.lampiran || "attachment"}</div>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const handleFileDownload = () => {
    const fileUrl = ticket.lampiranBase64 || ticket.lampiranURL;
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = ticket.lampiran || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);

    try {
      const oldStatus = ticket.status; // Simpan status lama

      console.log("=== DEBUG STATUS UPDATE ===");
      console.log("Old Status:", oldStatus);
      console.log("New Status:", newStatus);
      console.log("Ticket data:", ticket);
      console.log("Current user:", currentUser);
      console.log("User role:", userRole);

      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        statusUpdatedBy: currentUser.uid,
        statusUpdatedAt: serverTimestamp(),
      });

      // Send notification for status change - dengan parameter yang benar
      const notificationResult = await notifyStatusChange(
        ticket,
        oldStatus, // status lama
        newStatus, // status baru
        currentUser.uid,
        currentUser.displayName || currentUser.email?.split("@")[0] || "Admin",
        "admin" // role dalam huruf kecil
      );

      setToast({
        message: `Status tiket berhasil diperbarui menjadi ${
          getStatusBadge(newStatus).label
        }`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      setToast({
        message: "Gagal memperbarui status tiket. Silakan coba lagi.",
        type: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail.trim()) {
      setToast({
        message: "Silakan masukkan alamat email penerima",
        type: "error",
      });
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.recipientEmail)) {
      setToast({
        message: "Format email tidak valid",
        type: "error",
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
        created_date: formatDate(ticket.createdAt),
        description: ticket.deskripsi,
        additional_message:
          emailData.additionalMessage || "Tidak ada pesan tambahan dari admin.",

        // ATTACHMENT TANPA BASE64
        has_attachment: !!(ticket.lampiranBase64 || ticket.lampiranURL),
        attachment_name: ticket.lampiran || "Lampiran",
        attachment_url: ticket.lampiranURL || "",
        attachment_type: ticket.lampiranType?.includes("image")
          ? "image"
          : ticket.lampiranType?.includes("pdf")
          ? "pdf"
          : "default",

        // SYSTEM LINKS
        ticket_detail_url: `${window.location.origin}/app/tickets/${ticket.id}`,
        system_url: window.location.origin,
      };

      // Send email using EmailJS
      await emailjs.send(
        "service_2jo7enz", // Ganti dengan Service ID dari EmailJS
        "template_zvywepm", // Template ID
        templateParams,
        "YaROFPYe1dmERQTS9" // Ganti dengan Public Key dari EmailJS
      );

      setToast({
        message: "Email berhasil dikirim",
        type: "success",
      });

      // Reset form and close modal
      setEmailData({ recipientEmail: "", additionalMessage: "" });
      setIsEmailModalOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      setToast({
        message: "Gagal mengirim email. Silakan coba lagi.",
        type: "error",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Token functions untuk mahasiswa
  const handleRevealToken = async () => {
    if (!password.trim()) {
      setToast({
        message: "Masukkan password Anda",
        type: "error",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      await reauthenticateWithCredential(currentUser, credential);

      setShowToken(true);
      setShowPasswordModal(false);
      setPassword("");

      await updateDoc(doc(db, "tickets", ticket.id), {
        tokenViewCount: (ticket.tokenViewCount || 0) + 1,
        tokenLastViewed: serverTimestamp(),
      });

      const timer = setTimeout(() => {
        setShowToken(false);
      }, 10000);
      setTokenTimer(timer);

      setToast({
        message:
          "Token berhasil ditampilkan. Token akan hilang dalam 10 detik.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "Password salah. Silakan coba lagi.",
        type: "error",
      });
    }
    setIsVerifying(false);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(ticket.secretToken);
    setToast({
      message: "Token berhasil disalin. Jangan bagikan ke orang lain!",
      type: "success",
    });
  };

  // Mark notifications as read
  const markRelatedNotificationAsRead = async (ticketId) => {
    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("ticketId", "==", ticketId),
        where("recipientId", "==", currentUser.uid),
        where("read", "==", false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = [];

      querySnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            read: true,
            readAt: serverTimestamp(),
          })
        );
      });

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Marked ${updatePromises.length} notifications as read`);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Mark feedbacks as read
  const markFeedbacksAsRead = async () => {
    try {
      if (unreadFeedbackCount === 0) return;

      const feedbackRef = collection(db, "feedbacks");
      const q = query(feedbackRef, where("ticketId", "==", ticket.id));
      const snapshot = await getDocs(q);

      const updatePromises = [];
      snapshot.docs.forEach((doc) => {
        const feedback = doc.data();
        // Hanya update feedback yang belum dibaca dan bukan milik user sendiri
        if (
          feedback.createdBy !== currentUser.uid &&
          (!feedback.readBy || !feedback.readBy[currentUser.uid])
        ) {
          updatePromises.push(
            updateDoc(doc.ref, {
              [`readBy.${currentUser.uid}`]: serverTimestamp(),
            })
          );
        }
      });

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Marked ${updatePromises.length} feedbacks as read`);
      }
    } catch (error) {
      console.error("Error marking feedbacks as read:", error);
    }
  };

  // Handle view feedback - PERBAIKAN
  const handleViewFeedback = async () => {
    try {
      // Mark semua unread feedback sebagai read sebelum navigate
      await markFeedbacksAsRead();

      // PERBAIKAN: Navigate dengan state yang lebih lengkap
      const currentFrom =
        location.state?.from ||
        (userRole === "admin" ? "/admin/tickets" : "/app/my-tickets");

      navigate(`/app/tickets/${ticket.id}/feedback`, {
        state: {
          from: location.pathname, // Current ticket detail page
          originalFrom: currentFrom, // Where user originally came from
          ticketData: {
            id: ticket.id,
            judul: ticket.judul,
            status: ticket.status,
          },
        },
      });
    } catch (error) {
      console.error("Error navigating to feedback:", error);
      setToast({
        message: "Gagal membuka halaman feedback",
        type: "error",
      });
    }
  };

  const markTicketAsRead = async (ticketData) => {
    try {
      const ticketRef = doc(db, "tickets", ticketData.id);
      const updates = {};

      if (userRole === "admin" && !ticketData.readByAdmin) {
        updates.readByAdmin = true;
        updates.readByAdminAt = serverTimestamp();
      } else if (userRole === "student" && !ticketData.readByStudent) {
        updates.readByStudent = true;
        updates.readByStudentAt = serverTimestamp();
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(ticketRef, updates);
      }
    } catch (error) {
      console.error("Error marking ticket as read:", error);
    }
  };

  // Fetch feedback count - PERBAIKAN: real-time listener
  useEffect(() => {
    if (!ticket) return;

    const fetchFeedbackCount = async () => {
      try {
        const feedbackRef = collection(db, "feedbacks");
        const q = query(feedbackRef, where("ticketId", "==", ticket.id));

        // Use real-time listener instead of one-time fetch
        const unsubscribeFeedback = onSnapshot(q, (snapshot) => {
          const feedbacks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFeedbackCount(feedbacks.length);

          // Count unread feedback dengan logika yang benar
          const unreadCount = feedbacks.filter((feedback) => {
            // Jangan hitung feedback yang dibuat oleh user sendiri
            if (feedback.createdBy === currentUser.uid) return false;

            // Cek apakah sudah dibaca oleh user saat ini
            const readByCurrentUser =
              feedback.readBy && feedback.readBy[currentUser.uid];
            return !readByCurrentUser;
          }).length;

          setUnreadFeedbackCount(unreadCount);
        });

        addListener(unsubscribeFeedback);

        return () => unsubscribeFeedback();
      } catch (error) {
        console.error("Error fetching feedback count:", error);
      }
    };

    fetchFeedbackCount();
  }, [ticket, userRole, addListener, currentUser]);

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
              const attachmentUrl = await getAttachment(
                ticketData.lampiranStoragePath
              );
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

    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, addListener, currentUser.uid, userRole]);

  useEffect(() => {
    // Cleanup function
    return () => {
      // Clear any pending operations
      setIsUpdatingStatus(false);
      setLoadingAttachment(false);
      setIsSendingEmail(false);

      // Clear timers
      if (tokenTimer) {
        clearTimeout(tokenTimer);
      }
    };
  }, [tokenTimer]);

  // Check if user can view ticket
  const canViewTicket = () => {
    if (!ticket || !currentUser) return false;

    // Admin can always view tickets
    if (userRole === "admin") return true;

    // Student can view if they created the ticket
    if (userRole === "student" && ticket.userId === currentUser.uid)
      return true;

    return false;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Kembali
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No ticket found
  if (!ticket) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tiket Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-6">
            Tiket yang Anda cari tidak ada atau telah dihapus.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Check access
  if (!canViewTicket()) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 mb-6">
            Anda tidak memiliki akses untuk melihat tiket ini.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(ticket.status);
  const fileType = ticket.lampiran
    ? getFileType(ticket.lampiran)
    : ticket.lampiranURL
    ? getFileType(ticket.lampiranURL)
    : "unknown";

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
      {/* Toast notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "success" })}
        />
      )}

      {/* Back button and title - Mobile Responsive */}
      <div className="flex items-center mb-4 md:mb-6">
        <button
          onClick={handleGoBack}
          className="mr-2 md:mr-3 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border border-blue-300 text-blue-500 bg-white hover:bg-blue-500 hover:text-white hover:scale-105 transition-all duration-300 flex-shrink-0"
          aria-label="Back"
        >
          <svg
            className="h-4 w-4 md:h-5 md:w-5"
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

        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-2xl font-bold leading-tight break-words">
            {ticket.judul}
          </h1>
        </div>
      </div>

      {/* Ticket info line - Mobile Responsive */}
      <div className="mb-4 md:mb-6">
        {/* Mobile Layout - Improved with Anonim badge di bawah */}
        <div className="block md:hidden space-y-2">
          {/* ID Ticket dan Status Badge sejajar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Ticket #{ticket.id.substring(0, 8)}
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>

          {/* Tanggal dan Laporan Anonim badge sejajar */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Dibuat pada {formatDate(ticket.createdAt)}
            </div>
            {ticket.anonymous && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Laporan Anonim
              </span>
            )}
          </div>
        </div>

        {/* Desktop Layout - Horizontal with Anonim badge */}
        <div className="hidden md:flex items-center text-gray-600 text-sm">
          <span>Ticket #{ticket.id.substring(0, 8)}</span>
          <span className="mx-2">•</span>
          <span>Dibuat pada {formatDate(ticket.createdAt)}</span>
          <span className="mx-2">•</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
          {ticket.anonymous && (
            <>
              <span className="mx-2">•</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Laporan Anonim
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 md:p-6">
          {/* Mobile Layout - Single Column with better spacing */}
          <div className="block md:hidden space-y-4 mb-6">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Kategori
              </h3>
              <p className="mt-1 text-sm text-gray-900 break-words">
                {getCategoryLabel(ticket.kategori, ticket.subKategori)}
              </p>
            </div>

            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pengirim
              </h3>
              <p className="mt-1 text-sm text-gray-900 break-words">
                {getDisplayName()}
              </p>
              {ticket.anonymous && userRole === "admin" && (
                <p className="text-xs text-purple-600 italic">Laporan Anonim</p>
              )}
            </div>

            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </h3>
              <p className="mt-1 text-sm text-gray-900 break-all">
                {getDisplayEmail()}
              </p>
            </div>

            {/* Conditional fields - only show if not anonymous OR user is admin */}
            {(!ticket.anonymous || userRole === "admin") && (
              <>
                {ticket.nim && (
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      NIM
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">{ticket.nim}</p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic">
                        Laporan Anonim
                      </p>
                    )}
                  </div>
                )}

                {(ticket.prodi || ticket.semester) && (
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Program Studi / Semester
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {`${ticket.prodi || "N/A"} / Semester ${
                        ticket.semester || "N/A"
                      }`}
                    </p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic">
                        Laporan Anonim
                      </p>
                    )}
                  </div>
                )}

                {ticket.noHp && (
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Nomor HP
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">{ticket.noHp}</p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic">
                        Laporan Anonim
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Deskripsi
              </h3>
              <div className="mt-2 text-sm text-gray-900 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">
                {ticket.deskripsi}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Keep existing grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Kategori</h3>
              <p className="mt-1 text-sm text-gray-900">
                {getCategoryLabel(ticket.kategori, ticket.subKategori)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Pengirim</h3>
              <p className="mt-1 text-sm text-gray-900">{getDisplayName()}</p>
              {ticket.anonymous && userRole === "admin" && (
                <p className="text-xs text-purple-600 italic">Laporan Anonim</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-sm text-gray-900">{getDisplayEmail()}</p>
              {ticket.anonymous && userRole === "admin" && (
                <p className="text-xs text-purple-600 italic">Laporan Anonim</p>
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
                      <p className="text-xs text-purple-600 italic">
                        Laporan Anonim
                      </p>
                    )}
                  </div>
                )}

                {(ticket.prodi || ticket.semester) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Program Studi / Semester
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {`${ticket.prodi || "N/A"} / Semester ${
                        ticket.semester || "N/A"
                      }`}
                    </p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic">
                        Laporan Anonim
                      </p>
                    )}
                  </div>
                )}

                {ticket.noHp && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Nomor HP
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">{ticket.noHp}</p>
                    {ticket.anonymous && userRole === "admin" && (
                      <p className="text-xs text-purple-600 italic">
                        Laporan Anonim
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Ticket description */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Deskripsi
              </h3>
              <div className="bg-gray-50 p-4 rounded-md text-gray-900 whitespace-pre-wrap">
                {ticket.deskripsi}
              </div>
            </div>
          </div>

          {/* Token Section for Admin - Anonymous Tickets */}
          {ticket.anonymous && ticket.secretToken && userRole === "admin" && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                📋 Panduan Verifikasi Tiket Anonymous
              </h4>
              <p className="text-sm text-yellow-700 mb-2">
                Jika mahasiswa datang untuk verifikasi tiket ini, minta mereka
                menyebutkan:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>
                  <strong>ID Tiket:</strong> {ticket.id}
                </li>
                <li>
                  <strong>Judul:</strong> {ticket.judul}
                </li>
                <li>
                  <strong>NIM:</strong> {ticket.nim || "N/A"}
                </li>
                <li>
                  <strong>Token Rahasia:</strong> {ticket.secretToken}
                </li>
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
                <svg
                  className="h-5 w-5 text-purple-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-purple-800 text-sm">
                  <strong>Laporan Anonim:</strong> Identitas Anda tidak
                  ditampilkan dalam laporan ini untuk menjaga privasi.
                </p>
              </div>

              {/* Token Section for Anonymous Tickets - Student View */}
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-purple-800 mb-1">
                      Token Rahasia
                    </h4>
                    <p className="text-xs text-purple-600 mb-2">
                      Token ini diperlukan jika Anda ingin verifikasi tiket
                      secara langsung dengan admin
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <code className="bg-white px-3 py-1 rounded border text-sm font-mono break-all">
                        {showToken ? ticket.secretToken : "••••••••••••••••"}
                      </code>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowPasswordModal(true)}
                          className="text-purple-600 hover:text-purple-800 transition-all text-sm px-2 py-1 bg-purple-100 rounded hover:bg-purple-200 hover:scale-105 hover:shadow-xl duration-300"
                          title="Lihat Token"
                        >
                          👁️ Lihat
                        </button>
                        {showToken && (
                          <button
                            onClick={copyToken}
                            className="text-purple-600 hover:text-purple-800 transition-colors text-sm px-2 py-1 bg-purple-100 rounded hover:bg-purple-200"
                            title="Salin Token"
                          >
                            📋 Salin
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lampiran preview */}
          {ticket.lampiran &&
            (ticket.lampiranBase64 ||
              ticket.lampiranURL ||
              ticket.lampiranStoragePath ||
              loadingAttachment) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Lampiran
                </h3>

                {loadingAttachment ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    <span>Memuat lampiran...</span>
                  </div>
                ) : ticket.lampiranBase64 || ticket.lampiranURL ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {fileType === "image" ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img
                            src={ticket.lampiranBase64 || ticket.lampiranURL}
                            alt={ticket.lampiran}
                            className="max-w-full h-auto max-h-64 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={handleImagePreview}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 rounded transition-opacity cursor-pointer">
                            <span className="text-white text-sm font-medium">
                              🔍 Klik untuk memperbesar
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={handleImagePreview}
                            className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded border-1 border-blue-600 transition-all hover:text-blue-600 hover:scale-105 font-semibold hover:shadow-xl duration-300 hover:bg-white text-sm"
                          >
                            🔍 Preview
                          </button>
                          <button
                            onClick={handleFileDownload}
                            className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded  border-1 border-green-600 hover:text-green-600 transition-all hover:scale-105 font-semibold hover:shadow-xl duration-300 hover:bg-white text-sm"
                          >
                            📥 Download
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                        <div className="flex-shrink-0">
                          {fileType === "document"
                            ? "📄"
                            : fileType === "spreadsheet"
                            ? "📊"
                            : fileType === "text"
                            ? "📝"
                            : "📎"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ticket.lampiran}
                          </p>
                          <p className="text-xs text-gray-500">
                            {fileType === "document"
                              ? "Dokumen"
                              : fileType === "spreadsheet"
                              ? "Spreadsheet"
                              : fileType === "text"
                              ? "File Teks"
                              : "File"}
                          </p>
                        </div>
                        <button
                          onClick={handleFileDownload}
                          className="flex-shrink-0 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          📥 Download
                        </button>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Nama file:</strong> {ticket.lampiran}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Lampiran sedang dimuat atau tidak tersedia
                  </div>
                )}
              </div>
            )}

          {/* PERBAIKAN: Action buttons for admin - Responsive yang benar */}
          {userRole === "admin" && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Tindakan
              </h3>

              {/* Mobile Layout - Stack buttons vertically */}
              <div className="block md:hidden space-y-2 w-full">
                <Button
                  onClick={handleViewFeedback}
                  className={`w-full text-white text-sm py-2.5 px-4 justify-center hover:scale-105 transition-all duration-300 ${
                    unreadFeedbackCount > 0
                      ? "bg-orange-600 hover:bg-orange-700 hover:scale-105 transition-all duration-300 hover:shadow-xl"
                      : "bg-purple-600 hover:bg-white hover:text-purple-600 border-1 border-purple-600  hover:scale-105 transition-all duration-300 hover:shadow-xl"
                  }`}
                >
                  📝 Lihat Feedback ({feedbackCount}
                  {unreadFeedbackCount > 0
                    ? `, ${unreadFeedbackCount} Feedback Baru`
                    : ""}
                  )
                </Button>
                <Button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 text-sm py-2.5 px-4 justify-center hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  📧 Kirim Email
                </Button>
                {ticket.status === "done" && (
                  <Button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={isUpdatingStatus}
                    className="w-full bg-orange-600 text-white hover:bg-orange-700 text-sm py-2.5 px-4 justify-center disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Memperbarui..." : "🔄 Buka Kembali"}
                  </Button>
                )}
                {ticket.status !== "done" && (
                  <Button
                    onClick={() => handleStatusUpdate("done")}
                    disabled={isUpdatingStatus}
                    className="w-full bg-green-600 text-white hover:bg-green-700 text-sm py-2.5 px-4 justify-center disabled:opacity-50 hover:scale-105 transition-all duration-300"
                  >
                    {isUpdatingStatus ? "Memperbarui..." : "✅ Tandai Selesai"}
                  </Button>
                )}
                {ticket.status === "new" && (
                  <Button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={isUpdatingStatus}
                    className="w-full bg-yellow-600 text-white hover:bg-yellow-700 text-sm py-2.5 px-4 justify-center disabled:opacity-50 hover:scale-105 transition-all duration-300"
                  >
                    {isUpdatingStatus ? "Memperbarui..." : "🔄 Proses"}
                  </Button>
                )}
              </div>

              {/* Desktop Layout - Horizontal */}
              <div className="hidden md:flex space-x-2">
                <Button
                  onClick={handleViewFeedback}
                  className={`text-white ${
                    unreadFeedbackCount > 0
                      ? "bg-orange-600 hover:bg-orange-700 hover:scale-105 transition-all duration-300 hover:shadow-xl"
                      : "bg-purple-600 hover:bg-white hover:text-purple-600 border-1 border-purple-600  hover:scale-105 transition-all duration-300 hover:shadow-xl"
                  }`}
                >
                  📝 Lihat Feedback ({feedbackCount}
                  {unreadFeedbackCount > 0
                    ? `, ${unreadFeedbackCount} baru`
                    : ""}
                  )
                </Button>
                <Button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  📧 Kirim Email
                </Button>
                {ticket.status === "done" && (
                  <Button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={isUpdatingStatus}
                    className="bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Memperbarui..." : "🔄 Buka Kembali"}
                  </Button>
                )}
                {ticket.status !== "done" && (
                  <Button
                    onClick={() => handleStatusUpdate("done")}
                    disabled={isUpdatingStatus}
                    className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 hover:scale-105 transition-all duration-300 hover:shadow-xl"
                  >
                    {isUpdatingStatus ? "Memperbarui..." : "✅ Tandai Selesai"}
                  </Button>
                )}
                {ticket.status === "new" && (
                  <Button
                    onClick={() => handleStatusUpdate("in_progress")}
                    disabled={isUpdatingStatus}
                    className="bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 hover:scale-105 transition-all duration-300 hover:shadow-xl"
                  >
                    {isUpdatingStatus ? "Memperbarui..." : "🔄 Proses"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* PERBAIKAN: Action buttons for students - Responsive yang benar */}
          {userRole === "student" && ticket.userId === currentUser.uid && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Tindakan
              </h3>

              {/* Unified responsive layout */}
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                <Button
                  onClick={handleViewFeedback}
                  className={`w-full md:w-auto text-white hover:scale-105 transition-all duration-300 ${
                    unreadFeedbackCount > 0
                      ? "bg-orange-600 hover:bg-orange-700 hover:scale-105 transition-all duration-300"
                      : "bg-purple-600 hover:bg-white hover:text-purple-600 border-1 border-purple-600  hover:scale-105 transition-all duration-300"
                  }`}
                >
                  📝 Lihat Feedback ({feedbackCount}
                  {unreadFeedbackCount > 0
                    ? `, ${unreadFeedbackCount} baru`
                    : ""}
                  )
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal - Mobile Responsive dengan Background Blur */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto h-full w-full">
          {/* Backdrop dengan blur effect */}
          <div
            className="absolute inset-0 bg-white/30 backdrop-blur-sm"
            onClick={() => setIsEmailModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200">
              <div className="p-4 md:p-5">
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-4">
                  Kirim Detail Tiket via Email
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Email Penerima *
                    </label>
                    <input
                      type="email"
                      value={emailData.recipientEmail}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          recipientEmail: e.target.value,
                        })
                      }
                      placeholder="contoh@gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Pesan Tambahan (Opsional)
                    </label>
                    <textarea
                      value={emailData.additionalMessage}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          additionalMessage: e.target.value,
                        })
                      }
                      placeholder="Tambahkan pesan khusus untuk penerima email..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-xs text-blue-600">
                      ℹ️ Info: Email akan berisi detail lengkap tiket dengan
                      format yang rapi seperti yang Anda lihat di sistem ini.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 mt-6">
                  <button
                    onClick={() => setIsEmailModalOpen(false)}
                    className="w-full md:w-auto px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={
                      isSendingEmail || !emailData.recipientEmail.trim()
                    }
                    className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingEmail ? "Mengirim..." : "Kirim Email"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password verification modal untuk mahasiswa */}
      {showPasswordModal && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPassword("");
          }}
          title="Verifikasi Password"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Untuk keamanan, silakan masukkan password Anda untuk melihat token
              rahasia.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRevealToken()}
                placeholder="Masukkan password Anda"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRevealToken}
                disabled={isVerifying || !password.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifying ? "Memverifikasi..." : "Verifikasi"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TicketDetailPage;
