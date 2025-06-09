// src/services/ticketService.js
import { db } from "../firebase-config";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";

/**
 * Soft delete a ticket (hide it for the user but keep it visible for others)
 * @param {string} ticketId - ID of the ticket to hide
 * @param {string} userId - ID of the current user
 * @param {string} userRole - Role of the current user
 * @returns {Promise<Object>} - Result of the operation
 */
export const softDeleteTicket = async (ticketId, userId, userRole) => {
  try {
    const ticketRef = doc(db, "tickets", ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      return { 
        success: false, 
        error: "Ticket not found" 
      };
    }
    
    const ticketData = ticketDoc.data();
    
    // Create or update the hiddenFor array in the ticket
    let hiddenFor = ticketData.hiddenFor || [];
    
    // Make sure we don't add duplicates
    if (!hiddenFor.includes(userId)) {
      // For students, we only hide it for them
      if (userRole === "student") {
        // Add this user ID to the hiddenFor array
        await updateDoc(ticketRef, {
          hiddenFor: arrayUnion(userId),
          // Add a history entry for this action
          history: arrayUnion({
            action: "hidden",
            hiddenBy: userId,
            timestamp: new Date()
          })
        });
        
        return { 
          success: true, 
          message: "Ticket has been removed from your list" 
        };
      } 
      // For admin, perform a hard delete
      else if (userRole === "admin") {
        await deleteDoc(ticketRef);
        
        return { 
          success: true, 
          message: "Ticket has been permanently deleted" 
        };
      }
    } else {
      // User already has this ticket hidden
      return { 
        success: true, 
        message: "Ticket was already hidden for this user" 
      };
    }
    
    return { 
      success: false, 
      error: "Operation failed due to invalid role" 
    };
  } catch (error) {
    console.error("Error in softDeleteTicket:", error);
    return { 
      success: false, 
      error: error.message || "Failed to process delete request" 
    };
  }
};

/**
 * Restore a hidden ticket for a user
 * @param {string} ticketId - ID of the ticket to restore
 * @param {string} userId - ID of the current user
 * @returns {Promise<Object>} - Result of the operation
 */
export const restoreTicket = async (ticketId, userId) => {
  try {
    const ticketRef = doc(db, "tickets", ticketId);
    const ticketDoc = await getDoc(ticketRef);
    
    if (!ticketDoc.exists()) {
      return { 
        success: false, 
        error: "Ticket not found" 
      };
    }
    
    const ticketData = ticketDoc.data();
    let hiddenFor = ticketData.hiddenFor || [];
    
    // Remove this user from the hiddenFor array
    if (hiddenFor.includes(userId)) {
      const updatedHiddenFor = hiddenFor.filter(id => id !== userId);
      
      await updateDoc(ticketRef, {
        hiddenFor: updatedHiddenFor,
        // Add a history entry for this action
        history: arrayUnion({
          action: "restored",
          restoredBy: userId,
          timestamp: new Date()
        })
      });
      
      return { 
        success: true, 
        message: "Ticket has been restored to your list" 
      };
    } else {
      // Ticket wasn't hidden for this user
      return { 
        success: true, 
        message: "Ticket was not hidden for this user" 
      };
    }
  } catch (error) {
    console.error("Error in restoreTicket:", error);
    return { 
      success: false, 
      error: error.message || "Failed to restore ticket" 
    };
  }
};

/**
 * Modified function to fetch tickets - filters out tickets hidden for the current user
 * @param {string} userId - ID of the current user
 * @param {string} userRole - Role of the current user
 * @param {Object} queryParameters - Additional query parameters
 * @returns {Promise<Array>} - List of visible tickets for this user
 */
export const getVisibleTickets = async (querySnapshot, userId) => {
  // This function takes in a query snapshot and filters out hidden tickets
  // This allows you to use your existing query logic, then filter the results
  const tickets = [];
  
  querySnapshot.forEach(doc => {
    const ticketData = doc.data();
    const hiddenFor = ticketData.hiddenFor || [];
    
    // Only add tickets that aren't hidden for the current user
    if (!hiddenFor.includes(userId)) {
      tickets.push({
        id: doc.id,
        ...ticketData
      });
    }
  });
  
  return tickets;
};