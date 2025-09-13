import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/toaster";
import { registerServiceWorker, initializePWAInstallPrompt } from "./utils/pwa";
import { initMobileOptimizations } from "./utils/mobile-optimizations";

// Initialize PWA and mobile features
if (typeof window !== 'undefined') {
  // Register service worker for offline functionality
  registerServiceWorker();
  
  // Initialize PWA install prompt handling
  initializePWAInstallPrompt();
  
  // Initialize mobile-specific optimizations
  initMobileOptimizations();
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <App />
      <Toaster />
    </ThemeProvider>
  </QueryClientProvider>
);
