// src/pages/FeaturesPage.jsx
import { useNavigate } from "react-router-dom";
import Button from "../components/forms/Button";

const FeaturesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <div className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Features</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Discover all the powerful features our platform has to offer
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center mb-20">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-10">
            <h2 className="text-3xl font-bold mb-4">User Authentication</h2>
            <p className="text-gray-700 mb-4">
              Our platform provides secure authentication specifically designed for Telkom University members. Students and lecturers can sign up using their official university email addresses, ensuring a trusted community.
            </p>
            <ul className="list-disc pl-5 text-gray-700 mb-6">
              <li>Role-based access control</li>
              <li>Secure password management</li>
              <li>Email domain verification</li>
              <li>Password recovery options</li>
            </ul>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center text-gray-500">
              <span className="text-lg">Feature Screenshot</span>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center mb-20">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pl-10">
            <h2 className="text-3xl font-bold mb-4">Resource Sharing</h2>
            <p className="text-gray-700 mb-4">
              Share and access academic resources seamlessly within the platform. From lecture notes to research papers, our system makes it easy to collaborate and learn together.
            </p>
            <ul className="list-disc pl-5 text-gray-700 mb-6">
              <li>Document uploading and organization</li>
              <li>Version control for shared files</li>
              <li>Access control and permissions</li>
              <li>Search and filtering capabilities</li>
            </ul>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center text-gray-500">
              <span className="text-lg">Feature Screenshot</span>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col md:flex-row items-center mb-20">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-10">
            <h2 className="text-3xl font-bold mb-4">Personalized Dashboard</h2>
            <p className="text-gray-700 mb-4">
              Every user gets a personalized dashboard tailored to their role and preferences. Students and lecturers can customize their experience to focus on what matters most to them.
            </p>
            <ul className="list-disc pl-5 text-gray-700 mb-6">
              <li>Customizable widgets</li>
              <li>Activity tracking and notifications</li>
              <li>Quick access to frequently used features</li>
              <li>Role-specific tools and information</li>
            </ul>
          </div>
          <div className="md:w-1/2">
            <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center text-gray-500">
              <span className="text-lg">Feature Screenshot</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={() => navigate("/auth")}
            className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold"
          >
            Try It Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;