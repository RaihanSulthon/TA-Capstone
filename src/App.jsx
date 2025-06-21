import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/Authcontexts";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/auth/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import TicketStatisticsPage from "./pages/admin/TicketStatisticsPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";

// Ticketing System Pages
import FormKeluhanMahasiswaPage from "./pages/FormKeluhanMahasiswaPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import FeedbackPage from "./pages/FeedbackPage";
import TicketManagementPage from "./pages/admin/TicketManagementPage";
import StudentTicketsPage from "./pages/student/StudentTicketsPage";

// Contact Pages
import ContactsPage from "./pages/ContactsPage";
import AdminContactsPage from "./pages/admin/AdminContactsPage";
import LAAKInfoPortal from "./pages/LAAKInfoPortal";
import AdminFAQPage from "./pages/admin/AdminFAQPage";

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
          
          {/* Public Contacts Route - Always accessible without login */}
          <Route path="/contacts" element={<ContactsPage />} />

          {/* LAAK Info Portal Route */}
          <Route path="/laak-info" element={<LAAKInfoPortal />} />
          
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
            
            {/* Ticket System Routes - Student */}
            <Route
              path="submit-ticket"
              element={
                <RoleBasedRoute allowedRoles={["student"]} fallbackPath="/access-denied">
                  <FormKeluhanMahasiswaPage />
                </RoleBasedRoute>
              }
            />

            <Route
              path="my-tickets"
              element={
                <RoleBasedRoute allowedRoles={["student"]} fallbackPath="/access-denied">
                  <StudentTicketsPage />
                </RoleBasedRoute>
              }
            />

            {/* Ticket Detail - Can be viewed by all roles based on permissions */}
            <Route
              path="tickets/:ticketId"
              element={
                <ProtectedRoute>
                  <TicketDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Feedback Page - New route for feedback management */}
            <Route
              path="tickets/:ticketId/feedback"
              element={
                <ProtectedRoute>
                  <FeedbackPage />
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
                  <TicketStatisticsPage />
                </RoleBasedRoute>
              }
            />

            {/* Admin Ticket Management Routes */}
            <Route
              path="tickets"
              element={
                <RoleBasedRoute allowedRoles={["admin"]} fallbackPath="/access-denied">
                  <TicketManagementPage />
                </RoleBasedRoute>
              }
            />
            
            {/* Admin Contacts Management Route */}
            <Route
              path="contacts"
              element={
                <RoleBasedRoute allowedRoles={["admin"]} fallbackPath="/access-denied">
                  <AdminContactsPage />
                </RoleBasedRoute>
              }
            />

            {/* Admin FAQ Management Route */}
            <Route
              path="faqs"
              element={
                <RoleBasedRoute allowedRoles={["admin"]} fallbackPath="/access-denied">
                  <AdminFAQPage />
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