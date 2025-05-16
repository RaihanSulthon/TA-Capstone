// src/layouts/MainLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContexts";
import Navbar from "../components/Navbar";
import NavbarAdmin from "../components/NavbarAdmin";

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
                    className={`block px-4 py-2 rounded-md mb-1 ${
                      isActive('/app/dashboard')
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              
              {/* Admin Navigation Links */}
              {isAdminSection && isAdmin() && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`block px-4 py-2 rounded-md mb-1 ${
                      isActive('/admin/dashboard')
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`block px-4 py-2 rounded-md mb-1 ${
                      isActive('/admin/users')
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Manage Users
                  </Link>
                </>
              )}
              
              {/* Show link to switch between Admin/User views */}
              {isAdmin() && (
                <div className="border-t mt-4 pt-4">
                  <Link
                    to={isAdminSection ? "/app/dashboard" : "/admin/dashboard"}
                    className="block px-4 py-2 rounded-md mb-1 text-gray-700 hover:bg-gray-100"
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