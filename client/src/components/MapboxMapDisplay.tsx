import { useRef, useEffect, useState } from 'react';
import { mapboxService, MapboxRoute, DriverLocationUpdate } from '@/services/MapboxService';
import { Coordinates } from '@/services/GoogleMapsService';
import { LoaderIcon, MapPin, Navigation } from 'lucide-react';

interface MapboxMapDisplayProps {
  originCoordinates: Coordinates;
  destinationCoordinates: Coordinates;
  driverCoordinates?: Coordinates;
  height?: string;
  width?: string;
  zoom?: number;
  showLiveTracking?: boolean;
  className?: string;
  onDriverUpdate?: (update: DriverLocationUpdate) => void;
}

export function MapboxMapDisplay({
  originCoordinates,
  destinationCoordinates,
  driverCoordinates,
  height = '400px',
  width = '100%',
  zoom = 12,
  showLiveTracking = false,
  className = '',
  onDriverUpdate
}: MapboxMapDisplayProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<MapboxRoute | null>(null);
  const [driverSimulation, setDriverSimulation] = useState<any>(null);
  const [currentDriverPosition, setCurrentDriverPosition] = useState<DriverLocationUpdate | null>(null);
  
  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true);
        await mapboxService.loadMapboxGL();
        
        if (!mapContainerRef.current || !window.mapboxgl) {
          throw new Error('Map container or Mapbox GL not available');
        }
        
        // Create map instance
        const map = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [
            (originCoordinates.lng + destinationCoordinates.lng) / 2,
            (originCoordinates.lat + destinationCoordinates.lat) / 2
          ],
          zoom: zoom,
          attributionControl: false
        });
        
        // Add controls
        map.addControl(new window.mapboxgl.NavigationControl(), 'top-right');
        
        // Wait for map to load
        map.on('load', () => {
          setMapInstance(map);
          setLoading(false);
        });
        
        // Handle errors
        map.on('error', (e: any) => {
          console.error('Mapbox map error:', e);
          setError('An error occurred with the map');
        });
        
        return () => {
          map.remove();
        };
      } catch (error) {
        console.error('Error initializing Mapbox map:', error);
        setError('Failed to load map. Please try again.');
        setLoading(false);
      }
    };
    
    initMap();
  }, []);
  
  // Load route when map is ready
  useEffect(() => {
    const loadRoute = async () => {
      if (!mapInstance) return;
      
      try {
        // Get route from Mapbox
        const routeData = await mapboxService.getRoute(originCoordinates, destinationCoordinates);
        setRoute(routeData);
        
        // Add source for the route
        if (mapInstance.getSource('route')) {
          (mapInstance.getSource('route') as any).setData({
            type: 'Feature',
            properties: {},
            geometry: routeData.geometry
          });
        } else {
          mapInstance.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: routeData.geometry
            }
          });
          
          // Add route layer
          mapInstance.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#4f46e5',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }
        
        // Add origin and destination markers
        // Origin marker
        const originMarkerEl = document.createElement('div');
        originMarkerEl.className = 'flex items-center justify-center w-6 h-6 bg-white border-2 border-primary rounded-full';
        originMarkerEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
        
        new window.mapboxgl.Marker(originMarkerEl)
          .setLngLat([originCoordinates.lng, originCoordinates.lat])
          .addTo(mapInstance);
        
        // Destination marker
        const destMarkerEl = document.createElement('div');
        destMarkerEl.className = 'flex items-center justify-center w-6 h-6 bg-white border-2 border-red-500 rounded-full';
        destMarkerEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
        
        new window.mapboxgl.Marker(destMarkerEl)
          .setLngLat([destinationCoordinates.lng, destinationCoordinates.lat])
          .addTo(mapInstance);
        
        // Fit bounds to show the entire route
        const bounds = new window.mapboxgl.LngLatBounds();
        routeData.geometry.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord);
        });
        
        mapInstance.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
        
        // Initialize driver simulation if tracking is enabled
        if (showLiveTracking && !driverSimulation) {
          const simulation = mapboxService.simulateDriverMovement(routeData);
          
          // Set driver marker if it doesn't exist yet
          if (!mapInstance.getSource('driver')) {
            mapInstance.addSource('driver', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [originCoordinates.lng, originCoordinates.lat]
                }
              }
            });
            
            // Add the driver point layer
            mapInstance.addLayer({
              id: 'driver-point',
              type: 'circle',
              source: 'driver',
              paint: {
                'circle-radius': 7,
                'circle-color': '#4f46e5',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
              }
            });
            
            // Add a direction indicator
            mapInstance.addLayer({
              id: 'driver-direction',
              type: 'symbol',
              source: 'driver',
              layout: {
                'icon-image': 'embassy-15',
                'icon-size': 1,
                'icon-rotate': ['get', 'heading'],
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
              }
            });
          }
          
          // Subscribe to driver updates
          const unsubscribe = simulation.subscribe((update: DriverLocationUpdate) => {
            // Update driver marker position
            if (mapInstance.getSource('driver')) {
              (mapInstance.getSource('driver') as any).setData({
                type: 'Feature',
                properties: {
                  heading: update.heading
                },
                geometry: {
                  type: 'Point',
                  coordinates: [update.coordinates.lng, update.coordinates.lat]
                }
              });
            }
            
            // Update state and notify parent
            setCurrentDriverPosition(update);
            if (onDriverUpdate) {
              onDriverUpdate(update);
            }
          });
          
          // Start the simulation
          simulation.start();
          
          // Store the simulation
          setDriverSimulation(simulation);
          
          // Clean up on unmount
          return () => {
            unsubscribe();
            simulation.pause();
          };
        }
      } catch (error) {
        console.error('Error loading route:', error);
        setError('Could not load route information');
      }
    };
    
    loadRoute();
  }, [mapInstance, originCoordinates, destinationCoordinates, showLiveTracking, onDriverUpdate]);
  
  // Update driver marker from props if provided
  useEffect(() => {
    if (!mapInstance || !driverCoordinates || showLiveTracking) return;
    
    // Update or add driver marker based on props
    if (mapInstance.getSource('driver')) {
      (mapInstance.getSource('driver') as any).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [driverCoordinates.lng, driverCoordinates.lat]
        }
      });
    } else {
      mapInstance.addSource('driver', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [driverCoordinates.lng, driverCoordinates.lat]
          }
        }
      });
      
      mapInstance.addLayer({
        id: 'driver-point',
        type: 'circle',
        source: 'driver',
        paint: {
          'circle-radius': 7,
          'circle-color': '#4f46e5',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }
  }, [mapInstance, driverCoordinates, showLiveTracking]);
  
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
        ref={mapContainerRef} 
        className="w-full h-full z-0"
      ></div>
      
      {/* Route information overlay */}
      {!loading && !error && route && (
        <div className="absolute bottom-3 left-3 right-3 bg-white rounded-md shadow-md p-3 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Navigation className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">
                {route ? (route.distance / 1000).toFixed(1) + ' km' : 'Calculating...'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {route ? Math.ceil(route.duration / 60) + ' min' : 'ETA calculating...'}
            </div>
          </div>
          
          {showLiveTracking && currentDriverPosition && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs">Driver on the way</span>
              </div>
              <div className="text-xs font-medium">
                ETA: {route ? Math.ceil((route.duration * 0.8) / 60) + ' min' : '...'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}