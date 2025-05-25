import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useFirestoreListeners } from '../contexts/Authcontexts';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import Modal from './Modal';

const NotificationsSystem = () => {
  const { currentUser, userRole } = useAuth();
  const { addListener } = useFirestoreListeners();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check isadmin panel view true or not
  useEffect(() => {
    // Check if we're in the admin section by looking at the URL
    const inAdminSection = window.location.pathname.startsWith('/admin');
    setIsAdmin(inAdminSection && userRole === 'admin');
  }, [userRole, window.location.pathname]);

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      if (typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        
        // If today, show time
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
          return date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        }
        
        // If this year, show day and month
        if (date.getFullYear() === today.getFullYear()) {
          return date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short' 
          });
        }
        
        // Otherwise show full date
        return date.toLocaleDateString('id-ID', { 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        });
      }
      
      return '';
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
  };
  
  // Update unread count - use useCallback to prevent recreation on every render
  const updateUnreadCount = useCallback((notifsList) => {
    const count = notifsList.filter(n => !n.read).length;
    setUnreadCount(count);
  }, []);
  
  // Listen for notifications
  useEffect(() => {
    // Don't start a listener if no user is authenticated
    if (!currentUser || !userRole) return;
    
    let notificationsQuery;
    
    if (userRole === 'admin') {
      // Admin notifications: new tickets and status changes
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientRoles', 'array-contains', 'admin'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    } else if (userRole === 'disposisi') {
      // Disposisi notifications: assigned tickets and status changes
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    } else if (userRole === 'student') {
      // Student notifications: ticket status updates and feedback
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    } else {
      // No valid role, return early
      return;
    }

    console.log(`Starting notifications listener for ${userRole} with ID ${currentUser.uid}`);
    
    // Register the listener 
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      console.log(`Got ${snapshot.docs.length} notifications`);
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsList);
      // Update unread count once when we get notifications
      updateUnreadCount(notificationsList);
    }, (error) => {
      // Handle error silently - this is likely to fail on logout which is expected
      console.error("Notifications listener error:", error);
    });
    
    // Register the listener for cleanup
    addListener(unsubscribe);
    
    // No return cleanup here as we're using the AuthContext cleanup mechanism
  }, [currentUser, userRole, addListener, updateUnreadCount]);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      // Update local state to reflect the read notification
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count without using a separate useEffect
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(n => {
        const notificationRef = doc(db, 'notifications', n.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(promises);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Set unread count to 0 directly
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Clear individual notification
  const clearNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
      
      // Update local state
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
      if (wasUnread) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!notifications.length) return;
    
    try {
      const promises = notifications.map(n => {
        const notificationRef = doc(db, 'notifications', n.id);
        return deleteDoc(notificationRef);
      });
      
      await Promise.all(promises);
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.ticketId) {
      const ticketPath = isAdmin 
        ? `/admin/tickets`
        : `/app/tickets/${notification.ticketId}`;
      
      navigate(ticketPath);
    }
    
    setIsModalOpen(false);
  };
  
  return (
    <>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`relative p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
          isAdmin 
            ? 'text-white hover:border hover:border-white focus:ring-white' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-blue-500'
        }`}
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
        </svg>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Notifications Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isAdmin ? "Notifikasi" : "Notifikasi"}
        size="md"
      >
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-gray-500">
              Tidak ada notifikasi
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''} relative`}
                >
                  <div 
                    className="flex cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`flex-shrink-0 w-2 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'} mr-3 rounded-full`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  {/* Clear button for individual notification */}
                  <button
                    onClick={(e) => clearNotification(notification.id, e)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                    title="Hapus notifikasi"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="mt-4 flex justify-between">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Tandai semua sudah dibaca
              </button>
            )}
            <button
              onClick={clearAllNotifications}
              className="text-sm text-red-600 hover:text-red-800 ml-auto"
            >
              Hapus semua notifikasi
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default NotificationsSystem;