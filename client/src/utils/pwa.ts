// PWA Registration and Installation Utils

export const registerServiceWorker = async (): Promise<void> => {
  // Only register service worker in production
  if (!isProductionEnvironment()) {
    console.log('Service Worker: Skipping registration in development mode');
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      registration.addEventListener('updatefound', () => {
        console.log('New service worker version found');
        
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, prompting user to refresh');
              // Could trigger a user notification here
            }
          });
        }
      });
      
      console.log('Service Worker registered successfully:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('Service Workers unregistered');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }
};

// PWA Install Prompt
let deferredPrompt: any = null;

export const initializePWAInstallPrompt = (): void => {
  // Only initialize PWA install prompt in production
  if (!isProductionEnvironment()) {
    console.log('PWA Install Prompt: Skipping initialization in development mode');
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e;
    console.log('PWA install prompt available');
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
  });
};

export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      return true;
    } else {
      console.log('User dismissed the PWA install prompt');
      return false;
    }
  } catch (error) {
    console.error('Error showing PWA install prompt:', error);
    return false;
  } finally {
    deferredPrompt = null;
  }
};

export const isPWAInstallable = (): boolean => {
  return deferredPrompt !== null;
};

export const isPWAInstalled = (): boolean => {
  // Check if running in standalone mode (installed PWA)
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

// PWA Update Check
export const checkForPWAUpdate = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return registration.waiting !== null;
      }
    } catch (error) {
      console.error('Error checking for PWA update:', error);
    }
  }
  return false;
};

// Check if running in production environment
export const isProductionEnvironment = (): boolean => {
  return import.meta.env.PROD;
};

// Check if PWA features should be enabled
export const isPWAEnabled = (): boolean => {
  return isProductionEnvironment() && 'serviceWorker' in navigator;
};

// Utility to get PWA display mode
export const getPWADisplayMode = (): string => {
  if (isPWAInstalled()) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  return 'browser';
};

// Enhanced PWA status info for debugging
export const getPWAStatus = () => {
  return {
    isProduction: isProductionEnvironment(),
    serviceWorkerSupported: 'serviceWorker' in navigator,
    isInstallable: isPWAInstallable(),
    isInstalled: isPWAInstalled(),
    displayMode: getPWADisplayMode(),
    pwaDeferredPrompt: deferredPrompt !== null,
  };
};