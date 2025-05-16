import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContexts";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserManagementPage from "./pages/UserManagementPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="auth" element={<AuthPage />} />
          <Route path="access-denied" element={<AccessDeniedPage />} />
          
          {/* Protected User Routes */}
          <Route path="app" element={<MainLayout />}>
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            
            {/* Add other user routes here */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <DashboardPage /> {/* Replace with actual profile page when created */}
                </ProtectedRoute>
              }
            />
          </Route>
          
          {/* Admin Routes */}
          <Route path="admin" element={<MainLayout />}>
            <Route
              path="dashboard"
              element={
                <RoleBasedRoute allowedRoles={["admin"]} fallbackPath="/access-denied">
                  <AdminDashboardPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleBasedRoute allowedRoles={["admin"]} fallbackPath="/access-denied">
                  <UserManagementPage />
                </RoleBasedRoute>
              }
            />
            
            {/* Add more admin routes here */}
          </Route>
          
          {/* Redirects */}
          <Route path="dashboard" element={<Navigate to="/app/dashboard" replace />} />
          
          {/* 404 Page - Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;