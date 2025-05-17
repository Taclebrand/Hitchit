import { TruckIcon, FlashIcon, CalendarIcon } from "@/lib/icons";

interface DeliveryOptionProps {
  id: string;
  name: string;
  price: number;
  time: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}

const DeliveryOption = ({ id, name, price, time, icon, selected, onClick }: DeliveryOptionProps) => {
  const getIcon = () => {
    switch (icon) {
      case "truck":
        return <TruckIcon className="w-8 h-8 text-neutral-500" />;
      case "flash":
        return <FlashIcon className="w-8 h-8 text-neutral-500" />;
      case "calendar":
        return <CalendarIcon className="w-8 h-8 text-neutral-500" />;
      default:
        return <TruckIcon className="w-8 h-8 text-neutral-500" />;
    }
  };

  return (
    <div 
      className={`option-card flex items-center p-3 border rounded-xl hover:border-primary cursor-pointer transition-all ${
        selected ? "selected" : "border-neutral-200"
      }`}
      onClick={onClick}
    >
      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mr-4">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <p className="font-medium">{name}</p>
          <p className="font-semibold">${price.toFixed(2)}</p>
        </div>
        <div className="flex items-center text-sm text-neutral-500">
          <svg viewBox="0 0 24 24" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOption;
