// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser, logoutUser } from "../Services/authService";
import {db} from "../firebase-config";
import {doc, getDoc} from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if(!user){
          setCheckingRole(false);
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
    const getUserRole = async ()=> {
      if(!currentUser){
        setCheckingRole(false);
        return;
      }

      try{
        const cachedUserData = localStorage.getItem(`userData_${currentUser.uid}`);
        if(cachedUserData){
          const parsedData = JSON.parse(cachedUserData);
          if (parsedData.role){
            setUserRole(parsedData.role);
            setCheckingRole(false);
            return;
          }
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()){
          const userData = userDoc.data();
          setUserRole(userData.role);
          console.log("User role set to: ", userData.role);

          const cachedData = cachedUserData ? JSON.parse(cachedUserData) : {};
          localStorage.setItem(
            `userData_${currentUser.uid}`,
            JSON.stringify({...cachedData, ...userData})
          );
        }
      }catch(error){
        console.error("Error fetching user role: ", error);
      }finally{
        setCheckingRole(false);
      }
    };

    if(currentUser){
      getUserRole();
    }else{
      setUserRole(null);
      setCheckingRole(false);
    }
  }, [currentUser]);

  const logout = async () => {

    setUserRole(null);
    if(currentUser?.uid){
      localStorage.removeItem(`userData_${currentUser.uid}`);
    }

    const result = await logoutUser();
    if (result.success) {
      setCurrentUser(null);
    }
    return result;
  };

  const hasRole = (requiredRole) => {
    if(!userRole) return false;
    if(Array.isArray(requiredRole)){
      return requiredRole.includes(userRole);
    }
    return userRole === requiredRole;
  };

  const isAdmin = () => userRole === 'admin';

  const value = {
    currentUser,
    setCurrentUser,
    userRole,
    logout,
    isAuthenticated: !!currentUser,
    loading,
    checkingRole,
    hasRole,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && !checkingRole ? children : (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};