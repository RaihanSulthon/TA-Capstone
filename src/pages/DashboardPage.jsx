// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/Authcontexts";
import { db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome, {userData?.name || currentUser?.email}</h2>
        
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Account Information</h3>
          <p><strong>Email:</strong> {currentUser?.email}</p>
          <p><strong>Account created:</strong> {userData?.createdAt?.toDate().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;