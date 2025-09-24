import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/Authcontexts";
import Navbar from "../components/Navbar";
import NavbarAdmin from "../components/admin/NavbarAdmin";

const MainLayout = () => {
  const { userRole, isAdmin } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Expanded = hover (desktop) atau dibuka (mobile)
  const isExpanded = isHovered || isSidebarOpen;

  const isAdminSection = location.pathname.startsWith("/admin");
  const isActive = (path) => location.pathname === path;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/app/dashboard") return "Dashboard";
    if (path === "/app/my-tickets") return "Tiket Saya";
    if (path === "/app/submit-ticket") return "Buat Tiket Baru";
    if (path.startsWith("/app/tickets/")) return "Detail Tiket";
    return "Dashboard";
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Admin menu
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

  // User menu
  const userMenuItems = [
    {
      path: "/app/dashboard",
      label: "Dashboard",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7m-9 8h4m5-6v7a2 2 0 01-2 2h-3m-6 0H7a2 2 0 01-2-2v-7"
        />
      ),
    },
    {
      path: "/app/contacts",
      label: "Kontak Dosen",
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
      path: "/app/submit-ticket",
      label: "Buat Tiket Baru",
      studentOnly: true,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 4v16m8-8H4"
        />
      ),
    },
    {
      path: "/app/my-tickets",
      label: "Tiket Saya",
      studentOnly: true,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 6h8M8 10h8m-5 4h5m2 4H6a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z"
        />
      ),
    },
    {
      path: "/admin/dashboard",
      label: "Switch to Admin View",
      adminOnly: true,
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {isAdminSection ? <NavbarAdmin /> : <Navbar />}

      <div className="flex flex-1 bg-white">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {userRole && (
          <div
            className={`
            fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
            md:relative md:translate-x-0 md:z-auto md:min-w-0 md:flex-shrink-0
            ${isSidebarOpen ? "translate-x-0 w-80" : "-translate-x-full"}
            ${isExpanded ? "md:w-64" : "md:w-16"}
            bg-white border-r border-gray-200 rounded-tr-3xl overflow-y-auto
          `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isAdminSection && isAdmin() ? (
              <div className="h-full flex flex-col">
                <div
                  className={`${
                    isExpanded ? "p-6" : "p-2"
                  } border-b border-gray-200 bg-gray-50 transition-all duration-300`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`${
                        isExpanded ? "w-16 h-16" : "w-10 h-10"
                      } bg-blue-600 rounded-full ${
                        isExpanded ? "mb-3" : "mb-1"
                      } flex items-center justify-center transition-all duration-300`}
                    >
                      <span
                        className={`${
                          isExpanded ? "text-lg" : "text-sm"
                        } font-bold text-white transition-all duration-300`}
                      >
                        A
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="transition-opacity duration-300">
                        <h2 className="text-gray-800 font-bold text-sm mb-1">
                          Admin Panel
                        </h2>
                        <div className="text-xs text-blue-800 font-bold mb-2 bg-blue-100 px-2 py-1 rounded">
                          ADMIN
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <nav className="flex-1 px-4 space-y-6 overflow-y-auto bg-white">
                  <div>
                    {isExpanded && (
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-800 tracking-wide mt-4">
                          ADMIN MANAGEMENT
                        </h2>
                      </div>
                    )}
                    <div className="space-y-2">
                      {adminMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={!isExpanded ? item.label : undefined}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`w-full flex items-center ${
                            isExpanded
                              ? "justify-between px-4 py-3 rounded-lg"
                              : "justify-center px-5 py-2 rounded-lg"
                          } transition-all duration-300 mt-4 ${
                            isActive(item.path)
                              ? `${
                                  isExpanded
                                    ? "bg-blue-100 text-gray-800 shadow-md"
                                    : "bg-blue-100 text-gray-800"
                                }`
                              : `${
                                  isExpanded
                                    ? "bg-white hover:bg-gray-100"
                                    : "bg-white hover:bg-gray-100"
                                }`
                          }`}
                        >
                          {isExpanded ? (
                            <div className="flex items-center space-x-3">
                              <div
                                className={`${
                                  isActive(item.path)
                                    ? "text-gray-800"
                                    : "text-gray-600"
                                } flex-shrink-0`}
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  {item.icon}
                                </svg>
                              </div>
                              <span
                                className={`text-base font-medium ${
                                  isActive(item.path)
                                    ? "text-gray-800"
                                    : "text-gray-800"
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`${
                                isActive(item.path)
                                  ? "text-gray-800"
                                  : "text-gray-600"
                              }`}
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                {item.icon}
                              </svg>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 my-4" />

                  <div className="pb-4 space-y-2">
                    <Link
                      to="/app/dashboard"
                      title={!isExpanded ? "Switch to User View" : undefined}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`w-full flex items-center ${
                        isExpanded
                          ? "justify-between px-4 py-3 rounded-lg"
                          : "justify-center px-5 py-2 rounded-lg"
                      } transition-all duration-300 ${
                        isExpanded
                          ? "bg-white hover:bg-gray-100"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {isExpanded ? (
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-600 flex-shrink-0">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                              />
                            </svg>
                          </div>
                          <span className="text-base font-medium text-gray-800">
                            Switch to User View
                          </span>
                        </div>
                      ) : (
                        <div className="text-gray-600">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                            />
                          </svg>
                        </div>
                      )}
                    </Link>
                  </div>
                </nav>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div
                  className={`${
                    isExpanded ? "p-6" : "p-2"
                  } border-b border-gray-200 transition-all duration-300`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`${
                        isExpanded ? "w-16 h-16" : "w-10 h-10"
                      } bg-blue-600 rounded-full ${
                        isExpanded ? "mb-3" : "mb-1"
                      } flex items-center justify-center transition-all duration-300`}
                    >
                      <span
                        className={`${
                          isExpanded ? "text-lg" : "text-sm"
                        } font-bold text-white transition-all duration-300`}
                      >
                        N
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="transition-opacity duration-300">
                        <h2 className="text-gray-800 font-bold text-sm mb-1">
                          Navigation
                        </h2>
                        <div className="text-xs text-blue-800 font-bold mb-2 bg-blue-100 px-2 py-1 rounded">
                          USER
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <nav className="flex-1 px-4 space-y-6 overflow-y-auto bg-white">
                  <div>
                    {isExpanded && (
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-800 tracking-wide mt-4">
                          USER NAVIGATION
                        </h2>
                      </div>
                    )}
                    <div className="space-y-2">
                      {userMenuItems.map((item) => {
                        if (item.studentOnly && userRole !== "student")
                          return null;
                        if (item.adminOnly && !isAdmin()) return null;
                        if (item.hideForAdmin && isAdmin()) return null;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            title={!isExpanded ? item.label : undefined}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`w-full flex items-center ${
                              isExpanded
                                ? "justify-between px-4 py-3 rounded-lg"
                                : "justify-center px-5 py-2 rounded-lg"
                            } transition-all duration-300 mt-4 ${
                              isActive(item.path)
                                ? `${
                                    isExpanded
                                      ? "bg-blue-100 text-gray-800 shadow-md"
                                      : "bg-blue-100 text-gray-800"
                                  }`
                                : `${
                                    isExpanded
                                      ? "bg-white hover:bg-gray-100"
                                      : "bg-white hover:bg-gray-100"
                                  }`
                            }`}
                          >
                            {isExpanded ? (
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`${
                                    isActive(item.path)
                                      ? "text-gray-800"
                                      : "text-gray-600"
                                  } flex-shrink-0`}
                                >
                                  <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    {item.icon}
                                  </svg>
                                </div>
                                <span
                                  className={`text-base font-medium ${
                                    isActive(item.path)
                                      ? "text-gray-800"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </div>
                            ) : (
                              <div
                                className={`${
                                  isActive(item.path)
                                    ? "text-gray-800"
                                    : "text-gray-600"
                                }`}
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  {item.icon}
                                </svg>
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </nav>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 bg-white min-w-0 overflow-x-hidden">
          {/* Mobile header */}
          {userRole && (
            <div className="md:hidden bg-white p-4 mb-4 mx-2 rounded-lg shadow flex items-center justify-between max-w-full overflow-hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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

          {/* Main content area - GANTI BACKGROUND JADI PUTIH */}
          <div className="p-4 md:p-6 bg-white min-h-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
