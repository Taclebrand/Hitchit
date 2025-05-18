import React from 'react';
import { useLocation } from 'wouter';
import SimpleDriverTracking from '@/components/SimpleDriverTracking';

const DriverTracking: React.FC = () => {
  const [, setLocation] = useLocation();

  // Sample data - in a real app, this would come from API or context
  const driverData = {
    rideId: '12345',
    userLocation: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '350 5th Ave, New York, NY 10118'
    },
    destination: {
      latitude: 40.7484,
      longitude: -73.9857,
      address: 'Empire State Building, NY 10001'
    },
    estimatedArrival: '5 mins'
  };

  const handleClose = () => {
    setLocation('/home');
  };

  return (
    <SimpleDriverTracking
      rideId={driverData.rideId}
      userLocation={driverData.userLocation}
      destination={driverData.destination}
      estimatedArrival={driverData.estimatedArrival}
      onClose={handleClose}
    />
  );
};

export default DriverTracking;