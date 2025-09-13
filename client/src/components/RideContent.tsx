import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SuggestedLocation from "@/components/SuggestedLocation";
import RideOption from "@/components/RideOption";
import { LocationPicker } from "@/components/LocationPicker";
import { GoogleLocationPicker } from "@/components/GoogleLocationPicker";
import { GoogleMapDisplay } from "@/components/GoogleMapDisplay";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import FreeLocationAutocomplete from "@/components/FreeLocationAutocomplete";
import { freeLocationService } from "@/services/FreeLocationService";
import { useToast } from "@/hooks/use-toast";
import { MapPinIcon, Navigation, Clock, DollarSign, CheckCircle } from "lucide-react";
import { AddressVerificationModal } from "@/components/AddressVerificationModal";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [locationToVerify, setLocationToVerify] = useState<{type: 'pickup' | 'destination', location: Location} | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    fare: number;
  } | null>(null);

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

  const handleSelectSavedLocation = (location: any) => {
    setCurrentLocation({
      address: location.address,
      lat: 34.0522, // Default LA coordinates for demo
      lng: -118.2437
    });
    toast({
      title: "Location Selected",
      description: `Set pickup location to ${location.name}`,
    });
  };

  const handleVerificationConfirm = () => {
    if (locationToVerify) {
      if (locationToVerify.type === 'pickup') {
        setCurrentLocation(locationToVerify.location);
      } else {
        setDestination(locationToVerify.location);
      }
      setShowVerificationModal(false);
      setLocationToVerify(null);
      
      toast({
        title: "Location Confirmed",
        description: "Location has been set successfully",
      });
    }
  };

  const handleVerificationCancel = () => {
    setShowVerificationModal(false);
    setLocationToVerify(null);
  };

  const handleSelectRideType = (id: string) => {
    setSelectedRideType(id);
  };

  useEffect(() => {
    // Calculate route info when both locations are set
    const calculateRouteInfo = async () => {
      if (currentLocation.lat && currentLocation.lng && destination.lat && destination.lng) {
        try {
          // Calculate basic route info
          const rideTypeMultiplier = selectedRideType === "economy" ? 1 : selectedRideType === "comfort" ? 1.5 : 2;
          const estimatedDistance = Math.sqrt(
            Math.pow(destination.lat - currentLocation.lat, 2) + 
            Math.pow(destination.lng - currentLocation.lng, 2)
          ) * 69; // Rough miles calculation
          
          setRouteInfo({
            distance: `${estimatedDistance.toFixed(1)} mi`,
            duration: `${Math.ceil(estimatedDistance * 2)} min`,
            fare: Math.max(7, estimatedDistance * 2.5 * rideTypeMultiplier)
          });
        } catch (error) {
          console.error("Error calculating route:", error);
        }
      } else {
        // Reset route info if locations are not complete
        setRouteInfo(null);
      }
    };
    
    calculateRouteInfo();
  }, [currentLocation, destination, selectedRideType, toast]);

  const handleLocationSelect = (location: {address: string, lat: number, lng: number}) => {
    setCurrentLocation(location);
    setShowPickupLocationPicker(false);
    toast({
      title: "Pickup Location Updated",
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

  // Search for available rides
  const handleSearchRides = async () => {
    if (!currentLocation.lat || !currentLocation.lng || !destination.lat || !destination.lng) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and destination locations",
        variant: "destructive"
      });
      return;
    }

    try {
      // Search for available trips/rides
      const response = await apiRequest('POST', '/api/trips/search/bookings', {
        origin: {
          address: currentLocation.address,
          lat: currentLocation.lat,
          lng: currentLocation.lng
        },
        destination: {
          address: destination.address,
          lat: destination.lat,
          lng: destination.lng
        },
        radiusMiles: 15,
        type: 'ride'
      });

      const results = await response.json();
      
      if (results.hasMatches && results.trips.length > 0) {
        toast({
          title: "Rides Found!",
          description: `Found ${results.trips.length} available rides`,
        });
        // Call the original onBookRide callback to handle the results
        onBookRide();
      } else {
        toast({
          title: "No Rides Available",
          description: "No matching rides found for your route. Try adjusting your pickup or destination.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error searching for rides:', error);
      toast({
        title: "Search Failed",
        description: "Could not search for rides. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle getting current location using the free location service
  const getCurrentLocation = async () => {
    try {
      console.log("getCurrentLocation called - Using free location service");
      
      toast({
        title: "Getting location",
        description: "Finding your current location..."
      });
      
      const currentLocationData = await freeLocationService.getCurrentLocation();
      
      setCurrentLocation({
        address: currentLocationData.address,
        lat: currentLocationData.coordinates.lat,
        lng: currentLocationData.coordinates.lng
      });
      
      toast({
        title: "Location Found",
        description: "Current location set successfully"
      });
    } catch (error: any) {
      console.error("Location error:", error);
      
      let errorMessage = "Couldn't get your location. Please enter it manually.";
      let title = "Location error";
      
      if (error.message.includes('not supported')) {
        title = "Location not supported";
        errorMessage = "Your browser doesn't support location services. Please enter your address manually.";
      } else if (error.message.includes('denied')) {
        title = "Location access denied";
        errorMessage = "To enable location: Look for the location icon 🌍 in your browser's address bar → Click it → Select 'Allow' → Try again";
      } else if (error.message.includes('timeout')) {
        title = "Location timeout";
        errorMessage = "Location request took too long. Please try again or enter your address manually.";
      }
      
      toast({
        title,
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4">
      {/* Location Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Where are you going?</h3>
        
        <div className="mb-3">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center mb-1">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Pickup Location</p>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="w-full flex items-center gap-2 hover:bg-primary/10"
              onClick={getCurrentLocation}
            >
              <Navigation className="h-4 w-4" />
              <span>Use My Current Location</span>
            </Button>
            
            {currentLocation.address && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Current: {currentLocation.address}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center mt-1">
              <FreeLocationAutocomplete
                placeholder="Enter pickup address"
                onLocationSelect={(location) => {
                  setCurrentLocation({
                    address: location.address,
                    lat: location.coordinates.lat,
                    lng: location.coordinates.lng
                  });
                }}
                initialValue={currentLocation.address}
                className="w-full"
                showCurrentLocation={false}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mr-3">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
          </div>
          <div className="flex-1">
            <FreeLocationAutocomplete
              placeholder="Where to?"
              onLocationSelect={(location) => {
                setDestination({
                  address: location.address,
                  lat: location.coordinates.lat,
                  lng: location.coordinates.lng
                });
              }}
              initialValue={destination.address}
              className="w-full"
              showCurrentLocation={false}
            />
          </div>
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
              onClick={() => handleSelectSavedLocation(location)}
            />
          ))}
        </div>
      </div>

      {/* Map Display - Show when both pickup and destination are selected */}
      {currentLocation.lat && currentLocation.lng && destination.lat && destination.lng && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-semibold mb-3">Your Route</h3>
          <GoogleMapDisplay 
            originCoordinates={{ lat: currentLocation.lat, lng: currentLocation.lng }}
            destinationCoordinates={{ lat: destination.lat, lng: destination.lng }}
            height="240px"
            className="mb-3"
          />
          
          {/* Route Information */}
          {routeInfo && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center justify-center">
                <Clock className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs text-slate-500">Duration</span>
                <span className="font-semibold">{routeInfo.duration}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center justify-center">
                <MapPinIcon className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs text-slate-500">Distance</span>
                <span className="font-semibold">{routeInfo.distance}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary mb-1" />
                <span className="text-xs text-slate-500">Fare</span>
                <span className="font-semibold">${routeInfo.fare.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available Rides will be shown after entering destination */}

      {/* Call to Action */}
      <div className="p-4 sticky bottom-0">
        <Button 
          className="w-full py-4 bg-primary rounded-full text-white font-medium shadow-lg"
          onClick={handleSearchRides}
          disabled={!currentLocation.lat || !destination.lat}
        >
          {!currentLocation.lat || !destination.lat 
            ? "Enter Pickup & Destination" 
            : "Search Available Rides"
          }
        </Button>
      </div>

      {/* Address Verification Modal */}
      {showVerificationModal && locationToVerify && (
        <AddressVerificationModal
          isOpen={showVerificationModal}
          onClose={handleVerificationCancel}
          onConfirm={handleVerificationConfirm}
          address={locationToVerify.location.address}
          coordinates={{
            lat: locationToVerify.location.lat || 0,
            lng: locationToVerify.location.lng || 0
          }}
        />
      )}
    </div>
  );
};

export default RideContent;