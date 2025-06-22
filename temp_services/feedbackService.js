// src/services/feedbackService.js
import { db } from "../firebase-config";
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

/**
 * Add a new feedback to a ticket
 * @param {string} ticketId - ID of the ticket
 * @param {Object} feedbackData - Feedback data
 * @param {string} feedbackData.message - Feedback message
 * @param {string} feedbackData.createdBy - User ID who created feedback
 * @param {string} feedbackData.createdByName - Name of user who created feedback
 * @param {string} feedbackData.createdByRole - Role of user (admin/student)
 * @param {Array} feedbackData.attachments - Array of attachments (optional)
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const addFeedback = async (ticketId, feedbackData) => {
  try {
    // Validate required fields
    if (!ticketId || !feedbackData.message || !feedbackData.createdBy) {
      return {
        success: false,
        error: "Missing required feedback data"
      };
    }

    // Prepare feedback document
    const feedback = {
      ticketId,
      message: feedbackData.message.trim(),
      createdBy: feedbackData.createdBy,
      createdByName: feedbackData.createdByName || "Unknown",
      createdByRole: feedbackData.createdByRole || "student",
      attachments: feedbackData.attachments || [],
      readBy: {
        // Initially only read by the creator
        [feedbackData.createdBy]: new Date()
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, "feedbacks"), feedback);

    return {
      success: true,
      data: {
        id: docRef.id,
        ...feedback
      }
    };
  } catch (error) {
    console.error("Error adding feedback:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all feedbacks for a specific ticket
 * @param {string} ticketId - ID of the ticket
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const getFeedbacksByTicket = async (ticketId) => {
  try {
    if (!ticketId) {
      return {
        success: false,
        error: "Ticket ID is required"
      };
    }

    const feedbacksQuery = query(
      collection(db, "feedbacks"),
      where("ticketId", "==", ticketId),
      orderBy("createdAt", "asc")
    );

    const feedbacksSnapshot = await getDocs(feedbacksQuery);
    const feedbacks = feedbacksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: feedbacks
    };
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Listen to real-time feedback updates for a ticket
 * @param {string} ticketId - ID of the ticket
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} - Unsubscribe function
 */
export const listenToFeedbacks = (ticketId, callback) => {
  if (!ticketId) {
    console.error("Ticket ID is required for listening to feedbacks");
    return () => {};
  }

  const feedbacksQuery = query(
    collection(db, "feedbacks"),
    where("ticketId", "==", ticketId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(feedbacksQuery, (snapshot) => {
    const feedbacks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(feedbacks);
  }, (error) => {
    console.error("Error in feedback listener:", error);
    callback([]);
  });
};

/**
 * Mark feedback as read by a user
 * @param {string} feedbackId - ID of the feedback
 * @param {string} userId - ID of the user who read the feedback
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const markFeedbackAsRead = async (feedbackId, userId) => {
  try {
    if (!feedbackId || !userId) {
      return {
        success: false,
        error: "Feedback ID and User ID are required"
      };
    }

    const feedbackRef = doc(db, "feedbacks", feedbackId);
    
    await updateDoc(feedbackRef, {
      [`readBy.${userId}`]: new Date(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      message: "Feedback marked as read"
    };
  } catch (error) {
    console.error("Error marking feedback as read:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark multiple feedbacks as read by a user
 * @param {Array} feedbackIds - Array of feedback IDs
 * @param {string} userId - ID of the user who read the feedbacks
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const markMultipleFeedbacksAsRead = async (feedbackIds, userId) => {
  try {
    if (!feedbackIds || feedbackIds.length === 0 || !userId) {
      return {
        success: false,
        error: "Feedback IDs and User ID are required"
      };
    }

    const updatePromises = feedbackIds.map(feedbackId => {
      const feedbackRef = doc(db, "feedbacks", feedbackId);
      return updateDoc(feedbackRef, {
        [`readBy.${userId}`]: new Date(),
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(updatePromises);

    return {
      success: true,
      message: `${feedbackIds.length} feedbacks marked as read`
    };
  } catch (error) {
    console.error("Error marking multiple feedbacks as read:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a feedback (admin only)
 * @param {string} feedbackId - ID of the feedback to delete
 * @param {string} userRole - Role of the user attempting deletion
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const deleteFeedback = async (feedbackId, userRole) => {
  try {
    if (userRole !== "admin") {
      return {
        success: false,
        error: "Only administrators can delete feedback"
      };
    }

    if (!feedbackId) {
      return {
        success: false,
        error: "Feedback ID is required"
      };
    }

    await deleteDoc(doc(db, "feedbacks", feedbackId));

    return {
      success: true,
      message: "Feedback deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get feedback count and unread count for a ticket
 * @param {string} ticketId - ID of the ticket
 * @param {string} userId - ID of the current user
 * @returns {Promise<Object>} - Object with counts
 */
export const getFeedbackCounts = async (ticketId, userId) => {
  try {
    if (!ticketId) {
      return {
        total: 0,
        unread: 0
      };
    }

    const feedbacksQuery = query(
      collection(db, "feedbacks"),
      where("ticketId", "==", ticketId)
    );

    const feedbacksSnapshot = await getDocs(feedbacksQuery);
    const total = feedbacksSnapshot.size;
    
    let unread = 0;
    if (userId) {
      feedbacksSnapshot.docs.forEach(doc => {
        const feedback = doc.data();
        const isReadByUser = feedback.readBy && feedback.readBy[userId];
        // Don't count own messages as unread
        if (!isReadByUser && feedback.createdBy !== userId) {
          unread++;
        }
      });
    }

    return {
      total,
      unread
    };
  } catch (error) {
    console.error("Error getting feedback counts:", error);
    return {
      total: 0,
      unread: 0
    };
  }
};

/**
 * Process and validate attachment data
 * @param {File} file - File object to process
 * @returns {Promise<Object>} - Processed attachment data or error
 */
export const processAttachment = async (file) => {
  try {
    if (!file) {
      return {
        success: false,
        error: "No file provided"
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size must be less than 5MB"
      };
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "File type not supported. Please use images, PDF, Word, Excel, or text files."
      };
    }

    // Convert to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

    const attachment = {
      id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      base64: base64,
      uploadedAt: new Date()
    };

    return {
      success: true,
      data: attachment
    };
  } catch (error) {
    console.error("Error processing attachment:", error);
    return {
      success: false,
      error: "Failed to process attachment"
    };
  }
};

/**
 * Get attachment download URL (for display purposes)
 * @param {Object} attachment - Attachment object
 * @returns {string} - Download URL or empty string
 */
export const getAttachmentDownloadUrl = (attachment) => {
  if (!attachment || !attachment.base64) {
    return "";
  }
  return attachment.base64;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};