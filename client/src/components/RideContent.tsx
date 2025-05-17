import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SuggestedLocation from "@/components/SuggestedLocation";
import RideOption from "@/components/RideOption";

interface RideContentProps {
  onBookRide: () => void;
}

const RideContent = ({ onBookRide }: RideContentProps) => {
  const [currentLocation, setCurrentLocation] = useState("123 Main St");
  const [destination, setDestination] = useState("");
  const [selectedRideType, setSelectedRideType] = useState("economy");

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

  const handleSelectLocation = (location: { name: string, address: string }) => {
    setDestination(location.address);
  };

  const handleSelectRideType = (id: string) => {
    setSelectedRideType(id);
  };

  return (
    <div className="p-4">
      {/* Location Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Where are you going?</h3>
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
          <Input
            type="text"
            placeholder="Current location"
            className="flex-1 py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mr-3">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
          </div>
          <Input
            type="text"
            placeholder="Enter destination"
            className="flex-1 py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
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
              onClick={() => handleSelectLocation(location)}
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
