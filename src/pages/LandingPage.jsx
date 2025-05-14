// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";
import Button from "../components/forms/Button";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Welcome to My Capstone Project
            </h1>
            <p className="text-xl mb-8">
              A comprehensive platform for Telkom University students and lecturers
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => navigate("/auth")}
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold"
              >
                Get Started
              </Button>
              <Button
                onClick={() => navigate("/about")}
                className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-gray-600">
                Our platform provides an intuitive interface for all users, making it simple to navigate and use.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable</h3>
              <p className="text-gray-600">
                Tailor your experience with personalized settings and preferences based on your role.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
              <p className="text-gray-600">
                Our platform is built on modern technologies ensuring speed and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center text-gray-500">
                <span className="text-lg">Application Screenshot or Image</span>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <h2 className="text-3xl font-bold mb-6">About This Project</h2>
              <p className="text-gray-600 mb-4">
                This capstone project was developed as part of the curriculum at Telkom University. It aims to provide a comprehensive platform for students and lecturers to collaborate, share resources, and manage academic activities.
              </p>
              <p className="text-gray-600 mb-6">
                The application includes various features such as user authentication, role-based access control, and a responsive design for optimal user experience on all devices.
              </p>
              <Button
                onClick={() => navigate("/about")}
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Join our platform today and experience the benefits of our capstone project.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold"
          >
            Sign Up Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;