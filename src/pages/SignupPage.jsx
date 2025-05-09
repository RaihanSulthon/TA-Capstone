// src/pages/SignupPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TextField from "../components/forms/TextField";
import Button from "../components/forms/Button";
import Toast from "../components/ui/Toast";
import { registerUser } from "../services/AuthService";
import { useAuth } from "../contexts/AuthContexts";

const SignupPage = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "error" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Form errors state
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Clear toast after 5 seconds
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => {
        setToast({ message: "", type: "error" });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear specific field error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };
  
  // Validate a specific field
  const validateField = (name, value) => {
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
          value !== "admin@capstone.ac.id"
        ) {
          error = "Email must be from Telkom University (@student.telkomuniversity.ac.id for students, @telkomuniversity.ac.id for lecturers)";
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
        } else if (value !== formData.password) {
          error = "Passwords do not match";
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };
  
  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setFormErrors({ ...formErrors, [name]: error });

    if(name === "password" && error && name !== "confirmPassword"){
      setToast({
        message: error,
        type: "warning"
      });
    }
  };

  // Validate all form fields
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Validate each field
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate form before submission
    if (!validateForm()) {
      setToast({ 
        message: "Please fix the errors in the form",
        type: "error"
      });
      return;
    }

    setLoading(true);
    try {
      const { name, email, password } = formData;
      const result = await registerUser(email, password, { name });

      if (result.success) {
        setToast({
          message: "Account created successfully!",
          type: "success"
        });
        setCurrentUser(result.user);
        navigate("/dashboard");
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

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
      
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
      
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={formErrors.name}
          required
          maxLength={50}
          placeholder="Enter your full name"
        />
        
        <TextField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={formErrors.email}
          required
          placeholder="yourname@student.telkomuniversity.ac.id"
        />
        
        <TextField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={formErrors.password}
          required
          placeholder="Min. 6 characters"
        />
        
        <TextField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={formErrors.confirmPassword}
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
      
      <p className="text-center mt-4">
        Already have an account?{" "}
        <a
          href="/login"
          className="text-blue-500 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            navigate("/login");
          }}
        >
          Log In
        </a>
      </p>
    </div>
  );
};

export default SignupPage;