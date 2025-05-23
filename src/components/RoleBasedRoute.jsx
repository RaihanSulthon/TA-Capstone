// src/components/RoleBasedRoute.jsx - Fixed to handle disposisi role correctly
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

// Check Complete auth
    if (loading || checkingRole || !initialized) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    if(!isAuthenticated){
        console.log("User not authenticated, redirecting to /auth");
        return <Navigate to="/auth" replace/>
    }

    // Check if the user's role is in the allowed roles
    if(allowedRoles.length > 0 && !allowedRoles.includes(userRole)){
        console.log(`User role (${userRole}) not allowed, redirecting to ${fallbackPath}`);
        return <Navigate to={fallbackPath} replace/>
    }

    return children;
};

export default RoleBasedRoute;