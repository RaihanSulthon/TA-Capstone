import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Authcontexts";
import Button from "../components/forms/Button";
import ContactsSection from "../components/ContactsSection";
import FAQSection from "../components/FAQSection";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);

  // Refs for each section (removed featuresRef)
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const laakRef = useRef(null); // Added LAAK section ref
  const contactsRef = useRef(null);
  const faqRef = useRef(null);
  const contactRef = useRef(null);

  // Handle smooth scrolling
  const scrollToSection = (elementRef) => {
    setIsMobileMenuOpen(false);
    if(elementRef.current){
      window.scrollTo({
        top: elementRef.current.offsetTop - 80, // Adjust for navbar height
        behavior: "smooth",
      });
    }
  };

  // Updated useEffect for scroll event (removed features references)
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      
      // Set isScrolled to true if scrolled more than 10px, false otherwise
      setIsScrolled(scrollPosition > 10);
      
      // Check which section is in view (updated without features)
      if (
        homeRef.current &&
        aboutRef.current &&
        scrollPosition + 100 >= homeRef.current.offsetTop &&
        scrollPosition + 100 < aboutRef.current.offsetTop
      ) {
        setActiveSection("home");
      } else if (
        aboutRef.current &&
        laakRef.current &&
        scrollPosition + 100 >= aboutRef.current.offsetTop &&
        scrollPosition + 100 < laakRef.current.offsetTop
      ) {
        setActiveSection("about");
      } else if (
        laakRef.current &&
        contactsRef.current &&
        scrollPosition + 100 >= laakRef.current.offsetTop &&
        scrollPosition + 100 < contactsRef.current.offsetTop
      ) {
        setActiveSection("laak");
      } else if (
        contactsRef.current &&
        faqRef.current &&
        scrollPosition + 100 >= contactsRef.current.offsetTop &&
        scrollPosition + 100 < faqRef.current.offsetTop
      ) {
        setActiveSection("contacts");
      } else if (
        faqRef.current &&
        contactRef.current &&
        scrollPosition + 100 >= faqRef.current.offsetTop &&
        scrollPosition + 100 < contactRef.current.offsetTop
      ) {
        setActiveSection("faq");
      } else if (
        contactRef.current &&
        scrollPosition + 100 >= contactRef.current.offsetTop
      ) {
        setActiveSection("contact");
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    // Call handleScroll initially to set correct state
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Fixed Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] py-3 transition-all duration-200 ${
        isScrolled
        ? 'bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]'
        : 'bg-blue-600 text-white'
        }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => scrollToSection(homeRef)}
            >
              <svg
                className={`w-8 h-8 ${isScrolled ? `text-blue-600`: `text-white`}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className={`ml-2 text-xl font-bold transition-colors duration-300 ${
                isScrolled ? "text-gray-800" : "text-white"
                }`}>
                  My Capstone App
                  </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection(homeRef)}
                className={`font-medium transition-all duration-300 px-3 py-2 rounded hover:shadow-md ${
                  isScrolled 
                    ? 'text-gray-600 hover:text-blue-600 hover:shadow-blue-300'
                    : 'text-white hover:bg-white/10'
                } ${activeSection === "home" && (isScrolled ? "text-blue-600" : "font-semibold")}
                `}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className={`font-medium transition-all duration-300 px-3 py-2 rounded hover:shadow-md ${
                  isScrolled 
                    ? 'text-gray-600 hover:text-blue-600 hover:shadow-blue-300'
                    : 'text-white hover:bg-white/10'
                } ${activeSection === "about" && (isScrolled ? "text-blue-600" : "font-semibold")}
                `}
              >
                About
              </button>
              {/* LAAK Menu Item - replacing Features */}
              <button
                onClick={() => scrollToSection(laakRef)}
                className={`font-medium transition-all duration-300 px-3 py-2 rounded hover:shadow-md ${
                  isScrolled 
                    ? 'text-gray-600 hover:text-blue-600 hover:shadow-blue-300'
                    : 'text-white hover:bg-white/10'
                } ${activeSection === "laak" && (isScrolled ? "text-blue-600" : "font-semibold")}
                `}
              >
                LAAK
              </button>
              {/* Contact Dosen Menu Item */}
              <button
                onClick={() => scrollToSection(contactsRef)}
                className={`font-medium transition-all duration-300 px-3 py-2 rounded hover:shadow-md ${
                  isScrolled 
                    ? 'text-gray-600 hover:text-blue-600 hover:shadow-blue-300'
                    : 'text-white hover:bg-white/10'
                } ${activeSection === "contacts" && (isScrolled ? "text-blue-600" : "font-semibold")}
                `}
              >
                Dosen
              </button>
              {/* FAQ Menu Item */}
              <button
                onClick={() => scrollToSection(faqRef)}
                className={`font-medium transition-all duration-300 px-3 py-2 rounded hover:shadow-md ${
                  isScrolled 
                    ? 'text-gray-600 hover:text-blue-600 hover:shadow-blue-300'
                    : 'text-white hover:bg-white/10'
                } ${activeSection === "faq" && (isScrolled ? "text-blue-600" : "font-semibold")}
                `}
              >
                FAQ
              </button>
            </div>

            {/* Authentication Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <Button
                  onClick={() => navigate("/app/dashboard")}
                  className="bg-blue-600 border-1 border-blue-500 hover:bg-white hover:text-blue-600 px-5 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="bg-blue-600 border-1 border-blue-500 hover:bg-white hover:text-blue-600 px-5 py-2 rounded-lg font-semibold transition-colors duration-300"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/auth", { state: { initialTab: "signup" } });
                    }}
                    className="bg-blue-600 border-1 border-blue-500 hover:bg-white hover:text-blue-600 px-5 py-2 rounded-lg font-semibold transition-colors duration-300"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              <svg
                className={`w-6 h-6 ${isScrolled ? 'text-gray-800' : 'text-white'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => scrollToSection(homeRef)}
                className="block w-full text-left py-3 px-4 text-gray-800 hover:bg-gray-100"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="block w-full text-left py-3 px-4 text-gray-800 hover:bg-gray-100"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection(laakRef)}
                className="block w-full text-left py-3 px-4 text-gray-800 hover:bg-gray-100"
              >
                LAAK
              </button>
              <button
                onClick={() => scrollToSection(contactsRef)}
                className="block w-full text-left py-3 px-4 text-gray-800 hover:bg-gray-100"
              >
                Dosen
              </button>
              <button
                onClick={() => scrollToSection(faqRef)}
                className="block w-full text-left py-3 px-4 text-gray-800 hover:bg-gray-100"
              >
                FAQ
              </button>
              <div className="border-t border-gray-200 py-3 px-4">
                {isAuthenticated ? (
                  <Button
                    onClick={() => {
                      navigate("/app/dashboard");
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Dashboard
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => {
                        navigate("/auth");
                      }}
                      className="w-full py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      Log In
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/auth", { state: { initialTab: "signup" } });
                      }}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Home/Hero Section */}
      <section
        ref={homeRef}
        id="home"
        className="bg-blue-600 text-white py-20 pt-32"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Welcome to My Capstone Project
            </h1>
            <p className="text-xl mb-8">
              A comprehensive platform for Telkom University students and lecturers
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {isAuthenticated ? (
                // Show only the Dashboard button for logged-in users
                <Button
                  onClick={() => navigate("/app/dashboard")}
                  className="bg-blue-600 text-white border-2 border-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
                >
                  Go to Dashboard
                </Button>
              ) : (
                // Show both buttons for guests
                <>
                  <Button
                    onClick={() => navigate("/auth", { state: { initialTab: "signup" } })}
                    className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
                  >
                    Get Started
                  </Button>
                  <Button
                    onClick={() => scrollToSection(laakRef)}
                    className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
                  >
                    Learn More
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        ref={aboutRef}
        id="about"
        className="py-16"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center text-gray-500">
                <span className="text-lg">Application Screenshot</span>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <h2 className="text-3xl font-bold mb-6">About This Project</h2>
              <p className="text-gray-600 mb-4">
                This capstone project was developed as part of the curriculum at Telkom University. It aims to provide a comprehensive platform for students and organizations to collaborate, share resources, and manage academic activities.
              </p>
              <p className="text-gray-600 mb-6">
                The application includes various features such as user authentication, role-based access control, and a responsive design for optimal user experience on all devices.
              </p>
              {isAuthenticated ? (
                <Button
                  onClick={() => navigate("/app/dashboard")}
                  className="bg-blue-600 border-1 border-blue-500 hover:bg-white hover:text-blue-600 px-5 py-2 rounded-lg font-semibold transition-colors duration-300">
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/auth", { state: { initialTab: "signup" } })}
                  className="bg-blue-600 border-1 border-blue-500 hover:bg-white hover:text-blue-600 px-5 py-2 rounded-lg font-semibold transition-colors duration-300"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LAAK Info Section with borders like your second image */}
      <section
        ref={laakRef}
        id="laak-info"
        className="py-16 bg-blue-50"
      >
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Informasi LAAK FIF</h2>
            <p className="text-gray-600 mb-8">
              Akses informasi dan layanan administrasi akademik & kemahasiswaan Fakultas Informatika
            </p>
            <button
              onClick={() => navigate("/laak-info")}
              className="inline-flex items-center bg-blue-600 border-2 border-blue-500 hover:bg-white hover:text-blue-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-300"
            >
              Lihat Informasi LAAK
              <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Contacts Section - Uses updated ContactsSection component */}
      <div ref={contactsRef}>
        <ContactsSection />
      </div>

      {/* FAQ Section */}
      <div ref={faqRef}>
        <FAQSection />
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span className="ml-2 text-lg font-semibold">My Capstone App</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                A project by Telkom University students
              </p>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} My Capstone App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;