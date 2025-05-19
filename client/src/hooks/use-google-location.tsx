import { useState, useEffect } from 'react';
import { googleMapsService, Coordinates, LocationResult } from '@/services/GoogleMapsService';

interface GoogleLocationState {
  loading: boolean;
  error: string | null;
  coordinates: Coordinates | null;
  address: string | null;
  placeId: string | null;
}

interface GoogleLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: GoogleLocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export function useGoogleLocation(options: GoogleLocationOptions = {}) {
  const [state, setState] = useState<GoogleLocationState>({
    loading: true,
    error: null,
    coordinates: null,
    address: null,
    placeId: null,
  });

  const mergedOptions = { ...defaultOptions, ...options };

  useEffect(() => {
    let isMounted = true;
    
    const getLocation = async () => {
      if (!navigator.geolocation) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Geolocation is not supported by your browser'
          }));
        }
        return;
      }

      try {
        // First get the current position
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve, 
            reject, 
            {
              enableHighAccuracy: mergedOptions.enableHighAccuracy,
              timeout: mergedOptions.timeout,
              maximumAge: mergedOptions.maximumAge,
            }
          );
        });

        const { latitude, longitude } = position.coords;
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: true,
            coordinates: { lat: latitude, lng: longitude },
          }));
        }

        // Then get the address from Google Maps
        try {
          const locationResult = await googleMapsService.getAddressFromCoordinates(latitude, longitude);
          
          if (isMounted) {
            setState(prev => ({
              ...prev,
              loading: false,
              address: locationResult.formattedAddress,
              placeId: locationResult.placeId || null,
            }));
          }
        } catch (error) {
          console.error('Error getting address from coordinates:', error);
          if (isMounted) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: 'Failed to get address from coordinates'
            }));
          }
        }
      } catch (error) {
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Failed to get your location';
        if (error instanceof GeolocationPositionError) {
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location access denied. Please enable location services.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information is unavailable.';
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'Location request timed out.';
          }
        }
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage
          }));
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, [
    mergedOptions.enableHighAccuracy,
    mergedOptions.timeout,
    mergedOptions.maximumAge
  ]);

  // Methods to expose to component
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<LocationResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await googleMapsService.getAddressFromCoordinates(lat, lng);
      
      setState(prev => ({
        ...prev,
        loading: false,
        coordinates: { lat, lng },
        address: result.formattedAddress,
        placeId: result.placeId || null,
      }));
      
      return result;
    } catch (error) {
      console.error('Error in getAddressFromCoordinates:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to get address from coordinates'
      }));
      
      throw error;
    }
  };

  const getCoordinatesFromAddress = async (address: string): Promise<LocationResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await googleMapsService.getCoordinatesFromAddress(address);
      
      setState(prev => ({
        ...prev,
        loading: false,
        coordinates: result.coordinates,
        address: result.formattedAddress,
        placeId: result.placeId || null,
      }));
      
      return result;
    } catch (error) {
      console.error('Error in getCoordinatesFromAddress:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to get coordinates from address'
      }));
      
      throw error;
    }
  };

  return {
    ...state,
    getAddressFromCoordinates,
    getCoordinatesFromAddress,
  };
}