import React from "react";
import { useLocation } from "wouter";
import DriverRegistrationOptions from "@/components/DriverRegistrationOptions";

const DriverRegistration: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleComplete = () => {
    // In a real app, you would save the driver options to the backend here
    setLocation("/home");
  };

  const handleSkip = () => {
    setLocation("/home");
  };

  return (
    <DriverRegistrationOptions 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
};

export default DriverRegistration;