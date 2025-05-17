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
    if (onboardingCompleted === "true") {
      setHasSeenOnboarding(true);
      // Skip to main app if onboarding has been completed
      setTimeout(() => {
        setLocation("/home");
      }, 2000);
    } else {
      // Hide splash screen after 2 seconds
      setTimeout(() => {
        setShowSplash(false);
      }, 2000);
    }
  }, [setLocation]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setHasSeenOnboarding(true);
    setLocation("/home");
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setLocation("/home");
  };

  if (showSplash) {
    return <Splash />;
  }

  return <Onboarding onComplete={handleOnboardingComplete} onSkip={handleSkip} />;
};

export default Welcome;
