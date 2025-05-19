import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGeolocation } from '@/hooks/use-geolocation';
import { MapPinIcon, LoaderIcon, Navigation } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  label?: string;
  buttonText?: string;
}

export function LocationPicker({
  onLocationSelect,
  label = "Current Location",
  buttonText = "Use Current Location"
}: LocationPickerProps) {
  const {
    latitude,
    longitude,
    loading,
    error,
    locationName
  } = useGeolocation();

  const [address, setAddress] = useState('');

  // Update address when locationName changes
  useEffect(() => {
    if (locationName) {
      setAddress(locationName);
    }
  }, [locationName]);

  const handleUseCurrentLocation = () => {
    if (latitude && longitude && locationName) {
      onLocationSelect({
        address: locationName,
        lat: latitude,
        lng: longitude
      });
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <MapPinIcon className="w-5 h-5 mr-2 text-primary" />
          <span className="font-medium">{label}</span>
        </div>
        <Input
          placeholder="Enter your location"
          value={address}
          onChange={handleAddressChange}
          className="w-full"
        />
      </div>

      <Button
        variant="outline"
        className="w-full flex justify-center items-center gap-2"
        onClick={handleUseCurrentLocation}
        disabled={loading || !!error || !latitude || !longitude}
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
          {error === 'User denied Geolocation' 
            ? 'Please enable location services in your browser settings'
            : error}
        </p>
      )}

      {latitude && longitude && locationName && (
        <Card className="p-3 mt-2 bg-muted/30">
          <p className="text-sm">
            <span className="font-medium">Found:</span> {locationName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </Card>
      )}
    </div>
  );
}