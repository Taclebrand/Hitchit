import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, Navigation, Clock } from 'lucide-react';
import { freeLocationService, LocationSuggestion } from '@/services/FreeLocationService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface LocationData {
  address: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
}

interface FreeLocationAutocompleteProps {
  placeholder?: string;
  onLocationSelect: (location: LocationData) => void;
  initialValue?: string;
  className?: string;
  disabled?: boolean;
  showCurrentLocation?: boolean;
  showPopularLocations?: boolean;
}

export default function FreeLocationAutocomplete({
  placeholder = "Enter location...",
  onLocationSelect,
  initialValue = "",
  className = "",
  disabled = false,
  showCurrentLocation = true,
  showPopularLocations = true
}: FreeLocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentLocations] = useState<LocationSuggestion[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle input changes and search for suggestions
  useEffect(() => {
    if (!inputValue || inputValue.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchSuggestions = async () => {
      setIsLoading(true);
      console.log('FreeLocationAutocomplete: Starting search for:', inputValue);
      
      try {
        const results = await freeLocationService.getLocationSuggestions(inputValue);
        console.log('FreeLocationAutocomplete: Got', results.length, 'suggestions');
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('FreeLocationAutocomplete: Error getting suggestions:', error);
        toast({
          title: "Location search",
          description: "Using basic search. Some features may be limited.",
          variant: "default"
        });
        
        // Fallback: show manual entry option
        setSuggestions([{
          address: inputValue,
          coordinates: { lat: 0, lng: 0 },
          type: 'manual'
        }]);
        setShowSuggestions(true);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [inputValue, toast]);

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: LocationSuggestion) => {
    console.log('FreeLocationAutocomplete: Selected suggestion:', suggestion);
    
    if (suggestion.type === 'current_location') {
      setIsLoading(true);
      try {
        const currentLocation = await freeLocationService.getCurrentLocation();
        onLocationSelect({
          address: currentLocation.address,
          coordinates: currentLocation.coordinates,
          placeId: currentLocation.placeId
        });
        setInputValue(currentLocation.address);
        setShowSuggestions(false);
      } catch (error) {
        console.error('Error getting current location:', error);
        toast({
          title: "Location access",
          description: "Could not access your current location. Please enable location permissions.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      onLocationSelect({
        address: suggestion.address,
        coordinates: suggestion.coordinates,
        placeId: suggestion.placeId
      });
      setInputValue(suggestion.address);
      setShowSuggestions(false);
    }
  };

  // Handle current location button
  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const currentLocation = await freeLocationService.getCurrentLocation();
      onLocationSelect({
        address: currentLocation.address,
        coordinates: currentLocation.coordinates,
        placeId: currentLocation.placeId
      });
      setInputValue(currentLocation.address);
      toast({
        title: "Location found",
        description: "Using your current location",
        variant: "default"
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      toast({
        title: "Location access denied",
        description: "Please enable location permissions or enter address manually",
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
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get initial suggestions on focus
  const handleFocus = () => {
    if (!inputValue && showPopularLocations) {
      const popularLocations = freeLocationService.getPopularLocations();
      setSuggestions(popularLocations);
      setShowSuggestions(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Current location button */}
      {showCurrentLocation && (
        <div className="mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCurrentLocation}
            disabled={disabled || isLoading}
            className="w-full justify-start gap-2"
            data-testid="button-current-location"
          >
            <Navigation className="h-4 w-4" />
            {isLoading ? 'Getting location...' : 'Use My Current Location'}
          </Button>
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          disabled={disabled}
          className="pr-10"
          data-testid="input-location-search"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        
        {!isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto mobile-scroll">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.placeId || index}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0 transition-colors touch-target"
                onClick={() => handleSuggestionSelect(suggestion)}
                data-testid={`suggestion-${index}`}
              >
                {suggestion.type === 'current_location' ? (
                  <Navigation className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : suggestion.type === 'manual' ? (
                  <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {suggestion.address}
                  </p>
                  {suggestion.type && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {suggestion.type === 'nominatim' ? 'OpenStreetMap' : 
                       suggestion.type === 'current_location' ? 'Current Location' :
                       suggestion.type === 'manual' ? 'Manual Entry' : suggestion.type}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && inputValue.length >= 3 && !isLoading && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No locations found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}