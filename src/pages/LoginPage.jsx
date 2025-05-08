// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TextField from "../components/forms/TextField";
import Button from "../components/forms/Button";
import Toast from "../components/ui/Toast";
import { loginUser } from "../services/authService";
import { useAuth } from "../contexts/Authcontexts";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "error" });
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear specific field error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };
  
  const validateField = (name, value) => {
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
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setFormErrors({ ...formErrors, [name]: error });
  };
  
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
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
    
    if (!validateForm()) {
      setToast({ 
        message: "Please fix the errors in the form",
        type: "error"
      });
      return;
    }

    setLoading(true);
    try {
      const { email, password } = formData;
      const result = await loginUser(email, password);

      if (result.success) {
        setToast({
          message: "Login successful!",
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
      const errorMsg = "Failed to log in. Please check your credentials.";
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
      <h2 className="text-2xl font-bold text-center mb-6">Log In</h2>
      
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
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={formErrors.email}
          required
          placeholder="Enter your Telkom University email"
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
      
      <p className="text-center mt-4">
        Don't have an account?{" "}
        <a
          href="/signup"
          className="text-blue-500 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            navigate("/signup");
          }}
        >
          Sign Up
        </a>
      </p>
    </div>
  );
};

export default LoginPage;