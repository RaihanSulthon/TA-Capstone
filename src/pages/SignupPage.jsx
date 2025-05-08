// src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TextField from "../components/forms/TextField";
import Button from "../components/forms/Button";
import { registerUser } from "../Services/authService";
import { useAuth } from "../contexts/Authcontexts";

const SignupPage = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      const { name, email, password } = formData;
      const result = await registerUser(email, password, { name });

      if (result.success) {
        setCurrentUser(result.user);
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to create an account. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        
        <TextField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        
        <TextField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
        
        <TextField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        
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