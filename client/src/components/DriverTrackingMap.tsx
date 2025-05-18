import React, { useState, useEffect, useRef } from 'react';
import { Map, Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { CarIcon, MapPinIcon } from '@/lib/icons';

// The component will use environment variables for the token
// We'll access it using import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading: number; // in degrees, 0 is north, 90 is east
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface Destination {
  latitude: number;
  longitude: number;
  address: string;
}

interface DriverTrackingMapProps {
  rideId: string;
  initialDriverLocation?: DriverLocation;
  userLocation: UserLocation;
  destination: Destination;
  estimatedArrival: string;
  onClose: () => void;
}

const DriverTrackingMap: React.FC<DriverTrackingMapProps> = ({
  rideId,
  initialDriverLocation,
  userLocation,
  destination,
  estimatedArrival,
  onClose
}) => {
  // Map state
  const [viewState, setViewState] = useState({
    longitude: userLocation.longitude,
    latitude: userLocation.latitude,
    zoom: 14
  });

  // Driver location state (will be updated in real-time)
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    initialDriverLocation || null
  );

  // Simulation interval for moving the driver (will be replaced with WebSocket data)
  const simulationRef = useRef<number | null>(null);

  // Function to simulate driver movement
  const simulateDriverMovement = () => {
    if (!driverLocation) return;

    // Create a path towards the user location
    const targetLat = userLocation.latitude;
    const targetLng = userLocation.longitude;
    
    const latDiff = targetLat - driverLocation.latitude;
    const lngDiff = targetLng - driverLocation.longitude;
    
    // Calculate heading
    const heading = Math.atan2(lngDiff, latDiff) * 180 / Math.PI;
    
    // Move driver a small amount towards the user
    const newDriverLocation = {
      latitude: driverLocation.latitude + (latDiff * 0.02),
      longitude: driverLocation.longitude + (lngDiff * 0.02),
      heading: heading
    };
    
    setDriverLocation(newDriverLocation);
  };

  // Start/stop the simulation when the component mounts/unmounts
  useEffect(() => {
    // If no initial driver location is provided, create one at a distance from the user
    if (!driverLocation) {
      const offsetLat = (Math.random() - 0.5) * 0.01;
      const offsetLng = (Math.random() - 0.5) * 0.01;
      
      setDriverLocation({
        latitude: userLocation.latitude + offsetLat,
        longitude: userLocation.longitude + offsetLng,
        heading: 0
      });
    }

    // Start simulation interval
    simulationRef.current = window.setInterval(simulateDriverMovement, 1000);
    
    // Cleanup on unmount
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [driverLocation, userLocation]);

  // In a real app, we would set up a WebSocket connection here to get real-time updates
  // Example:
  // useEffect(() => {
  //   const socket = new WebSocket(`wss://api.example.com/rides/${rideId}/track`);
  //   
  //   socket.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     setDriverLocation({
  //       latitude: data.latitude,
  //       longitude: data.longitude,
  //       heading: data.heading
  //     });
  //   };
  //   
  //   return () => {
  //     socket.close();
  //   };
  // }, [rideId]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Map Header */}
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
          <p className="text-sm text-gray-500">Estimated arrival: {estimatedArrival}</p>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 relative">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''}
        >
          {/* Navigation Controls */}
          <NavigationControl position="top-right" />
          
          {/* Driver Marker */}
          {driverLocation && (
            <Marker 
              longitude={driverLocation.longitude} 
              latitude={driverLocation.latitude}
              anchor="center"
            >
              <div className="relative">
                <div 
                  className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center transform"
                  style={{ 
                    transform: `rotate(${driverLocation.heading}deg)`,
                    boxShadow: '0 0 0 4px rgba(23, 195, 178, 0.3)'
                  }}
                >
                  <CarIcon width={20} height={20} />
                </div>
              </div>
            </Marker>
          )}
          
          {/* User Pickup Marker */}
          <Marker 
            longitude={userLocation.longitude} 
            latitude={userLocation.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                <MapPinIcon width={16} height={16} />
              </div>
              <div className="mt-1 px-2 py-1 bg-white text-xs font-medium rounded-md shadow-md">
                Pickup
              </div>
            </div>
          </Marker>
          
          {/* Destination Marker */}
          <Marker 
            longitude={destination.longitude} 
            latitude={destination.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                <MapPinIcon width={16} height={16} />
              </div>
              <div className="mt-1 px-2 py-1 bg-white text-xs font-medium rounded-md shadow-md">
                Destination
              </div>
            </div>
          </Marker>
        </Map>
      </div>
      
      {/* Driver Info Footer */}
      <div className="p-4 bg-white border-t">
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

export default DriverTrackingMap;