import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/Authcontexts";
import Navbar from "../components/Navbar";
import NavbarAdmin from "../components/admin/NavbarAdmin";

const MainLayout = () => {
  const { userRole, isAdmin } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Determine if admin section is active
  const isAdminSection = location.pathname.startsWith("/admin");

  // Check if a nav link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/app/dashboard") return "Dashboard";
    if (path === "/app/my-tickets") return "Tiket Saya";
    if (path === "/app/submit-ticket") return "Buat Tiket Baru";
    if (path.startsWith("/app/tickets/")) return "Detail Tiket";
    return "Dashboard"; // fallback
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Menu items configuration for admin
  const adminMenuItems = [
    {
      path: "/admin/dashboard",
      label: "Admin Dashboard",
      shortLabel: "Dashboard",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
        />
      ),
    },
    {
      path: "/admin/users",
      label: "Ticket Statistics",
      shortLabel: "Stats",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21.92 6.62a1 1 0 0 0-.54-.54A1 1 0 0 0 21 6h-5a1 1 0 0 0 0 2h2.59L13 13.59l-3.29-3.3a1 1 0 0 0-1.42 0l-6 6a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0L9 12.41l3.29 3.3a1 1 0 0 0 1.42 0L20 9.41V12a1 1 0 0 0 2 0V7a1 1 0 0 0-.08-.38"
        />
      ),
    },
    {
      path: "/admin/tickets",
      label: "Ticket Management",
      shortLabel: "Tickets",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
        />
      ),
    },
    {
      path: "/admin/contacts",
      label: "Contact Management",
      shortLabel: "Contacts",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      ),
    },
    {
      path: "/admin/faqs",
      label: "FAQ Management",
      shortLabel: "FAQ's",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminSection ? <NavbarAdmin /> : <Navbar />}

      <div className="flex flex-1">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-transparent backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Sidebar Navigation */}
        {userRole && (
          <div
            className={`
          fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-auto md:min-w-0 md:flex-shrink-0
          ${isSidebarOpen ? "translate-x-0 w-80" : "-translate-x-full"}
          ${
            isAdminSection
              ? `bg-gray-100 border-r border-gray-200 ${
                  isHovered ? "md:w-64" : "md:w-16"
                }`
              : `bg-white shadow-md ${isHovered ? "md:w-64" : "md:w-16"}`
          }
        `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            {/* Admin Sidebar */}
            {isAdminSection && isAdmin() ? (
              <div className="h-full flex flex-col">
                {/* Sidebar Header - Remove hamburger icon */}
                <div
                  className={`p-4 border-b border-gray-200 bg-white transition-all duration-300 ${
                    !isHovered && "md:p-2"
                  }`}>
                  <div
                    className={`flex items-center ${
                      !isHovered ? "justify-center" : ""
                    }`}>
                    {isHovered ? (
                      <h2 className="text-lg font-semibold text-gray-800 transition-opacity duration-300">
                        Admin Panel
                      </h2>
                    ) : (
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 mt-2 px-2 space-y-1">
                  {adminMenuItems.map((item) => (
                    <div key={item.path} className="relative">
                      <Link
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`group flex flex-col items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                          isActive(item.path)
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                        } ${
                          isHovered
                            ? "flex-row justify-start px-3"
                            : "flex-col justify-center"
                        }`}
                        title={!isHovered ? item.label : ""}>
                        <svg
                          className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                            isHovered ? "mr-3" : "mb-1"
                          } ${
                            isActive(item.path)
                              ? "text-blue-500"
                              : "text-gray-400 group-hover:text-gray-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          {item.icon}
                        </svg>

                        {isHovered ? (
                          <span className="transition-opacity duration-300 whitespace-nowrap">
                            {item.label}
                          </span>
                        ) : (
                          <span className="text-xs text-center leading-tight">
                            {item.shortLabel}
                          </span>
                        )}
                      </Link>
                    </div>
                  ))}

                  {/* Divider */}
                  <div className="border-t border-gray-300 my-4"></div>

                  {/* Switch to User View */}
                  <div className="relative">
                    <Link
                      to="/app/dashboard"
                      onClick={() => setIsSidebarOpen(false)}
                      className={`group flex flex-col items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 ${
                        isHovered
                          ? "flex-row justify-start px-3"
                          : "flex-col justify-center"
                      }`}
                      title={!isHovered ? "Switch to User View" : ""}>
                      <svg
                        className={`h-5 w-5 flex-shrink-0 transition-all duration-300 ${
                          isHovered ? "mr-3" : "mb-1"
                        } text-gray-400 group-hover:text-gray-500`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                      </svg>

                      {isHovered ? (
                        <span className="transition-opacity duration-300 whitespace-nowrap">
                          Switch to User View
                        </span>
                      ) : (
                        <span className="text-xs text-center leading-tight">
                          Switch
                        </span>
                      )}
                    </Link>
                  </div>
                </nav>
              </div>
            ) : (
              /* Regular User Sidebar */
              <div className="h-full">
                <div className="p-4 border-b border-gray-300">
                  {isHovered ? (
                    <h2 className="text-xl font-semibold">Navigation</h2>
                  ) : (
                    <div className="flex justify-center">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">N</span>
                      </div>
                    </div>
                  )}
                </div>

                <nav className="mt-4 px-2">
                  <Link
                    to="/app/dashboard"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive("/app/dashboard")
                        ? "bg-blue-100 text-blue-700 font-medium shadow-md"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}>
                    {isHovered ? "Dashboard" : "Dash"}
                  </Link>

                  {userRole === "student" && (
                    <>
                      <Link
                        to="/app/submit-ticket"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                          isActive("/app/submit-ticket")
                            ? "bg-blue-100 text-blue-700 font-medium shadow-md"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}>
                        {isHovered ? "Buat Tiket Baru" : "Buat"}
                      </Link>
                      <Link
                        to="/app/my-tickets"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                          isActive("/app/my-tickets")
                            ? "bg-blue-100 text-blue-700 font-medium shadow-md"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}>
                        {isHovered ? "Tiket Saya" : "Tiket"}
                      </Link>
                    </>
                  )}

                  <Link
                    to="/contacts"
                    className={`block px-4 py-2 rounded-md mb-2.5 transition-all duration-200 transform hover:translate-y-[-2px] hover:shadow-lg ${
                      isActive("/contacts")
                        ? "bg-blue-100 text-blue-700 font-medium shadow-md"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}>
                    {isHovered ? "Kontak Dosen" : "Kontak"}
                  </Link>

                  {isAdmin() && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsSidebarOpen(false)}
                      className="block px-4 py-2 rounded-md mb-2.5 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg text-gray-700 hover:bg-red-100">
                      {isHovered ? "Switch to Admin View" : "Admin"}
                    </Link>
                  )}
                </nav>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 md:p-4 p-2 min-w-0 overflow-x-hidden">
          {userRole && (
            <div className="md:hidden bg-white p-4 mb-4 rounded-lg shadow flex items-center justify-between max-w-full overflow-hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-900">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-lg font-semibold truncate">
                {isAdminSection ? "Admin Panel" : getPageTitle()}
              </h1>
              <div></div>
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
