// src/components/RoleBasedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContexts";

const RoleBasedRoute = ({
    children, 
    allowedRoles = [], 
    fallbackPath = "/access-denied"
}) => {
    const {
        currentUser, 
        isAuthenticated, 
        loading, 
        userRole, 
        checkingRole,
        initialized
    } = useAuth();

    // Wait for authentication and role checking to complete
    if (loading || checkingRole || !initialized) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Kalau belum authenticated, redirect ke auth page
    if(!isAuthenticated){
        console.log("User not authenticated, redirecting to /auth");
        return <Navigate to="/auth" replace/>
    }

    // Convert "lecturer" to "disposisi" in allowedRoles if present
    const updatedAllowedRoles = allowedRoles.map(role => 
        role === "lecturer" ? "disposisi" : role
    );

    if(updatedAllowedRoles.length > 0 && !updatedAllowedRoles.includes(userRole)){
        console.log(`User role (${userRole}) not allowed, redirecting to ${fallbackPath}`);
        return <Navigate to={fallbackPath} replace/>
    }

    return children;
};

export default RoleBasedRoute;