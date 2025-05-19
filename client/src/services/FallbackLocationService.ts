import { Coordinates } from './GoogleMapsService';

// Types to match Google Maps API response structure
type RouteResponse = {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string; 
    value: number;
  };
  polyline: string;
};

type LocationSearchResult = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type AddressDetails = {
  placeId: string;
  address: string;
  coordinates: Coordinates;
  formattedAddress: string;
};

// Demo locations for testing without API keys
const demoLocations: Record<string, AddressDetails> = {
  'demo-place-id-1': {
    placeId: 'demo-place-id-1',
    address: 'Downtown Los Angeles, CA, USA',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    formattedAddress: 'Downtown Los Angeles, CA, USA'
  },
  'demo-place-id-2': {
    placeId: 'demo-place-id-2',
    address: 'Santa Monica Pier, Santa Monica, CA, USA',
    coordinates: { lat: 34.0085, lng: -118.4985 },
    formattedAddress: 'Santa Monica Pier, Santa Monica, CA, USA'
  },
  'demo-place-id-3': {
    placeId: 'demo-place-id-3',
    address: 'Hollywood Sign, Los Angeles, CA, USA',
    coordinates: { lat: 34.1341, lng: -118.3215 },
    formattedAddress: 'Hollywood Sign, Los Angeles, CA, USA'
  },
  'demo-place-id-4': {
    placeId: 'demo-place-id-4',
    address: 'Universal Studios Hollywood, Universal City, CA, USA',
    coordinates: { lat: 34.1381, lng: -118.3534 },
    formattedAddress: 'Universal Studios Hollywood, Universal City, CA, USA'
  },
  'demo-place-id-5': {
    placeId: 'demo-place-id-5',
    address: 'Griffith Observatory, Los Angeles, CA, USA',
    coordinates: { lat: 34.1184, lng: -118.3004 },
    formattedAddress: 'Griffith Observatory, Los Angeles, CA, USA'
  },
  'demo-place-id-6': {
    placeId: 'demo-place-id-6',
    address: 'Venice Beach, Los Angeles, CA, USA',
    coordinates: { lat: 33.9850, lng: -118.4695 },
    formattedAddress: 'Venice Beach, Los Angeles, CA, USA'
  },
  'demo-place-id-7': {
    placeId: 'demo-place-id-7',
    address: 'The Getty Center, Los Angeles, CA, USA',
    coordinates: { lat: 34.0775, lng: -118.4746 },
    formattedAddress: 'The Getty Center, Los Angeles, CA, USA'
  },
  'demo-place-id-8': {
    placeId: 'demo-place-id-8',
    address: 'Dodger Stadium, Los Angeles, CA, USA',
    coordinates: { lat: 34.0739, lng: -118.2400 },
    formattedAddress: 'Dodger Stadium, Los Angeles, CA, USA'
  }
};

// Helper functions
const calculateDistance = (start: Coordinates, end: Coordinates): number => {
  // Haversine formula to calculate distance between two coordinates in meters
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (start.lat * Math.PI) / 180;
  const φ2 = (end.lat * Math.PI) / 180;
  const Δφ = ((end.lat - start.lat) * Math.PI) / 180;
  const Δλ = ((end.lng - start.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hr ${remainingMinutes} min`;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// The Fallback Location Service
class FallbackLocationService {
  private readonly baseFare = 5.00;
  private readonly costPerKm = [2.20, 3.50, 5.00]; // Economy, Comfort, Premium
  private readonly surgeMultiplier = 1.2; // 20% surge during peak hours

  // Search for location by query
  async searchLocation(query: string): Promise<LocationSearchResult[]> {
    // Create filtered list based on query
    return Object.values(demoLocations)
      .filter(location => 
        location.address.toLowerCase().includes(query.toLowerCase())
      )
      .map(location => ({
        placeId: location.placeId,
        description: location.address,
        mainText: location.address.split(',')[0],
        secondaryText: location.address.split(',').slice(1).join(',').trim()
      }));
  }

  // Get address details by place ID
  async getAddressDetails(placeId: string): Promise<AddressDetails> {
    // Introduce a small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return the demo location if it exists
    if (demoLocations[placeId]) {
      return demoLocations[placeId];
    }
    
    // Return a default fallback location if not found
    return demoLocations['demo-place-id-1'];
  }

  // Get address from coordinates
  async getAddressFromCoordinates(lat: number, lng: number): Promise<{formattedAddress: string, placeId: string}> {
    // Find the closest demo location
    let closest = Object.values(demoLocations)[0];
    let closestDistance = Number.MAX_VALUE;
    
    Object.values(demoLocations).forEach(location => {
      const distance = calculateDistance({lat, lng}, location.coordinates);
      if (distance < closestDistance) {
        closest = location;
        closestDistance = distance;
      }
    });
    
    return {
      formattedAddress: closest.formattedAddress,
      placeId: closest.placeId
    };
  }

  // Get route between two points
  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResponse> {
    // Calculate distance in meters
    const distanceMeters = calculateDistance(origin, destination);
    
    // Approximate duration (assume average speed of 40 km/h)
    const durationSeconds = Math.round(distanceMeters / (40 * 1000 / 3600));
    
    // Generate encoded polyline (simplified version)
    const polyline = `encoded_polyline_${origin.lat}_${origin.lng}_to_${destination.lat}_${destination.lng}`;
    
    return {
      distance: {
        text: formatDistance(distanceMeters),
        value: distanceMeters
      },
      duration: {
        text: formatDuration(durationSeconds),
        value: durationSeconds
      },
      polyline: polyline
    };
  }

  // Calculate fare estimate
  calculateFareEstimate(distanceMeters: number, rideType: string): number {
    const distanceKm = distanceMeters / 1000;
    
    let fareMultiplier: number;
    
    // Match ride type to fare multiplier
    switch (rideType.toLowerCase()) {
      case 'comfort':
        fareMultiplier = this.costPerKm[1];
        break;
      case 'premium':
        fareMultiplier = this.costPerKm[2];
        break;
      case 'economy':
      default:
        fareMultiplier = this.costPerKm[0];
        break;
    }
    
    // Add peak hour surge between 7-9 AM and 5-7 PM
    const now = new Date();
    const hour = now.getHours();
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    
    let fare = this.baseFare + (distanceKm * fareMultiplier);
    
    if (isPeakHour) {
      fare *= this.surgeMultiplier;
    }
    
    // Round to 2 decimal places and ensure minimum fare
    fare = Math.max(this.baseFare, Math.round(fare * 100) / 100);
    
    return fare;
  }
}

export const fallbackLocationService = new FallbackLocationService();