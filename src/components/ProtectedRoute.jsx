import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContexts";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Tambahkan log untuk debugging
  console.log("ProtectedRoute: isAuthenticated =", isAuthenticated);
  
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

export default ProtectedRoute;