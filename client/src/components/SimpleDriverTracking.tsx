import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CarIcon, MapPinIcon } from '@/lib/icons';

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading: number; // in degrees, 0 is north, 90 is east
  address: string;
  estimatedTimeText: string;
  estimatedDistanceText: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface Destination {
  latitude: number;
  longitude: number;
  address: string;
}

interface SimpleDriverTrackingProps {
  rideId: string;
  initialDriverLocation?: DriverLocation;
  userLocation: UserLocation;
  destination: Destination;
  estimatedArrival: string;
  onClose: () => void;
}

const SimpleDriverTracking: React.FC<SimpleDriverTrackingProps> = ({
  rideId,
  initialDriverLocation,
  userLocation,
  destination,
  estimatedArrival,
  onClose
}) => {
  // Driver location state (will be updated in real-time)
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    initialDriverLocation || null
  );
  
  // Simulation interval for moving the driver (will be replaced with WebSocket data)
  const simulationRef = useRef<number | null>(null);
  
  // Steps to simulate a journey
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 10;
  
  // Simulate driver movement
  const simulateDriverMovement = () => {
    if (!driverLocation) return;
    
    // Increment step
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      
      // Calculate new position (simple linear interpolation)
      const startLat = userLocation.latitude;
      const startLng = userLocation.longitude;
      const endLat = destination.latitude;
      const endLng = destination.longitude;
      
      const progress = currentStep / totalSteps;
      
      // New position
      const newLat = startLat + (endLat - startLat) * progress;
      const newLng = startLng + (endLng - startLng) * progress;
      
      // Calculate heading
      const heading = Math.atan2(endLng - startLng, endLat - startLat) * 180 / Math.PI;
      
      // Calculate remaining time and distance based on progress
      const remainingMins = Math.round((1 - progress) * 10);
      const remainingDistance = Math.round((1 - progress) * 5 * 10) / 10;
      
      // Mock different street addresses along the route
      const streetNames = [
        "Main Street", "Park Avenue", "Broadway", "5th Avenue", 
        "Elm Street", "Oak Lane", "Maple Drive", "Cedar Boulevard",
        "Pine Road", "Willow Way", "Cherry Lane"
      ];
      
      setDriverLocation({
        latitude: newLat,
        longitude: newLng,
        heading: heading,
        address: `${Math.floor(Math.random() * 1000) + 1} ${streetNames[currentStep % streetNames.length]}`,
        estimatedTimeText: `${remainingMins} min${remainingMins !== 1 ? 's' : ''}`,
        estimatedDistanceText: `${remainingDistance} miles`
      });
    }
  };
  
  // Start/stop the simulation when the component mounts/unmounts
  useEffect(() => {
    // If no initial driver location is provided, create one
    if (!driverLocation) {
      setDriverLocation({
        latitude: userLocation.latitude - 0.01,
        longitude: userLocation.longitude - 0.01,
        heading: 45,
        address: "123 Starting Street",
        estimatedTimeText: "10 mins",
        estimatedDistanceText: "5 miles"
      });
    }
    
    // Start simulation interval
    simulationRef.current = window.setInterval(simulateDriverMovement, 2000);
    
    // Cleanup on unmount
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [driverLocation, userLocation, currentStep]);
  
  // In a real app, we would set up a WebSocket connection here to get real-time updates

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="relative p-4 bg-white shadow-sm z-10">
        <Button 
          variant="ghost" 
          className="absolute left-2 top-4 p-2"
          onClick={onClose}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold">Driver is on the way</h2>
          <p className="text-sm text-gray-500">Estimated arrival: {driverLocation?.estimatedTimeText || estimatedArrival}</p>
        </div>
      </div>
      
      {/* Progress tracker */}
      <div className="flex flex-col bg-gray-50 px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-5 w-[2px] bg-gray-200"></div>
            
            {/* Driver */}
            <div className="flex items-start mb-10 relative z-10">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mr-4 relative">
                <CarIcon width={20} height={20} />
              </div>
              <div>
                <h3 className="font-medium mb-1">Driver's current location</h3>
                <p className="text-sm text-gray-600">{driverLocation?.address || "Loading..."}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                    {driverLocation?.estimatedDistanceText || "Calculating..."}
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 rounded-full px-2 py-1 ml-2">
                    {driverLocation?.estimatedTimeText || "Calculating..."}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Pickup */}
            <div className="flex items-start mb-10 relative z-10">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mr-4">
                <MapPinIcon width={20} height={20} />
              </div>
              <div>
                <h3 className="font-medium mb-1">Pickup location</h3>
                <p className="text-sm text-gray-600">{userLocation.address}</p>
              </div>
            </div>
            
            {/* Destination */}
            <div className="flex items-start relative z-10">
              <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center mr-4">
                <MapPinIcon width={20} height={20} />
              </div>
              <div>
                <h3 className="font-medium mb-1">Destination</h3>
                <p className="text-sm text-gray-600">{destination.address}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Real-time progress bar */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="mb-2 flex justify-between text-sm font-medium">
            <span>Driver progress</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-in-out" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Driver Info Footer */}
      <div className="p-4 bg-white border-t mt-auto">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Driver" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-medium">John Driver</h3>
            <div className="flex items-center text-sm text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                4.8
              </span>
              <span className="mx-2">•</span>
              <span>Toyota Camry</span>
              <span className="mx-2">•</span>
              <span>ABC 123</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="py-5">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </Button>
          <Button variant="outline" className="py-5">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDriverTracking;