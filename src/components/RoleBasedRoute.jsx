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
        checkingRole} = useAuth();

    // Kalau belum authenticated, redirect ke auth page
    if(!isAuthenticated){
        console.log("User not authenticated, redirecting to /auth");
        return <Navigate to="/auth" replace/>
    }

    if(allowedRoles.length > 0 && !allowedRoles.includes(userRole)){
        console.log(`User role (${userRole}) not allowed, redirecting to ${fallbackPath}`);
        return <Navigate to={fallbackPath} replace/>
    }

    return children;
};

export default RoleBasedRoute;