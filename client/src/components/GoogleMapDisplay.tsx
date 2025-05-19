import { useRef, useEffect, useState } from 'react';
import { googleMapsService, Coordinates } from '@/services/GoogleMapsService';
import { fallbackLocationService } from '@/services/FallbackLocationService';
import { LoaderIcon, MapPin, Navigation } from 'lucide-react';

interface GoogleMapDisplayProps {
  originCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  driverCoordinates?: Coordinates;
  height?: string;
  width?: string;
  zoom?: number;
  showDirections?: boolean;
  className?: string;
}

export function GoogleMapDisplay({
  originCoordinates,
  destinationCoordinates,
  driverCoordinates,
  height = '400px',
  width = '100%',
  zoom = 12,
  showDirections = true,
  className = ''
}: GoogleMapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize map and services
  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true);
        await googleMapsService.loadGoogleMapsApi();
        
        if (!mapRef.current) return;
        
        // Create map instance
        const map = new google.maps.Map(mapRef.current, {
          center: { 
            lat: (originCoordinates.lat + destinationCoordinates.lat) / 2,
            lng: (originCoordinates.lng + destinationCoordinates.lng) / 2
          },
          zoom: zoom,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });
        
        setMapInstance(map);
        
        // Create directions renderer
        const renderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#4f46e5',
            strokeWeight: 5,
            strokeOpacity: 0.7
          }
        });
        
        setDirectionsRenderer(renderer);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing map:", error);
        setError("Failed to load map. Please try again.");
        setLoading(false);
      }
    };
    
    initMap();
    
    return () => {
      // Clean up
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, []);
  
  // Update directions when coordinates change
  useEffect(() => {
    const updateDirections = async () => {
      if (!mapInstance || !directionsRenderer || !showDirections) return;
      
      try {
        const directionsService = new google.maps.DirectionsService();
        
        const result = await directionsService.route({
          origin: new google.maps.LatLng(originCoordinates.lat, originCoordinates.lng),
          destination: new google.maps.LatLng(destinationCoordinates.lat, destinationCoordinates.lng),
          travelMode: google.maps.TravelMode.DRIVING
        });
        
        directionsRenderer.setDirections(result);
      } catch (error) {
        console.error("Error calculating directions:", error);
        setError("Could not calculate route directions.");
      }
    };
    
    updateDirections();
  }, [mapInstance, directionsRenderer, originCoordinates, destinationCoordinates, showDirections]);
  
  // Update driver marker
  useEffect(() => {
    if (!mapInstance || !driverCoordinates) return;
    
    // Create or update driver marker
    const driverMarker = new google.maps.Marker({
      position: new google.maps.LatLng(driverCoordinates.lat, driverCoordinates.lng),
      map: mapInstance,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4f46e5',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      },
      title: 'Driver location'
    });
    
    // Create a custom info window
    const infoWindow = new google.maps.InfoWindow({
      content: '<div style="padding: 8px; font-family: system-ui, sans-serif;">Your driver is here</div>'
    });
    
    // Show info window on hover
    driverMarker.addListener('mouseover', () => {
      infoWindow.open(mapInstance, driverMarker);
    });
    
    driverMarker.addListener('mouseout', () => {
      infoWindow.close();
    });
    
    return () => {
      // Clean up marker when component unmounts or coordinates change
      driverMarker.setMap(null);
    };
  }, [mapInstance, driverCoordinates]);
  
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`} style={{ height, width }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-primary font-medium">Loading map...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              className="px-3 py-1 bg-primary text-white rounded-md text-sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full z-0"
      ></div>
      
      {/* Travel details overlay */}
      {!loading && !error && (
        <div className="absolute bottom-3 left-3 right-3 bg-white rounded-md shadow-md p-3 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Navigation className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">
                {originCoordinates && destinationCoordinates ? 
                  "Route Ready" : "Set pickup and destination"}
              </span>
            </div>
            {originCoordinates && destinationCoordinates && (
              <div className="text-xs text-slate-500">
                ETA calculating...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}