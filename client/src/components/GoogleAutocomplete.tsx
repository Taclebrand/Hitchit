import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { googleMapsService } from '@/services/GoogleMapsService';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  address: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
}

interface GoogleAutocompleteProps {
  placeholder?: string;
  onLocationSelect: (location: LocationData) => void;
  initialValue?: string;
  className?: string;
  disabled?: boolean;
}

export default function GoogleAutocomplete({
  placeholder = "Enter location...",
  onLocationSelect,
  initialValue = "",
  className = "",
  disabled = false
}: GoogleAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize Google Maps
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        await googleMapsService.loadGoogleMapsApi();
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        toast({
          title: "Maps unavailable",
          description: "Google Maps failed to load. Please try again.",
          variant: "destructive"
        });
      }
    };

    initGoogleMaps();
  }, []);

  // Handle input changes and search for predictions
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputValue || inputValue.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    const searchPredictions = async () => {
      setIsLoading(true);
      try {
        const results = await googleMapsService.getPlacePredictions(inputValue);
        setPredictions(results);
        setShowPredictions(results.length > 0);
      } catch (error) {
        console.error('Error getting predictions:', error);
        setPredictions([]);
        setShowPredictions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPredictions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, isGoogleMapsLoaded]);

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!prediction.place_id) return;

    setIsLoading(true);
    try {
      const locationDetails = await googleMapsService.getPlaceDetails(prediction.place_id);
      
      onLocationSelect({
        address: locationDetails.formattedAddress,
        coordinates: locationDetails.coordinates,
        placeId: locationDetails.placeId
      });

      setInputValue(locationDetails.formattedAddress);
      setShowPredictions(false);
    } catch (error) {
      console.error('Error getting place details:', error);
      toast({
        title: "Location error",
        description: "Could not get details for this location",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={isGoogleMapsLoaded ? placeholder : "Loading maps..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
          disabled={disabled || !isGoogleMapsLoaded}
          className="pr-10"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        
        {!isLoading && isGoogleMapsLoaded && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Predictions dropdown */}
      {showPredictions && predictions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {predictions.map((prediction) => (
              <div
                key={prediction.place_id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handlePredictionSelect(prediction)}
              >
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </p>
                  {prediction.structured_formatting?.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}