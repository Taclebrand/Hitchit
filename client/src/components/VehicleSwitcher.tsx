import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Car, Check, ChevronDown, ChevronUp } from "lucide-react";

interface Vehicle {
  id: number;
  type: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
}

interface User {
  id: number;
  activeVehicleId: number | null;
  fullName: string;
}

interface VehicleSwitcherProps {
  compact?: boolean;
  showActiveOnly?: boolean;
}

export default function VehicleSwitcher({ compact = false, showActiveOnly = false }: VehicleSwitcherProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles/user/1'],
    queryFn: () => apiRequest('GET', '/api/vehicles/user/1').then(res => res.json())
  });

  // Fetch current user to get active vehicle
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('GET', '/api/auth/me').then(res => res.json()),
    enabled: false // We'll mock this for now since auth endpoint needs work
  });

  // Track active vehicle state
  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);

  // Switch vehicle mutation
  const switchVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      // In a real app, this would update the user's active vehicle
      const response = await apiRequest('PUT', `/api/users/vehicle/${vehicleId}`);
      if (!response.ok) throw new Error('Failed to switch vehicle');
      return response.json();
    },
    onSuccess: (data, vehicleId) => {
      setActiveVehicleId(vehicleId);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Vehicle Switched",
        description: "Your active vehicle has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch vehicle",
        variant: "destructive"
      });
    }
  });

  // Initialize active vehicle from first available vehicle
  React.useEffect(() => {
    if (vehicles.length > 0 && activeVehicleId === null) {
      setActiveVehicleId(vehicles[0].id);
    }
  }, [vehicles, activeVehicleId]);

  // Set active vehicle mutation
  const setActiveVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) => 
      apiRequest('PUT', `/api/users/active-vehicle/${vehicleId}`).then(res => res.json()),
    onSuccess: (data) => {
      setActiveVehicleId(data.activeVehicleId);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Vehicle Switched",
        description: "Active vehicle updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch vehicle",
        variant: "destructive"
      });
    }
  });

  const activeVehicle = vehicles.find((v: Vehicle) => v.id === activeVehicleId);
  const inactiveVehicles = vehicles.filter((v: Vehicle) => v.id !== activeVehicleId);

  const handleVehicleSwitch = (vehicleId: number) => {
    setActiveVehicleMutation.mutate(vehicleId);
  };

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const getVehicleSubtitle = (vehicle: Vehicle) => {
    return `${vehicle.color} • ${vehicle.licensePlate} • ${vehicle.seats} seats`;
  };

  if (vehicles.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <Car className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No vehicles registered</p>
        </CardContent>
      </Card>
    );
  }

  if (showActiveOnly && activeVehicle) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Car className="h-6 w-6 text-blue-500" />
            <div className="flex-1">
              <h3 className="font-medium">{getVehicleDisplayName(activeVehicle)}</h3>
              <p className="text-sm text-gray-500">{getVehicleSubtitle(activeVehicle)}</p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Vehicle Profiles</CardTitle>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active Vehicle */}
        {activeVehicle && (
          <div className="p-3 border-2 border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900">
                  {getVehicleDisplayName(activeVehicle)}
                </h3>
                <p className="text-sm text-green-700">
                  {getVehicleSubtitle(activeVehicle)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Other Vehicles */}
        {isExpanded && inactiveVehicles.map((vehicle: Vehicle) => (
          <div key={vehicle.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-gray-400" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {getVehicleDisplayName(vehicle)}
                </h3>
                <p className="text-sm text-gray-500">
                  {getVehicleSubtitle(vehicle)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVehicleSwitch(vehicle.id)}
                disabled={setActiveVehicleMutation.isPending}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                {setActiveVehicleMutation.isPending ? "Switching..." : "Switch"}
              </Button>
            </div>
          </div>
        ))}

        {/* Summary */}
        {vehicles.length > 1 && (
          <div className="pt-2 border-t text-center">
            <p className="text-sm text-gray-500">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Vehicle Selector Component (for navigation/header)
export function QuickVehicleSelector() {
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles/user/1'],
    queryFn: () => apiRequest('GET', '/api/vehicles/user/1').then(res => res.json())
  });

  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(
    vehicles.length > 0 ? vehicles[0]?.id : null
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setActiveVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) => 
      apiRequest('PUT', `/api/users/active-vehicle/${vehicleId}`).then(res => res.json()),
    onSuccess: (data) => {
      setActiveVehicleId(data.activeVehicleId);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Vehicle Switched",
        description: "Active vehicle updated"
      });
    }
  });

  const activeVehicle = vehicles.find((v: Vehicle) => v.id === activeVehicleId);

  if (!activeVehicle || vehicles.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-white border rounded-lg shadow-sm">
      <Car className="h-4 w-4 text-blue-500" />
      <select 
        value={activeVehicleId || ''}
        onChange={(e) => setActiveVehicleMutation.mutate(parseInt(e.target.value))}
        className="text-sm border-none bg-transparent focus:outline-none"
        disabled={setActiveVehicleMutation.isPending}
      >
        {vehicles.map((vehicle: Vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </option>
        ))}
      </select>
    </div>
  );
}