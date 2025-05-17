import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import Welcome from "@/pages/Welcome";
import Home from "@/pages/Home";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    
    // Simulate splash screen delay
    setTimeout(() => {
      setInitializing(false);
    }, 2000);
  }, []);

  if (initializing) {
    return null;
  }

  return (
    <TooltipProvider>
      <Switch>
        <Route path="/" component={Welcome} />
        <Route path="/home" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
