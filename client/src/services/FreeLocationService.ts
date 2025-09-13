// Free Location Service - Alternative to Google Maps for basic location functionality
// Uses multiple free APIs and browser geolocation for mobile location services

export interface LocationSuggestion {
  address: string;
  coordinates: { lat: number; lng: number };
  placeId?: string;
  type?: 'current_location' | 'browser_geolocation' | 'nominatim' | 'manual';
}

class FreeLocationService {
  private cache = new Map<string, LocationSuggestion[]>();
  private currentLocationCache: LocationSuggestion | null = null;

  // Get current location using browser geolocation
  public async getCurrentLocation(): Promise<LocationSuggestion> {
    if (this.currentLocationCache) {
      return this.currentLocationCache;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          try {
            // Try to get address from coordinates using reverse geocoding
            const address = await this.getAddressFromCoordinates(coords.lat, coords.lng);
            const location: LocationSuggestion = {
              address: address,
              coordinates: coords,
              type: 'current_location'
            };
            
            this.currentLocationCache = location;
            resolve(location);
          } catch (error) {
            // Fallback to coordinates only
            const location: LocationSuggestion = {
              address: `Current Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
              coordinates: coords,
              type: 'current_location'
            };
            this.currentLocationCache = location;
            resolve(location);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(new Error(`Geolocation failed: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Get location suggestions using free Nominatim API (OpenStreetMap)
  public async getLocationSuggestions(input: string): Promise<LocationSuggestion[]> {
    if (!input || input.length < 3) {
      return [];
    }

    // Check cache first
    if (this.cache.has(input)) {
      return this.cache.get(input)!;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(input)}&countrycodes=us`,
        {
          headers: {
            'User-Agent': 'HitchIt Mobile App'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestions: LocationSuggestion[] = data.map((item: any) => ({
        address: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        placeId: item.osm_id?.toString(),
        type: 'nominatim'
      }));

      // Cache the results
      this.cache.set(input, suggestions);

      // Clean cache if it gets too large
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return suggestions;
    } catch (error) {
      console.error('Nominatim API error:', error);
      
      // Fallback: return manual entry suggestion
      return [{
        address: input,
        coordinates: { lat: 0, lng: 0 }, // Will need manual coordinate entry
        type: 'manual'
      }];
    }
  }

  // Reverse geocoding: get address from coordinates
  public async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HitchIt Mobile App'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  // Get popular/common locations for quick selection
  public getPopularLocations(): LocationSuggestion[] {
    return [
      {
        address: 'Current Location',
        coordinates: { lat: 0, lng: 0 }, // Will be replaced with actual coordinates
        type: 'current_location'
      },
      {
        address: 'Downtown',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        type: 'manual'
      },
      {
        address: 'Airport',
        coordinates: { lat: 37.6213, lng: -122.3790 },
        type: 'manual'
      },
      {
        address: 'Train Station',
        coordinates: { lat: 37.7899, lng: -122.4051 },
        type: 'manual'
      },
      {
        address: 'Shopping Center',
        coordinates: { lat: 37.7849, lng: -122.4094 },
        type: 'manual'
      }
    ];
  }

  // Clear cache
  public clearCache(): void {
    this.cache.clear();
    this.currentLocationCache = null;
  }

  // Get distance between two coordinates (Haversine formula)
  public calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const freeLocationService = new FreeLocationService();