// src/pages/AboutPage.jsx
import { useNavigate } from "react-router-dom";
import Button from "../components/forms/Button";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <div className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">About Our Project</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Learn more about the team and vision behind this Capstone Project
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-gray-700 mb-8">
            This Capstone Project was developed as part of our curriculum at Telkom University. Our mission is to create a comprehensive platform that serves the specific needs of the university community, enhancing collaboration between students and lecturers.
          </p>

          <h2 className="text-3xl font-bold mb-6">The Team</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold">Team Member 1</h3>
              <p className="text-gray-600">Role Description</p>
            </div>
            
            {/* Team Member 2 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold">Team Member 2</h3>
              <p className="text-gray-600">Role Description</p>
            </div>
            
            {/* Team Member 3 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold">Team Member 3</h3>
              <p className="text-gray-600">Role Description</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6">Our Journey</h2>
          <p className="text-gray-700 mb-6">
            The development of this project began as a response to the challenges faced by students and lecturers in managing academic activities. We conducted extensive research, gathering feedback from potential users to ensure our solution addresses real needs.
          </p>
          <p className="text-gray-700 mb-12">
            Through several iterations and testing phases, we've refined our platform to provide a seamless user experience while maintaining the highest standards of security and performance.
          </p>

          <div className="text-center">
            <Button
              onClick={() => navigate("/auth")}
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold"
            >
              Join Our Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;