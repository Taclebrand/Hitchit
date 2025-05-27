import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SuggestedLocation from "@/components/SuggestedLocation";
import RideOption from "@/components/RideOption";
import { LocationPicker } from "@/components/LocationPicker";
import { GoogleLocationPicker } from "@/components/GoogleLocationPicker";
import { GoogleMapDisplay } from "@/components/GoogleMapDisplay";
import { googleMapsService } from "@/services/GoogleMapsService";
import { fallbackLocationService } from "@/services/FallbackLocationService";
import { useToast } from "@/hooks/use-toast";
import { MapPinIcon, Navigation, Clock, DollarSign, CheckCircle } from "lucide-react";
import { AddressVerificationModal } from "@/components/AddressVerificationModal";

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

  // Handle verification confirmation
  const handleVerificationConfirm = () => {
    if (locationToVerify) {
      if (locationToVerify.type === 'pickup') {
        setCurrentLocation(locationToVerify.location);
      } else {
        setDestination(locationToVerify.location);
      }
      
      // Close the modal
      setShowVerificationModal(false);
      
      // Show success indicator with check mark
      toast({
        title: "Location Verified ✓",
        description: "Your location has been confirmed"
      });
    }
  };

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

  useEffect(() => {
    // Calculate route info when both locations are set
    const calculateRouteInfo = async () => {
      if (currentLocation.lat && currentLocation.lng && destination.lat && destination.lng) {
        try {
          // Get route from Google Maps service
          // Try using Google Maps first, fall back to our backup service if needed
      let route;
      try {
        route = await googleMapsService.getRoute(
          { lat: currentLocation.lat, lng: currentLocation.lng },
          { lat: destination.lat, lng: destination.lng }
        );
      } catch (error) {
        console.warn("Google Maps route failed, using fallback service:", error);
        // Use fallback service
        route = await fallbackLocationService.getRoute(
          { lat: currentLocation.lat, lng: currentLocation.lng },
          { lat: destination.lat, lng: destination.lng }
        );
      }
          
      // Calculate fare based on distance and selected ride type
      const fare = fallbackLocationService.calculateFareEstimate(
        route.distance.value,
        selectedRideType
      );
          
          // Update route info state
          setRouteInfo({
            distance: route.distance.text,
            duration: route.duration.text,
            fare: fare
          });
        } catch (error) {
          console.error("Error calculating route info:", error);
          toast({
            title: "Route Calculation Failed",
            description: "Could not calculate trip information. Please try again.",
            variant: "destructive"
          });
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
  
  // Get the user's current location as pickup point
  const getCurrentLocation = async () => {
    try {
      if (!navigator.geolocation) {
        toast({
          title: "Location not supported",
          description: "Your browser doesn't support location services",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Getting location",
        description: "Finding your current location..."
      });
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          }
        );
      });
        
        const { latitude, longitude } = position.coords;
        console.log("Got real location coordinates:", latitude, longitude);
        
        try {
          // Direct call to Mapbox Geocoding API to get real street address
          // We'll use the Mapbox token directly from environment
          const mapboxToken = 'pk.eyJ1IjoidGFjbGVicmFuZCIsImEiOiJjbWF2bHYyY3IwNjhkMnlwdXA4emFydjllIn0.ve6FSKPekZ-zr7cZzWoIUw';
          console.log("Using mapbox token for direct geocoding");
          const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address`;
          
          const response = await fetch(geocodingUrl);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            // Get the formatted address from the Mapbox API response
            const formattedAddress = data.features[0].place_name;
            console.log("Found street address:", formattedAddress);
            
            // Create location object
            const locationObj = {
              address: formattedAddress,
              lat: latitude,
              lng: longitude
            };
            
            // Show verification modal instead of setting directly
            setLocationToVerify({
              type: 'pickup',
              location: locationObj
            });
            setShowVerificationModal(true);
            
            toast({
              title: "Address Found",
              description: "Please verify your location"
            });
          } else {
            throw new Error('No address found in API response');
          }
        } catch (error) {
          console.error("Failed to get street address:", error);
          
          // If we can't get a street address, just format the coordinates nicely
          setCurrentLocation({
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude
          });
          
          toast({
            title: "Location found",
            description: "Using your current coordinates"
          });
        }
      } catch (error: any) {
      console.error("Geolocation error:", error);
      
      let errorMessage = "Couldn't get your location. Please enter it manually.";
      
      if (error.code === 1) {
        errorMessage = "Location access denied. Please enable location services and try again.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please check your connection and try again.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }
      
      toast({
        title: "Location error",
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
              className="w-full flex items-center gap-2"
              onClick={getCurrentLocation}
            >
              <Navigation className="h-4 w-4" />
              <span>Use My Current Location</span>
            </Button>
            
            <div className="flex items-center mt-1">
              <Input
                type="text"
                placeholder="Enter pickup address"
                className="flex-1 py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200"
                value={currentLocation.address}
                onChange={(e) => setCurrentLocation({...currentLocation, address: e.target.value})}
                onFocus={() => setShowPickupLocationPicker(true)}
              />
            </div>
            
            {showPickupLocationPicker && (
              <div className="mt-2">
                <GoogleLocationPicker 
                  onLocationSelect={handleLocationSelect}
                  label="Search for location"
                  buttonText="Use Selected Location"
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
          </div>
        </div>
        
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

      {/* Ride Types */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Select Ride Type</h3>
        <div className="space-y-3">
          {rideTypes.map((type) => (
            <RideOption
              key={type.id}
              id={type.id}
              name={type.name}
              price={routeInfo ? routeInfo.fare : type.price}
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
          disabled={!currentLocation.lat || !destination.lat}
        >
          {!currentLocation.lat || !destination.lat 
            ? "Enter Pickup & Destination" 
            : `Book ${selectedRideType.charAt(0).toUpperCase() + selectedRideType.slice(1)} Ride${routeInfo ? ` • $${routeInfo.fare.toFixed(2)}` : ""}`
          }
        </Button>
      </div>
    </div>
  );
};

export default RideContent;
