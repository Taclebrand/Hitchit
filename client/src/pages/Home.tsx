import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import MainApp from "@/components/MainApp";
import AppLayout from "@/components/AppLayout";
import RideConfirmationModal from "@/components/RideConfirmationModal";
import PackageConfirmationModal from "@/components/PackageConfirmationModal";

const Home = () => {
  const [showRideConfirmation, setShowRideConfirmation] = useState(false);
  const [showPackageConfirmation, setShowPackageConfirmation] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Handle OAuth callback tokens from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const authStatus = urlParams.get('auth');
    
    if (token && authStatus === 'success') {
      localStorage.setItem('authToken', token);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/home');
      return;
    }
    
    // Check if user is authenticated, redirect to auth if not
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setLocation("/auth");
    }
  }, [setLocation]);

  const handleBookRide = () => {
    setShowRideConfirmation(true);
  };

  const handleSendPackage = () => {
    setShowPackageConfirmation(true);
  };

  return (
    <AppLayout>
      <MainApp 
        onBookRide={handleBookRide} 
        onSendPackage={handleSendPackage} 
      />
      
      {showRideConfirmation && (
        <RideConfirmationModal 
          onClose={() => setShowRideConfirmation(false)} 
        />
      )}
      
      {showPackageConfirmation && (
        <PackageConfirmationModal 
          onClose={() => setShowPackageConfirmation(false)} 
        />
      )}
    </AppLayout>
  );
};

export default Home;
