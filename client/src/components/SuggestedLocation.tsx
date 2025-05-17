import { 
  BuildingIcon, 
  HomeIcon, 
  StoreIcon 
} from "@/lib/icons";

interface SuggestedLocationProps {
  name: string;
  address: string;
  icon: string;
  onClick: () => void;
}

const SuggestedLocation = ({ name, address, icon, onClick }: SuggestedLocationProps) => {
  const getIcon = () => {
    switch (icon) {
      case "building":
        return <BuildingIcon className="w-5 h-5 text-neutral-500" />;
      case "home":
        return <HomeIcon className="w-5 h-5 text-neutral-500" />;
      case "store":
        return <StoreIcon className="w-5 h-5 text-neutral-500" />;
      default:
        return <BuildingIcon className="w-5 h-5 text-neutral-500" />;
    }
  };

  return (
    <div 
      className="flex items-center p-2 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mr-3">
        {getIcon()}
      </div>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-neutral-500">{address}</p>
      </div>
    </div>
  );
};

export default SuggestedLocation;
