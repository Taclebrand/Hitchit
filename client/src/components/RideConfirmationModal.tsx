import { Button } from "@/components/ui/button";
import { MessageIcon, PhoneIcon } from "@/lib/icons";
import { useLocation } from "wouter";

interface RideConfirmationModalProps {
  onClose: () => void;
}

const RideConfirmationModal = ({ onClose }: RideConfirmationModalProps) => {
  const [, setLocation] = useLocation();
  
  // Data for ride confirmation
  const rideData = {
    driver: {
      name: "Michael D.",
      rating: 4.8,
      car: "Toyota Prius",
      licensePlate: "ABC 123"
    },
    trip: {
      pickup: "123 Main St",
      destination: "456 Business Ave",
      estimatedTime: "15 min",
      fare: "$12.50",
      payment: "Visa ****4242"
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleViewTripStatus = () => {
    // Navigate to driver tracking page
    setLocation('/driver-tracking');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full rounded-t-3xl p-5 slide-in max-h-[80%] overflow-auto">
        <div className="w-16 h-1 bg-neutral-300 rounded-full mx-auto mb-5"></div>
        
        {/* Ride Details */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-1">Your Ride is Confirmed!</h3>
          <p className="text-neutral-500">Driver will arrive in approximately 5 minutes</p>
        </div>
        
        {/* Driver Info */}
        <div className="flex items-center p-4 bg-neutral-50 rounded-xl mb-5">
          <div className="w-14 h-14 bg-neutral-200 rounded-full mr-4">
            {/* Avatar would be here */}
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <h4 className="font-medium">{rideData.driver.name}</h4>
              <div className="flex items-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400 mr-1">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-medium">{rideData.driver.rating}</span>
              </div>
            </div>
            <p className="text-neutral-500 text-sm">{rideData.driver.car} • {rideData.driver.licensePlate}</p>
          </div>
        </div>
        
        {/* Trip Info */}
        <div className="p-4 bg-neutral-50 rounded-xl mb-5">
          <div className="flex items-start mb-4">
            <div className="mr-3 pt-1">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-0.5 h-12 bg-neutral-300 mx-auto my-1"></div>
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
            </div>
            <div>
              <div className="mb-3">
                <p className="text-sm text-neutral-500">Pickup</p>
                <p className="font-medium">{rideData.trip.pickup}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Destination</p>
                <p className="font-medium">{rideData.trip.destination}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-neutral-200 pt-3 flex justify-between">
            <div>
              <p className="text-sm text-neutral-500">Estimated Time</p>
              <p className="font-medium">{rideData.trip.estimatedTime}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Fare</p>
              <p className="font-medium">{rideData.trip.fare}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Payment</p>
              <p className="font-medium">{rideData.trip.payment}</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3 mb-4">
          <Button 
            variant="outline" 
            className="flex-1 py-3 px-4 border border-neutral-300 rounded-xl flex items-center justify-center font-medium"
          >
            <MessageIcon className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 py-3 px-4 border border-neutral-300 rounded-xl flex items-center justify-center font-medium"
          >
            <PhoneIcon className="w-4 h-4 mr-2" />
            Call
          </Button>
        </div>
        
        <Button 
          className="w-full py-4 bg-primary rounded-full text-white font-medium"
          onClick={handleViewTripStatus}
        >
          View Trip Status
        </Button>
      </div>
    </div>
  );
};

export default RideConfirmationModal;
