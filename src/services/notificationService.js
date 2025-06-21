import { db } from "../firebase-config";
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";

/**
 * Create a general notification
 * @param {Object} params - Notification parameters
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
const createTicketNotification = async ({
  ticketId,
  type,
  title,
  message,
  recipientId = null,
  recipientRoles = [],
  senderId,
  senderName,
  senderRole,
  metadata = {}
}) => {
  try {
    console.log("Creating notification with params:", {
      ticketId, 
      type, 
      title, 
      message, 
      recipientId, 
      recipientRoles, 
      senderId, 
      senderName, 
      senderRole,
      metadata
    });

    // Validate required parameters
    if (!ticketId || !type || !title || !message || !senderId || !senderName || !senderRole) {
      throw new Error("Missing required parameters for notification");
    }

    const notificationData = {
      ticketId,
      type,
      title,
      message,
      recipientId: recipientId || null,
      recipientRoles: Array.isArray(recipientRoles) ? recipientRoles : [],
      senderId,
      senderName,
      senderRole,
      read: false,
      metadata: metadata || {},
      createdAt: serverTimestamp(),
      readAt: null
    };
    
    const notificationRef = await addDoc(collection(db, "notifications"), notificationData);
    
    console.log("Notification created successfully with ID:", notificationRef.id);
    
    return {
      success: true,
      data: {
        id: notificationRef.id,
        ...notificationData
      }
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a notification for a new ticket
 * @param {Object} ticket - Ticket data
 * @param {string} senderId - ID of the sender
 * @param {string} senderName - Name of the sender
 * @param {string} senderRole - Role of the sender (default: "student")
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const notifyNewTicket = async (ticket, senderId, senderName, senderRole = "student") => {
  try {
    console.log("notifyNewTicket called with:", { 
      ticketId: ticket.id, 
      senderId, 
      senderName, 
      senderRole,
      isAnonymous: ticket.anonymous 
    });

    // Validate ticket data
    if (!ticket || !ticket.id || !ticket.judul) {
      throw new Error("Invalid ticket data provided");
    }

    // Create notification message based on anonymity
    const message = ticket.anonymous 
      ? `Tiket baru (anonim) telah dibuat: "${ticket.judul}"`
      : `Tiket baru telah dibuat oleh ${senderName}: "${ticket.judul}"`;

    // Create notification for all admins
    const result = await createTicketNotification({
      ticketId: ticket.id,
      type: "new_ticket",
      title: "Tiket Baru",
      message: message,
      recipientRoles: ["admin"], // Send to all admins
      senderId,
      senderName,
      senderRole,
      metadata: {
        isAnonymous: ticket.anonymous || false,
        category: ticket.kategori || "",
        subCategory: ticket.subKategori || "",
        status: ticket.status || "new",
        hasAttachment: !!(ticket.lampiran || ticket.lampiranBase64 || ticket.lampiranURL)
      }
    });

    if (result.success) {
      console.log("New ticket notification created successfully");
    } else {
      console.error("Failed to create new ticket notification:", result.error);
    }

    return result;
  } catch (error) {
    console.error("Error in notifyNewTicket:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a notification for ticket assignment
 * @param {Object} ticket - Ticket data
 * @param {string} adminId - ID of the admin who made the assignment
 * @param {string} adminName - Name of the admin who made the assignment
 * @param {string} assignedToId - ID of the admin assigned to the ticket
 * @param {string} assignedToName - Name of the admin assigned to the ticket
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const notifyTicketAssignment = async (ticket, adminId, adminName, assignedToId, assignedToName) => {
  try {
    const notifications = [];

    // Notify the student that their ticket has been assigned
    if (ticket.userId && !ticket.anonymous) {
      notifications.push(
        createTicketNotification({
          ticketId: ticket.id,
          type: "assignment",
          title: "Tiket Ditugaskan",
          message: `Tiket Anda "${ticket.judul}" telah ditugaskan kepada ${assignedToName}`,
          recipientId: ticket.userId,
          senderId: adminId,
          senderName: adminName,
          senderRole: "admin",
          metadata: {
            assignedTo: assignedToId,
            assignedToName: assignedToName
          }
        })
      );
    }

    // Notify the assigned admin
    if (assignedToId !== adminId) {
      notifications.push(
        createTicketNotification({
          ticketId: ticket.id,
          type: "assignment",
          title: "Tiket Ditugaskan Kepada Anda",
          message: `Anda telah ditugaskan untuk menangani tiket: "${ticket.judul}"`,
          recipientId: assignedToId,
          senderId: adminId,
          senderName: adminName,
          senderRole: "admin",
          metadata: {
            assignedBy: adminId,
            assignedByName: adminName
          }
        })
      );
    }

    const results = await Promise.all(notifications);
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error("Error creating assignment notifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a notification for ticket status change
 * @param {Object} ticket - Ticket data
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string} updaterId - ID of the user who updated the status
 * @param {string} updaterName - Name of the user who updated the status
 * @param {string} updaterRole - Role of the user who updated the status
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const notifyStatusChange = async (ticket, oldStatus, newStatus, updaterId, updaterName, updaterRole) => {
  try {
    // Get status labels
    const getStatusLabel = (status) => {
      switch (status) {
        case "new": return "Baru";
        case "in_progress": return "Sedang Diproses";
        case "waiting_feedback": return "Menunggu Feedback";
        case "done": return "Selesai";
        case "closed": return "Ditutup";
        default: return status;
      }
    };
    
    const oldStatusLabel = getStatusLabel(oldStatus);
    const newStatusLabel = getStatusLabel(newStatus);
    
    const notifications = [];
    
    // If updated by admin, notify student (if not anonymous)
    if (updaterRole === "admin" && ticket.userId && !ticket.anonymous) {
      notifications.push(
        createTicketNotification({
          ticketId: ticket.id,
          type: "status_change",
          title: "Status Tiket Diperbarui",
          message: `Status tiket Anda "${ticket.judul}" telah diperbarui dari ${oldStatusLabel} menjadi ${newStatusLabel}`,
          recipientId: ticket.userId,
          senderId: updaterId,
          senderName: updaterName,
          senderRole: updaterRole,
          metadata: {
            oldStatus,
            newStatus,
            oldStatusLabel,
            newStatusLabel
          }
        })
      );
    }
    
    // If updated by admin and ticket is assigned, notify assigned admin (if different)
    if (updaterRole === "admin" && ticket.assignedTo && ticket.assignedTo !== updaterId) {
      notifications.push(
        createTicketNotification({
          ticketId: ticket.id,
          type: "status_change",
          title: "Status Tiket Diperbarui",
          message: `Status tiket "${ticket.judul}" telah diperbarui dari ${oldStatusLabel} menjadi ${newStatusLabel} oleh ${updaterName}`,
          recipientId: ticket.assignedTo,
          senderId: updaterId,
          senderName: updaterName,
          senderRole: updaterRole,
          metadata: {
            oldStatus,
            newStatus,
            oldStatusLabel,
            newStatusLabel
          }
        })
      );
    }
    
    const results = await Promise.all(notifications);
    console.log("Status change notifications created:", results.length);
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error("Error creating status change notifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a notification for new feedback
 * @param {Object} ticket - Ticket data
 * @param {Object} feedback - Feedback data
 * @param {string} senderId - ID of the sender
 * @param {string} senderName - Name of the sender
 * @param {string} senderRole - Role of the sender
 * @param {boolean} hasAttachment - Whether feedback has attachment
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const notifyNewFeedback = async (ticket, feedback, senderId, senderName, senderRole, hasAttachment = false) => {
  try {
    // Create enhanced message based on attachment
    const baseMessage = hasAttachment 
      ? `feedback baru dengan lampiran untuk tiket: "${ticket.judul}"`
      : `feedback baru untuk tiket: "${ticket.judul}"`;
    
    const notifications = [];
    
    // If feedback is from admin, notify student (if not anonymous)
    if (senderRole === "admin" && ticket.userId && !ticket.anonymous) {
      notifications.push(
        createTicketNotification({
          ticketId: ticket.id,
          type: "feedback",
          title: "Feedback Baru",
          message: `Anda menerima ${baseMessage}`,
          recipientId: ticket.userId,
          senderId,
          senderName,
          senderRole,
          metadata: {
            hasAttachment,
            feedbackId: feedback.id || null,
            attachmentCount: feedback.attachments ? feedback.attachments.length : 0,
            isFromAdmin: true
          }
        })
      );
    }
    
    // If feedback is from student, notify admin and assigned admin
    if (senderRole === "student") {
      // Notify all admins
      notifications.push(
        createTicketNotification({
          ticketId: ticket.id,
          type: "feedback",
          title: "Feedback Baru",
          message: `${baseMessage} dari mahasiswa`,
          recipientRoles: ["admin"],
          senderId,
          senderName,
          senderRole,
          metadata: {
            hasAttachment,
            feedbackId: feedback.id || null,
            attachmentCount: feedback.attachments ? feedback.attachments.length : 0,
            isFromStudent: true,
            isAnonymous: ticket.anonymous || false
          }
        })
      );
      
      // Also notify specifically assigned admin if exists and different
      if (ticket.assignedTo) {
        notifications.push(
          createTicketNotification({
            ticketId: ticket.id,
            type: "feedback",
            title: "Feedback Baru",
            message: `${baseMessage} dari mahasiswa (tiket yang ditugaskan kepada Anda)`,
            recipientId: ticket.assignedTo,
            senderId,
            senderName,
            senderRole,
            metadata: {
              hasAttachment,
              feedbackId: feedback.id || null,
              attachmentCount: feedback.attachments ? feedback.attachments.length : 0,
              isFromStudent: true,
              isAssigned: true,
              isAnonymous: ticket.anonymous || false
            }
          })
        );
      }
    }
    
    const results = await Promise.all(notifications);
    console.log("Feedback notifications created:", results.length);
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error("Error creating feedback notifications:", error);
    return {
      success: false,
      error: error.message
    };
  }
};