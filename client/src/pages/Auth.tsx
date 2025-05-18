import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Registration from "@/components/Registration";
import OtpVerification from "@/components/OtpVerification";
import Splash from "@/components/Splash";
import SocialLogin from "@/components/SocialLogin";

const Auth = () => {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<"registration" | "verification" | "complete">("registration");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simulate splash screen
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRegistrationComplete = (phone: string) => {
    setPhoneNumber(phone);
    setCurrentStep("verification");
  };
  
  const handleGoogleLogin = () => {
    // In a real app, we would implement Google OAuth flow
    console.log("Google login clicked");
    // For demo purposes, simulate successful login
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("socialLogin", "google");
    setTimeout(() => {
      setLocation("/home");
    }, 500);
  };
  
  const handleAppleLogin = () => {
    // In a real app, we would implement Apple OAuth flow
    console.log("Apple login clicked");
    // For demo purposes, simulate successful login
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("socialLogin", "apple");
    setTimeout(() => {
      setLocation("/home");
    }, 500);
  };

  const handleVerificationComplete = () => {
    setCurrentStep("complete");
    // Store that user has completed registration
    localStorage.setItem("isAuthenticated", "true");
    // Redirect to home
    setTimeout(() => {
      setLocation("/home");
    }, 500);
  };

  const handleBack = () => {
    setCurrentStep("registration");
  };

  if (showSplash) {
    return <Splash />;
  }

  return (
    <>
      {currentStep === "registration" && (
        <Registration 
          onComplete={handleRegistrationComplete} 
          onGoogleLogin={handleGoogleLogin}
          onAppleLogin={handleAppleLogin}
        />
      )}
      
      {currentStep === "verification" && (
        <OtpVerification 
          phoneNumber={phoneNumber}
          onComplete={handleVerificationComplete}
          onBack={handleBack}
        />
      )}
    </>
  );
};

export default Auth;