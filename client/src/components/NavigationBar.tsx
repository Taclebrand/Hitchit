import { useLocation } from "wouter";
import { 
  HomeIcon,
  MapPinIcon,
  HistoryIcon,
  UserIcon,
  CarIcon,
  SearchIcon
} from "@/lib/icons";

interface NavigationBarProps {
  activeTab: string;
}

const NavigationBar = ({ activeTab }: NavigationBarProps) => {
  const [, setLocation] = useLocation();
  
  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon, path: "/home" },
    { id: "trips", label: "My Trips", icon: CarIcon, path: "/trips" },
    { id: "search", label: "Find Trips", icon: SearchIcon, path: "/search-trips" },
    { id: "history", label: "History", icon: HistoryIcon, path: "/history" },
    { id: "profile", label: "Profile", icon: UserIcon, path: "/profile" }
  ];

  return (
    <nav className="bg-white border-t border-neutral-200 py-2">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button 
              key={item.id} 
              className={`flex flex-col items-center p-2 ${
                isActive ? "text-primary" : "text-neutral-400"
              }`}
              onClick={() => setLocation(item.path)}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationBar;
