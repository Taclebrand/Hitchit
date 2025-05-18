import React from 'react';
import BottomNavigation from './BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  return (
    <div className="relative min-h-screen bg-white pb-[82px]">
      <main className="relative h-full">
        {children}
      </main>
      {showNavigation && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;