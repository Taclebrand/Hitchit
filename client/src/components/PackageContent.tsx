import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DeliveryOption from "@/components/DeliveryOption";
import LocationInput from "@/components/LocationInput";
import PricingControl from "@/components/PricingControl";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { fallbackLocationService } from "@/services/FallbackLocationService";
import { mapboxService } from "@/services/MapboxService";
import { googleMapsService } from "@/services/GoogleMapsService";
import { MapPinIcon, CheckCircle, Truck, Clock, Users } from "lucide-react";
import { AddressVerificationModal } from "@/components/AddressVerificationModal";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PackageContentProps {
  onSendPackage: () => void;
}

const PackageContent = ({ onSendPackage }: PackageContentProps) => {
  const [pickupLocation, setPickupLocation] = useState({ address: "", coordinates: { lat: 0, lng: 0 } });
  const [deliveryLocation, setDeliveryLocation] = useState({ address: "", coordinates: { lat: 0, lng: 0 } });
  const [packageSize, setPackageSize] = useState<"small" | "medium" | "large">("small");
  const [packageWeight, setPackageWeight] = useState("up-to-5-lbs");
  const [contentsDescription, setContentsDescription] = useState("");
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState("standard");
  const [showDriverSearch, setShowDriverSearch] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [addressToVerify, setAddressToVerify] = useState<{
    type: 'pickup' | 'delivery',
    address: string,
    coordinates: {lat: number, lng: number}
  } | null>(null);
  const { toast } = useToast();

  // Search for available drivers based on package delivery route
  const { data: driverSearchResults, isLoading: searchingDrivers } = useQuery({
    queryKey: ['/api/trips/search/bookings', pickupLocation, deliveryLocation],
    queryFn: async () => {
      if (!pickupLocation.coordinates.lat || !deliveryLocation.coordinates.lat) {
        return { trips: [], hasMatches: false, message: '' };
      }
      
      const response = await apiRequest('POST', '/api/trips/search/bookings', {
        origin: {
          address: pickupLocation.address,
          lat: pickupLocation.coordinates.lat,
          lng: pickupLocation.coordinates.lng
        },
        destination: {
          address: deliveryLocation.address,
          lat: deliveryLocation.coordinates.lat,
          lng: deliveryLocation.coordinates.lng
        },
        radiusMiles: 15, // Larger radius for package delivery
        type: 'package'
      });
      return response.json();
    },
    enabled: showDriverSearch && !!pickupLocation.coordinates.lat && !!deliveryLocation.coordinates.lat,
    staleTime: 30000
  });

  const availableDrivers = driverSearchResults?.trips || [];
  const hasDriverMatches = driverSearchResults?.hasMatches || false;
  const driverSearchMessage = driverSearchResults?.message;

  const deliveryOptions = [
    { 
      id: "standard", 
      name: "Standard", 
      price: 8.50, 
      time: "2-3 hours", 
      icon: "truck" 
    },
    { 
      id: "express", 
      name: "Express", 
      price: 14.75, 
      time: "1 hour or less", 
      icon: "flash" 
    },
    { 
      id: "scheduled", 
      name: "Scheduled", 
      price: 10.50, 
      time: "Pick a time", 
      icon: "calendar" 
    }
  ];

  const handleSelectDeliveryOption = (id: string) => {
    setSelectedDeliveryOption(id);
  };
  
  // Handle address verification confirmation
  const handleVerificationConfirm = () => {
    if (addressToVerify) {
      if (addressToVerify.type === 'pickup') {
        setPickupAddress(addressToVerify.address);
      } else {
        setDeliveryAddress(addressToVerify.address);
      }
      
      // Close the verification modal
      setShowVerificationModal(false);
      
      // Show success toast with check mark
      toast({
        title: "Address Verified",
        description: `Your ${addressToVerify.type} address has been confirmed`,
        variant: "default"
      });
    }
  };
  
  // Helper function to fetch the real street address from coordinates
  const fetchAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Try to use Google Maps API for more accurate address
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Return the formatted address from Google Maps
        return data.results[0].formatted_address;
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Error getting physical address:', error);
      throw error;
    }
  };
  
  // Get user's current location for pickup
  const getPickupLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          
          const { latitude, longitude } = position.coords;
          console.log("Got coordinates for package pickup:", latitude, longitude);
          
          console.log("Getting your exact street address...");
          try {
            // Direct call to Mapbox Geocoding API to get real street address
            // Use the fallback token directly
            const mapboxToken = 'pk.eyJ1IjoidGFjbGVicmFuZCIsImEiOiJjbWF2bHYyY3IwNjhkMnlwdXA4emFydjllIn0.ve6FSKPekZ-zr7cZzWoIUw';
            console.log("Using mapbox token for direct geocoding in package content");
            const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address`;
            
            const response = await fetch(geocodingUrl);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              // Get the formatted address from the Mapbox API response
              const formattedAddress = data.features[0].place_name;
              console.log("Found address:", formattedAddress);
              
              // Store address for verification
              setAddressToVerify({
                type: 'pickup',
                address: formattedAddress,
                coordinates: {
                  lat: latitude,
                  lng: longitude
                }
              });
              
              // Show the verification modal
              setShowVerificationModal(true);
              
              toast({
                title: "Address Found",
                description: "Please verify your pickup location",
              });
            } else {
              throw new Error('No address found in API response');
            }
          } catch (error) {
            // If the street address lookup fails, let the user know
            console.error("Could not get street address:", error);
            toast({
              title: "Address Not Found",
              description: "Please enter your address manually",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.warn("Geolocation error:", error);
          toast({
            title: "Location error",
            description: "Could not get your location. Please enter it manually.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Not supported",
          description: "Your browser doesn't support geolocation",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error setting pickup location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="p-4">
      {/* Address Verification Modal */}
      {addressToVerify && (
        <AddressVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onConfirm={handleVerificationConfirm}
          address={addressToVerify.address}
          coordinates={addressToVerify.coordinates}
          useMapbox={true}
        />
      )}
      
      {/* Package Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Send a Package</h3>
        
        {/* Pickup Location */}
        <p className="mb-2 text-sm font-medium text-neutral-600">Pickup From</p>
        <div className="mb-1">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="w-full mb-2"
            onClick={getPickupLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? "Getting location..." : "Use Current Location"}
          </Button>
        </div>
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
          <GoogleAutocomplete
            placeholder="Pickup address"
            onLocationSelect={(location) => {
              setPickupLocation({
                address: location.address,
                coordinates: location.coordinates
              });
            }}
            initialValue={pickupLocation.address}
            className="flex-1"
          />
        </div>
        
        {/* Delivery Location */}
        <p className="mb-2 text-sm font-medium text-neutral-600 mt-3">Deliver To</p>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mr-3">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
          </div>
          <GoogleAutocomplete
            placeholder="Delivery address"
            onLocationSelect={(location) => {
              setDeliveryLocation({
                address: location.address,
                coordinates: location.coordinates
              });
            }}
            initialValue={deliveryLocation.address}
            className="flex-1"
          />
        </div>
        
        {/* Package Details */}
        <div className="space-y-4 mt-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-neutral-600">Package Size</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={packageSize === "small" ? "outline" : "ghost"}
                className={`flex-1 py-2 border ${packageSize === "small" ? "border-primary bg-primary/10 text-primary" : "border-neutral-200"} rounded-lg font-medium`}
                onClick={() => setPackageSize("small")}
              >
                Small
              </Button>
              <Button
                type="button"
                variant={packageSize === "medium" ? "outline" : "ghost"}
                className={`flex-1 py-2 border ${packageSize === "medium" ? "border-primary bg-primary/10 text-primary" : "border-neutral-200"} rounded-lg font-medium`}
                onClick={() => setPackageSize("medium")}
              >
                Medium
              </Button>
              <Button
                type="button"
                variant={packageSize === "large" ? "outline" : "ghost"}
                className={`flex-1 py-2 border ${packageSize === "large" ? "border-primary bg-primary/10 text-primary" : "border-neutral-200"} rounded-lg font-medium`}
                onClick={() => setPackageSize("large")}
              >
                Large
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-neutral-600">Package Weight</label>
            <Select value={packageWeight} onValueChange={setPackageWeight}>
              <SelectTrigger className="w-full py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="up-to-5-lbs">Up to 5 lbs</SelectItem>
                <SelectItem value="5-10-lbs">5-10 lbs</SelectItem>
                <SelectItem value="10-20-lbs">10-20 lbs</SelectItem>
                <SelectItem value="20-plus-lbs">20+ lbs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium text-neutral-600">Contents Description</label>
            <Textarea
              className="w-full py-2 px-3 bg-neutral-50 rounded-lg border border-neutral-200 h-20 resize-none"
              placeholder="Briefly describe package contents"
              value={contentsDescription}
              onChange={(e) => setContentsDescription(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Delivery Options */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-3">Delivery Options</h3>
        <div className="space-y-3">
          {deliveryOptions.map((option) => (
            <DeliveryOption
              key={option.id}
              id={option.id}
              name={option.name}
              price={option.price}
              time={option.time}
              icon={option.icon}
              selected={selectedDeliveryOption === option.id}
              onClick={() => handleSelectDeliveryOption(option.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="p-4 sticky bottom-0">
        <div className="space-y-3">
          <Button
            className="w-full py-4 bg-blue-500 text-white rounded-full font-medium shadow-lg"
            onClick={handleSearchDrivers}
            disabled={!pickupLocation.address || !deliveryLocation.address}
          >
            {!pickupLocation.address || !deliveryLocation.address 
              ? "Enter Pickup & Delivery Locations" 
              : "Search Available Drivers"
            }
          </Button>

          {/* Driver Search Results */}
          {showDriverSearch && (
            <div className="mt-4">
              {searchingDrivers ? (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Searching for available drivers...</p>
                </div>
              ) : hasDriverMatches ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600">Found {availableDrivers.length} Available Drivers</h4>
                  {availableDrivers.slice(0, 3).map((driver: any) => (
                    <Card key={driver.id} className="border-green-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">Driver {driver.driverId}</p>
                              <p className="text-xs text-gray-500">
                                {driver.originCity} → {driver.destinationCity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-green-600">
                              ${driver.price}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(driver.departureDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    className="w-full py-3 bg-emerald-500 text-white rounded-full font-medium"
                    onClick={onSendPackage}
                  >
                    Send Package with Selected Driver
                  </Button>
                </div>
              ) : (
                <Card className="border-red-200">
                  <CardContent className="p-4 text-center">
                    <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h4 className="font-medium text-red-600 mb-1">No Drivers Available</h4>
                    <p className="text-sm text-gray-600">{driverSearchMessage}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Try expanding your search radius or check back later for new trips.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageContent;
