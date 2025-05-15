import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContexts";
import MainLayout from "./layouts/MainLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

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