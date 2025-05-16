// src/pages/AccessDeniedPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContexts";

const AccessDeniedPage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="inline-flex rounded-full bg-red-100 p-4">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-base text-gray-600">
            Sorry, you don't have permission to access this page.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              to="/app/dashboard"
              className="inline-block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/"
              className="inline-block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-center text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;