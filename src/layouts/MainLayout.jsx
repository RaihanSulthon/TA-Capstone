// src/layouts/MainLayout.jsx - Final complete version
import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContexts";
import Navbar from "../components/Navbar";
import NavbarAdmin from "../components/admin/NavbarAdmin";

const MainLayout = () => {
  const { userRole, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Determine if admin section is active
  const isAdminSection = location.pathname.startsWith('/admin');

  // Check if a nav link is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminSection ? <NavbarAdmin /> : <Navbar />}
      
      <div className="flex flex-1">
        {/* Sidebar Navigation - Improved styling */}
        {userRole && (
          <div className="bg-white w-64 shadow-md hidden md:block">
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-xl font-semibold">
                {isAdminSection ? "Admin Panel" : "Navigation"}
              </h2>
            </div>
            
            {/* Mobile Menu Button (visible on small screens) */}
            <div className="md:hidden p-4 border-b">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 bg-gray-100 rounded"
              >
                <span>Menu</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            <nav className={`mt-2 ${isMobileMenuOpen ? 'block' : 'hidden md:block'}`}>
              {/* Common Navigation Links */}
              {!isAdminSection && (
                <>
                  <Link
                    to="/app/dashboard"
                    className={`block px-6 py-3 mb-1 transition-all duration-200 ${
                      isActive('/app/dashboard')
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  {/* Student Specific Navigation */}
                  {userRole === "student" && (
                    <>
                      <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 bg-gray-100">
                        Helpdesk
                      </div>
                      <Link
                        to="/app/submit-ticket"
                        className={`block px-6 py-3 mb-1 transition-all duration-200 ${
                          isActive('/app/submit-ticket')
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-blue-500 hover:text-white'
                        }`}
                      >
                        Buat Tiket Baru
                      </Link>
                      <Link
                        to="/app/my-tickets"
                        className={`block px-6 py-3 mb-1 transition-all duration-200 ${
                          isActive('/app/my-tickets')
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-blue-500 hover:text-white'
                        }`}
                      >
                        Tiket Saya
                      </Link>
                    </>
                  )}
                  
                  {/* Disposisi Specific Navigation */}
                  {userRole === "disposisi" && (
                    <>
                      <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 bg-gray-100">
                        Helpdesk
                      </div>
                      <Link
                        to="/app/disposisi-tickets"
                        className={`block px-6 py-3 mb-1 transition-all duration-200 ${
                          isActive('/app/disposisi-tickets')
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-blue-500 hover:text-white'
                        }`}
                      >
                        Kelola Tiket
                      </Link>
                    </>
                  )}
                </>
              )}
              
              {/* Admin Navigation Links */}
              {isAdminSection && isAdmin() && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`block px-6 py-3 mb-1 transition-all duration-200 ${
                      isActive('/admin/dashboard')
                        ? 'bg-red-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`block px-6 py-3 mb-1 transition-all duration-200 ${
                      isActive('/admin/users')
                        ? 'bg-red-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    Manage Users
                  </Link>
                  
                  {/* Admin Ticket Management */}
                  <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 bg-gray-100">
                    Helpdesk
                  </div>
                  <Link
                    to="/admin/tickets"
                    className={`block px-6 py-3 mb-1 transition-all duration-200 ${
                      isActive('/admin/tickets')
                        ? 'bg-red-600 text-white font-medium'
                        : 'text-gray-700 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    Manajemen Tiket
                  </Link>
                </>
              )}
              
              {/* Show link to switch between Admin/User views */}
              {isAdmin() && (
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <Link
                    to={isAdminSection ? "/app/dashboard" : "/admin/dashboard"}
                    className={`block px-6 py-3 mb-1 transition-all duration-200 
                    ${isAdminSection 
                      ? 'text-gray-700 hover:bg-blue-500 hover:text-white' 
                      : 'text-gray-700 hover:bg-red-500 hover:text-white'}`}
                  >
                    {isAdminSection ? "Switch to User View" : "Switch to Admin View"}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 bg-gray-50 p-4 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;