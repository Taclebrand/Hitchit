import { useState } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import RideContent from "@/components/RideContent";
import PackageContent from "@/components/PackageContent";
import NavigationBar from "@/components/NavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  UserIcon, 
  NotificationIcon, 
  SettingsIcon,
  CarIcon
} from "@/lib/icons";

interface MainAppProps {
  onBookRide: () => void;
  onSendPackage: () => void;
}

const MainApp = ({ onBookRide, onSendPackage }: MainAppProps) => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"ride" | "package" | "driver">("ride");
  const { currentUser } = useAuth();

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get user's display name or first name from email
  const getUserName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName.split(' ')[0]; // Use first name only
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0]; // Use email prefix if no display name
    }
    return "User";
  };

  const handleTabChange = (tab: "ride" | "package" | "driver") => {
    if (tab === "driver") {
      // Navigate to the driver signup page
      setLocation("/driver-signup");
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs opacity-80">{getGreeting()}</p>
            <h3 className="font-medium">{getUserName()}</h3>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <NotificationIcon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Service Type Toggle */}
      <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex bg-neutral-100 rounded-full p-1">
          <button 
            onClick={() => handleTabChange("ride")}
            className={`flex-1 py-3 px-3 rounded-full text-center font-medium transition-all ${
              activeTab === "ride" 
                ? "bg-white text-neutral-800 shadow" 
                : "text-neutral-500"
            }`}
          >
            Ride
          </button>
          <button 
            onClick={() => handleTabChange("package")}
            className={`flex-1 py-3 px-3 rounded-full text-center font-medium transition-all ${
              activeTab === "package" 
                ? "bg-white text-neutral-800 shadow" 
                : "text-neutral-500"
            }`}
          >
            Package
          </button>
          <button 
            onClick={() => handleTabChange("driver")}
            className="flex-1 py-3 px-3 rounded-full text-center font-medium transition-all bg-blue-100 text-blue-700 hover:bg-blue-50"
          >
            <span className="flex items-center justify-center">
              <CarIcon className="w-4 h-4 mr-1" />
              Drive
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {activeTab === "ride" ? (
          <RideContent onBookRide={onBookRide} />
        ) : (
          <PackageContent onSendPackage={onSendPackage} />
        )}
      </main>

      {/* Navigation Bar */}
      <NavigationBar activeTab="home" />
    </div>
  );
};

export default MainApp;
