import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import RideContent from "@/components/RideContent";
import PackageContent from "@/components/PackageContent";
import NavigationBar from "@/components/NavigationBar";
import { 
  UserIcon, 
  NotificationIcon, 
  SettingsIcon
} from "@/lib/icons";

interface MainAppProps {
  onBookRide: () => void;
  onSendPackage: () => void;
}

const MainApp = ({ onBookRide, onSendPackage }: MainAppProps) => {
  const [activeTab, setActiveTab] = useState<"ride" | "package">("ride");
  const [userData, setUserData] = useState({
    name: "Alex",
  });

  const handleTabChange = (tab: "ride" | "package") => {
    setActiveTab(tab);
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
            <p className="text-xs opacity-80">Good morning</p>
            <h3 className="font-medium">{userData.name}</h3>
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
            className={`flex-1 py-3 px-4 rounded-full text-center font-medium transition-all ${
              activeTab === "ride" 
                ? "bg-white text-neutral-800 shadow" 
                : "text-neutral-500"
            }`}
          >
            Ride
          </button>
          <button 
            onClick={() => handleTabChange("package")}
            className={`flex-1 py-3 px-4 rounded-full text-center font-medium transition-all ${
              activeTab === "package" 
                ? "bg-white text-neutral-800 shadow" 
                : "text-neutral-500"
            }`}
          >
            Package
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
