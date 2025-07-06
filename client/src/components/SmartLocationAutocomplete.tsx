import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Heart, Home, Building, ShoppingBag, Star, Search } from "lucide-react";

interface LocationData {
  address: string;
  coordinates?: { lat: number; lng: number };
  detailedAddress?: {
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
  };
}

interface RecentLocation {
  id: number;
  address: string;
  streetAddress?: string;
  city: string;
  state: string;
  zipCode?: string;
  lat: number;
  lng: number;
  usageCount: number;
  lastUsed: string;
}

interface FavoriteLocation {
  id: number;
  name: string;
  address: string;
  streetAddress?: string;
  city: string;
  state: string;
  zipCode?: string;
  lat: number;
  lng: number;
  icon: string;
}

interface SmartLocationAutocompleteProps {
  placeholder?: string;
  onLocationSelect: (location: LocationData) => void;
  initialValue?: string;
  showFavoriteButton?: boolean;
  className?: string;
}

export default function SmartLocationAutocomplete({
  placeholder = "Enter location...",
  onLocationSelect,
  initialValue = "",
  showFavoriteButton = true,
  className = ""
}: SmartLocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddFavorite, setShowAddFavorite] = useState(false);
  const [favoriteNameInput, setFavoriteNameInput] = useState("");
  const [lastSelectedLocation, setLastSelectedLocation] = useState<LocationData | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get recent locations
  const { data: recentLocations = [] } = useQuery({
    queryKey: ['/api/locations/recent'],
    queryFn: () => apiRequest('GET', '/api/locations/recent').then(res => res.json()),
    enabled: isOpen
  });

  // Get favorite locations
  const { data: favoriteLocations = [] } = useQuery({
    queryKey: ['/api/locations/favorites'],
    queryFn: () => apiRequest('GET', '/api/locations/favorites').then(res => res.json()),
    enabled: isOpen
  });

  // Search locations
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/locations/search', inputValue],
    queryFn: () => apiRequest('GET', `/api/locations/search?q=${encodeURIComponent(inputValue)}`).then(res => res.json()),
    enabled: inputValue.length >= 2,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Add to recent locations
  const addRecentMutation = useMutation({
    mutationFn: (locationData: any) => apiRequest('POST', '/api/locations/recent', locationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/recent'] });
    }
  });

  // Add to favorites
  const addFavoriteMutation = useMutation({
    mutationFn: (locationData: any) => apiRequest('POST', '/api/locations/favorites', locationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations/favorites'] });
      setShowAddFavorite(false);
      setFavoriteNameInput("");
      toast({
        title: "Favorite Added",
        description: "Location saved to your favorites",
      });
    }
  });

  // Handle location selection
  const handleLocationSelect = (location: RecentLocation | FavoriteLocation | any) => {
    const locationData: LocationData = {
      address: location.address,
      coordinates: { lat: Number(location.lat), lng: Number(location.lng) },
      detailedAddress: {
        street: location.streetAddress,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode
      }
    };

    setInputValue(location.address);
    setLastSelectedLocation(locationData);
    onLocationSelect(locationData);
    setIsOpen(false);

    // Add to recent locations if it's not already a recent location
    if (!('usageCount' in location)) {
      addRecentMutation.mutate({
        address: location.address,
        streetAddress: location.streetAddress,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        lat: Number(location.lat),
        lng: Number(location.lng)
      });
    }
  };

  // Handle adding to favorites
  const handleAddToFavorites = () => {
    if (!lastSelectedLocation || !favoriteNameInput.trim()) return;

    const favoriteData = {
      name: favoriteNameInput.trim(),
      address: lastSelectedLocation.address,
      streetAddress: lastSelectedLocation.detailedAddress?.street,
      city: lastSelectedLocation.detailedAddress?.city || "",
      state: lastSelectedLocation.detailedAddress?.state || "",
      zipCode: lastSelectedLocation.detailedAddress?.zipCode,
      lat: lastSelectedLocation.coordinates?.lat || 0,
      lng: lastSelectedLocation.coordinates?.lng || 0,
      icon: getLocationIcon(favoriteNameInput.toLowerCase())
    };

    addFavoriteMutation.mutate(favoriteData);
  };

  // Get appropriate icon for location
  const getLocationIcon = (name: string): string => {
    if (name.includes('home') || name.includes('house')) return 'home';
    if (name.includes('work') || name.includes('office') || name.includes('job')) return 'office';
    if (name.includes('gym') || name.includes('fitness')) return 'gym';
    if (name.includes('store') || name.includes('shop') || name.includes('market')) return 'store';
    if (name.includes('school') || name.includes('university') || name.includes('college')) return 'school';
    return 'pin';
  };

  // Render location icon
  const renderLocationIcon = (icon: string, className: string = "h-4 w-4") => {
    switch (icon) {
      case 'home': return <Home className={className} />;
      case 'office': return <Building className={className} />;
      case 'store': return <ShoppingBag className={className} />;
      default: return <MapPin className={className} />;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddFavorite(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasSearchResults = searchResults && (searchResults.recent?.length > 0 || searchResults.favorites?.length > 0);
  const showRecentAndFavorites = !inputValue.trim() || inputValue.length < 2;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-hidden" ref={dropdownRef}>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              
              {/* Search Results */}
              {inputValue.length >= 2 && hasSearchResults && (
                <div className="border-b">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    Search Results
                  </div>
                  
                  {searchResults.favorites?.map((location: FavoriteLocation) => (
                    <div
                      key={`fav-${location.id}`}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex-shrink-0">
                        {renderLocationIcon(location.icon, "h-4 w-4 text-red-500")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{location.name}</span>
                          <Heart className="h-3 w-3 text-red-500 fill-current" />
                        </div>
                        <div className="text-xs text-gray-500 truncate">{location.address}</div>
                      </div>
                    </div>
                  ))}
                  
                  {searchResults.recent?.map((location: RecentLocation) => (
                    <div
                      key={`recent-${location.id}`}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{location.address}</div>
                        <div className="text-xs text-gray-500">Used {location.usageCount} times</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Locations */}
              {showRecentAndFavorites && recentLocations.length > 0 && (
                <div className="border-b">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    Recent Locations
                  </div>
                  {recentLocations.slice(0, 5).map((location: RecentLocation) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{location.address}</div>
                        <div className="text-xs text-gray-500">{location.city}, {location.state}</div>
                      </div>
                      <div className="text-xs text-gray-400">{location.usageCount}x</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Favorite Locations */}
              {showRecentAndFavorites && favoriteLocations.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    Favorite Locations
                  </div>
                  {favoriteLocations.map((location: FavoriteLocation) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex-shrink-0">
                        {renderLocationIcon(location.icon, "h-4 w-4 text-blue-500")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{location.name}</div>
                        <div className="text-xs text-gray-500 truncate">{location.address}</div>
                      </div>
                      <Heart className="h-4 w-4 text-red-500 fill-current flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Loading state */}
              {isSearching && inputValue.length >= 2 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Searching locations...
                </div>
              )}

              {/* No results */}
              {inputValue.length >= 2 && !isSearching && !hasSearchResults && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No locations found. Try a different search term.
                </div>
              )}

              {/* Empty state */}
              {showRecentAndFavorites && recentLocations.length === 0 && favoriteLocations.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Start typing to search for locations
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add to Favorites Modal */}
      {showAddFavorite && lastSelectedLocation && showFavoriteButton && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-sm font-medium">Save to Favorites</div>
              <Input
                value={favoriteNameInput}
                onChange={(e) => setFavoriteNameInput(e.target.value)}
                placeholder="Enter a name (e.g., Home, Work, Gym)"
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddToFavorites}
                  disabled={!favoriteNameInput.trim() || addFavoriteMutation.isPending}
                  className="flex-1"
                >
                  {addFavoriteMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddFavorite(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add to Favorites Button */}
      {lastSelectedLocation && showFavoriteButton && !showAddFavorite && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddFavorite(true)}
          className="absolute top-full right-0 mt-1 z-40"
        >
          <Heart className="h-3 w-3 mr-1" />
          Save
        </Button>
      )}
    </div>
  );
}