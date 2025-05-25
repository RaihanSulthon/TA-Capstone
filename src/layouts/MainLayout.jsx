import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/Authcontexts";
import Navbar from "../components/Navbar";
import NavbarAdmin from "../components/admin/NavbarAdmin";

const MainLayout = () => {
  const { userRole, isAdmin } = useAuth();
  const location = useLocation();
  
  // Determine if admin section is active
  const isAdminSection = location.pathname.startsWith('/admin');

  // Check if a nav link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminSection ? <NavbarAdmin /> : <Navbar />}
      
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        {userRole && (
          <div className="bg-white w-64 shadow-md hidden md:block">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">
                {isAdminSection ? "Admin Panel" : "Navigation"}
              </h2>
            </div>
            
            <nav className="mt-4 px-2">
              {/* Common Navigation Links */}
              {!isAdminSection && (
                <>
                  <Link
                    to="/app/dashboard"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/app/dashboard')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  {/* Student Specific Navigation */}
                  {userRole === "student" && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                        Helpdesk
                      </div>
                      <Link
                        to="/app/submit-ticket"
                        className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                          isActive('/app/submit-ticket')
                            ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                            : 'text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        Buat Tiket Baru
                      </Link>
                      <Link
                        to="/app/my-tickets"
                        className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                          isActive('/app/my-tickets')
                            ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                            : 'text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        Tiket Saya
                      </Link>
                    </>
                  )}
                  
                  {/* Disposisi Specific Navigation */}
                  {userRole === "disposisi" && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                        Helpdesk
                      </div>
                      <Link
                        to="/app/disposisi-tickets"
                        className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                          isActive('/app/disposisi-tickets')
                            ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                            : 'text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        Kelola Tiket
                      </Link>
                    </>
                  )}

                  {/* Public Links untuk semua user */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                    Informasi
                  </div>
                  <Link
                    to="/contacts"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/contacts')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    Kontak Dosen
                  </Link>
                </>
              )}
              
              {/* Admin Navigation Links */}
              {isAdminSection && isAdmin() && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/admin/dashboard')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/admin/users')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    Manage Users
                  </Link>
                  
                  {/* Admin Ticket Management */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                    Helpdesk
                  </div>
                  <Link
                    to="/admin/tickets"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/admin/tickets')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    Manajemen Tiket
                  </Link>

                  {/* Admin Content Management */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                    Konten
                  </div>
                  <Link
                    to="/admin/contacts"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/admin/contacts')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    Kelola Kontak Dosen
                  </Link>
                  <Link
                    to="/admin/faqs"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/admin/faqs')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    Kelola FAQ
                  </Link>
                </>
              )}
              
              {/* Show link to switch between Admin/User views */}
              {isAdmin() && (
                <div className="border-t mt-4 pt-4">
                  <Link
                    to={isAdminSection ? "/app/dashboard" : "/admin/dashboard"}
                    className="block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg text-gray-700 hover:bg-gray-100"
                  >
                    {isAdminSection ? "Switch to User View" : "Switch to Admin View"}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 bg-gray-50 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;