import React from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { HomeIcon, MapPinIcon, HistoryIcon, UserIcon } from '@/lib/icons';

const BottomNavigation: React.FC = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[82px] bg-white border-t border-gray-200 safe-area-bottom px-6 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between h-full">
        <NavItem 
          icon={<HomeIcon width={24} height={24} />}
          label="Home"
          to="/home"
          active={isActive('/home')}
        />
        <NavItem 
          icon={<MapPinIcon width={24} height={24} />}
          label="Activity"
          to="/activity"
          active={isActive('/activity')}
        />
        <NavItem 
          icon={<HistoryIcon width={24} height={24} />}
          label="History"
          to="/history"
          active={isActive('/history')}
        />
        <NavItem 
          icon={<UserIcon width={24} height={24} />}
          label="Profile"
          to="/profile"
          active={isActive('/profile')}
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, active }) => {
  return (
    <Link href={to}>
      <a className="flex flex-col items-center justify-center w-16 h-full cursor-pointer">
        <div className={cn(
          "flex items-center justify-center h-6 mb-1 transition-colors",
          active ? "text-primary" : "text-gray-500"
        )}>
          {icon}
        </div>
        <span className={cn(
          "text-xs font-medium transition-colors",
          active ? "text-primary" : "text-gray-500"
        )}>
          {label}
        </span>
      </a>
    </Link>
  );
};

export default BottomNavigation;