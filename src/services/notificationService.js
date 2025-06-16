// src/services/notificationService.js
import { db } from "../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Create a notification for a ticket
 * @param {Object} params - Parameters for creating a notification
 * @param {string} params.ticketId - ID of the ticket
 * @param {string} params.type - Notification type ('new_ticket', 'assignment', 'status_change', 'feedback')
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.recipientId - ID of the recipient (optional for role-based notifications)
 * @param {Array} params.recipientRoles - Array of recipient roles (optional for user-specific notifications)
 * @param {string} params.senderId - ID of the sender (user who triggered the notification)
 * @param {string} params.senderName - Name of the sender
 * @param {string} params.senderRole - Role of the sender
 * @returns {Promise<Object>} - Object with success flag and data or error
 */

export const createTicketNotification = async (params) => {
  try {
    const {
      ticketId,
      type,
      title,
      message,
      recipientId,
      recipientRoles,
      senderId,
      senderName,
      senderRole
    } = params;
    
    // Validate required fields
    if (!ticketId || !type || !title || !message || (!recipientId && !recipientRoles)) {
      return { 
        success: false, 
        error: "Missing required notification parameters" 
      };
    }
    
    // Create notification document
    const notificationData = {
      ticketId,
      type,
      title,
      message,
      recipientId: recipientId || null,
      recipientRoles: recipientRoles || [],
      senderId,
      senderName,
      senderRole,
      read: false,
      createdAt: serverTimestamp()
    };
    
    const notificationRef = await addDoc(collection(db, "notifications"), notificationData);
    
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
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const notifyNewTicket = async (ticket, senderId, senderName) => {
  return createTicketNotification({
    ticketId: ticket.id,
    type: "new_ticket",
    title: "Tiket Baru",
    message: `Tiket baru telah dibuat: ${ticket.judul}`,
    recipientRoles: ["admin"],
    senderId,
    senderName,
    senderRole: "student"
  });
};

/**
 * Create a notification for ticket assignment
 * @param {Object} ticket - Ticket data
 * @param {string} adminId - ID of the admin who made the assignment
 * @param {string} adminName - Name of the admin who made the assignment
 * @returns {Promise<Object>} - Object with success flag and data or error
 */

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
  // Get status labels
  const getStatusLabel = (status) => {
    switch (status) {
      case "new": return "Baru";
      case "in_progress": return "Diproses";
      case "done": return "Selesai";
      default: return status;
    }
  };
  
  const oldStatusLabel = getStatusLabel(oldStatus);
  const newStatusLabel = getStatusLabel(newStatus);
  
  // Create notifications for different recipients based on roles
  const notifications = [];
  
  // If updated by admin, notify student
  if (updaterRole === "admin") {
    notifications.push(
      createTicketNotification({
        ticketId: ticket.id,
        type: "status_change",
        title: "Status Tiket Diperbarui",
        message: `Status tiket Anda telah diperbarui dari ${oldStatusLabel} menjadi ${newStatusLabel}`,
        recipientId: ticket.userId,
        senderId: updaterId,
        senderName: updaterName,
        senderRole: updaterRole
      })
    );
  }
  
  // If updated by admin, notify them
  if (updaterRole === "admin" && ticket.assignedTo) {
    notifications.push(
      createTicketNotification({
        ticketId: ticket.id,
        type: "status_change",
        title: "Status Tiket Diperbarui",
        message: `Status tiket telah diperbarui dari ${oldStatusLabel} menjadi ${newStatusLabel} oleh Admin`,
        recipientId: ticket.assignedTo,
        senderId: updaterId,
        senderName: updaterName,
        senderRole: updaterRole
      })
    );
  }
  
  try {
    const results = await Promise.all(notifications);
    console.log("Status change notifications created:", results);
    
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
 * * @param {boolean} hasAttachment - Whether feedback has attachment
 * @returns {Promise<Object>} - Object with success flag and data or error
 */
export const notifyNewFeedback = async (ticket, feedback, senderId, senderName, senderRole, hasAttachment = false) => {
  // Create enhanced message based on attachment
  const baseMessage = hasAttachment 
    ? `feedback baru dengan lampiran untuk tiket: ${ticket.judul}`
    : `feedback baru untuk tiket: ${ticket.judul}`;
  
  // If feedback is from admin, notify student
  if (senderRole === "admin") {
    return createTicketNotification({
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
        attachmentCount: feedback.attachments ? feedback.attachments.length : 0
      }
    });
  }
  
  // If feedback is from student, notify admin and assigned
  const notifications = [
    // Notify admin
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
        attachmentCount: feedback.attachments ? feedback.attachments.length : 0
      }
    })
  ];
  
  if (ticket.assignedTo) {
    notifications.push(
      createTicketNotification({
        ticketId: ticket.id,
        type: "feedback",
        title: "Feedback Baru",
        message: `${baseMessage} dari mahasiswa`,
        recipientId: ticket.assignedTo,
        senderId,
        senderName,
        senderRole,
        metadata: {
          hasAttachment,
          feedbackId: feedback.id || null,
          attachmentCount: feedback.attachments ? feedback.attachments.length : 0
        }
      })
    );
  }
  
  try {
    const results = await Promise.all(notifications);
    console.log("Feedback notifications created:", results);
    
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