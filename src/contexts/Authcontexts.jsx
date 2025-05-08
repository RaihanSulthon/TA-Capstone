// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser, logoutUser } from "../Services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setCurrentUser(null);
    }
    return result;
  };

  const value = {
    currentUser,
    setCurrentUser,
    logout,
    isAuthenticated: !!currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};