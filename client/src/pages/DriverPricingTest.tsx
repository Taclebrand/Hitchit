import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LocationInput from '@/components/LocationInput';
import PricingControl from '@/components/PricingControl';
import AppLayout from '@/components/AppLayout';
import { ArrowLeft, Car, Package } from 'lucide-react';
import { useLocation } from 'wouter';

interface LocationData {
  address: string;
  coordinates?: { lat: number; lng: number };
  detailedAddress?: any;
}

const DriverPricingTest: React.FC = () => {
  const [, setLocation] = useLocation();
  const [serviceType, setServiceType] = useState<'ride' | 'package'>('ride');
  
  const [pickupLocation, setPickupLocation] = useState<LocationData>({
    address: "",
    coordinates: undefined,
    detailedAddress: undefined
  });
  
  const [dropoffLocation, setDropoffLocation] = useState<LocationData>({
    address: "",
    coordinates: undefined,
    detailedAddress: undefined
  });

  const [ridePricing, setRidePricing] = useState({
    basePrice: 3.50,
    perMileRate: 1.25,
    perMinuteRate: 0.35,
    minimumFare: 7.00,
    useCustomPrice: false
  });

  const [packagePricing, setPackagePricing] = useState({
    basePrice: 5.00,
    perMileRate: 1.50,
    perMinuteRate: 0.25,
    minimumFare: 8.00,
    useCustomPrice: false
  });

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = () => {
    if (!pickupLocation.coordinates || !dropoffLocation.coordinates) return 0;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (dropoffLocation.coordinates.lat - pickupLocation.coordinates.lat) * Math.PI / 180;
    const dLon = (dropoffLocation.coordinates.lng - pickupLocation.coordinates.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pickupLocation.coordinates.lat * Math.PI / 180) * 
              Math.cos(dropoffLocation.coordinates.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const estimateTime = () => {
    const distance = calculateDistance();
    if (serviceType === 'ride') {
      return Math.round(distance * 2.5 + 10); // Ride: 2.5 min per mile + 10 min base
    } else {
      return Math.round(distance * 3 + 15); // Package: 3 min per mile + 15 min base
    }
  };

  // Sample locations for testing
  const loadSampleRoute = () => {
    setPickupLocation({
      address: "123 Main St, Downtown, CA 90210",
      coordinates: { lat: 34.0522, lng: -118.2437 },
      detailedAddress: {
        street: "123 Main St",
        city: "Downtown",
        state: "CA",
        zipCode: "90210"
      }
    });

    setDropoffLocation({
      address: "456 Oak Ave, Beverly Hills, CA 90210",
      coordinates: { lat: 34.0736, lng: -118.4004 },
      detailedAddress: {
        street: "456 Oak Ave",
        city: "Beverly Hills",
        state: "CA",
        zipCode: "90210"
      }
    });
  };

  const currentPricing = serviceType === 'ride' ? ridePricing : packagePricing;
  const setPricing = serviceType === 'ride' ? setRidePricing : setPackagePricing;

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/home')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Driver Pricing Test</h1>
            <p className="text-sm text-gray-600">Test Airbnb-style pricing controls</p>
          </div>
        </div>

        {/* Service Type Toggle */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Select Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button
                variant={serviceType === 'ride' ? 'default' : 'outline'}
                onClick={() => setServiceType('ride')}
                className="flex-1"
              >
                <Car className="h-4 w-4 mr-2" />
                Ride Sharing
              </Button>
              <Button
                variant={serviceType === 'package' ? 'default' : 'outline'}
                onClick={() => setServiceType('package')}
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Package Delivery
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sample Data Button */}
        <div className="mb-4">
          <Button
            onClick={loadSampleRoute}
            variant="outline"
            className="w-full"
          >
            Load Sample Route (Downtown LA → Beverly Hills)
          </Button>
        </div>

        {/* Location Inputs */}
        <div className="space-y-4 mb-4">
          <LocationInput
            label="Pickup Location"
            placeholder="Enter pickup address"
            value={pickupLocation}
            onChange={setPickupLocation}
            type="pickup"
            showCurrentLocation={true}
          />
          
          <LocationInput
            label="Dropoff Location"
            placeholder="Enter dropoff address"
            value={dropoffLocation}
            onChange={setDropoffLocation}
            type="dropoff"
            showCurrentLocation={false}
          />
        </div>

        {/* Trip Info */}
        {pickupLocation.coordinates && dropoffLocation.coordinates && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {calculateDistance().toFixed(1)} mi
                  </div>
                  <div className="text-xs text-gray-500">Distance</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {estimateTime()} min
                  </div>
                  <div className="text-xs text-gray-500">Est. Time</div>
                </div>
                <div>
                  <Badge variant={serviceType === 'ride' ? 'default' : 'secondary'}>
                    {serviceType === 'ride' ? 'Ride' : 'Package'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Control */}
        <PricingControl
          distance={calculateDistance()}
          estimatedDuration={estimateTime()}
          serviceType={serviceType}
          value={currentPricing}
          onChange={setPricing}
        />

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>1. Load sample route or enter your own locations</div>
            <div>2. Switch between ride and package services</div>
            <div>3. Toggle custom pricing to override recommendations</div>
            <div>4. Adjust advanced settings to see how they affect pricing</div>
            <div>5. Notice how distance and time impact recommended prices</div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DriverPricingTest;