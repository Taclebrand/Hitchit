import { Switch, Route } from "wouter";
import Welcome from "@/pages/Welcome";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Login from "@/pages/Login";
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
import AIFeatures from "@/pages/AIFeatures";
import SharedTrip from "@/pages/SharedTrip";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MobileResponsiveTest from "@/components/MobileResponsiveTest";
import { FirebaseSetupGuide } from "@/components/FirebaseSetupGuide";
import { DemoAccessibilityFeatures } from "@/components/DemoAccessibilityFeatures";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // Check if Firebase is properly configured
  const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                           import.meta.env.VITE_FIREBASE_PROJECT_ID && 
                           import.meta.env.VITE_FIREBASE_APP_ID;

  if (!hasFirebaseConfig) {
    return <FirebaseSetupGuide />;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Switch>
        <Route path="/demo-features" component={DemoAccessibilityFeatures} />
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Welcome} />
            <Route path="/auth" component={Auth} />
            <Route path="/login" component={Login} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/home" component={Home} />
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
            <Route path="/ai-features" component={AIFeatures} />
            <Route path="/mobile-test" component={MobileResponsiveTest} />
          </>
        )}
        <Route path="/shared-trip/:shareCode" component={SharedTrip} />
        <Route component={() => isAuthenticated ? <Home /> : <Welcome />} />
      </Switch>
    </TooltipProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

export default App;
