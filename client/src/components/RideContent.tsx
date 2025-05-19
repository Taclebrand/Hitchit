import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SuggestedLocation from "@/components/SuggestedLocation";
import RideOption from "@/components/RideOption";
import { LocationPicker } from "@/components/LocationPicker";
import { GoogleLocationPicker } from "@/components/GoogleLocationPicker";
import { useToast } from "@/hooks/use-toast";
import { MapPinIcon, Navigation } from "lucide-react";

interface RideContentProps {
  onBookRide: () => void;
}

interface Location {
  address: string;
  lat?: number;
  lng?: number;
}

const RideContent = ({ onBookRide }: RideContentProps) => {
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<Location>({
    address: "",
    lat: undefined,
    lng: undefined
  });
  const [destination, setDestination] = useState<Location>({
    address: "",
    lat: undefined,
    lng: undefined
  });
  const [selectedRideType, setSelectedRideType] = useState("economy");
  const [showPickupLocationPicker, setShowPickupLocationPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);

  const savedLocations = [
    { id: 1, name: "Office", address: "456 Business Ave", icon: "building" },
    { id: 2, name: "Home", address: "789 Residential St", icon: "home" },
    { id: 3, name: "Grocery Store", address: "101 Market St", icon: "store" }
  ];

  const rideTypes = [
    { 
      id: "economy", 
      name: "Economy", 
      price: 12.50, 
      time: "5 min away", 
      icon: "car" 
    },
    { 
      id: "comfort", 
      name: "Comfort", 
      price: 18.75, 
      time: "7 min away", 
      icon: "car" 
    },
    { 
      id: "premium", 
      name: "Premium", 
      price: 24.50, 
      time: "10 min away", 
      icon: "car" 
    }
  ];

  const handleSelectSavedLocation = (location: { name: string, address: string }) => {
    setDestination({
      address: location.address,
      lat: undefined,
      lng: undefined
    });
    setShowDestinationPicker(false);
  };

  const handleSelectRideType = (id: string) => {
    setSelectedRideType(id);
  };

  const handleLocationSelect = (location: {address: string, lat: number, lng: number}) => {
    setCurrentLocation(location);
    setShowPickupLocationPicker(false);
    toast({
      title: "Location Updated",
      description: "Your pickup location has been set to your current location.",
    });
  };

  const handleDestinationSelect = (location: {address: string, lat: number, lng: number}) => {
    setDestination(location);
    setShowDestinationPicker(false);
    toast({
      title: "Destination Updated",
      description: "Your destination has been set.",
    });
  };

  return (
    <div className="p-4">
      {/* Location Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Where are you going?</h3>
        
        {!showPickupLocationPicker ? (
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
            <div 
              className="flex-1 py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between items-center cursor-pointer"
              onClick={() => setShowPickupLocationPicker(true)}
            >
              <span className={`${!currentLocation.address ? 'text-gray-400' : ''}`}>
                {currentLocation.address || "Set your pickup location"}
              </span>
              <Navigation className="h-4 w-4 text-primary" />
            </div>
          </div>
        ) : (
          <div className="mb-3">
            {/* Use the Google Location Picker for a more robust experience */}
            <GoogleLocationPicker 
              onLocationSelect={handleLocationSelect}
              label="Pickup Location"
              buttonText="Use My Current Location"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowPickupLocationPicker(false)}
            >
              Cancel
            </Button>
          </div>
        )}
        
        {!showDestinationPicker ? (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mr-3">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
            </div>
            <div 
              className="flex-1 py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between items-center cursor-pointer"
              onClick={() => setShowDestinationPicker(true)}
            >
              <span className={`${!destination.address ? 'text-gray-400' : ''}`}>
                {destination.address || "Where to?"}
              </span>
              <MapPinIcon className="h-4 w-4 text-secondary" />
            </div>
          </div>
        ) : (
          <div>
            {/* Use the Google Location Picker for destination as well */}
            <GoogleLocationPicker 
              onLocationSelect={handleDestinationSelect}
              label="Destination"
              buttonText="Set As Destination"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowDestinationPicker(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Suggested Locations */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Suggested</h3>
        <div className="space-y-3">
          {savedLocations.map((location) => (
            <SuggestedLocation
              key={location.id}
              name={location.name}
              address={location.address}
              icon={location.icon}
              onClick={() => handleSelectSavedLocation(location)}
            />
          ))}
        </div>
      </div>

      {/* Ride Types */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Select Ride Type</h3>
        <div className="space-y-3">
          {rideTypes.map((type) => (
            <RideOption
              key={type.id}
              id={type.id}
              name={type.name}
              price={type.price}
              time={type.time}
              icon={type.icon}
              selected={selectedRideType === type.id}
              onClick={() => handleSelectRideType(type.id)}
            />
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="p-4 sticky bottom-0">
        <Button 
          className="w-full py-4 bg-primary rounded-full text-white font-medium shadow-lg"
          onClick={onBookRide}
        >
          Book Ride Now
        </Button>
      </div>
    </div>
  );
};

export default RideContent;
