import { useState, useEffect } from 'react';

interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  timestamp: number | null;
  locationName: string | null;
}

interface GeoLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fetchLocationName?: boolean;
}

const defaultOptions: GeoLocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  fetchLocationName: true
};

export function useGeolocation(options: GeoLocationOptions = {}) {
  const [state, setState] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    timestamp: null,
    locationName: null,
  });

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    const geoSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      // Update state with coordinates
      setState(prev => ({
        ...prev,
        latitude,
        longitude,
        accuracy,
        timestamp: position.timestamp,
        loading: mergedOptions.fetchLocationName ? true : false,
      }));

      // Fetch location name if requested
      if (mergedOptions.fetchLocationName) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch location name');
          }
          
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const placeName = data.features[0].place_name;
            setState(prev => ({
              ...prev,
              locationName: placeName,
              loading: false,
            }));
          } else {
            setState(prev => ({
              ...prev,
              locationName: null,
              loading: false,
            }));
          }
        } catch (error) {
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Unknown error fetching location name',
            loading: false,
          }));
        }
      }
    };

    const geoError = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    };

    const watchId = navigator.geolocation.watchPosition(
      geoSuccess,
      geoError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );

    // Cleanup function to stop watching location
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge, mergedOptions.fetchLocationName]);

  return state;
}

// Helper function to calculate distance between two coordinates in km
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}