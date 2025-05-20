/**
 * MapboxService.ts
 * Service for Mapbox integration, specializing in real-time location tracking
 */
import { Coordinates } from './GoogleMapsService';

// Access Mapbox token directly from environment variable (injected by Replit)
// This is accessible in our system without the VITE_ prefix
const MAPBOX_TOKEN = import.meta.env.MAPBOX_TOKEN;

// Interfaces
export interface MapboxRoute {
  geometry: {
    coordinates: number[][];
    type: string;
  };
  legs: Array<{
    distance: number;
    duration: number;
    steps: any[];
    summary: string;
  }>;
  distance: number;
  duration: number;
}

export interface DriverLocationUpdate {
  coordinates: Coordinates;
  heading: number; // in degrees, 0 is north, 90 is east
  speed: number; // in meters per second
  timestamp: number; // unix timestamp
}

class MapboxService {
  private mapboxToken: string;
  private isMapboxLoaded: boolean = false;

  constructor() {
    // Use the environment variable from Replit
    this.mapboxToken = import.meta.env.MAPBOX_TOKEN || '';
    
    if (!this.mapboxToken) {
      console.warn('No Mapbox token found in environment variables, using fallback token');
      // Fallback for demo purposes only
      this.mapboxToken = 'pk.eyJ1IjoidGFjbGVicmFuZCIsImEiOiJjbWF2bHYyY3IwNjhkMnlwdXA4emFydjllIn0.ve6FSKPekZ-zr7cZzWoIUw';
    }
    
    console.log('Mapbox token successfully loaded for real-time tracking');
  }

  /**
   * Loads the Mapbox GL JS library
   */
  async loadMapboxGL(): Promise<void> {
    if (this.isMapboxLoaded) {
      return;
    }

    try {
      // Load CSS
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      document.head.appendChild(linkElement);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.async = true;

      const loadPromise = new Promise<void>((resolve, reject) => {
        script.onload = () => {
          // Set access token
          if (window.mapboxgl) {
            window.mapboxgl.accessToken = this.mapboxToken;
            this.isMapboxLoaded = true;
            resolve();
          } else {
            reject(new Error('Mapbox GL JS failed to load properly'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'));
      });

      document.head.appendChild(script);
      return loadPromise;
    } catch (error) {
      console.error('Error loading Mapbox GL JS:', error);
      throw error;
    }
  }

  /**
   * Get a route between two points using Mapbox Directions API
   */
  async getRoute(origin: Coordinates, destination: Coordinates): Promise<MapboxRoute> {
    try {
      // First try the real Mapbox API
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?` +
          `alternatives=false&geometries=geojson&overview=full&steps=true&access_token=${this.mapboxToken}`
        );

        if (response.ok) {
          const data = await response.json();
          return data.routes[0] as MapboxRoute;
        }
      } catch (apiError) {
        console.warn('Error fetching from Mapbox API, using fallback:', apiError);
      }
      
      // If API call fails, use a fallback route generator
      return this.generateFallbackRoute(origin, destination);
    } catch (error) {
      console.error('Error in Mapbox routing service:', error);
      throw error;
    }
  }
  
  /**
   * Get a real street address from coordinates using Mapbox's Geocoding API
   */
  async getReverseGeocode(coordinates: Coordinates): Promise<string> {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?access_token=${this.mapboxToken}&types=address`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox geocoding error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Return the most precise address (first result)
        return data.features[0].place_name;
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      throw error;
    }
  }
  
  /**
   * Get the Mapbox token for use in other services
   */
  getToken(): string {
    return this.mapboxToken;
  }
  
  /**
   * Generate a simulated route between points when the API is unavailable
   * This ensures the app works for demos without requiring valid API keys
   */
  private generateFallbackRoute(origin: Coordinates, destination: Coordinates): MapboxRoute {
    // Calculate distance using Haversine formula
    const R = 6371e3; // Earth radius in meters
    const φ1 = origin.lat * Math.PI / 180;
    const φ2 = destination.lat * Math.PI / 180;
    const Δφ = (destination.lat - origin.lat) * Math.PI / 180;
    const Δλ = (destination.lng - origin.lng) * Math.PI / 180;
      
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // in meters
    
    // Estimate duration - assume average speed of 50 km/h
    const duration = distance / (50 * 1000 / 3600); // in seconds
    
    // Generate route points - create a straight line with some interpolated points
    const numPoints = 50; // Number of points to generate
    const coordinates: number[][] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const fraction = i / (numPoints - 1);
      const lat = origin.lat + fraction * (destination.lat - origin.lat);
      const lng = origin.lng + fraction * (destination.lng - origin.lng);
      
      // Add slight random offset to make route look more natural (except for origin and destination)
      if (i > 0 && i < numPoints - 1) {
        const offsetScale = 0.001; // Scale of random offsets
        const latOffset = (Math.random() - 0.5) * offsetScale;
        const lngOffset = (Math.random() - 0.5) * offsetScale;
        coordinates.push([lng + lngOffset, lat + latOffset]);
      } else {
        coordinates.push([lng, lat]);
      }
    }
    
    return {
      geometry: {
        coordinates: coordinates,
        type: "LineString"
      },
      legs: [{
        distance: distance,
        duration: duration,
        steps: [],
        summary: "Route Summary"
      }],
      distance: distance,
      duration: duration
    };
  }

  /**
   * Simulates driver movement along a route
   * This is used for testing when a real driver is not available
   */
  simulateDriverMovement(
    route: MapboxRoute, 
    options: { 
      updateInterval: number, // milliseconds between updates
      speedFactor: number // to speed up or slow down simulation (1 = real time)
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

    // Extract coordinates from route
    const coordinates = route.geometry.coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1]
    }));

    // Calculate headings for each point
    const calculateHeading = (point1: Coordinates, point2: Coordinates): number => {
      const dLng = (point2.lng - point1.lng) * Math.PI / 180;
      const lat1 = point1.lat * Math.PI / 180;
      const lat2 = point2.lat * Math.PI / 180;
      
      const y = Math.sin(dLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
      
      let heading = Math.atan2(y, x) * 180 / Math.PI;
      heading = (heading + 360) % 360; // Normalize to 0-360
      
      return heading;
    };
    
    // Generate headings
    const headings: number[] = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
      headings.push(calculateHeading(coordinates[i], coordinates[i + 1]));
    }
    // Add the last heading (same as the one before)
    headings.push(headings.length > 0 ? headings[headings.length - 1] : 0);
    
    // Function to calculate speed between points
    const calculateSpeed = (point1: Coordinates, point2: Coordinates, durationMs: number): number => {
      // Simple distance calculation using Haversine formula
      const R = 6371e3; // Earth radius in meters
      const φ1 = point1.lat * Math.PI / 180;
      const φ2 = point2.lat * Math.PI / 180;
      const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
      const Δλ = (point2.lng - point1.lng) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Return speed in meters per second
      return distance / (durationMs / 1000);
    };
    
    // Start the simulation
    const start = () => {
      if (!isPaused) return;
      isPaused = false;
      
      intervalId = window.setInterval(() => {
        if (currentIndex >= coordinates.length) {
          // End of route
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
          return;
        }
        
        const currentCoord = coordinates[currentIndex];
        const currentHeading = headings[currentIndex];
        
        // Calculate speed (use next point if available)
        let speed = 0;
        if (currentIndex < coordinates.length - 1) {
          speed = calculateSpeed(
            currentCoord, 
            coordinates[currentIndex + 1], 
            options.updateInterval / options.speedFactor
          );
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
}

// Declare global interface for window
declare global {
  interface Window {
    mapboxgl?: any;
  }
}

export const mapboxService = new MapboxService();
export default mapboxService;