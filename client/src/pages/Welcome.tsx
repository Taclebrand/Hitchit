import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Splash from "@/components/Splash";
import Onboarding from "@/components/Onboarding";

const Welcome = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [, setLocation] = useLocation();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding before
    const onboardingCompleted = localStorage.getItem("hasSeenOnboarding");
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    
    if (onboardingCompleted === "true") {
      setHasSeenOnboarding(true);
      
      // Skip to main app if onboarding has been completed and user is authenticated
      if (isAuthenticated === "true") {
        setTimeout(() => {
          setLocation("/home");
        }, 2000);
      } else {
        // Skip to auth if onboarding is done but user is not authenticated
        setTimeout(() => {
          setLocation("/auth");
        }, 2000);
      }
    } else {
      // Hide splash screen after 2 seconds to show onboarding
      setTimeout(() => {
        setShowSplash(false);
      }, 2000);
    }
  }, [setLocation]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setHasSeenOnboarding(true);
    // Send to auth after onboarding is complete
    setLocation("/auth");
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    // Send to auth after skipping onboarding
    setLocation("/auth");
  };

  if (showSplash) {
    return <Splash />;
  }

  return <Onboarding onComplete={handleOnboardingComplete} onSkip={handleSkip} />;
};

export default Welcome;
