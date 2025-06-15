import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Car, ChevronDown } from "lucide-react";

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

interface QuickVehicleSwitchProps {
  onVehicleSwitch?: (vehicle: Vehicle) => void;
  className?: string;
}

export default function QuickVehicleSwitch({ onVehicleSwitch, className = "" }: QuickVehicleSwitchProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles/user/1'],
    queryFn: () => apiRequest('GET', '/api/vehicles/user/1').then(res => res.json())
  });

  // Set active vehicle on first load
  React.useEffect(() => {
    if (vehicles.length > 0 && !activeVehicleId) {
      setActiveVehicleId(vehicles[0].id);
    }
  }, [vehicles, activeVehicleId]);

  // Set active vehicle mutation
  const setActiveVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) => 
      apiRequest('PUT', `/api/users/active-vehicle/${vehicleId}`).then(res => res.json()),
    onSuccess: (data, vehicleId) => {
      setActiveVehicleId(vehicleId);
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && onVehicleSwitch) {
        onVehicleSwitch(vehicle);
      }
      setIsOpen(false);
      toast({
        title: "Vehicle Switched",
        description: `Now using ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`,
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

  if (vehicles.length <= 1) {
    return null; // Don't show if only one or no vehicles
  }

  const handleVehicleSelect = (vehicleId: number) => {
    if (vehicleId !== activeVehicleId) {
      setActiveVehicleMutation.mutate(vehicleId);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Quick Switch Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-48"
        disabled={setActiveVehicleMutation.isPending}
      >
        <Car className="h-4 w-4 text-blue-500" />
        {activeVehicle ? (
          <span className="truncate">
            {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
          </span>
        ) : (
          <span>Select Vehicle</span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full left-0 mt-1 z-50 min-w-64 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {vehicles.map((vehicle: Vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => handleVehicleSelect(vehicle.id)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      vehicle.id === activeVehicleId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    disabled={setActiveVehicleMutation.isPending}
                  >
                    <div className="flex items-center gap-3">
                      <Car className={`h-5 w-5 ${
                        vehicle.id === activeVehicleId ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {vehicle.color} • {vehicle.licensePlate} • {vehicle.type}
                        </div>
                      </div>
                      {vehicle.id === activeVehicleId && (
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Active
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="border-t mt-2 pt-2">
                <div className="text-xs text-gray-500 text-center">
                  {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} available
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}