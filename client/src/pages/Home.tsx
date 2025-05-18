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
    // Check if user is authenticated, redirect to auth if not
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
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
