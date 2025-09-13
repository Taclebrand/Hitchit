import React, { useState } from 'react';
import BottomNavigation from './BottomNavigation';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  const [showPWAPrompt, setShowPWAPrompt] = useState(true);

  return (
    <div className="relative min-h-screen bg-white pb-[82px]">
      {/* PWA Install Prompt - Top banner */}
      {showPWAPrompt && (
        <div className="sticky top-0 z-50 p-2 bg-white border-b">
          <PWAInstallPrompt onClose={() => setShowPWAPrompt(false)} />
        </div>
      )}
      
      <main className="relative h-full">
        {children}
      </main>
      {showNavigation && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;