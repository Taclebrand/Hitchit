// GoogleMapsService.ts
// This service handles all Google Maps related functionality

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationResult {
  coordinates: Coordinates;
  formattedAddress: string;
  placeId?: string;
}

export interface RouteInfo {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  encodedPolyline: any; // Can be string or object with points property
}

class GoogleMapsService {
  private apiKey: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  private geocoder: google.maps.Geocoder | null = null;
  private directionsService: google.maps.DirectionsService | null = null;

  // Initialize Google Maps services when needed
  private initServices() {
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }
    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }
  }

  // Check if Google Maps API is loaded
  public isLoaded(): boolean {
    return typeof google !== 'undefined' && !!google.maps;
  }

  // Load Google Maps API script
  public async loadGoogleMapsApi(): Promise<void> {
    if (this.isLoaded()) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Check if we already have a Google Maps script in the document
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        if (window.google && window.google.maps) {
          this.initServices();
          resolve();
          return;
        }
      }
      
      const script = document.createElement('script');
      
      // Get API key from environment variables (Vite uses import.meta.env)
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      console.log("Using Google Maps with API key present:", !!apiKey);
      
      if (!apiKey) {
        throw new Error('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your environment.');
      }
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.initServices();
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });
  }

  // Get coordinates from address using Geocoding
  public async getCoordinatesFromAddress(address: string): Promise<LocationResult> {
    try {
      await this.loadGoogleMapsApi();
      this.initServices();

      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }

      const response = await this.geocoder.geocode({ address });
      
      if (response.results.length === 0) {
        throw new Error('No results found for the address');
      }

      const result = response.results[0];
      const location = result.geometry.location;

      return {
        coordinates: {
          lat: location.lat(),
          lng: location.lng()
        },
        formattedAddress: result.formatted_address,
        placeId: result.place_id
      };
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      throw error;
    }
  }

  // Get address from coordinates using Reverse Geocoding
  public async getAddressFromCoordinates(lat: number, lng: number): Promise<LocationResult> {
    try {
      await this.loadGoogleMapsApi();
      this.initServices();

      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }

      const response = await this.geocoder.geocode({
        location: { lat, lng }
      });

      if (response.results.length === 0) {
        throw new Error('No results found for the coordinates');
      }

      const result = response.results[0];
      
      return {
        coordinates: { lat, lng },
        formattedAddress: result.formatted_address,
        placeId: result.place_id
      };
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      throw error;
    }
  }

  // Get route information between two points
  public async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteInfo> {
    try {
      await this.loadGoogleMapsApi();
      this.initServices();

      if (!this.directionsService) {
        throw new Error('Directions service not initialized');
      }

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING
      };

      const response = await this.directionsService.route(request);

      if (!response.routes.length || !response.routes[0].legs.length) {
        throw new Error('No route found');
      }

      const route = response.routes[0];
      const leg = route.legs[0];

      return {
        distance: {
          text: leg.distance?.text || '0 km',
          value: leg.distance?.value || 0
        },
        duration: {
          text: leg.duration?.text || '0 mins',
          value: leg.duration?.value || 0
        },
        encodedPolyline: typeof route.overview_polyline === 'string' 
          ? route.overview_polyline 
          : route.overview_polyline.points
      };
    } catch (error) {
      console.error('Error getting route:', error);
      throw error;
    }
  }

  // Calculate ETA (estimated time of arrival) between two points
  public async calculateETA(origin: Coordinates, destination: Coordinates): Promise<string> {
    try {
      const routeInfo = await this.getRoute(origin, destination);
      return routeInfo.duration.text;
    } catch (error) {
      console.error('Error calculating ETA:', error);
      throw error;
    }
  }

  // Calculate fare estimate based on distance
  public calculateFareEstimate(distanceInMeters: number, rideType: string = 'economy'): number {
    const baseRates: Record<string, number> = {
      economy: 1.5,  // $1.50 per km
      comfort: 2.0,  // $2.00 per km
      premium: 3.0   // $3.00 per km
    };
    
    const baseRate = baseRates[rideType] || baseRates.economy;
    const baseFare = 2.5; // Base fare $2.50
    const distanceInKm = distanceInMeters / 1000;
    
    return parseFloat((baseFare + (distanceInKm * baseRate)).toFixed(2));
  }
}

// Export as singleton
export const googleMapsService = new GoogleMapsService();