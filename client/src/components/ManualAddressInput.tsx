import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search } from 'lucide-react';
import { GoogleMapsService } from '@/services/GoogleMapsService';
import { useToast } from '@/hooks/use-toast';

interface ManualAddressInputProps {
  label: string;
  onLocationSelect: (locationData: {
    address: string;
    coordinates: { lat: number; lng: number } | null;
    detailedAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    } | null;
  }) => void;
  onCancel: () => void;
}

const ManualAddressInput: React.FC<ManualAddressInputProps> = ({
  label,
  onLocationSelect,
  onCancel
}) => {
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAddress = () => {
    if (!addressData.street.trim()) {
      toast({
        title: "Street Address Required",
        description: "Please enter a street address",
        variant: "destructive"
      });
      return false;
    }
    
    if (!addressData.city.trim()) {
      toast({
        title: "City Required",
        description: "Please enter a city",
        variant: "destructive"
      });
      return false;
    }
    
    if (!addressData.state.trim()) {
      toast({
        title: "State Required",
        description: "Please enter a state",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleGeocode = async () => {
    if (!validateAddress()) return;

    setIsLoading(true);
    
    try {
      // Construct full address
      const fullAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`.trim();
      
      // Try to geocode using Google Maps
      const locationData = await GoogleMapsService.geocodeAddress(fullAddress);
      
      if (locationData) {
        onLocationSelect({
          address: locationData.address,
          coordinates: {
            lat: locationData.lat,
            lng: locationData.lng
          },
          detailedAddress: {
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode
          }
        });
        
        toast({
          title: "Address Found",
          description: "Successfully located address with GPS coordinates",
        });
      } else {
        // If geocoding fails, still use the manual address without coordinates
        onLocationSelect({
          address: fullAddress,
          coordinates: null,
          detailedAddress: {
            street: addressData.street,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode
          }
        });
        
        toast({
          title: "Address Saved",
          description: "Address saved without GPS coordinates (geocoding unavailable)",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Fallback - use manual address without coordinates
      const fullAddress = `${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipCode}`.trim();
      
      onLocationSelect({
        address: fullAddress,
        coordinates: null,
        detailedAddress: {
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode
        }
      });
      
      toast({
        title: "Address Saved",
        description: "Address saved without GPS coordinates",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Enter {label} Address Manually
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="street">Street Address *</Label>
          <Input
            id="street"
            placeholder="123 Main St"
            value={addressData.street}
            onChange={(e) => handleInputChange('street', e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="Houston"
              value={addressData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              placeholder="TX"
              value={addressData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            placeholder="77001"
            value={addressData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleGeocode} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Finding Location...
              </div>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Use This Address
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          We'll try to find GPS coordinates for this address to improve accuracy
        </p>
      </CardContent>
    </Card>
  );
};

export default ManualAddressInput;