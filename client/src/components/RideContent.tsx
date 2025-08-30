import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SuggestedLocation from "@/components/SuggestedLocation";
import RideOption from "@/components/RideOption";
import { LocationPicker } from "@/components/LocationPicker";
import { GoogleLocationPicker } from "@/components/GoogleLocationPicker";
import { GoogleMapDisplay } from "@/components/GoogleMapDisplay";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import { googleMapsService } from "@/services/GoogleMapsService";
import { fallbackLocationService } from "@/services/FallbackLocationService";
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
            maximumAge: 0 // Always get fresh location
          }
        );
      });
        
      const { latitude, longitude } = position.coords;
      console.log("Got real location coordinates:", latitude, longitude);
      
      try {
        // Use Google Maps Geocoding API to get street address
        const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!googleApiKey) {
          throw new Error('Google Maps API key not found');
        }
        
        const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`;
        
        const response = await fetch(geocodingUrl);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const formattedAddress = data.results[0].formatted_address;
          console.log("Found street address:", formattedAddress);
          
          // Set the location directly
          setCurrentLocation({
            address: formattedAddress,
            lat: latitude,
            lng: longitude
          });
          
          toast({
            title: "Location Found",
            description: "Current location set successfully"
          });
        } else {
          throw new Error('No address found in Google Maps response');
        }
      } catch (error) {
        console.error("Failed to get street address:", error);
        
        // Fallback to Mapbox if Google fails
        try {
          const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!mapboxToken) {
            throw new Error('Mapbox token not found');
          }
          
          const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address`;
          
          const response = await fetch(geocodingUrl);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const formattedAddress = data.features[0].place_name;
            console.log("Found street address via Mapbox:", formattedAddress);
            
            setCurrentLocation({
              address: formattedAddress,
              lat: latitude,
              lng: longitude
            });
            
            toast({
              title: "Location Found",
              description: "Current location set successfully"
            });
          } else {
            throw new Error('No address found in Mapbox response');
          }
        } catch (mapboxError) {
          console.error("Mapbox fallback failed:", mapboxError);
          
          // Final fallback: just use coordinates
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
              <GoogleAutocomplete
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
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mr-3">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
          </div>
          <div className="flex-1">
            <GoogleAutocomplete
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
      <AddressVerificationModal
        isOpen={showVerificationModal}
        onConfirm={handleVerificationConfirm}
        address={locationToVerify?.location.address || ""}
        locationType={locationToVerify?.type || "pickup"}
      />
    </div>
  );
};

export default RideContent;