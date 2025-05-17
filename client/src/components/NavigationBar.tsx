import { 
  HomeIcon, 
  MapPinIcon, 
  HistoryIcon, 
  UserIcon 
} from "@/lib/icons";

interface NavigationBarProps {
  activeTab: string;
}

const NavigationBar = ({ activeTab }: NavigationBarProps) => {
  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "activity", label: "Activity", icon: MapPinIcon },
    { id: "history", label: "History", icon: HistoryIcon },
    { id: "profile", label: "Profile", icon: UserIcon }
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
