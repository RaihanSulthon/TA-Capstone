// src/components/NotificationsSystem.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContexts';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import Modal from './Modal';

const NotificationsSystem = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
  
  // Listen for notifications
  useEffect(() => {
    if (!currentUser) return;
    
    let notificationsQuery;
    
    if (userRole === 'admin') {
      // Admin notifications: new tickets and status changes
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientRoles', 'array-contains', 'admin'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
    } else if (userRole === 'lecturer') {
      // Lecturer notifications: assigned tickets and status changes
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
    }
    
    if (!notificationsQuery) return;
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
    });
    
    return () => unsubscribe();
  }, [currentUser, userRole]);
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const promises = notifications
        .filter(n => !n.read)
        .map(n => {
          const notificationRef = doc(db, 'notifications', n.id);
          return updateDoc(notificationRef, { read: true });
        });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    
    if (notification.ticketId) {
      navigate(`/app/tickets/${notification.ticketId}`);
    }
    
    setIsModalOpen(false);
  };
  
  return (
    <>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative p-1 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        title="Notifikasi"
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
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex">
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
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Tandai semua sudah dibaca
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default NotificationsSystem;