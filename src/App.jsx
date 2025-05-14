// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContexts";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import "./App.css";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Route */}
          <Route path="auth" element={<AuthPage />} />
          
          {/* App Routes */}
          <Route path="app" element={<MainLayout />}>
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Redirect old dashboard url to new one */}
          <Route 
            path="dashboard" 
            element={<Navigate to="/app/dashboard" replace />} 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;