// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TextField from "../components/forms/Textfield";
import Button from "../components/forms/Button";
import { loginUser } from "../Services/authService";
import { useAuth } from "../contexts/Authcontexts";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { email, password } = formData;
      const result = await loginUser(email, password);

      if (result.success) {
        setCurrentUser(result.user);
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("Failed to log in. Please check your credentials.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Log In</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
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