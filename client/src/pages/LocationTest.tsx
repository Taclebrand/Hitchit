import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SmartLocationAutocomplete from "@/components/SmartLocationAutocomplete";

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

export default function LocationTest() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Smart Location Autocomplete Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Smart Autocomplete:</label>
              <SmartLocationAutocomplete
                placeholder="Search for locations..."
                onLocationSelect={handleLocationSelect}
                showFavoriteButton={true}
              />
            </div>
            
            {selectedLocation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Selected Location:</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto">
                  {JSON.stringify(selectedLocation, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}