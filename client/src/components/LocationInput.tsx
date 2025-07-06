import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Edit3, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface LocationData {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  detailedAddress?: Address;
}

interface LocationInputProps {
  label: string;
  placeholder?: string;
  value?: LocationData;
  onChange: (location: LocationData) => void;
  type?: 'pickup' | 'dropoff';
  showCurrentLocation?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  label,
  placeholder = "Enter address",
  value,
  onChange,
  type = 'pickup',
  showCurrentLocation = true
}) => {
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (value?.detailedAddress) {
      setManualAddress(value.detailedAddress);
    }
  }, [value]);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Request permission explicitly
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({name: 'geolocation'});
        if (permission.state === 'denied') {
          throw new Error('Location access denied. Please enable location in your browser settings.');
        }
      }

      console.log('Requesting current location...');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('Location obtained:', pos.coords.latitude, pos.coords.longitude);
            resolve(pos);
          },
          (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Location access failed. ';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Please enable location permissions in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage += 'An unknown error occurred.';
                break;
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log('GPS coordinates obtained:', latitude, longitude);
      
      // Try Google Maps reverse geocoding first
      const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (googleApiKey) {
        try {
          console.log('Attempting Google Maps reverse geocoding...');
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`;
          const response = await fetch(geocodeUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              const addressComponents = result.address_components;
              
              let streetNumber = '';
              let route = '';
              let city = '';
              let state = '';
              let zipCode = '';

              addressComponents.forEach((component: any) => {
                const types = component.types;
                if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                } else if (types.includes('route')) {
                  route = component.long_name;
                } else if (types.includes('locality')) {
                  city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.short_name;
                } else if (types.includes('postal_code')) {
                  zipCode = component.long_name;
                }
              });

              const streetAddress = `${streetNumber} ${route}`.trim();

              onChange({
                address: result.formatted_address,
                coordinates: { lat: latitude, lng: longitude },
                detailedAddress: {
                  street: streetAddress,
                  city,
                  state,
                  zipCode
                }
              });

              toast({
                title: "Real Location Found",
                description: `Successfully detected: ${city}, ${state}`,
              });
              return;
            }
          } else {
            console.error('Google geocoding API error:', response.status);
          }
        } catch (googleError) {
          console.error('Google geocoding failed:', googleError);
        }
      } else {
        console.warn('Google Maps API key not found');
      }

      // Use Mapbox Geocoding API for reverse geocoding
      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      
      if (!mapboxToken) {
        // Use fallback coordinates if no API token
        const detailedAddress = {
          street: 'Demo Location',
          city: 'Demo City',
          state: 'CA',
          zipCode: '90210'
        };

        onChange({
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (GPS Coordinates)`,
          coordinates: { lat: latitude, lng: longitude },
          detailedAddress
        });

        toast({
          title: "GPS Location Set",
          description: "Using GPS coordinates (Mapbox token needed for address lookup)",
        });
        return;
      }
      
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address,poi`;
      
      const response = await fetch(geocodingUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Mapbox response:', data);
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const formattedAddress = feature.place_name;
        
        // Parse detailed address components from Mapbox response
        let street = '';
        let city = '';
        let state = '';
        let zipCode = '';
        
        // Extract from place_name (usually: "123 Main St, City, State ZIP, Country")
        const parts = feature.place_name.split(', ');
        if (parts.length >= 3) {
          street = parts[0];
          city = parts[1];
          
          // Handle "State ZIP" format
          const stateZipPart = parts[2];
          const stateZipMatch = stateZipPart.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
          if (stateZipMatch) {
            state = stateZipMatch[1];
            zipCode = stateZipMatch[2];
          } else {
            state = stateZipPart;
          }
        }
        
        // Also try to extract from context array
        if (feature.context) {
          for (const context of feature.context) {
            if (context.id.startsWith('place.') && !city) {
              city = context.text;
            } else if (context.id.startsWith('region.') && !state) {
              state = context.short_code?.replace('US-', '') || context.text;
            } else if (context.id.startsWith('postcode.') && !zipCode) {
              zipCode = context.text;
            }
          }
        }

        const detailedAddress: Address = {
          street: street || 'Current Location',
          city: city || 'Unknown City',
          state: state || 'Unknown State',
          zipCode: zipCode || ''
        };

        console.log('Parsed address:', detailedAddress);

        onChange({
          address: formattedAddress,
          coordinates: { lat: latitude, lng: longitude },
          detailedAddress
        });

        toast({
          title: "Location Found",
          description: `Using ${street || 'your current location'}`,
        });
      } else {
        throw new Error('No address found for your location');
      }
    } catch (error: any) {
      console.error('Location error:', error);
      toast({
        title: "Location Error",
        description: error.message || "Could not get your location. Please enter manually.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleManualAddressChange = (field: keyof Address, value: string) => {
    const updatedAddress = { ...manualAddress, [field]: value };
    setManualAddress(updatedAddress);
    
    // Format as single address string
    const formattedAddress = `${updatedAddress.street}, ${updatedAddress.city}, ${updatedAddress.state} ${updatedAddress.zipCode}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '');
    
    onChange({
      address: formattedAddress,
      detailedAddress: updatedAddress
    });
  };

  const handleSingleAddressChange = (address: string) => {
    onChange({
      address,
      coordinates: value?.coordinates,
      detailedAddress: value?.detailedAddress
    });
  };

  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry);
    if (!isManualEntry && value?.address && !value?.detailedAddress) {
      // Try to parse existing address into components
      const parts = value.address.split(', ');
      if (parts.length >= 3) {
        const stateZip = parts[parts.length - 1].split(' ');
        setManualAddress({
          street: parts.slice(0, -2).join(', '),
          city: parts[parts.length - 2],
          state: stateZip[0] || '',
          zipCode: stateZip.slice(1).join(' ') || ''
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{label}</span>
          </div>
          <div className="flex items-center space-x-2">
            {type === 'pickup' && (
              <Badge variant={value?.coordinates ? "default" : "secondary"}>
                {value?.coordinates ? "GPS" : "Manual"}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleManualEntry}
              className="p-1 h-auto"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {!isManualEntry ? (
          <div className="space-y-3">
            {showCurrentLocation && type === 'pickup' && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {isLoadingLocation ? "Getting Location..." : "Use Current Location"}
              </Button>
            )}
            
            <Input
              placeholder={placeholder}
              value={value?.address || ''}
              onChange={(e) => handleSingleAddressChange(e.target.value)}
              className="w-full"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Detailed Address</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleManualEntry}
                className="p-1 h-auto text-green-600"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
            
            <Input
              placeholder="Street Address (e.g., 123 Main Street)"
              value={manualAddress.street}
              onChange={(e) => handleManualAddressChange('street', e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                value={manualAddress.city}
                onChange={(e) => handleManualAddressChange('city', e.target.value)}
              />
              <Input
                placeholder="State (e.g., CA)"
                value={manualAddress.state}
                onChange={(e) => handleManualAddressChange('state', e.target.value)}
                maxLength={2}
              />
            </div>
            
            <Input
              placeholder="ZIP Code (e.g., 90210)"
              value={manualAddress.zipCode}
              onChange={(e) => handleManualAddressChange('zipCode', e.target.value)}
              maxLength={10}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationInput;