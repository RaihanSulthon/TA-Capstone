import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/Authcontexts";
import Navbar from "../components/Navbar";
import NavbarAdmin from "../components/admin/NavbarAdmin";

const MainLayout = () => {
  const { userRole, isAdmin } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Determine if admin section is active
  const isAdminSection = location.pathname.startsWith('/admin');

  // Check if a nav link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/app/dashboard') return 'Dashboard';
    if (path === '/app/my-tickets') return 'Tiket Saya';
    if (path === '/app/submit-ticket') return 'Buat Tiket Baru';
    if (path.startsWith('/app/tickets/')) return 'Detail Tiket';
    return 'Dashboard'; // fallback
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminSection ? <NavbarAdmin /> : <Navbar />}
      
      <div className="flex flex-1">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-transparent backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar Navigation */}
        {userRole && (
          <div className={`
            bg-white shadow-md fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:z-auto md:w-64 md:min-w-0 md:flex-shrink-0
            ${isSidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-64'}
          `}>
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
                    onClick={() => setIsSidebarOpen(false)}
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
                        onClick={() => setIsSidebarOpen(false)}
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
                        onClick={() => setIsSidebarOpen(false)}
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
                    onClick={() => setIsSidebarOpen(false)}
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
                    Ticket Statistics
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
                    Ticket Management
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
                    Contact Management
                  </Link>
                  <Link
                    to="/admin/faqs"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive('/admin/faqs')
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-md'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    FAQ Management
                  </Link>
                </>
              )}
              
              {/* Show link to switch between Admin/User views */}
              {isAdmin() && (
                <div className="border-t mt-4 pt-4">
                  <Link
                  to={isAdminSection ? "/app/dashboard" : "/admin/dashboard"}
                  onClick={() => setIsSidebarOpen(false)}
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
        <div className="flex-1 bg-gray-50 md:p-4 p-2 min-w-0 overflow-x-hidden">
          {/* Mobile Header dengan Hamburger */}
          {userRole && (
            <div className="md:hidden bg-white p-4 mb-4 rounded-lg shadow flex items-center justify-between max-w-full overflow-hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold truncate">
                {isAdminSection ? "Admin Panel" : getPageTitle()}
              </h1>
              <div></div> {/* Spacer untuk center alignment */}
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;