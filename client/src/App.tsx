import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import Welcome from "@/pages/Welcome";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import ProfileSetup from "@/pages/ProfileSetup";
import DriverRegistration from "@/pages/DriverRegistration";
import DriverTracking from "@/pages/DriverTracking";
import MapboxDriverTracking from "@/pages/MapboxDriverTracking";
import RideHistory from "@/pages/RideHistory";
import RideDetails from "@/pages/RideDetails";
import ProgressReport from "@/pages/ProgressReport";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import CreateTrip from "@/pages/CreateTrip";
import SearchTrips from "@/pages/SearchTrips";
import Trips from "@/pages/Trips";
import DriverSignup from "@/pages/DriverSignup";
import Activity from "@/pages/Activity";
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
        <Route path="/driver-signup" component={DriverSignup} />
        <Route path="/driver-tracking" component={DriverTracking} />
        <Route path="/mapbox-tracking/:id" component={MapboxDriverTracking} />
        <Route path="/history" component={RideHistory} />
        <Route path="/ride-details/:id" component={RideDetails} />
        <Route path="/progress" component={ProgressReport} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route path="/create-trip" component={CreateTrip} />
        <Route path="/search-trips" component={SearchTrips} />
        <Route path="/trips" component={Trips} />
        <Route path="/activity" component={Activity} />
        <Route path="/mobile-test" component={MobileResponsiveTest} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
