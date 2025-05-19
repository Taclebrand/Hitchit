/**
 * FallbackLocationService.ts
 * This service provides offline/demo location functionality for the ride-sharing app
 * when external location APIs are unavailable
 */
import { Coordinates } from './GoogleMapsService';

// Predefined locations for demo purposes
export const DEMO_LOCATIONS = [
  {
    name: "Downtown",
    address: "123 Main Street, Downtown, Los Angeles, CA",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    placeId: "demo-place-id-1"
  },
  {
    name: "Airport",
    address: "LAX International Airport, Los Angeles, CA",
    coordinates: { lat: 33.9416, lng: -118.4085 },
    placeId: "demo-place-id-2"
  },
  {
    name: "University",
    address: "University of California, Los Angeles, CA",
    coordinates: { lat: 34.0689, lng: -118.4452 },
    placeId: "demo-place-id-3"
  },
  {
    name: "Beach",
    address: "Santa Monica Beach, Santa Monica, CA",
    coordinates: { lat: 34.0190, lng: -118.4914 },
    placeId: "demo-place-id-4"
  },
  {
    name: "Shopping Mall",
    address: "Beverly Center, Beverly Hills, CA",
    coordinates: { lat: 34.0746, lng: -118.3768 },
    placeId: "demo-place-id-5"
  }
];

// Route simulation data
const DEMO_ROUTES = {
  // from downtown to airport
  "demo-place-id-1_demo-place-id-2": {
    distance: { text: "18.5 miles", value: 29773 },
    duration: { text: "35 mins", value: 2100 },
    fare: 32.50,
    path: [
      [34.0522, -118.2437],
      [34.0320, -118.2836],
      [34.0166, -118.3226],
      [33.9950, -118.3565],
      [33.9756, -118.3805],
      [33.9416, -118.4085]
    ]
  },
  // from downtown to university
  "demo-place-id-1_demo-place-id-3": {
    distance: { text: "12.1 miles", value: 19473 },
    duration: { text: "28 mins", value: 1680 },
    fare: 22.75,
    path: [
      [34.0522, -118.2437],
      [34.0580, -118.2836],
      [34.0622, -118.3226],
      [34.0658, -118.3805],
      [34.0689, -118.4452]
    ]
  },
  // default route template
  "default": {
    distance: { text: "10.0 miles", value: 16093 },
    duration: { text: "25 mins", value: 1500 },
    fare: 18.50,
    path: [] // will be generated dynamically for default routes
  }
};

export interface RouteInfo {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  fare: number;
  path: number[][];
}

export interface DriverLocationUpdate {
  coordinates: Coordinates;
  heading: number;
  speed: number;
  timestamp: number;
}

class FallbackLocationService {
  /**
   * Get a location by search term
   */
  async searchLocation(query: string): Promise<any[]> {
    console.log("Using fallback location search for:", query);
    
    // Filter demo locations based on the query
    const results = DEMO_LOCATIONS.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase()) || 
      location.address.toLowerCase().includes(query.toLowerCase())
    );
    
    return results.map(loc => ({
      placeId: loc.placeId,
      description: loc.address,
      name: loc.name,
      coordinates: loc.coordinates
    }));
  }
  
  /**
   * Get address details from place ID
   */
  async getAddressDetails(placeId: string): Promise<{
    address: string;
    coordinates: Coordinates;
    placeId: string;
  }> {
    console.log("Using fallback address details for place ID:", placeId);
    
    const location = DEMO_LOCATIONS.find(loc => loc.placeId === placeId);
    
    if (!location) {
      throw new Error("Location not found");
    }
    
    return {
      address: location.address,
      coordinates: location.coordinates,
      placeId: location.placeId
    };
  }
  
  /**
   * Get address from coordinates using reverse geocoding
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<{
    formattedAddress: string;
    placeId: string;
  }> {
    console.log("Using fallback reverse geocoding for:", lat, lng);
    
    // Find the closest demo location based on coordinates
    let closestLocation = DEMO_LOCATIONS[0];
    let closestDistance = this.calculateDistance(
      lat, lng, 
      closestLocation.coordinates.lat, 
      closestLocation.coordinates.lng
    );
    
    for (const location of DEMO_LOCATIONS) {
      const distance = this.calculateDistance(
        lat, lng, 
        location.coordinates.lat, 
        location.coordinates.lng
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestLocation = location;
      }
    }
    
    return {
      formattedAddress: closestLocation.address,
      placeId: closestLocation.placeId
    };
  }
  
  /**
   * Get route between two locations
   */
  async getRoute(origin: Coordinates, destination: Coordinates): Promise<RouteInfo> {
    console.log("Using fallback route between:", origin, destination);
    
    // Try to find origin and destination places
    let originPlace = this.findNearestDemoLocation(origin);
    let destPlace = this.findNearestDemoLocation(destination);
    
    // Check if we have a predefined route
    const routeKey = `${originPlace.placeId}_${destPlace.placeId}`;
    let route = DEMO_ROUTES[routeKey as keyof typeof DEMO_ROUTES];
    
    // If no predefined route, use the default and generate a path
    if (!route) {
      route = { ...DEMO_ROUTES.default };
      
      // Calculate a straight line path
      route.path = this.generateStraightLinePath(origin, destination, 5);
      
      // Calculate approximate distance
      const distanceInMeters = this.calculateDistance(
        origin.lat, origin.lng,
        destination.lat, destination.lng
      ) * 1000;
      
      // Update route details
      route.distance.value = distanceInMeters;
      route.distance.text = `${(distanceInMeters / 1609.34).toFixed(1)} miles`;
      
      // Estimate duration (assuming 30 mph average speed)
      const durationSeconds = (distanceInMeters / 1609.34) * (60 * 2); // 2 minutes per mile
      route.duration.value = durationSeconds;
      route.duration.text = `${Math.ceil(durationSeconds / 60)} mins`;
      
      // Calculate fare ($2 base + $1.5 per mile)
      route.fare = 2 + (distanceInMeters / 1609.34) * 1.5;
    }
    
    return route;
  }
  
  /**
   * Calculate fare estimate based on distance and ride type
   */
  calculateFareEstimate(distanceInMeters: number, rideType: string): number {
    const miles = distanceInMeters / 1609.34;
    
    // Base fare + per mile rate based on ride type
    const rates = {
      economy: { base: 2.0, perMile: 1.5 },
      comfort: { base: 3.5, perMile: 2.0 },
      premium: { base: 5.0, perMile: 2.5 }
    };
    
    const rate = rates[rideType as keyof typeof rates] || rates.economy;
    return rate.base + (miles * rate.perMile);
  }
  
  /**
   * Simulate driver movement along a route
   */
  simulateDriverMovement(
    route: RouteInfo,
    options: { 
      updateInterval: number,
      speedFactor: number
    } = { updateInterval: 1000, speedFactor: 5 }
  ): { 
    subscribe: (callback: (update: DriverLocationUpdate) => void) => () => void;
    start: () => void;
    pause: () => void;
    reset: () => void;
  } {
    let currentIndex = 0;
    let intervalId: number | null = null;
    let subscribers: ((update: DriverLocationUpdate) => void)[] = [];
    let isPaused = true;
    
    // Extract path coordinates
    const path = route.path.map(coord => ({
      lat: coord[0],
      lng: coord[1]
    }));
    
    // Calculate headings between points
    const headings: number[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      headings.push(this.calculateHeading(path[i], path[i + 1]));
    }
    // Add the last heading (same as the one before)
    headings.push(headings.length > 0 ? headings[headings.length - 1] : 0);
    
    // Start the simulation
    const start = () => {
      if (!isPaused) return;
      isPaused = false;
      
      intervalId = window.setInterval(() => {
        if (currentIndex >= path.length) {
          // End of route
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
          return;
        }
        
        const currentCoord = path[currentIndex];
        const currentHeading = headings[currentIndex];
        
        // Calculate speed (use next point if available)
        let speed = 10; // Default speed in m/s
        if (currentIndex < path.length - 1) {
          const nextCoord = path[currentIndex + 1];
          const distance = this.calculateDistance(
            currentCoord.lat, currentCoord.lng,
            nextCoord.lat, nextCoord.lng
          ) * 1000; // Convert to meters
          
          speed = distance / (options.updateInterval / 1000);
        }
        
        // Notify subscribers
        const update: DriverLocationUpdate = {
          coordinates: currentCoord,
          heading: currentHeading,
          speed: speed,
          timestamp: Date.now()
        };
        
        subscribers.forEach(callback => callback(update));
        currentIndex++;
      }, options.updateInterval);
    };
    
    // Pause the simulation
    const pause = () => {
      if (isPaused) return;
      isPaused = true;
      
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };
    
    // Reset the simulation
    const reset = () => {
      pause();
      currentIndex = 0;
    };
    
    // Subscribe to updates
    const subscribe = (callback: (update: DriverLocationUpdate) => void) => {
      subscribers.push(callback);
      
      // Return unsubscribe function
      return () => {
        subscribers = subscribers.filter(cb => cb !== callback);
      };
    };
    
    return {
      subscribe,
      start,
      pause,
      reset
    };
  }
  
  // Helper methods
  
  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  /**
   * Calculate heading between two points
   */
  private calculateHeading(point1: Coordinates, point2: Coordinates): number {
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let heading = Math.atan2(y, x) * 180 / Math.PI;
    heading = (heading + 360) % 360; // Normalize to 0-360
    
    return heading;
  }
  
  /**
   * Find the nearest demo location to the given coordinates
   */
  private findNearestDemoLocation(coordinates: Coordinates): {
    placeId: string;
    address: string;
    coordinates: Coordinates;
  } {
    let nearestLocation = DEMO_LOCATIONS[0];
    let shortestDistance = this.calculateDistance(
      coordinates.lat, coordinates.lng,
      nearestLocation.coordinates.lat, nearestLocation.coordinates.lng
    );
    
    for (const location of DEMO_LOCATIONS) {
      const distance = this.calculateDistance(
        coordinates.lat, coordinates.lng,
        location.coordinates.lat, location.coordinates.lng
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestLocation = location;
      }
    }
    
    return {
      placeId: nearestLocation.placeId,
      address: nearestLocation.address,
      coordinates: nearestLocation.coordinates
    };
  }
  
  /**
   * Generate a path between two points
   */
  private generateStraightLinePath(start: Coordinates, end: Coordinates, numPoints: number): number[][] {
    const path: number[][] = [[start.lat, start.lng]];
    
    for (let i = 1; i < numPoints - 1; i++) {
      const fraction = i / (numPoints - 1);
      const lat = start.lat + fraction * (end.lat - start.lat);
      const lng = start.lng + fraction * (end.lng - start.lng);
      path.push([lat, lng]);
    }
    
    path.push([end.lat, end.lng]);
    return path;
  }
}

export const fallbackLocationService = new FallbackLocationService();
export default fallbackLocationService;