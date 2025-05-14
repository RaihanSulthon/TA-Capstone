// src/layouts/LandingLayout.jsx
import { Outlet } from "react-router-dom";
import LandingNavbar from "../components/LandingNavbar";
import Footer from "../components/Footer";

const LandingLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default LandingLayout;