import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGoogleLocation } from '@/hooks/use-google-location';
import { googleMapsService, Coordinates } from '@/services/GoogleMapsService';
import { MapPinIcon, LoaderIcon, Navigation, Search } from 'lucide-react';

// Type definitions
interface GoogleLocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lng: number;
    placeId?: string;
  }) => void;
  label?: string;
  buttonText?: string;
}

export function GoogleLocationPicker({
  onLocationSelect,
  label = "Current Location",
  buttonText = "Use Current Location"
}: GoogleLocationPickerProps) {
  // Using our custom Google location hook for location services
  const {
    loading,
    error,
    coordinates,
    address,
    placeId,
    getAddressFromCoordinates,
    getCoordinatesFromAddress
  } = useGoogleLocation();

  // Internal component state
  const [inputAddress, setInputAddress] = useState('');
  const [searchResults, setSearchResults] = useState<{placeId: string, description: string}[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places services for autocomplete
  useEffect(() => {
    const initGooglePlaces = async () => {
      try {
        await googleMapsService.loadGoogleMapsApi();
        
        if (window.google && window.google.maps && window.google.maps.places) {
          autocompleteService.current = new google.maps.places.AutocompleteService();
          
          // Create a dummy map for PlacesService (required by the API)
          if (mapRef.current) {
            const map = new google.maps.Map(mapRef.current);
            placesService.current = new google.maps.places.PlacesService(map);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Google Places:', error);
      }
    };

    initGooglePlaces();
  }, []);

  // Update input address when location is determined
  useEffect(() => {
    if (address) {
      setInputAddress(address);
    }
  }, [address]);

  // Handle location search with autocomplete
  const handleAddressSearch = async (query: string) => {
    setInputAddress(query);
    
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (!autocompleteService.current) {
      console.error('Autocomplete service not initialized');
      return;
    }

    setIsSearching(true);
    try {
      const result = await autocompleteService.current.getPlacePredictions({
        input: query
      });
      
      if (result.predictions) {
        setSearchResults(result.predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description
        })));
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle selection of a place from autocomplete results
  const handlePlaceSelect = async (placeId: string, description: string) => {
    if (!placesService.current) {
      console.error('Places service not initialized');
      return;
    }

    try {
      const result = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.current!.getDetails(
          { placeId: placeId },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error(`Place details failed: ${status}`));
            }
          }
        );
      });

      if (result.geometry?.location) {
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        
        onLocationSelect({
          address: description,
          lat,
          lng,
          placeId
        });
        
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  // Use current device location
  const handleUseCurrentLocation = () => {
    if (coordinates && address) {
      onLocationSelect({
        address,
        lat: coordinates.lat,
        lng: coordinates.lng,
        placeId: placeId || undefined
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <MapPinIcon className="w-5 h-5 mr-2 text-primary" />
          <span className="font-medium">{label}</span>
        </div>
        
        <div className="relative">
          <div className="flex items-center">
            <Input
              placeholder="Enter location or address"
              value={inputAddress}
              onChange={(e) => handleAddressSearch(e.target.value)}
              className="w-full pr-10"
              onFocus={() => setShowSearchResults(true)}
            />
            {isSearching ? (
              <LoaderIcon className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute right-3 h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Search results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-auto">
              <ul className="py-1 px-2">
                {searchResults.map((result) => (
                  <li 
                    key={result.placeId}
                    className="p-2 hover:bg-muted cursor-pointer rounded-md text-sm"
                    onClick={() => handlePlaceSelect(result.placeId, result.description)}
                  >
                    {result.description}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full flex justify-center items-center gap-2"
        onClick={handleUseCurrentLocation}
        disabled={loading || !!error || !coordinates || !address}
      >
        {loading ? (
          <>
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <span>Detecting location...</span>
          </>
        ) : error ? (
          <>
            <span className="text-red-500">Error getting location</span>
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4" />
            <span>{buttonText}</span>
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error === 'Location access denied. Please enable location services.' 
            ? 'Please enable location services in your browser settings'
            : error}
        </p>
      )}

      {coordinates && address && (
        <Card className="p-3 mt-2 bg-muted/30">
          <p className="text-sm">
            <span className="font-medium">Found:</span> {address}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
        </Card>
      )}
      
      {/* Hidden div for Places Service */}
      <div ref={mapRef} className="hidden" />
    </div>
  );
}