// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TextField from "../../components/forms/TextField";
import Button from "../../components/forms/Button";
import Toast from "../../components/Toast";
import { registerUser, loginUser } from "../../Services/authService";
import { useAuth } from "../../contexts/Authcontexts";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useAuth();
  const initialTab = location.state?.initialTab === "signup" ? false: true;
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "error" });
  const [isAnimating, setIsAnimating] = useState(false);
  const initialLoginMode = location.state?.initialTab !== "signup";
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Form errors
  const [loginErrors, setLoginErrors] = useState({
    email: "",
    password: ""
  });
  
  const [signupErrors, setSignupErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Clear toast after timeout
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: "", type: "error" });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(()=> {
    if(location.state?.initialTab === "signup"){
      setIsLoginMode(false);
    }
  },[location.state])

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
    setToast({ message: "", type: "error" });
    
    setTimeout(() => {
        setIsLoginMode(!isLoginMode);
        setIsAnimating(false);
      }, 300);
  };

  // Handle login form change
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    
    if (loginErrors[name]) {
      setLoginErrors({ ...loginErrors, [name]: "" });
    }
  };
  
  // Handle signup form change
  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData({ ...signupData, [name]: value });
    
    if (signupErrors[name]) {
      setSignupErrors({ ...signupErrors, [name]: "" });
    }
  };
  
  // Validate login fields
  const validateLoginField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "email":
        if (!value) {
          error = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Email is invalid";
        }
        break;
        
      case "password":
        if (!value) {
          error = "Password is required";
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };
  
  // Validate signup fields
  const validateSignupField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "name":
        if (!value) {
          error = "Full Name is required";
        } else if (value.length > 50) {
          error = "Full Name cannot exceed 50 characters";
        }
        break;
        
        case "email":
        if (!value) {
          error = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Email is invalid";
        } else if (
          !value.endsWith("@student.telkomuniversity.ac.id") && 
          !value.endsWith("@telkomuniversity.ac.id") &&
          !value.endsWith("@adminhelpdesk.ac.id")
        ) {
          error = "Email must contain (@student.telkomuniversity.ac.id, @telkomuniversity.ac.id, or @adminhelpdesk.ac.id)";
        }
        break;
        
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        }
        break;
        
      case "confirmPassword":
        if (!value) {
          error = "Please confirm your password";
        } else if (value !== signupData.password) {
          error = "Passwords do not match";
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };
  
  // Handle login field blur
  const handleLoginBlur = (e) => {
    const { name, value } = e.target;
    const error = validateLoginField(name, value);
    
    setLoginErrors({ ...loginErrors, [name]: error });
  };
  
  // Handle signup field blur
  const handleSignupBlur = (e) => {
    const { name, value } = e.target;
    const error = validateSignupField(name, value);
    
    setSignupErrors({ ...signupErrors, [name]: error });
    
    // Show toast for password validation
    if (name === "password" && error) {
      setToast({ message: error, type: "warning" });
    }
    
    // Show toast for confirmPassword validation
    if (name === "confirmPassword" && error) {
      setToast({ message: error, type: "warning" });
    }
  };
  
  // Validate login form
  const validateLoginForm = () => {
    const errors = {};
    let isValid = true;
    
    Object.keys(loginData).forEach(key => {
      const error = validateLoginField(key, loginData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });
    
    setLoginErrors(errors);
    return isValid;
  };
  
  // Validate signup form
  const validateSignupForm = () => {
    const errors = {};
    let isValid = true;
    
    Object.keys(signupData).forEach(key => {
      const error = validateSignupField(key, signupData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });
    
    setSignupErrors(errors);
    return isValid;
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateLoginForm()) {
      setToast({ 
        message: "Incorrect Email or Password",
        type: "error"
      });
      return;
    }
  
    setLoading(true);
    try {
      const { email, password } = loginData;
      const result = await loginUser(email, password);
  
      if (result.success) {
        // Tambahkan log untuk debugging
        console.log("Login successful, user object:", result.user);
        
        // Set user di context
        setCurrentUser(result.user);
        
        // Tampilkan pesan sukses
        setToast({
          message: "Login successful!",
          type: "success"
        });
        
        // PERBAIKAN: Menggunakan path yang benar berdasarkan App.jsx
        setTimeout(() => {
          console.log("Navigating to app/dashboard...");
          navigate("/app/dashboard", { replace: true });
        }, 500);
      } else {
        setError(result.error);
        setToast({
          message: result.error,
          type: "error"
        });
      }
    } catch (error) {
      const errorMsg = "Failed to log in. Please check your credentials.";
      setError(errorMsg);
      setToast({
        message: errorMsg,
        type: "error"
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle signup submission
  const handleSignupSubmit = async (e) => {
  e.preventDefault();
  setError("");
  
  if (!validateSignupForm()) {
    setToast({ 
      message: "Please fix the errors in the form",
      type: "error"
    });
    return;
  }

  setLoading(true);
  try {
    const { name, email, password } = signupData;
    const result = await registerUser(email, password, { name });

    if (result.success) {
      setToast({
        message: "Account created successfully!",
        type: "success"
      });
      setCurrentUser(result.user);
      
      // PERBAIKAN: Path yang benar untuk signup juga
      setTimeout(() => {
        console.log("Account created, navigating to app/dashboard...");
        navigate("/app/dashboard", { replace: true });
      }, 500);
    } else {
      setError(result.error);
      setToast({
        message: result.error,
        type: "error"
      });
    }
  } catch (error) {
    const errorMsg = "Failed to create an account. Please try again.";
    setError(errorMsg);
    setToast({
      message: errorMsg,
      type: "error"
    });
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return(
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 mt-5 bg-white rounded-lg shadow-md relative">
        {/* Back Button */}
        <button 
        onClick={() => navigate('/')}
        className="absolute p-1 rounded-full border border-gray-300 shadow-sm bg-white hover:bg-blue-500 transition-all duration-300 group"
        aria-label="Back to home"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-blue-500 group-hover:text-white transition-colors duration-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
      </button>
        {/* Form header */}
        <h2 className="text-3xl font-bold text-center mb-6">
          {isLoginMode ? "Login" : "Create an Account"}
        </h2>
        <div className="flex border-b mb-6">
          <button
            className={`w-1/2 py-2 text-center transition-colors duration-300 ${
              isLoginMode
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => !isLoginMode && toggleAuthMode()}
            type="button"
            disabled={isAnimating}
          >
            Login
          </button>
          <button
            className={`w-1/2 py-2 text-center transition-colors duration-300 ${
              !isLoginMode
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => isLoginMode && toggleAuthMode()}
            type="button"
            disabled={isAnimating}
          >
            Sign Up
          </button>
        </div>
  
        {/* Toast notifications */}
        {toast.message && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ message: "", type: "error" })} 
          />
        )}
  
        {/* Main error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
  
        {/* Form container with animation */}
        <div 
          className={`transform transition-all duration-300 ease-in-out ${
            isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {isLoginMode ? (
            <form onSubmit={handleLoginSubmit} noValidate>
              <TextField
                label="Email"
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                onBlur={handleLoginBlur}
                error={loginErrors.email}
                required
                placeholder="Enter your email"
              />
  
              <TextField
                label="Password"
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                onBlur={handleLoginBlur}
                error={loginErrors.password}
                required
                placeholder="Enter your password"
              />
  
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? "Logging In..." : "Log In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} noValidate>
              <TextField
                label="Full Name"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
                onBlur={handleSignupBlur}
                error={signupErrors.name}
                required
                maxLength={50}
                placeholder="Enter your full name"
              />
  
              <TextField
                label="Email"
                type="email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                onBlur={handleSignupBlur}
                error={signupErrors.email}
                required
                placeholder="yourname@student.telkomuniversity.ac.id"
              />
  
              <TextField
                label="Password"
                type="password"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                onBlur={handleSignupBlur}
                error={signupErrors.password}
                required
                placeholder="Min. 6 characters"
              />
  
              <TextField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                onBlur={handleSignupBlur}
                error={signupErrors.confirmPassword}
                required
                placeholder="Re-enter your password"
              />
  
              <div className="mt-2 mb-4 text-sm text-gray-600">
                <ul className="list-disc list-inside">
                  <li>Password must be at least 6 characters</li>
                  <li>Email must be a valid Telkom University email</li>
                </ul>
              </div>
  
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          )}
        </div>
  
        <div className="text-center mt-4">
          {isLoginMode ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={toggleAuthMode}
                className="text-blue-500 hover:underline transition-colors duration-300"
                type="button"
                disabled={isAnimating}
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={toggleAuthMode}
                className="text-blue-500 hover:underline transition-colors duration-300"
                type="button"
                disabled={isAnimating}
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
};

export default AuthPage;