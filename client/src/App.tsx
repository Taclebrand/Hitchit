import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import Welcome from "@/pages/Welcome";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import ProfileSetup from "@/pages/ProfileSetup";
import DriverRegistration from "@/pages/DriverRegistration";
import DriverTracking from "@/pages/DriverTracking";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MobileResponsiveTest from "@/components/MobileResponsiveTest";

function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  if (initializing) {
    return null;
  }

  return (
    <TooltipProvider>
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/home" component={Home} />
        <Route path="/auth" component={Auth} />
        <Route path="/profile-setup" component={ProfileSetup} />
        <Route path="/driver-registration" component={DriverRegistration} />
        <Route path="/driver-tracking" component={DriverTracking} />
        <Route path="/mobile-test" component={MobileResponsiveTest} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
