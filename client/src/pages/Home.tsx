import { useState } from "react";
import { useLocation } from "wouter";
import MainApp from "@/components/MainApp";
import RideConfirmationModal from "@/components/RideConfirmationModal";
import PackageConfirmationModal from "@/components/PackageConfirmationModal";

const Home = () => {
  const [showRideConfirmation, setShowRideConfirmation] = useState(false);
  const [showPackageConfirmation, setShowPackageConfirmation] = useState(false);
  const [, setLocation] = useLocation();

  const handleBookRide = () => {
    setShowRideConfirmation(true);
  };

  const handleSendPackage = () => {
    setShowPackageConfirmation(true);
  };

  return (
    <>
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
    </>
  );
};

export default Home;
