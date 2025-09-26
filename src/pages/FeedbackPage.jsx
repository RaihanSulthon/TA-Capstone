import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useFirestoreListeners } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import Toast from "../components/Toast";
import Button from "../components/forms/Button";
import FileUpload from "../components/FileUpload";
import {
  addFeedback,
  listenToFeedbacks,
  markFeedbackAsRead,
  markMultipleFeedbacksAsRead,
  formatFileSize,
} from "../services/feedbackService";
import { notifyNewFeedback } from "../services/notificationService";

const FeedbackPage = () => {
  const { ticketId } = useParams();
  const { currentUser, userRole } = useAuth();
  const { addListener } = useFirestoreListeners();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [ticket, setTicket] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Form state
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Format timestamp - FIXED: Improve date logic
  const formatDate = (timestamp) => {
    if (!timestamp) return "";

    try {
      let date;
      if (typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }

      const now = new Date();

      // Get today's date at midnight for accurate comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const messageDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      // Calculate difference in days
      const diffTime = today.getTime() - messageDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day - show time only
        return date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffDays === 1) {
        // Yesterday
        return `Kemarin ${date.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      } else if (diffDays < 7) {
        // Within a week - show day name
        return date.toLocaleDateString("id-ID", {
          weekday: "long",
          hour: "2-digit",
          minute: "2-digit",
        });
      } else {
        // Older than a week - show full date
        return date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return { className: "bg-blue-100 text-blue-800", label: "Baru" };
      case "in_progress":
        return {
          className: "bg-yellow-100 text-yellow-800",
          label: "Diproses",
        };
      case "done":
        return { className: "bg-green-100 text-green-800", label: "Selesai" };
      default:
        return {
          className: "bg-gray-100 text-gray-800",
          label: "Tidak Diketahui",
        };
    }
  };

  // Check if user can access this feedback page
  const canAccessFeedback = () => {
    if (!ticket || !currentUser) return false;

    // Admin can access all feedback
    if (userRole === "admin") return true;

    // Student can access feedback for their own tickets
    if (userRole === "student" && ticket.userId === currentUser.uid)
      return true;

    return false;
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if feedback is unread by current user
  const isUnreadByMe = (feedback) => {
    if (!feedback.readBy || !currentUser) return false;
    return (
      !feedback.readBy[currentUser.uid] &&
      feedback.createdBy !== currentUser.uid
    );
  };

  // Fetch ticket data
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketRef = doc(db, "tickets", ticketId);
        const ticketDoc = await getDoc(ticketRef);

        if (ticketDoc.exists()) {
          setTicket({ id: ticketDoc.id, ...ticketDoc.data() });
        } else {
          setError("Ticket not found");
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
        setError("Error fetching ticket data");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  // Listen to feedbacks real-time
  useEffect(() => {
    if (!ticketId) return;

    const unsubscribe = listenToFeedbacks(ticketId, (newFeedbacks) => {
      setFeedbacks(newFeedbacks);

      // Auto-scroll to bottom when new feedback arrives
      setTimeout(scrollToBottom, 100);

      // Mark unread feedbacks as read
      if (currentUser) {
        const unreadFeedbacks = newFeedbacks.filter((feedback) =>
          isUnreadByMe(feedback)
        );
        if (unreadFeedbacks.length > 0) {
          markMultipleFeedbacksAsRead(
            unreadFeedbacks.map((f) => f.id),
            currentUser.uid
          );
        }
      }
    });

    addListener(unsubscribe);

    return () => unsubscribe();
  }, [ticketId, currentUser, addListener]);

  // Auto-scroll when feedbacks change
  useEffect(() => {
    scrollToBottom();
  }, [feedbacks]);

  // Handle send feedback
  const handleSendFeedback = async (e) => {
    e.preventDefault();

    if (!message.trim() && attachments.length === 0) {
      setToast({
        message: "Silakan masukkan pesan atau lampiran",
        type: "error",
      });
      return;
    }

    setSending(true);

    try {
      const feedbackData = {
        message: message.trim(),
        createdBy: currentUser.uid,
        createdByName:
          currentUser.displayName || currentUser.email || "Unknown",
        createdByRole: userRole,
        attachments: attachments,
      };

      const result = await addFeedback(ticketId, feedbackData);

      if (result.success) {
        // Send notification
        await notifyNewFeedback(
          ticket,
          result.data,
          currentUser.uid,
          feedbackData.createdByName,
          userRole,
          attachments.length > 0
        );

        // Reset form
        setMessage("");
        setAttachments([]);
        messageInputRef.current?.focus();

        setToast({
          message: "Feedback berhasil dikirim",
          type: "success",
        });

        // PERBAIKAN: Tunggu sebentar sebelum scroll untuk memastikan DOM update
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        setToast({
          message: result.error || "Gagal mengirim feedback",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      setToast({
        message: "Gagal mengirim feedback. Silakan coba lagi.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  // Handle back navigation - PERBAIKAN
  const handleGoBack = () => {
    console.log("FeedbackPage - Going back");
    console.log("Location state:", location.state);

    // PERBAIKAN: Cleanup state dan pastikan navigation aman
    setLoading(false);
    setSending(false);
    setMessage("");
    setAttachments([]);

    // Clear any pending timeouts
    if (window.feedbackTimeout) {
      clearTimeout(window.feedbackTimeout);
    }

    // Prioritas navigasi:
    // 1. Gunakan state.from jika ada
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
      return;
    }

    // 2. Default ke detail tiket dengan state yang tepat
    const targetPath = `/app/tickets/${ticketId}`;
    const navigationState = {
      from: "/feedback",
      timestamp: Date.now(),
    };

    // Tentukan dari mana user seharusnya kembali berdasarkan role
    if (userRole === "admin") {
      navigationState.returnTo = "/admin/tickets";
    } else if (userRole === "student") {
      navigationState.returnTo = "/app/my-tickets";
    }

    navigate(targetPath, {
      replace: true,
      state: navigationState,
    });
  };

  // Handle files change from FileUpload component
  const handleFilesChange = (files) => {
    setAttachments(files);
  };

  // FIXED: Render attachment with proper image click handling
  const renderAttachment = (attachment) => {
    const isImage = attachment.type.startsWith("image/");

    return (
      <div key={attachment.id} className="inline-block mr-2 mb-2">
        {isImage ? (
          <div className="relative">
            <img
              src={attachment.base64}
              alt={attachment.name}
              className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                // FIXED: Open image in new window/tab instead of navigating
                const newWindow = window.open("", "_blank");
                if (newWindow) {
                  newWindow.document.write(`
                    <html>
                      <head>
                        <title>${attachment.name}</title>
                        <style>
                          body { 
                            margin: 0; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            background-color: #f0f0f0;
                          }
                          img { 
                            max-width: 100%; 
                            max-height: 100vh; 
                            object-fit: contain;
                          }
                        </style>
                      </head>
                      <body>
                        <img src="${attachment.base64}" alt="${attachment.name}" />
                      </body>
                    </html>
                  `);
                  newWindow.document.close();
                }
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
              {attachment.name}
            </div>
          </div>
        ) : (
          <a
            href={attachment.base64}
            download={attachment.name}
            className="inline-flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg p-3 border"
          >
            <svg
              className="h-5 w-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                {attachment.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </p>
            </div>
          </a>
        )}
      </div>
    );
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
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Button onClick={handleGoBack} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  // Access denied
  if (!canAccessFeedback()) {
    return (
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Anda tidak memiliki akses untuk melihat feedback tiket ini</p>
        </div>
        <Button onClick={handleGoBack} className="mt-4">
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

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b">
          <div className="flex items-center mb-4">
            <button
              onClick={handleGoBack}
              className="mr-3 rounded-full w-10 h-10 flex items-center justify-center border border-blue-300 text-blue-500 bg-white hover:bg-blue-500 hover:text-white transition-all duration-300"
              aria-label="Back to ticket detail"
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
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Feedback untuk Tiket: {ticket.judul}
              </h1>
              <div className="flex items-center text-sm text-gray-600">
                <span>#{ticket.id.substring(0, 8)}</span>
                <span className="mx-2">•</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Messages Area */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Feedback & Komunikasi ({feedbacks.length})
          </h3>

          {/* Messages Container */}
          <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 mb-4">
            {feedbacks.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg
                    className="h-12 w-12 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-sm">Tidak ada feedback untuk tiket ini</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Mulai percakapan dengan mengirim pesan di bawah
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => {
                  const isFromMe = feedback.createdBy === currentUser.uid;
                  const isFromAdmin = feedback.createdByRole === "admin";

                  return (
                    <div
                      key={feedback.id}
                      className={`flex ${
                        isFromMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          isFromMe
                            ? "bg-blue-500 text-white"
                            : isFromAdmin
                            ? "bg-purple-500 text-white"
                            : "bg-white border border-gray-200 text-gray-900"
                        }`}
                      >
                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-medium ${
                              isFromMe || isFromAdmin
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          >
                            {isFromMe ? "Anda " : feedback.createdByName}
                            {isFromAdmin && !isFromMe && (
                              <span className="ml-1 bg-white text-purple-500 px-1 rounded text-xs">
                                Admin
                              </span>
                            )}
                          </span>
                          <span
                            className={`text-xs ${
                              isFromMe || isFromAdmin
                                ? "text-white opacity-75"
                                : "text-gray-500"
                            }`}
                          >
                            {formatDate(feedback.createdAt)}
                          </span>
                        </div>

                        {/* Message Content */}
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {feedback.message}
                        </p>

                        {/* Attachments */}
                        {feedback.attachments &&
                          feedback.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-opacity-20">
                              <div className="space-y-2">
                                {feedback.attachments.map((attachment) =>
                                  renderAttachment(attachment)
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Feedback Form */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Kirim Feedback
          </h3>

          <form onSubmit={handleSendFeedback} className="space-y-4">
            {/* Message Input */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pesan
              </label>
              <textarea
                ref={messageInputRef}
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={`${
                  userRole === "admin"
                    ? "Berikan feedback untuk mahasiswa..."
                    : "Kirim feedback atau pertanyaan tambahan..."
                }`}
                disabled={sending}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lampiran (Opsional)
              </label>
              <FileUpload
                onFilesChange={handleFilesChange}
                maxFiles={3}
                disabled={sending}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                onClick={handleGoBack}
                className="bg-gray-600 text-white hover:bg-white hover:text-gray-600 border border-gray-600 transition-colors duration-200"
                disabled={sending}
              >
                Kembali
              </Button>
              <Button
                type="submit"
                disabled={
                  sending || (!message.trim() && attachments.length === 0)
                }
                className={`${
                  sending || (!message.trim() && attachments.length === 0)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-white hover:text-blue-600 border border-blue-600 transition-colors duration-200"
                }`}
              >
                {sending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengirim...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Kirim Feedback
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;