// src/contexts/AuthContexts.jsx - Standardized to use disposisi role only
import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { getCurrentUser, logoutUser } from "../Services/authService";
import {db} from "../firebase-config";
import {doc, getDoc} from "firebase/firestore";

// Create context to manage subscription cleanup
const FirestoreListenersContext = createContext([]);
const AuthContext = createContext();

// Add a hook to manage Firestore subscriptions
export const useFirestoreListeners = () => {
  const [listeners, setListeners] = useContext(FirestoreListenersContext);

  // Function to add a new unsubscribe function to the list
  const addListener = useCallback((unsubscribeFunc) => {
    setListeners(prevListeners => [...prevListeners, unsubscribeFunc]);
    return unsubscribeFunc; // Return for convenience
  }, [setListeners]);

  // Function to clean up all listeners
  const clearAllListeners = useCallback(() => {
    listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing listener:", error);
        }
      }
    });
    setListeners([]);
  }, [listeners, setListeners]);

  return { addListener, clearAllListeners };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [firestoreListeners, setFirestoreListeners] = useState([]);
  const userDataFetched = useRef(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if(!user){
          setCheckingRole(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    const getUserRole = async () => {
      // Skip if already fetched or no user
      if (!currentUser || userDataFetched.current) {
        if (!currentUser) {
          setCheckingRole(false);
          setInitialized(true);
        }
        return;
      }

      try {
        const cachedUserData = localStorage.getItem(`userData_${currentUser.uid}`);
        if (cachedUserData) {
          const parsedData = JSON.parse(cachedUserData);
          if (parsedData.role) {
            // No need to normalize role anymore, just use it directly
            setUserRole(parsedData.role);
            setCheckingRole(false);
            setInitialized(true);
            userDataFetched.current = true;
            return;
          }
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Use role directly - no need to normalize
          setUserRole(userData.role);
          console.log("User role set to: ", userData.role);

          const cachedData = cachedUserData ? JSON.parse(cachedUserData) : {};
          localStorage.setItem(
            `userData_${currentUser.uid}`,
            JSON.stringify({ ...cachedData, ...userData })
          );
          
          userDataFetched.current = true;
        }
      } catch (error) {
        console.error("Error fetching user role: ", error);
      } finally {
        setCheckingRole(false);
        setInitialized(true);
      }
    };

    if (currentUser) {
      getUserRole();
    } else {
      setUserRole(null);
      setCheckingRole(false);
      userDataFetched.current = false;
    }
  }, [currentUser]);

  const logout = useCallback(async () => {
    // Clear all Firestore listeners before logging out
    firestoreListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing listener:", error);
        }
      }
    });
    setFirestoreListeners([]);

    setUserRole(null);
    if (currentUser?.uid) {
      localStorage.removeItem(`userData_${currentUser.uid}`);
    }

    const result = await logoutUser();
    if (result.success) {
      setCurrentUser(null);
      userDataFetched.current = false;
    }
    return result;
  }, [currentUser, firestoreListeners]);

  const hasRole = useCallback((requiredRole) => {
    if (!userRole) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return userRole === requiredRole;
  }, [userRole]);

  const isAdmin = useCallback(() => userRole === 'admin', [userRole]);

  const authValue = {
    currentUser,
    setCurrentUser,
    userRole,
    logout,
    isAuthenticated: !!currentUser,
    loading,
    checkingRole,
    hasRole,
    isAdmin,
    initialized
  };

  return (
    <FirestoreListenersContext.Provider value={[firestoreListeners, setFirestoreListeners]}>
      <AuthContext.Provider value={authValue}>
        {!loading && (!checkingRole || initialized) ? children : (
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </AuthContext.Provider>
    </FirestoreListenersContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};